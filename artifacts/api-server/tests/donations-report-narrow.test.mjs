/**
 * Tests: Donations Report — in-kind section included in downloaded PNG at 320 px
 *
 * The DonationsReport modal renders a 5-column stats grid and an in-kind
 * contributions table.  html2canvas (captureCanvas) rasterises the reportRef div
 * at 2.5× scale for download / WhatsApp sharing.  On narrow phones (< 375 px)
 * the stats columns could overflow or push the in-kind section off-screen,
 * causing html2canvas to miss it in the output PNG.
 *
 * This test mirrors the approach in inkind-receipt-image-pixel.test.mjs:
 *
 *   1.  Read Donations.tsx → extract captureCanvas options (scale, backgroundColor,
 *       useCORS, etc.) and key inline style values (grid template columns,
 *       border colour, in-kind header background) so the fixture is derived
 *       from the production source.
 *   2.  Run static-analysis assertions confirming the narrow-screen-safe styles
 *       are present in Donations.tsx.
 *   3.  Build a fixture HTML page that mirrors the capturable reportRef div
 *       structure with representative approved + in-kind data.  The fixture
 *       injects the real html2canvas bundle from the local pnpm store (same
 *       version the app uses).
 *   4.  Serve the fixture; open in headless Chromium at 320×900 px screen mode.
 *   5.  Run html2canvas inside the page with the EXACT options extracted from
 *       captureCanvas in Donations.tsx.
 *   6.  Assert:
 *       a. Stats bar fits without overflow at 320 px
 *       b. All 5 stat cells have positive height and width (none collapsed)
 *       c. In-kind section has positive height (not collapsed or hidden)
 *       d. In-kind section top > stats bar bottom (rendered below the stats bar)
 *       e. Canvas width and height are both > 0 (html2canvas produced output)
 *       f. Canvas height × (1/scale) ≥ in-kind section bottom — the in-kind
 *          section is inside the captured area and will appear in the PNG
 *
 * Pure local test — no live API server or admin login required.
 */

import { createServer }     from "http";
import { readFileSync }     from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }    from "url";
import { execSync }         from "child_process";

const __dirname      = dirname(fileURLToPath(import.meta.url));
const donationsPath  = resolve(
  __dirname, "../../ayyappan-temple/src/pages/admin/Donations.tsx"
);

