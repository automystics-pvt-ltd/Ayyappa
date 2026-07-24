import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

const SETTINGS_FIELDS = [
  { key: "bank_name", label: "வங்கி பெயர்", placeholder: "State Bank of India" },
  { key: "bank_account_name", label: "கணக்கு பெயர்", placeholder: "கோவில் பெயர்" },
  { key: "bank_account_number", label: "கணக்கு எண்", placeholder: "XXXXXXXXXXXX" },
  { key: "bank_ifsc", label: "IFSC குறியீடு", placeholder: "SBIN0001234" },
  { key: "bank_upi_id", label: "UPI ID", placeholder: "temple@upi" },
  { key: "qr_code_url", label: "QR Code படம் URL", placeholder: "https://..." },
  { key: "donation_goal", label: "நன்கொடை இலக்கு (₹)", placeholder: "5000000" },
  { key: "temple_timings", label: "கோவில் நேரங்கள்", placeholder: "காலை 6:00 - 12:00 | மாலை 4:00 - 8:00" },
  { key: "temple_address", label: "கோவில் முகவரி", placeholder: "வடமதுரை, திண்டுக்கல்..." },
];

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => setSettings(data as Record<string, string>))
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">அமைப்புகள் & உள்ளடக்கம்</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">ஏற்றுகிறது...</div>
        ) : (
          <div className="bg-white rounded-xl border p-6 space-y-5">
            {SETTINGS_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  value={settings[f.key] ?? ""}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ))}

            <div className="flex items-center gap-4 pt-2">
              <button onClick={save} disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50">
                {saving ? "சேமிக்கிறது..." : "சேமி"}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium">✅ சேமிக்கப்பட்டது!</span>}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
