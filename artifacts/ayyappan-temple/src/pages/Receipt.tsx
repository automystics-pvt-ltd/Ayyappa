import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { api } from "@/lib/api";

type ReceiptDonation = {
  id: number;
  donorName: string;
  place?: string;
  amount: string;
  transactionId: string;
  anonymous: boolean;
  message?: string;
  status: string;
  reviewedAt?: string;
  createdAt: string;
};

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
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">
        ஏற்றுகிறது...
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-8 text-center">
        <div className="text-5xl">🙏</div>
        <h2 className="text-xl font-bold text-gray-700">ரசீது கிடைக்கவில்லை</h2>
        <p className="text-gray-500 max-w-sm">{error || "இந்த ரசீது இணைப்பு செல்லுபடியாகவில்லை."}</p>
        <a href={import.meta.env.BASE_URL} className="mt-2 text-orange-600 underline text-sm">முகப்பு பக்கம்</a>
      </div>
    );
  }

  const isPending = donation.status === "pending";
  const isRejected = donation.status === "rejected";
  const displayName = donation.anonymous ? "அடையாளம் தெரியாதவர்" : donation.donorName;
  const receiptNo = `RCP-${String(donation.id).padStart(6, "0")}`;
  const approvedDate = donation.reviewedAt
    ? new Date(donation.reviewedAt).toLocaleDateString("ta-IN", { year: "numeric", month: "long", day: "numeric" })
    : new Date(donation.createdAt).toLocaleDateString("ta-IN", { year: "numeric", month: "long", day: "numeric" });
  const amountNum = Number(donation.amount).toLocaleString("en-IN");

  // Pending state — show a status page without sensitive transaction details
  if (isPending || isRejected) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
          <div className={`px-8 py-7 text-white text-center ${isPending ? "bg-gradient-to-r from-yellow-500 to-amber-400" : "bg-gradient-to-r from-red-500 to-rose-600"}`}>
            <div className="text-3xl mb-2">{isPending ? "⏳" : "❌"}</div>
            <h1 className="text-xl font-bold leading-snug">
              அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
            </h1>
            <p className="text-white/80 text-sm mt-1">நன்கொடை ரசீது · Donation Receipt</p>
          </div>
          <div className="px-8 py-8 text-center space-y-4">
            <p className="font-mono text-gray-400 text-sm">{receiptNo}</p>
            <div className="text-2xl font-extrabold text-gray-800">₹{amountNum}</div>
            <p className="text-gray-600 font-medium">{displayName}</p>
            {isPending ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                  உங்கள் நன்கொடை நிர்வாகியால் சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்ட பிறகு இந்த பக்கத்தில் முழு ரசீது கிடைக்கும்.
                  <div className="mt-1 text-yellow-600 font-medium">Your receipt will appear here once approved.</div>
                </div>
                <p className="text-xs text-gray-400">இந்த இணைப்பை சேமித்து வைக்கவும் — அங்கீகாரத்திற்கு பிறகு ரசீது தானாக தெரியும்.</p>
              </>
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

  // Approved — full printable receipt
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4 print:bg-white print:p-0">
      {/* Print button — hidden when printing */}
      <div className="mb-6 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium shadow transition-colors flex items-center gap-2"
        >
          🖨️ Print / PDF சேமி
        </button>
        <a href={import.meta.env.BASE_URL} className="border border-gray-300 text-gray-600 hover:bg-gray-100 px-5 py-2.5 rounded-xl font-medium transition-colors">
          முகப்பு
        </a>
      </div>

      {/* Receipt card */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-7 text-white text-center">
          <div className="text-3xl mb-2">🪔</div>
          <h1 className="text-xl font-bold leading-snug">
            அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்
          </h1>
          <p className="text-orange-100 text-sm mt-1">நன்கொடை ரசீது · Donation Receipt</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          {/* Receipt number + date */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">ரசீது எண் / Receipt No.</p>
              <p className="font-mono font-bold text-gray-800 text-lg">{receiptNo}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">தேதி / Date</p>
              <p className="text-gray-700 font-medium text-sm">{approvedDate}</p>
            </div>
          </div>

          {/* Donor details */}
          <div className="space-y-3">
            <Row label="நன்கொடையாளர் / Donor" value={displayName} />
            {donation.place && <Row label="ஊர் / Place" value={donation.place} />}
            <Row label="பரிவர்த்தனை எண் / Transaction ID" value={donation.transactionId} mono />
            {donation.message && <Row label="செய்தி / Message" value={donation.message} />}
          </div>

          {/* Amount highlight */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5 text-center mt-2">
            <p className="text-xs text-amber-600 uppercase tracking-widest mb-1">நன்கொடை தொகை</p>
            <p className="text-4xl font-extrabold text-orange-600">₹{amountNum}</p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center pt-1">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full">
              ✅ அங்கீகரிக்கப்பட்டது · Approved
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-5 text-center text-xs text-gray-400 border-t">
          <p>இந்த ரசீது திருக்கோவிலால் வழங்கப்படுகிறது.</p>
          <p className="mt-0.5">This receipt is issued by the temple trust. Thank you for your generous donation. 🙏</p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
      <span
        className={`text-sm text-gray-800 text-right break-all ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
