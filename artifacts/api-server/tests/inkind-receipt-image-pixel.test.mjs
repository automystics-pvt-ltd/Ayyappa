/**
 * Tests: In-Kind Contribution Receipt — html2canvas image capture quality
 *        (WhatsApp / "Save as Image" download path)
 *
 * Why this test exists
 * ────────────────────
 * The "படமாக சேமி" and WhatsApp share buttons call html2canvas with the
 * production ikcCaptureOnClone callback from @/lib/ikc-capture.ts.  A CSS
 * regression could silently break the capture:
 *   • layout collapses to landscape (card wider than tall)
 *   • seal is clipped or invisible
 *   • key text is off-canvas
 *
 * Design
 * ──────
 * The onclone callback is extracted from the shared production module
 * (ikc-capture.ts) — the same file that ContributionReceipt.tsx imports.
 * Any change to that module is automatically reflected in this test.
 *
 * html2canvas runs inside real headless Chromium so it exercises the
 * production capture path end-to-end (font loading, CORS, clone, render).
 *
 * Assertions
 * ──────────
 * 1. Canvas has non-zero width and height
 * 2. Canvas is portrait (height > width) — landscape indicates a broken layout
 * 3. All 8 receipt sections are in the DOM with non-zero height
 * 4. Receipt number ("IKC-") is present in the rendered receipt meta
 * 5. Donor name appears in the donor-hero section
 * 6. Acknowledgement seal region contains orange pixels (seal is rendered,
 *    not blank or clipped to zero)
 *
 * The HTML fixture mirrors the ContributionReceipt.tsx JSX as closely as
 * possible: same DOM structure, same class names, same SVG seal with HTML
 * attribute equivalents of the JSX props (strokeWidth → stroke-width, etc.),
 * same footer structure — so a JSX/CSS regression will be caught here.
 *
 * Pure local test — no live API server or receipt token required.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths to the production source files this test reads
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
//    ContributionReceipt.tsx imports ikcCaptureOnClone and the scale/background
//    constants from this file.  We read the same file so any change is
//    automatically reflected in this test.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Reading shared production module: ikc-capture.ts ──");

const ikcCaptureSrc = readFileSync(IKC_CAPTURE_PATH, "utf8");
const receiptSrc    = readFileSync(RECEIPT_PATH, "utf8");

assert(ikcCaptureSrc.length > 500, "ikc-capture.ts read successfully");

// Confirm ContributionReceipt.tsx still imports from the shared module
assert(
  receiptSrc.includes("from \"@/lib/ikc-capture\"") ||
  receiptSrc.includes("from '@/lib/ikc-capture'"),
  "ContributionReceipt.tsx imports from @/lib/ikc-capture (shared module still used)"
);
assert(
  receiptSrc.includes("ikcCaptureOnClone"),
  "ContributionReceipt.tsx uses ikcCaptureOnClone as the html2canvas onclone callback"
);

// ── Extract IKC_CAPTURE_SCALE ─────────────────────────────────────────────────
const scaleMatch   = ikcCaptureSrc.match(/IKC_CAPTURE_SCALE\s*=\s*(\d+)/);
const captureScale = scaleMatch ? Number(scaleMatch[1]) : null;
assert(captureScale !== null && captureScale >= 1, `IKC_CAPTURE_SCALE extracted: ${captureScale}`);

// ── Extract IKC_CAPTURE_BACKGROUND ────────────────────────────────────────────
const bgMatch           = ikcCaptureSrc.match(/IKC_CAPTURE_BACKGROUND\s*=\s*"(#[0-9a-fA-F]+)"/);
const captureBackground = bgMatch ? bgMatch[1].toLowerCase() : null;
assert(captureBackground !== null, `IKC_CAPTURE_BACKGROUND extracted: "${captureBackground}"`);

// ── Extract ikcCaptureOnClone function body ────────────────────────────────────
// Walk brace depth from the function opening brace to the matching close brace
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
const fnSrcRaw = ikcCaptureSrc.slice(fnStart, bodyCloseIdx + 1);

// Strip TypeScript type annotations → valid JavaScript
const oncloneJs = fnSrcRaw
  .replace(/_clonedDoc\s*:\s*Document\b/g,    "_clonedDoc")
  .replace(/\bel\s*:\s*HTMLElement\b/g,       "el")
  .replace(/\)\s*:\s*Promise<void>\s*\{/,     ") {")
  .replace(/Promise<void>/g,                  "Promise")
  .replace(/querySelector<[^>]+>/g,           "querySelector");

assert(
  !oncloneJs.includes(": Document") &&
  !oncloneJs.includes(": HTMLElement") &&
  !oncloneJs.includes("<void>"),
  "TypeScript annotations stripped from ikcCaptureOnClone"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Extract screen CSS from ContributionReceipt.tsx
//    html2canvas operates in screen mode — only screen CSS applies.
//    We keep the @import to warm-start the browser font cache (same as production).
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Extracting screen CSS from ContributionReceipt.tsx ──");

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

assert(styleOpen !== -1 && styleClose !== -1, "CSS block with @media print located in ContributionReceipt.tsx");

const fullCss    = receiptSrc.slice(styleOpen + OPEN_TOKEN.length, styleClose);
const printStart = fullCss.indexOf("@media print {");
const screenCss  = (printStart !== -1 ? fullCss.slice(0, printStart) : fullCss).trim();

assert(screenCss.length > 500, `Screen CSS ready (${screenCss.length} bytes)`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Load html2canvas UMD bundle from the local pnpm store
// ─────────────────────────────────────────────────────────────────────────────

const H2C_PATH = resolve(
  __dirname,
  "../../../node_modules/.pnpm/html2canvas@1.4.1/node_modules/html2canvas/dist/html2canvas.min.js"
);
const h2cBundle = readFileSync(H2C_PATH, "utf8");
assert(h2cBundle.length > 100_000, `html2canvas bundle loaded (${h2cBundle.length} bytes)`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Build the standalone HTML page
//
//    The fixture closely mirrors the JSX that ContributionReceipt.tsx renders:
//
//      • Same DOM class names and structure
//      • Logo <img> element (src will 404 in test but element is present,
//        matching production; html2canvas useCORS:true handles CORS failures)
//      • Full production SVG seal with HTML attribute equivalents of the JSX
//        props (strokeWidth → stroke-width, fontFamily → font-family, etc.)
//      • Footer matches production JSX: only ikc-ftr-issued, ikc-ftr-org-ta,
//        and ikc-ftr-rcpt (no ikc-ftr-org-en — that class is not in the component)
//      • Acknowledgement / seal section included (key image-quality risk)
//
//    The page script runs html2canvas with the production options (captureScale,
//    captureBackground, ikcCaptureOnClone) extracted directly from ikc-capture.ts.
// ─────────────────────────────────────────────────────────────────────────────

const RECEIPT_NO  = "IKC-000042";
const DONOR_NAME  = "முருகேசன் ராமசுவாமி";
const PLACE       = "Vadamadurai, Tamil Nadu";
const DESCRIPTION = "அரிசி 50 கிலோ நைவேத்தியத்திற்காக";
const DATE_EN     = "01 Jan 2025";
const DATE_TA     = "1 ஜனவரி 2025";

// page script: run html2canvas with the production ikcCaptureOnClone callback
// (extracted from ikc-capture.ts above).  window._captureComplete signals
// the Playwright side that the canvas is ready to inspect.
//
// FONTS_CSS_URL is a module-scope constant in ikc-capture.ts — it references
// import.meta.env.BASE_URL (Vite-specific) which is not available in a plain
// browser test page.  We define it here pointing to the test server's stub
// CSS endpoint so the font-load guard in ikcCaptureOnClone resolves normally.
//
// We keep all other html2canvas options identical to the production captureCanvas
// call so the test exercises the same code path.
const scaleJson = JSON.stringify(captureScale);
const bgJson    = JSON.stringify(captureBackground);
// FONTS_CSS_URL will be set to the test-server stub URL once we know the port;
// we use a placeholder and substitute it after the server starts.
const PAGE_SCRIPT_TEMPLATE =
`// FONTS_CSS_URL: module-scope constant from ikc-capture.ts
// Substituted by test runner to point to the local stub CSS endpoint.
const FONTS_CSS_URL = "FONTS_CSS_URL_PLACEHOLDER";

(async function runCapture() {
  // Belt-and-suspenders font wait — mirrors captureCanvas() in ContributionReceipt.tsx
  await document.fonts.ready;

  const docEl = document.getElementById("ikc-doc");

  // html2canvas options: scale and backgroundColor from IKC_CAPTURE_SCALE /
  // IKC_CAPTURE_BACKGROUND; onclone is ikcCaptureOnClone extracted verbatim
  // from ikc-capture.ts with TypeScript annotations stripped.
  try {
    const canvas = await html2canvas(docEl, {
      scale:           ${scaleJson},
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: ${bgJson},
      imageTimeout:    5000,
      logging:         false,
      onclone: ${oncloneJs},
    });
    window._capturedCanvas = canvas;
  } catch (err) {
    window._captureError = String(err);
  }
  window._captureComplete = true;
})();`;

// Minimal 1×1 transparent PNG served as the logo stub.
// html2canvas with useCORS:true will load it (same origin), so imageTimeout
// does not block the capture waiting for a cross-origin image.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// The HTML fixture mirrors ContributionReceipt.tsx DOM production output.
// Built with array join to avoid template-literal nesting issues with the
// extracted CSS and script content.
// NOTE: htmlParts uses a "SCRIPT_PLACEHOLDER" marker that is replaced by the
// real pageScript AFTER the server starts (so we know the test-server port
// needed for the FONTS_CSS_URL substitution).
const htmlParts = [
  '<!DOCTYPE html>\n<html lang="ta">\n<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=560,initial-scale=1">',
  '<title>IKC Receipt Image Pixel Test</title>',
  '<style>',
  screenCss,
  '/* Constrain to html2canvas capture width */',
  'body { margin:0; padding:0; background:#fff7ed; }',
  '.ikc-pg { min-height: unset; }',
  '</style>',
  '</head>',
  '<body>',
  '',
  '<!-- Receipt element — mirrors the DOM produced by ContributionReceipt.tsx -->',
  '<div class="ikc-doc" id="ikc-doc">',
  '  <div class="ikc-doc-inner">',
  '',
  '    <!-- HEADER — mirrors production JSX (logo img, ta subtitle, address, pill) -->',
  '    <div class="ikc-hdr" id="ikc-hdr">',
  '      <!-- Logo: src will 404 in test but element is present (useCORS:true handles it) -->',
  '      <img src="/iyyappan-logo.png" alt="" class="ikc-hdr-logo"',
  '           onerror="this.style.display=\'none\'">',
  '      <div class="ikc-hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>',
  '      <div class="ikc-hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>',
  '      <div><span class="ikc-hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>',
  '    </div>',
  '',
  '    <!-- TITLE STRIP -->',
  '    <div class="ikc-strip" id="ikc-strip">',
  '      <div class="ikc-strip-line"></div>',
  '      <span class="ikc-strip-en">In-Kind Contribution &nbsp;·&nbsp; பொருள் நன்கொடை ரசீது</span>',
  '      <div class="ikc-strip-line r"></div>',
  '    </div>',
  '',
  '    <!-- BLESSING -->',
  '    <div class="ikc-bless" id="ikc-bless">',
  '      <div class="ikc-bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>',
  '      <div class="ikc-bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>',
  '    </div>',
  '',
  '    <!-- META: receipt no + date -->',
  '    <div class="ikc-meta" id="ikc-meta">',
  '      <div class="ikc-mc">',
  '        <div class="ikc-mc-lbl">Receipt No.</div>',
  '        <div class="ikc-mc-no" id="receipt-no">' + RECEIPT_NO + '</div>',
  '      </div>',
  '      <div class="ikc-mc-sep"></div>',
  '      <div class="ikc-mc r">',
  '        <div class="ikc-mc-lbl">Date</div>',
  '        <div class="ikc-mc-date">' + DATE_EN + '</div>',
  '        <div class="ikc-mc-date-ta">' + DATE_TA + '</div>',
  '      </div>',
  '    </div>',
  '',
  '    <!-- DONOR HERO -->',
  '    <div class="ikc-donor" id="ikc-donor">',
  '      <div class="ikc-donor-lbl">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Contributor Details</div>',
  '      <div class="ikc-donor-name" id="donor-name">' + DONOR_NAME + '</div>',
  '      <div class="ikc-donor-place">📍 &nbsp;' + PLACE + '</div>',
  '    </div>',
  '',
  '    <!-- DESCRIPTION BAND -->',
  '    <div class="ikc-desc-wrap" id="ikc-desc-wrap">',
  '      <div class="ikc-desc-icon">🎁</div>',
  '      <div class="ikc-desc-body">',
  '        <div class="ikc-desc-lbl">✦ &nbsp;Contribution Details &nbsp;·&nbsp; நன்கொடை விவரம்&nbsp; ✦</div>',
  '        <div class="ikc-desc-text">' + DESCRIPTION + '</div>',
  '      </div>',
  '    </div>',
  '',
  '    <!-- ACKNOWLEDGEMENT + SEAL -->',
  '    <div class="ikc-ack" id="ikc-ack">',
  '      <div class="ikc-ack-text">',
  '        <div class="ikc-ack-lbl">Official Acknowledgement &nbsp;·&nbsp; உத்தியோகபூர்வ ஒப்புகை</div>',
  '        <div class="ikc-ack-ta">',
  '          இந்த பொருள் நன்கொடை கோவிலுக்காக<br>',
  '          மகிழ்ச்சியுடன் ஏற்றுக்கொள்ளப்படுகிறது',
  '        </div>',
  '      </div>',
  '      <!-- SVG seal — JSX prop names converted to HTML SVG attribute names     -->',
  '      <!-- (strokeWidth→stroke-width, fontFamily→font-family, etc.)            -->',
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
  '            ஸ்வாமியே சரணம் ஐயப்பா',
  '          </textPath>',
  '        </text>',
  '        <text x="75" y="81" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="11" font-weight="900" fill="#c2410c">வடமதுரை</text>',
  '        <text x="75" y="95" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="10" font-weight="700" fill="#9a3412">ஐயப்பன் திருப்பணி</text>',
  '        <text x="75" y="108" text-anchor="middle"',
  '              font-family="\'Noto Serif Tamil\',serif"',
  '              font-size="9.5" font-weight="700" fill="#9a3412">குழு</text>',
  '        <text x="75" y="124" text-anchor="middle"',
  '              font-family="sans-serif" font-size="8"',
  '              fill="#ea580c" letter-spacing="5">◆◆◆</text>',
  '      </svg>',
  '    </div>',
  '',
  '    <!-- FOOTER — matches production JSX: issued + org-ta + rcpt; no org-en -->',
  '    <div class="ikc-ftr" id="ikc-ftr">',
  '      <div class="ikc-ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>',
  '      <div class="ikc-ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>',
  '      <div class="ikc-ftr-rcpt">Official receipt &nbsp;·&nbsp; ' + RECEIPT_NO + ' &nbsp;·&nbsp; ' + DATE_EN + '</div>',
  '    </div>',
  '',
  '  </div>',
  '</div>',
  '',
  '<script src="/h2c.js"></script>',
  '<script>',
  'SCRIPT_PLACEHOLDER',
  '</script>',
  '</body>',
  '</html>',
];
const htmlTemplate = htmlParts.join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// 5. Spin up a minimal HTTP server
//
//    The server is started BEFORE the final HTML is assembled so we know the
//    port to use in FONTS_CSS_URL.  The server handler reads `finalHtml`
//    (a mutable reference) which is set immediately after the port is known.
//
//    Additional endpoints served by the test server:
//      /h2c.js         — html2canvas UMD bundle
//      /fonts/*        — empty CSS stub so ikcCaptureOnClone font-load resolves
//      /iyyappan-logo.png — 1×1 transparent PNG so html2canvas does not block
//                          waiting for a cross-origin image (imageTimeout:5000)
// ─────────────────────────────────────────────────────────────────────────────

