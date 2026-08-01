/**
 * Tests: In-Kind Contribution Receipt — Tamil glyph rendering in html2canvas PNG
 *
 * The previous `inkind-receipt-image-download.test.mjs` is pure static analysis of
 * captureCanvas().  It cannot catch a runtime regression where the font-load guard
 * inside the onclone callback is silently broken and Tamil text renders as tofu
 * squares (□) in the downloaded WhatsApp image.
 *
 * This test runs html2canvas inside a real headless Chromium browser and inspects
 * the actual canvas pixels.  The core design decision that makes it a genuine
 * production guard:
 *
 *   THE ONCLONE CALLBACK IS EXTRACTED FROM THE SHARED PRODUCTION MODULE.
 *   ContributionReceipt.tsx imports ikcCaptureOnClone from
 *   @/lib/ikc-capture.ts and uses it as the html2canvas onclone callback.
 *   This test reads the same ikc-capture.ts source file, extracts the
 *   ikcCaptureOnClone function body, strips TypeScript type annotations, and
 *   injects the result verbatim into the page script.  Any change to the
 *   production onclone (including removing the `fonts.ready` await or
 *   changing the font URL) is automatically reflected in this test on the
 *   next run — the test and the component always use the identical logic.
 *
 * Additional design decisions:
 *
 *   - The page CSS includes the production @import (mirrors the production DOM
 *     that ContributionReceipt.tsx renders; see ContributionReceipt.tsx style
 *     block).  This warm-starts the browser font cache so the onclone's
 *     `await el.ownerDocument.fonts.ready` has fonts to wait for.
 *
 *   - The centre-row pixel test is applied to a CROP of the html2canvas
 *     canvas at the .ikc-donor-name element's bounding box (×scale).
 *     Real Tamil glyph strokes cross the centre row → many dark pixels.
 *     Tofu squares (□) are hollow → centre row is pale background → 0.
 *
 *   - capture scale and backgroundColor are read directly from ikc-capture.ts
 *     exports (IKC_CAPTURE_SCALE, IKC_CAPTURE_BACKGROUND) via regex so the
 *     static checks track the production values automatically.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname   = dirname(fileURLToPath(import.meta.url));

// Paths to the files that define production behaviour
const IKC_CAPTURE_PATH = resolve(
  __dirname, "../../ayyappan-temple/src/lib/ikc-capture.ts"
);
const RECEIPT_PATH = resolve(
  __dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx"
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

function finish(label) {
  console.log(`\n${"─".repeat(60)}`);
  if (failed === 0) {
    console.log(`✅  All ${passed} ${label} checks passed.`);
  } else {
    console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Read ikc-capture.ts — the SHARED PRODUCTION MODULE
//    ContributionReceipt.tsx imports ikcCaptureOnClone from this exact file.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Reading shared production module: ikc-capture.ts ──");

const ikcCaptureSrc = readFileSync(IKC_CAPTURE_PATH, "utf8");

assert(ikcCaptureSrc.length > 500, "ikc-capture.ts read successfully");

// ── Verify ContributionReceipt.tsx imports from the shared module ─────────────
// If someone moves captureCanvas logic back inline, this check fires, which
// is the signal to re-sync the test with the production code.
const receiptSrc = readFileSync(RECEIPT_PATH, "utf8");
assert(
  receiptSrc.includes("from \"@/lib/ikc-capture\"") ||
  receiptSrc.includes("from '@/lib/ikc-capture'"),
  "ContributionReceipt.tsx imports ikcCaptureOnClone from @/lib/ikc-capture"
);
assert(
  receiptSrc.includes("ikcCaptureOnClone"),
  "ContributionReceipt.tsx uses ikcCaptureOnClone as the html2canvas onclone callback"
);

// ── Extract IKC_CAPTURE_SCALE ─────────────────────────────────────────────────
const scaleMatch   = ikcCaptureSrc.match(/IKC_CAPTURE_SCALE\s*=\s*(\d+)/);
const captureScale = scaleMatch ? Number(scaleMatch[1]) : null;
assert(captureScale === 2, `IKC_CAPTURE_SCALE: ${captureScale} === 2`);

// ── Extract IKC_CAPTURE_BACKGROUND ────────────────────────────────────────────
const bgMatch           = ikcCaptureSrc.match(/IKC_CAPTURE_BACKGROUND\s*=\s*"(#[0-9a-fA-F]+)"/);
const captureBackground = bgMatch ? bgMatch[1].toLowerCase() : null;
assert(captureBackground === "#c2410c", `IKC_CAPTURE_BACKGROUND: "${captureBackground}" === "#c2410c"`);

// ── Extract ikcCaptureOnClone function verbatim ────────────────────────────────
//
// Structure in ikc-capture.ts:
//   export async function ikcCaptureOnClone(_clonedDoc: Document, el: HTMLElement): Promise<void> {
//     ...body...
//   }
//
// We locate the function keyword, find the opening brace after it, then
// walk characters counting brace depth until the matching close brace.

const fnKeyword   = "async function ikcCaptureOnClone";
const fnStart     = ikcCaptureSrc.indexOf(fnKeyword);
const bodyOpenIdx = ikcCaptureSrc.indexOf("{", fnStart);

let depth = 1;
let bodyCloseIdx = bodyOpenIdx;
for (let i = bodyOpenIdx + 1; i < ikcCaptureSrc.length; i++) {
  const ch = ikcCaptureSrc[i];
  if (ch === "{") depth++;
  if (ch === "}") { depth--; if (depth === 0) { bodyCloseIdx = i; break; } }
}

// Slice from the "async function" keyword to the closing "}"
const fnSrcRaw = ikcCaptureSrc.slice(fnStart, bodyCloseIdx + 1);

assert(
  fnSrcRaw.includes("fonts.ready"),
  "ikcCaptureOnClone includes el.ownerDocument.fonts.ready await"
);
assert(
  fnSrcRaw.includes("Noto+Serif+Tamil"),
  "ikcCaptureOnClone includes Noto Serif Tamil font URL"
);

// Strip TypeScript type annotations so the function is valid JavaScript.
// Patterns present in the function:
//   _clonedDoc: Document            →  _clonedDoc
//   el: HTMLElement                 →  el
//   ): Promise<void> {              →  ) {
//   new Promise<void>(              →  new Promise(
//   querySelector<SVGElement>(      →  querySelector(
//   querySelector<HTMLElement>(     →  querySelector(
const oncloneJs = fnSrcRaw
  .replace(/_clonedDoc\s*:\s*Document\b/g,    "_clonedDoc")
  .replace(/\bel\s*:\s*HTMLElement\b/g,       "el")
  .replace(/\)\s*:\s*Promise<void>\s*\{/,     ") {")
  .replace(/Promise<void>/g,                  "Promise")
  .replace(/querySelector<[^>]+>/g,           "querySelector");

assert(
  !oncloneJs.includes(": Document") &&
  !oncloneJs.includes(": HTMLElement") &&
  !oncloneJs.includes(": Promise") &&
  !oncloneJs.includes("<void>"),
  "TypeScript annotations stripped from ikcCaptureOnClone"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Read screen CSS from ContributionReceipt.tsx (the CSS the receipt renders)
//    The @import is KEPT — it mirrors the production DOM and warm-starts the
//    browser font cache, which is required for the onclone fonts.ready to have
//    something to wait for when html2canvas clones the document.
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_TOKEN  = "<style>{`";
const CLOSE_TOKEN = "`}</style>";

let styleOpen = -1;
{
  let pos = 0;
  while (true) {
    const idx = receiptSrc.indexOf(OPEN_TOKEN, pos);
    if (idx === -1) break;
    const closeIdx  = receiptSrc.indexOf(CLOSE_TOKEN, idx);
    const candidate = closeIdx !== -1 ? receiptSrc.slice(idx + OPEN_TOKEN.length, closeIdx) : "";
    if (candidate.includes("@media print {")) { styleOpen = idx; break; }
    pos = idx + OPEN_TOKEN.length;
  }
}
const styleClose = styleOpen !== -1 ? receiptSrc.indexOf(CLOSE_TOKEN, styleOpen) : -1;

assert(styleOpen !== -1 && styleClose !== -1, "CSS block with @media print located");

const fullCss    = receiptSrc.slice(styleOpen + OPEN_TOKEN.length, styleClose);
const printStart = fullCss.indexOf("@media print {");
const screenCss  = (printStart !== -1 ? fullCss.slice(0, printStart) : fullCss).trim();

assert(screenCss.includes("@import"), "Screen CSS contains @import (font warm-up, matches production)");
assert(screenCss.length > 500, `Screen CSS ready (${screenCss.length} bytes)`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Load html2canvas UMD bundle from the local pnpm store
// ─────────────────────────────────────────────────────────────────────────────

const H2C_PATH  = resolve(
  __dirname,
  "../../../node_modules/.pnpm/html2canvas@1.4.1/node_modules/html2canvas/dist/html2canvas.min.js"
);
const h2cBundle = readFileSync(H2C_PATH, "utf8");
assert(h2cBundle.length > 100_000, `html2canvas bundle loaded (${h2cBundle.length} bytes)`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Build the standalone HTML page
//
//    The page uses:
//      • screenCss (with @import)    — production CSS including font warm-up
//      • captureScale / captureBackground — from IKC_CAPTURE_SCALE/BACKGROUND
//      • oncloneJs                   — ikcCaptureOnClone extracted from
//                                      ikc-capture.ts (TypeScript stripped)
//
//    The page script runs html2canvas with the same options that
//    ContributionReceipt.tsx uses.  Any change to ikc-capture.ts is
//    automatically reflected here.
// ─────────────────────────────────────────────────────────────────────────────

const DONOR_NAME  = "முருகேசன் ராமசுவாமி";
const PLACE       = "Vadamadurai, Tamil Nadu";
const DESCRIPTION = "அரிசி 50 கிலோ நைவேத்தியத்திற்காக";
const RECEIPT_NO  = "IKC-000001";
const DATE_EN     = "01 Aug 2026";
const DATE_TA     = "01 ஆகஸ்ட் 2026";

const scaleJson  = JSON.stringify(captureScale);
const bgJson     = JSON.stringify(captureBackground);
// pageScript is built as a plain string — no backtick template literals —
// so there is no risk of the extracted CSS or JS source closing a template.
const pageScript =
`(async function runCapture() {
  // Belt-and-suspenders font wait on the main document — mirrors captureCanvas()
  // in ContributionReceipt.tsx (which also calls await document.fonts.ready
  // before html2canvas).
  await document.fonts.ready;

  const docEl = document.getElementById("ikc-doc");

  // html2canvas options: scale and backgroundColor from IKC_CAPTURE_SCALE /
  // IKC_CAPTURE_BACKGROUND; onclone is ikcCaptureOnClone extracted verbatim
  // from ikc-capture.ts with TypeScript annotations stripped.
  const canvas = await html2canvas(docEl, {
    scale:           ${scaleJson},
    useCORS:         true,
    allowTaint:      false,
    backgroundColor: ${bgJson},
    imageTimeout:    0,
    logging:         false,
    onclone: ${oncloneJs},
  });

  window._capturedCanvas  = canvas;
  window._captureComplete = true;
})();`;

// Build the HTML using array join — avoids any template-literal nesting risk
// from the injected CSS and script content.
const htmlParts = [
  '<!DOCTYPE html>\n<html lang="ta">\n<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=560,initial-scale=1">',
  '<title>IKC Receipt Tamil Glyph Test</title>',
  '<style>',
  screenCss,
  '/* Override page min-height so the fixture is not taller than its content */',
  '.ikc-pg { min-height: unset; }',
  '</style>',
  '</head>',
  '<body style="margin:0;padding:0;background:#fff7ed;">',
  '',
  '<!-- Receipt element — mirrors the DOM produced by ContributionReceipt.tsx -->',
  '<div class="ikc-doc" id="ikc-doc">',
  '  <div class="ikc-doc-inner">',
  '',
  '    <div class="ikc-hdr">',
  '      <div class="ikc-hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>',
  '      <div class="ikc-hdr-ta">\u0b85\u0bb0\u0bc1\u0bb3\u0bcd\u0bae\u0bbf\u0b95\u0bc1 \u0bb8\u0bcd\u0bb0\u0bc0 \u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0ba9\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bcb\u0bb5\u0bbf\u0bb2\u0bcd</div>',
  '      <div class="ikc-hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>',
  '      <div><span class="ikc-hdr-pill">\u2756 &nbsp;\u0bb8\u0bcd\u0bb5\u0bbe\u0bae\u0bbf\u0baf\u0bc7 \u0b9a\u0bb0\u0ba3\u0bae\u0bcd \u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0bbe&nbsp; \u2756</span></div>',
  '    </div>',
  '',
  '    <div class="ikc-strip">',
  '      <div class="ikc-strip-line"></div>',
  '      <span class="ikc-strip-en">In-Kind Contribution &nbsp;&middot;&nbsp; \u0baa\u0bca\u0bb0\u0bc1\u0bb3\u0bcd \u0ba8\u0ba9\u0bcd\u0b95\u0bca\u0b9f\u0bc8 \u0bb0\u0b9a\u0bc0\u0ba4\u0bc1</span>',
  '      <div class="ikc-strip-line r"></div>',
  '    </div>',
  '',
  '    <div class="ikc-bless">',
  '      <div class="ikc-bless-sub">\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b95\u0bc1\u0b9f\u0bc1\u0bae\u0bcd\u0baa\u0ba4\u0bcd\u0ba4\u0bbf\u0bb1\u0bcd\u0b95\u0bc1\u0bae\u0bcd</div>',
  '      <div class="ikc-bless-main">\u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0ba9\u0bcd \u0b85\u0bb0\u0bc1\u0bb3\u0bcd \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd, \u0ba8\u0bb2\u0bcd\u0bb2\u0ba4\u0bc7 \u0ba8\u0b9f\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd \ud83d\ude4f</div>',
  '    </div>',
  '',
  '    <div class="ikc-meta">',
  '      <div class="ikc-mc">',
  '        <div class="ikc-mc-lbl">Receipt No.</div>',
  '        <div class="ikc-mc-no">' + RECEIPT_NO + '</div>',
  '      </div>',
  '      <div class="ikc-mc-sep"></div>',
  '      <div class="ikc-mc r">',
  '        <div class="ikc-mc-lbl">Date</div>',
  '        <div class="ikc-mc-date">' + DATE_EN + '</div>',
  '        <div class="ikc-mc-date-ta">' + DATE_TA + '</div>',
  '      </div>',
  '    </div>',
  '',
  '    <!-- DONOR HERO — primary Tamil glyph region for the pixel check -->',
  '    <div class="ikc-donor">',
  '      <div class="ikc-donor-lbl">\u0ba8\u0ba9\u0bcd\u0b95\u0bca\u0b9f\u0bc8\u0baf\u0bbe\u0bb3\u0bb0\u0bcd \u0bb5\u0bbf\u0bb5\u0bb0\u0bae\u0bcd &nbsp;&middot;&nbsp; Contributor Details</div>',
  '      <div class="ikc-donor-name" id="donor-name">' + DONOR_NAME + '</div>',
  '      <div class="ikc-donor-place">\ud83d\udccd &nbsp;' + PLACE + '</div>',
  '    </div>',
  '',
  '    <div class="ikc-desc-wrap">',
  '      <div class="ikc-desc-icon">\ud83c\udf81</div>',
  '      <div class="ikc-desc-body">',
  '        <div class="ikc-desc-lbl">\u2756 &nbsp;Contribution Details &nbsp;&middot;&nbsp; \u0ba8\u0ba9\u0bcd\u0b95\u0bca\u0b9f\u0bc8 \u0bb5\u0bbf\u0bb5\u0bb0\u0bae\u0bcd&nbsp; \u2756</div>',
  '        <div class="ikc-desc-text">' + DESCRIPTION + '</div>',
  '      </div>',
  '    </div>',
  '',
  '    <div class="ikc-ack" id="ack">',
  '      <div class="ikc-ack-text">',
  '        <div class="ikc-ack-lbl">Official Acknowledgement &nbsp;&middot;&nbsp; \u0b89\u0ba4\u0bcd\u0ba4\u0bbf\u0baf\u0bcb\u0b95\u0baa\u0bc2\u0bb0\u0bcd\u0bb5 \u0b92\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bc8</div>',
  '        <div class="ikc-ack-ta">\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0bca\u0bb0\u0bc1\u0bb3\u0bcd \u0ba8\u0ba9\u0bcd\u0b95\u0bca\u0b9f\u0bc8 \u0b95\u0bcb\u0bb5\u0bbf\u0bb2\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0b95<br>\u0bae\u0b95\u0bbf\u0bb4\u0bcd\u0b9a\u0bcd\u0b9a\u0bbf\u0baf\u0bc1\u0b9f\u0ba9\u0bcd \u0b8f\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bcd\u0b95\u0bca\u0bb3\u0bcd\u0bb3\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1</div>',
  '      </div>',
  '      <svg class="ikc-seal" id="ikc-seal" width="150" height="150" viewBox="0 0 150 150"',
  '           xmlns="http://www.w3.org/2000/svg">',
  '        <defs>',
  '          <path id="ikc-arc" d="M 8,57.5 A 68,68 0 0,1 142,57.5"/>',
  '        </defs>',
  '        <circle cx="75" cy="75" r="72" fill="#fff7ed"/>',
  '        <circle cx="75" cy="75" r="72" fill="none" stroke="#c2410c" stroke-width="3"/>',
  '        <circle cx="75" cy="75" r="63" fill="none" stroke="#c2410c" stroke-width="1.5"/>',
  '        <circle cx="75" cy="75" r="58" fill="none" stroke="#ea580c"',
  '                stroke-width="0.8" stroke-dasharray="4 3.5"/>',
  '        <text font-family="\'Noto Serif Tamil\',serif" font-size="7.5"',
  '              fill="#c2410c" font-weight="700">',
  '          <textPath href="#ikc-arc" startOffset="50%" text-anchor="middle">',
  '            \u0bb8\u0bcd\u0bb5\u0bbe\u0bae\u0bbf\u0baf\u0bc7 \u0b9a\u0bb0\u0ba3\u0bae\u0bcd \u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0bbe',
  '          </textPath>',
  '        </text>',
  '        <text x="75" y="78" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="17" font-weight="900" fill="#c2410c">\u0bb5\u0b9f\u0bae\u0ba4\u0bc1\u0bb0\u0bc8</text>',
  '        <text x="75" y="93" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="11" font-weight="700" fill="#9a3412">\u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0ba9\u0bcd \u0b95\u0bcb\u0bb5\u0bbf\u0bb2\u0bcd</text>',
  '        <text x="75" y="107" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="9.5" font-weight="700" fill="#9a3412">\u0ba4\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0ba3\u0bbf \u0b95\u0bc1\u0bb4\u0bc1</text>',
  '        <text x="75" y="124" text-anchor="middle"',
  '              font-family="sans-serif" font-size="8"',
  '              fill="#ea580c" letter-spacing="5">\u25c6\u25c6\u25c6</text>',
  '      </svg>',
  '    </div>',
  '',
  '    <div class="ikc-ftr">',
  '      <div class="ikc-ftr-issued">Receipt Issued By &nbsp;&middot;&nbsp; \u0bb5\u0bb4\u0b99\u0bcd\u0b95\u0bbf\u0baf\u0bb5\u0bb0\u0bcd\u0b95\u0bb3\u0bcd</div>',
  '      <div class="ikc-ftr-org-ta">\u0bb5\u0b9f\u0bae\u0ba4\u0bc1\u0bb0\u0bc8 \u0b90\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0ba9\u0bcd \u0ba4\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0ba3\u0bbf \u0b95\u0bc1\u0bb4\u0bc1</div>',
  '      <div class="ikc-ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>',
  '      <div class="ikc-ftr-rcpt">Official receipt &nbsp;&middot;&nbsp; ' + RECEIPT_NO + ' &nbsp;&middot;&nbsp; ' + DATE_EN + '</div>',
  '    </div>',
  '',
  '  </div>',
  '</div>',
  '',
  '<!-- html2canvas — served as /h2c.js by the test server (no CDN or CDN risk) -->',
  '<script src="/h2c.js"></script>',
  '<script>',
  pageScript,
  '</script>',
  '</body>',
  '</html>',
];
const html = htmlParts.join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// 5. Serve the HTML and the html2canvas bundle from a local HTTP server
// ─────────────────────────────────────────────────────────────────────────────

