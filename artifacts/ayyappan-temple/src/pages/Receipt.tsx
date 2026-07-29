import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { api } from "@/lib/api";

type ReceiptDonation = {
  id: number; donorName: string; mobile: string; place?: string;
  amount: string; transactionId: string; anonymous: boolean;
  message?: string; status: string; reviewedAt?: string; createdAt: string;
};

const fmtEn = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTa = (iso: string) =>
  new Date(iso).toLocaleDateString("ta-IN", { day: "numeric", month: "long", year: "numeric" });

function Spinner() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fef9f0" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:"4px solid #fed7aa", borderTopColor:"#ea580c", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function NotFound({ msg }: { msg: string }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:24, background:"#fef9f0", fontFamily:"Inter,sans-serif", textAlign:"center" }}>
      <div style={{ fontSize:40 }}>🙏</div>
      <h2 style={{ fontSize:18, fontWeight:800, color:"#1c1917", margin:0 }}>ரசீது கிடைக்கவில்லை</h2>
      <p style={{ fontSize:13, color:"#78716c", margin:0, maxWidth:280 }}>{msg}</p>
      <a href={import.meta.env.BASE_URL} style={{ color:"#ea580c", fontSize:13 }}>முகப்பு</a>
    </div>
  );
}
function StatusPage({ donation, isPending }: { donation: ReceiptDonation; isPending: boolean }) {
  return (
    <div style={{ minHeight:"100vh", background:"#fef9f0", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", width:"100%", maxWidth:380, borderRadius:16, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.10)" }}>
        <div style={{ padding:"18px 22px", background: isPending ? "#f59e0b" : "#ef4444", color:"#fff", textAlign:"center" }}>
          <div style={{ fontSize:26 }}>{isPending ? "⏳" : "❌"}</div>
          <div style={{ fontWeight:800, fontSize:14, marginTop:4 }}>அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        </div>
        <div style={{ padding:"18px 22px", textAlign:"center" }}>
          <p style={{ fontSize:22, fontWeight:900, color:"#1c1917", marginBottom:12 }}>
            ₹{Number(donation.amount).toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize:12, color:"#78350f", background:"#fef3c7", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", lineHeight:1.6 }}>
            {isPending
              ? "உங்கள் நன்கொடை சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு முழு ரசீது கிடைக்கும்."
              : "இந்த நன்கொடை நிராகரிக்கப்பட்டது. கோவில் நிர்வாகத்தை தொடர்பு கொள்ளவும்."}
          </p>
        </div>
        <div style={{ background:"#f5f5f4", padding:"10px 22px", textAlign:"center", borderTop:"1px solid #e7e5e4" }}>
          <a href={import.meta.env.BASE_URL} style={{ color:"#ea580c", fontSize:12 }}>முகப்பு பக்கம்</a>
        </div>
      </div>
    </div>
  );
}

export default function Receipt() {
  const { token } = useParams<{ token: string }>();
  const [donation, setDonation] = useState<ReceiptDonation | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.getDonationReceipt(token)
      .then(d => setDonation(d as ReceiptDonation))
      .catch(e => setError(e.message || "Receipt not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)  return <Spinner />;
  if (error || !donation) return <NotFound msg={error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."} />;
  if (donation.status === "pending" || donation.status === "rejected")
    return <StatusPage donation={donation} isPending={donation.status === "pending"} />;

  const name      = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const receiptNo = `RCP-${String(donation.id).padStart(6, "0")}`;
  const dateISO   = donation.reviewedAt ?? donation.createdAt;
  const amountFmt = `₹${Number(donation.amount).toLocaleString("en-IN")}`;
  const logo      = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  const rows: { lbl: string; val: string; mono?: boolean; isName?: boolean }[] = [
    { lbl: "பெயர் / NAME",               val: name,                        isName: true },
    { lbl: "ஊர் / PLACE",                val: donation.place ?? ""         },
    { lbl: "பரிவர்த்தனை / TXN ID",       val: donation.transactionId,      mono: true   },
    { lbl: "செய்தி / MESSAGE",            val: donation.message ?? ""       },
  ].filter(r => r.val);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* PAGE */
        .pg {
          min-height:100vh;
          background:radial-gradient(ellipse at 30% 20%,#fde8c8 0%,#f0e0cc 60%,#e8d5be 100%);
          display:flex; flex-direction:column; align-items:center;
          padding:28px 16px 36px;
          font-family:'Inter',sans-serif;
        }

        /* BUTTONS */
        .acts { display:flex; gap:10px; margin-bottom:22px; }
        .btn-p {
          display:flex; align-items:center; gap:8px; padding:11px 28px;
          background:linear-gradient(135deg,#7c2d12,#c2410c,#ea580c);
          color:#fff; border:none; border-radius:10px;
          font:700 13px/1 'Inter',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(194,65,12,.28); transition:opacity .15s;
        }
        .btn-p:hover { opacity:.88; }
        .btn-h {
          display:flex; align-items:center; gap:6px; padding:11px 22px;
          background:#fff; color:#92400e; border:1.5px solid #fcd9a0; border-radius:10px;
          font:600 13px/1 'Inter',sans-serif; text-decoration:none; transition:background .15s;
        }
        .btn-h:hover { background:#fff7ed; }

        /* DOCUMENT — outer maroon border + amber inner border via background */
        .doc {
          width:100%; max-width:560px;
          background:#d97706;
          border:2.5px solid #7c2d12;
          box-shadow:0 8px 40px rgba(100,30,0,.14);
        }
        /* inner white gap creates real double-border that prints correctly */
        .doc-inner {
          margin:3px;
          background:#fff;
          overflow:hidden;
        }

        /* HEADER */
        .hdr {
          background:linear-gradient(170deg,#4a1000 0%,#7c2500 38%,#a83500 72%,#c24800 100%);
          padding:20px 24px 16px;
          text-align:center;
        }
        .hdr-logo {
          width:76px; height:76px; border-radius:50%; object-fit:cover;
          border:3px solid rgba(253,230,138,.55);
          box-shadow:0 4px 18px rgba(0,0,0,.40);
          display:block; margin:0 auto 10px;
        }
        .hdr-en {
          font-family:'Cinzel',serif; font-weight:900; font-size:17.5px;
          color:#fff; letter-spacing:.6px; line-height:1.25;
        }
        .hdr-ta {
          font-family:'Noto Serif Tamil',serif; font-weight:700; font-size:13px;
          color:#fde68a; margin-top:4px;
        }
        .hdr-addr { font-size:10px; color:#fcd9a0; margin-top:4px; }
        .hdr-pill {
          display:inline-block; margin-top:11px;
          background:rgba(255,255,255,.12); border:1px solid rgba(253,230,138,.40);
          border-radius:30px; padding:5px 20px;
          font-family:'Noto Serif Tamil',serif; font-size:11.5px; font-weight:700;
          color:#fef3c7; letter-spacing:.8px;
        }

        /* RECEIPT TITLE STRIP */
        .strip {
          background:#fff7ed;
          border-top:1.5px solid #fde8c8; border-bottom:1.5px solid #fde8c8;
          padding:7px 24px; text-align:center;
          display:flex; align-items:center; justify-content:center; gap:12px;
        }
        .strip-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#e8c99a); }
        .strip-line.r { background:linear-gradient(90deg,#e8c99a,transparent); }
        .strip-en {
          font-family:'Cinzel',serif; font-weight:700; font-size:12px;
          color:#7c2d12; letter-spacing:3px; white-space:nowrap; text-transform:uppercase;
        }

        /* BLESSING */
        .bless {
          background:linear-gradient(90deg,#fef3c7 0%,#fef9e6 50%,#fef3c7 100%);
          border-bottom:1.5px solid #fcd9a0;
          padding:10px 24px; text-align:center;
        }
        .bless-sub {
          font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:600;
          color:#92400e; margin-bottom:3px;
        }
        .bless-main {
          font-family:'Noto Serif Tamil',serif; font-size:15px; font-weight:800;
          color:#c2410c; line-height:1.45;
        }

        /* META */
        .meta { display:grid; grid-template-columns:1fr 1px 1fr; background:#fdfaf6; border-bottom:1px solid #f0ece4; }
        .mc { padding:8px 18px; }
        .mc.r { text-align:right; }
        .mc-sep { background:#e8ddd0; }
        .mc-lbl { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px; color:#d97706; margin-bottom:4px; }
        .mc-no  { font:900 15px/1 'Cinzel',serif; color:#6b1700; letter-spacing:.5px; }
        .mc-date { font:700 13px/1 'Inter',sans-serif; color:#6b1700; }
        .mc-date-ta { font-family:'Noto Serif Tamil',serif; font-size:9.5px; font-weight:600; color:#b45309; margin-top:3px; }

        /* DONOR TABLE */
        .tbl { width:100%; border-collapse:collapse; }
        .tbl-head td {
          padding:6px 16px;
          background:#fff7ed;
          border-top:1px solid #fde8c8; border-bottom:1px dashed #f0dcc0;
          font:700 8.5px/1 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:1.2px; color:#b45309;
        }
        .tbl tr.row { border-bottom:1px dashed #e8d9c0; }
        .tbl tr.row:last-child { border-bottom:1px solid #e8c99a; }
        .tbl tr.row:nth-child(even) td { background:#fdfaf7; }
        .tbl .lbl {
          padding:6px 16px;
          font:600 9px/1.3 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:.5px; color:#a8a29e; width:40%; white-space:nowrap;
        }
        .tbl .val {
          padding:6px 16px 6px 0;
          font:600 11px/1.4 'Inter',sans-serif; color:#1c1917;
          text-align:right; word-break:break-word;
        }
        .tbl .val.mono { font-family:'Courier New',monospace; font-size:10px; color:#44403c; }

        /* NAME ROW — highlighted */
        .tbl tr.name-row td              { background:#fff7ed !important; border-bottom:1.5px solid #fcd9a0 !important; }
        .tbl tr.name-row .lbl           { border-left:4px solid #ea580c; padding-left:12px; color:#c2410c !important; font-weight:800; font-size:9.5px; vertical-align:middle; }
        .tbl tr.name-row .val.name-val  {
          font-family:'Noto Serif Tamil',serif;
          font-size:17px; font-weight:900;
          color:#7c2d12;
          padding:9px 16px 9px 0;
          letter-spacing:.2px;
          white-space:nowrap;
        }

        /* AMOUNT */
        .amt { display:grid; grid-template-columns:1fr auto; border-top:2px solid #7c2d12; border-bottom:2px solid #7c2d12; min-height:180px; }
        .amt-left {
          background:linear-gradient(140deg,#4a1000 0%,#7c2500 45%,#c24800 100%);
          padding:16px 20px;
          display:flex; flex-direction:column; justify-content:center;
        }
        .amt-lbl { font:700 8.5px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1.2px; color:#fde68a; }
        .amt-ta  { font-family:'Noto Serif Tamil',serif; font-size:9.5px; font-weight:600; color:#fcd9a0; margin-top:2px; margin-bottom:8px; }
        .amt-val { font-family:'Oswald',sans-serif; font-size:46px; font-weight:700; color:#fff; line-height:1; letter-spacing:1px; }
        .amt-right {
          background:#f0fdf4; border-left:2px solid #7c2d12;
          display:flex; align-items:center; justify-content:center;
          padding:16px 22px;
        }
        .seal-svg { display:block; transform:rotate(-6deg); filter:drop-shadow(0 2px 8px rgba(22,163,74,.22)); overflow:visible; }

        /* FOOTER */
        .ftr {
          background:linear-gradient(135deg,#b45309 0%,#d97706 60%,#f59e0b 100%);
          padding:12px 24px; text-align:center;
        }
        .ftr-issued { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1.2px; color:rgba(255,255,255,.70); margin-bottom:5px; }
        .ftr-org-ta { font-family:'Noto Serif Tamil',serif; font-size:16px; font-weight:800; color:#fff; }
        .ftr-org-en { font-size:10px; font-weight:600; color:rgba(255,255,255,.80); margin-top:3px; letter-spacing:.4px; }
        .ftr-rcpt   { font-size:8px; color:rgba(255,255,255,.45); margin-top:7px; letter-spacing:.3px; }

        /* ══ PRINT — full A4 fill ══ */
        @media print {
          @page { size:A4 portrait; margin:0; }

          /* force colours */
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }

          body,html { margin:0; padding:0; }

          /* wrapper fills exactly A4 */
          .pg {
            width:210mm; min-height:297mm; padding:0;
            background:#d97706; /* amber shows as outer border strip */
            align-items:stretch;
            display:flex; flex-direction:column;
          }
          .acts { display:none !important; }

          /* doc = full A4 sheet, amber background = real inner border */
          .doc {
            width:210mm; height:297mm;
            max-width:100%; box-shadow:none;
            background:#d97706;
            border:3px solid #7c2d12;
            display:flex; flex-direction:column;
          }

          /* doc-inner is a flex column that fills the page */
          .doc-inner {
            margin:3px; flex:1;
            display:flex; flex-direction:column;
            overflow:hidden;
          }

          /* all sections shrink, only .amt grows to fill */
          .hdr,.strip,.bless,.meta,.ftr { flex-shrink:0; }
          .tbl { flex-shrink:0; }
          .amt { flex:1; }          /* ← grows to fill remaining height */

          /* HEADER */
          .hdr      { padding:22px 32px 18px; }
          .hdr-logo { width:88px; height:88px; margin-bottom:11px; }
          .hdr-en   { font-size:20pt; }
          .hdr-ta   { font-size:14pt; margin-top:5px; }
          .hdr-addr { font-size:11pt; margin-top:4px; }
          .hdr-pill { margin-top:12px; padding:6px 24px; font-size:12pt; }

          /* STRIP */
          .strip    { padding:8px 28px; }
          .strip-en { font-size:12.5pt; letter-spacing:4px; }

          /* BLESSING */
          .bless     { padding:13px 32px; }
          .bless-sub { font-size:12pt; margin-bottom:4px; }
          .bless-main{ font-size:16pt; }

          /* META */
          .mc         { padding:11px 24px; }
          .mc-lbl     { font-size:9pt; margin-bottom:5px; }
          .mc-no      { font-size:17pt; }
          .mc-date    { font-size:14pt; }
          .mc-date-ta { font-size:10pt; margin-top:4px; }

          /* DONOR TABLE */
          .tbl-head td { padding:8px 22px; font-size:10.5pt; }
          .tbl .lbl    { padding:10px 22px; font-size:10.5pt; }
          .tbl .val    { padding:10px 22px 10px 0; font-size:12.5pt; }
          .tbl .val.mono { font-size:11pt; }
          .tbl tr.name-row .lbl          { padding:11px 22px 11px 17px; font-size:10.5pt; }
          .tbl tr.name-row .val.name-val { font-size:19pt !important; padding:11px 22px 11px 0 !important; white-space:normal !important; word-break:break-word; }

          /* AMOUNT — flex:1 means it fills all leftover vertical space */
          .amt        { display:grid; grid-template-columns:1fr auto; }
          .amt-left   {
            padding:0 30px;
            display:flex; flex-direction:column; justify-content:center;
            min-width:0; overflow:hidden;
          }
          .amt-lbl    { font-size:10pt; }
          .amt-ta     { font-size:11pt; margin-bottom:10px; }
          /* 46pt keeps ₹1,00,00,000 (11 chars) well within the left column;
             overflow-wrap + word-break are last-resort safeguards for any
             future amount that might still be too wide. */
          .amt-val    { font-size:46pt; overflow-wrap:break-word; word-break:break-all; }
          .amt-right  {
            padding:0 26px;
            display:flex; align-items:center; justify-content:center;
          }
          .stamp       { padding:16px 22px; border-width:3px; border-radius:10px; }
          .stamp-check { font-size:38px; }
          .stamp-en    { font-size:14pt; margin-top:6px; }
          .stamp-ta    { font-size:11.5pt; margin-top:4px; }

          /* FOOTER */
          .ftr        { padding:18px 32px; }
          .ftr-issued { font-size:9pt; margin-bottom:7px; }
          .ftr-org-ta { font-size:18pt; }
          .ftr-org-en { font-size:11pt; margin-top:4px; }
          .ftr-rcpt   { font-size:9pt; margin-top:8px; }

          .doc,.doc-inner { page-break-inside:avoid; break-inside:avoid; }
        }
      `}</style>

      <div className="pg">

        <div className="acts">
          <button className="btn-p" onClick={() => window.print()}>🖨️ &nbsp;Print / Save PDF</button>
          <a href={import.meta.env.BASE_URL} className="btn-h">🏠 முகப்பு</a>
        </div>

        {/* ══ DOCUMENT ══ */}
        <div className="doc">
          {/* inner amber border — real CSS, prints correctly */}
          <div className="doc-inner">

            {/* HEADER */}
            <div className="hdr">
              <img src={logo} alt="" className="hdr-logo"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
              <div className="hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
              <div className="hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
              <div><span className="hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
            </div>

            {/* TITLE STRIP */}
            <div className="strip">
              <div className="strip-line" />
              <span className="strip-en">Donation Receipt &nbsp;·&nbsp; நன்கொடை ரசீது</span>
              <div className="strip-line r" />
            </div>

            {/* BLESSING */}
            <div className="bless">
              <div className="bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
              <div className="bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
            </div>

            {/* RECEIPT NO + DATE */}
            <div className="meta">
              <div className="mc">
                <div className="mc-lbl">Receipt No.</div>
                <div className="mc-no">{receiptNo}</div>
              </div>
              <div className="mc-sep" />
              <div className="mc r">
                <div className="mc-lbl">Date</div>
                <div className="mc-date">{fmtEn(dateISO)}</div>
                <div className="mc-date-ta">{fmtTa(dateISO)}</div>
              </div>
            </div>

            {/* DONOR TABLE */}
            <table className="tbl" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr className="tbl-head">
                  <td colSpan={2}>நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Donor Details</td>
                </tr>
                {rows.map((r, i) => (
                  <tr className={`row${r.isName ? " name-row" : ""}`} key={i}>
                    <td className="lbl">{r.lbl}</td>
                    <td className={r.isName ? "val name-val" : r.mono ? "val mono" : "val"}>
                      {r.val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* AMOUNT + SEAL */}
            <div className="amt">
              <div className="amt-left">
                <div className="amt-lbl">Donation Amount</div>
                <div className="amt-ta">நன்கொடை தொகை</div>
                <div className="amt-val">{amountFmt}</div>
              </div>
              <div className="amt-right">
                {/*
                  Round temple seal — 150×150, cx=cy=75
                  ┌─ r=72  outer ring (3px)
                  ├─ r=63  inner solid ring (1.5px)
                  └─ r=58  dashed accent (0.7px)

                  Arc radius = 67.5 → top semicircle ≈ π×67.5 ≈ 212px
                  "ஸ்வாமியே சரணம் ஐயப்பா" ≈ 18 Tamil chars × ~11px ≈ 198px → fits ✓

                  Main text sits at y=78 (centre=75, so baseline just below centre).
                  Sub text at y=99.  Bottom dots at y=123.
                */}
                <svg className="seal-svg" width="150" height="150" viewBox="0 0 150 150"
                     xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <path id="sarc"
                      d="M 7.5,75 A 67.5,67.5 0 0,1 142.5,75"/>
                  </defs>

                  {/* mint background */}
                  <circle cx="75" cy="75" r="72" fill="#f0fdf4"/>
                  {/* outer bold ring */}
                  <circle cx="75" cy="75" r="72" fill="none" stroke="#15803d" strokeWidth="3"/>
                  {/* inner solid ring */}
                  <circle cx="75" cy="75" r="63" fill="none" stroke="#15803d" strokeWidth="1.5"/>
                  {/* dashed accent ring */}
                  <circle cx="75" cy="75" r="58" fill="none" stroke="#16a34a"
                          strokeWidth="0.8" strokeDasharray="3.5 3"/>

                  {/* CURVED TOP TEXT
                      Top semicircle ≈ π × 67.5 = 212px.
                      textLength="196" forces the text to fit within that arc
                      so it never overflows into the sides.
                  */}
                  <text fontFamily="'Noto Serif Tamil',serif" fontSize="11"
                        fill="#15803d" fontWeight="700">
                    <textPath href="#sarc" startOffset="50%" textAnchor="middle"
                              textLength="196" lengthAdjust="spacingAndGlyphs">
                      ஸ்வாமியே சரணம் ஐயப்பா
                    </textPath>
                  </text>

                  {/* MAIN: வடமதுரை  — baseline at y=80, centre of inner circle */}
                  <text x="75" y="80" textAnchor="middle"
                        fontFamily="'Noto Serif Tamil',serif"
                        fontSize="20" fontWeight="900" fill="#15803d">
                    வடமதுரை
                  </text>

                  {/* SUB: திருப்பணி குழு */}
                  <text x="75" y="100" textAnchor="middle"
                        fontFamily="'Noto Serif Tamil',serif"
                        fontSize="11" fontWeight="700" fill="#166534">
                    திருப்பணி குழு
                  </text>

                  {/* bottom decorative dots */}
                  <text x="75" y="124" textAnchor="middle"
                        fontFamily="sans-serif" fontSize="8"
                        fill="#16a34a" letterSpacing="5">
                    ◆◆◆
                  </text>
                </svg>
              </div>
            </div>

            {/* FOOTER */}
            <div className="ftr">
              <div className="ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
              <div className="ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
              <div className="ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
              <div className="ftr-rcpt">Official receipt &nbsp;·&nbsp; {receiptNo} &nbsp;·&nbsp; {fmtEn(dateISO)}</div>
            </div>

          </div>{/* doc-inner */}
        </div>{/* doc */}

        <div className="acts" style={{ marginTop:20, marginBottom:0 }}>
          <button className="btn-p" onClick={() => window.print()}>🖨️ &nbsp;Print / Save PDF</button>
          <a href={import.meta.env.BASE_URL} className="btn-h">🏠 முகப்பு</a>
        </div>

      </div>
    </>
  );
}
