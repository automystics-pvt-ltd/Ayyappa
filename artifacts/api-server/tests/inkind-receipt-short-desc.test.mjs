/**
 * Tests: In-Kind Contribution Receipt renders as exactly one A4 page, and the
 * layout is visually proportional, when the contribution description is a
 * single word or completely empty.
 *
 * Approach:
 *   1. Extract the print CSS block verbatim from ContributionReceipt.tsx
 *   2. Build a standalone HTML page that mirrors the full production receipt DOM
 *      for each edge-case description:
 *        • single-word  : "அரிசி"   (5 Tamil characters — shortest realistic value)
 *        • empty string : ""         (admin accidentally leaves the field blank)
 *      The fixture includes an explicit <img> element for the header logo sized
 *      to its print dimensions (70 × 70 px) so that its contribution to the
 *      vertical layout is faithfully represented even without a real image file.
 *   3. Serve the HTML from a local HTTP server so Playwright can load it
 *   4. For EACH variant run TWO complementary checks:
 *      a) PDF page count — call page.pdf({ format: "A4" }) and count leaf pages
 *         in the byte stream; must be exactly 1.
 *      b) Print-layout geometry — emulate print media with an A4-width viewport,
 *         then use page.evaluate() to read bounding rects for .ikc-desc-wrap and
 *         .ikc-ftr.  Asserts:
 *           · Footer is visible (height > 0, not hidden by overflow)
 *           · Footer bottom edge is within the A4 printable area (≤ 297 mm in
 *             CSS pixels: 1123 px at 96 dpi, with a 20 px tolerance for rounding)
 *           · Description band is present (height > 0)
 *           · Description band height ≤ 50 % of A4 page height — a giant blank
 *             orange middle section would violate this and flag the regression
 *
 * Motivation:
 *   The .ikc-desc-wrap band uses flex:1 in the print block to fill remaining
 *   space.  With very little content an earlier layout bug could produce a giant
 *   blank middle section or push the footer off the page.  These checks catch
 *   both failure modes independently of page count.
 *
 * Runs against the local source — no live API server required.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/ContributionReceipt.tsx");

// ─────────────────────────────────────────────────────────────────────────────
// Tiny assertion helpers
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
// 1. Extract the CSS string from ContributionReceipt.tsx
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. HTML builder — full production receipt DOM, parameterised on description
//
//    The header <img> is included with explicit print dimensions (70 × 70 px,
//    matching the .ikc-hdr-logo print override) so its height contribution to
//    the vertical layout is faithful.  The src points to a data-URI 1-pixel
//    transparent PNG so no network request is needed.
// ─────────────────────────────────────────────────────────────────────────────

const DONOR_NAME = "திருமலை வேங்கடேஸ்வர நாயனார் குமாரசாமி";
const PLACE      = "Vadamadurai, Tamil Nadu";
const RECEIPT_NO = "IKC-000099";
const DATE_EN    = "01 Jan 2025";
const DATE_TA    = "1 ஜனவரி 2025";

// 1×1 transparent PNG data URI — loads instantly, honours layout dimensions
const BLANK_PNG  = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function buildHtml(description) {
  const descHtml = description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>In-Kind Receipt – ${RECEIPT_NO}</title>
  <style>
${cssText}
  </style>
</head>
<body>
<div class="ikc-pg">

  <!-- action buttons (hidden in print) -->
  <div class="ikc-acts">
    <button class="ikc-btn-p">🖨️  Print / PDF</button>
    <a class="ikc-btn-h" href="/">🏠 முகப்பு</a>
  </div>

  <!-- DOCUMENT -->
  <div class="ikc-doc">
    <div class="ikc-doc-inner">

      <!-- HEADER — logo uses an inline PNG so layout height is accurate -->
      <div class="ikc-hdr">
        <img src="${BLANK_PNG}" alt="" class="ikc-hdr-logo"
             style="display:block;width:70px;height:70px;margin:0 auto 8px;" />
        <div class="ikc-hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
        <div class="ikc-hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        <div class="ikc-hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
        <div><span class="ikc-hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
      </div>

      <!-- TITLE STRIP -->
      <div class="ikc-strip">
        <div class="ikc-strip-line"></div>
        <span class="ikc-strip-en">In-Kind Contribution &nbsp;·&nbsp; பொருள் நன்கொடை ரசீது</span>
        <div class="ikc-strip-line r"></div>
      </div>

      <!-- BLESSING -->
      <div class="ikc-bless">
        <div class="ikc-bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
        <div class="ikc-bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
      </div>

      <!-- META: receipt no + date -->
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

      <!-- DONOR HERO -->
      <div class="ikc-donor">
        <div class="ikc-donor-lbl">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Contributor Details</div>
        <div class="ikc-donor-name">${DONOR_NAME}</div>
        <div class="ikc-donor-place">📍 &nbsp;${PLACE}</div>
      </div>

      <!-- DESCRIPTION BAND -->
      <div class="ikc-desc-wrap">
        <div class="ikc-desc-icon">🎁</div>
        <div class="ikc-desc-body">
          <div class="ikc-desc-lbl">✦ &nbsp;Contribution Details &nbsp;·&nbsp; நன்கொடை விவரம்&nbsp; ✦</div>
          <div class="ikc-desc-text">${descHtml}</div>
        </div>
      </div>

      <!-- ACKNOWLEDGEMENT + SEAL -->
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
          <defs>
            <path id="ikc-arc" d="M 8,57.5 A 68,68 0 0,1 142,57.5"/>
          </defs>
          <circle cx="75" cy="75" r="72" fill="#fff7ed"/>
          <circle cx="75" cy="75" r="72" fill="none" stroke="#c2410c" stroke-width="3"/>
          <circle cx="75" cy="75" r="63" fill="none" stroke="#c2410c" stroke-width="1.5"/>
          <circle cx="75" cy="75" r="58" fill="none" stroke="#ea580c"
                  stroke-width="0.8" stroke-dasharray="4 3.5"/>
          <text font-family="serif" font-size="7.5" fill="#c2410c" font-weight="700">
            <textPath href="#ikc-arc" startOffset="50%" text-anchor="middle">
              ஸ்வாமியே சரணம் ஐயப்பா
            </textPath>
          </text>
          <text x="75" y="78" text-anchor="middle" font-family="serif"
                font-size="17" font-weight="900" fill="#c2410c">வடமதுரை</text>
          <text x="75" y="93" text-anchor="middle" font-family="serif"
                font-size="11" font-weight="700" fill="#9a3412">ஐயப்பன் கோவில்</text>
          <text x="75" y="107" text-anchor="middle" font-family="serif"
                font-size="9.5" font-weight="700" fill="#9a3412">திருப்பணி குழு</text>
          <text x="75" y="124" text-anchor="middle" font-family="sans-serif"
                font-size="8" fill="#ea580c" letter-spacing="5">◆◆◆</text>
        </svg>
      </div>

      <!-- FOOTER -->
      <div class="ikc-ftr">
        <div class="ikc-ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
        <div class="ikc-ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
        <div class="ikc-ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
        <div class="ikc-ftr-rcpt">Official receipt &nbsp;·&nbsp; ${RECEIPT_NO} &nbsp;·&nbsp; ${DATE_EN}</div>
      </div>

    </div><!-- ikc-doc-inner -->
  </div><!-- ikc-doc -->

</div><!-- ikc-pg -->
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. A4 geometry constants (CSS pixels at 96 dpi)
//    210 mm × 297 mm → 793.7 px × 1122.5 px, rounded to nearest integer.
//    A 20 px tolerance absorbs sub-pixel rounding in Chromium's layout engine.
// ─────────────────────────────────────────────────────────────────────────────

const A4_WIDTH_PX  = 794;
const A4_HEIGHT_PX = 1123;
const LAYOUT_TOLERANCE_PX = 20;

// Max fraction of A4 height the description band may occupy when content is
// short.  A value above this threshold would be a visually disproportionate
// blank orange section — the regression we are guarding against.
const DESC_BAND_MAX_FRACTION = 0.50;

// ─────────────────────────────────────────────────────────────────────────────
// 4. NixOS Chromium resolver
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
// 5. Per-variant check: PDF page count + print-layout geometry
// ─────────────────────────────────────────────────────────────────────────────

const { chromium } = await import("playwright");

async function checkVariant(description, label) {
  const html = buildHtml(description);

  // Spin up a per-variant HTTP server on an ephemeral port
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;

  console.log(`\n── ${label} ──`);
  console.log(`   serving on ${url}`);

  let browser;
  try {
    browser = await chromium.launch({
      headless:       true,
      executablePath: NIXOS_CHROMIUM,
      args:           ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // ── 5a. PDF page count ────────────────────────────────────────────────────
    {
      const context = await browser.newContext();
      const page    = await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format:          "A4",
        printBackground: true,
        margin:          { top: "0", right: "0", bottom: "0", left: "0" },
      });
      await context.close();

      console.log(`   PDF generated — ${pdfBuffer.length} bytes`);

      // Leaf-page count: /Type /Page NOT followed by 's'
      const pdfText   = pdfBuffer.toString("latin1");
      const pageRe    = /\/Type\s*\/Page(?!s)/g;
      const pageCount = [...pdfText.matchAll(pageRe)].length;

      console.log(`   Page count in PDF: ${pageCount}`);
      assert(
        pageCount === 1,
        `[${label}] PDF has exactly 1 page (actual: ${pageCount})` +
          ` with description: "${description || "(empty)"}"`,
      );
    }

    // ── 5b. Print-layout geometry ─────────────────────────────────────────────
    //    Activate @media print at A4 width so layout runs under the same CSS
    //    rules that govern the real print-to-PDF flow.  Then read bounding rects
    //    for the description band and footer.
    {
      const context = await browser.newContext({
        viewport: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
      });
      const page = await context.newPage();
      await page.emulateMedia({ media: "print" });
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const rects = await page.evaluate(() => {
        const q = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height };
        };
        return {
          descWrap: q(".ikc-desc-wrap"),
          footer:   q(".ikc-ftr"),
        };
      });
      await context.close();

      console.log(`   .ikc-desc-wrap : ${JSON.stringify(rects.descWrap)}`);
      console.log(`   .ikc-ftr       : ${JSON.stringify(rects.footer)}`);

      // Footer must be visible (rendered with positive height)
      assert(
        rects.footer !== null && rects.footer.height > 0,
        `[${label}] Footer (.ikc-ftr) is visible (height > 0)`,
      );

      // Footer bottom edge must be within the A4 printable area
      const footerBottom = rects.footer ? rects.footer.bottom : Infinity;
      assert(
        footerBottom <= A4_HEIGHT_PX + LAYOUT_TOLERANCE_PX,
        `[${label}] Footer bottom (${footerBottom.toFixed(1)} px) is within A4 height` +
          ` (${A4_HEIGHT_PX} px + ${LAYOUT_TOLERANCE_PX} px tolerance)`,
      );

      // Description band must be present
      assert(
        rects.descWrap !== null && rects.descWrap.height > 0,
        `[${label}] Description band (.ikc-desc-wrap) is present (height > 0)`,
      );

      // Description band must not dominate the page as a giant blank section
      const descFraction = rects.descWrap ? rects.descWrap.height / A4_HEIGHT_PX : 1;
      assert(
        descFraction <= DESC_BAND_MAX_FRACTION,
        `[${label}] Description band height (${rects.descWrap?.height.toFixed(1)} px,` +
          ` ${(descFraction * 100).toFixed(1)} % of A4) is ≤ ${DESC_BAND_MAX_FRACTION * 100} %` +
          ` — no disproportionate blank middle section`,
      );
    }

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Run both edge-case variants
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n══ In-kind receipt — short / empty description layout checks ══");

await checkVariant("அரிசி", "single-word description");
await checkVariant("",       "empty description");

finish("in-kind receipt short/empty description");
