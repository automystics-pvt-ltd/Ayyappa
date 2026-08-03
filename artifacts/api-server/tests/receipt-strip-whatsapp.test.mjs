/**
 * Tests: Donation Receipt strip text layout in the html2canvas
 *        image-export (WhatsApp / "Save as Image") render path.
 *
 * html2canvas captures the `.doc` element (max-width 560 px) in *screen*
 * mode — @media print rules are NOT applied.  The strip uses
 * `white-space:nowrap` making horizontal cutoff the primary risk:
 * if the text is wider than the strip container it will be clipped
 * in the saved image.
 *
 * Assertions:
 *   1. Strip element height ≤ 80 px (not excessively tall).
 *   2. Strip element has NO vertical overflow   (scrollHeight ≈ clientHeight).
 *   3. Strip element has NO horizontal overflow (scrollWidth  ≤ clientWidth).
 *   4. Strip text span right edge ≤ strip container right edge (no horizontal clip).
 *   5. Strip text span height ≤ 80 px.
 *
 * DOM approach:
 *   • The HTML page renders only the `.doc > .doc-inner` subtree — the
 *     production page wrapper (.pg) is omitted so the geometry exactly
 *     matches what html2canvas receives when it is invoked with
 *     `html2canvas(docRef.current)`.
 *   • The viewport is set to 560 × 900 px, matching the `.doc` max-width.
 *   • Screen media is used (no emulateMedia call).
 *
 * Pure local test — no live API server or receipt token required.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/Receipt.tsx");

// ─────────────────────────────────────────────────────────────────────────────
// Assertion helpers
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
// 1. Extract screen CSS from Receipt.tsx
//    (everything before the @media print { block)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Extracting screen CSS from Receipt.tsx ──");

const src = readFileSync(receiptPath, "utf8");

// Locate the single <style>{`…`}</style> block that contains @media print.
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

assert(
  styleOpen !== -1 && styleClose !== -1,
  "Receipt.tsx contains a <style>{`…`}</style> block enclosing @media print"
);

const fullCss    = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);
const printStart = fullCss.indexOf("@media print {");
const screenCss  = printStart !== -1 ? fullCss.slice(0, printStart) : fullCss;

assert(screenCss.length > 100, "Screen CSS extracted successfully (non-trivial length)");

// Confirm that .strip-en is present in the screen CSS
assert(
  /\.strip-en\s*\{/.test(screenCss),
  "Screen CSS: .strip-en rule is present"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build the HTML page
//
//    The DOM mirrors exactly what html2canvas receives:
//      html2canvas(docRef.current)   →   docRef = .doc element
//
//    We render only the .doc > .doc-inner subtree (no outer .pg wrapper)
//    so layout geometry matches the real capture target at 560 px.
//    The strip text uses white-space:nowrap, so horizontal fit is tested.
// ─────────────────────────────────────────────────────────────────────────────

// Strip text used by the donation receipt component (matches Receipt.tsx JSX)
const STRIP_TEXT = "Donation Receipt \u00a0\u00b7\u00a0 நன்கொடை ரசீது";

const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=560, initial-scale=1.0" />
  <title>Donation Receipt Strip WhatsApp Layout Test</title>
  <style>
${screenCss}
    /*
     * Reproduce the capture context:
     * html2canvas is called with docRef.current (.doc element).
     * body has no extra padding/margin so .doc fills the viewport width.
     */
    body { margin:0; padding:0; background:#fff; }
    /* .doc already has max-width:560px in the extracted screen CSS */
  </style>
</head>
<body>
<!-- Capture root: matches docRef.current in the production component -->
<div class="doc" id="capture-root">
  <div class="doc-inner">

    <div class="hdr">
      <div class="hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
      <div class="hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
      <div><span class="hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
    </div>

    <!-- TITLE STRIP — the element under test -->
    <div class="strip" id="strip">
      <div class="strip-line"></div>
      <span class="strip-en" id="strip-en">${STRIP_TEXT}</span>
      <div class="strip-line r"></div>
    </div>

  </div>
</div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Spin up a minimal HTTP server
// ─────────────────────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

console.log("\n── Strip layout measurement (screen mode, 560 px — html2canvas path) ──");
console.log(`  Serving HTML on ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Headless Chromium — screen media (no print emulation), 560 px viewport
// ─────────────────────────────────────────────────────────────────────────────

const { chromium } = await import("playwright");

function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}
const NIXOS_CHROMIUM = resolveChromiumPath();

// html2canvas captures .doc at its rendered width (≤ 560 px).
// Taller viewport ensures strip is not scrolled off-screen; the critical
// dimension is the 560 px width matching .doc max-width.
const CAPTURE_W = 560;
const CAPTURE_H = 900;

// Maximum acceptable strip height in CSS pixels.
// white-space:nowrap keeps "Donation Receipt · நன்கொடை ரசீது" on one line
// at 560 px.  Even if layout breaks, two lines + padding < 80 px.
const MAX_STRIP_HEIGHT_PX = 80;

let browser;
try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport:          { width: CAPTURE_W, height: CAPTURE_H },
    deviceScaleFactor: 1,
    // No emulateMedia — keep default "screen" so we match html2canvas behaviour
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Measure strip dimensions at 560 px, screen mode.
  // Includes both vertical AND horizontal overflow checks because the strip
  // uses white-space:nowrap — horizontal cutoff is the primary risk.
  const m = await page.evaluate(() => {
    const captureRoot = document.getElementById("capture-root");
    const strip       = document.getElementById("strip");
    const stripEn     = document.getElementById("strip-en");
    if (!captureRoot || !strip || !stripEn) return null;

    const rootRect  = captureRoot.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const spanRect  = stripEn.getBoundingClientRect();

    return {
      // Capture root (.doc) width — must equal viewport width (560 px)
      captureRootWidth:    rootRect.width,

      // Vertical dimensions
      stripHeight:         stripRect.height,
      stripScrollHeight:   strip.scrollHeight,
      stripClientHeight:   strip.clientHeight,
      stripEnHeight:       spanRect.height,

      // Horizontal dimensions — critical for white-space:nowrap
      stripScrollWidth:    strip.scrollWidth,
      stripClientWidth:    strip.clientWidth,

      // Span bounds relative to strip bounds (span must not extend beyond strip)
      spanRightEdge:       spanRect.right,
      stripRightEdge:      stripRect.right,
      spanLeftEdge:        spanRect.left,
      stripLeftEdge:       stripRect.left,
    };
  });

  console.log(`  Capture root (.doc) width:  ${m?.captureRootWidth?.toFixed(1)} px  (expected = ${CAPTURE_W})`);
  console.log(`  Strip element height:       ${m?.stripHeight?.toFixed(1)} px`);
  console.log(`  Strip span (text) height:   ${m?.stripEnHeight?.toFixed(1)} px`);
  console.log(`  Strip scrollHeight:         ${m?.stripScrollHeight?.toFixed(1)} px  clientHeight: ${m?.stripClientHeight?.toFixed(1)} px`);
  console.log(`  Strip scrollWidth:          ${m?.stripScrollWidth?.toFixed(1)} px  clientWidth:  ${m?.stripClientWidth?.toFixed(1)} px`);
  console.log(`  Span left/right:            ${m?.spanLeftEdge?.toFixed(1)} – ${m?.spanRightEdge?.toFixed(1)} px`);
  console.log(`  Strip left/right:           ${m?.stripLeftEdge?.toFixed(1)} – ${m?.stripRightEdge?.toFixed(1)} px`);
  console.log(`  Viewport: ${CAPTURE_W}×${CAPTURE_H} px  |  media: screen`);

  assert(
    m !== null,
    "Capture root, strip element (#strip) and strip text span (#strip-en) are all found in the DOM"
  );

  if (m) {
    assert(
      m.captureRootWidth <= CAPTURE_W + 1,
      `Capture root (.doc) width (${m.captureRootWidth.toFixed(1)} px) ≤ ${CAPTURE_W} px — ` +
      `html2canvas will capture at the expected width`
    );

    // ── Vertical checks ─────────────────────────────────────────────────────

    assert(
      m.stripHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip height (${m.stripHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `strip is not excessively tall at 560 px in screen mode`
    );

    assert(
      m.stripEnHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip text span height (${m.stripEnHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `text itself fits within the acceptable height`
    );

    assert(
      m.stripScrollHeight <= m.stripClientHeight + 2,
      `No vertical overflow: scrollHeight (${m.stripScrollHeight.toFixed(1)}) ≈ ` +
      `clientHeight (${m.stripClientHeight.toFixed(1)}) — strip text is not cut off vertically`
    );

    // ── Horizontal checks (primary risk: white-space:nowrap) ─────────────────

    assert(
      m.stripScrollWidth <= m.stripClientWidth + 1,
      `No horizontal overflow: scrollWidth (${m.stripScrollWidth.toFixed(1)}) ≤ ` +
      `clientWidth (${m.stripClientWidth.toFixed(1)} + 1 px tolerance) — ` +
      `nowrap text does not push beyond strip container width`
    );

    assert(
      m.spanRightEdge <= m.stripRightEdge + 1,
      `Strip text span right edge (${m.spanRightEdge.toFixed(1)} px) ≤ ` +
      `strip container right edge (${m.stripRightEdge.toFixed(1)} px + 1 px tolerance) — ` +
      `text is not horizontally clipped in the WhatsApp image`
    );

    assert(
      m.spanLeftEdge >= m.stripLeftEdge - 1,
      `Strip text span left edge (${m.spanLeftEdge.toFixed(1)} px) ≥ ` +
      `strip container left edge (${m.stripLeftEdge.toFixed(1)} px − 1 px tolerance) — ` +
      `text does not overflow to the left`
    );
  }

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("donation receipt strip WhatsApp image layout");
