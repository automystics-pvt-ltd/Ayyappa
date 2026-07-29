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
        <div style={{ padding:"18px 22px", background: isPending?"#f59e0b":"#ef4444", color:"#fff", textAlign:"center" }}>
          <div style={{ fontSize:26 }}>{isPending?"⏳":"❌"}</div>
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

/* ── tiny ornament ── */
const Ornament = () => (
  <span style={{ fontSize:9, color:"#b45309", letterSpacing:3, display:"block", textAlign:"center", lineHeight:1 }}>
    ◆ &nbsp; ◆ &nbsp; ◆
  </span>
);

/* ══════════════════════════════════════════════
   RECEIPT PAGE
══════════════════════════════════════════════ */
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
  const amountNum = Number(donation.amount).toLocaleString("en-IN");
  const logo      = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  /* detail rows — only non-empty ones */
  const rows: { label: string; labelTa: string; value: string; mono?: boolean }[] = [
    { label: "Mobile / தொலைபேசி", labelTa: "", value: donation.mobile, mono: true },
    { label: "Place / ஊர்",        labelTa: "", value: donation.place ?? "" },
    { label: "Transaction ID",     labelTa: "பரிவர்த்தனை எண்", value: donation.transactionId, mono: true },
    { label: "Message / செய்தி",   labelTa: "", value: donation.message ?? "" },
  ].filter(r => r.value);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ── Screen wrapper ── */
        .page {
          min-height:100vh;
          background:radial-gradient(ellipse at top,#fde8c8 0%,#f5ede0 50%,#ede0cf 100%);
          display:flex; flex-direction:column; align-items:center;
          padding:32px 16px 40px;
          font-family:'Inter',sans-serif;
        }

        /* ── Action bar ── */
        .actions { display:flex; gap:10px; margin-bottom:24px; }
        .btn-print {
          display:flex; align-items:center; gap:7px;
          padding:11px 28px;
          background:linear-gradient(135deg,#9a1c00,#c2410c,#ea580c);
          color:#fff; border:none; border-radius:10px;
          font:700 13px/1 'Inter',sans-serif; cursor:pointer;
          box-shadow:0 4px 16px rgba(194,65,12,.30);
          letter-spacing:.3px;
          transition:opacity .15s;
        }
        .btn-print:hover { opacity:.88; }
        .btn-home {
          display:flex; align-items:center; gap:6px;
          padding:11px 22px;
          background:#fff; color:#92400e;
          border:1.5px solid #fcd9a0; border-radius:10px;
          font:600 13px/1 'Inter',sans-serif;
          text-decoration:none;
          transition:background .15s;
        }
        .btn-home:hover { background:#fff7ed; }

        /* ════════════════════════════
           RECEIPT DOCUMENT
        ════════════════════════════ */
        .receipt {
          width:100%; max-width:580px;
          /* Outer border — maroon */
          border:2.5px solid #7c2d12;
          background:#fff;
        }

        /* Inner padding layer with inner border */
        .receipt-inner {
          border:1px solid #d97706;
          margin:4px;
          background:#fff;
          overflow:hidden;
        }

        /* ── HEADER ── */
        .hd {
          background:linear-gradient(170deg,#5c1500 0%,#8b2500 40%,#a83800 75%,#c24f00 100%);
          padding:18px 24px 14px;
          display:flex; align-items:center; gap:18px;
        }
        .hd-logo {
          width:70px; height:70px; border-radius:50%; object-fit:cover; flex-shrink:0;
          border:2px solid rgba(253,230,138,.50);
        }
        .hd-text { flex:1; }
        .hd-en {
          font-family:'Cinzel',serif; font-size:17px; font-weight:900;
          color:#fff; letter-spacing:.5px; line-height:1.25;
        }
        .hd-ta {
          font-family:'Noto Serif Tamil',serif; font-size:13px; font-weight:700;
          color:#fde68a; margin-top:4px;
        }
        .hd-addr {
          font-size:10.5px; color:#fcd9a0; margin-top:4px; letter-spacing:.2px;
        }
        .hd-saranam {
          display:inline-block; margin-top:10px;
          background:rgba(255,255,255,.12); border:1px solid rgba(253,230,138,.35);
          border-radius:30px; padding:5px 18px;
          font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:700;
          color:#fef3c7; letter-spacing:.8px;
        }

        /* ── TITLE BAND ── */
        .title-band {
          background:#fff7ed; border-top:1.5px solid #fde8c8; border-bottom:1.5px solid #fde8c8;
          padding:8px 24px; text-align:center;
        }
        .title-en {
          font-family:'Cinzel',serif; font-size:13.5px; font-weight:700;
          color:#7c2d12; letter-spacing:3px; text-transform:uppercase;
        }
        .title-ta {
          font-family:'Noto Serif Tamil',serif; font-size:11.5px; font-weight:700;
          color:#b45309; margin-top:2px; letter-spacing:.5px;
        }

        /* ── BLESSING ── */
        .bless {
          background:linear-gradient(90deg,#fffbeb 0%,#fef9e7 50%,#fffbeb 100%);
          border-bottom:1px solid #fde8c8;
          padding:9px 24px; text-align:center;
        }
        .bless-sub {
          font-family:'Noto Serif Tamil',serif; font-size:10.5px; font-weight:600;
          color:#92400e;
        }
        .bless-main {
          font-family:'Noto Serif Tamil',serif; font-size:14px; font-weight:800;
          color:#7c2d12; margin-top:3px; line-height:1.5;
        }

        /* ── META ROW ── */
        .meta {
          display:grid; grid-template-columns:1fr 1px 1fr;
          border-bottom:1px solid #f0ece4;
          background:#fdf9f5;
        }
        .meta-cell { padding:10px 20px; }
        .meta-cell.right { text-align:right; }
        .meta-sep { background:#e8ddd0; }
        .meta-lbl { font:700 8.5px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px; color:#d97706; margin-bottom:4px; }
        .meta-val { font:800 15px/1 'Inter',sans-serif; color:#6b1700; letter-spacing:.5px; }
        .meta-date { font:700 13px/1 'Inter',sans-serif; color:#6b1700; }
        .meta-date-ta { font-family:'Noto Serif Tamil',serif; font-size:10px; font-weight:600; color:#b45309; margin-top:3px; }

        /* ── DONOR TABLE ── */
        .donor-section { padding:0 20px 14px; }
        .donor-head {
          display:flex; align-items:center; gap:8px;
          padding:10px 0 8px; border-bottom:1.5px solid #7c2d12;
          margin-bottom:0;
        }
        .donor-head-label {
          font:700 9px/1 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:1.5px; color:#7c2d12;
        }
        .donor-head-line { flex:1; height:1px; background:#e8c99a; }

        /* Name row */
        .name-row {
          display:flex; align-items:center; gap:14px;
          padding:10px 0; border-bottom:1px solid #f0ece4;
        }
        .name-avatar {
          width:40px; height:40px; border-radius:8px; flex-shrink:0;
          background:linear-gradient(135deg,#7c2d12,#c2410c);
          display:flex; align-items:center; justify-content:center;
          font:900 18px/1 'Cinzel',serif; color:#fef3c7;
          border:1.5px solid #fcd9a0;
        }
        .name-label { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.8px; color:#a8a29e; margin-bottom:4px; }
        .name-val {
          font-family:'Noto Serif Tamil',serif; font-size:18px; font-weight:800;
          color:#1c1917; line-height:1.2;
        }

        /* Detail rows */
        .detail-row {
          display:grid; grid-template-columns:140px 1fr;
          border-bottom:1px solid #f5ede0;
        }
        .detail-row:last-child { border-bottom:none; }
        .detail-row:nth-child(even) { background:#fdfaf7; }
        .detail-lbl {
          padding:7px 0 7px 0;
          font:600 9.5px/1.3 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:.6px; color:#a8a29e;
        }
        .detail-val {
          padding:7px 0;
          font:600 11px/1.4 'Inter',sans-serif; color:#292524;
          text-align:right; word-break:break-word;
        }
        .detail-val.mono { font-family:'Courier New',monospace; font-size:10.5px; font-weight:700; color:#44403c; }

        /* ── AMOUNT BLOCK ── */
        .amount-block {
          margin:0 20px 16px;
          border:2px solid #7c2d12;
          border-radius:6px;
          overflow:hidden;
          display:grid; grid-template-columns:1fr auto;
        }
        .amount-left {
          padding:14px 20px;
          background:linear-gradient(135deg,#5c1500 0%,#8b2500 50%,#c24f00 100%);
        }
        .amount-lbl { font:700 9px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1.2px; color:#fde68a; }
        .amount-lbl-ta { font-family:'Noto Serif Tamil',serif; font-size:10px; font-weight:600; color:#fcd9a0; margin-top:2px; margin-bottom:8px; }
        .amount-val { font-family:'Oswald',sans-serif; font-size:44px; font-weight:700; color:#fff; line-height:1; letter-spacing:1px; }
        .amount-right {
          padding:14px 18px;
          background:#f0fdf4;
          border-left:2px solid #7c2d12;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
        }
        .stamp-check { font-size:30px; line-height:1; color:#15803d; }
        .stamp-en {
          font:900 12px/1 'Cinzel',serif; letter-spacing:2px;
          color:#15803d; text-transform:uppercase; text-align:center;
        }
        .stamp-ta {
          font-family:'Noto Serif Tamil',serif; font-size:9.5px; font-weight:700;
          color:#166534; text-align:center;
        }
        .stamp-border {
          border:2px solid #16a34a; border-radius:6px;
          padding:10px 14px; text-align:center;
        }

        /* ── FOOTER ── */
        .footer {
          background:linear-gradient(135deg,#5c1500,#6b1700);
          padding:12px 24px; text-align:center;
        }
        .footer-ornament { font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:800; color:#fde68a; letter-spacing:1px; margin-bottom:6px; }
        .footer-org-ta { font-family:'Noto Serif Tamil',serif; font-size:16px; font-weight:800; color:#fff; }
        .footer-org-en { font-size:10px; font-weight:600; color:#fcd9a0; letter-spacing:.5px; margin-top:3px; }
        .footer-note { font-size:8px; color:rgba(253,230,138,.35); margin-top:7px; letter-spacing:.3px; }

        /* ════════════════════════════
           PRINT — CRITICAL
        ════════════════════════════ */
        @media print {
          @page { size:A4 portrait; margin:12mm 14mm; }

          /* Hide screen chrome */
          .page    { min-height:unset; padding:0; background:#fff !important; }
          .actions { display:none !important; }

          /* Document fills page width */
          .receipt { max-width:100%; border-width:2px; }
          .receipt-inner { margin:3px; }

          /* Force all colours */
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }

          /* Prevent any section breaking across pages */
          .receipt, .receipt-inner, .hd, .title-band, .bless,
          .meta, .donor-section, .amount-block, .footer {
            page-break-inside:avoid;
            break-inside:avoid;
          }
        }
      `}</style>

      <div className="page">

        {/* ── Action bar (screen only) ── */}
        <div className="actions">
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ &nbsp;Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="btn-home">🏠 முகப்பு</a>
        </div>

        {/* ════ RECEIPT DOCUMENT ════ */}
        <div className="receipt">
          <div className="receipt-inner">

            {/* ── HEADER ── */}
            <div className="hd">
              <img src={logo} alt="Ayyappan" className="hd-logo"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
              <div className="hd-text">
                <div className="hd-en">Sri Arulmigu Iyyappan Thirukovil</div>
                <div className="hd-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
                <div className="hd-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
                <div><span className="hd-saranam">✦ ஸ்வாமியே சரணம் ஐயப்பா ✦</span></div>
              </div>
            </div>

            {/* ── TITLE BAND ── */}
            <div className="title-band">
              <div className="title-en">Donation Receipt</div>
              <div className="title-ta">நன்கொடை ரசீது</div>
            </div>

            {/* ── BLESSING ── */}
            <div className="bless">
              <div className="bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
              <div className="bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
            </div>

            {/* ── RECEIPT NO + DATE ── */}
            <div className="meta">
              <div className="meta-cell">
                <div className="meta-lbl">Receipt No.</div>
                <div className="meta-val">{receiptNo}</div>
              </div>
              <div className="meta-sep" />
              <div className="meta-cell right">
                <div className="meta-lbl">Date</div>
                <div className="meta-date">{fmtEn(dateISO)}</div>
                <div className="meta-date-ta">{fmtTa(dateISO)}</div>
              </div>
            </div>

            {/* ── DONOR TABLE ── */}
            <div className="donor-section">
              {/* Section heading */}
              <div className="donor-head">
                <span className="donor-head-label">Donor Details &nbsp;·&nbsp; நன்கொடையாளர் விவரம்</span>
                <div className="donor-head-line" />
              </div>

              {/* Name hero */}
              <div className="name-row">
                <div className="name-avatar">
                  {(donation.anonymous ? "A" : name.charAt(0)).toUpperCase()}
                </div>
                <div>
                  <div className="name-label">Donor Name / பெயர்</div>
                  <div className="name-val">{name}</div>
                </div>
              </div>

              {/* Detail rows */}
              {rows.map((r, i) => (
                <div className="detail-row" key={i}>
                  <div className="detail-lbl">{r.label}</div>
                  <div className={`detail-val${r.mono ? " mono" : ""}`}>{r.value}</div>
                </div>
              ))}
            </div>

            {/* ── AMOUNT + STAMP ── */}
            <div className="amount-block">
              <div className="amount-left">
                <div className="amount-lbl">Donation Amount</div>
                <div className="amount-lbl-ta">நன்கொடை தொகை</div>
                <div className="amount-val">₹{amountNum}</div>
              </div>
              <div className="amount-right">
                <div className="stamp-border">
                  <div className="stamp-check">✔</div>
                  <div className="stamp-en">Approved</div>
                  <div className="stamp-ta">அங்கீகரிக்கப்பட்டது</div>
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="footer">
              <div className="footer-ornament">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</div>
              <div className="footer-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
              <div className="footer-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
              <div className="footer-note">
                Official receipt issued by the temple trust &nbsp;·&nbsp; {receiptNo}
              </div>
            </div>

          </div>{/* receipt-inner */}
        </div>{/* receipt */}

        {/* Bottom print button */}
        <div className="actions" style={{ marginTop:22, marginBottom:0 }}>
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ &nbsp;Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="btn-home">🏠 முகப்பு</a>
        </div>

      </div>
    </>
  );
}
