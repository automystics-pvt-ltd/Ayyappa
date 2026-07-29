/**
 * Tests: Receipt page renders as exactly one A4 page when printed
 *
 * Approach:
 *   1. Extract the print CSS block verbatim from Receipt.tsx (the source of truth)
 *   2. Build a standalone HTML page that mirrors the full receipt DOM with
 *      maximum-content data:
 *        • donor name   : long Tamil name (37 chars)  — "திருமலை வேங்கடேஸ்வர நாயனார் குமாரசாமி"
 *        • amount       : ₹10,00,000  (large, tests amt-val overflow handling)
 *        • place        : "Vadamadurai, Tamil Nadu"
 *        • message      : a two-line Tamil phrase
 *   3. Serve the HTML from a local HTTP server so Playwright can load it
 *      (Playwright cannot open `data:` URLs for PDF export in all builds)
 *   4. Open the page in headless Chromium and call page.pdf({ format: "A4" })
 *      which triggers @media print exactly as a real print-to-PDF does
 *   5. Count pages by searching the PDF byte stream for leaf-page markers
 *      and assert the count is exactly 1
 *
 * Runs against the local source — no live API server required.
 * Safe to run in CI after every Receipt.tsx change.
 */

import { createServer }        from "http";
import { readFileSync }        from "fs";
import { resolve, dirname }    from "path";
import { fileURLToPath }       from "url";
import { execSync }            from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const receiptPath = resolve(__dirname, "../../ayyappan-temple/src/pages/Receipt.tsx");

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
// 1. Extract the CSS string from Receipt.tsx
//    The component embeds CSS in a <style>{`…`}</style> block.
//    We grab everything between the first backtick-template-literal open/close.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Extracting CSS from Receipt.tsx ──");

const src = readFileSync(receiptPath, "utf8");

// The file has multiple small <style>{`…`}</style> blocks (e.g. Spinner keyframes,
// SVG font import).  We need the main one that contains the @media print block.
// Strategy: find "@media print {" and then scan backwards to the enclosing `<style>{``.
const mediaPrintPos = src.indexOf("@media print {");
assert(mediaPrintPos !== -1, "Receipt.tsx contains an @media print block");

// Walk backwards from "@media print {" to find the nearest preceding "<style>{`"
const OPEN_TOKEN  = "<style>{`";
const CLOSE_TOKEN = "`}</style>";
let styleOpen = -1;
let searchFrom = mediaPrintPos;
while (searchFrom >= 0) {
  const idx = src.lastIndexOf(OPEN_TOKEN, searchFrom);
  if (idx === -1) break;
  // Verify this open token is before the @media print block
  if (idx < mediaPrintPos) { styleOpen = idx; break; }
  searchFrom = idx - 1;
}
const styleClose = styleOpen !== -1 ? src.indexOf(CLOSE_TOKEN, mediaPrintPos) : -1;

assert(styleOpen !== -1 && styleClose !== -1, "Receipt.tsx contains a <style>{`…`}</style> block enclosing @media print");

const cssText = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);

assert(cssText.includes("@media print"), "Extracted CSS contains @media print block");

// ─────────────────────────────────────────────────────────────────────────────
// 2. Build the HTML page
//    We replicate the exact DOM structure that Receipt.tsx renders for an
//    approved donation, including every CSS class, so the @media print rules
//    apply identically to what a real browser would print.
// ─────────────────────────────────────────────────────────────────────────────

const DONOR_NAME  = "திருமலை வேங்கடேஸ்வர நாயனார் குமாரசாமி";
const AMOUNT      = "₹10,00,000";
const PLACE       = "Vadamadurai, Tamil Nadu";
const TXN_ID      = "UPI202501011234567890";
const MESSAGE     = "ஐயப்பன் அருளால் அனைத்தும் நலமாக நடக்கும்";
const RECEIPT_NO  = "RCP-000042";
const DATE_EN     = "01 Jan 2025";
const DATE_TA     = "1 ஜனவரி 2025";

const html = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Donation Receipt – ${RECEIPT_NO}</title>
  <style>
${cssText}
  </style>
