/**
 * Tests: Admin cannot delete or demote themselves
 *
 * Asserts that:
 *   1. PATCH /api/auth/admins/:ownId returns 400 (cannot modify own account)
 *   2. DELETE /api/auth/admins/:ownId returns 400 (cannot delete own account)
 *   3. The AdminManagement UI component contains the isSelf guard that hides
 *      edit/delete buttons for the currently logged-in admin row.
 *
 * Runs against the locally running API server.
 * Set TEST_API_URL to override, e.g. TEST_API_URL=http://localhost:8080.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

/**
 * Log in as super_admin; returns the session cookie string for subsequent calls.
 */
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
  // Extract session cookie value (first name=value pair)
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login succeeded but no session cookie returned");
  const cookie = setCookie.split(";")[0].trim();
  return { id: data.id, cookie };
}

async function patchAdmin(id, body, cookie) {
  const res = await fetch(`${BASE}/api/auth/admins/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function deleteAdmin(id, cookie) {
  const res = await fetch(`${BASE}/api/auth/admins/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  // 204 has no body; others return JSON
  const body = res.status !== 204 ? await res.json().catch(() => ({})) : {};
  return { status: res.status, body };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("Admin self-protection tests");
  console.log("─".repeat(50));

  // ── Credentials ─────────────────────────────────────────────────────────────
  const username = process.env.INITIAL_ADMIN_USERNAME ?? "admin";
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    console.error(
      "  ✗  INITIAL_ADMIN_PASSWORD env var is not set. " +
      "Export it before running this test."
    );
    process.exit(2);
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  console.log("\nStep 1: Log in as super_admin");
  let adminId, cookie;
  try {
    ({ id: adminId, cookie } = await login(username, password));
    assert(typeof adminId === "number", `Login returned numeric id (${adminId})`);
    assert(cookie.length > 0, "Login returned a session cookie");
  } catch (err) {
    console.error(`  ✗  Login threw: ${err.message}`);
    failed++;
    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // ── Test 1: PATCH own ID → 400 ───────────────────────────────────────────
  console.log("\nTest 1: PATCH /api/auth/admins/:ownId returns 400");
  const patchResult = await patchAdmin(adminId, { role: "editor" }, cookie);
  assertEqual(patchResult.status, 400, "PATCH own account returns 400");
  assert(
    typeof patchResult.body.error === "string" && patchResult.body.error.length > 0,
    `Response includes error message: "${patchResult.body.error}"`
  );

  // ── Test 2: DELETE own ID → 400 ─────────────────────────────────────────
  console.log("\nTest 2: DELETE /api/auth/admins/:ownId returns 400");
  const deleteResult = await deleteAdmin(adminId, cookie);
  assertEqual(deleteResult.status, 400, "DELETE own account returns 400");
  assert(
    typeof deleteResult.body.error === "string" && deleteResult.body.error.length > 0,
    `Response includes error message: "${deleteResult.body.error}"`
  );

  // ── Test 3: UI component isSelf guard (static analysis) ─────────────────
  console.log("\nTest 3: AdminManagement.tsx contains isSelf guard (static check)");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const componentPath = resolve(
    __dirname,
    "../../ayyappan-temple/src/pages/admin/AdminManagement.tsx"
  );

  let src;
  try {
    src = readFileSync(componentPath, "utf8");
    assert(true, "AdminManagement.tsx is readable");
  } catch {
    assert(false, "AdminManagement.tsx is readable");
    src = "";
  }

  // Verify the isSelf variable is defined (compares user.id to currentAdminId)
  assert(
    src.includes("isSelf") && src.includes("currentAdminId"),
    "Component defines isSelf check against currentAdminId"
  );

  // Verify the actions cell renders a placeholder (not edit/delete buttons) for isSelf
  assert(
    src.includes("isSelf ?"),
    "Component branches on isSelf to suppress action buttons"
  );

  // Verify edit and delete buttons only appear in the non-isSelf branch
  // (the Pencil and Trash2 buttons are rendered inside the else branch)
  const isSelfBlockStart = src.indexOf("isSelf ?");
  const pencilIdx = src.indexOf("<Pencil", isSelfBlockStart);
  const trash2Idx = src.indexOf("<Trash2", isSelfBlockStart);

  // The em-dash placeholder for isSelf must appear between "isSelf ?" and the action buttons.
  // In JSX the character is a literal UTF-8 em-dash (U+2014) inside a <span>, not a quoted string.
  const selfPlaceholderIdx = src.indexOf("\u2014", isSelfBlockStart);
  assert(
    selfPlaceholderIdx !== -1 &&
      selfPlaceholderIdx < pencilIdx &&
      selfPlaceholderIdx < trash2Idx,
    "isSelf renders an em-dash placeholder before the edit/delete buttons in the conditional"
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log("All admin self-protection tests passed ✓\n");
}

runTests().catch((err) => {
  console.error("\nUnhandled error in test runner:", err);
  process.exit(2);
});
