import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainer } from '@/lib/animations';
import {
  Building, HeartHandshake, QrCode, ShieldCheck,
  CheckCircle2, Users, Upload, X, Image as ImageIcon,
  AlertCircle, MapPin, RefreshCw, ScanLine, IndianRupee,
  ClipboardCheck, SendHorizonal, Phone, Megaphone, Clock,
  Copy, Check,
} from 'lucide-react';
import { api, uploadScreenshot } from '@/lib/api';
import { DonorWall, type Donor, type InKindContribution } from '@/components/sections/DonorWall';

const AMOUNTS = [501, 1001, 5001, 10001];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const RECEIPT_TIMEOUT = 30; // seconds

/* ─── Types ─── */
interface Stats   { totalRaised: number; donorCount: number; goal: number; progressPercent: number }
interface Settings {
  bank_name?: string; bank_branch?: string; bank_account_name?: string;
  bank_account_number?: string; bank_ifsc?: string; bank_account_type?: string;
  bank_help_phone?: string; bank_upi_id?: string; qr_code_url?: string; gpay_number?: string;
  support_phone?: string; temple_phone?: string;
}

/** Build a UPI payment deep-link QR value from a UPI ID */
function buildUpiQrValue(upiId: string, name = 'Sri Ayyappan Temple') {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;
}

interface ReceiptData {
  id: number;
  receiptToken?: string;
  donorName: string;
  place: string;
  amount: number;
  transactionId: string;
  anonymous: boolean;
  submittedAt: string;
}

type FormErrors = Partial<Record<
  'donorName' | 'mobile' | 'place' | 'amount' | 'transactionId' | 'screenshot',
  string
>>;

/* ─── Validation ─── */
function validate(
  form: { donorName: string; mobile: string; place: string; transactionId: string },
  amount: number,
  screenshotFile: File | null,
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

  if (!amount || isNaN(amount) || amount <= 0)
    errors.amount = 'நன்கொடை தொகை தேர்ந்தெடுக்கவும்';
  else if (amount < 10)
    errors.amount = 'குறைந்தது ₹10 தேவை';
  else if (amount > 10_000_000)
    errors.amount = 'தொகை அதிகமாக உள்ளது';

  if (!form.transactionId.trim())
    errors.transactionId = 'Transaction ID தேவை';
  else if (form.transactionId.trim().length < 6)
    errors.transactionId = 'சரியான Transaction ID உள்ளிடவும்';

  if (screenshotFile) {
    if (!ALLOWED_TYPES.includes(screenshotFile.type))
      errors.screenshot = 'JPEG, PNG, WebP அல்லது GIF படம் மட்டும் ஏற்றுக்கொள்ளப்படும்';
    else if (screenshotFile.size > MAX_FILE_SIZE)
      errors.screenshot = 'படத்தின் அளவு 5 MB-க்கு கீழ் இருக்க வேண்டும்';
  }

  return errors;
}

/* ─── Field wrapper ─── */
function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full border rounded-xl px-3 py-2.5 bg-background text-foreground text-sm focus:outline-none transition-colors ${
    err ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-border focus:ring-2 focus:ring-primary/50'
  }`;

/* ─── Copyable bank detail row ─── */
function CopyRow({ label, val }: { label: string; val?: string }) {
  const [copied, setCopied] = useState(false);
  if (!val) return null;
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(val); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = val; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-foreground text-sm tracking-wide">{val}</span>
        <button type="button" onClick={handleCopy}
          className={`shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
            copied ? 'border-green-400 bg-green-50 text-green-700' : 'border-border bg-background text-muted-foreground hover:bg-muted'
          }`}>
          {copied ? <><Check className="w-3 h-3" />நகலெடுத்தது!</> : <><Copy className="w-3 h-3" />நகல்</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Screenshot uploader ─── */
function ScreenshotUploader({ file, onFileChange, error }: { file: File | null; onFileChange: (f: File | null) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="Screenshot preview" className="w-full max-h-48 object-contain bg-muted" />
          <button type="button"
            onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute top-2 right-2 bg-background/90 rounded-full p-1 hover:bg-red-50">
            <X className="w-4 h-4 text-red-500" />
          </button>
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{file?.name}</div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-colors ${
            error ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/50 hover:bg-primary/5'
          }`}>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-sm text-center">
            <span className="text-primary font-medium">படம் தேர்ந்தெடுக்க</span>
            <span className="text-muted-foreground"> அல்லது இங்கே இழுக்கவும்</span>
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF · அதிகபட்சம் 5 MB</p>
        </button>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

