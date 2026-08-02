/**
 * Browser-level test: NewsTicker auto-refresh after donation approval
 *
 * Asserts that:
 *   1. The homepage loads and the ticker renders initial items.
 *   2. After a donation is submitted and approved via the API, advancing the
 *      page clock by 5 minutes (REFRESH_MS) causes the ticker to include the
 *      newly approved donation — without any page reload.
 *   3. Existing ticker items are not wiped out when new ones arrive (i.e. the
 *      merged list is a superset of the previous items, up to the 8-item cap).
 *
 * Uses Playwright's fake clock (page.clock) to control setInterval timing.
 * The real network is untouched — the ticker fetch hits the live API server.
 *
 * Environment variables:
 *   TEST_API_URL    — base URL of the API server   (default: http://localhost:8080)
 *   FRONTEND_URL    — base URL of the web frontend (default: http://localhost:25427)
 *   TEST_ADMIN_USER — admin username               (default: admin)
 *   INITIAL_ADMIN_PASSWORD — admin password        (default: admin123)
 *   CHROMIUM_PATH / PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
 *                   — override Chromium binary path (auto-discovered when unset)
 */

import { chromium } from "playwright";
import { execSync }  from "child_process";

const API_BASE = (process.env.TEST_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const FRONTEND = (process.env.FRONTEND_URL ?? "http://localhost:25427").replace(/\/$/, "");
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.INITIAL_ADMIN_PASSWORD ?? "admin123";

const REFRESH_MS = 5 * 60 * 1000; // must match NewsTicker.tsx REFRESH_MS

// ──────────────────────────────────────────────────────────────────────────────
// Chromium discovery
// Prefer explicit env overrides, then try `which chromium-browser` (NixOS), then
// fall back to the Playwright-bundled binary (executablePath left undefined).
// ──────────────────────────────────────────────────────────────────────────────

function resolveChromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  if (process.env.CHROMIUM_PATH) {
    return process.env.CHROMIUM_PATH;
  }
  try {
    const found = execSync("which chromium-browser 2>/dev/null || which chromium 2>/dev/null", {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    if (found) return found;
  } catch {
    // not found on PATH — fall through to Playwright bundled binary
  }
  return undefined; // let Playwright use its bundled binary
}

// ──────────────────────────────────────────────────────────────────────────────
// Tiny assertion helpers
// ──────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// API helpers (Node.js fetch — no browser involved)
// ──────────────────────────────────────────────────────────────────────────────

async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No session cookie after login");
  return setCookie.split(";")[0].trim();
}

async function submitDonation({ donorName, mobile, amount, transactionId }) {
  const res = await fetch(`${API_BASE}/api/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ donorName, mobile, amount, transactionId }),
  });
  if (!res.ok) throw new Error(`POST /api/donations failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function approveDonation(id, sessionCookie) {
  const res = await fetch(`${API_BASE}/api/donations/${id}/approve`, {
    method: "PATCH",
    headers: { Cookie: sessionCookie },
  });
  if (!res.ok) throw new Error(`PATCH /approve failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Main test
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("NewsTicker auto-refresh (browser-level)\n");
  console.log(`  Frontend : ${FRONTEND}`);
  console.log(`  API      : ${API_BASE}`);

  const executablePath = resolveChromiumPath();
  console.log(`  Chromium : ${executablePath ?? "(Playwright bundled)"}\n`);

  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // Forward browser console errors to the test runner for easier debugging.
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`  [browser error] ${msg.text()}`);
    });
    page.on("pageerror", (err) => console.log(`  [page error] ${err.message}`));

    // ── Proxy /api/* requests to the real API server ─────────────────────────
    // When Playwright hits the frontend directly on port 25427, the page's
    // relative /api/... fetches land on the Vite dev server (which 404s them).
    // Intercept those requests and forward them to API_BASE instead.
    await page.route("**/api/**", async (route) => {
      const original = route.request().url();
      const apiPath  = original.replace(/^https?:\/\/[^/]+(\/api\/.*)$/, "$1");
      const forwarded = `${API_BASE}${apiPath}`;
      try {
        const response = await route.fetch({ url: forwarded });
        await route.fulfill({ response });
      } catch {
        await route.abort();
      }
    });

    // ── Install fake clock BEFORE navigation ─────────────────────────────────
    // setInterval inside NewsTicker is controlled by fake time; real fetch is
    // unaffected and still hits the live API server.
    // NOTE: use "load" (not "networkidle") — networkidle can stall when timers
    // are frozen because no new requests are generated by the paused intervals.
    await page.clock.install({ time: Date.now() });

    // ── Test 1: Homepage loads and ticker appears ─────────────────────────────
    console.log("Test 1: Homepage loads and ticker renders");
    await page.goto(`${FRONTEND}/`, { waitUntil: "load" });

    const tickerSelector = 'button[aria-label="தகவலுக்கு செல்க"]';
    try {
      await page.waitForSelector(tickerSelector, { timeout: 15_000 });
    } catch {
      // Record the failure then throw so process.exit(1) runs in the finally.
      assert(false, "Ticker button appeared within 15 s — ticker never rendered (is the frontend running and does it have approved donations/news?)");
      throw new Error("Ticker prerequisite failed: ticker did not render within 15 s");
    }
    assert(true, "Ticker button is visible on the homepage");

    // Capture the initial set of ticker texts (all spans, including opacity-0)
    const initialTexts = await page.$$eval(
      `${tickerSelector} span[class*="absolute"]`,
      (spans) => spans.map((s) => s.textContent?.trim() ?? "").filter(Boolean),
    );
    console.log(
      `  Initial ticker items (${initialTexts.length}): ` +
      JSON.stringify(initialTexts.slice(0, 3)) +
      (initialTexts.length > 3 ? " …" : ""),
    );
    assert(initialTexts.length > 0, "Ticker has at least one item before the approval");

    // ── Submit and approve a unique donation via the API ──────────────────────
    console.log("\nTest 2: New approval appears in ticker after 5-minute clock advance");
    const sessionCookie = await login(ADMIN_USER, ADMIN_PASS);

    const uniqueId  = Date.now();
    const donorName = `TickerRefreshTest_${uniqueId}`;
    const txId      = `TICKER_REFRESH_${uniqueId}`;

    const donation = await submitDonation({
      donorName,
      mobile:        "9000099990",
      amount:        108,
      transactionId: txId,
    });
    assert(typeof donation.id === "number", `Donation submitted, id=${donation.id}`);

    await approveDonation(donation.id, sessionCookie);
    assert(true, `Donation id=${donation.id} approved via API`);

    // ── Confirm the donation is NOT yet in the ticker (clock hasn't ticked) ───
    const textsBeforeTick = await page.$$eval(
      `${tickerSelector} span[class*="absolute"]`,
      (spans) => spans.map((s) => s.textContent?.trim() ?? ""),
    );
    assert(
      !textsBeforeTick.some((t) => t.includes(donorName)),
      "New donation is NOT in ticker before the clock advances (no premature fetch)",
    );

    // ── Advance the fake clock by REFRESH_MS + a small buffer ────────────────
    // fastForward fires each scheduled timer at most once per elapsed interval,
    // triggering the setInterval(fetchAll, REFRESH_MS) callback in NewsTicker.
    await page.clock.fastForward(REFRESH_MS + 500);

    // Wait for React to update the DOM with the new donation text.
    // All ticker spans are in the DOM (opacity-0 ones too), so textContent of
    // the container will include items regardless of which is currently active.
    let appeared = false;
    try {
      await page.waitForFunction(
        ({ selector, name }) => {
          const spans = Array.from(document.querySelectorAll(`${selector} span`));
          return spans.some((s) => s.textContent?.includes(name));
        },
        { selector: tickerSelector, name: donorName },
        { timeout: 12_000 },
      );
      appeared = true;
    } catch {
      appeared = false;
    }
    assert(appeared, `Ticker contains "${donorName}" after 5-minute clock tick — no page reload needed`);

    // ── Test 3: Existing items are preserved after the refresh ────────────────
    console.log("\nTest 3: Pre-existing ticker items survive the refresh");
    const textsAfterTick = await page.$$eval(
      `${tickerSelector} span[class*="absolute"]`,
      (spans) => spans.map((s) => s.textContent?.trim() ?? "").filter(Boolean),
    );
    assert(textsAfterTick.length > 0, "Ticker still has items after the refresh (not wiped to empty)");
    assert(
      textsAfterTick.some((t) => t.includes(donorName)),
      "New donation is visible in ticker after refresh",
    );

    // Items present before the tick that still fit within the 8-item cap should
    // still be in the post-refresh list. The new donation is slot 0 (most recent)
    // so at most one old item can have been bumped off the bottom. We verify that
    // at least max(0, initialTexts.length - 1) prior items are retained.
    const retainedCount = initialTexts.filter((t) => textsAfterTick.includes(t)).length;
    const minExpected   = Math.max(0, initialTexts.length - 1);
    console.log(`  Retained ${retainedCount}/${initialTexts.length} pre-existing items (min expected: ${minExpected})`);
    assert(
      retainedCount >= minExpected,
      `At least ${minExpected} pre-existing ticker item(s) survive the refresh (retained ${retainedCount})`,
    );

  } finally {
    await browser.close();

    // Always print the summary — even when an assertion failed before the
    // try block returned normally — so the exit code reflects every failure.
    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exit(1);
    }
  }

  console.log("All ticker auto-refresh tests passed ✓\n");
}

runTests().catch((err) => {
  console.error("\nUnhandled error in test runner:", err);
  process.exit(2);
});
