import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

function parseJson<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

// ── small primitives ──────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';
const areaCls  = `${inputCls} resize-y min-h-[80px]`;

// ── List editors ─────────────────────────────────────────────────────────────

/** Simple list of strings */
function StringListEditor({ label, hint, items, onChange }: {
  label: string; hint?: string;
  items: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${inputCls} flex-1`} value={item}
              onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
          <Plus className="w-4 h-4" /> புதிதாக சேர்க்க
        </button>
      </div>
    </Field>
  );
}

/** List of {title, value:number} — for progress bars */
function ProgressListEditor({ label, items, onChange }: {
  label: string;
  items: { title: string; value: number }[];
  onChange: (v: { title: string; value: number }[]) => void;
}) {
  return (
    <Field label={label} hint="பணியின் பெயர் + நிறைவு சதவீதம் (0–100)">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className={`${inputCls} flex-1`} placeholder="பணியின் பெயர்"
              value={item.title}
              onChange={e => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; onChange(n); }} />
            <input type="number" min={0} max={100} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={item.value}
              onChange={e => { const n = [...items]; n[i] = { ...n[i], value: Math.min(100, Math.max(0, Number(e.target.value))) }; onChange(n); }} />
            <span className="text-sm text-gray-400">%</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, { title: '', value: 0 }])}
          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
          <Plus className="w-4 h-4" /> புதிதாக சேர்க்க
        </button>
      </div>
    </Field>
  );
}

/** List of {q, a} — for FAQ */
function FaqListEditor({ items, onChange }: {
  items: { q: string; a: string }[];
  onChange: (v: { q: string; a: string }[]) => void;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">கேள்வி {i + 1}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input className={inputCls} placeholder="கேள்வி..."
            value={item.q}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], q: e.target.value }; onChange(n); }} />
          <textarea className={areaCls} placeholder="பதில்..."
            value={item.a}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], a: e.target.value }; onChange(n); }} />
        </div>
      ))}
      <button onClick={() => onChange([...items, { q: '', a: '' }])}
        className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
        <Plus className="w-4 h-4" /> புதிய கேள்வி சேர்க்க
      </button>
    </div>
  );
}

// ── Tab wrapper ───────────────────────────────────────────────────────────────

function TabPanel({ title, emoji, saving, onSave, children }: {
  title: string; emoji: string; saving: boolean;
  onSave: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">{emoji} {title}</h2>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'சேமிக்கிறது...' : 'சேமி'}
        </button>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',       label: 'முகப்பு',         emoji: '🏛️' },
  { id: 'contact',    label: 'தொடர்பு',          emoji: '📍' },
  { id: 'about',      label: 'வரலாறு',           emoji: '📖' },
  { id: 'renovation', label: 'திருப்பணி',         emoji: '🔨' },
  { id: 'pujas',      label: 'சிறப்பு பூஜைகள்',  emoji: '🙏' },
  { id: 'gurus',      label: 'குருநாதர்கள்',      emoji: '👨‍🏫' },
  { id: 'faq',        label: 'கேள்வி-பதில்',      emoji: '❓' },
];

export default function ContentManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  const [activeTab, setActiveTab] = useState('hero');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getSettings().then(d => { setSettings(d as Settings); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
  const setJson = (key: string, val: unknown) => set(key, JSON.stringify(val));

  const saveKeys = useCallback(async (keys: string[]) => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      keys.forEach(k => { updates[k] = settings[k] ?? ''; });
      await api.updateSettings(updates);
      toast({ title: 'சேமிக்கப்பட்டது ✓', description: 'மாற்றங்கள் இணையதளத்தில் காட்டப்படும்.' });
    } catch {
      toast({ title: 'பிழை', description: 'சேமிக்க முடியவில்லை.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [settings, toast]);

  if (!loaded) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-gray-400">ஏற்றுகிறது...</div>
      </AdminLayout>
    );
  }

  // JSON-parsed state helpers
  const renovationWorks    = parseJson<string[]>(settings.renovation_works, ['கருவறை திருப்பணி','ராஜகோபுரம் அமைத்தல்','முன்மண்டபம் புதுப்பித்தல்','சுற்றுச்சுவர் கட்டுமானம்','கோவில் தரை அமைத்தல்','மின்வசதி மேம்பாடு','குடிநீர் வசதி','அன்னதான மண்டபம்','பக்தர்கள் அமரும் இட வசதி']);
  const renovationProgress = parseJson<{ title: string; value: number }[]>(settings.renovation_progress, [{ title:'கருவறை',value:100 },{ title:'மண்டபம்',value:70 },{ title:'ராஜகோபுரம்',value:40 },{ title:'சுற்றுச்சுவர்',value:60 },{ title:'மின்வசதி',value:35 }]);
  const specialPujas       = parseJson<string[]>(settings.special_pujas, ['மாத முதல் சனி','பௌர்ணமி பூஜை','அமாவாசை பூஜை','மண்டல பூஜை','மகரஜோதி பூஜை']);
  const faqs               = parseJson<{ q: string; a: string }[]>(settings.faqs, [{ q:'நன்கொடை வருமான வரி விலக்கு பெறுமா?',a:'தேவையான அனுமதி இருந்தால் விவரங்கள் வழங்கப்படும்.' },{ q:'ஆன்லைனில் நன்கொடை வழங்கலாமா?',a:'ஆம். UPI, Net Banking, Debit Card, Credit Card ஆகியவற்றின் மூலம் வழங்கலாம்.' },{ q:'ரசீது கிடைக்குமா?',a:'ஆம். உடனடியாக மின்னஞ்சல் மற்றும் WhatsApp மூலம் அனுப்பப்படும்.' }]);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🖊️ இணையதள உள்ளடக்க மேலாண்மை</h1>
          <p className="text-gray-500 text-sm mt-1">இங்கு மாற்றியதும் இணையதளில் உடனே காட்டப்படும்</p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 mb-6 bg-gray-100 p-1.5 rounded-xl">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── HERO ── */}
        {activeTab === 'hero' && (
          <TabPanel title="முகப்பு பக்க உள்ளடக்கம்" emoji="🏛️" saving={saving}
            onSave={() => saveKeys(['hero_title','hero_subtitle','hero_location','hero_tagline','hero_quote'])}>
            <Field label="முக்கிய தலைப்பு" hint="பெரிய தங்க நிற எழுத்தில் காட்டப்படும்">
              <input className={inputCls} value={settings.hero_title || ''} onChange={e => set('hero_title', e.target.value)} placeholder="ஸ்வாமியே சரணம் ஐயப்பா" />
            </Field>
            <Field label="கோவில் பெயர்">
              <input className={inputCls} value={settings.hero_subtitle || ''} onChange={e => set('hero_subtitle', e.target.value)} placeholder="அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்" />
            </Field>
            <Field label="இடம்">
              <input className={inputCls} value={settings.hero_location || ''} onChange={e => set('hero_location', e.target.value)} placeholder="வடமதுரை, திண்டுக்கல் மாவட்டம்" />
            </Field>
            <Field label="தலைக்கீழ் வாசகம்" hint="இணையதளத்தின் நோக்கம் விளக்கும் வரி">
              <input className={inputCls} value={settings.hero_tagline || ''} onChange={e => set('hero_tagline', e.target.value)} placeholder="திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்" />
            </Field>
            <Field label="ஊக்க மொழி (Quote)">
              <input className={inputCls} value={settings.hero_quote || ''} onChange={e => set('hero_quote', e.target.value)} placeholder='"ஒரு செங்கல் நீங்கள்... ஒரு கோவில் நமக்கு..."' />
            </Field>
          </TabPanel>
        )}

        {/* ── CONTACT ── */}
        {activeTab === 'contact' && (
          <TabPanel title="தொடர்பு & இருப்பிட விவரங்கள்" emoji="📍" saving={saving}
            onSave={() => saveKeys(['temple_address','temple_phone','temple_email','temple_maps_embed','temple_maps_link','temple_timings'])}>
            <Field label="முகவரி" hint="பல வரிகள் ஆதரிக்கப்படும்">
              <textarea className={areaCls} value={settings.temple_address || ''} onChange={e => set('temple_address', e.target.value)} placeholder="வடமதுரை, திண்டுக்கல் மாவட்டம்" />
            </Field>
            <Field label="கைபேசி எண்">
              <input className={inputCls} value={settings.temple_phone || ''} onChange={e => set('temple_phone', e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="மின்னஞ்சல்">
              <input className={inputCls} type="email" value={settings.temple_email || ''} onChange={e => set('temple_email', e.target.value)} placeholder="temple@example.com" />
            </Field>
            <Field label="கோவில் நேரங்கள்">
              <input className={inputCls} value={settings.temple_timings || ''} onChange={e => set('temple_timings', e.target.value)} placeholder="காலை 6:00 - 12:00 | மாலை 4:00 - 8:00" />
            </Field>
            <Field label="Google Maps இணைப்பு" hint="'Google Maps-ல் பார்க்க' என்ற பட்டனுக்கு">
              <input className={inputCls} value={settings.temple_maps_link || ''} onChange={e => set('temple_maps_link', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="Google Maps Embed URL" hint="Maps → Share → Embed a map → src='...' URL மட்டும்">
              <textarea className={areaCls} value={settings.temple_maps_embed || ''} onChange={e => set('temple_maps_embed', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Field>
          </TabPanel>
        )}

        {/* ── ABOUT ── */}
        {activeTab === 'about' && (
          <TabPanel title="ஆலய வரலாறு" emoji="📖" saving={saving}
            onSave={() => saveKeys(['about_history','about_years','about_daily_pujas','about_devotees'])}>
            <Field label="வரலாற்று விளக்கம்" hint="'ஆலய வரலாறு' பகுதியில் காட்டப்படும் பத்தி">
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y min-h-[160px]"
                value={settings.about_history || ''} onChange={e => set('about_history', e.target.value)}
                placeholder="வடமதுரை பகுதியில் அமைந்துள்ள..." />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="வருட வரலாறு">
                <input className={inputCls} value={settings.about_years || ''} onChange={e => set('about_years', e.target.value)} placeholder="பல ஆண்டுகள்" />
              </Field>
              <Field label="தினசரி பூஜைகள்">
                <input className={inputCls} value={settings.about_daily_pujas || ''} onChange={e => set('about_daily_pujas', e.target.value)} placeholder="3 வேளை" />
              </Field>
              <Field label="பக்தர்கள்">
                <input className={inputCls} value={settings.about_devotees || ''} onChange={e => set('about_devotees', e.target.value)} placeholder="ஆயிரக்கணக்கானோர்" />
              </Field>
            </div>
          </TabPanel>
        )}

        {/* ── RENOVATION ── */}
        {activeTab === 'renovation' && (
          <TabPanel title="திருப்பணி விவரங்கள்" emoji="🔨" saving={saving}
            onSave={() => { setJson('renovation_works', renovationWorks); setJson('renovation_progress', renovationProgress); saveKeys(['renovation_works','renovation_progress']); }}>
            <StringListEditor label="நடைபெறும் பணிகள்" hint="ஒவ்வொரு பணியையும் தனியாக சேர்க்கவும்"
              items={renovationWorks}
              onChange={v => setJson('renovation_works', v)} />
            <ProgressListEditor label="பணிகளின் நிலை (Progress Bars)"
              items={renovationProgress}
              onChange={v => setJson('renovation_progress', v)} />
          </TabPanel>
        )}

        {/* ── PUJAS ── */}
        {activeTab === 'pujas' && (
          <TabPanel title="சிறப்பு பூஜைகள்" emoji="🙏" saving={saving}
            onSave={() => { setJson('special_pujas', specialPujas); saveKeys(['special_pujas']); }}>
            <StringListEditor label="சிறப்பு பூஜைகள் பட்டியல்" hint="'சிறப்பு பூஜைகள்' பகுதியில் badges ஆக காட்டப்படும்"
              items={specialPujas}
              onChange={v => setJson('special_pujas', v)} />
          </TabPanel>
        )}

        {/* ── GURUS ── */}
        {activeTab === 'gurus' && (
          <TabPanel title="குருநாதர்கள்" emoji="👨‍🏫" saving={saving}
            onSave={() => saveKeys(['guru_description','guru_quote'])}>
            <Field label="குருநாதர்கள் விளக்கம்" hint="குருநாதர்கள் பகுதியில் காட்டப்படும் paragraph">
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y min-h-[160px]"
                value={settings.guru_description || ''} onChange={e => set('guru_description', e.target.value)}
                placeholder="இறையருளும், குருவருளும் ஒன்றிணைந்து..." />
            </Field>
            <Field label="Quote வாசகம்">
              <input className={inputCls} value={settings.guru_quote || ''} onChange={e => set('guru_quote', e.target.value)} placeholder='"குருவருள் இருந்தால் திருவருள் நிச்சயம்."' />
            </Field>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              💡 குருநாதர்களின் புகைப்படங்கள் தொழில்நுட்ப உதவியுடன் மாற்றலாம். தற்போது இரண்டு குருநாதர்களின் படங்கள் அமைக்கப்பட்டுள்ளன.
            </div>
          </TabPanel>
        )}

        {/* ── FAQ ── */}
        {activeTab === 'faq' && (
          <TabPanel title="அடிக்கடி கேட்கப்படும் கேள்விகள்" emoji="❓" saving={saving}
            onSave={() => { setJson('faqs', faqs); saveKeys(['faqs']); }}>
            <FaqListEditor items={faqs} onChange={v => setJson('faqs', v)} />
          </TabPanel>
        )}
      </div>
    </AdminLayout>
  );
}
