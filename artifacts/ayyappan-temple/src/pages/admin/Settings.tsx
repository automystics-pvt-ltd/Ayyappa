import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Landmark, QrCode, Target, Clock, MapPin, CheckCircle2, Info, KeyRound, Eye, EyeOff } from "lucide-react";

const SECTIONS = [
  {
    icon: Landmark,
    title: "வங்கி விவரங்கள்",
    subtitle: "Bank Details",
    color: "from-violet-500 to-indigo-400",
    fields: [
      { key: "bank_name",           label: "வங்கி பெயர்",       placeholder: "Indian Overseas Bank (IOB)" },
      { key: "bank_branch",         label: "கிளை",               placeholder: "Vadamadurai Branch (2461)" },
      { key: "bank_account_name",   label: "கணக்கு பெயர்",       placeholder: "Mr. N. Anand" },
      { key: "bank_account_number", label: "கணக்கு எண்",         placeholder: "246101000019314" },
      { key: "bank_ifsc",           label: "IFSC குறியீடு",      placeholder: "IOBA0002461" },
      { key: "bank_account_type",   label: "கணக்கு வகை",         placeholder: "Savings Bank (SB)" },
      { key: "bank_help_phone",     label: "உதவி எண் (Helpline)", placeholder: "9345127734" },
      { key: "bank_upi_id",         label: "UPI ID",              placeholder: "temple@upi" },
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
      { key: "temple_address", label: "கோவில் முகவரி",           placeholder: "வடமதுரை, திண்டுக்கல்..." },
      { key: "temple_phone",   label: "தொலைபேசி",                placeholder: "+91 98765 43210" },
      { key: "temple_email",   label: "மின்னஞ்சல்",               placeholder: "temple@example.com" },
      { key: "support_phone",  label: "உதவி மைய எண் (Helpline)", placeholder: "+91 XXXXXXXXXX" },
    ],
  },
];

const inputCls = "w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white placeholder-orange-300 text-orange-900";

function buildUpiQrValue(upiId: string, name = "Sri Ayyappan Temple") {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;
}

function ChangePasswordCard() {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("புதிய கடவுச்சொற்கள் பொருந்தவில்லை"); return; }
    if (next.length < 8)  { setError("புதிய கடவுச்சொல் குறைந்தது 8 எழுத்துகள் வேண்டும்"); return; }
    setSaving(true);
    try {
      await api.changePassword(current, next);
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setDone(false), 4000);
    } catch (e: any) {
      setError(e.message || "தோல்வி");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-orange-50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center shrink-0">
          <KeyRound className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-orange-900 leading-tight">கடவுச்சொல் மாற்று</p>
          <p className="text-[10px] text-orange-400">Change Password</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {/* Current password */}
        <div>
          <label className="block text-xs font-bold text-orange-700 mb-1.5">தற்போதைய கடவுச்சொல்</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="••••••••"
              required
              className={`${inputCls} pr-10`}
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* New password */}
        <div>
          <label className="block text-xs font-bold text-orange-700 mb-1.5">புதிய கடவுச்சொல்</label>
          <div className="relative">
            <input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={e => setNext(e.target.value)}
              placeholder="குறைந்தது 8 எழுத்துகள்"
              required
              className={`${inputCls} pr-10`}
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowNext(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600">
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Confirm */}
        <div>
          <label className="block text-xs font-bold text-orange-700 mb-1.5">புதிய கடவுச்சொல் உறுதிப்படுத்தல்</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="மீண்டும் உள்ளிடவும்"
            required
            className={inputCls}
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md shadow-purple-200 disabled:opacity-50 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            {saving ? "மாற்றுகிறது..." : "கடவுச்சொல் மாற்று"}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> மாற்றப்பட்டது!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

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
            {/* ── Generic sections ── */}
            {SECTIONS.map(({ icon: Icon, title, subtitle, color, fields }) => (
              <div key={title} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-orange-50">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-900 leading-tight">{title}</p>
                    <p className="text-[10px] text-orange-400">{subtitle}</p>
                  </div>
                </div>
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

            {/* ── QR Code & GPay — special section ── */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-orange-50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-900 leading-tight">QR Code & GPay</p>
                  <p className="text-[10px] text-orange-400">Payment QR · Google Pay</p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Live QR preview from UPI ID */}
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-2">
                    QR Code — UPI ID-லிருந்து தானாக உருவாகும்
                  </label>

                  {settings.bank_upi_id ? (
                    <div className="flex items-start gap-5">
                      {/* Generated QR */}
                      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-3 shadow-sm shrink-0">
                        <QRCodeSVG
                          value={buildUpiQrValue(settings.bank_upi_id, settings.bank_name)}
                          size={160}
                          bgColor="#ffffff"
                          fgColor="#1a1a1a"
                          level="M"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                          <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            இந்த QR Code <strong>UPI ID-லிருந்து தானாக உருவாகிறது</strong> — 
                            தனியாக படம் பதிவேற்ற தேவையில்லை. 
                            UPI ID மாற்றினால் QR தானாக புதுப்பிக்கப்படும்.
                          </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-wider mb-0.5">UPI ID</p>
                          <p className="text-sm font-bold text-orange-900 font-mono">{settings.bank_upi_id}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          ✅ எந்த UPI App-லும் Scan செய்யலாம் · தொகை கட்டுப்பாடு இல்லை
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-800">
                        மேலே <strong>வங்கி விவரங்கள்</strong> பிரிவில் UPI ID சேர்த்து சேமிக்கவும் — QR தானாக தோன்றும்.
                      </p>
                    </div>
                  )}
                </div>

                {/* GPay / PhonePe number */}
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-1.5">GPay / PhonePe எண்</label>
                  <input
                    value={settings.gpay_number ?? ""}
                    onChange={e => setSettings({ ...settings, gpay_number: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* ── Change Password ── */}
            <ChangePasswordCard />

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
