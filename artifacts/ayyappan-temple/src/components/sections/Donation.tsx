import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import {
  Building, HeartHandshake, QrCode, ShieldCheck,
  CheckCircle2, Users, Upload, X, Image as ImageIcon,
  AlertCircle, MapPin
} from 'lucide-react';
import { api, uploadScreenshot } from '@/lib/api';

const AMOUNTS = [501, 1001, 5001, 10001];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/* ─── Validation helpers ─── */
type FormErrors = Partial<Record<
  'donorName' | 'mobile' | 'place' | 'amount' | 'transactionId' | 'screenshot',
  string
>>;

function validate(
  form: { donorName: string; mobile: string; place: string; transactionId: string; message: string; anonymous: boolean },
  amount: number,
  screenshotFile: File | null,
  screenshotRequired: boolean,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.donorName.trim())
    errors.donorName = 'பெயர் தேவை';
  else if (form.donorName.trim().length < 2)
    errors.donorName = 'குறைந்தது 2 எழுத்துக்கள் தேவை';

  if (!form.mobile.trim())
    errors.mobile = 'மொபைல் எண் தேவை';
  else if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
    errors.mobile = 'சரியான 10 இல்ல மொபைல் எண் உள்ளிடவும்';

  if (!form.place.trim())
    errors.place = 'ஊர் / இடம் தேவை';

  if (!amount || amount < 1)
    errors.amount = 'நன்கொடை தொகை தேர்ந்தெடுக்கவும்';
  else if (amount < 10)
    errors.amount = 'குறைந்தது ₹10 தேவை';

  if (!form.transactionId.trim())
    errors.transactionId = 'Transaction ID தேவை';
  else if (form.transactionId.trim().length < 6)
    errors.transactionId = 'சரியான Transaction ID உள்ளிடவும்';

  if (screenshotFile) {
    if (!ALLOWED_TYPES.includes(screenshotFile.type))
      errors.screenshot = 'JPEG, PNG, WebP அல்லது GIF படம் மட்டும் ஏற்றுக்கொள்ளப்படும்';
    else if (screenshotFile.size > MAX_FILE_SIZE)
      errors.screenshot = 'படத்தின் அளவு 10 MB-க்கு கீழ் இருக்க வேண்டும்';
  }

  return errors;
}

/* ─── Types ─── */
interface Stats { totalRaised: number; donorCount: number; goal: number; progressPercent: number }
interface Donor { id: number; donorName: string; place?: string; amount: string; anonymous: boolean; reviewedAt: string }
interface Settings { bank_name?: string; bank_account_name?: string; bank_account_number?: string; bank_ifsc?: string; bank_upi_id?: string; qr_code_url?: string }

