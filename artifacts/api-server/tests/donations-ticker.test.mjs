/**
 * E2E tests for GET /api/donations/recent-ticker
 *
 * Asserts that:
 *   1. An approved donation appears in the ticker response with correct fields.
 *   2. An anonymous donation appears with anonymous: true (ticker would display "ஒரு பக்தர்").
 *   3. A pending (un-reviewed) donation does NOT appear.
 *   4. A donation approved more than 3 days ago does NOT appear (live behavioral cutoff check).
 *
 * Runs against the locally running API server on localhost:8080.
 * Set TEST_API_URL to override, e.g. TEST_API_URL=http://localhost:8080.
 * Set INITIAL_ADMIN_PASSWORD to override the default admin password.
 */

// Note: no static file imports needed — all checks are live API calls

const BASE = (process.env.TEST_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.INITIAL_ADMIN_PASSWORD ?? "admin123";

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
    console.log(`  ✓  ${message} (got ${JSON.stringify(actual)})`);
    passed++;
  } else {
    console.error(`  ✗  ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Log in as admin; returns the Cookie header string for subsequent calls.
 */
async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No session cookie after login");
  return setCookie.split(";")[0].trim();
}

/**
 * POST /api/donations — submit a new (pending) donation.
 * Returns the created donation object.
 */
async function submitDonation({ donorName, mobile, amount, transactionId, anonymous = false }) {
  const res = await fetch(`${BASE}/api/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ donorName, mobile, amount, transactionId, anonymous }),
  });
  if (!res.ok) throw new Error(`POST /api/donations failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * PATCH /api/donations/:id/approve — approve a donation (admin).
 */
async function approveDonation(id, sessionCookie) {
  const res = await fetch(`${BASE}/api/donations/${id}/approve`, {
    method: "PATCH",
    headers: { Cookie: sessionCookie },
  });
  if (!res.ok) throw new Error(`PATCH /approve failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * POST /api/donations/admin-create — create a donation directly as approved (admin).
 * Accepts donationDate to backdate reviewedAt, enabling cutoff tests.
 */
async function adminCreateDonation({ donorName, mobile, amount, transactionId, status = "approved", donationDate }, sessionCookie) {
  const res = await fetch(`${BASE}/api/donations/admin-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ donorName, mobile, amount, transactionId, status, donationDate }),
  });
  if (!res.ok) throw new Error(`POST /admin-create failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * GET /api/donations/recent-ticker — public endpoint.
 */
async function getRecentTicker() {
  const res = await fetch(`${BASE}/api/donations/recent-ticker`);
  if (!res.ok) throw new Error(`GET /recent-ticker failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\nRunning donations-ticker E2E tests against ${BASE}\n`);

  // ── Verify the API is reachable ───────────────────────────────────────────
  try {
    await getRecentTicker();
  } catch (err) {
    console.error(`\nFATAL: Cannot reach API at ${BASE} — is the server running?\n${err.message}`);
    process.exit(2);
  }

  // ── Admin login ───────────────────────────────────────────────────────────
  let sessionCookie;
  try {
    sessionCookie = await login(ADMIN_USER, ADMIN_PASS);
    console.log("  Admin login successful\n");
  } catch (err) {
    console.error(`\nFATAL: Admin login failed — ${err.message}`);
    process.exit(2);
  }

  // Use unique transaction IDs so repeated test runs don't collide
  const suffix = Date.now();
  const namedTxId   = `TEST-TICKER-NAMED-${suffix}`;
  const anonTxId    = `TEST-TICKER-ANON-${suffix}`;
  const pendingTxId = `TEST-TICKER-PENDING-${suffix}`;
  const staleTxId   = `TEST-TICKER-STALE-${suffix}`;

  // ── Test 1: Approved named donation appears in ticker ─────────────────────
  console.log("Test 1: Approved named donation appears in the ticker");
  const named = await submitDonation({
    donorName: "Ticker Test Donor",
    mobile:    "9000000001",
    amount:    500,
    transactionId: namedTxId,
    anonymous: false,
  });
  assert(typeof named.id === "number", `Donation submitted, id=${named.id}`);

  await approveDonation(named.id, sessionCookie);
  console.log(`  Donation ${named.id} approved`);

  const tickerAfterApproval = await getRecentTicker();
  const foundNamed = tickerAfterApproval.find(d => d.id === named.id);

  assert(foundNamed !== undefined, `Approved donation id=${named.id} is present in /recent-ticker`);
  if (foundNamed) {
    assertEqual(foundNamed.donorName, "Ticker Test Donor", `donorName matches`);
    assertEqual(Number(foundNamed.amount), 500, `amount is 500`);
    assertEqual(foundNamed.anonymous, false, `anonymous flag is false`);
    assert(foundNamed.reviewedAt !== null && foundNamed.reviewedAt !== undefined, `reviewedAt is set`);
  }

  // ── Test 2: Anonymous donation shows anonymous: true ──────────────────────
  console.log("\nTest 2: Anonymous donation appears with anonymous: true");
  const anon = await submitDonation({
    donorName: "Hidden Devotee",
    mobile:    "9000000002",
    amount:    100,
    transactionId: anonTxId,
    anonymous: true,
  });
  assert(typeof anon.id === "number", `Anonymous donation submitted, id=${anon.id}`);

  await approveDonation(anon.id, sessionCookie);
  console.log(`  Anonymous donation ${anon.id} approved`);

  const tickerWithAnon = await getRecentTicker();
  const foundAnon = tickerWithAnon.find(d => d.id === anon.id);

  assert(foundAnon !== undefined, `Anonymous donation id=${anon.id} is present in /recent-ticker`);
  if (foundAnon) {
    assertEqual(foundAnon.anonymous, true, `anonymous flag is true`);
    // donorName is still stored; the ticker client formats it as "ஒரு பக்தர்"
    assert(foundAnon.donorName !== undefined, `donorName field is present (client uses anonymous flag to decide display)`);
  }

  // ── Test 3: Pending donation does NOT appear in ticker ────────────────────
  console.log("\nTest 3: Pending (un-approved) donation does NOT appear in ticker");
  const pending = await submitDonation({
    donorName: "Pending Donor",
    mobile:    "9000000003",
    amount:    250,
    transactionId: pendingTxId,
    anonymous: false,
  });
  assert(typeof pending.id === "number", `Pending donation submitted, id=${pending.id}`);

  const tickerWithPending = await getRecentTicker();
  const foundPending = tickerWithPending.find(d => d.id === pending.id);
  assert(foundPending === undefined, `Pending donation id=${pending.id} does NOT appear in /recent-ticker`);

  // ── Test 4: Ticker items are ordered newest first ─────────────────────────
  console.log("\nTest 4: Ticker results are ordered by reviewedAt descending");
  if (tickerWithAnon.length >= 2) {
    const dates = tickerWithAnon.map(d => new Date(d.reviewedAt).getTime());
    let ordered = true;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] > dates[i - 1]) { ordered = false; break; }
    }
    assert(ordered, `Ticker items are sorted newest-first`);
  } else {
    console.log("  (skipped — fewer than 2 items, ordering not testable)");
  }

  // ── Test 5: Donation older than 3 days does NOT appear in ticker ──────────
  console.log("\nTest 5: Donation approved more than 3 days ago does NOT appear in ticker");
  // Seed an approved donation with reviewedAt = 4 days ago via admin-create
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const stale = await adminCreateDonation(
    {
      donorName:     "Stale Donor",
      mobile:        "9000000004",
      amount:        999,
      transactionId: staleTxId,
      status:        "approved",
      donationDate:  fourDaysAgo,
    },
    sessionCookie,
  );
  assert(typeof stale.id === "number", `Stale donation seeded, id=${stale.id}, reviewedAt=${stale.reviewedAt}`);

  const tickerAfterStale = await getRecentTicker();
  const foundStale = tickerAfterStale.find(d => d.id === stale.id);
  assert(foundStale === undefined, `Stale donation id=${stale.id} (reviewedAt 4 days ago) is absent from /recent-ticker`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log("All donations-ticker tests passed ✓\n");
}

runTests().catch((err) => {
  console.error("\nUnhandled error in test runner:", err);
  process.exit(2);
});
