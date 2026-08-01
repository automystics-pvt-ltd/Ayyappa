/**
 * Tests: In-Kind Contribution Receipt strip text layout in the html2canvas
 *        image-export (WhatsApp / "Save as Image") render path.
 *
 * The `.ikc-strip-en` class was changed from `white-space:nowrap` to
 * `white-space:normal` to fix mobile overflow.  The existing
 * `inkind-receipt-strip-layout.test.mjs` verifies the print/PDF path at A4
 * width (794 px, @media print emulation).  html2canvas operates in *screen*
 * mode — @media print rules are NOT applied — and captures the `.ikc-doc`
 * element which has a max-width of 560 px.  This test confirms that in that
 * narrower, screen-mode context the strip text still looks correct:
 *
 *   1. The strip element height is within a reasonable range (≤ 80 px) — i.e.
 *      it has not become excessively tall at 560 px wide.
 *   2. The strip does NOT overflow its container (scrollHeight ≈ clientHeight).
 *   3. The strip text span height alone is also ≤ 80 px.
 *
 * Approach:
 *   • Extract the *screen* CSS verbatim from ContributionReceipt.tsx
 *     (everything before the @media print block).
 *   • Build a standalone HTML page mirroring the receipt strip DOM.
 *   • Serve from a local HTTP server; open in headless Chromium.
 *   • Use *screen* media (no emulateMedia call) and set the viewport to
 *     560 × 900 px — matching the `.ikc-doc` max-width that html2canvas
 *     captures.
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

const fullCss      = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);
const printStart   = fullCss.indexOf("@media print {");
const screenCss    = printStart !== -1 ? fullCss.slice(0, printStart) : fullCss;

assert(screenCss.length > 100, "Screen CSS extracted successfully (non-trivial length)");

// Confirm that .ikc-strip-en uses white-space:normal (the mobile-overflow fix)
assert(
  /\.ikc-strip-en\s*\{[^}]*white-space\s*:\s*normal/.test(screenCss),
  "Screen CSS: .ikc-strip-en uses white-space:normal (mobile-overflow fix is in the screen path)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build the HTML page
//    Mirrors the strip section of the receipt DOM at .ikc-doc max-width (560 px).
// ─────────────────────────────────────────────────────────────────────────────

// Strip text used by the in-kind receipt component
const STRIP_TEXT = "In-Kind Contribution \u00a0·\u00a0 பொருள் நன்கொடை ரசீது";

const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=560, initial-scale=1.0" />
  <title>In-Kind Receipt Strip WhatsApp Layout Test</title>
  <style>
${screenCss}
    /* Force the document card to exactly the html2canvas capture width */
    body { margin:0; padding:0; background:#fff; }
    .ikc-doc { width:560px; max-width:560px; }
  </style>
</head>
<body>
<div class="ikc-pg">
  <div class="ikc-doc">
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

// html2canvas captures the .ikc-doc at its rendered width (≤ 560 px).
// We use a taller viewport so the strip is not scrolled off-screen, but the
// critical dimension is the 560 px width.
const CAPTURE_W = 560;
const CAPTURE_H = 900;

// Maximum acceptable strip height in CSS pixels under screen mode at 560 px.
// The strip text ("In-Kind Contribution · பொருள் நன்கொடை ரசீது") is rendered
// in Cinzel 11px with letter-spacing 2.5px.  At 560 px container width the
// flex layout (decorative lines + span) typically keeps the text on one line.
// Even if it wraps, two lines + padding should be well under 80 px.
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

  // Measure the strip element dimensions at 560 px, screen mode
  const stripMetrics = await page.evaluate(() => {
    const strip   = document.getElementById("strip");
    const stripEn = document.getElementById("strip-en");
    if (!strip || !stripEn) return null;

    const sr  = strip.getBoundingClientRect();
    const ser = stripEn.getBoundingClientRect();

    return {
      stripHeight:        sr.height,
      stripScrollHeight:  strip.scrollHeight,
      stripClientHeight:  strip.clientHeight,
      stripEnHeight:      ser.height,
      docWidth:           document.querySelector(".ikc-doc")?.getBoundingClientRect().width ?? 0,
    };
  });

  console.log(`  Document (.ikc-doc) width:  ${stripMetrics?.docWidth?.toFixed(1)} px  (expected ≤ 560)`);
  console.log(`  Strip element height:       ${stripMetrics?.stripHeight?.toFixed(1)} px`);
  console.log(`  Strip span (text) height:   ${stripMetrics?.stripEnHeight?.toFixed(1)} px`);
  console.log(`  Strip scrollHeight:         ${stripMetrics?.stripScrollHeight?.toFixed(1)} px`);
  console.log(`  Strip clientHeight:         ${stripMetrics?.stripClientHeight?.toFixed(1)} px`);
  console.log(`  Viewport: ${CAPTURE_W}×${CAPTURE_H} px  |  media: screen`);

  assert(
    stripMetrics !== null,
    "Strip element (#strip) and strip text span (#strip-en) are both found in the DOM"
  );

  if (stripMetrics) {
    assert(
      stripMetrics.docWidth <= CAPTURE_W + 1,
      `Document card width (${stripMetrics.docWidth.toFixed(1)} px) ≤ ${CAPTURE_W} px — ` +
      `html2canvas will capture at the expected width`
    );

    assert(
      stripMetrics.stripHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip height (${stripMetrics.stripHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `strip text is not excessively tall at 560 px in screen mode (WhatsApp image path)`
    );

    assert(
      stripMetrics.stripEnHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip text span height (${stripMetrics.stripEnHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `text itself fits within the acceptable height`
    );

    assert(
      stripMetrics.stripScrollHeight <= stripMetrics.stripClientHeight + 2,
      `Strip has no overflow: scrollHeight (${stripMetrics.stripScrollHeight.toFixed(1)}) ≈ ` +
      `clientHeight (${stripMetrics.stripClientHeight.toFixed(1)}) — text is fully visible in image`
    );
  }

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("in-kind receipt strip WhatsApp image layout");
