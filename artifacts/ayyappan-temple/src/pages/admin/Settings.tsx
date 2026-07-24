import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Landmark, QrCode, Target, Clock, MapPin, CheckCircle2 } from "lucide-react";

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
    title: "QR Code",
    subtitle: "Payment QR",
    color: "from-emerald-500 to-teal-400",
    fields: [
      { key: "qr_code_url", label: "QR Code படம் URL", placeholder: "https://..." },
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
      { key: "temple_phone",   label: "தொலைபேசி",       placeholder: "+91 98765 43210" },
      { key: "temple_email",   label: "மின்னஞ்சல்",      placeholder: "temple@example.com" },
    ],
  },
];

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

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
                      <input
                        value={settings[f.key] ?? ""}
                        onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className={inputCls}
                      />
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
