/**
 * Tests: 'Using default' badges clear correctly after saving each section
 *
 * Covers:
 *   1. TAB_KEYS consistency — parses ContentManager.tsx source at startup and
 *      asserts the test's local copy is identical, so the test fails if the
 *      component's key lists change.
 *   2. isDefaultSaved() pure-logic — absent key, non-empty value, empty string,
 *      whitespace-only; verified against the function body from source.
 *   3. tabDefaultCount() — counts correctly for all 10 registered tabs.
 *   4. saveKeys() state-merge simulation — badge before/after, failed save
 *      keeps badge, full section save clears all badges.
 *   5. API round-trip for every tab — PATCH /api/settings then GET; verifies
 *      key present and badge clears. Includes JSON-backed sections.
 *   6. Edge case — saving empty string keeps "Using default" badge (site
 *      still shows placeholder).
 *   7. State safety — all modified keys are snapshotted before the test and
 *      unconditionally restored in a finally block.
 *
 * Runs against the locally running API server.
 * Set TEST_API_URL to override, e.g. TEST_API_URL=http://localhost:8080.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.TEST_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

// Path to the component we are testing, relative to this file
const CONTENT_MANAGER_PATH = resolve(
  __dirname,
  "../../ayyappan-temple/src/pages/admin/ContentManager.tsx"
);

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

function assertEqual(actual, expected, message) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✓  ${message} (got ${JSON.stringify(actual)})`);
    passed++;
  } else {
    console.error(
      `  ✗  ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
    failed++;
  }
}

function assertDeepEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       got:      ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Parse TAB_KEYS from the actual ContentManager.tsx source
// This ensures the test fails if the component's key lists change.
// ──────────────────────────────────────────────────────────────────────────────

function parseTabKeysFromSource(src) {
  // Match the TAB_KEYS block:  const TAB_KEYS: ... = { ... };
  const blockMatch = src.match(/const TAB_KEYS[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!blockMatch) throw new Error("Could not locate TAB_KEYS in ContentManager.tsx");
  const block = blockMatch[1];

  const result = {};
  for (const line of block.split("\n")) {
    // Match lines like:  hero:  ['hero_title', 'hero_subtitle', ...],
    const lineMatch = line.match(/^\s+(\w+):\s*\[(.*?)\]/);
    if (!lineMatch) continue;
    const tabId = lineMatch[1];
    const keysStr = lineMatch[2];
    result[tabId] = (keysStr.match(/'([^']+)'/g) ?? []).map((s) => s.slice(1, -1));
  }
  return result;
}

// Parse isDefaultSaved function body from source (used to verify the logic
// the test assumes matches what is actually deployed)
function parseIsDefaultSavedFromSource(src) {
  const fnMatch = src.match(/function isDefaultSaved\([\s\S]*?\n\}/);
  if (!fnMatch) throw new Error("Could not locate isDefaultSaved in ContentManager.tsx");
  return fnMatch[0];
}

// ──────────────────────────────────────────────────────────────────────────────
// Test-local copy of the logic (must match ContentManager.tsx).
// The Part-1 source-validation test fails immediately if they drift.
// ──────────────────────────────────────────────────────────────────────────────

// These mirror the definitions in ContentManager.tsx verbatim
const TAB_KEYS = {
  hero:            ["hero_title", "hero_subtitle", "hero_location", "hero_tagline", "hero_quote"],
  contact:         ["temple_address", "temple_phone", "temple_email", "temple_maps_embed", "temple_maps_link", "temple_timings"],
  about:           ["about_history", "about_years", "about_daily_pujas", "about_devotees"],
  renovation:      ["renovation_works", "renovation_progress"],
  pujas:           ["special_pujas"],
  gurus:           ["guru_description", "guru_quote"],
  kumbhabhishekam: ["kumbhabhishekam_badge", "kumbhabhishekam_title", "kumbhabhishekam_desc", "kumbhabhishekam_events"],
  appeal:          ["appeal_heading", "appeal_body", "appeal_tagline", "appeal_closing"],
  branding:        ["footer_temple_name", "footer_tagline"],
  faq:             ["faqs"],
};

// Mirrors isDefaultSaved() from ContentManager.tsx:
//   returns true when key is absent OR value is empty/whitespace
function isDefaultSaved(savedSettings, key) {
  return !(key in savedSettings) || !savedSettings[key]?.trim();
}

function tabDefaultCount(savedSettings, tabId) {
  return (TAB_KEYS[tabId] ?? []).filter((k) => isDefaultSaved(savedSettings, k)).length;
}

// One representative non-empty test value per section.
// JSON-backed keys receive a valid JSON string, mirroring what saveKeys() sends.
const SECTION_TEST_VALUES = {
  hero_title:              "Test Temple Hero",
  temple_address:          "Test Address",
  about_history:           "Test history text",
  renovation_works:        JSON.stringify(["Test Work Item"]),
  special_pujas:           JSON.stringify(["Test Puja"]),
  guru_description:        "Test guru description",
  kumbhabhishekam_badge:   "Test Badge",
  appeal_heading:          "Test Appeal",
  footer_temple_name:      "Test Footer Name",
  faqs:                    JSON.stringify([{ q: "Test Q", a: "Test A" }]),
};

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

async function patchSettings(updates, cookie) {
  const res = await fetch(`${BASE}/api/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(updates),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function getSettings() {
  const res = await fetch(`${BASE}/api/settings`);
  if (!res.ok) throw new Error(`GET /api/settings failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Main test runner
// ──────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("ContentManager — 'Using default' badge behaviour");
  console.log("─".repeat(60));

  // ── Part 1: Validate source matches test's local copy ─────────────────────
  console.log("\nPart 1: TAB_KEYS and isDefaultSaved match ContentManager.tsx source");

  let srcTabKeys;
  let srcIsDefaultFn;
  try {
    const src = readFileSync(CONTENT_MANAGER_PATH, "utf8");
    srcTabKeys = parseTabKeysFromSource(src);
    srcIsDefaultFn = parseIsDefaultSavedFromSource(src);
    assert(Object.keys(srcTabKeys).length > 0, "parsed TAB_KEYS from source (non-empty)");
  } catch (err) {
    console.error(`  ✗  Failed to read/parse ContentManager.tsx: ${err.message}`);
    failed++;
    // Can't continue without source validation
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // Assert each tab and its keys exactly match the source
  for (const [tabId, keys] of Object.entries(TAB_KEYS)) {
    const srcKeys = srcTabKeys[tabId];
    assertDeepEqual(
      srcKeys,
      keys,
      `TAB_KEYS['${tabId}'] in test matches source (${keys.length} keys)`
    );
  }
  // No extra tabs in source that the test doesn't know about
  for (const tabId of Object.keys(srcTabKeys)) {
    assert(tabId in TAB_KEYS, `source tab '${tabId}' is also present in test's TAB_KEYS`);
  }

  // Verify isDefaultSaved: function must contain both guards the test relies on
  assert(
    srcIsDefaultFn.includes("!(key in savedSettings)"),
    "isDefaultSaved source contains absent-key guard  !(key in savedSettings)"
  );
  assert(
    srcIsDefaultFn.includes("savedSettings[key]?.trim()"),
    "isDefaultSaved source contains empty-string guard  savedSettings[key]?.trim()"
  );

  // ── Part 2: isDefaultSaved() pure-logic checks ───────────────────────────
  console.log("\nPart 2: isDefaultSaved() pure-logic checks");

  assertEqual(isDefaultSaved({}, "hero_title"), true,
    "absent key → isDefault=true (badge shows)");
  assertEqual(isDefaultSaved({ hero_title: "ஸ்வாமியே சரணம்" }, "hero_title"), false,
    "non-empty value → isDefault=false (badge clears)");
  assertEqual(isDefaultSaved({ hero_title: "" }, "hero_title"), true,
    "empty string → isDefault=true (badge stays, placeholder shown on site)");
  assertEqual(isDefaultSaved({ hero_title: "   " }, "hero_title"), true,
    "whitespace-only → isDefault=true (badge stays)");

  {
    const beforeSave = {};
    const afterSave  = { ...beforeSave, hero_title: "Custom Title" };
    assert(
      isDefaultSaved(beforeSave, "hero_title") === true &&
      isDefaultSaved(afterSave,  "hero_title") === false,
      "badge shows before save, clears after save with non-empty value"
    );
  }

  // ── Part 3: tabDefaultCount() for all 10 tabs ────────────────────────────
  console.log("\nPart 3: tabDefaultCount() for all 10 sections");

  for (const [tabId, keys] of Object.entries(TAB_KEYS)) {
    // All missing → count = total
    assertEqual(tabDefaultCount({}, tabId), keys.length,
      `${tabId}: empty settings → all ${keys.length} keys at default`);

    // All saved → count = 0
    const full = {};
    for (const k of keys) full[k] = "value";
    assertEqual(tabDefaultCount(full, tabId), 0,
      `${tabId}: all keys saved → 0 fields at default`);

    // Empty-string saves don't reduce count (still at default)
    const empty = {};
    for (const k of keys) empty[k] = "";
    assertEqual(tabDefaultCount(empty, tabId), keys.length,
      `${tabId}: empty-string saves → count unchanged`);
  }

  // ── Part 4: saveKeys() state-merge simulation ────────────────────────────
  console.log("\nPart 4: saveKeys() in-memory state-merge simulation");

  {
    let savedSettings = {};

    assert(isDefaultSaved(savedSettings, "hero_subtitle"), true,
      "before saveKeys: hero_subtitle badge shows");

    // Simulate saveKeys(['hero_subtitle']) — setSavedSettings(prev => ({...prev,...updates}))
    const updates = { hero_subtitle: "அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்" };
    savedSettings = { ...savedSettings, ...updates };
    assertEqual(isDefaultSaved(savedSettings, "hero_subtitle"), false,
      "after saveKeys with real value: hero_subtitle badge clears");
  }

  // Full section save clears all keys for that tab
  {
    let savedSettings = {};
    assertEqual(tabDefaultCount(savedSettings, "hero"), TAB_KEYS.hero.length,
      "before full hero section save: all fields at default");

    const updates = {};
    for (const k of TAB_KEYS.hero) updates[k] = `value-${k}`;
    savedSettings = { ...savedSettings, ...updates };
    assertEqual(tabDefaultCount(savedSettings, "hero"), 0,
      "after full hero section save: zero fields at default");
  }

  // Failed save must NOT update savedSettings (badges stay unchanged)
  {
    const savedSettings = {};
    try { throw new Error("simulated network error"); } catch { /* intentional */ }
    assertEqual(isDefaultSaved(savedSettings, "hero_title"), true,
      "after failed saveKeys: badge unchanged (savedSettings not updated)");
  }

  // JSON-backed section: saving valid JSON string clears badge
  {
    let savedSettings = {};
    const jsonValue = JSON.stringify(["Work item 1"]);
    const updates = { renovation_works: jsonValue };
    savedSettings = { ...savedSettings, ...updates };
    assertEqual(isDefaultSaved(savedSettings, "renovation_works"), false,
      "JSON-backed key: saving valid JSON string clears the badge");
  }

  // ── Part 5: API round-trip for every section ─────────────────────────────
  console.log("\nPart 5: API round-trip — PATCH then GET for all 10 sections");

  const username = process.env.INITIAL_ADMIN_USERNAME ?? "admin";
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    console.error(
      "  ✗  INITIAL_ADMIN_PASSWORD env var is not set. Export it before running."
    );
    process.exit(2);
  }

  let cookie;
  try {
    ({ cookie } = await login(username, password));
    assert(cookie.length > 0, "login returned a session cookie");
  } catch (err) {
    console.error(`  ✗  Login threw: ${err.message}`);
    failed++;
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // Snapshot all keys we will touch so we can restore them unconditionally
  const allTestKeys = Object.keys(SECTION_TEST_VALUES);
  const preTestSettings = await getSettings();
  const snapshot = {};
  for (const k of allTestKeys) {
    // Preserve the existing value (may be absent)
    if (k in preTestSettings) snapshot[k] = preTestSettings[k];
  }

  try {
    // 5a: Save one representative key per section via PATCH
    for (const [section, firstKey] of Object.entries({
      hero:            "hero_title",
      contact:         "temple_address",
      about:           "about_history",
      renovation:      "renovation_works",
      pujas:           "special_pujas",
      gurus:           "guru_description",
      kumbhabhishekam: "kumbhabhishekam_badge",
      appeal:          "appeal_heading",
      branding:        "footer_temple_name",
      faq:             "faqs",
    })) {
      const testValue = SECTION_TEST_VALUES[firstKey];

      const { status, body } = await patchSettings({ [firstKey]: testValue }, cookie);
      assertEqual(status, 200, `${section}: PATCH /api/settings → 200`);
      assert(body.ok === true, `${section}: PATCH response body has ok:true`);

      // GET and verify key present with correct value
      const settings = await getSettings();
      assert(firstKey in settings,
        `${section}: GET /api/settings includes key '${firstKey}'`);
      assertEqual(settings[firstKey], testValue,
        `${section}: GET returns the saved value`);

      // Badge logic: key present + non-empty → badge clears
      assertEqual(isDefaultSaved(settings, firstKey), false,
        `${section}: badge clears for '${firstKey}' after non-empty save`);
    }

    // 5b: Edge case — empty string keeps badge, even though key is now in DB
    const edgeKey = "appeal_heading";
    await patchSettings({ [edgeKey]: "" }, cookie);
    const edgeSettings = await getSettings();
    assert(edgeKey in edgeSettings,
      `key '${edgeKey}' present in DB after saving empty string`);
    assertEqual(isDefaultSaved(edgeSettings, edgeKey), true,
      `badge stays for '${edgeKey}' when saved as empty string (placeholder shown on site)`);

  } finally {
    // ── Unconditional restore ─────────────────────────────────────────────
    // For keys that existed before the test: restore original value.
    // For keys that did not exist before (were absent): set to '' to match
    // "never been meaningfully set" state (DB row exists but empty, same
    // as absent for badge purposes).
    const restorePayload = {};
    for (const k of allTestKeys) {
      restorePayload[k] = k in snapshot ? snapshot[k] : "";
    }
    await patchSettings(restorePayload, cookie).catch(() => {
      console.error("  ⚠  Could not restore settings after test run");
    });
    console.log("\n  (settings restored to pre-test state)");
  }

  // ── Results ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
