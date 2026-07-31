/**
 * Tests: In-Kind Contribution Receipt strip text layout after white-space:normal change
 *
 * The `.ikc-strip-en` class was changed from `white-space:nowrap` to `white-space:normal`
 * to fix mobile overflow.  This test confirms that in print mode (A4, 794×1123 px) the
 * strip text ("In-Kind Contribution · பொருள் நன்கொடை ரசீது") still renders acceptably:
 *
 *   1. The strip element height is within a reasonable range (≤ 3 lines, ~80 px at 2×
 *      device-pixel-ratio) — i.e. it has not become excessively tall.
 *   2. The strip does NOT overflow its container (measured clientHeight vs scrollHeight).
 *   3. The overall receipt still fits on exactly one A4 page (cross-check via PDF).
 *
 * Approach:
 *   • Extract the print CSS verbatim from ContributionReceipt.tsx.
 *   • Build a standalone HTML page mirroring the full receipt DOM.
 *   • Serve from a local HTTP server; open in headless Chromium.
 *   • Emulate @media print, set viewport to A4 (794×1123 px).
 *   • Evaluate the strip element dimensions.
 *   • Also generate a PDF and assert page count = 1.
 *
 * Pure local test — no live API server required.
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
// 1. Extract CSS from ContributionReceipt.tsx
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Extracting CSS from ContributionReceipt.tsx ──");

const src = readFileSync(receiptPath, "utf8");

const mediaPrintPos = src.indexOf("@media print {");
assert(mediaPrintPos !== -1, "ContributionReceipt.tsx contains an @media print block");

const OPEN_TOKEN  = "<style>{`";
const CLOSE_TOKEN = "`}</style>";
let styleOpen  = -1;
let searchFrom = mediaPrintPos;
while (searchFrom >= 0) {
  const idx = src.lastIndexOf(OPEN_TOKEN, searchFrom);
  if (idx === -1) break;
  if (idx < mediaPrintPos) { styleOpen = idx; break; }
  searchFrom = idx - 1;
}
const styleClose = styleOpen !== -1 ? src.indexOf(CLOSE_TOKEN, mediaPrintPos) : -1;

assert(
  styleOpen !== -1 && styleClose !== -1,
  "ContributionReceipt.tsx contains a <style>{`…`}</style> block enclosing @media print"
);

const cssText = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);

assert(cssText.includes("@media print"), "Extracted CSS contains @media print block");

// Confirm that .ikc-strip-en now uses white-space:normal (not nowrap)
const screenCssEnd = src.indexOf("@media print {");
const screenCss    = src.slice(0, screenCssEnd);
assert(
  /\.ikc-strip-en\s*\{[^}]*white-space\s*:\s*normal/.test(screenCss),
  "Screen CSS: .ikc-strip-en uses white-space:normal (mobile-overflow fix is present)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build the HTML page (maximum-content data)
// ─────────────────────────────────────────────────────────────────────────────

const DONOR_NAME  = "திருமலை வேங்கடேஸ்வர நாயனார் குமாரசாமி";
const PLACE       = "Vadamadurai, Tamil Nadu";
const DESCRIPTION = "அரிசி, பருப்பு, எண்ணெய், வெல்லம், தேங்காய் மற்றும் பூஜை பொருட்கள் அனைத்தும்";
const RECEIPT_NO  = "IKC-000042";
const DATE_EN     = "01 Jan 2025";
const DATE_TA     = "1 ஜனவரி 2025";

const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>In-Kind Receipt Strip Layout Test</title>
  <style>
${cssText}
  </style>
</head>
<body>
<div class="ikc-pg">

  <div class="ikc-acts">
    <button class="ikc-btn-p">🖨️  Print / PDF</button>
    <a class="ikc-btn-h" href="/">🏠 முகப்பு</a>
  </div>

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
        <span class="ikc-strip-en" id="strip-en">In-Kind Contribution &nbsp;·&nbsp; பொருள் நன்கொடை ரசீது</span>
        <div class="ikc-strip-line r"></div>
      </div>

      <div class="ikc-bless">
        <div class="ikc-bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
        <div class="ikc-bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
      </div>

      <div class="ikc-meta">
        <div class="ikc-mc">
          <div class="ikc-mc-lbl">Receipt No.</div>
          <div class="ikc-mc-no">${RECEIPT_NO}</div>
        </div>
        <div class="ikc-mc-sep"></div>
        <div class="ikc-mc r">
          <div class="ikc-mc-lbl">Date</div>
          <div class="ikc-mc-date">${DATE_EN}</div>
          <div class="ikc-mc-date-ta">${DATE_TA}</div>
        </div>
      </div>

      <div class="ikc-donor">
        <div class="ikc-donor-lbl">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Contributor Details</div>
        <div class="ikc-donor-name">${DONOR_NAME}</div>
        <div class="ikc-donor-place">📍 &nbsp;${PLACE}</div>
      </div>

      <div class="ikc-desc-wrap">
        <div class="ikc-desc-icon">🎁</div>
        <div class="ikc-desc-body">
          <div class="ikc-desc-lbl">✦ &nbsp;Contribution Details &nbsp;·&nbsp; நன்கொடை விவரம்&nbsp; ✦</div>
          <div class="ikc-desc-text">${DESCRIPTION}</div>
        </div>
      </div>

      <div class="ikc-ack">
        <div class="ikc-ack-text">
          <div class="ikc-ack-lbl">Official Acknowledgement &nbsp;·&nbsp; உத்தியோகபூர்வ ஒப்புகை</div>
          <div class="ikc-ack-ta">
            இந்த பொருள் நன்கொடை கோவிலுக்காக<br/>
            மகிழ்ச்சியுடன் ஏற்றுக்கொள்ளப்படுகிறது
          </div>
        </div>
        <svg class="ikc-seal" width="150" height="150" viewBox="0 0 150 150"
             xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="72" fill="#fff7ed"/>
          <circle cx="75" cy="75" r="72" fill="none" stroke="#c2410c" stroke-width="3"/>
          <text x="75" y="78" text-anchor="middle" font-family="serif"
                font-size="17" font-weight="900" fill="#c2410c">வடமதுரை</text>
        </svg>
      </div>

      <div class="ikc-ftr">
        <div class="ikc-ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
        <div class="ikc-ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
        <div class="ikc-ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
        <div class="ikc-ftr-rcpt">Official receipt &nbsp;·&nbsp; ${RECEIPT_NO} &nbsp;·&nbsp; ${DATE_EN}</div>
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

console.log("\n── Strip layout measurement (A4 print mode) ──");
console.log(`  Serving HTML on ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Headless Chromium — emulate print media, measure strip, generate PDF
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

// A4 portrait in CSS pixels at 96 dpi: 210mm × 297mm → 794 × 1123 px
const A4_W = 794;
const A4_H = 1123;

// Maximum acceptable strip height in CSS pixels under print @media.
// The text is ~10.5pt ≈ 14px; line-height ~1.4 → ~19–20 px per line.
// Two lines ≈ 40 px; padding adds ~12–14 px → strip ≤ 60 px is single/double-line.
// We allow up to 80 px (≈ 3 lines) before flagging as excessively tall.
const MAX_STRIP_HEIGHT_PX = 80;

let browser;
try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport:        { width: A4_W, height: A4_H },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Emulate @media print so the print CSS rules apply
  await page.emulateMedia({ media: "print" });
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Measure the strip element dimensions
  const stripMetrics = await page.evaluate(() => {
    const strip   = document.getElementById("strip");
    const stripEn = document.getElementById("strip-en");
    if (!strip || !stripEn) return null;
    const sr  = strip.getBoundingClientRect();
    const ser = stripEn.getBoundingClientRect();
    return {
      stripHeight:       sr.height,
      stripScrollHeight: strip.scrollHeight,
      stripEnHeight:     ser.height,
      stripClientHeight: strip.clientHeight,
    };
  });

  console.log(`  Strip element height:       ${stripMetrics?.stripHeight?.toFixed(1)} px`);
  console.log(`  Strip span (text) height:   ${stripMetrics?.stripEnHeight?.toFixed(1)} px`);
  console.log(`  Strip scrollHeight:         ${stripMetrics?.stripScrollHeight?.toFixed(1)} px`);
  console.log(`  A4 viewport: ${A4_W}×${A4_H} px`);

  assert(
    stripMetrics !== null,
    "Strip element (#strip) and strip text span (#strip-en) are both found in the DOM"
  );

  if (stripMetrics) {
    assert(
      stripMetrics.stripHeight <= MAX_STRIP_HEIGHT_PX,
      `Strip height (${stripMetrics.stripHeight.toFixed(1)} px) ≤ ${MAX_STRIP_HEIGHT_PX} px — ` +
      `strip text is single-line or neatly wrapped (not excessively tall) in print mode`
    );

    assert(
      stripMetrics.stripScrollHeight <= stripMetrics.stripClientHeight + 2,
      `Strip has no overflow: scrollHeight (${stripMetrics.stripScrollHeight.toFixed(1)}) ≈ ` +
      `clientHeight (${stripMetrics.stripClientHeight.toFixed(1)}) — text is fully visible`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Generate PDF and assert exactly 1 page
  // ─────────────────────────────────────────────────────────────────────────

  console.log("\n── PDF page-count cross-check ──");

  const pdfBuffer = await page.pdf({
    format:          "A4",
    printBackground: true,
    margin:          { top: "0", right: "0", bottom: "0", left: "0" },
  });

  console.log(`  PDF generated — ${pdfBuffer.length} bytes`);

  const pdfText     = pdfBuffer.toString("latin1");
  const pageMatches = [...pdfText.matchAll(/\/Type\s*\/Page(?!s)/g)];
  const pageCount   = pageMatches.length;

  console.log(`  Page count detected in PDF: ${pageCount}`);

  assert(
    pageCount === 1,
    `PDF has exactly 1 page (actual: ${pageCount}) — strip text change does not break A4 fit`
  );

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("in-kind receipt strip layout");