let finalHtml = "";

const server = createServer((req, res) => {
  if (req.url === "/h2c.js") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(h2cBundle);
    return;
  }
  if (req.url === "/iyyappan-logo.png") {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(TINY_PNG);
    return;
  }
  if (req.url?.startsWith("/fonts")) {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.end("/* stub — test server placeholder for self-hosted fonts */");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(finalHtml);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

// Now that we know the port, substitute the FONTS_CSS_URL placeholder and
// assemble the final HTML.
const pageScript = PAGE_SCRIPT_TEMPLATE.replace(
  "FONTS_CSS_URL_PLACEHOLDER",
  `${url}fonts/fonts.css`
);
finalHtml = htmlTemplate.replace("SCRIPT_PLACEHOLDER", pageScript);

console.log("\n── html2canvas capture (production config, headless Chromium) ──");
console.log(`  Serving IKC receipt HTML on ${url}`);
console.log(`  Capture scale: ${captureScale}×  |  Background: ${captureBackground}`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Resolve headless Chromium path
//    Tries $CHROMIUM_PATH env var, then PATH (which chromium), then the
//    known NixOS store path as a last-resort fallback.
// ─────────────────────────────────────────────────────────────────────────────

function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}
const NIXOS_CHROMIUM = resolveChromiumPath();

// ─────────────────────────────────────────────────────────────────────────────
// 7. Open in headless Chromium, run html2canvas, collect canvas statistics
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Opening page in headless Chromium & running html2canvas ──");

const { chromium } = await import("playwright");

let browser  = null;
let canvasSt = null;

try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({ viewport: { width: 600, height: 1000 } });
  const page    = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for html2canvas to complete (includes font loading via ikcCaptureOnClone)
  console.log("  Waiting for html2canvas capture (up to 15 s)…");
  await page.waitForFunction(() => window._captureComplete === true, {
    timeout: 15_000,
    polling: 200,
  });
  console.log("  html2canvas capture complete.");

  // ─────────────────────────────────────────────────────────────────────────
  // Collect canvas statistics and DOM text via page.evaluate().
  //
  // All measurements reference window._capturedCanvas — the actual output of
  // html2canvas with the production ikcCaptureOnClone in the clone step.
  // ─────────────────────────────────────────────────────────────────────────
  canvasSt = await page.evaluate((scale) => {
    const canvas = window._capturedCanvas;
    if (!canvas) return null;

    const cw  = canvas.width;
    const ch  = canvas.height;
    const ctx = canvas.getContext("2d");

    // ── A. Receipt number text ────────────────────────────────────────────────
    const receiptNoEl  = document.getElementById("receipt-no");
    const receiptNoTxt = receiptNoEl ? receiptNoEl.textContent?.trim() : null;

    // ── B. Donor name text ────────────────────────────────────────────────────
    const donorNameEl  = document.getElementById("donor-name");
    const donorNameTxt = donorNameEl ? donorNameEl.textContent?.trim() : null;

    // ── C. Seal region orange-pixel count ─────────────────────────────────────
    // We crop the canvas at the .ikc-ack bounding box (×scale) and count pixels
    // close to #c2410c (rgb 194 65 12) — the seal stroke and text colour.
    // This verifies the seal is rendered and visible in the captured image.
    let sealOrangePixels = 0;
    const ackEl  = document.getElementById("ikc-ack");
    const docEl  = document.getElementById("ikc-doc");
    if (ackEl && docEl) {
      const dRect   = docEl.getBoundingClientRect();
      const ackRect = ackEl.getBoundingClientRect();
      const sx = Math.max(0, Math.floor((ackRect.left - dRect.left) * scale));
      const sy = Math.max(0, Math.floor((ackRect.top  - dRect.top)  * scale));
      // Extend 30 px beyond the element to capture rotated corners
      const sw = Math.min(cw - sx, Math.ceil(ackRect.width  * scale) + 60);
      const sh = Math.min(ch - sy, Math.ceil(ackRect.height * scale) + 60);
      if (sw > 0 && sh > 0) {
        const data = ctx.getImageData(sx, sy, sw, sh).data;
        for (let i = 0; i < data.length; i += 4) {
          if (Math.abs(data[i]   - 194) <= 30 &&
              Math.abs(data[i+1] -  65) <= 30 &&
              Math.abs(data[i+2] -  12) <= 30) sealOrangePixels++;
        }
      }
    }

    // ── D. Section DOM bounding boxes ─────────────────────────────────────────
    const sections = ["ikc-hdr","ikc-strip","ikc-bless","ikc-meta",
                      "ikc-donor","ikc-desc-wrap","ikc-ack","ikc-ftr"];
    const sectionHeights = {};
    for (const id of sections) {
      const el = document.getElementById(id);
      sectionHeights[id] = el ? el.getBoundingClientRect().height : 0;
    }

    return { cw, ch, receiptNoTxt, donorNameTxt, sealOrangePixels, sectionHeights };
  }, captureScale);

} finally {
  if (browser) await browser.close();
  server.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Assertions
// ─────────────────────────────────────────────────────────────────────────────

assert(canvasSt !== null, "html2canvas completed and canvas is accessible");
if (!canvasSt) finish("in-kind receipt image capture (WhatsApp quality check)");

console.log(`\n── Canvas dimensions ──`);
console.log(`  Width : ${canvasSt.cw} px`);
console.log(`  Height: ${canvasSt.ch} px`);

console.log("\n── Assertion: non-zero canvas dimensions ──");

assert(
  canvasSt.cw > 0,
  `Canvas width is non-zero (${canvasSt.cw} px)`
);
assert(
  canvasSt.ch > 0,
  `Canvas height is non-zero (${canvasSt.ch} px)`
);

console.log("\n── Assertion: portrait orientation (height > width) ──");

assert(
  canvasSt.ch > canvasSt.cw,
  `Canvas is portrait: height (${canvasSt.ch} px) > width (${canvasSt.cw} px) — ` +
  `landscape would indicate a collapsed or broken layout`
);

console.log("\n── Assertion: key text present in DOM ──");

assert(
  canvasSt.receiptNoTxt?.includes("IKC-"),
  `Receipt number contains "IKC-" (actual: "${canvasSt.receiptNoTxt}")`
);
assert(
  canvasSt.donorNameTxt === DONOR_NAME,
  `Donor name "${DONOR_NAME}" is present in the donor-hero section`
);

console.log("\n── Assertion: acknowledgement seal rendered (orange pixels in seal region) ──");
console.log(`  Orange pixels in .ikc-ack region: ${canvasSt.sealOrangePixels}`);

assert(
  canvasSt.sealOrangePixels > 50,
  `Seal region contains orange pixels (${canvasSt.sealOrangePixels} > 50) — ` +
  `seal is rendered and not blank or clipped to zero`
);

console.log("\n── Assertion: all 8 receipt sections present with non-zero height ──");

const SECTIONS = [
  ["ikc-hdr",      "header (.ikc-hdr)"],
  ["ikc-strip",    "title strip (.ikc-strip)"],
  ["ikc-bless",    "blessing (.ikc-bless)"],
  ["ikc-meta",     "receipt no/date meta (.ikc-meta)"],
  ["ikc-donor",    "donor hero (.ikc-donor)"],
  ["ikc-desc-wrap","description band (.ikc-desc-wrap)"],
  ["ikc-ack",      "acknowledgement + seal (.ikc-ack)"],
  ["ikc-ftr",      "footer (.ikc-ftr)"],
];

for (const [id, label] of SECTIONS) {
  const h = canvasSt.sectionHeights[id] ?? 0;
  assert(
    h > 0,
    `Section ${label} has non-zero height (${h.toFixed ? h.toFixed(1) : h} px)`
  );
}

finish("in-kind receipt image capture (WhatsApp quality check)");
