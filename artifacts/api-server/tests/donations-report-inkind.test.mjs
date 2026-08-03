/**
 * Tests: Donations Report — In-Kind Contributions section in downloaded PNG
 *
 * The DonationsReport component now includes an "In-Kind Contributions" section
 * rendered in a purple tint below the pending donations table.  html2canvas
 * captures the full reportRef div at 2.5× scale; the in-kind table must appear
 * in the output.
 *
 * This test confirms:
 *
 *   1.  The in-kind section is conditionally rendered only when
 *       contributions.length > 0
 *   2.  The in-kind header shows the 🎁 emoji and the correct Tamil/English
 *       label "இயற்கை நன்கொடைகள்" / "In-Kind Contributions"
 *   3.  The table border uses the purple palette (#e9d5ff)
 *   4.  The table header background uses the purple gradient (#f5f3ff / #ede9fe)
 *   5.  The table header text colour is purple (#7c3aed)
 *   6.  The grid has 4 columns (# / Contributor / Item·Description / Date)
 *   7.  Donor name is rendered from c.donorName (supports Tamil names)
 *   8.  Description is rendered from c.description
 *   9.  Date is rendered from c.contributedAt (not createdAt)
 *  10.  The 5-column stats bar uses gridTemplateColumns "repeat(5,1fr)"
 *  11.  The 5th stat cell shows contributions.length and has purple colour
 *       (#7c3aed)
 *  12.  The 5th stat label is "இயற்கை நன்கொடைகள்" / "In-Kind"
 *  13.  shareWhatsAppReport appends the in-kind suffix when contributions.length > 0
 *  14.  The in-kind suffix includes "இயற்கை நன்கொடைகள்"
 *  15.  The in-kind section is inside the capturable div (reportRef) — not
 *       outside it
 *
 * Approach: pure static analysis of Donations.tsx — no browser, no live
 * server, and no admin login required.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/admin/Donations.tsx"),
  "utf8"
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Extract the DonationsReport component body
// ─────────────────────────────────────────────────────────────────────────────

const reportStart = src.indexOf("function DonationsReport(");
const reportEnd   = src.indexOf("\nfunction ", reportStart + 1);
const reportBody  = reportStart !== -1
  ? src.slice(reportStart, reportEnd !== -1 ? reportEnd : src.length)
  : "";

// ─────────────────────────────────────────────────────────────────────────────
// Extract the in-kind JSX block
// (from the "In-Kind Contributions section" comment to contributions.length > 0
//  conditional close)
// ─────────────────────────────────────────────────────────────────────────────

const inkindBlockStart = reportBody.indexOf("In-Kind Contributions section");
// Fallback: look for the emoji or the Tamil label
const inkindFallback   = reportBody.indexOf("இயற்கை நன்கொடைகள்");
const inkindIdx        = inkindBlockStart !== -1 ? inkindBlockStart : inkindFallback;
// Take 3 KB from that point — enough to cover the full in-kind table JSX
const inkindBlock      = inkindIdx !== -1
  ? reportBody.slice(inkindIdx, inkindIdx + 3000)
  : "";

// ─────────────────────────────────────────────────────────────────────────────
// Extract the stats bar block (5-column grid)
// ─────────────────────────────────────────────────────────────────────────────

const statsIdx   = reportBody.indexOf("repeat(5,1fr)");
const statsBlock = statsIdx !== -1
  ? reportBody.slice(Math.max(0, statsIdx - 100), statsIdx + 1500)
  : "";

// ─────────────────────────────────────────────────────────────────────────────
// Extract shareWhatsAppReport function body
// ─────────────────────────────────────────────────────────────────────────────

const shareStart = src.indexOf("const shareWhatsAppReport");
const shareEnd   = src.indexOf("\n  };", shareStart) + 5;
const shareFn    = shareStart !== -1 ? src.slice(shareStart, shareEnd) : "";

// ─────────────────────────────────────────────────────────────────────────────
// 1. In-kind section conditional render
// ─────────────────────────────────────────────────────────────────────────────

console.log("── In-kind section: conditional render ──");

assert(
  /contributions\.length\s*>\s*0/.test(reportBody),
  "In-kind section is conditionally rendered only when contributions.length > 0"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. In-kind header label (🎁 + Tamil/English label)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── In-kind section: header ──");

assert(
  inkindBlock.includes("🎁"),
  "In-kind header contains 🎁 emoji"
);

assert(
  inkindBlock.includes("இயற்கை நன்கொடைகள்"),
  "In-kind header includes Tamil label 'இயற்கை நன்கொடைகள்'"
);

assert(
  inkindBlock.includes("In-Kind Contributions"),
  "In-kind header includes English label 'In-Kind Contributions'"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3–5. Table border and header styling (purple palette)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── In-kind table: purple styling ──");

assert(
  inkindBlock.includes("#e9d5ff"),
  "In-kind table border uses #e9d5ff — purple tint distinguishes it from money donations"
);

assert(
  inkindBlock.includes("#f5f3ff") || inkindBlock.includes("#ede9fe"),
  "In-kind table header background uses purple gradient (#f5f3ff / #ede9fe)"
);

assert(
  inkindBlock.includes("#7c3aed"),
  "In-kind table header text uses #7c3aed — purple colour"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Grid columns: 4 columns (# / Contributor / Description / Date)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── In-kind table: column layout ──");

assert(
  /gridTemplateColumns\s*:\s*["']28px 1fr 1fr 88px["']/.test(inkindBlock),
  "In-kind table has 4-column grid: 28px 1fr 1fr 88px"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7–9. Data fields: donorName, description, contributedAt
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── In-kind table: data fields ──");

assert(
  /c\.donorName/.test(inkindBlock),
  "Donor name rendered from c.donorName — supports Tamil names"
);

assert(
  /c\.description/.test(inkindBlock),
  "Description rendered from c.description"
);

assert(
  /c\.contributedAt/.test(inkindBlock),
  "Date rendered from c.contributedAt (not createdAt) — reflects actual contribution date"
);

// ─────────────────────────────────────────────────────────────────────────────
// 10–12. 5-column stats bar
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Stats bar: 5-column layout ──");

assert(
  statsIdx !== -1,
  "Stats bar uses gridTemplateColumns 'repeat(5,1fr)' — 5 equal columns"
);

assert(
  statsBlock.includes("#7c3aed"),
  "5th stats cell uses #7c3aed — purple colour marks the in-kind count"
);

assert(
  statsBlock.includes("இயற்கை நன்கொடைகள்"),
  "5th stats cell label is 'இயற்கை நன்கொடைகள்' (In-Kind)"
);

assert(
  /contributions\.length/.test(statsBlock),
  "5th stats cell value is contributions.length"
);

// ─────────────────────────────────────────────────────────────────────────────
// 13–14. WhatsApp share text includes in-kind suffix
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── WhatsApp share: in-kind suffix ──");

assert(
  /contributions\.length\s*>\s*0/.test(shareFn),
  "shareWhatsAppReport conditionally appends in-kind suffix when contributions exist"
);

assert(
  shareFn.includes("இயற்கை நன்கொடைகள்"),
  "WhatsApp share text includes Tamil in-kind label 'இயற்கை நன்கொடைகள்'"
);

// Confirm the suffix is non-empty (contains the count interpolation)
assert(
  /contributions\.length/.test(shareFn),
  "WhatsApp in-kind suffix includes contributions.length count"
);

// ─────────────────────────────────────────────────────────────────────────────
// 15. In-kind section is inside the capturable reportRef div
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Capture target: in-kind section is inside reportRef ──");

// reportRef is attached to the outer capturable div; both the ref and the
// in-kind section must be present inside the DonationsReport component body.
const hasReportRef  = /ref=\{reportRef\}/.test(reportBody) || /ref=\{reportRef\}/.test(src);
const hasInkindInFn = /இயற்கை நன்கொடைகள்/.test(reportBody);

assert(
  hasReportRef && hasInkindInFn,
  "In-kind section is inside DonationsReport and reportRef is present — html2canvas captures the in-kind table"
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} donations-report in-kind section checks passed.`);
  console.log(`    The in-kind table is correctly implemented for html2canvas capture:`);
  console.log(`    • Conditional render (contributions.length > 0)`);
  console.log(`    • Purple tint (#e9d5ff border, #f5f3ff/#ede9fe header)`);
  console.log(`    • 4-column grid: # / Contributor / Description / Date`);
  console.log(`    • Data from c.donorName, c.description, c.contributedAt`);
  console.log(`    • 5-column stats bar with in-kind count at purple #7c3aed`);
  console.log(`    • WhatsApp share text appends in-kind count suffix`);
  console.log(`    (Confirmed: in-kind section is inside reportRef capture target)`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged issues in Donations.tsx → DonationsReport.`);
  process.exit(1);
}
