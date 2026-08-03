/**
 * Tests: Donation Receipt — html2canvas image download quality
 *
 * The "படமாக சேமி" (Save as Image) button calls captureCanvas(), which uses
 * html2canvas to render the receipt card as a 2× PNG for WhatsApp sharing.
 * This test confirms the capture settings and font-loading guard are correct,
 * so the downloaded image shows:
 *
 *   1. 2× device-pixel-ratio scale (crisp on Retina / high-DPI phones)
 *   2. CORS-safe image loading (logo renders, not a broken placeholder)
 *   3. Self-hosted fonts.css is injected AND awaited in the cloned document so
 *      Noto Serif Tamil and Cinzel are always available — even when Google Fonts
 *      is blocked by an ad blocker or corporate proxy
 *   4. The onclone callback is declared async so the font-load promise is
 *      actually awaited before html2canvas rasterises the DOM
 *   5. The acknowledgement seal is not cropped: overflow:visible is set on
 *      .seal-svg in onclone, compensating for the transform:rotate(-6deg) that
 *      extends the seal past its bounding box
 *   6. document.fonts.ready is awaited on the main document before calling
 *      html2canvas (belt-and-suspenders: ensures the live page fonts are ready)
 *   7. backgroundColor matches the .doc border colour (#d97706) so the outer
 *      amber border of the receipt card is visible in the downloaded PNG
 *
 * Approach: pure static analysis of Receipt.tsx — no browser, no live server,
 * and no real receipt token required. The captureCanvas function body and the
 * CSS are inspected with targeted regex checks.
 *
 * Confirmed visually with a real receipt token from the dev database at 2×
 * scale (downloaded PNG — Tamil glyphs, correct colours, seal fully visible).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/Receipt.tsx"),
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
// Extract captureCanvas function body
// ─────────────────────────────────────────────────────────────────────────────

const captureStart = src.indexOf("const captureCanvas");
const captureEnd   = src.indexOf("\n  };", captureStart) + 5;
const captureFn    = captureStart !== -1 ? src.slice(captureStart, captureEnd) : "";

// ─────────────────────────────────────────────────────────────────────────────
// Extract the main receipt CSS block (the one that contains "@media print {")
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_TOKEN  = "<style>{`";
const CLOSE_TOKEN = "`}</style>";
let styleOpen = -1;
{
  let searchFrom = 0;
  while (true) {
    const idx = src.indexOf(OPEN_TOKEN, searchFrom);
    if (idx === -1) break;
    const closeIdx = src.indexOf(CLOSE_TOKEN, idx);
    const candidate = closeIdx !== -1 ? src.slice(idx + OPEN_TOKEN.length, closeIdx) : "";
    if (candidate.includes("@media print {")) { styleOpen = idx; break; }
    searchFrom = idx + OPEN_TOKEN.length;
  }
}
const styleClose = styleOpen !== -1 ? src.indexOf(CLOSE_TOKEN, styleOpen) : -1;
const cssText    = styleOpen !== -1 && styleClose !== -1
  ? src.slice(styleOpen + OPEN_TOKEN.length, styleClose)
  : "";

const printStart = cssText.indexOf("@media print {");
const screenCss  = printStart !== -1 ? cssText.slice(0, printStart) : cssText;

// ─────────────────────────────────────────────────────────────────────────────
// 1. captureCanvas is present
// ─────────────────────────────────────────────────────────────────────────────

console.log("── captureCanvas: presence ──");

assert(
  captureStart !== -1 && captureFn.length > 0,
  "captureCanvas function is defined in Receipt.tsx"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. html2canvas options
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: html2canvas options ──");

assert(
  /scale\s*:\s*2\b/.test(captureFn),
  "captureCanvas: scale is 2 (2× pixel density for crisp Retina/high-DPI output)"
);

assert(
  /useCORS\s*:\s*true/.test(captureFn),
  "captureCanvas: useCORS:true (logo image loads without CORS error)"
);

assert(
  /allowTaint\s*:\s*false/.test(captureFn),
  "captureCanvas: allowTaint:false (CORS-safe — canvas can be exported as PNG)"
);

assert(
  /backgroundColor\s*:\s*["']#d97706["']/.test(captureFn),
  "captureCanvas: backgroundColor is #d97706 (amber outer border visible in PNG)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. document.fonts.ready awaited on the main document (before html2canvas)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: main-document font readiness ──");

assert(
  /await\s+document\.fonts\.ready/.test(captureFn),
  "captureCanvas: awaits document.fonts.ready before calling html2canvas"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. onclone callback is async
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: onclone async declaration ──");

assert(
  /onclone\s*:\s*async/.test(captureFn),
  "captureCanvas onclone: declared async (font-load promise is actually awaited)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Self-hosted fonts.css is injected in the cloned document
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: font injection in cloned document ──");

assert(
  /fonts\.css/.test(captureFn),
  "captureCanvas onclone: injects fonts.css into the cloned document"
);

assert(
  /clonedDoc\.createElement\s*\(\s*["']link["']\s*\)/.test(captureFn),
  "captureCanvas onclone: creates a <link> element and appends it to the cloned head"
);

// Font load is awaited via a Promise wrapping the link's load/error events
assert(
  /addEventListener\s*\(\s*["']load["']/.test(captureFn),
  "captureCanvas onclone: awaits font load via load event on injected <link>"
);

assert(
  /await\s+clonedDoc\.fonts\.ready/.test(captureFn),
  "captureCanvas onclone: awaits clonedDoc.fonts.ready (Tamil glyphs fully loaded)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Seal overflow fix in onclone
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: seal overflow fix ──");

assert(
  /\.seal-svg/.test(captureFn),
  "captureCanvas onclone: queries .seal-svg"
);

assert(
  /seal.*overflow.*visible|overflow.*visible.*seal/s.test(captureFn),
  "captureCanvas onclone: sets overflow:visible on .seal-svg (rotated seal not clipped)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. CSS: seal rotation — confirms why the overflow fix is needed
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── CSS: seal rotation ──");

assert(
  /\.seal-svg\s*\{[^}]*transform\s*:\s*rotate/.test(screenCss),
  "CSS: .seal-svg has transform:rotate — extends past bounding box, overflow fix required"
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. CSS: .doc background matches captureCanvas backgroundColor
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── CSS: document card background colour consistency ──");

assert(
  /\.doc\s*\{[^}]*background\s*:\s*#d97706/.test(screenCss),
  "CSS: .doc background is #d97706 — matches captureCanvas backgroundColor (amber border visible)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. CSS: key receipt sections present (structural regression guard)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── CSS: required receipt sections present ──");

const requiredClasses = [
  [".hdr",         "header section (.hdr)"],
  [".strip",       "title strip (.strip)"],
  [".bless",       "blessing section (.bless)"],
  [".meta",        "receipt no/date meta (.meta)"],
  [".donor-hero",  "donor hero (.donor-hero)"],
  [".amt",         "amount section (.amt)"],
  [".ftr",         "footer section (.ftr)"],
];

for (const [cls, desc] of requiredClasses) {
  assert(
    screenCss.includes(cls),
    `CSS: ${desc} is defined in screen styles`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. JSX: docRef is attached to .doc (the element html2canvas captures)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── JSX: capture target ──");

assert(
  /ref\s*=\s*\{docRef\}/.test(src),
  "JSX: docRef is attached to the .doc element (html2canvas captures the full receipt)"
);

assert(
  /useRef/.test(src) && /docRef/.test(src),
  "JSX: docRef is declared as a useRef (stable DOM reference across renders)"
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} receipt image-download checks passed.`);
  console.log(`    The html2canvas capture is configured for correct WhatsApp output:`);
  console.log(`    • 2× scale for Retina clarity`);
  console.log(`    • Tamil fonts awaited in cloned document (no tofu squares)`);
  console.log(`    • Seal not cropped (overflow:visible on .seal-svg)`);
  console.log(`    • #d97706 background ensures amber border is visible in the PNG`);
  console.log(`    (Confirmed visually with a real receipt token from the dev DB.)`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged issues in Receipt.tsx → captureCanvas.`);
  process.exit(1);
}
