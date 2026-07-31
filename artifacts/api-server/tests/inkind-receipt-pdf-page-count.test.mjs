/**
 * Tests: In-Kind Contribution Receipt renders as exactly one A4 page when printed
 *
 * Approach:
 *   1. Extract the print CSS block verbatim from ContributionReceipt.tsx (source of truth)
 *   2. Build a standalone HTML page that mirrors the full receipt DOM with
 *      maximum-content data:
 *        • donor name  : long Tamil name (37 chars)
 *        • place       : "Vadamadurai, Tamil Nadu"
 *        • description : long Tamil description (60+ chars) — the stress field for
 *                        in-kind receipts (equivalent to the amount field in donations)
 *   3. Serve the HTML from a local HTTP server so Playwright can load it
 *   4. Open the page in headless Chromium and call page.pdf({ format: "A4" })
 *      which triggers @media print exactly as a real print-to-PDF does
 *   5. Count pages by searching the PDF byte stream for leaf-page markers
 *      and assert the count is exactly 1
 *
 * Runs against the local source — no live API server required.
 * Safe to run in CI after every ContributionReceipt.tsx change.
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
//    The component embeds CSS in a <style>{`…`}</style> block.
//    We locate the block that encloses the @media print rule.
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
// 2. Build the HTML page
//    Replicates the exact DOM structure ContributionReceipt.tsx renders,
//    using maximum-content data to stress-test layout under print CSS.
// ─────────────────────────────────────────────────────────────────────────────

const DONOR_NAME  = "திருமலை வேங்கடேஸ்வர நாயனார் குமாரசாமி";
const PLACE       = "Vadamadurai, Tamil Nadu";
// 60+ char Tamil description — the key stress field for in-kind receipts
const DESCRIPTION = "அரிசி, பருப்பு, எண்ணெய், வெல்லம், தேங்காய் மற்றும் பூஜை பொருட்கள் அனைத்தும்";
const RECEIPT_NO  = "IKC-000042";
const DATE_EN     = "01 Jan 2025";
const DATE_TA     = "1 ஜனவரி 2025";

const html = `<!DOCTYPE html>
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

      <!-- HEADER -->
      <div class="ikc-hdr">
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
          <div class="ikc-desc-text">${DESCRIPTION}</div>
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
console.log(`  Serving in-kind receipt HTML on ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Open in headless Chromium and export PDF
// ─────────────────────────────────────────────────────────────────────────────

const { chromium } = await import("playwright");

// On NixOS, Playwright's bundled Chromium headless shell lacks patched rpath
// entries for Nix-store libraries.  We use the NixOS-native chromium binary
// installed as a system dependency instead.
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
    format:          "A4",
    printBackground: true,
    margin:          { top: "0", right: "0", bottom: "0", left: "0" },
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

  const pdfText     = pdfBuffer.toString("latin1");   // safe 8-bit view
  const pageRe      = /\/Type\s*\/Page(?!s)/g;
  const pageMatches = [...pdfText.matchAll(pageRe)];
  const pageCount   = pageMatches.length;

  console.log(`  Page count detected in PDF: ${pageCount}`);

  assert(
    pageCount === 1,
    `PDF has exactly 1 page (actual: ${pageCount}) — in-kind receipt fits on one A4 sheet` +
    ` even with long name "${DONOR_NAME}", place, and 60+ char description`
  );

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("in-kind receipt PDF page-count");
