import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

type Settings = Record<string, string>;

function parseJson<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

// Keys that belong to each tab — used to count uncustomized fields per tab
const TAB_KEYS: Record<string, string[]> = {
  hero:            ['hero_title', 'hero_subtitle', 'hero_location', 'hero_tagline', 'hero_quote'],
  contact:         ['temple_address', 'temple_phone', 'temple_email', 'temple_maps_embed', 'temple_maps_link', 'temple_timings'],
  about:           ['about_history', 'about_years', 'about_daily_pujas', 'about_devotees'],
  renovation:      ['renovation_works', 'renovation_progress'],
  pujas:           ['special_pujas'],
  gurus:           ['guru_description', 'guru_quote'],
  kumbhabhishekam: ['kumbhabhishekam_badge', 'kumbhabhishekam_title', 'kumbhabhishekam_desc', 'kumbhabhishekam_events'],
  appeal:          ['appeal_heading', 'appeal_body', 'appeal_tagline', 'appeal_closing'],
  branding:        ['footer_temple_name', 'footer_tagline'],
  faq:             ['faqs'],
};

// Returns true when the key has never been saved (or was saved as empty).
// Uses the *persisted* baseline, not the editable draft, so typing into a field
// does not clear the badge before the save actually succeeds.
// Consistent with the public components' `value || placeholder` fallback:
// an empty-string save still shows the placeholder on the live site.
function isDefaultSaved(savedSettings: Settings, key: string) {
  return !(key in savedSettings) || !savedSettings[key]?.trim();
}

// Count how many keys in a tab are still using defaults (against persisted state)
function tabDefaultCount(savedSettings: Settings, tabId: string) {
  return (TAB_KEYS[tabId] ?? []).filter(k => isDefaultSaved(savedSettings, k)).length;
}

// ── small primitives ──────────────────────────────────────────────────────────

function DefaultBadge() {
  return (
    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 leading-none">
      Using default
    </span>
  );
}

function Field({
  label, hint, children, showDefault,
}: {
  label: string; hint?: string; children: React.ReactNode; showDefault?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {showDefault && <DefaultBadge />}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';
const areaCls  = `${inputCls} resize-y min-h-[80px]`;

// ── List editors ─────────────────────────────────────────────────────────────

function StringListEditor({ label, hint, items, onChange, addLabel, showDefault }: {
  label: string; hint?: string; addLabel: string;
  items: string[]; onChange: (v: string[]) => void; showDefault?: boolean;
}) {
  return (
    <Field label={label} hint={hint} showDefault={showDefault}>
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
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      </div>
    </Field>
  );
}

function ProgressListEditor({ label, hint, items, onChange, addLabel, showDefault }: {
  label: string; hint: string; addLabel: string;
  items: { title: string; value: number }[];
  onChange: (v: { title: string; value: number }[]) => void;
  showDefault?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Field label={label} hint={hint} showDefault={showDefault}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className={`${inputCls} flex-1`} placeholder={t('பணியின் பெயர்','Work title')}
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
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      </div>
    </Field>
  );
}

function FaqListEditor({ items, onChange, questionLabel, addLabel, showDefault }: {
  items: { q: string; a: string }[];
  onChange: (v: { q: string; a: string }[]) => void;
  questionLabel: string; addLabel: string; showDefault?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      {showDefault && (
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {t('கேள்வி-பதில் பட்டியல்', 'FAQ List')}
          <DefaultBadge />
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2 bg-gray-50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{questionLabel} {i + 1}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input className={inputCls} placeholder={t('கேள்வி...','Question...')}
            value={item.q}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], q: e.target.value }; onChange(n); }} />
          <textarea className={areaCls} placeholder={t('பதில்...','Answer...')}
            value={item.a}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], a: e.target.value }; onChange(n); }} />
        </div>
      ))}
      <button onClick={() => onChange([...items, { q: '', a: '' }])}
        className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
        <Plus className="w-4 h-4" /> {addLabel}
      </button>
    </div>
  );
}

// ── Tab wrapper ───────────────────────────────────────────────────────────────

