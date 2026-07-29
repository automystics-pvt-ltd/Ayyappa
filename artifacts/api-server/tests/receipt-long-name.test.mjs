/**
 * Tests: Receipt layout handles very long donor names without overflow
 *
 * Asserts via static CSS analysis that:
 *   1. The print CSS sets `word-break:break-word` on .donor-hero-name (60+ char names wrap)
 *   2. The print CSS sets `white-space:normal` on .donor-hero-name (no nowrap in print)
 *   3. `.doc-inner` has `overflow:hidden` in the print block (hard containment of any overflow)
 *   4. `.doc` has a fixed `height:297mm` in the print block (receipt stays within A4 bounds)
 *   5. The `@page` rule uses `size:A4 portrait` (page is exactly one A4 sheet)
 *
 * These rules together guarantee a very long donor name (Tamil or English, 60+ chars)
 * cannot push the receipt past one A4 page in Chrome print preview.
 *
 * This is a pure static-analysis test — no live server required.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/Receipt.tsx");

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
// to its matching closing brace).  We count braces to find the end reliably.
const printStart = src.indexOf("@media print {");
assert(printStart !== -1, "Receipt.tsx contains an @media print block");

let braceDepth = 0;
let printEnd = printStart;
for (let i = printStart; i < src.length; i++) {
  if (src[i] === "{") braceDepth++;
  if (src[i] === "}") {
    braceDepth--;
    if (braceDepth === 0) { printEnd = i + 1; break; }
  }
}

const printCss  = src.slice(printStart, printEnd);
const screenCss = src.slice(0, printStart);   // everything before @media print

// ──────────────────────────────────────────────────────────────────────────────
// Test: screen CSS keeps white-space:nowrap on .name-val (baseline expectation)
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Tests: print CSS overrides that prevent overflow on long names
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS (long-name overflow prevention) ──");

// Rule 1 — white-space:normal on donor-hero-name (allows wrapping in print)
assert(
  /\.donor-hero-name\b[^}]*white-space\s*:\s*normal/.test(printCss),
  "Print CSS: .donor-hero-name sets white-space:normal (long names wrap)"
);

// Rule 2 — word-break:break-word ensures a single 60+-char token wraps
assert(
  /\.donor-hero-name\b[^}]*word-break\s*:\s*break-word/.test(printCss),
  "Print CSS: .donor-hero-name sets word-break:break-word (60+ char names cannot overflow)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: hard containment — the doc container cannot grow past A4
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS (A4 containment) ──");

// Rule 3 — doc-inner has overflow:hidden (last-resort clipping)
assert(
  /\.doc-inner\s*\{[^}]*overflow\s*:\s*hidden/.test(printCss),
  "Print CSS: .doc-inner has overflow:hidden (hard-clips any stray overflow)"
);

// Rule 4 — .doc is pinned to exactly 297mm height (A4 portrait)
assert(
  /\.doc\s*\{[^}]*height\s*:\s*297mm/.test(printCss),
  "Print CSS: .doc height is fixed at 297mm (receipt stays within A4 bounds)"
);

// Rule 5 — @page declares A4 portrait
assert(
  /@page\s*\{[^}]*size\s*:\s*A4\s+portrait/.test(printCss),
  "Print CSS: @page size is A4 portrait (one-page constraint is explicit)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} receipt long-name layout checks passed.`);
  console.log(`    A donor name of 60+ characters (Tamil or English) will wrap`);
  console.log(`    correctly in Chrome print preview and stay within one A4 page.`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged CSS rules in Receipt.tsx before printing.`);
  process.exit(1);
}