/* ─── Submission Receipt Modal ─── */
const RING_R = 44;
const RING_CIRC = 2 * Math.PI * RING_R;

function SubmissionReceipt({ receipt, onDone }: { receipt: ReceiptData; onDone: () => void }) {
  const [remaining, setRemaining] = useState(RECEIPT_TIMEOUT);
  const [copied, setCopied]       = useState(false);

  const receiptUrl = receipt.receiptToken
    ? `${window.location.origin}${import.meta.env.BASE_URL}receipt/${receipt.receiptToken}`
    : null;

  const handleCopy = async () => {
    if (!receiptUrl) return;
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement('textarea');
      ta.value = receiptUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const strokeDash = RING_CIRC * (1 - remaining / RECEIPT_TIMEOUT);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Green header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-white text-center relative">
          <button onClick={onDone}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">நன்கொடை சமர்ப்பிக்கப்பட்டது!</h3>
          <p className="text-green-100 text-sm">ஸ்வாமியே சரணம் ஐயப்பா 🙏</p>
        </div>

        {/* Receipt body */}
        <div className="px-6 py-5 space-y-3">
          {/* Reference number */}
          <div className="bg-muted rounded-xl px-4 py-3 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Reference Number</div>
            <div className="font-mono font-bold text-foreground tracking-widest">
              DON-{String(receipt.id).padStart(6, '0')}
            </div>
          </div>

          {/* Details grid */}
          <div className="divide-y divide-border/60">
            {[
              { label: 'நன்கொடையாளர்',  val: receipt.anonymous ? 'அடையாளம் தெரியாதவர்' : receipt.donorName },
              { label: 'ஊர் / இடம்',     val: receipt.anonymous ? '—' : receipt.place },
              { label: 'தொகை',           val: fmt(receipt.amount) },
              { label: 'Transaction ID', val: receipt.transactionId },
              { label: 'சமர்ப்பிக்கப்பட்ட நேரம்', val: new Date(receipt.submittedAt).toLocaleString('ta-IN') },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground text-right max-w-[55%] break-all">{row.val}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-center">
            நிர்வாகி சரிபார்த்த பிறகே உங்கள் பெயர் நன்கொடையாளர் பட்டியலில் சேர்க்கப்படும்.
            {receipt.receiptToken && (
              <div className="mt-1.5 text-amber-700">
                அங்கீகாரத்திற்கு பிறகு{" "}
                <a
                  href={receiptUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-900"
                >
                  இந்த இணைப்பில்
                </a>{" "}
                ரசீது பதிவிறக்கம் செய்யலாம்.
              </div>
            )}
          </div>

          {/* Copy receipt link button */}
          {receiptUrl && (
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                copied
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  இணைப்பு நகலெடுக்கப்பட்டது!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  ரசீது இணைப்பை நகலெடு
                </>
              )}
            </button>
          )}

          {/* Countdown + buttons */}
          <div className="flex items-center justify-between pt-1 gap-3">
            {/* Countdown ring */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={RING_R} fill="none" stroke="currentColor"
                    strokeWidth="8" className="text-muted/40" />
                  <circle cx="50" cy="50" r={RING_R} fill="none" stroke="currentColor"
                    strokeWidth="8" className="text-primary transition-all duration-1000"
                    strokeDasharray={RING_CIRC}
                    strokeDashoffset={strokeDash}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {remaining}
                </span>
              </div>
              <span className="text-xs leading-tight">நொடிகளில்<br />மூடும்</span>
            </div>

            <div className="flex gap-2 flex-1 justify-end">
              <button onClick={onDone}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
                <RefreshCw className="w-4 h-4" />
                மீண்டும் வழங்க
              </button>
              <button onClick={onDone}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                மூடு
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Steps guide ─── */
const STEPS = [
  {
    num: 1,
    icon: ScanLine,
    title: 'QR Scan / UPI',
    desc: 'கீழே உள்ள QR Code-ஐ Scan செய்யவும் அல்லது UPI ID-க்கு நேரடியாக பணம் அனுப்பவும்.',
    tip: 'PhonePe · GPay · Paytm · BHIM',
  },
  {
    num: 2,
    icon: IndianRupee,
    title: 'தொகை தேர்வு',
    desc: 'கீழே உள்ள preset தொகைகளில் ஒன்றை click செய்யவும் அல்லது உங்கள் விருப்பப்படி custom தொகை உள்ளிடவும்.',
    tip: '₹501 · ₹1,001 · ₹5,001 · ₹10,001',
  },
  {
    num: 3,
    icon: ClipboardCheck,
    title: 'Transaction ID',
    desc: 'Payment முடிந்த உடனே கிடைக்கும் Transaction / UTR Reference ID-ஐ கவனமாக குறித்துக்கொள்ளவும்.',
    tip: 'உ.ம்: 425678901234',
  },
  {
    num: 4,
    icon: SendHorizonal,
    title: 'சமர்ப்பிக்கவும்',
    desc: '"நன்கொடை வழங்க" பொத்தானை அழுத்தி உங்கள் பெயர், ஊர், Transaction ID மற்றும் Screenshot upload செய்து சமர்ப்பிக்கவும்.',
    tip: 'நிர்வாகி சரிபார்த்த பின் பட்டியலில் சேர்க்கப்படும்',
  },
];

function HowToSteps() {
  return (
    <div className="mb-10">
      <h3 className="text-center text-lg font-bold text-foreground mb-6 flex items-center justify-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">?</span>
        எப்படி நன்கொடை வழங்குவது?
      </h3>

      {/* Desktop: horizontal row */}
      <div className="hidden md:flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="flex-1 flex flex-col items-center text-center relative">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 z-0" />
              )}
              {/* Circle */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-3 flex-shrink-0">
                <Icon className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                  {step.num}
                </span>
              </div>
              <div className="px-3">
                <p className="font-bold text-foreground text-sm mb-1">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{step.desc}</p>
                <span className="inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {step.tip}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical timeline */}
      <div className="md:hidden space-y-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="flex gap-4 relative">
              {/* Vertical line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md relative z-10">
                  <Icon className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center border border-background">
                    {step.num}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[2rem] bg-gradient-to-b from-primary/50 to-primary/10 my-1" />
                )}
              </div>
              {/* Content */}
              <div className={`pb-5 ${idx === STEPS.length - 1 ? '' : ''}`}>
                <p className="font-bold text-foreground text-sm mb-0.5">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1">{step.desc}</p>
                <span className="inline-block text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {step.tip}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Blank form state ─── */
const BLANK_FORM = { donorName: '', mobile: '', place: '', transactionId: '', message: '', anonymous: false };

/* ─── Main component ─── */
export function Donation() {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null);
  const [customAmount, setCustomAmount]     = useState('');
  const [stats, setStats]                   = useState<Stats | null>(null);
  const [donors, setDonors]                 = useState<Donor[]>([]);
  const [contributions, setContributions]   = useState<InKindContribution[]>([]);
  const [settings, setSettings]             = useState<Settings>({});
  const [showForm, setShowForm]             = useState(false);
  const [receipt, setReceipt]               = useState<ReceiptData | null>(null);

  const [form, setForm]                     = useState(BLANK_FORM);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [touched, setTouched]               = useState<Set<string>>(new Set());
  const [submitting, setSubmitting]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');

  useEffect(() => {
    api.getDonationStats().then((d) => setStats(d as Stats)).catch(() => {});
    api.getApprovedDonors().then((d) => setDonors(d as Donor[])).catch(() => {});
    api.getSettings().then((d) => setSettings(d as Settings)).catch(() => {});
    api.getContributions().then((d) => setContributions(d as InKindContribution[])).catch(() => {});
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getAmount = () => (selectedAmount === 'custom' ? Number(customAmount) : selectedAmount ?? 0);

  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  /* Live revalidation */
  useEffect(() => {
    if (touched.size > 0)
      setErrors(validate(form, getAmount(), screenshotFile));
  }, [form, selectedAmount, customAmount, screenshotFile, touched]);

  /* Full reset — called after receipt is dismissed */
  const resetAll = useCallback(() => {
    setReceipt(null);
    setShowForm(false);
    setSelectedAmount(null);
    setCustomAmount('');
    setForm(BLANK_FORM);
    setScreenshotFile(null);
    setErrors({});
    setTouched(new Set());
    setUploadProgress('idle');
  }, []);

  /* Screenshot change — validate immediately on selection, reject invalid files */
  const handleScreenshotChange = (file: File | null) => {
    if (file === null) {
      setScreenshotFile(null);
      setErrors((prev) => { const next = { ...prev }; delete next.screenshot; return next; });
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, screenshot: 'JPEG, PNG, WebP அல்லது GIF படம் மட்டும் ஏற்றுக்கொள்ளப்படும்' }));
      setTouched((prev) => new Set(prev).add('screenshot'));
      return; // reject — do not store the file
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, screenshot: 'படத்தின் அளவு 5 MB-க்கு கீழ் இருக்க வேண்டும்' }));
      setTouched((prev) => new Set(prev).add('screenshot'));
      return; // reject — do not store the file
    }
    setScreenshotFile(file);
    setErrors((prev) => { const next = { ...prev }; delete next.screenshot; return next; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getAmount();

    const allErrors = validate(form, amount, screenshotFile);
    setErrors(allErrors);
    setTouched(new Set(['donorName', 'mobile', 'place', 'amount', 'transactionId']));
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    let screenshotUrl: string | undefined;

    try {
      if (screenshotFile) {
        setUploadProgress('uploading');
        screenshotUrl = await uploadScreenshot(screenshotFile);
        setUploadProgress('done');
      }

      const result = await api.submitDonation({ ...form, amount, screenshotUrl }) as any;

      setShowForm(false);
      setReceipt({
        id:            result.id,
        receiptToken:  result.receiptToken,
        donorName:     form.donorName,
        place:         form.place,
        amount,
        transactionId: form.transactionId,
        anonymous:     form.anonymous,
        submittedAt:   result.createdAt ?? new Date().toISOString(),
      });
    } catch (err: any) {
      setErrors({ transactionId: err.message || 'சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('idle');
    }
  };

  const openForm = () => {
    const amount = getAmount();
    if (!amount || amount <= 0) {
      setErrors({ amount: 'நன்கொடை தொகை தேர்ந்தெடுக்கவும்' });
      setTouched(new Set(['amount']));
      return;
    }
    if (amount < 10) {
      setErrors({ amount: 'குறைந்தது ₹10 தேவை' });
      setTouched(new Set(['amount']));
      return;
    }
    setErrors({});
    setTouched(new Set());
    setShowForm(true);
  };

  /* Custom amount — strip negatives and non-digits inline */
  const handleCustomAmountChange = (raw: string) => {
    // Remove minus signs and anything that makes it negative
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '');
    setCustomAmount(cleaned);
    setSelectedAmount('custom');
    touch('amount');
  };

  return (
    <section id="donate" className="py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">

        {/* Header */}
        <motion.div className="text-center mb-10" initial="hidden" whileInView="visible"
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

        {/* Step-by-step guide */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}
          className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-md mb-8">
          <HowToSteps />
        </motion.div>

        {/* ── Prominent QR Hero ── */}
        <motion.div className="flex justify-center mb-10" initial="hidden" whileInView="visible"
          viewport={{ once: true }} variants={fadeUpVariant}>
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 md:p-8 shadow-xl text-center max-w-sm w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <QrCode className="w-3.5 h-3.5" />
              Scan &amp; Pay — இப்போதே நன்கொடை வழங்கலாம்
            </div>

            {/* QR Code — generated from UPI ID, fallback to uploaded image */}
            <div className="flex justify-center mb-4">
              {settings.bank_upi_id ? (
                <div className="relative">
                  <div className="rounded-2xl border-4 border-primary/20 bg-white p-3 shadow-md">
                    <QRCodeSVG
                      value={buildUpiQrValue(settings.bank_upi_id, settings.bank_name)}
                      size={216}
                      bgColor="#ffffff"
                      fgColor="#1a1a1a"
                      level="M"
                    />
                  </div>
                  {/* Corner marks for visual scan-friendliness */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              ) : settings.qr_code_url ? (
                <div className="relative">
                  <img
                    src={settings.qr_code_url}
                    alt="Payment QR Code"
                    className="w-56 h-56 md:w-64 md:h-64 object-contain rounded-2xl border-4 border-primary/20 bg-white p-2 shadow-md"
                  />
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              ) : (
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl border-4 border-dashed border-primary/30 bg-muted/40 flex flex-col items-center justify-center gap-3">
                  <QrCode className="w-16 h-16 text-primary/30" />
                  <span className="text-xs text-muted-foreground text-center px-4">
                    Admin → அமைப்புகள்-ல் UPI ID சேர்க்கவும்
                  </span>
                </div>
              )}
            </div>

            {/* GPay / PhonePe number */}
            {settings.gpay_number && (
              <div className="bg-muted rounded-xl px-4 py-2.5 mb-3 flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">GPay / PhonePe:</span>
                <span className="font-mono font-bold text-foreground text-sm">{settings.gpay_number}</span>
              </div>
            )}

            {/* UPI ID */}
            {settings.bank_upi_id && (
              <div className="bg-muted rounded-xl px-4 py-2.5 mb-4 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">UPI ID:</span>
                <span className="font-mono font-bold text-foreground text-sm">{settings.bank_upi_id}</span>
              </div>
            )}

            {/* App badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['PhonePe', 'Google Pay', 'Paytm', 'BHIM'].map((app) => (
                <span key={app}
                  className="text-[11px] font-semibold bg-background border border-border text-muted-foreground px-2.5 py-1 rounded-full">
                  {app}
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              📱 மொபைலில் Camera / UPI App திறந்து QR Scan செய்யவும்
            </p>
          </div>
        </motion.div>

        {/* Crowdfunding Progress */}
        {stats && (
          <motion.div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-lg mb-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 mb-6 text-center">
              {[
                { value: fmt(stats.totalRaised), label: 'திரட்டப்பட்டது' },
                { value: fmt(stats.goal),        label: 'நமது இலக்கு' },
                { value: `${stats.donorCount}`,  label: 'நன்கொடையாளர்கள்' },
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
                  <button key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); touch('amount'); }}
                    className={`py-4 rounded-xl border-2 text-lg font-bold transition-all ${
                      selectedAmount === amt
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/50 text-foreground bg-background'
                    }`}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative mb-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xl font-bold text-muted-foreground pointer-events-none">₹</span>
                <input
                  type="number"
                  min="10"
                  placeholder="பிற தொகை (Custom Amount)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  onFocus={() => { setSelectedAmount('custom'); touch('amount'); }}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  className={`w-full pl-10 pr-4 py-4 rounded-xl border-2 text-lg font-bold outline-none transition-all ${
                    selectedAmount === 'custom'
                      ? errors.amount ? 'border-red-400 bg-red-50/30' : 'border-primary bg-primary/5 text-foreground'
                      : 'border-border focus:border-primary/50 text-foreground bg-background'
                  }`}
                />
              </div>
              {errors.amount && touched.has('amount') && (
                <p className="flex items-center gap-1 text-xs text-red-500 mb-3 mt-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.amount}
                </p>
              )}

              <button onClick={openForm}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-lg hover:bg-primary/90 transition-colors mt-3">
                நன்கொடை வழங்க
              </button>

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
              <h4 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />வங்கி விவரங்கள்
              </h4>
              <p className="text-xs text-muted-foreground mb-4">நேரடி வங்கி பரிமாற்றம் · Bank Transfer</p>
              <div className="space-y-3">
                {/* Non-copyable rows */}
                {([
                  { label: 'வங்கி பெயர்',  val: settings.bank_name         || 'Indian Overseas Bank (IOB)' },
                  { label: 'கிளை',          val: settings.bank_branch        || 'Vadamadurai Branch (2461)' },
                  { label: 'கணக்கு வகை',    val: settings.bank_account_type  || 'Savings Bank (SB)' },
                  { label: 'கணக்கு பெயர்',  val: settings.bank_account_name  || 'Mr. N. Anand' },
                ] as {label:string;val:string}[]).map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 border-b border-border/50 pb-3">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="text-foreground font-bold text-sm">{item.val}</span>
                  </div>
                ))}
                {/* Copyable rows */}
                <CopyRow label="கணக்கு எண்" val={settings.bank_account_number || '246101000019314'} />
                <CopyRow label="IFSC Code"   val={settings.bank_ifsc           || 'IOBA0002461'} />
                {settings.bank_upi_id && (
                  <CopyRow label="UPI ID" val={settings.bank_upi_id} />
                )}
              </div>
              {/* Help number */}
              {(settings.bank_help_phone || settings.support_phone) && (
                <div className="mt-4 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">உதவி எண்</span>
                  <a href={`tel:${settings.bank_help_phone || settings.support_phone}`}
                    className="font-mono font-bold text-foreground text-sm hover:text-primary transition-colors ml-auto">
                    {settings.bank_help_phone || settings.support_phone}
                  </a>
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeUpVariant}
              className="bg-card border border-card-border rounded-2xl p-6 shadow-md text-center">
              <h4 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />UPI Payment
              </h4>
              {settings.bank_upi_id ? (
                <div className="mx-auto inline-block rounded-xl border border-border bg-white p-2">
                  <QRCodeSVG
                    value={buildUpiQrValue(settings.bank_upi_id, settings.bank_name)}
                    size={176}
                    bgColor="#ffffff"
                    fgColor="#1a1a1a"
                    level="M"
                  />
                </div>
              ) : settings.qr_code_url ? (
                <img src={settings.qr_code_url} alt="QR Code"
                  className="w-48 h-48 mx-auto rounded-xl object-contain border border-border" />
              ) : (
                <div className="bg-muted w-48 h-48 mx-auto rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
              <p className="text-muted-foreground font-medium mt-3 text-sm">
                QR Code Scan செய்து எளிதாக நன்கொடை வழங்கலாம்
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Important Announcement Banner ── */}
        <motion.div
          className="mt-14"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUpVariant}
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 shadow-xl shadow-amber-100">
            {/* Saffron gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" />
            {/* Decorative top strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
            {/* Decorative Om watermark */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] leading-none text-amber-200/40 font-serif select-none pointer-events-none hidden md:block">
              ॐ
            </div>

            <div className="relative px-6 py-7 md:px-10 md:py-8">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shrink-0">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">முக்கிய அறிவிப்பு</p>
                  <h3 className="text-base md:text-lg font-bold text-orange-900 leading-tight">
                    நன்கொடை பதிவு தொடர்பான அறிவிப்பு
                  </h3>
                </div>
              </div>

              {/* Body text */}
              <div className="space-y-3 text-sm md:text-[15px] text-orange-900/85 leading-relaxed max-w-3xl">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p>
                    QR Code / UPI மூலம் நன்கொடை வழங்கிய பிறகு, உங்கள் நன்கொடை விவரம் இணையதளத்தில்
                    புதுப்பிக்க <strong className="text-orange-700">சிறிது நேரம் ஆகலாம்.</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p>
                    நன்கொடை பதிவு செய்யப்படாதது, தவறான தகவல் காட்டப்படுவது அல்லது வேறு ஏதேனும் சிக்கல்
                    ஏற்பட்டால், தயவுசெய்து கீழே குறிப்பிடப்பட்டுள்ள எண்ணை தொடர்புகொண்டு உங்கள்
                    விவரங்களை சரிபார்த்து பதிவு செய்து கொள்ளவும்.
                  </p>
                </div>
              </div>

              {/* Helpline number */}
              <div className="mt-5 inline-flex items-center gap-3 bg-white/80 border border-amber-300 rounded-2xl px-5 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">உதவி மைய தொடர்பு எண்</p>
                  {settings.support_phone || settings.temple_phone ? (
                    <a
                      href={`tel:${(settings.support_phone || settings.temple_phone).replace(/\s+/g, '')}`}
                      className="text-lg font-bold text-orange-700 hover:text-orange-500 transition-colors tracking-wide"
                    >
                      {settings.support_phone || settings.temple_phone}
                    </a>
                  ) : (
                    <span className="text-sm text-amber-700 font-semibold italic">விரைவில் புதுப்பிக்கப்படும்</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mt-6 border-t border-amber-200" />

              {/* Closing message */}
              <p className="mt-4 text-sm md:text-[15px] text-orange-800/80 leading-relaxed max-w-3xl">
                🙏 <strong>தங்களின் நன்கொடையும் ஆதரவும்,</strong> வடமதுரை அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவிலின்
                திருப்பணி மற்றும் மகா கும்பாபிஷேகப் பணிகளுக்கு பேருதவியாக அமையும்.
              </p>
              <p className="mt-3 text-base font-bold text-orange-600 tracking-wide">
                ஸ்வாமியே சரணம் ஐயப்பா 🙏
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Honor Roll ── */}
        <motion.div id="donors" className="mt-20 scroll-mt-24" initial="hidden" whileInView="visible"
          viewport={{ once: true }} variants={fadeUpVariant}>

          {/* Section heading */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/20 mb-4">
              <Users className="w-7 h-7 text-secondary-foreground" />
            </div>
            <h3 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
              நன்கொடையாளர் சிறப்பு பட்டியல்
            </h3>
            <p className="text-muted-foreground text-sm">
              இவர்களின் அன்புத் தொகையால் ஆலய திருப்பணி நடைபெறுகிறது — ஸ்வாமி அனுகிரகம் நிறைவாக கிடைக்கட்டும் 🙏
            </p>
          </div>

          <DonorWall donors={donors} stats={stats} inKindContributions={contributions} />
        </motion.div>
      </div>

      {/* ── Donation Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4">
          <div className="bg-background rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">நன்கொடை விவரங்கள்</h3>
                <button onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-primary/10 rounded-xl p-3 mb-5 text-center">
                <div className="text-3xl font-bold text-primary">₹{getAmount().toLocaleString('en-IN')}</div>
                <div className="text-sm text-muted-foreground">நன்கொடை தொகை</div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Field label="உங்கள் பெயர்" required error={touched.has('donorName') ? errors.donorName : undefined}>
                  <input value={form.donorName}
                    onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                    onBlur={() => touch('donorName')}
                    className={inputCls(touched.has('donorName') ? errors.donorName : undefined)}
                    placeholder="திரு. / திருமதி." />
                </Field>

                <Field label="மொபைல் எண்" required error={touched.has('mobile') ? errors.mobile : undefined}>
                  <input type="tel" value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    onBlur={() => touch('mobile')}
                    className={inputCls(touched.has('mobile') ? errors.mobile : undefined)}
                    placeholder="9XXXXXXXXX" maxLength={10} />
                </Field>

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

                <Field label="UPI / Transaction ID" required error={touched.has('transactionId') ? errors.transactionId : undefined}>
                  <input value={form.transactionId}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    onBlur={() => touch('transactionId')}
                    className={inputCls(touched.has('transactionId') ? errors.transactionId : undefined)}
                    placeholder="Transaction Reference ID" />
                </Field>

                <Field label="Payment Screenshot" error={errors.screenshot}>
                  <ScreenshotUploader file={screenshotFile} onFileChange={handleScreenshotChange} error={errors.screenshot} />
                  {uploadProgress === 'uploading' && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Upload className="w-3 h-3 animate-bounce" /> படம் பதிவேற்றுகிறது...
                    </p>
                  )}
                </Field>

                <Field label="செய்தி / Message">
                  <textarea value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${inputCls()} resize-none h-20`}
                    placeholder="ஸ்வாமியே சரணம் ஐயப்பா..." />
                </Field>

                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={form.anonymous}
                    onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded" />
                  அடையாளம் வெளியிட விரும்பவில்லை (Anonymous)
                </label>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  QR Code மூலம் பணம் செலுத்திய பின் Transaction ID மற்றும் Screenshot சமர்ப்பிக்கவும்.
                  நிர்வாகி சரிபார்த்த பிறகே உங்கள் பெயர் பட்டியலில் சேர்க்கப்படும்.
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

      {/* ── Submission Receipt ── */}
      {receipt && <SubmissionReceipt receipt={receipt} onDone={resetAll} />}
    </section>
  );
}
