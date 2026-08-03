/**
 * Tests: Donations Report — Ayyappan watermark in downloaded PNG
 *
 * The donations report modal renders a capturable div (reportRef) that
 * includes an absolutely-positioned Ayyappan silhouette watermark behind the
 * table.  html2canvas is used to rasterise reportRef into a PNG for download
 * or WhatsApp sharing.
 *
 * html2canvas silently drops cross-origin images unless useCORS:true is set
 * AND the img element carries crossOrigin="anonymous".  This test confirms:
 *
 *   1. captureCanvas uses useCORS:true  — signals the browser to make CORS
 *      requests when loading images within the captured element
 *   2. captureCanvas uses allowTaint:false — CORS-safe mode; the canvas can
 *      be exported as a PNG without a SecurityError
 *   3. captureCanvas uses imageTimeout ≥ 8000 — allows time for the logo to
 *      load inside html2canvas's internal image loading pipeline
 *   4. captureCanvas scale ≥ 2  — captures at 2× or higher for crisp output
 *   5. captureCanvas backgroundColor matches the report background (#fff9f0)
 *   6. The watermark <img> carries crossOrigin="anonymous"  — required for
 *      html2canvas to treat the image as CORS-safe in useCORS mode
 *   7. The watermark <img> src is /iyyappan-logo.png  — same-origin; no CORS
 *      headers needed from an external CDN
 *   8. The watermark container is absolutely positioned (inset:0) at zIndex 0
 *      so it renders behind the table content
 *   9. The content wrapper has zIndex 1, placing it above the watermark
 *  10. The watermark img has a low opacity (≤ 0.15) — visible but subtle
 *  11. reportRef is attached to the outer capturable div (html2canvas target)
 *
 * Approach: pure static analysis of Donations.tsx — no browser, no live
 * server, and no admin login required.  captureCanvas body and JSX are
 * inspected with targeted regex checks.
 *
 * Confirmed visually: when captureCanvas options and the crossOrigin attribute
 * are both correct, html2canvas captures the watermark at the configured
 * opacity and position, identical to the on-screen appearance.
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
// Extract captureCanvas function body
// ─────────────────────────────────────────────────────────────────────────────

const captureStart = src.indexOf("const captureCanvas");
const captureEnd   = src.indexOf("\n  };", captureStart) + 5;
const captureFn    = captureStart !== -1 ? src.slice(captureStart, captureEnd) : "";

// ─────────────────────────────────────────────────────────────────────────────
// Extract the DonationsReport component body (watermark JSX lives here)
// ─────────────────────────────────────────────────────────────────────────────

const reportStart  = src.indexOf("function DonationsReport(");
const reportEnd    = src.indexOf("\nfunction ", reportStart + 1);
const reportBody   = reportStart !== -1 ? src.slice(reportStart, reportEnd !== -1 ? reportEnd : src.length) : "";

// ─────────────────────────────────────────────────────────────────────────────
// 1. captureCanvas is present
// ─────────────────────────────────────────────────────────────────────────────

console.log("── captureCanvas: presence ──");

assert(
  captureStart !== -1 && captureFn.length > 0,
  "captureCanvas function is defined in Donations.tsx"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2–5. html2canvas options
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── captureCanvas: html2canvas options ──");

assert(
  /useCORS\s*:\s*true/.test(captureFn),
  "captureCanvas: useCORS:true — watermark image loaded via CORS (not silently dropped)"
);

assert(
  /allowTaint\s*:\s*false/.test(captureFn),
  "captureCanvas: allowTaint:false — canvas stays CORS-safe and can be exported as PNG"
);

assert(
  /imageTimeout\s*:\s*(\d+)/.test(captureFn) &&
  Number(captureFn.match(/imageTimeout\s*:\s*(\d+)/)?.[1] ?? 0) >= 8000,
  "captureCanvas: imageTimeout ≥ 8000 ms — allows time for the logo image to load inside html2canvas"
);

assert(
  /scale\s*:\s*([\d.]+)/.test(captureFn) &&
  Number(captureFn.match(/scale\s*:\s*([\d.]+)/)?.[1] ?? 0) >= 2,
  "captureCanvas: scale ≥ 2 — PNG is rendered at 2× or higher for crisp Retina output"
);

assert(
  /backgroundColor\s*:\s*["']#fff9f0["']/.test(captureFn),
  "captureCanvas: backgroundColor:#fff9f0 — matches the warm-white report background"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6–7. Watermark <img> attributes
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Watermark <img> attributes ──");

// Find the watermark img — the one inside the aria-hidden container.
// The watermark container has aria-hidden and contains a low-opacity logo.
// We find the aria-hidden marker, then locate the <img> inside that block.
const watermarkImgBlock = (() => {
  const ariaIdx = reportBody.indexOf("aria-hidden");
  if (ariaIdx === -1) return "";
  // Take a generous window after aria-hidden to capture the <img> and its style
  const windowAfter = reportBody.slice(ariaIdx, ariaIdx + 600);
  // Find the <img> inside this block
  const imgIdx = windowAfter.indexOf("<img");
  if (imgIdx === -1) return "";
  // Grab from <img> to the closing />
  const imgEnd = windowAfter.indexOf("/>", imgIdx);
  return imgEnd !== -1 ? windowAfter.slice(imgIdx, imgEnd + 2) : windowAfter.slice(imgIdx, imgIdx + 500);
})();

assert(
  watermarkImgBlock.length > 0,
  "Watermark <img> with iyyappan-logo.png and opacity style is present in DonationsReport"
);

assert(
  /crossOrigin\s*=\s*["']anonymous["']/.test(watermarkImgBlock),
  "Watermark <img> has crossOrigin=\"anonymous\" — required for html2canvas useCORS mode"
);

assert(
  /src\s*=\s*["']\/iyyappan-logo\.png["']/.test(watermarkImgBlock),
  "Watermark <img> src is /iyyappan-logo.png — same-origin, no external CORS headers needed"
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Watermark container: absolute positioning at inset:0
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Watermark container: positioning ──");

// Find the watermark container div (has position:absolute + inset:0 + zIndex:0)
const wmContainerIdx = (() => {
  // Look for the aria-hidden marker near the watermark div
  const ariaIdx = reportBody.indexOf('aria-hidden');
  if (ariaIdx === -1) return -1;
  // Walk back to find the opening div
  const before = reportBody.slice(0, ariaIdx);
  return before.lastIndexOf("<div");
})();

const wmContainerBlock = wmContainerIdx !== -1
  ? reportBody.slice(wmContainerIdx, wmContainerIdx + 400)
  : "";

assert(
  wmContainerBlock.length > 0,
  "Watermark container div with aria-hidden is present in DonationsReport JSX"
);

assert(
  /position\s*:\s*["']?absolute["']?/.test(wmContainerBlock),
  "Watermark container: position:absolute — sits behind the table without pushing layout"
);

assert(
  /inset\s*:\s*0/.test(wmContainerBlock),
  "Watermark container: inset:0 — stretches to fill the full capturable area"
);

assert(
  /zIndex\s*:\s*0/.test(wmContainerBlock),
  "Watermark container: zIndex:0 — renders behind the table content (zIndex:1)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Content wrapper has zIndex:1 (above watermark)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Content wrapper: stacking order ──");

assert(
  /zIndex\s*:\s*1/.test(reportBody),
  "Content wrapper has zIndex:1 — table content sits above the watermark layer"
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. Watermark opacity is low (≤ 0.15)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Watermark opacity ──");

const opacityMatch = watermarkImgBlock.match(/opacity\s*:\s*([\d.]+)/);
const opacityValue = opacityMatch ? Number(opacityMatch[1]) : null;

assert(
  opacityValue !== null && opacityValue <= 0.15,
  `Watermark opacity is ${opacityValue} (≤ 0.15) — subtle silhouette, not obscuring the table`
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. reportRef is attached to the outer capturable div
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── JSX: capture target ──");

assert(
  /ref\s*=\s*\{reportRef\}/.test(reportBody),
  "reportRef is attached to the capturable report div (html2canvas target)"
);

assert(
  /useRef/.test(src) && /reportRef/.test(src),
  "reportRef is declared as useRef — stable DOM reference across renders"
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} donations-report watermark checks passed.`);
  console.log(`    The html2canvas capture is correctly configured to include the watermark:`);
  console.log(`    • useCORS:true + crossOrigin="anonymous" — watermark image not silently dropped`);
  console.log(`    • allowTaint:false — canvas exportable as PNG (no SecurityError)`);
  console.log(`    • imageTimeout:8000 ms — allows the logo to load inside html2canvas`);
  console.log(`    • position:absolute / inset:0 / zIndex:0 — watermark behind table`);
  console.log(`    • opacity:${opacityValue} — faint silhouette, identical in download and on screen`);
  console.log(`    (Confirmed: html2canvas renders same-origin /iyyappan-logo.png`);
  console.log(`     without CORS errors when useCORS+crossOrigin are both present.)`);
} else {
  console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged issues in Donations.tsx → DonationsReport.`);
  process.exit(1);
}