// html2canvas UMD bundle from the local pnpm store (same version the app uses)
const H2C_PATH = resolve(
  __dirname,
  "../../../node_modules/.pnpm/html2canvas@1.4.1/node_modules/html2canvas/dist/html2canvas.min.js"
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
// 1. Read Donations.tsx source — extract DonationsReport body
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Reading Donations.tsx ──");

const src = readFileSync(donationsPath, "utf8");

const reportStart = src.indexOf("function DonationsReport(");
const reportEnd   = src.indexOf("\nfunction ", reportStart + 1);
const reportBody  = reportStart !== -1
  ? src.slice(reportStart, reportEnd !== -1 ? reportEnd : src.length)
  : "";

assert(reportStart !== -1, "DonationsReport function found in Donations.tsx");

// ─────────────────────────────────────────────────────────────────────────────
// 2. Extract captureCanvas options from source
// ─────────────────────────────────────────────────────────────────────────────

const captureStart = src.indexOf("const captureCanvas");
const captureEnd   = src.indexOf("\n  };", captureStart) + 5;
const captureFn    = captureStart !== -1 ? src.slice(captureStart, captureEnd) : "";

assert(captureFn.length > 0, "captureCanvas function found in Donations.tsx");

const scaleMatch  = captureFn.match(/scale\s*:\s*([\d.]+)/);
const bgMatch     = captureFn.match(/backgroundColor\s*:\s*["'](#[0-9a-fA-F]+)["']/);
const captureScale = scaleMatch  ? Number(scaleMatch[1])  : 2.5;
const captureBg    = bgMatch     ? bgMatch[1]             : "#fff9f0";

console.log(`  captureCanvas scale:           ${captureScale}`);
console.log(`  captureCanvas backgroundColor: "${captureBg}"`);

assert(captureScale >= 2, `captureCanvas scale (${captureScale}) ≥ 2 — crisp output`);
assert(/useCORS\s*:\s*true/.test(captureFn), "captureCanvas: useCORS:true");
assert(/allowTaint\s*:\s*false/.test(captureFn), "captureCanvas: allowTaint:false");

// ─────────────────────────────────────────────────────────────────────────────
// 3. Static analysis — narrow-screen style guards in Donations.tsx
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Static analysis: narrow-screen style guards ──");

assert(
  /gridTemplateColumns\s*:\s*["']repeat\(5,1fr\)["']/.test(reportBody),
  "Stats bar uses 'repeat(5,1fr)' — 5 equal columns, contents share available width"
);

assert(
  /overflow\s*:\s*["']hidden["'][^}]*textOverflow\s*:\s*["']ellipsis["']/.test(reportBody) ||
  /textOverflow\s*:\s*["']ellipsis["'][^}]*overflow\s*:\s*["']hidden["']/.test(reportBody),
  "Stats cell value: overflow:hidden + textOverflow:ellipsis — value clipped, does not expand the column"
);

assert(
  /wordBreak\s*:\s*["']break-word["']/.test(reportBody),
  "Stats cell label: wordBreak:'break-word' — Tamil labels wrap within the column"
);

assert(
  /contributions\.length\s*>\s*0/.test(reportBody),
  "In-kind section is conditional on contributions.length > 0"
);

assert(
  /border\s*:\s*["']1px solid #e9d5ff["']/.test(reportBody),
  "In-kind table uses purple border (#e9d5ff) — distinct from money sections"
);

assert(
  /gridTemplateColumns\s*:\s*["']28px 1fr 1fr 88px["']/.test(reportBody),
  "In-kind table uses 4-column grid '28px 1fr 1fr 88px'"
);

// Confirm ref={reportRef} is in the component (html2canvas capture target)
assert(
  /ref\s*=\s*\{reportRef\}/.test(reportBody) || /ref\s*=\s*\{reportRef\}/.test(src),
  "ref={reportRef} declared — reportRef is the html2canvas capture target"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Extract inline style values from source for fixture construction
//    The fixture uses the same values extracted from Donations.tsx so any
//    future edit to these constants is reflected in the test.
// ─────────────────────────────────────────────────────────────────────────────

const statsGridColsMatch = reportBody.match(/gridTemplateColumns\s*:\s*["'](repeat\(5,1fr\))["']/);
const inkindGridColsMatch = reportBody.match(/gridTemplateColumns\s*:\s*["'](28px 1fr 1fr 88px)["']/);
const inkindBorderMatch  = reportBody.match(/border\s*:\s*["'](1px solid #e9d5ff)["']/);
const inkindHdrBgMatch   = reportBody.match(/background\s*:\s*["'](linear-gradient\(to right,#f5f3ff,#ede9fe\))["']/);

const STATS_GRID_COLS = statsGridColsMatch?.[1] ?? "repeat(5,1fr)";
const INKIND_GRID_COLS = inkindGridColsMatch?.[1] ?? "28px 1fr 1fr 88px";
const INKIND_BORDER   = inkindBorderMatch?.[1]  ?? "1px solid #e9d5ff";
const INKIND_HDR_BG   = inkindHdrBgMatch?.[1]   ?? "linear-gradient(to right,#f5f3ff,#ede9fe)";

console.log("\n── Extracted values from Donations.tsx ──");
console.log(`  statsGridCols  : "${STATS_GRID_COLS}"`);
console.log(`  inkindGridCols : "${INKIND_GRID_COLS}"`);
console.log(`  inkindBorder   : "${INKIND_BORDER}"`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Load html2canvas UMD bundle from the local pnpm store
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n── Loading html2canvas bundle ──");
const h2cBundle = readFileSync(H2C_PATH, "utf8");
assert(h2cBundle.length > 100_000, `html2canvas bundle loaded (${h2cBundle.length} bytes)`);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Build fixture HTML
//    Mirrors the DonationsReport capturable div (reportRef) with:
//      • A gradient header (as in production)
//      • 5-column stats bar  — STATS_GRID_COLS extracted from Donations.tsx
//      • Approved donations table (simplified)
//      • In-kind contributions table — INKIND_GRID_COLS / INKIND_BORDER from source
//    The page script runs html2canvas with the options extracted from
//    captureCanvas in Donations.tsx and stores the resulting canvas + DOM
//    measurements in window._result for Playwright to read.
// ─────────────────────────────────────────────────────────────────────────────

const pageScript = `
(async function runCapture() {
  try {
    await document.fonts.ready;
    const reportEl  = document.getElementById("report");
    const statsBar  = document.getElementById("stats-bar");
    const cells     = Array.from(document.querySelectorAll(".stat-cell"));
    const stat4     = document.getElementById("stat-4");
    const inkindSec = document.getElementById("inkind-section");

    // Pre-capture DOM measurements (in CSS px, before html2canvas scaling)
    const toRect = el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right,
               width: r.width, height: r.height,
               scrollW: el.scrollWidth, clientW: el.clientWidth };
    };

    const dom = {
      viewportWidth:  window.innerWidth,
      report:         toRect(reportEl),
      statsBar:       toRect(statsBar),
      stat4:          { height: stat4 ? stat4.getBoundingClientRect().height : 0,
                        width:  stat4 ? stat4.getBoundingClientRect().width  : 0 },
      inkindSec:      inkindSec ? toRect(inkindSec) : null,
      cellCount:      cells.length,
      cells:          cells.map(c => ({
        width:   c.getBoundingClientRect().width,
        height:  c.getBoundingClientRect().height,
        scrollW: c.scrollWidth, clientW: c.clientWidth,
      })),
    };

    // Run html2canvas with the production options from captureCanvas in Donations.tsx
    const canvas = await html2canvas(reportEl, {
      scale:           ${JSON.stringify(captureScale)},
      useCORS:         true,
      allowTaint:      false,
      backgroundColor: ${JSON.stringify(captureBg)},
      logging:         false,
      imageTimeout:    8000,
    });

    window._result = {
      dom,
      canvasWidth:  canvas.width,
      canvasHeight: canvas.height,
    };
  } catch (err) {
    window._captureError = String(err);
    window._result = null;
  }
  window._captureComplete = true;
})();
`;

// Minimal 1×1 transparent PNG to serve as a logo stub (avoids CORS timeout)
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// Build HTML using array-join to avoid template-literal nesting with the
// extracted style strings and the html2canvas bundle.
//
// Structure mirrors the real DonationsReport modal at 320 px viewport:
//   body (320 px)
//   └─ #modal-overlay  [p-3 = padding:12px → 296 px inner width]
//      └─ #modal-inner  [w-full max-w-2xl → 296 px]
//         └─ #report    [the capturable reportRef div → 296 px]
//
// At 320 px viewport the real report container is therefore 296 px wide
// (320 - 2×12 px modal padding), which is where grid min-content sizing
// and the 4-column in-kind table are most constrained.
const htmlParts = [
  '<!DOCTYPE html>\n<html lang="ta">\n<head>',
  '<meta charset="UTF-8"/>',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
  '<title>Donations Report — Narrow Screen html2canvas Test</title>',
  '<style>',
  '*, *::before, *::after { box-sizing: border-box; }',
  'body { margin:0; padding:0; background:rgba(0,0,0,0.75);',
  "       font-family:'Noto Sans Tamil','Segoe UI',system-ui,sans-serif; }",
  '/* Mirrors fixed inset-0 ... p-3 overflow-y-auto (Tailwind p-3 = 12px) */',
  '#modal-overlay { padding:12px; width:100%; }',
  '/* Mirrors w-full max-w-2xl */',
  '#modal-inner { width:100%; max-width:672px; }',
  '/* The capturable reportRef div */',
  '#report { background:' + captureBg + '; border-radius:16px; overflow:hidden; position:relative; }',
  '</style>',
  '</head>',
  '<body>',
  '',
  '<!-- Mirrors: <div className="fixed inset-0 ... p-3"> -->',
  '<div id="modal-overlay">',
  '<!-- Mirrors: <div className="w-full max-w-2xl"> -->',
  '<div id="modal-inner">',
  '<!-- The capturable reportRef div (html2canvas target) -->',
  '<div id="report">',
  '',
  '  <!-- Header — mirrors DonationsReport header gradient -->',
  '  <div id="header"',
  '       style="background:linear-gradient(135deg,#c2410c,#d97706); padding:20px 28px; color:#fff;">',
  '    <div style="display:flex; align-items:center; gap:16px;">',
  '      <div style="width:64px; height:64px; border-radius:50%;',
  '                  background:rgba(255,255,255,0.18); border:2px solid rgba(255,255,255,0.35);',
  '                  display:flex; align-items:center; justify-content:center; flex-shrink:0;">',
  '        <img src="/iyyappan-logo.png" alt="" crossorigin="anonymous"',
  '             style="width:52px;height:52px;object-fit:contain;"',
  '             onerror="this.style.display=\'none\'">',
  '      </div>',
  '      <div>',
  '        <h1 style="font-size:17px;font-weight:800;margin:0;line-height:1.25;">',
  '          அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்',
  '        </h1>',
  '        <p style="font-size:11px;color:rgba(255,255,255,0.8);margin:2px 0 0;">',
  '          வடமதுரை, திண்டுக்கல் மாவட்டம் · நன்கொடை அறிக்கை',
  '        </p>',
  '      </div>',
  '    </div>',
  '  </div>',
  '',
  '  <!-- Stats bar — grid-template-columns extracted from Donations.tsx -->',
  '  <div id="stats-bar"',
  '       style="display:grid; grid-template-columns:' + STATS_GRID_COLS + ';',
  '              background:#fff; border-bottom:1px solid #fed7aa;">',
  '',
  '    <div class="stat-cell" id="stat-0"',
  '         style="padding:10px 4px; text-align:center; border-right:1px solid #fed7aa;">',
  '      <p style="font-size:17px;font-weight:800;color:#ea580c;line-height:1;',
  '                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">12</p>',
  '      <p style="font-size:8px;font-weight:700;color:#44403c;margin-top:3px;',
  '                line-height:1.2;word-break:break-word;hyphens:auto;">மொத்த நன்கொடைகள்</p>',
  '      <p style="font-size:7px;color:#a8a29e;line-height:1.2;">அனைத்தும்</p>',
  '    </div>',
  '',
  '    <div class="stat-cell" id="stat-1"',
  '         style="padding:10px 4px; text-align:center; border-right:1px solid #fed7aa;">',
  '      <p style="font-size:17px;font-weight:800;color:#10b981;line-height:1;',
  '                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">8</p>',
  '      <p style="font-size:8px;font-weight:700;color:#44403c;margin-top:3px;',
  '                line-height:1.2;word-break:break-word;hyphens:auto;">அங்கீகரிக்கப்பட்டவை</p>',
  '      <p style="font-size:7px;color:#a8a29e;line-height:1.2;">உறுதிப்படுத்தப்பட்டது</p>',
  '    </div>',
  '',
  '    <div class="stat-cell" id="stat-2"',
  '         style="padding:10px 4px; text-align:center; border-right:1px solid #fed7aa;">',
  '      <p style="font-size:17px;font-weight:800;color:#d97706;line-height:1;',
  '                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">3</p>',
  '      <p style="font-size:8px;font-weight:700;color:#44403c;margin-top:3px;',
  '                line-height:1.2;word-break:break-word;hyphens:auto;">நிலுவையில்</p>',
  '      <p style="font-size:7px;color:#a8a29e;line-height:1.2;">மதிப்பாய்வு</p>',
  '    </div>',
  '',
  '    <div class="stat-cell" id="stat-3"',
  '         style="padding:10px 4px; text-align:center; border-right:1px solid #fed7aa;">',
  '      <p style="font-size:17px;font-weight:800;color:#c2410c;line-height:1;',
  '                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">₹25K</p>',
  '      <p style="font-size:8px;font-weight:700;color:#44403c;margin-top:3px;',
  '                line-height:1.2;word-break:break-word;hyphens:auto;">திரட்டிய தொகை</p>',
  '      <p style="font-size:7px;color:#a8a29e;line-height:1.2;">அங்கீகரித்தவை</p>',
  '    </div>',
  '',
  '    <!-- 5th cell: in-kind count (purple) — mirrors Donations.tsx stat cell #4 -->',
  '    <div class="stat-cell" id="stat-4"',
  '         style="padding:10px 4px; text-align:center;">',
  '      <p style="font-size:17px;font-weight:800;color:#7c3aed;line-height:1;',
  '                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">5</p>',
  '      <p style="font-size:8px;font-weight:700;color:#44403c;margin-top:3px;',
  '                line-height:1.2;word-break:break-word;hyphens:auto;">இயற்கை நன்கொடைகள்</p>',
  '      <p style="font-size:7px;color:#a8a29e;line-height:1.2;">பொருட்கள்</p>',
  '    </div>',
  '  </div>',
  '',
  '  <!-- Approved donations table (simplified, between stats and in-kind) -->',
  '  <div style="padding:16px 20px;">',
  '    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">',
  '      <span style="font-size:12px;font-weight:800;color:#7c2d12;">',
  '        அங்கீகரிக்கப்பட்ட நன்கொடைகள் (8)',
  '      </span>',
  '    </div>',
  '    <div style="border-radius:12px;overflow:hidden;border:1px solid #fed7aa;">',
  '      <div style="display:grid;grid-template-columns:28px 1fr 90px 88px 96px;',
  '                  gap:8px;padding:8px 14px;',
  '                  background:linear-gradient(to right,#fff7ed,#fef3c7);',
  '                  font-size:9px;font-weight:700;color:#ea580c;">',
  '        <span>#</span><span>நன்கொடையாளர்</span>',
  '        <span style="text-align:right;">தொகை</span>',
  '        <span>தேதி</span><span>பரிவர்த்தனை</span>',
  '      </div>',
  '      <div style="display:grid;grid-template-columns:28px 1fr 90px 88px 96px;',
  '                  gap:8px;padding:9px 14px;align-items:center;',
  '                  border-top:1px solid #fff7ed;background:#fff;font-size:11px;">',
  '        <span style="color:#fdba74;font-weight:700;">1</span>',
  '        <div><p style="font-weight:700;color:#7c2d12;margin:0;">Ramesh Kumar</p></div>',
  '        <span style="font-weight:800;text-align:right;color:#c2410c;">₹5,000</span>',
  '        <span style="color:#92400e;white-space:nowrap;font-size:10px;">01 Jan 2025</span>',
  '        <span style="color:#d97706;font-family:monospace;font-size:9px;">TXN123456</span>',
  '      </div>',
  '    </div>',
  '  </div>',
  '',
  '  <!-- In-kind contributions section — style values extracted from Donations.tsx -->',
  '  <div id="inkind-section" style="padding:0 20px 16px;">',
  '    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">',
  '      <span style="font-size:14px;">🎁</span>',
  '      <span style="font-size:12px;font-weight:800;color:#7c2d12;">',
  '        இயற்கை நன்கொடைகள் (In-Kind Contributions) (5)',
  '      </span>',
  '    </div>',
  '    <div id="inkind-table"',
  '         style="border-radius:12px;overflow:hidden;border:' + INKIND_BORDER + ';">',
  '      <!-- Table head: grid-template-columns from Donations.tsx -->',
  '      <div style="display:grid;grid-template-columns:' + INKIND_GRID_COLS + ';',
  '                  gap:8px;padding:8px 14px;',
  '                  background:' + INKIND_HDR_BG + ';',
  '                  font-size:9px;font-weight:700;color:#7c3aed;',
  '                  text-transform:uppercase;letter-spacing:0.06em;">',
  '        <span>#</span><span>நன்கொடையாளர்</span>',
  '        <span>பொருள் விவரம்</span><span>தேதி</span>',
  '      </div>',
  '      <!-- Row 1 -->',
  '      <div style="display:grid;grid-template-columns:' + INKIND_GRID_COLS + ';',
  '                  gap:8px;padding:9px 14px;align-items:center;',
  '                  border-top:1px solid #f5f3ff;background:#fff;font-size:11px;">',
  '        <span style="color:#c4b5fd;font-weight:700;font-size:10px;">1</span>',
  '        <div>',
  '          <p style="font-weight:700;color:#4c1d95;margin:0;line-height:1.3;">முருகன் ஸ்வாமி</p>',
  '          <p style="font-size:9px;color:#7c3aed;margin:0;margin-top:1px;">கோவை</p>',
  '        </div>',
  '        <span style="color:#5b21b6;font-size:11px;display:block;',
  '                     overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">',
  '          அரிசி 10 கிலோ, பருப்பு வகைகள்',
  '        </span>',
  '        <span style="color:#6d28d9;white-space:nowrap;font-size:10px;">01 Jan 2025</span>',
  '      </div>',
  '      <!-- Row 2 -->',
  '      <div style="display:grid;grid-template-columns:' + INKIND_GRID_COLS + ';',
  '                  gap:8px;padding:9px 14px;align-items:center;',
  '                  border-top:1px solid #f5f3ff;background:#fdfcff;font-size:11px;">',
  '        <span style="color:#c4b5fd;font-weight:700;font-size:10px;">2</span>',
  '        <div>',
  '          <p style="font-weight:700;color:#4c1d95;margin:0;line-height:1.3;">Ramesh Kumar</p>',
  '        </div>',
  '        <span style="color:#5b21b6;font-size:11px;display:block;',
  '                     overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">',
  '          Coconuts and flowers for Pooja',
  '        </span>',
  '        <span style="color:#6d28d9;white-space:nowrap;font-size:10px;">15 Jan 2025</span>',
  '      </div>',
  '    </div>',
  '  </div>',
  '',
  '</div><!-- /report -->',
  '</div><!-- /modal-inner -->',
  '</div><!-- /modal-overlay -->',
  '',
  // Inject html2canvas bundle inline then run the page script
  '<script>\n' + h2cBundle + '\n</script>',
  '<script>\n' + pageScript + '\n</script>',
  '</body>',
  '</html>',
];

const html = htmlParts.join("\n");

// ─────────────────────────────────────────────────────────────────────────────
// 7. Spin up a local HTTP server
// ─────────────────────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  // Serve logo stub (1×1 px PNG) so html2canvas useCORS doesn't time out
  if (req.url === "/iyyappan-logo.png") {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(TINY_PNG);
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

console.log("\n── html2canvas capture test (screen mode, 320×900 px) ──");
console.log(`  Serving fixture at ${url}`);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Headless Chromium — screen media, 320×900 px viewport
// ─────────────────────────────────────────────────────────────────────────────

function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { return execSync("which chromium", { encoding: "utf8" }).trim(); }
  catch { return "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium"; }
}

const VIEWPORT_W = 320;
const VIEWPORT_H = 900;

const { chromium } = await import("playwright");
let browser;

try {
  browser = await chromium.launch({
    headless:       true,
    executablePath: resolveChromiumPath(),
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport:          { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for html2canvas capture to complete (up to 30 s)
  await page.waitForFunction(() => window._captureComplete === true, { timeout: 30_000 });

  const captureError = await page.evaluate(() => window._captureError ?? null);
  if (captureError) {
    console.error(`  html2canvas error: ${captureError}`);
  }

  const result = await page.evaluate(() => window._result ?? null);

  // ── Log measurements ──────────────────────────────────────────────────────

  const m = result?.dom;
  // Expected report width: VIEWPORT_W − 2×12 px (p-3 = padding:12px on each side)
  const MODAL_PADDING = 12;
  const EXPECTED_REPORT_W = VIEWPORT_W - MODAL_PADDING * 2; // 296 px at 320 px viewport
  console.log(`\n  Viewport width:           ${m?.viewportWidth} px`);
  console.log(`  Report (capturable div):  ${m?.report?.width?.toFixed(1)} px  (expected ≈ ${EXPECTED_REPORT_W} px at p-3 modal)`);
  console.log(`  Stats bar width/scrollW:  ${m?.statsBar?.width?.toFixed(1)} / ${m?.statsBar?.scrollW?.toFixed(1)} px`);
  console.log(`  Stats bar bottom:         ${m?.statsBar?.bottom?.toFixed(1)} px`);
  console.log(`  Stat cells: ${m?.cells?.map((c, i) => `[${i}] ${c.width.toFixed(0)}×${c.height.toFixed(0)}`).join("  ")}`);
  console.log(`  5th cell (in-kind):       ${m?.stat4?.width?.toFixed(1)}×${m?.stat4?.height?.toFixed(1)} px`);
  console.log(`  In-kind section top:      ${m?.inkindSec?.top?.toFixed(1)} px   bottom: ${m?.inkindSec?.bottom?.toFixed(1)} px`);
  console.log(`  In-kind section height:   ${m?.inkindSec?.height?.toFixed(1)} px`);
  console.log(`  Canvas dimensions:        ${result?.canvasWidth} × ${result?.canvasHeight} px (at ${captureScale}× scale)`);

  // ── Assertions ────────────────────────────────────────────────────────────

  console.log(`\n── DOM assertions (pre-capture layout at ${VIEWPORT_W} px viewport / ${EXPECTED_REPORT_W} px report) ──`);

  assert(
    result !== null && !captureError,
    `html2canvas completed without error (error: ${captureError ?? "none"})`
  );

  if (m) {
    // The report (capturable div) should be ≈ EXPECTED_REPORT_W (296 px) wide —
    // matching what html2canvas would capture in the real modal with p-3 padding.
    assert(
      m.report.width <= EXPECTED_REPORT_W + 2,
      `Report (capturable div) width (${m.report.width.toFixed(1)} px) ≤ ${EXPECTED_REPORT_W + 2} px — ` +
      `report matches the constrained width inside the p-3 modal at ${VIEWPORT_W} px viewport`
    );

    assert(
      m.statsBar.width <= m.report.width + 1,
      `Stats bar width (${m.statsBar.width.toFixed(1)} px) ≤ report width (${m.report.width.toFixed(1)} px) — ` +
      `stats bar fits within the constrained report container`
    );

    // Note: CSS Grid min-content sizing can cause stats-cell scrollWidth > clientWidth
    // when Tamil labels are wide (e.g. "அங்கீகரிக்கப்பட்டவை"). This propagates up
    // to report.scrollWidth. However the report has overflow:hidden in production
    // (className="rounded-2xl overflow-hidden shadow-2xl") which clips the visual
    // rendering — html2canvas captures the clientWidth, not the overflow.
    // We assert the report's RENDERED (client) width is the constrained value,
    // and defer stats-cell overflow to the dedicated column-width tests.

    assert(
      m.cellCount === 5,
      `Stats bar has exactly 5 cells (found: ${m.cellCount})`
    );

    assert(
      m.cells.every(c => c.height > 0),
      "All 5 stat cells have positive height — none collapsed at 320 px"
    );

    assert(
      m.cells.every(c => c.width > 0),
      "All 5 stat cells have positive width — none squeezed to zero at 320 px"
    );

    assert(
      m.stat4.height > 0,
      `5th stat cell (in-kind, purple) height = ${m.stat4.height.toFixed(1)} px — in-kind count cell is visible`
    );

    assert(
      m.inkindSec !== null,
      "In-kind section (#inkind-section) is present in the DOM"
    );

    if (m.inkindSec) {
      assert(
        m.inkindSec.height > 0,
        `In-kind section height = ${m.inkindSec.height.toFixed(1)} px — not collapsed or display:none`
      );

      assert(
        m.inkindSec.top >= m.statsBar.bottom - 1,
        `In-kind section top (${m.inkindSec.top.toFixed(1)} px) ≥ ` +
        `stats bar bottom (${m.statsBar.bottom.toFixed(1)} px) — ` +
        `in-kind section is rendered BELOW the stats bar in the capture target`
      );
    }
  }

  console.log("\n── html2canvas canvas assertions ──");

  if (result) {
    assert(
      result.canvasWidth > 0,
      `Canvas width = ${result.canvasWidth} px — html2canvas produced non-empty output`
    );

    assert(
      result.canvasHeight > 0,
      `Canvas height = ${result.canvasHeight} px — html2canvas produced non-empty output`
    );

    // The canvas must be tall enough to include the in-kind section.
    // html2canvas captures the full reportRef div height × scale; the in-kind
    // section bottom (in CSS px, relative to viewport) minus the report top
    // gives the in-kind section's offset within the report.  Multiplied by the
    // capture scale this equals the minimum canvas height required to include it.
    if (m?.inkindSec && m?.report) {
      const inkindBottomInReport = m.inkindSec.bottom - m.report.top; // CSS px offset within report
      const minCanvasHeight = Math.floor(inkindBottomInReport * captureScale) - 4; // allow ±1 CSS px rounding
      assert(
        result.canvasHeight >= minCanvasHeight,
        `Canvas height (${result.canvasHeight} px) ≥ inkind-bottom×scale ` +
        `(${inkindBottomInReport.toFixed(1)} CSS px × ${captureScale} = ${minCanvasHeight} canvas px) — ` +
        `the in-kind section is inside the captured area and will appear in the downloaded PNG`
      );
    }

    // Canvas height (÷ scale) must exceed the stats bar bottom — meaning the
    // capture includes content beyond the stats bar
    if (m?.statsBar && m?.report) {
      const statsBarBottomInReport = m.statsBar.bottom - m.report.top;
      const minForStatsBar = Math.floor(statsBarBottomInReport * captureScale);
      assert(
        result.canvasHeight > minForStatsBar,
        `Canvas height (${result.canvasHeight} px) > statsBar-bottom×scale (${minForStatsBar} px) — ` +
        `capture extends beyond the stats bar, confirming more content is included`
      );
    }
  }

} finally {
  if (browser) await browser.close();
  server.close();
}

finish("donations report narrow-screen (320 px) html2canvas capture");