/* ─── Field component ─── */
function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full border rounded-xl px-3 py-2.5 bg-background text-foreground text-sm focus:outline-none transition-colors ${
    err ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-border focus:ring-2 focus:ring-primary/50'
  }`;

/* ─── Screenshot uploader ─── */
function ScreenshotUploader({
  file, onFileChange, error,
}: { file: File | null; onFileChange: (f: File | null) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="Screenshot preview" className="w-full max-h-48 object-contain bg-muted" />
          <button
            type="button"
            onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute top-2 right-2 bg-background/90 rounded-full p-1 hover:bg-red-50"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{file?.name}</div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-colors ${
            error ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-sm text-center">
            <span className="text-primary font-medium">படம் தேர்ந்தெடுக்க</span>
            <span className="text-muted-foreground"> அல்லது இங்கே இழுக்கவும்</span>
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF · அதிகபட்சம் 10 MB</p>
        </button>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export function Donation() {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    donorName: '', mobile: '', place: '', transactionId: '', message: '', anonymous: false,
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getDonationStats().then((d) => setStats(d as Stats)).catch(() => {});
    api.getApprovedDonors().then((d) => setDonors(d as Donor[])).catch(() => {});
    api.getSettings().then((d) => setSettings(d as Settings)).catch(() => {});
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getAmount = () => (selectedAmount === 'custom' ? Number(customAmount) : selectedAmount ?? 0);

  /* Touch a field for live validation */
  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  /* Revalidate live whenever form/amount/file changes */
  useEffect(() => {
    if (touched.size > 0) {
      setErrors(validate(form, getAmount(), screenshotFile, false));
    }
  }, [form, selectedAmount, customAmount, screenshotFile, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getAmount();

    // Full validation on submit
    const allErrors = validate(form, amount, screenshotFile, false);
    setErrors(allErrors);
    setTouched(new Set(['donorName', 'mobile', 'place', 'amount', 'transactionId']));

    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    let screenshotUrl: string | undefined;

    try {
      // Upload screenshot if provided
      if (screenshotFile) {
        setUploadProgress('uploading');
        screenshotUrl = await uploadScreenshot(screenshotFile);
        setUploadProgress('done');
      }

      await api.submitDonation({ ...form, amount, screenshotUrl });
      setSubmitted(true);
      setShowForm(false);
    } catch (err: any) {
      setErrors({ transactionId: err.message || 'சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('idle');
    }
  };

  const openForm = () => {
    if (!getAmount()) {
      setErrors({ amount: 'நன்கொடை தொகை தேர்ந்தெடுக்கவும்' });
      setTouched(new Set(['amount']));
      return;
    }
    setErrors({});
    setTouched(new Set());
    setShowForm(true);
  };

  return (
    <section id="donate" className="py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">

        {/* Header */}
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-100px' }} variants={fadeUpVariant}>
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
          <motion.div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg mb-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              {[
                { value: fmt(stats.totalRaised), label: 'திரட்டப்பட்டது' },
                { value: fmt(stats.goal), label: 'நமது இலக்கு' },
                { value: `${stats.donorCount}`, label: 'நன்கொடையாளர்கள்' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl md:text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-4 mb-2">
              <div className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000"
                style={{ width: `${stats.progressPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.progressPercent}% நிறைவு</span>
              <span>{fmt(Math.max(0, stats.goal - stats.totalRaised))} இன்னும் தேவை</span>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Amount Selection */}
          <motion.div className="lg:col-span-7 space-y-8" initial="hidden" whileInView="visible"
            viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeUpVariant} className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">தங்கள் நன்கொடையை தேர்ந்தெடுக்கவும்</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {AMOUNTS.map((amt) => (
                  <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(''); touch('amount'); }}
                    className={`py-4 rounded-xl border-2 text-lg font-bold transition-all ${
                      selectedAmount === amt
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/50 text-foreground bg-background'
                    }`}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative mb-2">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xl font-bold text-muted-foreground pointer-events-none">₹</span>
                <input
                  type="number"
                  placeholder="பிற தொகை (Custom Amount)"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount('custom'); touch('amount'); }}
                  onFocus={() => { setSelectedAmount('custom'); touch('amount'); }}
                  className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 text-lg font-bold outline-none transition-all ${
                    selectedAmount === 'custom'
                      ? errors.amount ? 'border-red-400' : 'border-primary bg-primary/5 text-foreground'
                      : 'border-border focus:border-primary/50 text-foreground bg-background'
                  }`}
                />
              </div>
              {errors.amount && touched.has('amount') && (
                <p className="flex items-center gap-1 text-xs text-red-500 mb-4">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.amount}
                </p>
              )}

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mt-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <h4 className="font-bold text-green-800 mb-1">நன்றி! நன்கொடை சமர்ப்பிக்கப்பட்டது.</h4>
                  <p className="text-green-700 text-sm">நிர்வாகி சரிபார்த்த பிறகு உங்கள் பெயர் பட்டியலில் சேர்க்கப்படும்.</p>
                </div>
              ) : (
                <button onClick={openForm}
                  className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-lg hover:bg-primary/90 transition-colors mt-4">
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
          <motion.div className="lg:col-span-5 space-y-6" initial="hidden" whileInView="visible"
            viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeUpVariant}
              className="bg-card border border-card-border rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Building className="w-24 h-24" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                வங்கி விவரங்கள்
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'வங்கி பெயர்', val: settings.bank_name },
                  { label: 'கணக்கு பெயர்', val: settings.bank_account_name },
                  { label: 'கணக்கு எண்', val: settings.bank_account_number },
                  { label: 'IFSC', val: settings.bank_ifsc },
                  { label: 'UPI ID', val: settings.bank_upi_id },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="text-foreground font-bold text-sm">
                      {item.val || <span className="italic text-muted-foreground">விவரங்கள் பின்னர் சேர்க்கப்படும்</span>}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUpVariant}
              className="bg-card border border-card-border rounded-2xl p-6 shadow-md text-center">
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                UPI Payment
              </h4>
              {settings.qr_code_url ? (
                <img src={settings.qr_code_url} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl object-contain border border-border" />
              ) : (
                <div className="bg-muted w-48 h-48 mx-auto rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
              <p className="text-muted-foreground font-medium mt-3 text-sm">QR Code Scan செய்து எளிதாக நன்கொடை வழங்கலாம்</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Approved Donors */}
        {donors.length > 0 && (
          <motion.div className="mt-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-3">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground">இதுவரை நன்கொடை வழங்கியோர்</h3>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((d) => (
                <div key={d.id} className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">🙏</span>
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">
                      {d.anonymous ? 'அடையாளம் தெரியாதவர்' : d.donorName}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-bold text-sm">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                      {d.place && !d.anonymous && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />{d.place}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Donation Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">நன்கொடை விவரங்கள்</h3>
                <button onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount pill */}
              <div className="bg-primary/10 rounded-xl p-3 mb-5 text-center">
                <div className="text-3xl font-bold text-primary">₹{getAmount().toLocaleString('en-IN')}</div>
                <div className="text-sm text-muted-foreground">நன்கொடை தொகை</div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Name */}
                <Field label="உங்கள் பெயர்" required error={touched.has('donorName') ? errors.donorName : undefined}>
                  <input value={form.donorName}
                    onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                    onBlur={() => touch('donorName')}
                    className={inputCls(touched.has('donorName') ? errors.donorName : undefined)}
                    placeholder="திரு. / திருமதி." />
                </Field>

                {/* Mobile */}
                <Field label="மொபைல் எண்" required error={touched.has('mobile') ? errors.mobile : undefined}>
                  <input type="tel" value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    onBlur={() => touch('mobile')}
                    className={inputCls(touched.has('mobile') ? errors.mobile : undefined)}
                    placeholder="9XXXXXXXXX" maxLength={10} />
                </Field>

                {/* Place */}
                <Field label="ஊர் / இடம்" required error={touched.has('place') ? errors.place : undefined}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={form.place}
                      onChange={(e) => setForm({ ...form, place: e.target.value })}
                      onBlur={() => touch('place')}
                      className={`${inputCls(touched.has('place') ? errors.place : undefined)} pl-9`}
                      placeholder="வடமதுரை, திண்டுக்கல்..." />
                  </div>
                </Field>

                {/* Transaction ID */}
                <Field label="UPI / Transaction ID" required error={touched.has('transactionId') ? errors.transactionId : undefined}>
                  <input value={form.transactionId}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    onBlur={() => touch('transactionId')}
                    className={inputCls(touched.has('transactionId') ? errors.transactionId : undefined)}
                    placeholder="Transaction ID" />
                </Field>

                {/* Screenshot upload */}
                <Field label="Payment Screenshot" error={errors.screenshot}>
                  <ScreenshotUploader file={screenshotFile} onFileChange={setScreenshotFile} error={errors.screenshot} />
                  {uploadProgress === 'uploading' && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Upload className="w-3 h-3 animate-bounce" /> படம் பதிவேற்றுகிறது...
                    </p>
                  )}
                </Field>

                {/* Message */}
                <Field label="செய்தி">
                  <textarea value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputCls()} resize-none h-20`}
                    placeholder="ஸ்வாமியே சரணம் ஐயப்பா..." />
                </Field>

                {/* Anonymous */}
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={form.anonymous}
                    onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded" />
                  அடையாளம் வெளியிட விரும்பவில்லை (Anonymous)
                </label>

                {/* Info note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  QR Code மூலம் பணம் செலுத்திய பின் Transaction ID மற்றும் Screenshot சமர்ப்பிக்கவும். நிர்வாகி சரிபார்த்த பிறகே உங்கள் பெயர் பட்டியலில் சேர்க்கப்படும்.
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploadProgress === 'uploading' ? 'படம் பதிவேற்றுகிறது...' : 'சமர்ப்பிக்கிறது...'}
                    </>
                  ) : 'சமர்ப்பி'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
