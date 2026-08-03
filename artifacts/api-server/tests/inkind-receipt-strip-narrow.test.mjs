/**
 * Tests: In-Kind Contribution Receipt strip text layout at the narrowest
 *        phone screen width (320 px viewport, screen mode).
 *
 * On very small phones (320 px viewport) the .ikc-pg page wrapper constrains
 * the .ikc-doc card to the viewport width.  This test confirms that even in
 * that constrained width the receipt strip:
 *
 *   1. Has a height ≤ 120 px — allowing for extra wrapping at narrow width,
 *      but rejecting pathological layouts.
 *   2. Does NOT overflow its container (scrollHeight ≈ clientHeight).
 *   3. The strip text span height alone is also ≤ 120 px.
 *
 * Approach:
 *   • Extract the *screen* CSS verbatim from ContributionReceipt.tsx
 *     (everything before the @media print { block).
 *   • Build a standalone HTML page mirroring the receipt strip DOM, with
 *     NO forced width override so the natural layout at 320 px is measured.
 *   • Serve from a local HTTP server; open in headless Chromium.
 *   • Use *screen* media (no emulateMedia call) and set the viewport to
 *     320 × 900 px — the narrowest common phone width.
 *   • Evaluate the strip element dimensions.
 *
 * Pure local test — no live API server or receipt token required.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx");

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
// 1. Extract screen CSS from ContributionReceipt.tsx
//    (everything before the @media print { block)
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Extracting screen CSS from ContributionReceipt.tsx ──");

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
  "ContributionReceipt.tsx contains a <style>{`…`}</style> block enclosing @media print"
);

const fullCss    = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);
const printStart = fullCss.indexOf("@media print {");
const screenCss  = printStart !== -1 ? fullCss.slice(0, printStart) : fullCss;

assert(screenCss.length > 100, "Screen CSS extracted successfully (non-trivial length)");

// Confirm that .ikc-strip-en uses white-space:normal (the mobile-overflow fix)
assert(
  /\.ikc-strip-en\s*\{[^}]*white-space\s*:\s*normal/.test(screenCss),
  "Screen CSS: .ikc-strip-en uses white-space:normal (mobile-overflow fix is present)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build the HTML page
//    Mirrors the strip section of the receipt DOM.
//    At 320 px viewport the .ikc-doc is constrained by max-width:560px but
//    the viewport is narrower — so the card renders at 320 px minus padding.
// ─────────────────────────────────────────────────────────────────────────────

// Strip text used by the in-kind receipt component
const STRIP_TEXT = "In-Kind Contribution \u00a0·\u00a0 பொருள் நன்கொடை ரசீது";

const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>In-Kind Receipt Strip Narrow Screen Test</title>
  <style>
${screenCss}
    /* No width override — let the natural 320 px viewport layout apply */
    body { margin:0; padding:0; background:#fff; }
  </style>
</head>
<body>
<div class="ikc-pg">
  <div class="ikc-doc" id="doc">
    <div class="ikc-doc-inner">

      <div class="ikc-hdr">
        <div class="ikc-hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
        <div class="ikc-hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        <div class="ikc-hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
        <div><span class="ikc-hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
      </div>

      <div class="ikc-strip" id="strip">
        <div class="ikc-strip-line"></div>
        <span class="ikc-strip-en" id="strip-en">${STRIP_TEXT}</span>
        <div class="ikc-strip-line r"></div>
      </div>

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

console.log("\n── Strip layout measurement (screen mode, 320 px — narrow phone) ──");
console.log(`  Serving HTML on ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Headless Chromium — screen media (no print emulation), 320 px viewport
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

// 320 px — the narrowest common phone viewport (e.g. iPhone SE 1st gen, Galaxy S3).
const VIEWPORT_W = 320;
const VIEWPORT_H = 900;

// Maximum acceptable strip height in CSS pixels at 320 px viewport.
// At this width the strip text may wrap to two lines; two lines of Cinzel 11px
// with letter-spacing 2.5px plus vertical padding should be well under 120 px.
const MAX_STRIP_HEIGHT_PX = 120;

let browser;
try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport:          { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: 1,
    // No emulateMedia — keep default "screen" mode
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Measure strip dimensions at 320 px viewport in screen mode
  const metrics = await page.evaluate(() => {
    const doc     = document.getElementById("doc");
    const strip   = document.getElementById("strip");
    const stripEn = document.getElementById("strip-en");
    if (!strip || !stripEn) return null;

    const dr  = doc?.getBoundingClientRect();
    const sr  = strip.getBoundingClientRect();
    const ser = stripEn.getBoundingClientRect();

    return {
      docWidth:           dr?.width ?? 0,
      docLeft:            dr?.left ?? 0,
      docRight:           dr?.right ?? 0,
      stripHeight:        sr.height,
      stripWidth:         sr.width,
      stripScrollHeight:  strip.scrollHeight,
      stripClientHeight:  strip.clientHeight,
      stripScrollWidth:   strip.scrollWidth,
      stripClientWidth:   strip.clientWidth,
      stripLeft:          sr.left,
      stripRight:         sr.right,
      stripEnHeight:      ser.height,
      stripEnWidth:       ser.width,
      stripEnLeft:        ser.left,
      stripEnRight:       ser.right,
      viewportWidth:      window.innerWidth,
    };
  });

  console.log(`  Viewport width:                  ${metrics?.viewportWidth} px`);
  console.log(`  Document (.ikc-doc) width:       ${metrics?.docWidth?.toFixed(1)} px  [left:${metrics?.docLeft?.toFixed(1)} right:${metrics?.docRight?.toFixed(1)}]`);
  console.log(`  Strip element height:            ${metrics?.stripHeight?.toFixed(1)} px`);
  console.log(`  Strip element width:             ${metrics?.stripWidth?.toFixed(1)} px`);
  console.log(`  Strip span (text) height:        ${metrics?.stripEnHeight?.toFixed(1)} px`);
  console.log(`  Strip span (text) width:         ${metrics?.stripEnWidth?.toFixed(1)} px  [left:${metrics?.stripEnLeft?.toFixed(1)} right:${metrics?.stripEnRight?.toFixed(1)}]`);
  console.log(`  Strip scrollHeight / clientHeight: ${metrics?.stripScrollHeight?.toFixed(1)} / ${metrics?.stripClientHeight?.toFixed(1)} px`);
  console.log(`  Strip scrollWidth  / clientWidth:  ${metrics?.stripScrollWidth?.toFixed(1)} / ${metrics?.stripClientWidth?.toFixed(1)} px`);
  console.log(`  Max allowed strip height:        ${MAX_STRIP_HEIGHT_PX} px`);

  assert(
    metrics !== null,
    "Strip element (#strip) and strip text span (#strip-en) are both found in the DOM"
  );

  if (metrics) {
    // ── Width / horizontal containment ───────────────────────────────────────

    assert(
      metrics.docWidth <= VIEWPORT_W + 1,
      `Document card width (${metrics.docWidth.toFixed(1)} px) ≤ ${VIEWPORT_W} px — ` +
      `card does not overflow the narrow viewport`
    );

    // The strip must not be wider than its containing card
    assert(
      metrics.stripWidth <= metrics.docWidth + 1,
      `Strip width (${metrics.stripWidth.toFixed(1)} px) ≤ doc width (${metrics.docWidth.toFixed(1)} px) — ` +
      `strip does not overflow horizontally`
    );

    // No horizontal scroll overflow inside the strip
    assert(
      metrics.stripScrollWidth <= metrics.stripClientWidth + 2,
      `Strip has no horizontal overflow: scrollWidth (${metrics.stripScrollWidth.toFixed(1)}) ≈ ` +
      `clientWidth (${metrics.stripClientWidth.toFixed(1)}) — text is not clipped horizontally`
    );

    // The strip text span must stay within the document card (bounding-rect containment)
    assert(
      metrics.stripEnLeft >= metrics.docLeft - 1 && metrics.stripEnRight <= metrics.docRight + 1,
      `Strip text span (left:${metrics.stripEnLeft.toFixed(1)} right:${metrics.stripEnRight.toFixed(1)}) ` +
      `is contained within the doc card (left:${metrics.docLeft.toFixed(1)} right:${metrics.docRight.toFixed(1)}) — ` +
      `text is not clipped or cut off`
    );

    // ── Height / vertical containment ────────────────────────────────────────

    assert(
      metrics.stripHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip height (${metrics.stripHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `strip is readable at 320 px screen width`
    );

    assert(
      metrics.stripEnHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip text span height (${metrics.stripEnHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `text fits within the acceptable height at 320 px`
    );

    assert(
      metrics.stripScrollHeight <= metrics.stripClientHeight + 2,
      `Strip has no vertical overflow: scrollHeight (${metrics.stripScrollHeight.toFixed(1)}) ≈ ` +
      `clientHeight (${metrics.stripClientHeight.toFixed(1)}) — all text is visible at 320 px`
    );
  }

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("in-kind receipt strip narrow-screen (320 px) layout");
