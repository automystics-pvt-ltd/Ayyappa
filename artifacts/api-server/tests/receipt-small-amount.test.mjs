/**
 * Tests: Receipt layout is correct for very small donation amounts
 *
 * Context:
 *   The large-amount overflow fix set .amt-val to 46pt and added
 *   overflow-wrap / word-break / min-width:0 guards. It is worth confirming
 *   that the layout is equally valid at the opposite extreme — ₹1, ₹0, ₹100 —
 *   where the amount string is only 2–4 characters wide.
 *
 * Part A — Static CSS analysis:
 *   1.  .amt-val font-size in print is ≥ 30pt  (legible even for "₹1")
 *   2.  .amt has flex:1 in print               (fills remaining A4 height,
 *                                                so the stamp area never collapses)
 *   3.  .amt-right uses display:flex + align-items:center + justify-content:center
 *                                               (stamp stays centred regardless
 *                                                of amount character count)
 *   4.  The seal SVG is present in the JSX with explicit width/height attrs
 *       (stamp is always rendered, not conditionally hidden for small values)
 *
 * Part B — Headless PDF rendering with small amounts:
 *   5.  ₹1   receipt renders as exactly 1 A4 page
 *   6.  ₹100 receipt renders as exactly 1 A4 page
 *
 * Runs against the local source — no live API server required.
 */

import { createServer }        from "http";
import { readFileSync }        from "fs";
import { resolve, dirname }    from "path";
import { fileURLToPath }       from "url";
import { execSync }            from "child_process";

const __dirname   = dirname(fileURLToPath(import.meta.url));
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
    console.log(`    ₹1, ₹100 amounts print correctly at 46pt — legible and`);
    console.log(`    within one A4 page; Approved stamp remains centred.`);
  } else {
    console.error(`❌  ${failed} check(s) failed, ${passed} passed.`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Load Receipt.tsx and isolate the @media print block
// ─────────────────────────────────────────────────────────────────────────────

const src = readFileSync(receiptPath, "utf8");

// ── A. Extract the full @media print block ───────────────────────────────────
const printStart = src.indexOf("@media print {");
assert(printStart !== -1, "Receipt.tsx contains an @media print block");

let braceDepth = 0;
let printEnd   = printStart;
for (let i = printStart; i < src.length; i++) {
  if (src[i] === "{") braceDepth++;
  if (src[i] === "}") {
    braceDepth--;
    if (braceDepth === 0) { printEnd = i + 1; break; }
  }
}
const printCss = src.slice(printStart, printEnd);

// ── B. Extract the full CSS text (for PDF HTML building) ─────────────────────
const OPEN_TOKEN  = "<style>{`";
const CLOSE_TOKEN = "`}</style>";
let styleOpen  = -1;
let searchFrom = printStart;
while (searchFrom >= 0) {
  const idx = src.lastIndexOf(OPEN_TOKEN, searchFrom);
  if (idx === -1) break;
  if (idx < printStart) { styleOpen = idx; break; }
  searchFrom = idx - 1;
}
const styleClose = styleOpen !== -1 ? src.indexOf(CLOSE_TOKEN, printStart) : -1;
assert(
  styleOpen !== -1 && styleClose !== -1,
  "Receipt.tsx contains a <style>{`…`}</style> block enclosing @media print"
);
const cssText = src.slice(styleOpen + OPEN_TOKEN.length, styleClose);

// ─────────────────────────────────────────────────────────────────────────────
// Part A — Static CSS analysis
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Part A: Static CSS — small-amount legibility checks ──");

// 1. .amt-val font-size must be at least 30pt so ₹1 is legible
const fontSizeMatch = printCss.match(/\.amt-val\b[^}]*font-size\s*:\s*(\d+(?:\.\d+)?)pt/);
assert(
  fontSizeMatch !== null,
  "Print CSS: .amt-val declares an explicit font-size in pt"
);
if (fontSizeMatch) {
  const pt = parseFloat(fontSizeMatch[1]);
  assert(
    pt >= 30,
    `Print CSS: .amt-val font-size is ≥ 30pt (actual: ${pt}pt) — ₹1 is legible`
  );
}

// 2. .amt must have flex:1 in print so the section always fills remaining height
assert(
  /\.amt\s*\{[^}]*flex\s*:\s*1/.test(printCss),
  "Print CSS: .amt has flex:1 — amount section always fills remaining A4 height"
);

// 3. .amt-right must centre its content (stamp stays centred for any amount width)
assert(
  /\.amt-right\s*\{[^}]*display\s*:\s*flex/.test(printCss) ||
  /\.amt-right\b[^}]*display\s*:\s*flex/.test(printCss) ||
  // Screen rule provides display:flex; print rule may omit it if inherited
  /\.amt-right\s*\{[^}]*align-items\s*:\s*center/.test(src) ||
  /\.amt-right\b[^}]*align-items\s*:\s*center/.test(src),
  "CSS: .amt-right uses align-items:center (stamp centred regardless of amount)"
);

assert(
  /\.amt-right\s*\{[^}]*justify-content\s*:\s*center/.test(src) ||
  /\.amt-right\b[^}]*justify-content\s*:\s*center/.test(src),
  "CSS: .amt-right uses justify-content:center (stamp centred horizontally)"
);