</head>
<body>
<div class="pg">

  <!-- action buttons (hidden in print) -->
  <div class="acts">
    <button class="btn-p">🖨️  Print / Save PDF</button>
    <a class="btn-h" href="/">🏠 முகப்பு</a>
  </div>

  <!-- DOCUMENT -->
  <div class="doc">
    <div class="doc-inner">

      <!-- HEADER -->
      <div class="hdr">
        <div class="hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
        <div class="hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        <div class="hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
        <div><span class="hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
      </div>

      <!-- TITLE STRIP -->
      <div class="strip">
        <div class="strip-line"></div>
        <span class="strip-en">Donation Receipt &nbsp;·&nbsp; நன்கொடை ரசீது</span>
        <div class="strip-line r"></div>
      </div>

      <!-- BLESSING -->
      <div class="bless">
        <div class="bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
        <div class="bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
      </div>

      <!-- META: receipt no + date -->
      <div class="meta">
        <div class="mc">
          <div class="mc-lbl">Receipt No.</div>
          <div class="mc-no">${RECEIPT_NO}</div>
        </div>
        <div class="mc-sep"></div>
        <div class="mc r">
          <div class="mc-lbl">Date</div>
          <div class="mc-date">${DATE_EN}</div>
          <div class="mc-date-ta">${DATE_TA}</div>
        </div>
      </div>

      <!-- DONOR TABLE -->
      <table class="tbl" cellpadding="0" cellspacing="0">
        <tbody>
          <tr class="tbl-head">
            <td colspan="2">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Donor Details</td>
          </tr>
          <!-- NAME row (highlighted) -->
          <tr class="row name-row">
            <td class="lbl">பெயர் / NAME</td>
            <td class="val name-val">${DONOR_NAME}</td>
          </tr>
          <!-- PLACE row -->
          <tr class="row">
            <td class="lbl">ஊர் / PLACE</td>
            <td class="val">${PLACE}</td>
          </tr>
          <!-- TXN ID row -->
          <tr class="row">
            <td class="lbl">பரிவர்த்தனை / TXN ID</td>
            <td class="val mono">${TXN_ID}</td>
          </tr>
          <!-- MESSAGE row -->
          <tr class="row">
            <td class="lbl">செய்தி / MESSAGE</td>
            <td class="val">${MESSAGE}</td>
          </tr>
        </tbody>
      </table>

      <!-- AMOUNT + SEAL -->
      <div class="amt">
        <div class="amt-left">
          <div class="amt-lbl">Donation Amount</div>
          <div class="amt-ta">நன்கொடை தொகை</div>
          <div class="amt-val">${AMOUNT}</div>
        </div>
        <div class="amt-right">
          <svg class="seal-svg" width="128" height="128" viewBox="0 0 128 128"
               xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="sarc" d="M 7,64 A 57,57 0 0,1 121,64"/>
            </defs>
            <circle cx="64" cy="64" r="61" fill="#f0fdf4"/>
            <circle cx="64" cy="64" r="61" fill="none" stroke="#15803d" stroke-width="3"/>
            <circle cx="64" cy="64" r="53" fill="none" stroke="#15803d" stroke-width="1.5"/>
            <circle cx="64" cy="64" r="49" fill="none" stroke="#16a34a"
                    stroke-width="0.7" stroke-dasharray="3 3"/>
            <text font-family="serif" font-size="10"
                  fill="#15803d" font-weight="700">
              <textPath href="#sarc" startOffset="50%" text-anchor="middle">
                ✦ ஸ்வாமியே சரணம் ஐயப்பா ✦
              </textPath>
            </text>
            <line x1="22" y1="73" x2="106" y2="73"
                  stroke="#86efac" stroke-width="1.2"/>
            <text x="64" y="91" text-anchor="middle"
                  font-family="serif"
                  font-size="18" font-weight="900" fill="#15803d">
              வடமதுரை
            </text>
            <text x="64" y="109" text-anchor="middle"
                  font-family="serif"
                  font-size="10" font-weight="700" fill="#166534">
              திருப்பணி குழு
            </text>
          </svg>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="ftr">
        <div class="ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
        <div class="ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
        <div class="ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
        <div class="ftr-rcpt">Official receipt &nbsp;·&nbsp; ${RECEIPT_NO} &nbsp;·&nbsp; ${DATE_EN}</div>
      </div>

    </div><!-- doc-inner -->
  </div><!-- doc -->

</div><!-- pg -->
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

console.log(`\n── Headless PDF generation ──`);
console.log(`  Serving receipt HTML on ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Open in headless Chromium and export PDF
// ─────────────────────────────────────────────────────────────────────────────

const { chromium } = await import("playwright");

// On NixOS, Playwright's bundled Chromium headless shell lacks patched rpath
// entries for Nix-store libraries.  We use the NixOS-native chromium binary
// installed as a system dependency instead.
// The `which chromium` lookup resolves through /run/current-system symlinks so
// the Nix store hash does not need to be hardcoded here.
function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    // last-resort fallback — correct at the time this test was written
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}
const NIXOS_CHROMIUM = resolveChromiumPath();

let browser;
try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext();
  const page    = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({
    format:               "A4",
    printBackground:      true,
    margin:               { top: "0", right: "0", bottom: "0", left: "0" },
  });

  console.log(`  PDF generated — ${pdfBuffer.length} bytes`);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Count pages
  //
  //    In a PDF byte stream each leaf page object contains the token sequence
  //      /Type /Page
  //    while the parent pages dictionary uses
  //      /Type /Pages   (note the trailing 's')
  //
  //    We search for /Type /Page NOT followed immediately by 's' to count
  //    only leaf pages.  This is reliable for Chromium-generated PDFs which
  //    embed one object per page.
  // ─────────────────────────────────────────────────────────────────────────

  const pdfText  = pdfBuffer.toString("latin1");  // safe 8-bit view
  const pageRe   = /\/Type\s*\/Page(?!s)/g;
  const pageMatches = [...pdfText.matchAll(pageRe)];
  const pageCount   = pageMatches.length;

  console.log(`  Page count detected in PDF: ${pageCount}`);

  assert(
    pageCount === 1,
    `PDF has exactly 1 page (actual: ${pageCount}) — receipt fits on one A4 sheet even with long name "${DONOR_NAME}", amount ${AMOUNT}, place, and message`
  );

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("receipt PDF page-count");
