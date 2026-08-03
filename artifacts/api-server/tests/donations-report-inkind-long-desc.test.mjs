/**
 * Tests: DonationsReport — in-kind description cell overflow containment
 *
 * The in-kind contributions table uses a 4-column grid ("28px 1fr 1fr 88px").
 * The description column is the second `1fr` cell.  Without explicit overflow
 * containment a 200+ character description can push the cell — and therefore the
 * entire row — outside the report container, breaking the html2canvas capture at
 * 2.5× scale.
 *
 * This test confirms via static analysis that the description cell carries
 * sufficient overflow protection so long descriptions are contained:
 *
 *   1. The in-kind description cell has `overflow: "hidden"` (or overflow:hidden)
 *   2. The in-kind description cell has `textOverflow: "ellipsis"` (or text-overflow:ellipsis)
 *   3. The in-kind description cell has `whiteSpace: "nowrap"` (or white-space:nowrap)
 *      — this prevents the cell from wrapping to multiple lines and expanding the row
 *
 * Any one of these rules alone is not enough: overflow:hidden clips the text but
 * without whiteSpace:nowrap the cell can still grow taller; without textOverflow
 * there is no visual cue that text was clipped.  All three together guarantee
 * the description stays on one line and does not blow out the table layout at
 * any DPI scale.
 *
 * Pure static-analysis test — no live server or browser required.
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
// Extract DonationsReport component body
// ─────────────────────────────────────────────────────────────────────────────

const reportStart = src.indexOf("function DonationsReport(");
const reportEnd   = src.indexOf("\nfunction ", reportStart + 1);
const reportBody  = reportStart !== -1
  ? src.slice(reportStart, reportEnd !== -1 ? reportEnd : src.length)
  : "";

assert(reportStart !== -1, "DonationsReport component is present in Donations.tsx");

// ─────────────────────────────────────────────────────────────────────────────
// Locate the description cell within the in-kind table
// ─────────────────────────────────────────────────────────────────────────────

// Find the in-kind contributions section (starts at the "In-Kind Contributions
// section" comment or falls back to the Tamil label).
const inkindIdx = (() => {
  const byComment = reportBody.indexOf("In-Kind Contributions section");
  const byLabel   = reportBody.indexOf("இயற்கை நன்கொடைகள்");
  const best = byComment !== -1 ? byComment : byLabel;
  return best;
})();

assert(inkindIdx !== -1, "In-kind Contributions section is present inside DonationsReport");

// Slice out enough of the in-kind block to cover the full table JSX (~3 KB).
const inkindBlock = inkindIdx !== -1
  ? reportBody.slice(inkindIdx, inkindIdx + 3000)
  : "";

// ─────────────────────────────────────────────────────────────────────────────
// Locate the description span/element within the in-kind table rows
// (the element that renders c.description)
// ─────────────────────────────────────────────────────────────────────────────

// Find the position of c.description inside the in-kind block.
const descIdx = inkindBlock.indexOf("c.description");
assert(descIdx !== -1, "c.description is rendered inside the in-kind table");

// Extract a ~500-char window centred on the c.description reference — enough
// to include its enclosing style prop.
const descWindow = descIdx !== -1
  ? inkindBlock.slice(Math.max(0, descIdx - 300), descIdx + 200)
  : "";

// ─────────────────────────────────────────────────────────────────────────────
// Check 1 — overflow: hidden on the description element
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Description cell: overflow containment ──");

assert(
  /overflow\s*:\s*["']?hidden/.test(descWindow),
  "Description cell has overflow:hidden — long text cannot expand the grid cell"
);

// ─────────────────────────────────────────────────────────────────────────────
// Check 2 — textOverflow: ellipsis on the description element
// ─────────────────────────────────────────────────────────────────────────────

assert(
  /textOverflow\s*:\s*["']?ellipsis|text-overflow\s*:\s*ellipsis/.test(descWindow),
  "Description cell has textOverflow:ellipsis — clipped text is visually indicated"
);

// ─────────────────────────────────────────────────────────────────────────────
// Check 3 — whiteSpace: nowrap on the description element
// ─────────────────────────────────────────────────────────────────────────────

assert(
  /whiteSpace\s*:\s*["']?nowrap|white-space\s*:\s*nowrap/.test(descWindow),
  "Description cell has whiteSpace:nowrap — description stays on a single line"
);

// ─────────────────────────────────────────────────────────────────────────────
// Check 4 — the four-column grid is present (layout unchanged)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── In-kind table: grid structure unchanged ──");

assert(
  /gridTemplateColumns\s*:\s*["']28px 1fr 1fr 88px["']/.test(inkindBlock),
  "In-kind table still uses 4-column grid '28px 1fr 1fr 88px' — layout is intact"
);

// ─────────────────────────────────────────────────────────────────────────────
// Check 5 — the description column is a 1fr column (not a fixed-width)
// ─────────────────────────────────────────────────────────────────────────────

// Confirm the grid definition contains "1fr 1fr" (two flex columns for
// contributor and description) — this is what allows the cell to shrink.
assert(
  /1fr 1fr/.test(inkindBlock),
  "Description column is a 1fr column — combined with overflow:hidden it caps at available space"
);

// ─────────────────────────────────────────────────────────────────────────────
// Check 6 — 200-char description guard: style attributes allow containment
// (The three styles together guarantee a 200-char description stays within bounds)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Combined containment for 200+ character descriptions ──");

const hasOverflow     = /overflow\s*:\s*["']?hidden/.test(descWindow);
const hasEllipsis     = /textOverflow\s*:\s*["']?ellipsis/.test(descWindow);
const hasNowrap       = /whiteSpace\s*:\s*["']?nowrap/.test(descWindow);

assert(
  hasOverflow && hasEllipsis && hasNowrap,
  "All three containment rules are present together (overflow+ellipsis+nowrap) — " +
  "a 200+ char description cannot break the table layout or affect the html2canvas output dimensions"
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} in-kind report long-description layout checks passed.`);
  console.log(`    The description cell in DonationsReport's in-kind table has:`);
  console.log(`    • overflow: hidden — text cannot push the cell wider`);
  console.log(`    • textOverflow: ellipsis — clipping is visually indicated`);
  console.log(`    • whiteSpace: nowrap — description stays on one line`);
  console.log(`    A 200+ character description will not break the table layout`);
  console.log(`    or affect the html2canvas PNG output dimensions at 2.5× scale.`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Add overflow/textOverflow/whiteSpace to the description cell`);
  console.error(`    in DonationsReport's in-kind table (Donations.tsx).`);
  process.exit(1);
}
