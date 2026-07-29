import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { api } from "@/lib/api";

type ReceiptDonation = {
  id: number;
  donorName: string;
  mobile: string;
  place?: string;
  amount: string;
  transactionId: string;
  anonymous: boolean;
  message?: string;
  status: string;
  reviewedAt?: string;
  createdAt: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtDateTa(iso: string) {
  return new Date(iso).toLocaleDateString("ta-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function Receipt() {
  const { token } = useParams<{ token: string }>();
  const [donation, setDonation] = useState<ReceiptDonation | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.getDonationReceipt(token)
      .then(d  => setDonation(d as ReceiptDonation))
      .catch(e  => setError(e.message || "Receipt not found"))
      .finally(() => setLoading(false));
  }, [token]);

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fef9f0" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:"4px solid #fed7aa", borderTopColor:"#ea580c", animation:"spin 0.8s linear infinite" }} />
        <p style={{ color:"#c2410c", fontSize:13, fontFamily:"sans-serif" }}>ஏற்றுகிறது…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── error ── */
  if (error || !donation) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:24, textAlign:"center", background:"#fef9f0", fontFamily:"sans-serif" }}>
      <div style={{ fontSize:40 }}>🙏</div>
      <h2 style={{ fontSize:18, fontWeight:800, color:"#292524", margin:0 }}>ரசீது கிடைக்கவில்லை</h2>
      <p style={{ fontSize:13, color:"#78716c", maxWidth:280, margin:0 }}>{error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."}</p>
      <a href={import.meta.env.BASE_URL} style={{ color:"#ea580c", fontSize:13 }}>முகப்பு பக்கம்</a>
    </div>
  );

  const isPending  = donation.status === "pending";
  const isRejected = donation.status === "rejected";

  /* ── pending / rejected ── */
  if (isPending || isRejected) return (
    <div style={{ minHeight:"100vh", background:"#fef9f0", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"sans-serif" }}>
      <div style={{ background:"#fff", width:"100%", maxWidth:380, borderRadius:16, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.10)" }}>
        <div style={{ padding:"20px 24px", background: isPending ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", textAlign:"center" }}>
          <div style={{ fontSize:28 }}>{isPending ? "⏳" : "❌"}</div>
          <div style={{ fontWeight:800, fontSize:15, marginTop:4 }}>அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        </div>
        <div style={{ padding:"20px 24px", textAlign:"center" }}>
          <p style={{ fontFamily:"monospace", color:"#a8a29e", fontSize:12, marginBottom:8 }}>RCP-{String(donation.id).padStart(6,"0")}</p>
          <p style={{ fontSize:24, fontWeight:900, color:"#1c1917", marginBottom:12 }}>₹{Number(donation.amount).toLocaleString("en-IN")}</p>
          {isPending
            ? <p style={{ fontSize:12, color:"#92400e", background:"#fef3c7", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", lineHeight:1.6 }}>உங்கள் நன்கொடை சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு இங்கே முழு ரசீது கிடைக்கும்.</p>
            : <p style={{ fontSize:12, color:"#991b1b", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px" }}>இந்த நன்கொடை நிராகரிக்கப்பட்டது.</p>
          }
        </div>
        <div style={{ background:"#f5f5f4", padding:"10px 24px", textAlign:"center", borderTop:"1px solid #e7e5e4" }}>
          <a href={import.meta.env.BASE_URL} style={{ color:"#ea580c", fontSize:12 }}>முகப்பு பக்கம்</a>
        </div>
      </div>
    </div>
  );

  /* ── approved ── */
  const displayName = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const receiptNo   = `RCP-${String(donation.id).padStart(6, "0")}`;
  const approvedISO = donation.reviewedAt ?? donation.createdAt;
  const amountNum   = Number(donation.amount).toLocaleString("en-IN");
  const logoSrc     = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=Oswald:wght@700&display=swap');

        *{box-sizing:border-box;margin:0;padding:0;}

        .rp-screen{
          min-height:100vh;
          background:linear-gradient(160deg,#fef9f0 0%,#fff7ed 50%,#fef3c7 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          padding:28px 16px;
          font-family:'Inter',sans-serif;
        }

        /* action buttons */
        .rp-actions{
          display:flex;gap:10px;margin-bottom:20px;
        }
        .rp-btn-print{
          display:flex;align-items:center;gap:7px;
          padding:10px 24px;border:none;border-radius:12px;cursor:pointer;
          background:linear-gradient(135deg,#ea580c,#d97706);
          color:#fff;font-size:13px;font-weight:700;
          font-family:'Inter',sans-serif;
          box-shadow:0 4px 16px rgba(234,88,12,.30);
          transition:transform .12s,box-shadow .12s;
        }
        .rp-btn-print:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(234,88,12,.35);}
        .rp-btn-home{
          display:flex;align-items:center;gap:6px;
          padding:10px 20px;border:2px solid #fed7aa;border-radius:12px;cursor:pointer;
          background:#fff;color:#c2410c;font-size:13px;font-weight:600;
          font-family:'Inter',sans-serif;text-decoration:none;
          transition:background .12s;
        }
        .rp-btn-home:hover{background:#fff7ed;}

        /* card shell */
        .rp-card{
          width:100%;max-width:460px;
          background:#fff;
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 8px 40px rgba(120,40,0,.13);
          border:1.5px solid #fcd9a0;
        }

        /* ─── HEADER ─── */
        .rp-header{
          background:linear-gradient(155deg,#6b1a05 0%,#b83008 45%,#c2570a 100%);
          padding:20px 22px 18px;
          text-align:center;
          position:relative;
          overflow:hidden;
        }
        .rp-header::before{
          content:'';position:absolute;top:-30px;right:-30px;
          width:100px;height:100px;border-radius:50%;
          background:rgba(255,255,255,.05);
        }
        .rp-header::after{
          content:'';position:absolute;bottom:-20px;left:-20px;
          width:80px;height:80px;border-radius:50%;
          background:rgba(255,215,0,.06);
        }
        .rp-logo{
          width:58px;height:58px;border-radius:50%;
          border:2.5px solid rgba(253,230,138,.55);
          object-fit:cover;margin:0 auto 10px;
          display:block;
          box-shadow:0 4px 16px rgba(0,0,0,.30);
        }
        .rp-h-name{
          font-family:'Cinzel',serif;
          font-size:16.5px;font-weight:800;color:#fff;
          letter-spacing:.4px;line-height:1.3;
        }
        .rp-h-name-ta{
          font-family:'Noto Serif Tamil',serif;
          font-size:12.5px;font-weight:700;
          color:#fde68a;margin-top:3px;
        }
        .rp-h-addr{
          font-size:10.5px;color:#fcd9a0;margin-top:3px;letter-spacing:.2px;
        }
        .rp-h-saranam{
          display:inline-block;
          margin-top:12px;
          background:rgba(255,255,255,.12);
          border:1px solid rgba(253,230,138,.40);
          border-radius:20px;
          padding:5px 18px;
          font-family:'Noto Serif Tamil',serif;
          font-size:12px;font-weight:700;
          color:#fef3c7;letter-spacing:1.2px;
        }

        /* ─── BLESSING BAND ─── */
        .rp-bless{
          padding:10px 20px;text-align:center;
          background:linear-gradient(90deg,#fff7ed,#fffbeb,#fff7ed);
          border-bottom:2px solid #fcd9a0;
          border-top:2px solid #fed7aa;
        }
        .rp-bless-sub{
          font-family:'Noto Serif Tamil',serif;
          font-size:11.5px;font-weight:600;color:#92400e;
          letter-spacing:.2px;
        }
        .rp-bless-main{
          font-family:'Noto Serif Tamil',serif;
          font-size:14px;font-weight:800;
          color:#b83008;
          margin-top:2px;line-height:1.45;
        }
        .rp-bless-en{
          font-size:10px;color:#b45309;font-style:italic;margin-top:3px;
        }

        /* ─── META BAR (receipt no + date) ─── */
        .rp-meta{
          display:flex;justify-content:space-between;align-items:center;
          padding:8px 20px;
          background:#fff8f0;
          border-bottom:1px solid #fde8c8;
        }
        .rp-meta-label{
          font-size:9px;font-weight:700;text-transform:uppercase;
          letter-spacing:.8px;color:#d97706;
        }
        .rp-meta-val{
          font-size:13.5px;font-weight:800;
          color:#7c2d12;letter-spacing:1.2px;
          font-family:'Inter',monospace;
        }
        .rp-meta-date{font-size:12px;font-weight:700;color:#78350f;text-align:right;}
        .rp-meta-date-ta{
          font-family:'Noto Serif Tamil',serif;
          font-size:9.5px;color:#b45309;text-align:right;
        }
        .rp-meta-divider{width:1px;height:30px;background:#fde8c8;}

        /* ─── DONOR CARD ─── */
        .rp-donor{
          margin:14px 18px 0;
          border:1.5px solid #fed7aa;
          border-radius:12px;
          overflow:hidden;
        }
        .rp-donor-header{
          background:linear-gradient(90deg,#fff7ed,#fffbeb);
          padding:7px 14px;
          border-bottom:1px solid #fde8c8;
          font-size:9px;font-weight:800;
          text-transform:uppercase;letter-spacing:.9px;
          color:#ea580c;
        }
        /* Name hero row */
        .rp-name-row{
          padding:12px 14px;
          background:#fff;
          border-bottom:1px solid #fef3c7;
          display:flex;align-items:center;gap:12px;
        }
        .rp-name-avatar{
          width:38px;height:38px;border-radius:10px;
          background:linear-gradient(135deg,#ea580c,#d97706);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;font-weight:800;color:#fff;
          flex-shrink:0;
          font-family:'Inter',sans-serif;
        }
        .rp-name-text{
          font-family:'Inter',sans-serif;
          font-size:17px;font-weight:800;
          color:#1c1917;
          letter-spacing:.2px;
        }
        .rp-name-label{
          font-size:9px;font-weight:600;color:#a8a29e;
          text-transform:uppercase;letter-spacing:.7px;
          margin-bottom:2px;
        }
        /* Detail rows */
        .rp-detail-row{
          display:flex;justify-content:space-between;align-items:baseline;
          gap:12px;padding:7px 14px;
          border-bottom:1px dashed #fef3c7;
          background:#fff;
        }
        .rp-detail-row:last-child{border-bottom:none;}
        .rp-d-label{
          font-size:9.5px;font-weight:600;color:#a8a29e;
          white-space:nowrap;flex-shrink:0;
          text-transform:uppercase;letter-spacing:.5px;
        }
        .rp-d-val{
          font-size:11.5px;font-weight:700;color:#292524;
          text-align:right;word-break:break-all;
        }
        .rp-d-val.mono{
          font-family:'Inter',monospace;
          font-size:10.5px;font-weight:500;color:#57534e;
        }

        /* ─── AMOUNT BLOCK ─── */
        .rp-amount{
          margin:14px 18px;
          background:linear-gradient(135deg,#6b1a05 0%,#b83008 55%,#c2570a 100%);
          border-radius:14px;
          padding:16px 18px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          position:relative;
          overflow:hidden;
        }
        .rp-amount::before{
          content:'';position:absolute;top:-20px;right:-20px;
          width:90px;height:90px;border-radius:50%;
          background:rgba(255,255,255,.06);
        }
        .rp-amount-left{}
        .rp-amount-label{
          font-size:9px;font-weight:700;
          text-transform:uppercase;letter-spacing:.9px;
          color:#fde68a;margin-bottom:2px;
        }
        .rp-amount-label-ta{
          font-family:'Noto Serif Tamil',serif;
          font-size:10px;font-weight:600;color:#fcd9a0;
          margin-bottom:6px;
        }
        .rp-amount-val{
          font-family:'Oswald',sans-serif;
          font-size:36px;font-weight:700;color:#fff;
          letter-spacing:0.5px;line-height:1;
        }

        /* Approved stamp */
        .rp-stamp{
          flex-shrink:0;
          display:flex;flex-direction:column;align-items:center;gap:3px;
          background:rgba(240,253,244,.95);
          border:2.5px solid #16a34a;
          border-radius:10px;
          padding:8px 14px;
          transform:rotate(-4deg);
          box-shadow:0 2px 10px rgba(22,163,74,.20);
        }
        .rp-stamp-check{
          font-size:22px;color:#16a34a;line-height:1;
        }
        .rp-stamp-en{
          font-size:12px;font-weight:900;
          color:#15803d;letter-spacing:1.5px;
          text-transform:uppercase;
          font-family:'Inter',sans-serif;
        }
        .rp-stamp-ta{
          font-family:'Noto Serif Tamil',serif;
          font-size:9px;font-weight:700;color:#166534;
        }

        /* ─── SARANAM DIVIDER ─── */
        .rp-divider{
          margin:10px 18px 8px;
          display:flex;align-items:center;gap:10px;
        }
        .rp-divider-line{
          flex:1;height:1px;
          background:linear-gradient(90deg,transparent,#fcd9a0,transparent);
        }
        .rp-divider-text{
          font-family:'Noto Serif Tamil',serif;
          font-size:11px;font-weight:800;
          color:#ea580c;letter-spacing:1.2px;white-space:nowrap;
        }

        /* ─── FOOTER ─── */
        .rp-footer{
          background:linear-gradient(135deg,#6b1a05,#7c2d12);
          padding:12px 20px;text-align:center;
        }
        .rp-footer-issued{
          font-size:8.5px;font-weight:700;
          text-transform:uppercase;letter-spacing:1px;
          color:#fde68a;margin-bottom:4px;
        }
        .rp-footer-org{
          font-family:'Noto Serif Tamil','Inter',sans-serif;
          font-size:14px;font-weight:800;color:#fff;
          letter-spacing:.3px;
        }
        .rp-footer-org-en{
          font-size:10px;color:#fcd9a0;margin-top:2px;letter-spacing:.3px;
        }
        .rp-footer-note{
          font-size:8px;color:rgba(253,230,138,.45);margin-top:8px;
        }

        /* ─── PRINT ─── */
        @media print{
          @page{
            margin:5mm 8mm;
            size:A4 portrait;
          }
          body{ background:#fff !important; }
          .rp-screen{
            min-height:unset;padding:0;background:#fff;
            justify-content:flex-start;
          }
          .rp-actions{ display:none !important; }
          .rp-card{
            max-width:100%;box-shadow:none;
            border-radius:0;border:none;
            page-break-inside:avoid;
          }
          /* Compress all sections for single-page fit */
          .rp-header{ padding:10px 18px 10px; }
          .rp-logo{ width:46px;height:46px;margin-bottom:6px; }
          .rp-h-name{ font-size:13px; }
          .rp-h-name-ta{ font-size:10.5px; }
          .rp-h-addr{ font-size:9px; }
          .rp-h-saranam{ margin-top:8px;padding:3px 14px;font-size:10.5px; }

          .rp-bless{ padding:6px 18px; }
          .rp-bless-sub{ font-size:10px; }
          .rp-bless-main{ font-size:12px; }
          .rp-bless-en{ font-size:8.5px; }

          .rp-meta{ padding:5px 18px; }
          .rp-meta-val{ font-size:12px; }
          .rp-meta-date{ font-size:11px; }
          .rp-meta-date-ta{ font-size:8.5px; }

          .rp-donor{ margin:8px 16px 0; }
          .rp-donor-header{ padding:5px 12px;font-size:8px; }
          .rp-name-row{ padding:8px 12px; }
          .rp-name-avatar{ width:30px;height:30px;font-size:13px;border-radius:8px; }
          .rp-name-label{ font-size:8px; }
          .rp-name-text{ font-size:14px; }
          .rp-detail-row{ padding:5px 12px; }
          .rp-d-label{ font-size:8.5px; }
          .rp-d-val{ font-size:10.5px; }
          .rp-d-val.mono{ font-size:9.5px; }

          .rp-amount{ margin:8px 16px;padding:11px 16px;border-radius:10px; }
          .rp-amount-label{ font-size:8px; }
          .rp-amount-label-ta{ font-size:9px;margin-bottom:3px; }
          .rp-amount-val{ font-size:28px; }
          .rp-stamp{ padding:5px 10px; }
          .rp-stamp-check{ font-size:17px; }
          .rp-stamp-en{ font-size:10px; }
          .rp-stamp-ta{ font-size:8px; }

          .rp-divider{ margin:6px 16px 5px; }
          .rp-divider-text{ font-size:10px; }

          .rp-footer{ padding:8px 18px; }
          .rp-footer-issued{ font-size:7.5px; }
          .rp-footer-org{ font-size:12px; }
          .rp-footer-org-en{ font-size:9px; }
          .rp-footer-note{ font-size:7.5px;margin-top:5px; }

          *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
      `}</style>

      <div className="rp-screen">

        {/* Print / Home buttons — hidden on print */}
        <div className="rp-actions">
          <button className="rp-btn-print" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="rp-btn-home">
            🏠 முகப்பு
          </a>
        </div>

        <div className="rp-card">

          {/* ─── HEADER ─── */}
          <div className="rp-header">
            <img
              src={logoSrc}
              alt="Ayyappan"
              className="rp-logo"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <div className="rp-h-name">Sri Arulmigu Iyyappan Thirukovil</div>
            <div className="rp-h-name-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
            <div className="rp-h-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
            <div>
              <span className="rp-h-saranam">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span>
            </div>
          </div>

          {/* ─── BLESSING BAND ─── */}
          <div className="rp-bless">
            <div className="rp-bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
            <div className="rp-bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும்</div>
            <div className="rp-bless-en">
              May Lord Ayyappan's blessings be upon you and your family 🙏
            </div>
          </div>

          {/* ─── RECEIPT NO + DATE ─── */}
          <div className="rp-meta">
            <div>
              <div className="rp-meta-label">Receipt No.</div>
              <div className="rp-meta-val">{receiptNo}</div>
            </div>
            <div className="rp-meta-divider" />
            <div>
              <div className="rp-meta-label" style={{ textAlign:"right" }}>Date</div>
              <div className="rp-meta-date">{fmtDate(approvedISO)}</div>
              <div className="rp-meta-date-ta">{fmtDateTa(approvedISO)}</div>
            </div>
          </div>

          {/* ─── DONOR CARD ─── */}
          <div className="rp-donor">
            <div className="rp-donor-header">
              நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Donor Details
            </div>

            {/* Name hero */}
            <div className="rp-name-row">
              <div className="rp-name-avatar">
                {(donation.anonymous ? "A" : donation.donorName.charAt(0).toUpperCase())}
              </div>
              <div>
                <div className="rp-name-label">Donor Name / பெயர்</div>
                <div className="rp-name-text">{displayName}</div>
              </div>
            </div>

            {donation.mobile && (
              <div className="rp-detail-row">
                <span className="rp-d-label">Mobile</span>
                <span className="rp-d-val mono">{donation.mobile}</span>
              </div>
            )}
            {donation.place && (
              <div className="rp-detail-row">
                <span className="rp-d-label">Place / ஊர்</span>
                <span className="rp-d-val">{donation.place}</span>
              </div>
            )}
            <div className="rp-detail-row">
              <span className="rp-d-label">Transaction ID</span>
              <span className="rp-d-val mono">{donation.transactionId}</span>
            </div>
            {donation.message && (
              <div className="rp-detail-row">
                <span className="rp-d-label">Message</span>
                <span className="rp-d-val" style={{ fontStyle:"italic", color:"#57534e" }}>{donation.message}</span>
              </div>
            )}
          </div>

          {/* ─── AMOUNT + APPROVED STAMP ─── */}
          <div className="rp-amount">
            <div className="rp-amount-left">
              <div className="rp-amount-label">Donation Amount</div>
              <div className="rp-amount-label-ta">நன்கொடை தொகை</div>
              <div className="rp-amount-val">₹{amountNum}</div>
            </div>
            <div className="rp-stamp">
              <div className="rp-stamp-check">✔</div>
              <div className="rp-stamp-en">APPROVED</div>
              <div className="rp-stamp-ta">அங்கீகரிக்கப்பட்டது</div>
            </div>
          </div>

          {/* ─── SARANAM DIVIDER ─── */}
          <div className="rp-divider">
            <div className="rp-divider-line" />
            <span className="rp-divider-text">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span>
            <div className="rp-divider-line" />
          </div>

          {/* ─── FOOTER ─── */}
          <div className="rp-footer">
            <div className="rp-footer-issued">Issued By · வழங்கியவர்கள்</div>
            <div className="rp-footer-org">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
            <div className="rp-footer-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
            <div className="rp-footer-note">
              Official receipt issued by the temple trust &nbsp;·&nbsp; {receiptNo}
            </div>
          </div>

        </div>

        {/* Bottom buttons */}
        <div className="rp-actions" style={{ marginTop:20, marginBottom:0 }}>
          <button className="rp-btn-print" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="rp-btn-home">
            🏠 முகப்பு
          </a>
        </div>

      </div>
    </>
  );
}
