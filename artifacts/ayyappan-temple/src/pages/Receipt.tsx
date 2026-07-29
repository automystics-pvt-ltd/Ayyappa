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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDonationReceipt(token)
      .then((d) => setDonation(d as ReceiptDonation))
      .catch((e) => setError(e.message || "Receipt not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-orange-600 text-sm">ஏற்றுகிறது...</p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-8 text-center bg-amber-50">
        <div className="text-4xl">🙏</div>
        <h2 className="text-lg font-bold text-gray-700">ரசீது கிடைக்கவில்லை</h2>
        <p className="text-gray-500 text-sm max-w-xs">{error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."}</p>
        <a href={import.meta.env.BASE_URL} className="text-orange-600 underline text-sm">முகப்பு பக்கம்</a>
      </div>
    );
  }

  const isPending  = donation.status === "pending";
  const isRejected = donation.status === "rejected";

  if (isPending || isRejected) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
          <div className={`px-6 py-6 text-white text-center ${isPending ? "bg-gradient-to-br from-yellow-500 to-amber-400" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
            <div className="text-3xl mb-1">{isPending ? "⏳" : "❌"}</div>
            <h1 className="text-base font-bold">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</h1>
          </div>
          <div className="px-6 py-6 text-center space-y-3">
            <p className="font-mono text-gray-400 text-xs">RCP-{String(donation.id).padStart(6, "0")}</p>
            <p className="text-2xl font-extrabold text-gray-800">₹{Number(donation.amount).toLocaleString("en-IN")}</p>
            {isPending ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                உங்கள் நன்கொடை சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு இங்கே முழு ரசீது கிடைக்கும்.
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                இந்த நன்கொடை நிராகரிக்கப்பட்டது. கோவில் நிர்வாகத்தை தொடர்பு கொள்ளவும்.
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3 text-center border-t">
            <a href={import.meta.env.BASE_URL} className="text-orange-600 underline text-xs">முகப்பு பக்கம்</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Approved receipt ── */
  const displayName = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const receiptNo   = `RCP-${String(donation.id).padStart(6, "0")}`;
  const approvedISO = donation.reviewedAt ?? donation.createdAt;
  const logoSrc     = `${import.meta.env.BASE_URL}iyyappan-logo.png`;
  const amountFmt   = `₹${Number(donation.amount).toLocaleString("en-IN")}`;

  return (
    <>
      <style>{`
        /* ── Screen wrapper ── */
        .receipt-screen {
          min-height: 100vh;
          background: #fef9f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px;
        }

        /* ── Receipt card ── */
        .receipt-card {
          background: #fff;
          width: 100%;
          max-width: 460px;
          border: 1px solid #fcd9a0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(234,88,12,0.10);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Decorative outer border ── */
        .receipt-outer {
          padding: 5px;
          background: repeating-linear-gradient(
            90deg, #ea580c 0, #ea580c 6px, transparent 6px, transparent 16px
          ),
          repeating-linear-gradient(
            90deg, #ea580c 0, #ea580c 6px, transparent 6px, transparent 16px
          ),
          repeating-linear-gradient(
            0deg, #ea580c 0, #ea580c 6px, transparent 6px, transparent 16px
          ),
          repeating-linear-gradient(
            0deg, #ea580c 0, #ea580c 6px, transparent 6px, transparent 16px
          );
          background-size: 16px 3px, 16px 3px, 3px 16px, 3px 16px;
          background-position: 0 0, 0 100%, 0 0, 100% 0;
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
        }

        /* ── Header ── */
        .receipt-header {
          background: linear-gradient(160deg,#7c2d12 0%,#c2410c 50%,#b45309 100%);
          padding: 16px 20px 14px;
          text-align: center;
          color: #fff;
          position: relative;
        }
        .receipt-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.5);
          object-fit: cover;
          margin: 0 auto 8px;
          display: block;
          background: rgba(255,255,255,0.1);
        }
        .receipt-temple-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: 0.3px;
        }
        .receipt-temple-name-ta {
          font-size: 13px;
          font-weight: 700;
          color: #fde68a;
          margin-top: 2px;
        }
        .receipt-address {
          font-size: 10.5px;
          color: #fcd9a0;
          margin-top: 3px;
          letter-spacing: 0.2px;
        }
        .receipt-saranam {
          margin-top: 10px;
          display: inline-block;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,215,0,0.35);
          border-radius: 20px;
          padding: 4px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #fef3c7;
          letter-spacing: 1px;
        }

        /* ── Blessing band ── */
        .receipt-blessing {
          background: linear-gradient(90deg,#fff7ed,#fffbeb,#fff7ed);
          border-top: 2px solid #fed7aa;
          border-bottom: 2px solid #fed7aa;
          padding: 8px 20px;
          text-align: center;
        }
        .blessing-line1 {
          font-size: 12px;
          color: #92400e;
          font-weight: 600;
        }
        .blessing-line2 {
          font-size: 13.5px;
          font-weight: 800;
          color: #c2410c;
          margin-top: 1px;
          line-height: 1.4;
        }
        .blessing-line3 {
          font-size: 10px;
          color: #b45309;
          margin-top: 2px;
          font-style: italic;
        }

        /* ── Receipt number + date bar ── */
        .receipt-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 18px;
          background: #fff7ed;
          border-bottom: 1px solid #fed7aa;
        }
        .meta-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #d97706;
          font-weight: 600;
        }
        .meta-value {
          font-size: 13px;
          font-weight: 800;
          color: #92400e;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .meta-value-date {
          font-size: 11.5px;
          font-weight: 700;
          color: #78350f;
          text-align: right;
        }
        .meta-divider {
          width: 1px;
          height: 28px;
          background: #fcd9a0;
        }

        /* ── Donor table ── */
        .receipt-table {
          padding: 10px 18px 8px;
        }
        .table-section-title {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #ea580c;
          border-bottom: 1px solid #fed7aa;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .table-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          padding: 3px 0;
          border-bottom: 1px dashed #fef3c7;
        }
        .table-row:last-child { border-bottom: none; }
        .row-label {
          font-size: 10px;
          color: #b45309;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 90px;
        }
        .row-value {
          font-size: 11px;
          color: #1c1917;
          font-weight: 600;
          text-align: right;
          word-break: break-all;
        }
        .row-value.mono {
          font-family: monospace;
          font-size: 10px;
          color: #44403c;
        }
        .row-value.name {
          font-size: 13px;
          font-weight: 800;
          color: #7c2d12;
        }

        /* ── Amount block ── */
        .receipt-amount-block {
          margin: 10px 18px;
          background: linear-gradient(135deg,#7c2d12,#c2410c,#b45309);
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .amount-label {
          font-size: 9.5px;
          color: #fde68a;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .amount-value {
          font-size: 28px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        /* ── Approved stamp ── */
        .approved-stamp {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          border: 2px solid #16a34a;
          border-radius: 6px;
          padding: 4px 10px;
          transform: rotate(-3deg);
        }
        .stamp-check {
          font-size: 13px;
          color: #16a34a;
        }
        .stamp-text-en {
          font-size: 11px;
          font-weight: 900;
          color: #15803d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stamp-text-ta {
          font-size: 9px;
          font-weight: 700;
          color: #166534;
          display: block;
          text-align: center;
          margin-top: 1px;
        }

        /* ── Saranam divider ── */
        .receipt-saranam-band {
          margin: 6px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .saranam-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg,transparent,#fcd9a0,transparent);
        }
        .saranam-text {
          font-size: 11px;
          color: #ea580c;
          font-weight: 800;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }

        /* ── Footer ── */
        .receipt-footer {
          background: linear-gradient(135deg,#7c2d12,#92400e);
          padding: 10px 18px;
          text-align: center;
        }
        .footer-issued {
          font-size: 9px;
          color: #fde68a;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin-bottom: 3px;
        }
        .footer-org {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.3px;
        }
        .footer-org-en {
          font-size: 9.5px;
          color: #fcd9a0;
          margin-top: 1px;
          letter-spacing: 0.3px;
        }
        .footer-note {
          font-size: 8.5px;
          color: rgba(253,230,138,0.55);
          margin-top: 6px;
        }

        /* ── Print buttons (screen only) ── */
        .print-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-print {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg,#ea580c,#d97706);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 9px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(234,88,12,0.25);
          transition: opacity .15s;
        }
        .btn-print:active { opacity: .85; }
        .btn-home {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          color: #c2410c;
          border: 1.5px solid #fed7aa;
          border-radius: 10px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s;
        }
        .btn-home:hover { background: #fff7ed; }

        /* ── PRINT OVERRIDES ── */
        @media print {
          @page {
            margin: 8mm 10mm;
            size: A5 portrait;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .receipt-screen {
            min-height: unset;
            padding: 0;
            background: white;
          }
          .print-actions { display: none !important; }
          .receipt-card {
            max-width: 100%;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
          .receipt-outer {
            padding: 0;
            background: none;
          }
          /* Ensure colours print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="receipt-screen">
        {/* Print / Home actions — hidden on print */}
        <div className="print-actions">
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="btn-home">
            🏠 முகப்பு
          </a>
        </div>

        {/* ═══ RECEIPT CARD ═══ */}
        <div className="receipt-outer" style={{ borderRadius: 14 }}>
          <div className="receipt-card">

            {/* ── HEADER ── */}
            <div className="receipt-header">
              <img
                src={logoSrc}
                alt="Ayyappan"
                className="receipt-logo"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="receipt-temple-name">
                Sri Arulmigu Iyyappan Thirukovil
              </div>
              <div className="receipt-temple-name-ta">
                அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
              </div>
              <div className="receipt-address">
                R.S Road, Vadamadurai, Tamil Nadu
              </div>
              <div>
                <span className="receipt-saranam">✦ ஸ்வாமியே சரணம் ஐயப்பா ✦</span>
              </div>
            </div>

            {/* ── BLESSING BAND ── */}
            <div className="receipt-blessing">
              <div className="blessing-line1">
                உங்களுக்கும் உங்கள் குடும்பத்திற்கும்
              </div>
              <div className="blessing-line2">
                ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும்
              </div>
              <div className="blessing-line3">
                May Lord Ayyappan bless you and your family with grace and goodness 🙏
              </div>
            </div>

            {/* ── RECEIPT NO + DATE ── */}
            <div className="receipt-meta">
              <div>
                <div className="meta-label">ரசீது எண் / Receipt No.</div>
                <div className="meta-value">{receiptNo}</div>
              </div>
              <div className="meta-divider" />
              <div style={{ textAlign: "right" }}>
                <div className="meta-label" style={{ textAlign: "right" }}>தேதி / Date</div>
                <div className="meta-value-date">{fmtDate(approvedISO)}</div>
                <div style={{ fontSize: 9.5, color: "#b45309" }}>{fmtDateTa(approvedISO)}</div>
              </div>
            </div>

            {/* ── DONOR DETAILS ── */}
            <div className="receipt-table">
              <div className="table-section-title">நன்கொடையாளர் விவரம் · Donor Details</div>
              <div className="table-row">
                <span className="row-label">பெயர் / Name</span>
                <span className="row-value name">{displayName}</span>
              </div>
              {donation.mobile && (
                <div className="table-row">
                  <span className="row-label">கைபேசி / Mobile</span>
                  <span className="row-value mono">{donation.mobile}</span>
                </div>
              )}
              {donation.place && (
                <div className="table-row">
                  <span className="row-label">ஊர் / Place</span>
                  <span className="row-value">{donation.place}</span>
                </div>
              )}
              <div className="table-row">
                <span className="row-label">பரிவர்த்தனை / Txn ID</span>
                <span className="row-value mono">{donation.transactionId}</span>
              </div>
              {donation.message && (
                <div className="table-row">
                  <span className="row-label">செய்தி / Message</span>
                  <span className="row-value">{donation.message}</span>
                </div>
              )}
            </div>

            {/* ── AMOUNT + APPROVED STAMP ── */}
            <div className="receipt-amount-block">
              <div>
                <div className="amount-label">நன்கொடை தொகை</div>
                <div style={{ fontSize: 9, color: "#fde68a", marginBottom: 4 }}>Donation Amount</div>
                <div className="amount-value">{amountFmt}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="approved-stamp">
                  <span className="stamp-check">✔</span>
                  <div>
                    <div className="stamp-text-en">APPROVED</div>
                    <div className="stamp-text-ta">அங்கீகரிக்கப்பட்டது</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SARANAM DIVIDER ── */}
            <div className="receipt-saranam-band">
              <div className="saranam-line" />
              <span className="saranam-text">✦ ஸ்வாமியே சரணம் ஐயப்பா ✦</span>
              <div className="saranam-line" />
            </div>

            {/* ── FOOTER ── */}
            <div className="receipt-footer">
              <div className="footer-issued">வழங்கியவர்கள் · Issued By</div>
              <div className="footer-org">வடமதுரை ஐயப்பன் திருப்பணி குழு</div>
              <div className="footer-org-en">Vadamadurai Ayyappan Thirupani Kulu</div>
              <div className="footer-note">
                This is an official receipt · Receipt No: {receiptNo}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom print button */}
        <div className="print-actions" style={{ marginTop: 16, marginBottom: 0 }}>
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
          <a href={import.meta.env.BASE_URL} className="btn-home">
            🏠 முகப்பு
          </a>
        </div>
      </div>
    </>
  );
}
