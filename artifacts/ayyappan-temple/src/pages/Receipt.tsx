import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { api } from "@/lib/api";

type ReceiptDonation = {
  id: number; donorName: string; mobile: string; place?: string;
  amount: string; transactionId: string; anonymous: boolean;
  message?: string; status: string; reviewedAt?: string; createdAt: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTa = (iso: string) =>
  new Date(iso).toLocaleDateString("ta-IN", { day: "numeric", month: "long", year: "numeric" });

/* ─── small reusable components ─── */
function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef9f0" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid #fed7aa", borderTopColor: "#ea580c", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function NotFound({ msg }: { msg: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, background: "#fef9f0", fontFamily: "Inter,sans-serif", textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>🙏</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", margin: 0 }}>ரசீது கிடைக்கவில்லை</h2>
      <p style={{ fontSize: 13, color: "#78716c", margin: 0, maxWidth: 280 }}>{msg}</p>
      <a href={import.meta.env.BASE_URL} style={{ color: "#ea580c", fontSize: 13 }}>முகப்பு</a>
    </div>
  );
}
function StatusPage({ donation, isPending }: { donation: ReceiptDonation; isPending: boolean }) {
  const col = isPending ? { bg: "linear-gradient(135deg,#f59e0b,#d97706)", text: "#78350f", border: "#fde68a", bgLight: "#fefce8" }
    : { bg: "linear-gradient(135deg,#ef4444,#dc2626)", text: "#991b1b", border: "#fecaca", bgLight: "#fef2f2" };
  return (
    <div style={{ minHeight: "100vh", background: "#fef9f0", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 380, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.10)" }}>
        <div style={{ padding: "18px 22px", background: col.bg, color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: 26 }}>{isPending ? "⏳" : "❌"}</div>
          <div style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
        </div>
        <div style={{ padding: "18px 22px", textAlign: "center" }}>
          <p style={{ fontFamily: "monospace", color: "#a8a29e", fontSize: 11, marginBottom: 8 }}>RCP-{String(donation.id).padStart(6, "0")}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#1c1917", marginBottom: 12 }}>₹{Number(donation.amount).toLocaleString("en-IN")}</p>
          <p style={{ fontSize: 12, color: col.text, background: col.bgLight, border: `1px solid ${col.border}`, borderRadius: 10, padding: "10px 14px", lineHeight: 1.6 }}>
            {isPending ? "உங்கள் நன்கொடை சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு முழு ரசீது கிடைக்கும்."
              : "இந்த நன்கொடை நிராகரிக்கப்பட்டது. கோவில் நிர்வாகத்தை தொடர்பு கொள்ளவும்."}
          </p>
        </div>
        <div style={{ background: "#f5f5f4", padding: "10px 22px", textAlign: "center", borderTop: "1px solid #e7e5e4" }}>
          <a href={import.meta.env.BASE_URL} style={{ color: "#ea580c", fontSize: 12 }}>முகப்பு பக்கம்</a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
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

  /* ── Approved ── */
  const name      = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const initial   = donation.anonymous ? "A" : name.charAt(0).toUpperCase();
  const receiptNo = `RCP-${String(donation.id).padStart(6, "0")}`;
  const dateISO   = donation.reviewedAt ?? donation.createdAt;
  const amount    = `₹${Number(donation.amount).toLocaleString("en-IN")}`;
  const logo      = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ─ Page wrapper ─ */
        .rw { min-height:100vh; background:#f5ede0; display:flex; flex-direction:column; align-items:center; padding:28px 16px; font-family:'Inter',sans-serif; }

        /* ─ Action bar ─ */
        .ra { display:flex; gap:10px; margin-bottom:20px; }
        .ra-print {
          display:flex; align-items:center; gap:7px; padding:10px 26px;
          background:linear-gradient(135deg,#c2410c,#ea580c); color:#fff;
          border:none; border-radius:12px; font:700 13px/1 'Inter',sans-serif;
          cursor:pointer; box-shadow:0 4px 14px rgba(194,65,12,.30); transition:transform .1s;
        }
        .ra-print:hover { transform:translateY(-1px); }
        .ra-home {
          display:flex; align-items:center; gap:6px; padding:10px 20px;
          background:#fff; color:#c2410c; border:2px solid #fcd9a0;
          border-radius:12px; font:600 13px/1 'Inter',sans-serif;
          text-decoration:none; cursor:pointer; transition:background .1s;
        }
        .ra-home:hover { background:#fff7ed; }

        /* ─ Receipt shell ─ */
        .rc {
          width:100%; max-width:500px;
          background:#fff;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 8px 40px rgba(100,30,0,.15);
          border:1.5px solid #e8c99a;
          position:relative;
        }

        /* ─ Decorative side accent bars ─ */
        .rc::before, .rc::after {
          content:'';
          position:absolute; top:0; bottom:0; width:4px;
          background:repeating-linear-gradient(180deg,#ea580c 0,#ea580c 8px,#fcd9a0 8px,#fcd9a0 16px);
        }
        .rc::before { left:0; }
        .rc::after  { right:0; }

        /* ─ HEADER ─ */
        .rh {
          background:linear-gradient(165deg,#5c1a00 0%,#a83000 40%,#bf5a00 100%);
          padding:16px 28px 14px; text-align:center; color:#fff;
          position:relative; overflow:hidden;
        }
        .rh-glow { position:absolute;top:-40px;right:-40px;width:130px;height:130px;border-radius:50%;background:rgba(255,200,80,.07); }
        .rh-glow2 { position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.04); }

        .rh-logo {
          width:60px; height:60px; border-radius:50%; object-fit:cover;
          border:2.5px solid rgba(253,230,138,.55);
          box-shadow:0 4px 16px rgba(0,0,0,.35);
          display:block; margin:0 auto 9px; position:relative; z-index:1;
        }
        .rh-en {
          font-family:'Cinzel',serif; font-size:15.5px; font-weight:900;
          letter-spacing:.6px; line-height:1.25; color:#fff; position:relative; z-index:1;
        }
        .rh-ta {
          font-family:'Noto Serif Tamil',serif; font-size:12px; font-weight:700;
          color:#fde68a; margin-top:3px; position:relative; z-index:1;
        }
        .rh-addr {
          font-size:10px; color:#fcd9a0; margin-top:3px;
          letter-spacing:.3px; position:relative; z-index:1;
        }
        .rh-pill {
          display:inline-block; margin-top:11px;
          background:rgba(255,255,255,.13); border:1px solid rgba(253,230,138,.38);
          border-radius:30px; padding:5px 20px;
          font-family:'Noto Serif Tamil',serif; font-size:11.5px; font-weight:700;
          color:#fef3c7; letter-spacing:1px; position:relative; z-index:1;
        }

        /* ─ RECEIPT LABEL STRIP ─ */
        .rl-strip {
          background:#fff7ed; border-top:1.5px solid #fde8c8; border-bottom:1.5px solid #fde8c8;
          padding:5px 28px; display:flex; align-items:center; justify-content:center; gap:10px;
        }
        .rl-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#fcd9a0); }
        .rl-line.r { background:linear-gradient(90deg,#fcd9a0,transparent); }
        .rl-text { font-family:'Cinzel',serif; font-size:10px; font-weight:700; color:#b45309; letter-spacing:2px; white-space:nowrap; text-transform:uppercase; }

        /* ─ BLESSING ─ */
        .rb {
          background:linear-gradient(90deg,#fef3c7 0%,#fff9e6 50%,#fef3c7 100%);
          border-bottom:1.5px solid #fde8c8;
          padding:9px 28px; text-align:center;
        }
        .rb-top { font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:600; color:#92400e; }
        .rb-main { font-family:'Noto Serif Tamil',serif; font-size:13.5px; font-weight:800; color:#92400e; margin-top:2px; line-height:1.4; }

        /* ─ META: receipt no + date ─ */
        .rm {
          display:grid; grid-template-columns:1fr auto 1fr;
          align-items:center; gap:0;
          padding:8px 28px; background:#faf9f7;
          border-bottom:1px solid #f0ece4;
        }
        .rm-label { font:700 8.5px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.9px; color:#d97706; margin-bottom:3px; }
        .rm-val { font:800 14px/1 'Inter',sans-serif; color:#7c2d12; letter-spacing:.5px; }
        .rm-date { font:700 12px/1 'Inter',sans-serif; color:#78350f; }
        .rm-date-ta { font-family:'Noto Serif Tamil',serif; font-size:9px; color:#b45309; margin-top:2px; }
        .rm-sep { width:1px; height:34px; background:#e8ddd0; justify-self:center; }

        /* ─ DONOR SECTION ─ */
        .rd { margin:12px 20px; border:1.5px solid #e8ddd0; border-radius:10px; overflow:hidden; }
        .rd-head {
          background:linear-gradient(90deg,#fff7ed,#fffbeb);
          padding:6px 14px; border-bottom:1px solid #fde8c8;
          font:800 8.5px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px; color:#ea580c;
        }
        /* Name hero row */
        .rd-name {
          display:flex; align-items:center; gap:11px;
          padding:10px 14px; background:#fff;
          border-bottom:1px solid #f5ede0;
        }
        .rd-avatar {
          width:36px; height:36px; border-radius:9px; flex-shrink:0;
          background:linear-gradient(135deg,#c2410c,#ea580c);
          display:flex; align-items:center; justify-content:center;
          font:800 15px/1 'Inter',sans-serif; color:#fff;
        }
        .rd-name-label { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.6px; color:#a8a29e; margin-bottom:3px; }
        .rd-name-val { font-family:'Noto Serif Tamil',serif; font-size:16px; font-weight:800; color:#1c1917; }
        /* Detail rows */
        .rd-row { display:flex; justify-content:space-between; align-items:baseline; gap:12px; padding:6px 14px; border-bottom:1px solid #faf5ee; }
        .rd-row:last-child { border-bottom:none; }
        .rd-row:nth-child(even) { background:#fdfaf6; }
        .rd-lbl { font:600 9px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.5px; color:#a8a29e; flex-shrink:0; white-space:nowrap; }
        .rd-val { font:600 11px/1.3 'Inter',sans-serif; color:#292524; text-align:right; word-break:break-all; }
        .rd-val.mono { font-family:'Inter',monospace; font-size:10px; font-weight:500; color:#57534e; }

        /* ─ AMOUNT BLOCK ─ */
        .ra-block {
          margin:12px 20px;
          background:linear-gradient(140deg,#5c1a00 0%,#a83000 45%,#bf5a00 100%);
          border-radius:12px; padding:14px 20px;
          display:flex; align-items:center; justify-content:space-between;
          gap:16px; position:relative; overflow:hidden;
        }
        .ra-block::before { content:''; position:absolute; top:-25px; right:-25px; width:110px; height:110px; border-radius:50%; background:rgba(255,220,100,.06); }
        .ra-lbl { font:700 8.5px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px; color:#fde68a; }
        .ra-lbl-ta { font-family:'Noto Serif Tamil',serif; font-size:9.5px; font-weight:600; color:#fcd9a0; margin-top:2px; margin-bottom:6px; }
        .ra-val { font-family:'Oswald',sans-serif; font-size:38px; font-weight:700; color:#fff; line-height:1; letter-spacing:.5px; }

        /* Stamp */
        .stamp {
          flex-shrink:0; background:rgba(240,253,244,.97);
          border:2.5px solid #16a34a; border-radius:10px;
          padding:8px 13px; transform:rotate(-5deg);
          box-shadow:0 3px 14px rgba(22,163,74,.22);
          text-align:center;
        }
        .stamp-check { font-size:24px; color:#16a34a; line-height:1; }
        .stamp-en { font:900 11.5px/1 'Inter',sans-serif; color:#15803d; text-transform:uppercase; letter-spacing:1.5px; margin-top:3px; }
        .stamp-ta { font-family:'Noto Serif Tamil',serif; font-size:9px; font-weight:700; color:#166534; margin-top:2px; }

        /* ─ SARANAM DIVIDER ─ */
        .rs { display:flex; align-items:center; gap:10px; padding:6px 20px 5px; }
        .rs-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#e8c99a,transparent); }
        .rs-text { font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:800; color:#ea580c; letter-spacing:1px; white-space:nowrap; }

        /* ─ FOOTER ─ */
        .rf {
          background:linear-gradient(135deg,#5c1a00,#7c2d12);
          padding:11px 20px; text-align:center;
        }
        .rf-issued { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1.2px; color:#fde68a; margin-bottom:4px; }
        .rf-org { font-family:'Noto Serif Tamil',serif; font-size:14px; font-weight:800; color:#fff; letter-spacing:.3px; }
        .rf-org-en { font-size:9.5px; color:#fcd9a0; margin-top:2px; }
        .rf-note { font-size:8px; color:rgba(253,230,138,.4); margin-top:6px; }

        /* ═══════════════════════════
           PRINT
        ═══════════════════════════ */
        @media print {
          @page { size:A4 portrait; margin:8mm 10mm; }

          body { background:#fff !important; }

          /* hide screen chrome */
          .rw { min-height:unset; padding:0; background:#fff; align-items:stretch; }
          .ra { display:none !important; }

          /* card fills page width, no shadow */
          .rc { max-width:100%; border-radius:0; box-shadow:none; border:none; }

          /* Tighten header */
          .rh { padding:10px 22px 10px; }
          .rh-logo { width:50px; height:50px; margin-bottom:7px; }
          .rh-en { font-size:14px; }
          .rh-ta { font-size:11px; }
          .rh-addr { font-size:9.5px; }
          .rh-pill { margin-top:9px; padding:4px 16px; font-size:10.5px; }

          /* Tighten strip */
          .rl-strip { padding:4px 22px; }
          .rl-text { font-size:9px; }

          /* Tighten blessing */
          .rb { padding:7px 22px; }
          .rb-top { font-size:10.5px; }
          .rb-main { font-size:12.5px; }

          /* Tighten meta */
          .rm { padding:6px 22px; }
          .rm-val { font-size:13px; }
          .rm-date { font-size:11px; }

          /* Tighten donor */
          .rd { margin:10px 16px; }
          .rd-name { padding:8px 12px; }
          .rd-avatar { width:30px; height:30px; font-size:12px; border-radius:7px; }
          .rd-name-val { font-size:14.5px; }
          .rd-row { padding:5px 12px; }
          .rd-lbl { font-size:8.5px; }
          .rd-val { font-size:10.5px; }
          .rd-val.mono { font-size:9.5px; }

          /* Tighten amount */
          .ra-block { margin:10px 16px; padding:12px 18px; border-radius:10px; }
          .ra-lbl { font-size:8px; }
          .ra-lbl-ta { font-size:9px; margin-bottom:4px; }
          .ra-val { font-size:32px; }
          .stamp { padding:6px 10px; }
          .stamp-check { font-size:20px; }
          .stamp-en { font-size:10.5px; }
          .stamp-ta { font-size:8.5px; }

          /* Tighten divider */
          .rs { padding:5px 16px 4px; }
          .rs-text { font-size:10px; }

          /* Tighten footer */
          .rf { padding:9px 18px; }
          .rf-org { font-size:13px; }
          .rf-org-en { font-size:9px; }
          .rf-note { font-size:7.5px; margin-top:4px; }

          /* Force colours to print */
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
      `}</style>

      <div className="rw">
        {/* ─ Action buttons ─ */}
        <div className="ra">
          <button className="ra-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
          <a href={import.meta.env.BASE_URL} className="ra-home">🏠 முகப்பு</a>
        </div>

        {/* ═══ RECEIPT CARD ═══ */}
        <div className="rc">

          {/* HEADER */}
          <div className="rh">
            <div className="rh-glow" /><div className="rh-glow2" />
            <img src={logo} alt="Ayyappan" className="rh-logo"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div className="rh-en">Sri Arulmigu Iyyappan Thirukovil</div>
            <div className="rh-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
            <div className="rh-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
            <div><span className="rh-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
          </div>

          {/* RECEIPT LABEL STRIP */}
          <div className="rl-strip">
            <div className="rl-line" />
            <span className="rl-text">Donation Receipt &nbsp;·&nbsp; நன்கொடை ரசீது</span>
            <div className="rl-line r" />
          </div>

          {/* BLESSING */}
          <div className="rb">
            <div className="rb-top">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
            <div className="rb-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
          </div>

          {/* RECEIPT NO + DATE */}
          <div className="rm">
            <div>
              <div className="rm-label">Receipt No.</div>
              <div className="rm-val">{receiptNo}</div>
            </div>
            <div className="rm-sep" />
            <div style={{ textAlign: "right" }}>
              <div className="rm-label">Date</div>
              <div className="rm-date">{fmt(dateISO)}</div>
              <div className="rm-date-ta">{fmtTa(dateISO)}</div>
            </div>
          </div>

          {/* DONOR CARD */}
          <div className="rd">
            <div className="rd-head">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Donor Details</div>
            <div className="rd-name">
              <div className="rd-avatar">{initial}</div>
              <div>
                <div className="rd-name-label">Donor Name / பெயர்</div>
                <div className="rd-name-val">{name}</div>
              </div>
            </div>
            {donation.mobile && (
              <div className="rd-row">
                <span className="rd-lbl">Mobile</span>
                <span className="rd-val mono">{donation.mobile}</span>
              </div>
            )}
            {donation.place && (
              <div className="rd-row">
                <span className="rd-lbl">Place / ஊர்</span>
                <span className="rd-val">{donation.place}</span>
              </div>
            )}
            <div className="rd-row">
              <span className="rd-lbl">Transaction ID</span>
              <span className="rd-val mono">{donation.transactionId}</span>
            </div>
            {donation.message && (
              <div className="rd-row">
                <span className="rd-lbl">Message</span>
                <span className="rd-val" style={{ fontStyle: "italic", color: "#57534e" }}>{donation.message}</span>
              </div>
            )}
          </div>

          {/* AMOUNT + APPROVED STAMP */}
          <div className="ra-block">
            <div>
              <div className="ra-lbl">Donation Amount</div>
              <div className="ra-lbl-ta">நன்கொடை தொகை</div>
              <div className="ra-val">{amount}</div>
            </div>
            <div className="stamp">
              <div className="stamp-check">✔</div>
              <div className="stamp-en">Approved</div>
              <div className="stamp-ta">அங்கீகரிக்கப்பட்டது</div>
            </div>
          </div>

          {/* SARANAM DIVIDER */}
          <div className="rs">
            <div className="rs-line" />
            <span className="rs-text">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span>
            <div className="rs-line" />
          </div>

          {/* FOOTER */}
          <div className="rf">
            <div className="rf-issued">Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
            <div className="rf-org">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
            <div className="rf-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
            <div className="rf-note">Official receipt issued by the temple trust &nbsp;·&nbsp; {receiptNo}</div>
          </div>

        </div>
        {/* Bottom print button */}
        <div className="ra" style={{ marginTop: 18, marginBottom: 0 }}>
          <button className="ra-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
          <a href={import.meta.env.BASE_URL} className="ra-home">🏠 முகப்பு</a>
        </div>
      </div>
    </>
  );
}
