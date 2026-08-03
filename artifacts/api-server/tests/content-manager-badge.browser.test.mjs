/**
 * Browser-level test: 'Using default' badges clear after saving each section
 *
 * Opens the real ContentManager UI via Playwright, exercises the Save button
 * on every tab (including JSON-backed sections such as Renovation, Pujas,
 * Kumbhabhishekam, and FAQ), and asserts that the "Using default" badge
 * disappears from the saved field after a successful save.
 *
 * Also verifies:
 *   - The JSON-backed save handlers pass current values correctly (not stale
 *     empty strings from un-flushed React state batching)
 *   - Failed saves do not clear badges (network error simulation)
 *   - Saving empty text keeps the badge (field still shows placeholder)
 *
 * NOTE on browser cookie approach:
 *   The API server issues SameSite=None cookies; on HTTP this requires Secure
 *   which Chromium enforces — so form-based login via Playwright doesn't work
 *   on localhost HTTP. Instead we obtain the session cookie via the Node.js
 *   API and inject it into the Playwright browser context directly, then
 *   navigate straight to /admin/content.
 *
 * Environment variables:
 *   TEST_API_URL           — API base URL  (default: http://localhost:8080)
 *   FRONTEND_URL           — web app URL   (default: http://localhost:25427)
 *   INITIAL_ADMIN_USERNAME — admin username (default: admin)
 *   INITIAL_ADMIN_PASSWORD — admin password (required)
 *   CHROMIUM_PATH / PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH — optional Chromium override
 */

import { chromium } from "playwright";
import { execSync }  from "child_process";

const API_BASE  = (process.env.TEST_API_URL  ?? "http://localhost:8080").replace(/\/$/, "");
const FRONTEND  = (process.env.FRONTEND_URL  ?? "http://localhost:25427").replace(/\/$/, "");
const ADMIN_USER = process.env.INITIAL_ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = process.env.INITIAL_ADMIN_PASSWORD;

// ──────────────────────────────────────────────────────────────────────────────
// Chromium discovery (mirrors ticker-auto-refresh.test.mjs)
// ──────────────────────────────────────────────────────────────────────────────

function resolveChromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    const found = execSync("which chromium-browser 2>/dev/null || which chromium 2>/dev/null", {
      encoding: "utf8", timeout: 5000,
    }).trim();
    if (found) return found;
  } catch { /* fall through */ }
  return undefined;
}

// ──────────────────────────────────────────────────────────────────────────────
// Assertion helpers
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
// Node-side API helpers (no browser involved)
// ──────────────────────────────────────────────────────────────────────────────

async function apiLogin() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`API login failed: ${res.status} ${await res.text()}`);

  // The raw Set-Cookie header, e.g. "connect.sid=s%3A...; Path=/; HttpOnly; SameSite=None"
  const raw = res.headers.get("set-cookie");
  if (!raw) throw new Error("No Set-Cookie header after login");

  // Extract name and value for injection into the Playwright context
  const nameValue = raw.split(";")[0].trim();
  const eqIdx     = nameValue.indexOf("=");
  const cookieName  = nameValue.slice(0, eqIdx).trim();
  const cookieValue = nameValue.slice(eqIdx + 1).trim();
  return { cookieName, cookieValue };
}

async function patchSettings(updates, cookie) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `${cookie.cookieName}=${cookie.cookieValue}` },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`PATCH /api/settings failed: ${res.status}`);
  return res.json();
}

