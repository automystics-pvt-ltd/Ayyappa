import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";

type ContributionData = {
  id: number;
  receiptToken: string;
  donorName: string;
  place?: string | null;
  description: string;
  contributedAt: string;
  createdAt: string;
  isActive: boolean;
};

const fmtEn = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTa = (iso: string) =>
  new Date(iso).toLocaleDateString("ta-IN", { day: "numeric", month: "long", year: "numeric" });

function Spinner() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff7ed" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", border:"4px solid #fed7aa", borderTopColor:"#ea580c", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NotFound({ msg }: { msg: string }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:24, background:"#fff7ed", fontFamily:"Inter,sans-serif", textAlign:"center" }}>
      <div style={{ fontSize:40 }}>🙏</div>
      <h2 style={{ fontSize:18, fontWeight:800, color:"#1c1917", margin:0 }}>ரசீது கிடைக்கவில்லை</h2>
      <p style={{ fontSize:13, color:"#78716c", margin:0, maxWidth:280 }}>{msg}</p>
      <a href={import.meta.env.BASE_URL} style={{ color:"#ea580c", fontSize:13 }}>முகப்பு</a>
    </div>
  );
}

export default function ContributionReceipt() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]       = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const docRef                = useRef<HTMLDivElement>(null);
  const [imgBusy, setImgBusy] = useState(false);

  useEffect(() => {
    api.getContributionReceipt(token)
      .then(d => setData(d as ContributionData))
      .catch(e => setError(e.message || "Receipt not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)         return <Spinner />;
  if (error || !data)  return <NotFound msg={error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."} />;

  const receiptNo = `IKC-${String(data.id).padStart(6, "0")}`;
  const dateISO   = data.contributedAt ?? data.createdAt;
  const logo      = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  const captureCanvas = async () => {
    await document.fonts.ready;
    return html2canvas(docRef.current!, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#c2410c",
      imageTimeout: 0,
      logging: false,
      onclone: (_clonedDoc: Document, el: HTMLElement) => {
        const link = document.createElement("link");
        link.rel  = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@600;700&display=swap";
        el.ownerDocument.head.appendChild(link);
        const seal = el.querySelector<SVGElement>(".ikc-seal");
        if (seal) seal.style.overflow = "visible";
      },
    });
  };

  const saveAsImage = async () => {
    if (!docRef.current || imgBusy) return;
    setImgBusy(true);
    try {
      const canvas = await captureCanvas();
      const link = document.createElement("a");
      link.download = `contribution-${receiptNo}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("படம் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
    } finally { setImgBusy(false); }
  };

  const shareWhatsApp = async () => {
    if (!docRef.current || imgBusy) return;
    setImgBusy(true);
    const waFallback = () => {
      const txt = encodeURIComponent(
        `ஸ்வாமியே சரணம் ஐயப்பா 🙏\n${data.donorName} — பொருள் நன்கொடை\nரசீது: ${window.location.href}`
      );
      window.open(`https://wa.me/?text=${txt}`, "_blank");
    };
    try {
      const canvas = await captureCanvas();
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error("blob failed")), "image/png")
      );
      const file = new File([blob], `contribution-${receiptNo}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `பொருள் நன்கொடை ரசீது ${receiptNo}`,
            text: `ஸ்வாமியே சரணம் ஐயப்பா 🙏\n${data.donorName} — பொருள் நன்கொடை`,
          });
        } catch (shareErr) {
          if ((shareErr as { name?: string }).name !== "AbortError") waFallback();
        }
      } else {
        waFallback();
      }
    } catch {
      waFallback();
    } finally { setImgBusy(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Serif+Tamil:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* PAGE */
        .ikc-pg {
          min-height:100vh;
          background:radial-gradient(ellipse at 30% 20%,#fff7ed 0%,#fef3c7 55%,#fde8c8 100%);
          display:flex; flex-direction:column; align-items:center;
          padding:28px 16px 36px;
          font-family:'Inter',sans-serif;
        }

        /* ACTION BUTTONS */
        .ikc-acts { display:flex; gap:10px; margin-bottom:22px; flex-wrap:wrap; justify-content:center; }
        .ikc-btn-p {
          display:flex; align-items:center; gap:8px; padding:11px 28px;
          background:linear-gradient(135deg,#7c2d12,#c2410c,#ea580c);
          color:#fff; border:none; border-radius:10px;
          font:700 13px/1 'Inter',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(194,65,12,.28); transition:opacity .15s;
        }
        .ikc-btn-p:hover { opacity:.88; }
        .ikc-btn-h {
          display:flex; align-items:center; gap:6px; padding:11px 22px;
          background:#fff; color:#92400e; border:1.5px solid #fcd9a0; border-radius:10px;
          font:600 13px/1 'Inter',sans-serif; text-decoration:none; transition:background .15s;
        }
        .ikc-btn-h:hover { background:#fff7ed; }
        .ikc-btn-img {
          display:flex; align-items:center; gap:8px; padding:11px 22px;
          background:linear-gradient(135deg,#1e3a5f,#1d4ed8,#3b82f6);
          color:#fff; border:none; border-radius:10px;
          font:700 13px/1 'Inter',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(29,78,216,.28); transition:opacity .15s;
        }
        .ikc-btn-img:hover { opacity:.88; }
        .ikc-btn-wa {
          display:flex; align-items:center; gap:8px; padding:11px 22px;
          background:linear-gradient(135deg,#14532d,#15803d,#22c55e);
          color:#fff; border:none; border-radius:10px;
          font:700 13px/1 'Inter',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(21,128,61,.28); transition:opacity .15s;
        }
        .ikc-btn-wa:hover { opacity:.88; }
        .ikc-btn-p:disabled,.ikc-btn-img:disabled,.ikc-btn-wa:disabled { opacity:.55; cursor:not-allowed; }

        /* DOCUMENT */
        .ikc-doc {
          width:100%; max-width:560px;
          background:#c2410c;
          border:2.5px solid #7c2d12;
          box-shadow:0 8px 40px rgba(100,30,0,.18);
        }
        .ikc-doc-inner { margin:3px; background:#fff; overflow:hidden; }

        /* HEADER */
        .ikc-hdr {
          background:linear-gradient(170deg,#4a1000 0%,#7c2500 38%,#a83500 72%,#c24800 100%);
          padding:20px 24px 16px; text-align:center;
        }
        .ikc-hdr-logo {
          width:76px; height:76px; border-radius:50%; object-fit:cover;
          border:3px solid rgba(253,230,138,.55);
          box-shadow:0 4px 18px rgba(0,0,0,.40);
          display:block; margin:0 auto 10px;
        }
        .ikc-hdr-en {
          font-family:'Cinzel',serif; font-weight:900; font-size:17.5px;
          color:#fff; letter-spacing:.6px; line-height:1.25;
        }
        .ikc-hdr-ta {
          font-family:'Noto Serif Tamil',serif; font-weight:700; font-size:13px;
          color:#fde68a; margin-top:4px;
        }
        .ikc-hdr-addr { font-size:10px; color:#fcd9a0; margin-top:4px; }
        .ikc-hdr-pill {
          display:inline-block; margin-top:11px;
          background:rgba(255,255,255,.12); border:1px solid rgba(253,230,138,.40);
          border-radius:30px; padding:5px 20px;
          font-family:'Noto Serif Tamil',serif; font-size:11.5px; font-weight:700;
          color:#fef3c7; letter-spacing:.8px;
        }

        /* TITLE STRIP */
        .ikc-strip {
          background:#fff7ed;
          border-top:1.5px solid #fde8c8; border-bottom:1.5px solid #fde8c8;
          padding:7px 24px; text-align:center;
          display:flex; align-items:center; justify-content:center; gap:12px;
        }
        .ikc-strip-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#e8c99a); }
        .ikc-strip-line.r { background:linear-gradient(90deg,#e8c99a,transparent); }
        .ikc-strip-en {
          font-family:'Cinzel',serif; font-weight:700; font-size:11px;
          color:#7c2d12; letter-spacing:2.5px; white-space:nowrap; text-transform:uppercase;
        }

        /* BLESSING */
        .ikc-bless {
          background:linear-gradient(90deg,#fef3c7 0%,#fef9e6 50%,#fef3c7 100%);
          border-bottom:1.5px solid #fcd9a0; padding:10px 24px; text-align:center;
        }
        .ikc-bless-sub {
          font-family:'Noto Serif Tamil',serif; font-size:11px; font-weight:600;
          color:#92400e; margin-bottom:3px;
        }
        .ikc-bless-main {
          font-family:'Noto Serif Tamil',serif; font-size:15px; font-weight:800;
          color:#c2410c; line-height:1.45;
        }

        /* META */
        .ikc-meta { display:grid; grid-template-columns:1fr 1px 1fr; background:#fdfaf6; border-bottom:1px solid #f0ece4; }
        .ikc-mc { padding:8px 18px; }
        .ikc-mc.r { text-align:right; }
        .ikc-mc-sep { background:#e8ddd0; }
        .ikc-mc-lbl { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px; color:#d97706; margin-bottom:4px; }
        .ikc-mc-no  { font:900 15px/1 'Cinzel',serif; color:#6b1700; letter-spacing:.5px; }
        .ikc-mc-date { font:700 13px/1 'Inter',sans-serif; color:#6b1700; }
        .ikc-mc-date-ta { font-family:'Noto Serif Tamil',serif; font-size:9.5px; font-weight:600; color:#b45309; margin-top:3px; }

        /* DONOR HERO */
        .ikc-donor {
          background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde8c8 100%);
          border-top:1px solid #fde8c8; border-bottom:2px solid #fcd9a0;
          padding:18px 28px; text-align:center;
        }
        .ikc-donor-lbl {
          font:700 8px/1 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:1.4px; color:#b45309; margin-bottom:10px;
        }
        .ikc-donor-name {
          font-family:'Noto Serif Tamil',serif;
          font-size:26px; font-weight:900; color:#7c2d12; line-height:1.25;
        }
        .ikc-donor-place {
          font-family:'Noto Serif Tamil',serif;
          font-size:13px; font-weight:700; color:#92400e; margin-top:6px;
        }

        /* DESCRIPTION BAND */
        .ikc-desc-wrap {
          border-top:2px solid #c2410c; border-bottom:2px solid #c2410c;
          background:linear-gradient(140deg,#4a1000 0%,#7c2500 45%,#c24800 100%);
          padding:22px 28px;
          display:flex; gap:18px; align-items:flex-start;
        }
        .ikc-desc-icon {
          width:52px; height:52px; flex-shrink:0;
          background:rgba(255,255,255,.12); border:1.5px solid rgba(253,230,138,.35);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:24px;
        }
        .ikc-desc-body { flex:1; min-width:0; }
        .ikc-desc-lbl {
          font:700 8px/1 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:1.4px; color:#86efac; margin-bottom:8px;
        }
        .ikc-desc-text {
          font-family:'Noto Serif Tamil',serif;
          font-size:17px; font-weight:700; color:#fff; line-height:1.55;
          word-break:break-word;
        }

        /* ACKNOWLEDGEMENT SEAL */
        .ikc-ack {
          background:#f0fdf4; border-top:1.5px solid #86efac;
          padding:18px 28px;
          display:flex; align-items:center; justify-content:center; gap:20px;
          flex-wrap:wrap;
        }
        .ikc-ack-text { text-align:center; }
        .ikc-ack-lbl {
          font:700 8px/1 'Inter',sans-serif; text-transform:uppercase;
          letter-spacing:1.4px; color:#15803d; margin-bottom:6px;
        }
        .ikc-ack-ta {
          font-family:'Noto Serif Tamil',serif; font-size:13px;
          font-weight:700; color:#166534; line-height:1.5;
        }
        .ikc-seal { display:block; transform:rotate(-6deg); filter:drop-shadow(0 2px 8px rgba(22,163,74,.22)); }

        /* FOOTER */
        .ikc-ftr {
          background:linear-gradient(135deg,#b45309 0%,#d97706 60%,#f59e0b 100%);
          padding:12px 24px; text-align:center;
        }
        .ikc-ftr-issued { font:700 8px/1 'Inter',sans-serif; text-transform:uppercase; letter-spacing:1.2px; color:rgba(255,255,255,.70); margin-bottom:5px; }
        .ikc-ftr-org-ta { font-family:'Noto Serif Tamil',serif; font-size:16px; font-weight:800; color:#fff; }
        .ikc-ftr-org-en { font-size:10px; font-weight:600; color:rgba(255,255,255,.80); margin-top:3px; letter-spacing:.4px; }
        .ikc-ftr-rcpt   { font-size:8px; color:rgba(255,255,255,.45); margin-top:7px; letter-spacing:.3px; }

        /* PRINT */
        @media print {
          @page { size:A4 portrait; margin:0; }
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          body,html { margin:0; padding:0; }

          .ikc-pg {
            width:210mm; min-height:297mm; padding:0;
            background:#c2410c;
            align-items:stretch; display:flex; flex-direction:column;
          }
          .ikc-acts { display:none !important; }

          .ikc-doc {
            width:210mm; height:297mm; max-width:100%;
            box-shadow:none; background:#c2410c;
            border:3px solid #7c2d12;
            display:flex; flex-direction:column;
          }
          .ikc-doc-inner {
            margin:3px; flex:1;
            display:flex; flex-direction:column; overflow:hidden;
          }

          .ikc-hdr,.ikc-strip,.ikc-bless,.ikc-meta,.ikc-donor,.ikc-desc-wrap,.ikc-ack,.ikc-ftr { flex-shrink:0; }
          .ikc-desc-wrap { flex:1; }

          .ikc-hdr      { padding:12px 32px 10px; }
          .ikc-hdr-logo { width:70px; height:70px; margin-bottom:8px; }
          .ikc-hdr-en   { font-size:17pt; }
          .ikc-hdr-ta   { font-size:12pt; }
          .ikc-hdr-pill { font-size:11pt; }

          .ikc-strip    { padding:6px 28px; }
          .ikc-strip-en { font-size:10.5pt; }

          .ikc-bless     { padding:9px 32px; }
          .ikc-bless-sub { font-size:10pt; }
          .ikc-bless-main{ font-size:14pt; }

          .ikc-mc      { padding:8px 24px; }
          .ikc-mc-lbl  { font-size:8pt; }
          .ikc-mc-no   { font-size:15pt; }
          .ikc-mc-date { font-size:13pt; }

          .ikc-donor      { padding:14px 32px; }
          .ikc-donor-lbl  { font-size:8pt; }
          .ikc-donor-name {
            font-size:20pt; white-space:normal;
            word-break:break-word; overflow-wrap:break-word;
          }
          .ikc-donor-place { font-size:11pt; }

          .ikc-desc-wrap  { padding:0 32px; display:flex; align-items:center; overflow:hidden; }
          .ikc-desc-icon  { width:58px; height:58px; font-size:28px; }
          .ikc-desc-lbl   { font-size:8pt; }
          .ikc-desc-text  { font-size:16pt; }

          .ikc-ack     { padding:14px 32px; }
          .ikc-ack-lbl { font-size:8pt; }
          .ikc-ack-ta  { font-size:12pt; }

          .ikc-ftr        { padding:12px 32px; }
          .ikc-ftr-issued { font-size:8pt; }
          .ikc-ftr-org-ta { font-size:15pt; }
          .ikc-ftr-org-en { font-size:10pt; }
          .ikc-ftr-rcpt   { font-size:8pt; }

          .ikc-doc,.ikc-doc-inner { page-break-inside:avoid; break-inside:avoid; }
        }
      `}</style>

      <div className="ikc-pg">

        <div className="ikc-acts">
          <button className="ikc-btn-p" onClick={() => window.print()}>🖨️ &nbsp;Print / PDF</button>
          <button className="ikc-btn-img" onClick={saveAsImage} disabled={imgBusy}>
            📷 &nbsp;{imgBusy ? "தயாராகிறது…" : "படமாக சேமி"}
          </button>
          <button className="ikc-btn-wa" onClick={shareWhatsApp} disabled={imgBusy}>
            💬 &nbsp;WhatsApp
          </button>
          <a href={import.meta.env.BASE_URL} className="ikc-btn-h">🏠 முகப்பு</a>
        </div>

        {/* ══ DOCUMENT ══ */}
        <div className="ikc-doc" ref={docRef}>
          <div className="ikc-doc-inner">

            {/* HEADER */}
            <div className="ikc-hdr">
              <img src={logo} alt="" className="ikc-hdr-logo"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="ikc-hdr-en">Sri Arulmigu Iyyappan Thirukovil</div>
              <div className="ikc-hdr-ta">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</div>
              <div className="ikc-hdr-addr">R.S Road, Vadamadurai, Tamil Nadu</div>
              <div><span className="ikc-hdr-pill">✦ &nbsp;ஸ்வாமியே சரணம் ஐயப்பா&nbsp; ✦</span></div>
            </div>

            {/* TITLE STRIP */}
            <div className="ikc-strip">
              <div className="ikc-strip-line" />
              <span className="ikc-strip-en">In-Kind Contribution &nbsp;·&nbsp; பொருள் நன்கொடை ரசீது</span>
              <div className="ikc-strip-line r" />
            </div>

            {/* BLESSING */}
            <div className="ikc-bless">
              <div className="ikc-bless-sub">உங்களுக்கும் உங்கள் குடும்பத்திற்கும்</div>
              <div className="ikc-bless-main">ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும் 🙏</div>
            </div>

            {/* RECEIPT NO + DATE */}
            <div className="ikc-meta">
              <div className="ikc-mc">
                <div className="ikc-mc-lbl">Receipt No.</div>
                <div className="ikc-mc-no">{receiptNo}</div>
              </div>
              <div className="ikc-mc-sep" />
              <div className="ikc-mc r">
                <div className="ikc-mc-lbl">Date</div>
                <div className="ikc-mc-date">{fmtEn(dateISO)}</div>
                <div className="ikc-mc-date-ta">{fmtTa(dateISO)}</div>
              </div>
            </div>

            {/* DONOR HERO */}
            <div className="ikc-donor">
              <div className="ikc-donor-lbl">நன்கொடையாளர் விவரம் &nbsp;·&nbsp; Contributor Details</div>
              <div className="ikc-donor-name">{data.donorName}</div>
              {data.place && (
                <div className="ikc-donor-place">📍 &nbsp;{data.place}</div>
              )}
            </div>

            {/* DESCRIPTION — the "amount" equivalent for in-kind */}
            <div className="ikc-desc-wrap">
              <div className="ikc-desc-icon">🎁</div>
              <div className="ikc-desc-body">
                <div className="ikc-desc-lbl">✦ &nbsp;Contribution Details &nbsp;·&nbsp; நன்கொடை விவரம்&nbsp; ✦</div>
                <div className="ikc-desc-text">{data.description}</div>
              </div>
            </div>

            {/* ACKNOWLEDGEMENT + SEAL */}
            <div className="ikc-ack">
              <div className="ikc-ack-text">
                <div className="ikc-ack-lbl">Official Acknowledgement &nbsp;·&nbsp; உத்தியோகபூர்வ ஒப்புகை</div>
                <div className="ikc-ack-ta">
                  இந்த பொருள் நன்கொடை கோவிலுக்காக<br />
                  மகிழ்ச்சியுடன் ஏற்றுக்கொள்ளப்படுகிறது
                </div>
              </div>
              {/* Acknowledgement seal — orange theme */}
              <svg className="ikc-seal" width="150" height="150" viewBox="0 0 150 150"
                   xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="ikc-arc" d="M 8,57.5 A 68,68 0 0,1 142,57.5"/>
                </defs>
                <circle cx="75" cy="75" r="72" fill="#fff7ed"/>
                <circle cx="75" cy="75" r="72" fill="none" stroke="#c2410c" strokeWidth="3"/>
                <circle cx="75" cy="75" r="63" fill="none" stroke="#c2410c" strokeWidth="1.5"/>
                <circle cx="75" cy="75" r="58" fill="none" stroke="#ea580c"
                        strokeWidth="0.8" strokeDasharray="4 3.5"/>
                <text fontFamily="'Noto Serif Tamil',serif" fontSize="7.5"
                      fill="#c2410c" fontWeight="700">
                  <textPath href="#ikc-arc" startOffset="50%" textAnchor="middle">
                    ஸ்வாமியே சரணம் ஐயப்பா
                  </textPath>
                </text>
                <text x="75" y="78" textAnchor="middle"
                      fontFamily="'Noto Serif Tamil',serif"
                      fontSize="17" fontWeight="900" fill="#c2410c">
                  வடமதுரை
                </text>
                <text x="75" y="93" textAnchor="middle"
                      fontFamily="'Noto Serif Tamil',serif"
                      fontSize="11" fontWeight="700" fill="#9a3412">
                  ஐயப்பன் கோவில்
                </text>
                <text x="75" y="107" textAnchor="middle"
                      fontFamily="'Noto Serif Tamil',serif"
                      fontSize="9.5" fontWeight="700" fill="#9a3412">
                  திருப்பணி குழு
                </text>
                <text x="75" y="124" textAnchor="middle"
                      fontFamily="sans-serif" fontSize="8"
                      fill="#ea580c" letterSpacing="5">
                  ◆◆◆
                </text>
              </svg>
            </div>

            {/* FOOTER */}
            <div className="ikc-ftr">
              <div className="ikc-ftr-issued">Receipt Issued By &nbsp;·&nbsp; வழங்கியவர்கள்</div>
              <div className="ikc-ftr-org-ta">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
              <div className="ikc-ftr-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
              <div className="ikc-ftr-rcpt">Official receipt &nbsp;·&nbsp; {receiptNo} &nbsp;·&nbsp; {fmtEn(dateISO)}</div>
            </div>

          </div>{/* doc-inner */}
        </div>{/* doc */}

        <div className="ikc-acts" style={{ marginTop:20, marginBottom:0 }}>
          <button className="ikc-btn-p" onClick={() => window.print()}>🖨️ &nbsp;Print / PDF</button>
          <button className="ikc-btn-img" onClick={saveAsImage} disabled={imgBusy}>
            📷 &nbsp;{imgBusy ? "தயாராகிறது…" : "படமாக சேமி"}
          </button>
          <button className="ikc-btn-wa" onClick={shareWhatsApp} disabled={imgBusy}>
            💬 &nbsp;WhatsApp
          </button>
          <a href={import.meta.env.BASE_URL} className="ikc-btn-h">🏠 முகப்பு</a>
        </div>

      </div>
    </>
  );
}
