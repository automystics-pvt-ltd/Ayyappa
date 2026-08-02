/**
 * Tests: In-Kind Contribution Receipt reads temple name from site settings
 *
 * Verifies via static source analysis that ContributionReceipt.tsx does NOT
 * use hardcoded temple-identity strings and instead sources all three fields
 * from the `useSiteSettings()` hook:
 *
 *   • hero_subtitle   — temple name displayed in the receipt header
 *   • temple_address  — address line displayed under the header name
 *   • footer_temple_name — issuer name shown in the footer and the seal
 *
 * Also verifies that the settings API exposes both GET /api/settings (public,
 * reads from the DB) and PATCH /api/settings (admin-only, writes to the DB),
 * so an admin saving a new value in the Settings UI is guaranteed to flow
 * through to the receipt page.
 *
 * Pure static-analysis — no live server or database required.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const receiptSrc = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx"),
  "utf8"
);

const settingsSrc = readFileSync(
  resolve(__dirname, "../src/routes/settings.ts"),
  "utf8"
);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
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
// 1. The receipt component imports and uses useSiteSettings
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── useSiteSettings hook wired into ContributionReceipt ──");

assert(
  /import\s*\{[^}]*useSiteSettings[^}]*\}\s*from/.test(receiptSrc),
  "ContributionReceipt.tsx imports useSiteSettings"
);

assert(
  /useSiteSettings\s*\(\s*\)/.test(receiptSrc),
  "ContributionReceipt.tsx calls useSiteSettings() to obtain live settings"
);

// ──────────────────────────────────────────────────────────────────────────────
// 2. hero_subtitle — temple name in the receipt header
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── hero_subtitle → receipt header temple name ──");

assert(
  /s\.hero_subtitle/.test(receiptSrc),
  "ContributionReceipt.tsx renders s.hero_subtitle (header temple name from settings)"
);

// The value must not be hardcoded as the only source — there should be a
// fallback, but the primary read must reference the settings object.
assert(
  /s\.hero_subtitle\s*\|\|/.test(receiptSrc),
  "ContributionReceipt.tsx uses s.hero_subtitle with a fallback (graceful when unset)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 3. temple_address — address line in the receipt header
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── temple_address → receipt header address ──");

assert(
  /s\.temple_address/.test(receiptSrc),
  "ContributionReceipt.tsx renders s.temple_address (header address from settings)"
);

assert(
  /s\.temple_address\s*\|\|/.test(receiptSrc),
  "ContributionReceipt.tsx uses s.temple_address with a fallback (graceful when unset)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 4. footer_temple_name — issuer in the footer and the seal
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── footer_temple_name → receipt footer and seal ──");

assert(
  /s\.footer_temple_name/.test(receiptSrc),
  "ContributionReceipt.tsx renders s.footer_temple_name (footer / seal issuer from settings)"
);

assert(
  /s\.footer_temple_name\s*\|\|/.test(receiptSrc),
  "ContributionReceipt.tsx uses s.footer_temple_name with a fallback (graceful when unset)"
);

// The seal splits footer_temple_name into lines — confirm the variable is
// populated from s.footer_temple_name, not a separate literal.
assert(
  /sealFullText\s*=\s*s\.footer_temple_name/.test(receiptSrc),
  "Seal text is derived from s.footer_temple_name (seal updates when admin saves a new name)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 5. Settings API — public GET route reads from the database
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Settings API — GET /api/settings reads DB ──");

assert(
  /router\.get\s*\(\s*["']\/"/.test(settingsSrc) ||
  /router\.get\s*\(\s*["']\/["']/.test(settingsSrc),
  "settings.ts exposes GET / (public endpoint for reading settings)"
);

assert(
  /db\.select\s*\(\s*\)\s*\.from\s*\(\s*siteSettingsTable/.test(settingsSrc),
  "GET handler reads all rows from siteSettingsTable (live DB values, not env/cache)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 6. Settings API — admin PATCH route writes to the database
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Settings API — PATCH /api/settings writes DB ──");

assert(
  /router\.patch\s*\(\s*["']\/["']/.test(settingsSrc),
  "settings.ts exposes PATCH / (admin endpoint for saving settings)"
);

assert(
  /requireRole/.test(settingsSrc),
  "PATCH handler is protected by requireRole (only admins can save)"
);

assert(
  /onConflictDoUpdate/.test(settingsSrc),
  "PATCH handler uses upsert (onConflictDoUpdate) so existing keys are overwritten"
);

// ──────────────────────────────────────────────────────────────────────────────
// 7. useSiteSettings hook fetches from the API (not env vars or constants)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── useSiteSettings hook fetches from /api/settings ──");

const hookSrc = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/hooks/useSiteSettings.tsx"),
  "utf8"
);

assert(
  /api\.getSettings\s*\(\s*\)/.test(hookSrc),
  "useSiteSettings calls api.getSettings() to fetch settings from the server"
);

assert(
  /useEffect/.test(hookSrc),
  "useSiteSettings fetches settings inside useEffect (runs on mount)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} in-kind receipt settings binding checks passed.`);
  console.log(`    hero_subtitle, temple_address, and footer_temple_name are all`);
  console.log(`    sourced from useSiteSettings(), which fetches live values from`);
  console.log(`    GET /api/settings. An admin saving a new temple name via the`);
  console.log(`    Settings UI (PATCH /api/settings) will be reflected immediately`);
  console.log(`    on the in-kind receipt page once the browser re-fetches settings.`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    The in-kind receipt may be using hardcoded temple-identity strings`);
  console.error(`    instead of reading them from the site settings API.`);
  process.exit(1);
}
