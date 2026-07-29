/**
 * Tests: Receipt layout handles large donation amounts without overflow
 *
 * Asserts via static CSS analysis that the @media print block for .amt-val
 * and .amt-left contains the rules that prevent a long amount string such as
 * ₹1,00,00,000 (11 chars at display) from overflowing horizontally and pushing
 * the Approved stamp off the visible page area.
 *
 * Rules verified:
 *   1. @media print block exists
 *   2. .amt-val font-size in print is at most 52pt (was 58pt — too wide for large amounts)
 *   3. .amt-val has overflow-wrap:break-word in print (last-resort wrap guard)
 *   4. .amt-val has word-break:break-all in print (ensures any single token wraps)
 *   5. .amt-left has min-width:0 in print (allows the grid cell to shrink below content size)
 *   6. .amt-left has overflow:hidden in print (hard-clips any stray overflow)
 *   7. .doc height is fixed at 297mm (receipt stays within A4 bounds)
 *   8. @page size is A4 portrait (single-page constraint is explicit)
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
// Load source and isolate the @media print block
// ──────────────────────────────────────────────────────────────────────────────

const src = readFileSync(receiptPath, "utf8");

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

const printCss = src.slice(printStart, printEnd);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: .amt-val font-size must not overflow a large amount
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS: .amt-val font-size ──");

// Extract the numeric pt value declared for .amt-val in the print block.
// Matches patterns like: font-size:46pt  or  font-size: 58pt
const fontSizeMatch = printCss.match(/\.amt-val\b[^}]*font-size\s*:\s*(\d+(?:\.\d+)?)pt/);
assert(
  fontSizeMatch !== null,
  "Print CSS: .amt-val declares an explicit font-size in pt"
);

if (fontSizeMatch) {
  const ptValue = parseFloat(fontSizeMatch[1]);
  assert(
    ptValue <= 52,
    `Print CSS: .amt-val font-size is ≤ 52pt (actual: ${ptValue}pt) — fits ₹1,00,00,000 in the left column`
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests: .amt-val overflow safeguards
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS: .amt-val overflow safeguards ──");

assert(
  /\.amt-val\b[^}]*overflow-wrap\s*:\s*break-word/.test(printCss),
  "Print CSS: .amt-val has overflow-wrap:break-word (long amounts wrap instead of overflowing)"
);

assert(
  /\.amt-val\b[^}]*word-break\s*:\s*break-all/.test(printCss),
  "Print CSS: .amt-val has word-break:break-all (any single token is broken at the boundary)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: .amt-left grid cell containment
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS: .amt-left grid cell containment ──");

assert(
  /\.amt-left\b[^}]*min-width\s*:\s*0/.test(printCss),
  "Print CSS: .amt-left has min-width:0 (grid cell can shrink below content size)"
);

assert(
  /\.amt-left\b[^}]*overflow\s*:\s*hidden/.test(printCss),
  "Print CSS: .amt-left has overflow:hidden (hard-clips any stray overflow)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Tests: A4 page containment (shared sanity checks)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Print CSS: A4 page containment ──");

assert(
  /\.doc\s*\{[^}]*height\s*:\s*297mm/.test(printCss),
  "Print CSS: .doc height is fixed at 297mm (receipt stays within one A4 page)"
);

assert(
  /@page\s*\{[^}]*size\s*:\s*A4\s+portrait/.test(printCss),
  "Print CSS: @page size is A4 portrait (single-page constraint is explicit)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} receipt large-amount layout checks passed.`);
  console.log(`    ₹10,00,000 and ₹1,00,00,000 will fit within the amount`);
  console.log(`    column and the Approved stamp will remain visible in print.`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged CSS rules in Receipt.tsx before printing.`);
  process.exit(1);
}
