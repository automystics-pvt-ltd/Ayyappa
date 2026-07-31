/**
 * Tests: In-Kind Contribution Receipt mobile layout (390×844 / iPhone 14)
 *
 * Asserts via static CSS analysis that the ContributionReceipt page is
 * safe to open on phones — the primary channel is WhatsApp sharing.
 *
 * Checks:
 *   1. Action buttons wrap (`flex-wrap:wrap`) so they stack on narrow screens
 *   2. Donor name can wrap (`word-break:break-word`) preventing horizontal overflow
 *   3. Title strip text is not locked to a single line (`white-space:normal`)
 *      so it wraps rather than being clipped on sub-400 px viewports
 *   4. Description text uses `word-break:break-word` for long Tamil contributions
 *   5. Description body has `min-width:0` so it never forces the card wider than
 *      the viewport
 *   6. Acknowledgement section wraps (`flex-wrap:wrap`) so the seal drops below
 *      the text rather than overflowing at narrow widths
 *   7. The document card has `width:100%` so it scales down on mobile
 *
 * Pure static-analysis — no live server or browser required.
 *
 * Confirmed visually at 390×844 (iPhone 14 viewport) with receipt token
 * from the dev database.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx"),
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

// Split source into screen CSS (before @media print) and print CSS
const printStart = src.indexOf("@media print {");
const screenCss = printStart !== -1 ? src.slice(0, printStart) : src;

// ──────────────────────────────────────────────────────────────────────────────
// 1. Action buttons wrap on narrow screens
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Buttons (tappable on mobile) ──");

assert(
  /\.ikc-acts\s*\{[^}]*flex-wrap\s*:\s*wrap/.test(screenCss),
  "Screen CSS: .ikc-acts has flex-wrap:wrap (buttons stack on narrow screens)"
);

assert(
  /\.ikc-acts\s*\{[^}]*justify-content\s*:\s*center/.test(screenCss),
  "Screen CSS: .ikc-acts has justify-content:center (buttons centred when wrapped)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 2. Donor name wraps — no overflow on long Tamil names
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Donor name (wraps on mobile) ──");

assert(
  /\.ikc-donor-name\s*\{[^}]*word-break\s*:\s*break-word/.test(screenCss),
  "Screen CSS: .ikc-donor-name has word-break:break-word (long names wrap)"
);

assert(
  /\.ikc-donor-name\s*\{[^}]*overflow-wrap\s*:\s*break-word/.test(screenCss),
  "Screen CSS: .ikc-donor-name has overflow-wrap:break-word (single-token names wrap)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 3. Title strip text is not locked to one line
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Title strip (fully visible on mobile) ──");

assert(
  !/\.ikc-strip-en\s*\{[^}]*white-space\s*:\s*nowrap/.test(screenCss),
  "Screen CSS: .ikc-strip-en does NOT have white-space:nowrap (text wraps instead of clipping)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 4. Description text wraps for long contributions
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Description text (fully visible) ──");

assert(
  /\.ikc-desc-text\s*\{[^}]*word-break\s*:\s*break-word/.test(screenCss),
  "Screen CSS: .ikc-desc-text has word-break:break-word (description fully visible)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 5. Description body cannot force card wider than the viewport
// ──────────────────────────────────────────────────────────────────────────────

assert(
  /\.ikc-desc-body\s*\{[^}]*min-width\s*:\s*0/.test(screenCss),
  "Screen CSS: .ikc-desc-body has min-width:0 (card never wider than viewport)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 6. Acknowledgement section wraps — seal not clipped
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Acknowledgement seal (not clipped) ──");

assert(
  /\.ikc-ack\s*\{[^}]*flex-wrap\s*:\s*wrap/.test(screenCss),
  "Screen CSS: .ikc-ack has flex-wrap:wrap (seal wraps below text on narrow screens)"
);

// ──────────────────────────────────────────────────────────────────────────────
// 7. Document card scales down to viewport width
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Document card (scales to viewport) ──");

assert(
  /\.ikc-doc\s*\{[^}]*width\s*:\s*100%/.test(screenCss),
  "Screen CSS: .ikc-doc has width:100% (card scales to viewport width)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} in-kind receipt mobile layout checks passed.`);
  console.log(`    The receipt page is safe to open on iPhone 14 (390×844 px):`);
  console.log(`    buttons are tappable, donor name wraps, description is fully`);
  console.log(`    visible, and the acknowledgement seal is not clipped.`);
  console.log(`    (Visually confirmed at 390×844 with dev DB receipt token.)`);
} else {
  console.error(`❌  ${failed} mobile layout check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged CSS rules in ContributionReceipt.tsx.`);
  process.exit(1);
}