let serverPort = null;
const server   = createServer((req, res) => {
  if (req.url === "/h2c.js") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(h2cBundle);
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", () => {
  serverPort = server.address().port;
  resolve();
}));
const url = `http://127.0.0.1:${serverPort}/`;
console.log(`\n  Serving test page at ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Resolve headless Chromium path
// ─────────────────────────────────────────────────────────────────────────────

function resolveChromiumPath() {
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}
const NIXOS_CHROMIUM = resolveChromiumPath();

// ─────────────────────────────────────────────────────────────────────────────
// 7. Open in headless Chromium, run html2canvas, collect pixel statistics
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Opening page in headless Chromium & running html2canvas ──");

const { chromium } = await import("playwright");

let browser  = null;
let pixStats = null;

try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 600, height: 900 } });
  const page    = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // The production onclone (ikcCaptureOnClone) injects Google Fonts and awaits
  // el.ownerDocument.fonts.ready — allow up to 12 s for network + rasterise.
  console.log("  Waiting for html2canvas capture (up to 12 s)…");
  await page.waitForFunction(() => window._captureComplete === true, {
    timeout: 12_000,
    polling: 200,
  });
  console.log("  html2canvas capture complete.");

  // ── Collect pixel statistics from the html2canvas canvas ─────────────────
  //
  // All measurements are taken from window._capturedCanvas — the actual output
  // of html2canvas after the production ikcCaptureOnClone ran in the clone.
  //
  // captureScale is passed as an argument: page.evaluate() cannot close over
  // Node.js-scope variables.
  pixStats = await page.evaluate((scale) => {
    const h2cCanvas = window._capturedCanvas;
    if (!h2cCanvas) return null;

    const ctx = h2cCanvas.getContext("2d");
    const cw  = h2cCanvas.width;
    const ch  = h2cCanvas.height;

    function countNearColor(imgData, tr, tg, tb, tol) {
      const d = imgData.data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i]   - tr) <= tol &&
            Math.abs(d[i+1] - tg) <= tol &&
            Math.abs(d[i+2] - tb) <= tol) n++;
      }
      return n;
    }

    // ── A. Full-canvas orange pixel count ─────────────────────────────────────
    const fullData         = ctx.getImageData(0, 0, cw, ch);
    const orangePixelCount = countNearColor(fullData, 194, 65, 12, 25);

    // ── B. Donor-name crop: centre-row dark-pixel count ───────────────────────
    //
    // .ikc-donor-name renders "முருகேசன் ராமசுவாமி" in:
    //   font-family: 'Noto Serif Tamil', serif  (via production ikcCaptureOnClone)
    //   font-size:   26px → 52px at scale:2
    //   color:       #7c2d12  (dark reddish, rgb ≈ 124 45 18)
    //   background:  pale-yellow gradient  (luminance ≈ 240–250)
    //
    // We crop the html2canvas canvas at the element bounding box (×scale),
    // then sample the HORIZONTAL CENTRE ROW of that crop.
    //
    // Real Tamil glyphs (ikcCaptureOnClone loaded fonts correctly):
    //   Noto Serif Tamil character strokes have filled bodies.  Each of the
    //   5–7 rendered clusters contributes several dark pixels at the midpoint.
    //   Empirical count: 300–400 dark pixels.
    //
    // Tofu squares □ (ikcCaptureOnClone broken — fonts not loaded):
    //   Each □ box is hollow.  The centre row sits inside the pale-yellow
    //   interior.  Luminance ≈ 245 for every pixel → 0 dark pixels.
    let donorCropStats = null;
    const donorEl = document.getElementById("donor-name");
    const docEl   = document.getElementById("ikc-doc");
    if (donorEl && docEl) {
      const docRect = docEl.getBoundingClientRect();
      const dRect   = donorEl.getBoundingClientRect();
      const dx = Math.max(0, Math.floor((dRect.left - docRect.left) * scale));
      const dy = Math.max(0, Math.floor((dRect.top  - docRect.top)  * scale));
      const dw = Math.min(cw - dx, Math.ceil(dRect.width  * scale));
      const dh = Math.min(ch - dy, Math.ceil(dRect.height * scale));
      if (dw > 0 && dh > 0) {
        const crop    = ctx.getImageData(dx, dy, dw, dh);
        const centreY = Math.floor(dh / 2);
        let darkInCentre = 0;
        for (let x = 0; x < dw; x++) {
          const i   = (centreY * dw + x) * 4;
          const lum = 0.299 * crop.data[i] +
                      0.587 * crop.data[i + 1] +
                      0.114 * crop.data[i + 2];
          if (lum < 200) darkInCentre++;
        }
        donorCropStats = { cropW: dw, cropH: dh, centreY, darkInCentre };
      }
    }

    // ── C. Seal region orange pixel count ─────────────────────────────────────
    let sealStats = null;
    const sealEl = document.getElementById("ikc-seal");
    if (sealEl && docEl) {
      const docRect  = docEl.getBoundingClientRect();
      const sealRect = sealEl.getBoundingClientRect();
      const sx = Math.max(0, Math.floor((sealRect.left - docRect.left) * scale));
      const sy = Math.max(0, Math.floor((sealRect.top  - docRect.top)  * scale));
      // Extend 30 px beyond the element to capture corners rotated by
      // ikcCaptureOnClone's overflow:visible fix for transform:rotate(-6deg)
      const sw = Math.min(cw - sx, Math.ceil(sealRect.width  * scale) + 60);
      const sh = Math.min(ch - sy, Math.ceil(sealRect.height * scale) + 60);
      if (sw > 0 && sh > 0) {
        const sealData       = ctx.getImageData(sx, sy, sw, sh);
        const sealOrangePixels = countNearColor(sealData, 194, 65, 12, 35);
        sealStats = { w: sw, h: sh, orangePixels: sealOrangePixels };
      }
    }

    return { canvasWidth: cw, canvasHeight: ch, orangePixelCount, donorCropStats, sealStats };
  }, captureScale);

} finally {
  if (browser) await browser.close();
  server.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Assert on pixel statistics
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Pixel statistics from html2canvas canvas ──");

assert(pixStats !== null, "html2canvas completed and canvas is accessible");
if (!pixStats) finish("in-kind receipt Tamil glyph rendering");

console.log(`  Canvas:        ${pixStats.canvasWidth} × ${pixStats.canvasHeight} px`);
console.log(`  Orange pixels: ${pixStats.orangePixelCount}`);
if (pixStats.donorCropStats) {
  const dc = pixStats.donorCropStats;
  console.log(`  Donor crop:    ${dc.cropW} × ${dc.cropH} px  |  ` +
              `centre row y=${dc.centreY}  |  dark in centre: ${dc.darkInCentre}`);
}
if (pixStats.sealStats) {
  console.log(`  Seal region:   ${pixStats.sealStats.w} × ${pixStats.sealStats.h} px  |  ` +
              `orange pixels: ${pixStats.sealStats.orangePixels}`);
}

// ── Check 1: scale from IKC_CAPTURE_SCALE applied ────────────────────────────

console.log(`\n── Check 1: Canvas dimensions (scale:${captureScale} from IKC_CAPTURE_SCALE) ──`);

assert(
  pixStats.canvasWidth >= 540 * captureScale &&
  pixStats.canvasWidth <= 580 * captureScale,
  `Canvas width (${pixStats.canvasWidth} px) ∈ [${540 * captureScale}, ${580 * captureScale}] — ` +
  `IKC_CAPTURE_SCALE:${captureScale} applied correctly`
);
assert(
  pixStats.canvasHeight >= 800,
  `Canvas height (${pixStats.canvasHeight} px) ≥ 800 — receipt fully rendered`
);

// ── Check 2: Tamil glyphs in html2canvas canvas at donor-name crop ────────────
//
// This check validates that ikcCaptureOnClone (the production shared module)
// correctly loaded Tamil fonts in the cloned document before html2canvas
// rasterised the DOM.  The measurement is taken from the actual html2canvas
// canvas, not from a separate Canvas 2D draw, so it exercises the production
// cloned-document font path directly.

console.log("\n── Check 2: Tamil glyph rendering in html2canvas output ──");
console.log("  Source: ikcCaptureOnClone extracted verbatim from ikc-capture.ts.");
console.log("  Crop:   .ikc-donor-name bounding box mapped to canvas coordinates.");
console.log("  Sample: horizontal CENTRE ROW of that html2canvas crop.");
console.log("  Real glyphs → filled strokes cross midpoint → ≥ 30 dark pixels.");
console.log("  Tofu (□)    → hollow interior at midpoint  →  0 dark pixels.");

assert(
  pixStats.donorCropStats !== null,
  ".ikc-donor-name element found and mapped to html2canvas canvas"
);

if (pixStats.donorCropStats) {
  const dc = pixStats.donorCropStats;
  // Threshold of 30 dark pixels in the centre row of the donor-name canvas crop:
  //   • Real Noto Serif Tamil at 52 px: filled strokes cross the midpoint.
  //     "முருகேசன் ராமசுவாமி" (5–7 clusters) → 300–400 dark pixels observed.
  //   • Tofu □ at 52 px: centre row is inside the hollow pale-yellow interior
  //     (luminance ≈ 245) → 0 dark pixels.
  //   The threshold cannot be satisfied by orange borders or gradient backgrounds
  //   because the donor section has a LIGHT background.
  assert(
    dc.darkInCentre >= 30,
    `html2canvas donor-name centre-row: ${dc.darkInCentre} dark pixels ≥ 30 — ` +
    `Tamil glyphs confirmed in html2canvas output via ikcCaptureOnClone ` +
    `(tofu □ would score 0 dark pixels at the centre row)`
  );
}

// ── Check 3: orange palette from IKC_CAPTURE_BACKGROUND ──────────────────────

console.log("\n── Check 3: Orange palette (IKC_CAPTURE_BACKGROUND) in html2canvas canvas ──");

assert(
  pixStats.orangePixelCount >= 500,
  `html2canvas canvas has ${pixStats.orangePixelCount} orange (${captureBackground} ±25) pixels ≥ 500 — ` +
  `receipt card background and border captured (not transparent)`
);

// ── Check 4: seal visible (ikcCaptureOnClone overflow:visible fix applied) ────

console.log("\n── Check 4: Acknowledgement seal not clipped ──");

assert(
  pixStats.sealStats !== null,
  ".ikc-seal element found and mapped to html2canvas canvas"
);
if (pixStats.sealStats) {
  assert(
    pixStats.sealStats.orangePixels >= 80,
    `Seal region: ${pixStats.sealStats.orangePixels} orange pixels ≥ 80 — ` +
    `seal circles visible; ikcCaptureOnClone overflow:visible prevents rotate-clipping`
  );
}

finish("in-kind receipt Tamil glyph rendering");
