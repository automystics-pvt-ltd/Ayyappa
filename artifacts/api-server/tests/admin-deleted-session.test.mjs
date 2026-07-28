/**
 * Tests: Deleted admin's session is cut off immediately
 *
 * Asserts that:
 *   1. A super_admin can log in successfully.
 *   2. A new editor admin can be created and can log in successfully.
 *   3. The super_admin deletes the editor via DELETE /api/auth/admins/:id.
 *   4. The editor's still-valid session cookie now gets 401 on any
 *      authenticated endpoint (not 200 or 500).
 *
 * Runs against the locally running API server.
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
// HTTP helpers
// ──────────────────────────────────────────────────────────────────────────────

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login succeeded but no session cookie returned");
  const cookie = setCookie.split(";")[0].trim();
  return { id: data.id, cookie };
}

async function createAdmin(body, cookie) {
  const res = await fetch(`${BASE}/api/auth/create-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function deleteAdmin(id, cookie) {
  const res = await fetch(`${BASE}/api/auth/admins/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const body = res.status !== 204 ? await res.json().catch(() => ({})) : {};
  return { status: res.status, body };
}

async function getAdmins(cookie) {
  const res = await fetch(`${BASE}/api/auth/admins`, {
    headers: { Cookie: cookie },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("Admin deleted-session cut-off tests");
  console.log("─".repeat(50));

  // ── Credentials ─────────────────────────────────────────────────────────────
  const superUsername = process.env.INITIAL_ADMIN_USERNAME ?? "admin";
  const superPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!superPassword) {
    console.error(
      "  ✗  INITIAL_ADMIN_PASSWORD env var is not set. " +
      "Export it before running this test."
    );
    process.exit(2);
  }

  // Use a unique username so parallel runs don't collide
  const editorUsername = `test_editor_${Date.now()}`;
  const editorPassword = "Test@12345";

  // ── Step 1: Log in as super_admin ────────────────────────────────────────
  console.log("\nStep 1: Log in as super_admin");
  let superAdminId, superCookie;
  try {
    ({ id: superAdminId, cookie: superCookie } = await login(superUsername, superPassword));
    assert(typeof superAdminId === "number", `super_admin login returned numeric id (${superAdminId})`);
    assert(superCookie.length > 0, "super_admin login returned a session cookie");
  } catch (err) {
    console.error(`  ✗  super_admin login threw: ${err.message}`);
    failed++;
    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // ── Step 2: Create a temporary editor admin ──────────────────────────────
  console.log("\nStep 2: Create a temporary editor admin");
  const createResult = await createAdmin(
    { username: editorUsername, password: editorPassword, role: "editor", displayName: "Temp Editor" },
    superCookie
  );
  assertEqual(createResult.status, 200, "create-admin returns 200");
  const editorId = createResult.body.id;
  assert(typeof editorId === "number", `create-admin returned numeric id (${editorId})`);

  if (typeof editorId !== "number") {
    console.error("  ✗  Cannot continue without a valid editor id — aborting");
    process.exit(1);
  }

  // ── Step 3: Log in as the new editor ────────────────────────────────────
  console.log("\nStep 3: Log in as the new editor");
  let editorCookie;
  try {
    ({ cookie: editorCookie } = await login(editorUsername, editorPassword));
    assert(editorCookie.length > 0, "editor login returned a session cookie");
  } catch (err) {
    console.error(`  ✗  Editor login threw: ${err.message}`);
    failed++;
    // Clean up the editor account before exiting
    await deleteAdmin(editorId, superCookie).catch(() => {});
    process.exit(1);
  }

  // ── Step 4: Verify the editor's session works before deletion ────────────
  console.log("\nStep 4: Verify the editor's session works before deletion");
  // GET /api/auth/me is authenticated and returns admin info when logged in
  const meBeforeRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: editorCookie },
  });
  const meBefore = await meBeforeRes.json().catch(() => ({}));
  assertEqual(meBeforeRes.status, 200, "editor /api/auth/me returns 200 before deletion");
  assert(
    meBefore.admin?.adminId === editorId,
    `editor /api/auth/me returns correct adminId (${meBefore.admin?.adminId})`
  );

  // ── Step 5: super_admin deletes the editor ───────────────────────────────
  console.log("\nStep 5: super_admin deletes the editor");
  const deleteResult = await deleteAdmin(editorId, superCookie);
  assertEqual(deleteResult.status, 204, "DELETE /api/auth/admins/:id returns 204");

  // ── Step 6: Editor's old session cookie must now return 401 ─────────────
  console.log("\nStep 6: Editor's stale session cookie returns 401 on authenticated endpoint");

  // Test against GET /api/auth/admins (requireAuth + role check)
  const adminsRes = await getAdmins(editorCookie);
  assertEqual(adminsRes.status, 401, "GET /api/auth/admins with deleted editor cookie returns 401");

  // Also test against GET /api/auth/me — the public path returns { admin: null } after destroy
  const meAfterRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: editorCookie },
  });
  const meAfter = await meAfterRes.json().catch(() => ({}));
  assertEqual(meAfterRes.status, 200, "/api/auth/me returns 200 (public endpoint)");
  assert(
    meAfter.admin === null,
    `/api/auth/me returns { admin: null } after session destroyed (got ${JSON.stringify(meAfter.admin)})`
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log("All admin deleted-session tests passed ✓\n");
}

runTests().catch((err) => {
  console.error("\nUnhandled error in test runner:", err);
  process.exit(2);
});
