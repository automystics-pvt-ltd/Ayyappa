/**
 * E2E tests for visitor counting deduplication.
 *
 * Asserts that:
 *   1. A single browser session (same cookie) only adds one count per day,
 *      even when /api/visits/track is called multiple times (i.e. page refresh).
 *   2. A fresh browser context (no cookie) increments the count by exactly 1.
 *
 * Runs against the locally running API server on localhost:8080.
 * Set TEST_API_URL to override, e.g. TEST_API_URL=http://localhost:8080.
 */

const BASE = (process.env.TEST_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

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

function assertEqual(actual, expected, message) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✓  ${message} (got ${actual})`);
    passed++;
  } else {
    console.error(`  ✗  ${message} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HTTP helpers with cookie jar
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/visits/track, optionally sending a cookie header.
 * Returns { status, cookie } where cookie is the Set-Cookie value (if any).
 */
async function track(cookieHeader = null) {
  const headers = { "Content-Type": "application/json" };
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  const res = await fetch(`${BASE}/api/visits/track`, {
    method: "POST",
    headers,
  });
  const setCookie = res.headers.get("set-cookie") ?? null;
  return { status: res.status, setCookie };
}

/**
 * GET /api/visits/count. Returns { total, today }.
 */
async function getCount() {
  const res = await fetch(`${BASE}/api/visits/count`);
  if (!res.ok) throw new Error(`GET /api/visits/count returned ${res.status}`);
  return res.json();
}

/**
 * Extract just the session-id part ("name=value") from a Set-Cookie string
 * so we can send it back in a Cookie header.
 */
function parseCookieForHeader(setCookieValue) {
  // Set-Cookie: sid=abc; Path=/; HttpOnly; ...
  // We only need the first "name=value" pair.
  return setCookieValue.split(";")[0].trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\nRunning visitor-dedup E2E tests against ${BASE}\n`);

  // ── Verify the API is reachable before running assertions ──
  let initialCount;
  try {
    initialCount = await getCount();
  } catch (err) {
    console.error(`\nFATAL: Cannot reach API at ${BASE} — is the server running?\n${err.message}`);
    process.exit(2);
  }
  const initialTotal = initialCount.total;
  const initialToday = initialCount.today;
  console.log(`  Initial counts — total: ${initialTotal}, today: ${initialToday}\n`);

  // ── Test 1: Fresh session increments count by exactly 1 ──────────────────
  console.log("Test 1: Fresh browser session increments today's count by 1");
  const t1 = await track(); // no cookie → fresh session
  assert(t1.status === 204, `POST /api/visits/track returns 204`);
  assert(t1.setCookie !== null, `Server sets a session cookie on first visit`);

  const afterFirstVisit = await getCount();
  assertEqual(
    afterFirstVisit.today,
    initialToday + 1,
    `today count increased by 1 (${initialToday} → ${initialToday + 1})`,
  );
  assertEqual(
    afterFirstVisit.total,
    initialTotal + 1,
    `total count increased by 1`,
  );

  // ── Test 2: Same session (page refresh) does NOT increment count ──────────
  console.log("\nTest 2: Page refresh with same session cookie does NOT re-increment");
  const sessionCookie = parseCookieForHeader(t1.setCookie);
  const t2 = await track(sessionCookie); // same cookie → same session
  assert(t2.status === 204, `POST /api/visits/track returns 204 on refresh`);

  const afterRefresh = await getCount();
  assertEqual(
    afterRefresh.today,
    initialToday + 1,
    `today count unchanged after refresh (still ${initialToday + 1})`,
  );
  assertEqual(
    afterRefresh.total,
    initialTotal + 1,
    `total count unchanged after refresh`,
  );

  // ── Test 3: Call track once more in the same session to be sure ───────────
  console.log("\nTest 3: Second refresh with same cookie still does NOT re-increment");
  const t3 = await track(sessionCookie);
  assert(t3.status === 204, `POST /api/visits/track returns 204 on second refresh`);

  const afterSecondRefresh = await getCount();
  assertEqual(
    afterSecondRefresh.today,
    initialToday + 1,
    `today count still unchanged (still ${initialToday + 1})`,
  );

  // ── Test 4: Second fresh browser context increments count by 1 more ───────
  console.log("\nTest 4: A second fresh browser context increments today count by 1 more");
  const t4 = await track(); // no cookie → brand-new session
  assert(t4.status === 204, `POST /api/visits/track returns 204 for second visitor`);
  assert(t4.setCookie !== null, `Server sets a new session cookie for second visitor`);

  const afterSecondVisitor = await getCount();
  assertEqual(
    afterSecondVisitor.today,
    initialToday + 2,
    `today count is now ${initialToday + 2} after two distinct visitors`,
  );
  assertEqual(
    afterSecondVisitor.total,
    initialTotal + 2,
    `total count is now ${initialTotal + 2}`,
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log("All visitor-dedup tests passed ✓\n");
}

runTests().catch((err) => {
  console.error("\nUnhandled error in test runner:", err);
  process.exit(2);
});
