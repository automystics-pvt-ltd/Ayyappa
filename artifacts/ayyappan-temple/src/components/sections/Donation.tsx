import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import { Building, CreditCard, HeartHandshake, QrCode, ShieldCheck, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

const amounts = [501, 1001, 5001, 10001];

interface Stats {
  totalRaised: number;
  donorCount: number;
  goal: number;
  progressPercent: number;
}

interface Donor {
  id: number;
  donorName: string;
  amount: string;
  anonymous: boolean;
  reviewedAt: string;
}

interface Settings {
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_upi_id?: string;
  qr_code_url?: string;
}

export function Donation() {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorName: '', mobile: '', transactionId: '', screenshotUrl: '', anonymous: false, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getDonationStats().then((d) => setStats(d as Stats)).catch(() => {});
    api.getApprovedDonors().then((d) => setDonors(d as Donor[])).catch(() => {});
    api.getSettings().then((d) => setSettings(d as Settings)).catch(() => {});
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getAmount = () => {
    if (selectedAmount === 'custom') return Number(customAmount);
    return selectedAmount ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getAmount();
    if (!amount || amount <= 0) { alert('தொகை தேர்ந்தெடுக்கவும்'); return; }
    if (!form.donorName || !form.mobile || !form.transactionId) {
      alert('அனைத்து தேவையான தகவல்களையும் நிரப்பவும்');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitDonation({ ...form, amount });
      setSubmitted(true);
      setShowForm(false);
    } catch (e: any) {
      alert(e.message || 'சமர்ப்பிக்க முடியவில்லை');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="donate" className="py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <HeartHandshake className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">நிதி பங்களிப்பு</h2>
          <div className="bg-secondary/20 border border-secondary/40 rounded-full px-6 py-3 inline-block">
            <p className="text-lg md:text-xl text-foreground font-serif italic font-medium">
              "கோவில் கட்டும் பாக்கியம் எல்லோருக்கும் கிடைப்பதில்லை."
            </p>
          </div>
        </motion.div>

        {/* Crowdfunding Progress */}
        {stats && (
          <motion.div
            className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary">{fmt(stats.totalRaised)}</div>
                <div className="text-xs text-muted-foreground mt-1">திரட்டப்பட்டது</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{fmt(stats.goal)}</div>
                <div className="text-xs text-muted-foreground mt-1">நமது இலக்கு</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.donorCount}</div>
                <div className="text-xs text-muted-foreground mt-1">நன்கொடையாளர்கள்</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.progressPercent}% நிறைவு</span>
              <span>{fmt(stats.goal - stats.totalRaised)} இன்னும் தேவை</span>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Amount Selection + Submit */}
          <motion.div
            className="lg:col-span-7 space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">தங்கள் நன்கொடையை தேர்ந்தெடுக்கவும்</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-4 rounded-xl border-2 text-lg font-bold transition-all ${
                      selectedAmount === amt
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/50 text-foreground bg-background'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl font-bold text-muted-foreground">₹</span>
                </div>
                <input
                  type="number"
                  placeholder="பிற தொகை (Custom Amount)"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount('custom'); }}
                  onFocus={() => setSelectedAmount('custom')}
                  className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 text-lg font-bold outline-none transition-all ${
                    selectedAmount === 'custom'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border focus:border-primary/50 text-foreground bg-background'
                  }`}
                />
              </div>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <h4 className="font-bold text-green-800 mb-1">நன்றி! நன்கொடை சமர்ப்பிக்கப்பட்டது.</h4>
                  <p className="text-green-700 text-sm">நிர்வாகி சரிபார்த்த பிறகு உங்கள் பெயர் நன்கொடையாளர் பட்டியலில் சேர்க்கப்படும்.</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  disabled={!getAmount()}
                  className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  நன்கொடை வழங்க
                </button>
              )}

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 font-medium text-sm">
                  தாங்கள் வழங்கும் ஒவ்வொரு ரூபாயும் ஆலய திருப்பணிக்காக மட்டுமே பயன்படுத்தப்படும்.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Payment Details */}
          <motion.div
            className="lg:col-span-5 space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Bank Details */}
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Building className="w-24 h-24" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                வங்கி விவரங்கள்
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'வங்கி பெயர்', val: settings.bank_name || 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'கணக்கு பெயர்', val: settings.bank_account_name || 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'கணக்கு எண்', val: settings.bank_account_number || 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'IFSC', val: settings.bank_ifsc || 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                  { label: 'UPI ID', val: settings.bank_upi_id || 'விவரங்கள் பின்னர் சேர்க்கப்படும்' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="text-foreground font-bold text-sm">{item.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 shadow-md text-center">
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                UPI Payment
              </h4>
              {settings.qr_code_url ? (
                <img src={settings.qr_code_url} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl object-contain border border-border" />
              ) : (
                <div className="bg-muted w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-4 border border-border">
                  <QrCode className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
              <p className="text-muted-foreground font-medium mt-3 text-sm">QR Code Scan செய்து எளிதாக நன்கொடை வழங்கலாம்</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Approved Donors List */}
        {donors.length > 0 && (
          <motion.div
            className="mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-primary mb-3">
                <Users className="w-6 h-6" />
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground">இதுவரை நன்கொடை வழங்கியோர்</h3>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((d) => (
                <div key={d.id} className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">🙏</span>
                  <div>
                    <div className="font-bold text-foreground">
                      {d.anonymous ? 'அடையாளம் தெரியாதவர்' : d.donorName}
                    </div>
                    <div className="text-primary font-bold text-sm">₹{Number(d.amount).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Donation Submission Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-foreground">நன்கொடை விவரங்கள்</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-2xl">✕</button>
              </div>

              <div className="bg-primary/10 rounded-xl p-3 mb-5 text-center">
                <div className="text-3xl font-bold text-primary">₹{getAmount().toLocaleString('en-IN')}</div>
                <div className="text-sm text-muted-foreground">நன்கொடை தொகை</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">உங்கள் பெயர் *</label>
                  <input value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="திரு. / திருமதி." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">மொபைல் எண் *</label>
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="9XXXXXXXXX" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">UPI / Transaction ID *</label>
                  <input value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Transaction ID" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Screenshot URL (விருப்பம்)</label>
                  <input value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">செய்தி (விருப்பம்)</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
                    placeholder="ஸ்வாமியே சரணம் ஐயப்பா..." />
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
                    className="w-4 h-4 accent-primary" />
                  அடையாளம் வெளியிட விரும்பவில்லை (Anonymous)
                </label>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  QR Code மூலம் பணம் செலுத்திய பின் Transaction ID சமர்ப்பிக்கவும். நிர்வாகி சரிபார்த்த பிறகு உங்கள் பெயர் பட்டியலில் சேர்க்கப்படும்.
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'சமர்ப்பிக்கிறது...' : 'சமர்ப்பி'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
