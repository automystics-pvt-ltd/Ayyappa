import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api, uploadQrCode } from "@/lib/api";
import { Landmark, QrCode, Target, Clock, MapPin, CheckCircle2, Upload, X } from "lucide-react";

const SECTIONS = [
  {
    icon: Landmark,
    title: "வங்கி விவரங்கள்",
    subtitle: "Bank Details",
    color: "from-violet-500 to-indigo-400",
    fields: [
      { key: "bank_name",           label: "வங்கி பெயர்",    placeholder: "State Bank of India" },
      { key: "bank_account_name",   label: "கணக்கு பெயர்",   placeholder: "கோவில் பெயர்" },
      { key: "bank_account_number", label: "கணக்கு எண்",     placeholder: "XXXXXXXXXXXX" },
      { key: "bank_ifsc",           label: "IFSC குறியீடு",  placeholder: "SBIN0001234" },
      { key: "bank_upi_id",         label: "UPI ID",         placeholder: "temple@upi" },
    ],
  },
  {
    icon: QrCode,
    title: "QR Code & GPay",
    subtitle: "Payment QR · Google Pay",
    color: "from-emerald-500 to-teal-400",
    fields: [
      { key: "qr_code_url", label: "QR Code படம்", placeholder: "" },
      { key: "gpay_number", label: "GPay / PhonePe எண்", placeholder: "+91 XXXXXXXXXX" },
    ],
  },
  {
    icon: Target,
    title: "நன்கொடை இலக்கு",
    subtitle: "Donation Goal",
    color: "from-orange-500 to-amber-400",
    fields: [
      { key: "donation_goal", label: "இலக்கு தொகை (₹)", placeholder: "5000000" },
    ],
  },
  {
    icon: Clock,
    title: "கோவில் நேரங்கள்",
    subtitle: "Temple Timings",
    color: "from-rose-500 to-orange-400",
    fields: [
      { key: "temple_timings", label: "திறக்கும் நேரம்", placeholder: "காலை 6:00 - 12:00 | மாலை 4:00 - 8:00" },
    ],
  },
  {
    icon: MapPin,
    title: "முகவரி & தொடர்பு",
    subtitle: "Address & Contact",
    color: "from-blue-500 to-cyan-400",
    fields: [
      { key: "temple_address", label: "கோவில் முகவரி",  placeholder: "வடமதுரை, திண்டுக்கல்..." },
      { key: "temple_phone",    label: "தொலைபேசி",                placeholder: "+91 98765 43210" },
      { key: "temple_email",    label: "மின்னஞ்சல்",               placeholder: "temple@example.com" },
      { key: "support_phone",   label: "உதவி மைய எண் (Helpline)", placeholder: "+91 XXXXXXXXXX" },
    ],
  },
];

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_QR_SIZE = 5 * 1024 * 1024;

export default function SettingsAdmin() {
  const [settings, setSettings]     = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError]       = useState<string | null>(null);
  const qrInputRef                  = useRef<HTMLInputElement>(null);

  const handleQrUpload = async (file: File) => {
    setQrError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setQrError("JPEG, PNG, WebP அல்லது GIF மட்டும் ஏற்றுக்கொள்ளப்படும்");
      return;
    }
    if (file.size > MAX_QR_SIZE) {
      setQrError("கோப்பு அளவு 5 MB-க்கு கீழ் இருக்க வேண்டும்");
      return;
    }
    setQrUploading(true);
    try {
      const { uploadQrCode } = await import("@/lib/api");
      const objectPath = await uploadQrCode(file);
      setSettings(prev => ({ ...prev, qr_code_url: objectPath }));
    } catch (e: any) {
      setQrError(e.message ?? "பதிவேற்றம் தோல்வியடைந்தது");
    } finally {
      setQrUploading(false);
    }
  };

  useEffect(() => {
    api.getSettings()
      .then(d => setSettings(d as Record<string, string>))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-orange-900">அமைப்புகள்</h1>
          <p className="text-xs text-orange-500">Settings · வங்கி, QR, இலக்கு, நேரங்கள், முகவரி</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md shadow-orange-200 transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
          {saving ? "சேமிக்கிறது..." : "சேமி"}
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-[3px] border-orange-300 border-t-orange-600 animate-spin" />
          </div>
        ) : (
          <>
            {SECTIONS.map(({ icon: Icon, title, subtitle, color, fields }) => (
              <div key={title} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-orange-50">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-900 leading-tight">{title}</p>
                    <p className="text-[10px] text-orange-400">{subtitle}</p>
                  </div>
                </div>
                {/* Fields */}
                <div className="px-5 py-4 space-y-4">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-orange-700 mb-1.5">{f.label}</label>

                      {f.key === "qr_code_url" ? (
                        /* ── QR image upload widget ── */
                        <div className="space-y-2">
                          {/* Preview */}
                          {settings.qr_code_url && (
                            <div className="relative inline-block">
                              <img
                                src={settings.qr_code_url}
                                alt="QR Code preview"
                                className="w-36 h-36 object-contain rounded-xl border-2 border-emerald-200 bg-white p-1 shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, qr_code_url: "" }))}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                                title="நீக்கு"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Upload button */}
                          <input
                            ref={qrInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.target.value = ""; }}
                          />
                          <button
                            type="button"
                            disabled={qrUploading}
                            onClick={() => qrInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            {qrUploading ? "பதிவேற்றுகிறது…" : settings.qr_code_url ? "மாற்று / Replace" : "QR படம் பதிவேற்று"}
                          </button>
                          {qrError && <p className="text-xs text-red-600 font-medium">{qrError}</p>}
                        </div>
                      ) : (
                        <input
                          value={settings[f.key] ?? ""}
                          onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                          placeholder={f.placeholder}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save bar */}
            <div className="flex items-center gap-4 pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-orange-200 disabled:opacity-50 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#ea580c,#d97706)" }}>
                {saving ? "சேமிக்கிறது..." : "மாற்றங்களை சேமி"}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> சேமிக்கப்பட்டது!
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
