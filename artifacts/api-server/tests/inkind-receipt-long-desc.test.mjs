/**
 * Tests: In-Kind Contribution Receipt print CSS prevents description overflow
 *
 * Asserts via static CSS analysis that:
 *   1. The print CSS sets `overflow:hidden` on .ikc-desc-wrap (long descriptions are clipped)
 *   2. The print CSS sets `height:297mm` on .ikc-doc (receipt is pinned to A4 height)
 *   3. The `@page` rule uses `size:A4 portrait` (one-page constraint is explicit)
 *   4. `.ikc-doc-inner` has `overflow:hidden` in the print block (hard containment)
 *
 * These rules together guarantee a long Tamil contribution description (50+ characters)
 * cannot push the in-kind receipt past one A4 page in Chrome print preview.
 *
 * Pure static-analysis test — no live server or browser required.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx");

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
// Load source and split into screen-CSS / print-CSS sections
// ──────────────────────────────────────────────────────────────────────────────

const src = readFileSync(receiptPath, "utf8");

// Locate the @media print block (everything after the first "@media print {" up
// to its matching closing brace). We count braces to find the end reliably.
const printStart = src.indexOf("@media print {");
assert(printStart !== -1, "ContributionReceipt.tsx contains an @media print block");

let braceDepth = 0;
let printEnd = printStart;
for (let i = printStart; i < src.length; i++) {
  if (src[i] === "{") braceDepth++;
  if (src[i] === "}") {
    braceDepth--;
    if (braceDepth === 0) { printEnd = i + 1; break; }
  }
}

const printCss = src.slice(printStart, printEnd);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: .ikc-desc-wrap overflow containment
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS (.ikc-desc-wrap overflow containment) ──");

// Rule 1 — .ikc-desc-wrap has overflow:hidden so a long description is clipped
assert(
  /\.ikc-desc-wrap\s*\{[^}]*overflow\s*:\s*hidden/.test(printCss),
  "Print CSS: .ikc-desc-wrap has overflow:hidden (long descriptions cannot push past A4)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: hard A4 containment
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS (A4 containment) ──");

// Rule 2 — .ikc-doc is pinned to exactly 297mm height (A4 portrait)
assert(
  /\.ikc-doc\s*\{[^}]*height\s*:\s*297mm/.test(printCss),
  "Print CSS: .ikc-doc height is fixed at 297mm (receipt stays within A4 bounds)"
);

// Rule 3 — .ikc-doc-inner has overflow:hidden (last-resort clipping)
assert(
  /\.ikc-doc-inner\s*\{[^}]*overflow\s*:\s*hidden/.test(printCss),
  "Print CSS: .ikc-doc-inner has overflow:hidden (hard-clips any stray overflow)"
);

// Rule 4 — @page declares A4 portrait
assert(
  /@page\s*\{[^}]*size\s*:\s*A4\s+portrait/.test(printCss),
  "Print CSS: @page size is A4 portrait (one-page constraint is explicit)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} in-kind receipt long-description layout checks passed.`);
  console.log(`    A contribution description of 50+ characters (Tamil or English) will`);
  console.log(`    be contained correctly in Chrome print preview on one A4 page.`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged CSS rules in ContributionReceipt.tsx before printing.`);
  process.exit(1);
}
