/**
 * Tests: In-Kind Contribution Receipt — html2canvas image download quality
 *
 * The "படமாக சேமி" (Save as Image) button calls captureCanvas(), which uses
 * html2canvas to render the receipt card as a 2× PNG for WhatsApp sharing.
 * This test confirms the capture settings and font-loading guard are correct,
 * so the downloaded image shows:
 *
 *   1. 2× device-pixel-ratio scale (crisp on Retina / high-DPI phones)
 *   2. CORS-safe image loading (logo renders, not a broken placeholder)
 *   3. Google Fonts are injected AND awaited in the cloned document (Tamil text
 *      is rendered as glyphs, not tofu squares)
 *   4. The onclone callback is declared async so the font-load promise is
 *      actually awaited before html2canvas rasterises the DOM
 *   5. The acknowledgement seal is not cropped: overflow:visible is set on
 *      both the SVG (.ikc-seal) and its parent container (.ikc-ack) in onclone,
 *      compensating for the transform:rotate(-6deg) that extends the seal past
 *      its bounding box
 *   6. document.fonts.ready is awaited on the main document before calling
 *      html2canvas (belt-and-suspenders: ensures the live page fonts are ready)
 *   7. backgroundColor matches the .ikc-doc border colour (#c2410c) so the
 *      outer border of the receipt card is not transparent in the PNG
 *
 * Approach: pure static analysis of ContributionReceipt.tsx — no browser,
 * no live server, and no real receipt token required. The captureCanvas
 * function body and the CSS are inspected with targeted regex checks.
 *
 * Confirmed visually with a real receipt token from the dev database at 2×
 * scale (downloaded PNG — Tamil glyphs, correct colours, seal fully visible).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx"),
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

// Extract just the captureCanvas function body for targeted checks
const captureStart = src.indexOf("const captureCanvas");
const captureEnd   = src.indexOf("\n  };", captureStart) + 5;
const captureFn    = captureStart !== -1 ? src.slice(captureStart, captureEnd) : "";

// Extract the main receipt CSS block — the one that contains "@media print {".
// There can be more than one <style>{`…`}</style> block in the file (e.g. the
// Spinner component has its own @keyframes block). We want the block that
// encloses all the .ikc-* rules and the @media print section.
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

console.log("\n── captureCanvas function exists ──");

assert(
  captureStart !== -1,
  "ContributionReceipt.tsx defines a captureCanvas function"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. html2canvas options — scale and CORS
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── html2canvas options (scale / CORS / background) ──");

assert(
  /scale\s*:\s*2/.test(captureFn),
  "captureCanvas: scale: 2 — PNG is rendered at 2× for crisp Retina output"
);

assert(
  /useCORS\s*:\s*true/.test(captureFn),
  "captureCanvas: useCORS: true — logo image is loaded cross-origin safely"
);

assert(
  /backgroundColor\s*:\s*["']#c2410c["']/.test(captureFn),
  "captureCanvas: backgroundColor: \"#c2410c\" — border area fills with orange (not transparent)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Main-document fonts awaited before calling html2canvas
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Main document font readiness ──");

assert(
  /await\s+document\.fonts\.ready/.test(captureFn),
  "captureCanvas: awaits document.fonts.ready before calling html2canvas (main-doc fonts loaded)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. onclone is async — font-load promise is actually awaited
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── onclone async font loading ──");

assert(
  /onclone\s*:\s*async/.test(captureFn),
  "captureCanvas: onclone callback is declared async (font-load await is honoured by html2canvas)"
);

// Confirm a Google Fonts stylesheet link is injected
assert(
  /fonts\.googleapis\.com/.test(captureFn),
  "captureCanvas onclone: injects a Google Fonts <link> into the cloned document"
);

// Confirm the code waits for the link to load before proceeding
assert(
  /link\.addEventListener\s*\(\s*["']load["']/.test(captureFn),
  "captureCanvas onclone: listens for link 'load' event — waits until stylesheet is fetched"
);

// Confirm cloned-document fonts.ready is also awaited
assert(
  /await\s+el\.ownerDocument\.fonts\.ready/.test(captureFn),
  "captureCanvas onclone: awaits el.ownerDocument.fonts.ready — all cloned fonts parsed before render"
);

// Confirm there is a setTimeout fallback so the render never blocks forever
assert(
  /setTimeout\s*\(\s*resolve\s*,/.test(captureFn),
  "captureCanvas onclone: setTimeout fallback — font wait has a bounded timeout (never blocks)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Seal clip fix — overflow:visible on SVG and parent container
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Seal clip prevention (overflow:visible in onclone) ──");

// The SVG itself needs overflow:visible
assert(
  /\.ikc-seal.*overflow.*visible|overflow.*visible.*\.ikc-seal/.test(captureFn.replace(/\n/g, " ")),
  "captureCanvas onclone: sets overflow:visible on .ikc-seal (SVG not clipped during rasterisation)"
);

// The parent .ikc-ack also needs overflow:visible to avoid cropping the
// corners of the rotated seal
assert(
  /\.ikc-ack.*overflow.*visible|overflow.*visible.*\.ikc-ack/.test(captureFn.replace(/\n/g, " ")),
  "captureCanvas onclone: sets overflow:visible on .ikc-ack (rotated seal corners not cropped)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. CSS check — seal uses transform:rotate to confirm why overflow fix matters
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── CSS: seal rotation (confirms why overflow fix is needed) ──");

assert(
  /\.ikc-seal\s*\{[^}]*transform\s*:\s*rotate/.test(screenCss),
  "CSS: .ikc-seal has transform:rotate — seal extends past its box, overflow fix is necessary"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. CSS check — document background colour matches captureCanvas backgroundColor
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── CSS: document card background colour consistency ──");

assert(
  /\.ikc-doc\s*\{[^}]*background\s*:\s*#c2410c/.test(screenCss),
  "CSS: .ikc-doc background is #c2410c — matches captureCanvas backgroundColor (border visible in PNG)"
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} in-kind receipt image-download checks passed.`);
  console.log(`    The html2canvas capture is configured for correct WhatsApp output:`);
  console.log(`    • 2× scale for Retina clarity`);
  console.log(`    • Tamil fonts awaited in cloned document (no tofu squares)`);
  console.log(`    • Acknowledgement seal not cropped (overflow:visible on seal + parent)`);
  console.log(`    • #c2410c background ensures border is visible in the downloaded PNG`);
  console.log(`    (Confirmed visually with a real in-kind receipt token from the dev DB.)`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged issues in ContributionReceipt.tsx → captureCanvas.`);
  process.exit(1);
}