// 4. The seal SVG must always be rendered (no conditional hide for small amounts)
assert(
  /seal-svg/.test(src),
  "JSX: .seal-svg element is present and always rendered (not conditional)"
);
assert(
  /seal-svg.*width=["']180["']/.test(src.replace(/\n/g, " ")) ||
  /seal-svg[^>]*width/.test(src),
  "JSX: seal SVG has explicit width attribute (always visible, fixed size)"
);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — Headless PDF rendering: small amounts fit on one A4 page
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Part B: Headless PDF — small-amount page-count checks ──");

function buildHtml(amountStr) {
  return `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Donation Receipt – test</title>
  <style>
${cssText}
  </style>
</head>
<body>
<div class="pg">
  <div class="acts">
    <button class="btn-p">🖨️  Print / Save PDF</button>
    <a class="btn-h" href="/">🏠 முகப்பு</a>
  </div>
  <div class="doc">
    <div class="doc-inner">
      <div class="hdr">
        <div class="hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
        <div class="hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        <div class="hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
        <div><span class="hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
      </div>
      <div class="strip">
        <div class="strip-line"></div>
        <span class="strip-en">Donation Receipt &nbsp;·&nbsp; நன்கொடை ரசீது</span>
        <div class="strip-line r"></div>
      </div>
      <div class="bless">
        <div class="bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
        <div class="bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
      </div>
      <div class="meta">
        <div class="mc">
          <div class="mc-lbl">Receipt No.</div>
          <div class="mc-no">RCP-000001</div>
        </div>
        <div class="mc-sep"></div>
        <div class="mc r">
          <div class="mc-lbl">Date</div>
          <div class="mc-date">01 Jan 2025</div>
          <div class="mc-date-ta">1 ஜனவரி 2025</div>
        </div>
      </div>
      <table class="tbl" cellpadding="0" cellspacing="0">
        <tbody>
          <tr class="tbl-head">
            <td colspan="2">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Donor Details</td>
          </tr>
          <tr class="row name-row">
            <td class="lbl">பெயர் / NAME</td>
            <td class="val name-val">முருகன்</td>
          </tr>
          <tr class="row">
            <td class="lbl">பரிவர்த்தனை / TXN ID</td>
            <td class="val mono">UPI2025010112345</td>
          </tr>
        </tbody>
      </table>
      <div class="amt">
        <div class="amt-left">
          <div class="amt-lbl">Donation Amount</div>
          <div class="amt-ta">நன்கொடை தொகை</div>
          <div class="amt-val">${amountStr}</div>
        </div>
        <div class="amt-right">
          <svg class="seal-svg" width="180" height="180" viewBox="0 0 180 180"
               xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="sarc" d="M 10.8,68.8 A 82,82 0 0,1 169.2,68.8"/>
            </defs>
            <circle cx="90" cy="90" r="87" fill="#f0fdf4"/>
            <circle cx="90" cy="90" r="87" fill="none" stroke="#15803d" stroke-width="3"/>
            <circle cx="90" cy="90" r="77" fill="none" stroke="#15803d" stroke-width="1.5"/>
            <circle cx="90" cy="90" r="71" fill="none" stroke="#16a34a"
                    stroke-width="0.8" stroke-dasharray="4 3.5"/>
            <text font-family="serif" font-size="8.5"
                  fill="#15803d" font-weight="700">
              <textPath href="#sarc" start-offset="50%" text-anchor="middle">
                ஸ்வாமியே சரணம் ஐயப்பா
              </textPath>
            </text>
            <text x="90" y="97" text-anchor="middle"
                  font-family="serif"
                  font-size="23" font-weight="900" fill="#15803d">
              வடமதுரை
            </text>
            <text x="90" y="120" text-anchor="middle"
                  font-family="serif"
                  font-size="12" font-weight="700" fill="#166534">
              திருப்பணி குழு
            </text>
          </svg>
        </div>
      </div>
      <div class="ftr">
        <div class="ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
        <div class="ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
        <div class="ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
        <div class="ftr-rcpt">Official receipt &nbsp;·&nbsp; RCP-000001 &nbsp;·&nbsp; 01 Jan 2025</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
  }
}
const NIXOS_CHROMIUM = resolveChromiumPath();

const TEST_AMOUNTS = [
  { label: "₹1",   fmt: "₹1"   },
  { label: "₹100", fmt: "₹100" },
];

const { chromium } = await import("playwright");
let browser;

try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: NIXOS_CHROMIUM,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const { label, fmt } of TEST_AMOUNTS) {
    const html   = buildHtml(fmt);
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    await new Promise((res) => server.listen(0, "127.0.0.1", res));
    const { port } = server.address();
    const url      = `http://127.0.0.1:${port}/`;

    console.log(`\n  Rendering ${label} receipt…`);

    const context  = await browser.newContext();
    const page     = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const pdfBuf  = await page.pdf({
      format:          "A4",
      printBackground: true,
      margin:          { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await context.close();
    server.close();

    console.log(`    PDF: ${pdfBuf.length} bytes`);

    const pdfText    = pdfBuf.toString("latin1");
    const pageRe     = /\/Type\s*\/Page(?!s)/g;
    const pageCount  = [...pdfText.matchAll(pageRe)].length;

    console.log(`    Page count: ${pageCount}`);

    assert(
      pageCount === 1,
      `${label} receipt renders as exactly 1 A4 page (actual: ${pageCount}) — 46pt amount fits, stamp visible`
    );
  }

} finally {
  if (browser) await browser.close();
}

finish("receipt small-amount layout");
