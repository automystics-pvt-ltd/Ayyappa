import { useEffect, useRef, useState } from "react";
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

/** Tamil months for date formatting */
const TAMIL_MONTHS = [
  "ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்",
  "ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"
];
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${TAMIL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateEn(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

export default function Receipt() {
  const { token } = useParams<{ token: string }>();
  const [donation, setDonation] = useState<ReceiptDonation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
          <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-orange-600 font-medium">ஏற்றுகிறது...</p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-8 text-center bg-amber-50">
        <div className="text-5xl">🙏</div>
        <h2 className="text-xl font-bold text-gray-700">ரசீது கிடைக்கவில்லை</h2>
        <p className="text-gray-500 max-w-sm">{error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."}</p>
        <a href={import.meta.env.BASE_URL} className="mt-2 text-orange-600 underline text-sm">முகப்பு பக்கம்</a>
      </div>
    );
  }

  const isPending = donation.status === "pending";
  const isRejected = donation.status === "rejected";

  // Pending / rejected — status-only view
  if (isPending || isRejected) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
          <div className={`px-8 py-7 text-white text-center ${isPending ? "bg-gradient-to-br from-yellow-500 to-amber-400" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
            <div className="text-3xl mb-2">{isPending ? "⏳" : "❌"}</div>
            <h1 className="text-xl font-bold">அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்</h1>
            <p className="text-white/80 text-sm mt-1">நன்கொடை ரசீது · Donation Receipt</p>
          </div>
          <div className="px-8 py-8 text-center space-y-4">
            <p className="font-mono text-gray-400 text-sm">RCP-{String(donation.id).padStart(6, "0")}</p>
            <div className="text-2xl font-extrabold text-gray-800">₹{Number(donation.amount).toLocaleString("en-IN")}</div>
            {isPending ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                உங்கள் நன்கொடை நிர்வாகியால் சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு இந்த பக்கத்தில் முழு ரசீது கிடைக்கும்.
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                இந்த நன்கொடை நிராகரிக்கப்பட்டது. மேலும் தகவலுக்கு கோவில் நிர்வாகத்தை தொடர்பு கொள்ளவும்.
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-8 py-4 text-center border-t">
            <a href={import.meta.env.BASE_URL} className="text-orange-600 underline text-sm">முகப்பு பக்கம்</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Approved receipt ──
  const displayName = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const receiptNo   = `RCP-${String(donation.id).padStart(6, "0")}`;
  const approvedISO = donation.reviewedAt ?? donation.createdAt;
  const logoSrc     = `${import.meta.env.BASE_URL}iyyappan-logo.png`;

  return (
    <>
      {/* ── Print styles injected via <style> ── */}
      <style>{`
        @media print {
          body { margin: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            min-height: unset !important;
          }
        }
        .receipt-border {
          background-image:
            repeating-linear-gradient(90deg, #f97316 0, #f97316 6px, transparent 6px, transparent 14px),
            repeating-linear-gradient(90deg, #f97316 0, #f97316 6px, transparent 6px, transparent 14px),
            repeating-linear-gradient(0deg,  #f97316 0, #f97316 6px, transparent 6px, transparent 14px),
            repeating-linear-gradient(0deg,  #f97316 0, #f97316 6px, transparent 6px, transparent 14px);
          background-size: 14px 4px, 14px 4px, 4px 14px, 4px 14px;
          background-position: 0 0, 0 100%, 0 0, 100% 0;
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
          padding: 12px;
        }
        .divider-om::before,
        .divider-om::after {
          content: "— ✦ —";
          color: #f97316;
          font-size: 10px;
          letter-spacing: 4px;
        }
        @font-face {
          font-family: 'Tamil';
          src: local('Latha'), local('Vijaya'), local('Noto Sans Tamil');
        }
      `}</style>

      {/* ── Page wrapper ── */}
      <div className="print-wrapper min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-start py-8 px-4">

        {/* Action buttons — hidden on print */}
        <div className="no-print flex gap-3 mb-6 flex-wrap justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            🖨️ Print / Save PDF
          </button>
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 border border-orange-200 text-orange-700 hover:bg-orange-50 px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            🏠 முகப்பு
          </a>
        </div>

        {/* ── Receipt card ── */}
        <div
          ref={printRef}
          className="print-page receipt-border bg-white w-full max-w-[680px] shadow-2xl shadow-orange-100 rounded-3xl overflow-hidden"
        >

          {/* ═══ HEADER ═══ */}
          <div
            className="relative overflow-hidden text-white text-center px-8 py-8"
            style={{
              background: "linear-gradient(160deg, #7c2d12 0%, #c2410c 40%, #d97706 100%)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute top-4 right-12 w-14 h-14 rounded-full bg-amber-400/20" />

            {/* Logo */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-amber-300/60 backdrop-blur-sm flex items-center justify-center mb-3 shadow-xl overflow-hidden">
                <img
                  src={logoSrc}
                  alt="ஐயப்பன்"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.parentElement!).innerHTML =
                      '<span style="font-size:40px">🪔</span>';
                  }}
                />
              </div>

              {/* Temple name */}
              <h1 className="text-xl font-bold leading-snug drop-shadow-sm">
                அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
              </h1>
              <p className="text-amber-200 text-xs mt-0.5 tracking-wide">
                Arulmigu Sri Ayyappan Thirukovil
              </p>

              {/* Saranam text */}
              <div className="mt-4 px-6 py-3 bg-white/15 border border-amber-300/40 rounded-2xl backdrop-blur-sm">
                <p className="text-amber-100 text-base font-bold tracking-widest leading-relaxed">
                  ஸ்வாமியே சரணம் ஐயப்பா
                </p>
                <p className="text-amber-200/80 text-[10px] tracking-widest mt-0.5">
                  SWAMIYE SARANAM AYYAPPA
                </p>
              </div>

              {/* Receipt label */}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px w-12 bg-amber-300/40" />
                <span className="text-xs text-amber-200 uppercase tracking-[0.2em] font-medium">
                  நன்கொடை ரசீது · Donation Receipt
                </span>
                <div className="h-px w-12 bg-amber-300/40" />
              </div>
            </div>
          </div>

          {/* ═══ BLESSING BANNER ═══ */}
          <div
            className="px-6 py-4 text-center"
            style={{ background: "linear-gradient(90deg, #fff7ed, #fffbeb, #fff7ed)" }}
          >
            <p className="text-amber-800 text-[13px] font-medium leading-relaxed">
              உங்களுக்கும் உங்கள் குடும்பத்திற்கும்
            </p>
            <p className="text-orange-700 text-sm font-bold leading-relaxed">
              ஐயப்பன் அருள் கிடைக்கும், நல்லதே நடக்கும்
            </p>
            <p className="text-amber-600 text-[11px] mt-1 italic">
              May Lord Ayyappan's blessings be upon you and your family 🙏
            </p>
          </div>

          {/* ═══ RECEIPT BODY ═══ */}
          <div className="px-8 py-6 space-y-5">

            {/* Receipt No + Date row */}
            <div className="flex justify-between items-center bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100">
              <div>
                <p className="text-[10px] text-orange-400 uppercase tracking-widest font-medium mb-0.5">ரசீது எண்</p>
                <p className="font-mono font-extrabold text-orange-700 text-lg tracking-wider">{receiptNo}</p>
              </div>
              <div className="h-10 w-px bg-orange-200" />
              <div className="text-right">
                <p className="text-[10px] text-orange-400 uppercase tracking-widest font-medium mb-0.5">தேதி / Date</p>
                <p className="text-sm font-semibold text-orange-800">{formatDate(approvedISO)}</p>
                <p className="text-[10px] text-orange-400">{formatDateEn(approvedISO)}</p>
              </div>
            </div>

            {/* Donor details card */}
            <div className="border border-orange-100 rounded-2xl overflow-hidden">
              <div className="bg-orange-50 px-5 py-3 flex items-center gap-2 border-b border-orange-100">
                <span className="text-orange-500 text-sm">👤</span>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">நன்கொடையாளர் விவரம் · Donor Details</span>
              </div>
              <div className="divide-y divide-orange-50">
                <DetailRow
                  label="நன்கொடையாளர் பெயர்"
                  labelEn="Donor Name"
                  value={displayName}
                  highlight
                />
                {donation.mobile && (
                  <DetailRow
                    label="கைபேசி எண்"
                    labelEn="Mobile"
                    value={donation.mobile}
                  />
                )}
                {donation.place && (
                  <DetailRow
                    label="ஊர்"
                    labelEn="Place"
                    value={donation.place}
                  />
                )}
                <DetailRow
                  label="பரிவர்த்தனை எண்"
                  labelEn="Transaction ID"
                  value={donation.transactionId}
                  mono
                />
                {donation.message && (
                  <DetailRow
                    label="செய்தி"
                    labelEn="Message"
                    value={donation.message}
                  />
                )}
              </div>
            </div>

            {/* Amount — centrepiece */}
            <div
              className="rounded-2xl px-6 py-6 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c, #d97706)" }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }} />
              <div className="relative z-10">
                <p className="text-amber-200 text-xs uppercase tracking-[0.3em] font-medium mb-1">
                  நன்கொடை தொகை · Donation Amount
                </p>
                <p className="text-white text-5xl font-extrabold tracking-tight drop-shadow-lg">
                  ₹{Number(donation.amount).toLocaleString("en-IN")}
                </p>
                <div className="mt-2 inline-flex items-center gap-2 bg-green-400/20 border border-green-300/30 rounded-full px-4 py-1.5">
                  <span className="text-green-300 text-xs">✓</span>
                  <span className="text-green-200 text-xs font-semibold tracking-wide">
                    அங்கீகரிக்கப்பட்டது · Approved
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ═══ SARANAM FOOTER BAND ═══ */}
          <div
            className="px-8 py-5 text-center"
            style={{ background: "linear-gradient(90deg, #fff7ed, #fffbeb, #fff7ed)" }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-300" />
              <span className="text-orange-400 text-xs">✦ ✦ ✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-300" />
            </div>
            <p className="text-orange-800 text-sm font-bold leading-loose tracking-wide">
              ஸ்வாமியே சரணம் ஐயப்பா
            </p>
            <p className="text-orange-600 text-[11px] tracking-widest font-medium">
              SWAMIYE SARANAM AYYAPPA
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-300" />
              <span className="text-orange-400 text-xs">✦ ✦ ✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-300" />
            </div>
          </div>

          {/* ═══ ISSUER FOOTER ═══ */}
          <div className="bg-gradient-to-r from-orange-900 to-amber-800 px-8 py-5 text-center">
            <p className="text-amber-100 text-[11px] uppercase tracking-[0.25em] font-medium mb-1">
              வழங்கியவர்கள்
            </p>
            <p className="text-white text-base font-bold tracking-wide">
              வடமதுரை ஐயப்பன் திருப்பணி குழு
            </p>
            <p className="text-amber-300/80 text-[10px] mt-0.5 tracking-wider">
              Vadamadurai Ayyappan Thirupani Kulu
            </p>
            <p className="text-amber-400/60 text-[9px] mt-3 tracking-wide">
              இந்த ரசீது அதிகாரப்பூர்வமாக கோவில் அறக்கட்டளையால் வழங்கப்படுகிறது
            </p>
            <p className="text-amber-400/60 text-[9px] tracking-wide">
              This receipt is officially issued by the temple trust · Receipt No: {receiptNo}
            </p>
          </div>

        </div>

        {/* Bottom action buttons — no-print */}
        <div className="no-print flex gap-3 mt-6 flex-wrap justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            🖨️ Print / Save PDF
          </button>
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 border border-orange-200 text-orange-700 hover:bg-orange-50 px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            🏠 முகப்பு
          </a>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  labelEn,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  labelEn: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 px-5 py-3">
      <div className="shrink-0">
        <p className="text-[10px] text-orange-400 font-medium leading-tight">{label}</p>
        <p className="text-[9px] text-orange-300 leading-tight">{labelEn}</p>
      </div>
      <span
        className={`text-right break-all ${
          highlight
            ? "text-sm font-bold text-orange-900"
            : mono
            ? "text-xs font-mono text-gray-700"
            : "text-sm text-gray-700 font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