async function getSettings() {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error(`GET /api/settings failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Browser helpers
// ──────────────────────────────────────────────────────────────────────────────

// ── Selectors ─────────────────────────────────────────────────────────────────
// The UI renders in Tamil.  "Using default" badge text is hardcoded English;
// everything else uses t('Tamil','English') which returns the Tamil string.
//
// Tab emoji → Tamil label mapping (used to click tabs)
//   🏛️  முகப்பு           (Home)
//   📍  தொடர்பு            (Contact)
//   📖  வரலாறு             (History / About)
//   🔨  திருப்பணி           (Renovation)
//   🙏  சிறப்பு பூஜைகள்    (Pujas)
//   👨‍🏫  குருநாதர்கள்       (Gurus)
//   🪔  கும்பாபிஷேகம்       (Kumbhabhishekam)
//   🙌  வேண்டுகோள்         (Appeal)
//   🏷️  பிராண்டிங்         (Branding)
//   ❓  கேள்வி-பதில்        (FAQ)
//
// Content Manager page heading contains the Tamil string + emoji 🖊️.
// Save button text: சேமி   Success toast: சேமிக்கப்பட்டது ✓   Error toast: பிழை

/**
 * Click a tab by its emoji identifier and wait for the Save button to appear.
 * Using emojis avoids Tamil text encoding fragility.
 */
async function openTab(page, emoji) {
  // Tab buttons live inside the tab-bar div; each button starts with emoji + label
  const tabBtn = page.locator(`button:has-text("${emoji}")`).first();
  await tabBtn.click();
  // The Save (சேமி) button appears in the active tab panel header
  await page.waitForSelector('button:has-text("சேமி")', { timeout: 5_000 });
}

/** Count "Using default" badges currently visible on the page. */
async function countDefaultBadges(page) {
  return page.locator('span:text("Using default")').count();
}

/**
 * Click the Save button and wait for the Tamil "Saved ✓" success toast.
 */
async function clickSave(page) {
  await page.click('button:has-text("சேமி")');
  await page.waitForSelector('text=சேமிக்கப்பட்டது ✓', { timeout: 8_000 });
}

/**
 * Reload the Content Manager so savedSettings is refreshed from the DB.
 */
async function reloadContentManager(page) {
  await page.reload({ waitUntil: "load" });
  // Wait for the Content Manager heading (Tamil: இணையதள உள்ளடக்க மேலாண்மை)
  await page.waitForSelector('h1', { timeout: 10_000 });
  // Give the settings fetch time to complete before interacting with tabs
  await page.waitForTimeout(1_500);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main test runner
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("ContentManager — badge clearing (browser-level)");
  console.log(`  Frontend : ${FRONTEND}`);
  console.log(`  API      : ${API_BASE}\n`);

  if (!ADMIN_PASS) {
    console.error("  ✗  INITIAL_ADMIN_PASSWORD is not set");
    process.exit(2);
  }

  const executablePath = resolveChromiumPath();
  console.log(`  Chromium : ${executablePath ?? "(Playwright bundled)"}\n`);

  // ── Node-side login (session cookie injection bypasses SameSite=None/HTTP issue)
  let sessionCookie;
  try {
    sessionCookie = await apiLogin();
  } catch (err) {
    console.error(`  ✗  API login failed: ${err.message}`);
    process.exit(1);
  }

  // ── Keys we will modify; snapshot before the test for unconditional restore
  const TESTED_KEYS = [
    "hero_title", "hero_subtitle",
    "temple_address",
    "about_history",
    "renovation_works", "renovation_progress",
    "special_pujas",
    "guru_description",
    "kumbhabhishekam_badge", "kumbhabhishekam_events",
    "appeal_heading",
    "footer_temple_name",
    "faqs",
  ];

  const preTestSettings = await getSettings();
  const snapshot = {};
  for (const k of TESTED_KEYS) {
    if (k in preTestSettings) snapshot[k] = preTestSettings[k];
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    // Create a browser context and inject the session cookie so the app sees
    // us as already logged in (avoids SameSite=None/HTTP rejection).
    const frontendOrigin = new URL(FRONTEND).origin;   // e.g. http://localhost:25427
    const context = await browser.newContext();
    await context.addCookies([{
      name:   sessionCookie.cookieName,
      value:  sessionCookie.cookieValue,
      domain: new URL(FRONTEND).hostname,              // "localhost"
      path:   "/",
      httpOnly: true,
      secure:   false,                                  // HTTP in dev
      sameSite: "Lax",                                  // override SameSite for local HTTP
    }]);

    const page = await context.newPage();

    // Build the cookie string we inject into every proxied API request
    const sessionHeader = `${sessionCookie.cookieName}=${sessionCookie.cookieValue}`;

    // Forward /api/** requests to the real API server.
    // - Inject the admin session cookie so the API server recognises the session.
    // - Strip the `origin` header: the browser includes it for non-simple methods
    //   (PATCH, POST) when the proxy forwards them, but the allowed-origins list
    //   in the API server's CORS config only contains the Replit dev domain and a
    //   few local dev ports — NOT the Playwright frontend port (25427).  Removing
    //   it causes express-cors to treat the request as same-origin (always allowed).
    await page.route("**/api/**", async (route) => {
      const original = route.request().url();
      const apiPath  = original.replace(/^https?:\/\/[^/]+(\/api\/.*)$/, "$1");
      const reqHeaders = { ...route.request().headers(), cookie: sessionHeader };
      delete reqHeaders["origin"];
      delete reqHeaders["referer"];
      try {
        const response = await route.fetch({
          url: `${API_BASE}${apiPath}`,
          headers: reqHeaders,
        });
        await route.fulfill({ response });
      } catch {
        await route.abort();
      }
    });

    page.on("console", msg => { if (msg.type() === "error") console.log(`  [browser] ${msg.text()}`); });

    // ── Navigate to Content Manager ───────────────────────────────────────────
    console.log("Step 1: Open Content Manager with injected session");
    await page.goto(`${FRONTEND}/admin/content`, { waitUntil: "load" });
    // Wait for the page heading (Tamil: இணையதள உள்ளடக்க மேலாண்மை, prefixed with 🖊️)
    await page.waitForSelector('h1', { timeout: 10_000 });
    await page.waitForTimeout(1_500); // let settings API call settle
    assert(true, "Content Manager loaded with injected admin session");

    // ──────────────────────────────────────────────────────────────────────────
    // Test A: Plain-text section — Hero tab
    // Reset hero_title via API to guarantee badge shows, then save via UI.
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest A: Hero tab — plain-text field badge clears after save");

    await patchSettings({ hero_title: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "🏛️");

    const badgesBeforeHero = await countDefaultBadges(page);
    assert(badgesBeforeHero > 0, `Hero: "Using default" badge visible before save (${badgesBeforeHero})`);

    await page.fill('input[placeholder="ஸ்வாமியே சரணம் ஐயப்பா"]', "Test Hero Title");
    await clickSave(page);

    const badgesAfterHero = await countDefaultBadges(page);
    assert(badgesAfterHero < badgesBeforeHero,
      `Hero: badge count dropped after save (${badgesBeforeHero} → ${badgesAfterHero})`);

    const heroSettings = await getSettings();
    assert(heroSettings.hero_title === "Test Hero Title",
      "Hero: hero_title persisted correctly in DB");

    // ──────────────────────────────────────────────────────────────────────────
    // Test B: JSON-backed section — Renovation
    // Previously buggy: setJson+saveKeys in the same event handler left
    // saveKeys reading stale settings state (empty string).
    // After the fix, saveKeys receives values via the `extra` parameter.
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest B: Renovation tab — JSON-backed badge clears after save (bug fix)");

    await patchSettings({ renovation_works: "", renovation_progress: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "🔨");

    const badgesBeforeRen = await countDefaultBadges(page);
    assert(badgesBeforeRen > 0, `Renovation: badge visible before save (${badgesBeforeRen})`);

    await clickSave(page);

    const badgesAfterRen = await countDefaultBadges(page);
    assert(badgesAfterRen < badgesBeforeRen,
      `Renovation: badge count dropped after save (${badgesBeforeRen} → ${badgesAfterRen})`);

    const renSettings = await getSettings();
    assert(
      typeof renSettings.renovation_works === "string" &&
      renSettings.renovation_works.trim().startsWith("["),
      "Renovation: renovation_works saved as valid JSON array (not empty string)"
    );
    assert(
      typeof renSettings.renovation_progress === "string" &&
      renSettings.renovation_progress.trim().startsWith("["),
      "Renovation: renovation_progress saved as valid JSON array (not empty string)"
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Test C: JSON-backed section — Pujas
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest C: Pujas tab — JSON-backed badge clears after save");

    await patchSettings({ special_pujas: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "🙏");

    const badgesBeforePujas = await countDefaultBadges(page);
    assert(badgesBeforePujas > 0, `Pujas: badge visible before save (${badgesBeforePujas})`);

    await clickSave(page);

    const badgesAfterPujas = await countDefaultBadges(page);
    assert(badgesAfterPujas < badgesBeforePujas,
      `Pujas: badge cleared after save (${badgesBeforePujas} → ${badgesAfterPujas})`);

    const pujasSettings = await getSettings();
    assert(
      typeof pujasSettings.special_pujas === "string" &&
      pujasSettings.special_pujas.trim().startsWith("["),
      "Pujas: special_pujas saved as valid JSON array"
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Test D: Mixed section — Kumbhabhishekam (text fields + JSON events)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest D: Kumbhabhishekam — mixed text+JSON badge clears");

    await patchSettings({ kumbhabhishekam_badge: "", kumbhabhishekam_events: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "🪔");

    const badgesBeforeKumb = await countDefaultBadges(page);
    assert(badgesBeforeKumb > 0, `Kumbhabhishekam: badge visible before save (${badgesBeforeKumb})`);

    await page.fill('input[placeholder="புனித குடமுழுக்கு விழா"]', "Test Kumbhabhishekam Badge");
    await clickSave(page);

    const badgesAfterKumb = await countDefaultBadges(page);
    assert(badgesAfterKumb < badgesBeforeKumb,
      `Kumbhabhishekam: badge count dropped after save (${badgesBeforeKumb} → ${badgesAfterKumb})`);

    const kumbSettings = await getSettings();
    assert(kumbSettings.kumbhabhishekam_badge === "Test Kumbhabhishekam Badge",
      "Kumbhabhishekam: text field persisted");
    assert(
      typeof kumbSettings.kumbhabhishekam_events === "string" &&
      kumbSettings.kumbhabhishekam_events.trim().startsWith("["),
      "Kumbhabhishekam: JSON events list saved as valid JSON array"
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Test E: JSON-backed section — FAQ
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest E: FAQ tab — JSON-backed faqs badge clears after save");

    await patchSettings({ faqs: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "❓");

    const badgesBeforeFaq = await countDefaultBadges(page);
    assert(badgesBeforeFaq > 0, `FAQ: badge visible before save (${badgesBeforeFaq})`);

    await clickSave(page);

    const badgesAfterFaq = await countDefaultBadges(page);
    assert(badgesAfterFaq < badgesBeforeFaq,
      `FAQ: badge cleared after save (${badgesBeforeFaq} → ${badgesAfterFaq})`);

    const faqSettings = await getSettings();
    assert(
      typeof faqSettings.faqs === "string" &&
      faqSettings.faqs.trim().startsWith("["),
      "FAQ: faqs saved as valid JSON array"
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Test F: Saving empty text keeps the badge (placeholder still shown)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest F: Saving empty text keeps 'Using default' badge");

    await patchSettings({ hero_subtitle: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "🏛️");

    const subtitleField = page.locator('input[placeholder="அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்"]');
    await subtitleField.fill("");  // explicitly empty
    const badgesBeforeEmpty = await countDefaultBadges(page);

    await clickSave(page);

    const badgesAfterEmpty = await countDefaultBadges(page);
    assert(badgesAfterEmpty >= badgesBeforeEmpty,
      `Empty-save: badge count unchanged after saving empty string (${badgesBeforeEmpty} → ${badgesAfterEmpty})`);

    const emptySettings = await getSettings();
    assert(
      emptySettings.hero_subtitle === "" || emptySettings.hero_subtitle == null,
      "Empty-save: hero_subtitle stored as empty in DB"
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Test G: Failed save keeps the badge unchanged
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest G: Failed save keeps 'Using default' badge unchanged");

    await patchSettings({ about_history: "" }, sessionCookie);
    await reloadContentManager(page);
    await openTab(page, "📖");

    const badgesBeforeFail = await countDefaultBadges(page);
    assert(badgesBeforeFail > 0, `History: badge visible before failed save (${badgesBeforeFail})`);

    // Block only PATCH requests to /api/settings so the save fails
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.abort("failed");
      } else {
        await route.continue();
      }
    });

    await page.click('button:has-text("சேமி")');
    await page.waitForSelector('text=பிழை', { timeout: 8_000 });

    const badgesAfterFail = await countDefaultBadges(page);
    assert(badgesAfterFail === badgesBeforeFail,
      `Failed save: badge count unchanged (${badgesBeforeFail} → ${badgesAfterFail})`);

    // Restore normal routing
    await page.unroute("**/api/settings");

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);

  } finally {
    // Unconditional state restore
    const restorePayload = {};
    for (const k of TESTED_KEYS) {
      restorePayload[k] = k in snapshot ? snapshot[k] : "";
    }
    await patchSettings(restorePayload, sessionCookie).catch(err => {
      console.error(`  ⚠  Could not restore settings: ${err.message}`);
    });
    console.log("  (settings restored to pre-test state)");

    await browser.close();
  }

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