function TabPanel({ title, emoji, saving, onSave, saveLabel, children, uncustomized }: {
  title: string; emoji: string; saving: boolean; saveLabel: string;
  onSave: () => void; children: React.ReactNode; uncustomized?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-800">{emoji} {title}</h2>
          {uncustomized != null && uncustomized > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              {uncustomized} {uncustomized === 1 ? 'field' : 'fields'} using defaults
            </span>
          )}
        </div>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Save className="w-4 h-4" />
          {saving ? '...' : saveLabel}
        </button>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ContentManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  // Tracks what is actually persisted in the DB — updated only after a
  // successful save so badges reflect the live site, not the unsaved draft.
  const [savedSettings, setSavedSettings] = useState<Settings>({});
  const [activeTab, setActiveTab] = useState('hero');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const TABS = [
    { id: 'hero',            label: t('முகப்பு','Home'),              emoji: '🏛️' },
    { id: 'contact',         label: t('தொடர்பு','Contact'),            emoji: '📍' },
    { id: 'about',           label: t('வரலாறு','History'),             emoji: '📖' },
    { id: 'renovation',      label: t('திருப்பணி','Renovation'),        emoji: '🔨' },
    { id: 'pujas',           label: t('சிறப்பு பூஜைகள்','Pujas'),     emoji: '🙏' },
    { id: 'gurus',           label: t('குருநாதர்கள்','Gurus'),          emoji: '👨‍🏫' },
    { id: 'kumbhabhishekam', label: t('கும்பாபிஷேகம்','Kumbhabhishekam'), emoji: '🪔' },
    { id: 'appeal',          label: t('வேண்டுகோள்','Appeal'),           emoji: '🙌' },
    { id: 'branding',        label: t('பிராண்டிங்','Branding'),         emoji: '🏷️' },
    { id: 'faq',             label: t('கேள்வி-பதில்','FAQ'),            emoji: '❓' },
  ];

  useEffect(() => {
    api.getSettings().then(d => {
      const s = d as Settings;
      setSettings(s);
      setSavedSettings(s);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
  const setJson = (key: string, val: unknown) => set(key, JSON.stringify(val));

  const saveKeys = useCallback(async (keys: string[]) => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      keys.forEach(k => { updates[k] = settings[k] ?? ''; });
      await api.updateSettings(updates);
      // Only update the persisted baseline after the PATCH succeeds.
      // This keeps badges accurate: a failed save leaves indicators unchanged.
      setSavedSettings(prev => ({ ...prev, ...updates }));
      toast({ title: t('சேமிக்கப்பட்டது ✓','Saved ✓'), description: t('மாற்றங்கள் இணையதளத்தில் காட்டப்படும்.','Changes will appear on the website.') });
    } catch {
      toast({ title: t('பிழை','Error'), description: t('சேமிக்க முடியவில்லை.','Could not save.'), variant: 'destructive' });
    } finally { setSaving(false); }
  }, [settings, toast]);

  if (!loaded) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-gray-400">{t('ஏற்றுகிறது...','Loading...')}</div>
      </AdminLayout>
    );
  }

  const renovationWorks         = parseJson<string[]>(settings.renovation_works, ['கருவறை திருப்பணி','ராஜகோபுரம் அமைத்தல்','முன்மண்டபம் புதுப்பித்தல்','சுற்றுச்சுவர் கட்டுமானம்','கோவில் தரை அமைத்தல்','மின்வசதி மேம்பாடு','குடிநீர் வசதி','அன்னதான மண்டபம்','பக்தர்கள் அமரும் இட வசதி']);
  const renovationProgress      = parseJson<{ title: string; value: number }[]>(settings.renovation_progress, [{ title:'கருவறை',value:100 },{ title:'மண்டபம்',value:70 },{ title:'ராஜகோபுரம்',value:40 },{ title:'சுற்றுச்சுவர்',value:60 },{ title:'மின்வசதி',value:35 }]);
  const specialPujas            = parseJson<string[]>(settings.special_pujas, ['மாத முதல் சனி','பௌர்ணமி பூஜை','அமாவாசை பூஜை','மண்டல பூஜை','மகரஜோதி பூஜை']);
  const faqs                    = parseJson<{ q: string; a: string }[]>(settings.faqs, [{ q:'நன்கொடை வருமான வரி விலக்கு பெறுமா?',a:'தேவையான அனுமதி இருந்தால் விவரங்கள் வழங்கப்படும்.' },{ q:'ஆன்லைனில் நன்கொடை வழங்கலாமா?',a:'ஆம். UPI, Net Banking, Debit Card, Credit Card ஆகியவற்றின் மூலம் வழங்கலாம்.' },{ q:'ரசீது கிடைக்குமா?',a:'ஆம். உடனடியாக மின்னஞ்சல் மற்றும் WhatsApp மூலம் அனுப்பப்படும்.' }]);
  const kumbhabhishekamEvents   = parseJson<string[]>(settings.kumbhabhishekam_events, ['கணபதி ஹோமம்','யாகசாலை பூஜைகள்','வேத பாராயணம்','மகா அபிஷேகம்','கும்பாபிஷேகம்','அன்னதானம்','பக்தர்களுக்கு பிரசாதம்']);

  const saveLabel = t('சேமி','Save');

  // Shorthand: is this key absent from the DB or saved as empty?
  // Always derived from savedSettings (persisted baseline), never the draft,
  // so typing in a field does not prematurely clear the badge.
  const def = (key: string) => isDefaultSaved(savedSettings, key);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🖊️ {t('இணையதள உள்ளடக்க மேலாண்மை','Website Content Manager')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('இங்கு மாற்றியதும் இணையதளில் உடனே காட்டப்படும்','Changes appear on the website immediately')}</p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 mb-6 bg-gray-100 p-1.5 rounded-xl">
          {TABS.map(tab => {
            const count = tabDefaultCount(savedSettings, tab.id);
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}>
                {tab.emoji} {tab.label}
                {count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-white leading-none">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── HERO ── */}
        {activeTab === 'hero' && (
          <TabPanel title={t('முகப்பு பக்க உள்ளடக்கம்','Home Page Content')} emoji="🏛️" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'hero')}
            onSave={() => saveKeys(['hero_title','hero_subtitle','hero_location','hero_tagline','hero_quote'])}>
            <Field label={t('முக்கிய தலைப்பு','Main Heading')} hint={t('பெரிய தங்க நிற எழுத்தில் காட்டப்படும்','Shown in large gold text')} showDefault={def('hero_title')}>
              <input className={inputCls} value={settings.hero_title || ''} onChange={e => set('hero_title', e.target.value)} placeholder="ஸ்வாமியே சரணம் ஐயப்பா" />
            </Field>
            <Field label={t('கோவில் பெயர்','Temple Name')} showDefault={def('hero_subtitle')}>
              <input className={inputCls} value={settings.hero_subtitle || ''} onChange={e => set('hero_subtitle', e.target.value)} placeholder="அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்" />
            </Field>
            <Field label={t('இடம்','Location')} showDefault={def('hero_location')}>
              <input className={inputCls} value={settings.hero_location || ''} onChange={e => set('hero_location', e.target.value)} placeholder="வடமதுரை, திண்டுக்கல் மாவட்டம்" />
            </Field>
            <Field label={t('தலைக்கீழ் வாசகம்','Tagline')} hint={t('இணையதளத்தின் நோக்கம் விளக்கும் வரி','One-line purpose of the website')} showDefault={def('hero_tagline')}>
              <input className={inputCls} value={settings.hero_tagline || ''} onChange={e => set('hero_tagline', e.target.value)} placeholder="திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்" />
            </Field>
            <Field label={t('ஊக்க மொழி','Quote')} showDefault={def('hero_quote')}>
              <input className={inputCls} value={settings.hero_quote || ''} onChange={e => set('hero_quote', e.target.value)} placeholder='"ஒரு செங்கல் நீங்கள்... ஒரு கோவில் நமக்கு..."' />
            </Field>
          </TabPanel>
        )}

        {/* ── CONTACT ── */}
        {activeTab === 'contact' && (
          <TabPanel title={t('தொடர்பு & இருப்பிட விவரங்கள்','Contact & Location')} emoji="📍" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'contact')}
            onSave={() => saveKeys(['temple_address','temple_phone','temple_email','temple_maps_embed','temple_maps_link','temple_timings'])}>
            <Field label={t('முகவரி','Address')} hint={t('பல வரிகள் ஆதரிக்கப்படும்','Multi-line supported')} showDefault={def('temple_address')}>
              <textarea className={areaCls} value={settings.temple_address || ''} onChange={e => set('temple_address', e.target.value)} placeholder="வடமதுரை, திண்டுக்கல் மாவட்டம்" />
            </Field>
            <Field label={t('கைபேசி எண்','Phone')} showDefault={def('temple_phone')}>
              <input className={inputCls} value={settings.temple_phone || ''} onChange={e => set('temple_phone', e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label={t('மின்னஞ்சல்','Email')} showDefault={def('temple_email')}>
              <input className={inputCls} type="email" value={settings.temple_email || ''} onChange={e => set('temple_email', e.target.value)} placeholder="temple@example.com" />
            </Field>
            <Field label={t('கோவில் நேரங்கள்','Temple Timings')} showDefault={def('temple_timings')}>
              <input className={inputCls} value={settings.temple_timings || ''} onChange={e => set('temple_timings', e.target.value)} placeholder="காலை 6:00 - 12:00 | மாலை 4:00 - 8:00" />
            </Field>
            <Field label={t("Google Maps இணைப்பு","Google Maps Link")} hint={t("'Google Maps-ல் பார்க்க' என்ற பட்டனுக்கு","For the 'View on Google Maps' button")} showDefault={def('temple_maps_link')}>
              <input className={inputCls} value={settings.temple_maps_link || ''} onChange={e => set('temple_maps_link', e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label={t("Google Maps உட்பொதிக்கும் URL","Google Maps Embed URL")} hint="Maps → Share → Embed a map → src='...' URL" showDefault={def('temple_maps_embed')}>
              <textarea className={areaCls} value={settings.temple_maps_embed || ''} onChange={e => set('temple_maps_embed', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Field>
          </TabPanel>
        )}

        {/* ── ABOUT ── */}
        {activeTab === 'about' && (
          <TabPanel title={t('ஆலய வரலாறு','Temple History')} emoji="📖" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'about')}
            onSave={() => saveKeys(['about_history','about_years','about_daily_pujas','about_devotees'])}>
            <Field label={t('வரலாற்று விளக்கம்','History Description')} hint={t("'ஆலய வரலாறு' பகுதியில் காட்டப்படும் பத்தி","Paragraph shown in the About section")} showDefault={def('about_history')}>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y min-h-[160px]"
                value={settings.about_history || ''} onChange={e => set('about_history', e.target.value)}
                placeholder="வடமதுரை பகுதியில் அமைந்துள்ள..." />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('வருட வரலாறு','Years of History')} showDefault={def('about_years')}>
                <input className={inputCls} value={settings.about_years || ''} onChange={e => set('about_years', e.target.value)} placeholder="பல ஆண்டுகள்" />
              </Field>
              <Field label={t('தினசரி பூஜைகள்','Daily Pujas')} showDefault={def('about_daily_pujas')}>
                <input className={inputCls} value={settings.about_daily_pujas || ''} onChange={e => set('about_daily_pujas', e.target.value)} placeholder="3 வேளை" />
              </Field>
              <Field label={t('பக்தர்கள்','Devotees')} showDefault={def('about_devotees')}>
                <input className={inputCls} value={settings.about_devotees || ''} onChange={e => set('about_devotees', e.target.value)} placeholder="ஆயிரக்கணக்கானோர்" />
              </Field>
            </div>
          </TabPanel>
        )}

        {/* ── RENOVATION ── */}
        {activeTab === 'renovation' && (
          <TabPanel title={t('திருப்பணி விவரங்கள்','Renovation Details')} emoji="🔨" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'renovation')}
            onSave={() => { setJson('renovation_works', renovationWorks); setJson('renovation_progress', renovationProgress); saveKeys(['renovation_works','renovation_progress']); }}>
            <StringListEditor label={t('நடைபெறும் பணிகள்','Ongoing Works')} hint={t('ஒவ்வொரு பணியையும் தனியாக சேர்க்கவும்','Add each work item separately')}
              items={renovationWorks} onChange={v => setJson('renovation_works', v)}
              addLabel={t('புதிதாக சேர்க்க','Add item')}
              showDefault={def('renovation_works')} />
            <ProgressListEditor label={t('பணிகளின் நிலை','Progress Bars')} hint={t('பணியின் பெயர் + நிறைவு சதவீதம் (0–100)','Work name + completion percentage (0–100)')}
              items={renovationProgress} onChange={v => setJson('renovation_progress', v)}
              addLabel={t('புதிதாக சேர்க்க','Add item')}
              showDefault={def('renovation_progress')} />
          </TabPanel>
        )}

        {/* ── PUJAS ── */}
        {activeTab === 'pujas' && (
          <TabPanel title={t('சிறப்பு பூஜைகள்','Special Pujas')} emoji="🙏" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'pujas')}
            onSave={() => { setJson('special_pujas', specialPujas); saveKeys(['special_pujas']); }}>
            <StringListEditor label={t('சிறப்பு பூஜைகள் பட்டியல்','Special Pujas List')} hint={t("'சிறப்பு பூஜைகள்' பகுதியில் badges ஆக காட்டப்படும்","Shown as badges in the Special Pujas section")}
              items={specialPujas} onChange={v => setJson('special_pujas', v)}
              addLabel={t('புதிதாக சேர்க்க','Add puja')}
              showDefault={def('special_pujas')} />
          </TabPanel>
        )}

        {/* ── GURUS ── */}
        {activeTab === 'gurus' && (
          <TabPanel title={t('குருநாதர்கள்','Gurus')} emoji="👨‍🏫" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'gurus')}
            onSave={() => saveKeys(['guru_description','guru_quote'])}>
            <Field label={t('குருநாதர்கள் விளக்கம்','Gurus Description')} hint={t('குருநாதர்கள் பகுதியில் காட்டப்படும் paragraph','Paragraph shown in the Gurus section')} showDefault={def('guru_description')}>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y min-h-[160px]"
                value={settings.guru_description || ''} onChange={e => set('guru_description', e.target.value)}
                placeholder="இறையருளும், குருவருளும் ஒன்றிணைந்து..." />
            </Field>
            <Field label={t('Quote வாசகம்','Quote')} showDefault={def('guru_quote')}>
              <input className={inputCls} value={settings.guru_quote || ''} onChange={e => set('guru_quote', e.target.value)} placeholder='"குருவருள் இருந்தால் திருவருள் நிச்சயம்."' />
            </Field>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              💡 {t('குருநாதர்களின் புகைப்படங்கள் தொழில்நுட்ப உதவியுடன் மாற்றலாம்.','Guru photos can be changed with technical assistance.')}
            </div>
          </TabPanel>
        )}

        {/* ── KUMBHABHISHEKAM ── */}
        {activeTab === 'kumbhabhishekam' && (
          <TabPanel title={t('கும்பாபிஷேகம் பகுதி','Kumbhabhishekam Section')} emoji="🪔" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'kumbhabhishekam')}
            onSave={() => { setJson('kumbhabhishekam_events', kumbhabhishekamEvents); saveKeys(['kumbhabhishekam_badge','kumbhabhishekam_title','kumbhabhishekam_desc','kumbhabhishekam_events']); }}>
            <Field label={t('சிறிய லேபிள்','Badge Text')} hint={t('தலைப்பின் மேலே காட்டப்படும் சிறிய லேபிள்','Small badge above the heading')} showDefault={def('kumbhabhishekam_badge')}>
              <input className={inputCls} value={settings.kumbhabhishekam_badge || ''} onChange={e => set('kumbhabhishekam_badge', e.target.value)} placeholder="புனித குடமுழுக்கு விழா" />
            </Field>
            <Field label={t('பிரிவு தலைப்பு','Section Heading')} showDefault={def('kumbhabhishekam_title')}>
              <input className={inputCls} value={settings.kumbhabhishekam_title || ''} onChange={e => set('kumbhabhishekam_title', e.target.value)} placeholder="மகா கும்பாபிஷேகம்" />
            </Field>
            <Field label={t('விளக்கம்','Description')} showDefault={def('kumbhabhishekam_desc')}>
              <textarea className={areaCls} value={settings.kumbhabhishekam_desc || ''} onChange={e => set('kumbhabhishekam_desc', e.target.value)}
                placeholder="இறைவனின் அருளால் நடைபெறவுள்ள மகா கும்பாபிஷேக விழாவிற்கு..." />
            </Field>
            <StringListEditor
              label={t('நிகழ்வுகள் பட்டியல்','Events List')}
              hint={t('ஒவ்வொரு நிகழ்வும் ஒரு card ஆக காட்டப்படும்','Each event is shown as a card')}
              items={kumbhabhishekamEvents}
              onChange={v => setJson('kumbhabhishekam_events', v)}
              addLabel={t('நிகழ்வு சேர்க்க','Add event')}
              showDefault={def('kumbhabhishekam_events')} />
          </TabPanel>
        )}

        {/* ── APPEAL ── */}
        {activeTab === 'appeal' && (
          <TabPanel title={t('வேண்டுகோள் பகுதி','Appeal Section')} emoji="🙌" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'appeal')}
            onSave={() => saveKeys(['appeal_heading','appeal_body','appeal_tagline','appeal_closing'])}>
            <Field label={t('தலைப்பு','Heading')} showDefault={def('appeal_heading')}>
              <input className={inputCls} value={settings.appeal_heading || ''} onChange={e => set('appeal_heading', e.target.value)} placeholder="பக்தர்களுக்கான வேண்டுகோள்" />
            </Field>
            <Field label={t('முக்கிய பத்தி','Body Text')} hint={t('பக்தர்களை நன்கொடை வழங்க அழைக்கும் பத்தி','Paragraph inviting devotees to donate')} showDefault={def('appeal_body')}>
              <textarea className={`${areaCls} min-h-[120px]`} value={settings.appeal_body || ''} onChange={e => set('appeal_body', e.target.value)}
                placeholder="அன்பார்ந்த ஐயப்ப பக்தர்களே, ஆலய திருப்பணி மற்றும்..." />
            </Field>
            <Field label={t('ஊக்க வாசகம்','Tagline')} hint={t('பெரிய எழுத்தில் காட்டப்படும் முக்கிய வாசகம்','Main motivational line in large text')} showDefault={def('appeal_tagline')}>
              <input className={inputCls} value={settings.appeal_tagline || ''} onChange={e => set('appeal_tagline', e.target.value)} placeholder="நாம் கட்டும் கோவில்... நம் சந்ததியினர் வழிபடும் தெய்வீக தலம்." />
            </Field>
            <Field label={t('இறுதி வாசகம்','Closing Chant')} showDefault={def('appeal_closing')}>
              <input className={inputCls} value={settings.appeal_closing || ''} onChange={e => set('appeal_closing', e.target.value)} placeholder="ஸ்வாமியே சரணம் ஐயப்பா" />
            </Field>
          </TabPanel>
        )}

        {/* ── BRANDING ── */}
        {activeTab === 'branding' && (
          <TabPanel title={t('Footer பிராண்டிங்','Footer Branding')} emoji="🏷️" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'branding')}
            onSave={() => saveKeys(['footer_temple_name','footer_tagline'])}>
            <Field label={t('Footer கோவில் பெயர்','Footer Temple Name')} hint={t('கீழ்-பகுதியில் காட்டப்படும் கோவிலின் பெயர்','Temple name shown in the footer')} showDefault={def('footer_temple_name')}>
              <input className={inputCls} value={settings.footer_temple_name || ''} onChange={e => set('footer_temple_name', e.target.value)} placeholder="அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவில்" />
            </Field>
            <Field label={t('Footer தலைக்கீழ் வாசகம்','Footer Tagline')} hint={t('கோவில் பெயரின் கீழே சிறிய எழுத்தில் காட்டப்படும்','Shown below the temple name in smaller text')} showDefault={def('footer_tagline')}>
              <input className={inputCls} value={settings.footer_tagline || ''} onChange={e => set('footer_tagline', e.target.value)} placeholder="திருப்பணி மற்றும் மகா கும்பாபிஷேக நிதி திரட்டும் இணையதளம்" />
            </Field>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              💡 {t('வங்கி விவரங்கள் மாற்ற Settings பக்கத்திற்கு செல்லவும். மாறியதும் ரசீதிலும் தானாக காட்டப்படும்.','To update bank details, go to the Settings page. Changes appear on receipts automatically.')}
            </div>
          </TabPanel>
        )}

        {/* ── FAQ ── */}
        {activeTab === 'faq' && (
          <TabPanel title={t('அடிக்கடி கேட்கப்படும் கேள்விகள்','Frequently Asked Questions')} emoji="❓" saving={saving} saveLabel={saveLabel}
            uncustomized={tabDefaultCount(savedSettings, 'faq')}
            onSave={() => { setJson('faqs', faqs); saveKeys(['faqs']); }}>
            <FaqListEditor items={faqs} onChange={v => setJson('faqs', v)}
              questionLabel={t('கேள்வி','Question')}
              addLabel={t('புதிய கேள்வி சேர்க்க','Add Question')}
              showDefault={def('faqs')} />
          </TabPanel>
        )}
      </div>
    </AdminLayout>
  );
}
