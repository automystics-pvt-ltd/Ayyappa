import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ArrowUpDown, Eye, EyeOff, ChevronDown, LayoutGrid, List, MessageSquareQuote, Calendar } from 'lucide-react';
import { fadeUpVariant } from '@/lib/animations';

/* ── Types ──────────────────────────────────────────────────────────────── */
export interface Donor {
  id: number;
  donorName: string;
  place?: string | null;
  amount: string;
  anonymous: boolean;
  message?: string | null;
  reviewedAt: string;
  createdAt: string;
}

export interface InKindContribution {
  id: number;
  donorName: string;
  place?: string | null;
  description: string;
  contributedAt: string;
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const dateStr = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ta-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return ''; }
};


const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const displayName = (d: Donor) =>
  d.anonymous ? 'அடையாளம் தெரியாதவர்' : d.donorName;

type ViewMode = 'card' | 'list';
type SortKey  = 'date_asc' | 'date_desc' | 'amount_desc' | 'amount_asc';

/* ═══════════════════════════════════════════════════════════════════════════
   SERIAL BADGE  — uniform for every donor, date-based (earliest = #1)
   ═══════════════════════════════════════════════════════════════════════════ */
function SerialBadge({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) {
  const pad   = String(rank).padStart(2, '0');
  const isBig = size === 'md';

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl
      bg-primary/10 border border-primary/30
      ${isBig ? 'w-14 min-h-[52px] px-1' : 'w-11 min-h-[42px] px-0.5'}
      flex-shrink-0`}>
      <span className={`font-black text-primary leading-none
        ${isBig ? 'text-lg' : 'text-base'}`}>
        {pad}
      </span>
      <span className={`text-primary/50 font-medium leading-tight text-center
        ${isBig ? 'text-[7px] mt-0.5' : 'text-[6px]'}`}>
        நன்கொடை
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEW TOGGLE
   ═══════════════════════════════════════════════════════════════════════════ */
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-muted/30">
      {([['list', <List   className="w-4 h-4" />, 'பட்டியல்'],
         ['card', <LayoutGrid className="w-4 h-4" />, 'அட்டை']] as const).map(([v, icon, label]) => (
        <button
          key={v}
          onClick={() => onChange(v as ViewMode)}
          title={label as string}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
            ${view === v
              ? 'bg-white shadow-sm text-primary'
              : 'text-muted-foreground hover:text-foreground'}`}
        >
          {icon as React.ReactNode}
          <span className="hidden sm:inline">{label as string}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DONOR LIST ROW  — detailed, default view
   ═══════════════════════════════════════════════════════════════════════════ */
function DonorListRow({
  donor, rank, showAmount, stripe,
}: { donor: Donor; rank: number; showAmount: boolean; stripe: boolean }) {
  const name     = displayName(donor);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`group flex items-start gap-3 px-4 py-4 transition-colors
        hover:bg-primary/5 border-b border-border/40 last:border-b-0
        ${stripe ? 'bg-muted/15' : 'bg-transparent'}`}
    >
      {/* Serial badge */}
      <SerialBadge rank={rank} size="md" />

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5
        ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
        : rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500'
        : rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500'
        : 'bg-gradient-to-br from-primary/60 to-primary'}`}>
        {donor.anonymous
          ? <span className="text-lg">🙏</span>
          : <span className="text-white font-bold text-sm">{initials(donor.donorName)}</span>}
      </div>

      {/* Main info block */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold text-sm leading-tight
            ${rank === 1 ? 'text-amber-700' : 'text-foreground'}`}>
            {name}
          </span>
          {donor.anonymous && (
            <span className="inline-flex items-center text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">
              பெயர் மறை
            </span>
          )}
        </div>

        {/* Row 2: place + date */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {donor.place && !donor.anonymous && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {donor.place}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {dateStr(donor.reviewedAt)}
          </span>
        </div>

        {/* Row 3: message */}
        {donor.message && !donor.anonymous && (
          <div className="flex items-start gap-1.5 mt-2 bg-secondary/10 border-l-2 border-secondary/50 rounded-r-lg px-2.5 py-1.5">
            <MessageSquareQuote className="w-3 h-3 text-secondary-foreground/60 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/70 italic leading-relaxed line-clamp-2">
              {donor.message}
            </p>
          </div>
        )}
      </div>

      {/* Amount column */}
      <div className="text-right flex-shrink-0 min-w-[80px]">
        {showAmount ? (
          <div className={`text-base font-black
            ${rank === 1 ? 'text-amber-700'
            : rank <= 3  ? 'text-primary'
            : 'text-primary/80'}`}>
            {fmt(Number(donor.amount))}
          </div>
        ) : (
          <div className="text-base font-bold text-muted-foreground/25">₹ •••</div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DONOR CARD  — grid view
   ═══════════════════════════════════════════════════════════════════════════ */
function DonorCard({ donor, rank, showAmount }: { donor: Donor; rank: number; showAmount: boolean }) {
  const name = displayName(donor);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`relative flex flex-col gap-3 rounded-2xl border p-5 shadow-sm
        hover:shadow-md transition-shadow overflow-hidden
        ${rank === 1
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50/60 border-amber-200'
          : 'bg-card border-card-border'}`}
    >
      {/* Serial badge — top left */}
      <div className="flex items-start justify-between">
        <SerialBadge rank={rank} size="md" />
        <div className="flex flex-col gap-1 items-end">
          {donor.anonymous && (
            <span className="text-[9px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
              பெயர் மறை
            </span>
          )}
        </div>
      </div>

      {/* Donor identity */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
          ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
          : rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500'
          : rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500'
          : 'bg-gradient-to-br from-primary/60 to-primary'}`}>
          {donor.anonymous
            ? <span className="text-base">🙏</span>
            : <span className="text-white font-bold text-sm">{initials(donor.donorName)}</span>}
        </div>
        <div className="min-w-0">
          <div className={`font-bold text-sm truncate
            ${rank === 1 ? 'text-amber-800' : 'text-foreground'}`}>
            {name}
          </div>
          {donor.place && !donor.anonymous && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{donor.place}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount + date */}
      <div className="flex items-end justify-between pt-2 border-t border-border/40">
        <div>
          {showAmount ? (
            <div className={`text-lg font-black
              ${rank === 1 ? 'text-amber-700' : 'text-primary'}`}>
              {fmt(Number(donor.amount))}
            </div>
          ) : (
            <div className="text-lg font-bold text-muted-foreground/30">₹ ••••</div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <Calendar className="w-3 h-3" />
            {dateStr(donor.reviewedAt)}
          </div>
        </div>
      </div>

      {/* Message */}
      {donor.message && !donor.anonymous && (
        <div className="flex items-start gap-1.5 bg-secondary/10 border-l-2 border-secondary/50 rounded-r-lg px-2.5 py-1.5">
          <MessageSquareQuote className="w-3 h-3 text-secondary-foreground/60 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/70 italic leading-relaxed line-clamp-2">
            {donor.message}
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DONOR WALL
   ═══════════════════════════════════════════════════════════════════════════ */
export function DonorWall({
  donors,
  stats,
  inKindContributions = [],
}: {
  donors: Donor[];
  stats: { totalRaised: number; donorCount: number } | null;
  inKindContributions?: InKindContribution[];
}) {
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState<SortKey>('date_asc');
  const [showAmounts, setShowAmounts] = useState(true);
  const [page,        setPage]        = useState(1);
  const [viewMode,    setViewMode]    = useState<ViewMode>('list');

  /* Stable date-based serial: earliest approved = #1 */
  const serialMap = useMemo(() => {
    const sorted = [...donors].sort(
      (a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime()
    );
    const m = new Map<number, number>();
    sorted.forEach((d, i) => m.set(d.id, i + 1));
    return m;
  }, [donors]);

  const filtered = useMemo(() => {
    let list = [...donors];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        (!d.anonymous && d.donorName.toLowerCase().includes(q)) ||
        d.place?.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'amount_desc': list.sort((a, b) => Number(b.amount) - Number(a.amount)); break;
      case 'amount_asc':  list.sort((a, b) => Number(a.amount) - Number(b.amount)); break;
      case 'date_desc':   list.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()); break;
      default:            list.sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
    }
    return list;
  }, [donors, search, sort]);

  const visible  = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;
  return (
    <div className="space-y-8">

      {/* Stats strip */}
      {donors.length > 0 && stats && (
        <div className="flex flex-wrap items-center justify-center gap-6
          bg-primary/5 border border-primary/15 rounded-2xl px-6 py-5">
          {[
            { value: donors.length.toLocaleString('en-IN'), label: 'நன்கொடையாளர்கள்' },
            { value: fmt(stats.totalRaised),                label: 'மொத்தம் திரட்டப்பட்டது' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-9 bg-border hidden sm:block" />}
              <div className="text-center">
                <div className="text-2xl font-black text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {donors.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="பெயர் / ஊர் தேடவும்..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); setPage(1); }}
                className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-border
                  text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="date_asc">தேதி — பழையது முதல்</option>
                <option value="date_desc">தேதி — புதியது முதல்</option>
                <option value="amount_desc">தொகை — அதிகம் முதல்</option>
                <option value="amount_asc">தொகை — குறைவு முதல்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {/* Amount visibility */}
            <button
              onClick={() => setShowAmounts(v => !v)}
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground
                hover:text-foreground border border-border rounded-xl px-3 py-2 transition-colors whitespace-nowrap"
            >
              {showAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAmounts ? 'தொகை மறை' : 'தொகை காட்டு'}
            </button>
            {/* View toggle */}
            <ViewToggle view={viewMode} onChange={v => { setViewMode(v); setPage(1); }} />
          </div>
          {search && (
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              "{search}" — {filtered.length} பதிவு கிடைத்தது
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 && search ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">"{search}" என்று யாரும் இல்லை</p>
          <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
            தேடலை நீக்கு
          </button>
        </div>

      ) : visible.length > 0 ? (
        <>
          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
              {/* Column header */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-b border-border
                text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="w-12 flex-shrink-0 text-center">எண்</div>
                <div className="w-10 flex-shrink-0" />
                <div className="flex-1">நன்கொடையாளர் விவரம்</div>
                <div className="text-right flex-shrink-0 w-24">தொகை</div>
              </div>

              <AnimatePresence mode="popLayout">
                {visible.map((d, idx) => (
                  <DonorListRow
                    key={d.id}
                    donor={d}
                    rank={serialMap.get(d.id) ?? (idx + 1)}
                    showAmount={showAmounts}
                    stripe={idx % 2 === 1}
                  />
                ))}
              </AnimatePresence>

              {/* Footer total */}
              {showAmounts && visible.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3
                  bg-primary/5 border-t border-primary/15">
                  <span className="text-xs font-semibold text-muted-foreground">
                    காட்டப்படுகிறது {visible.length} / {filtered.length} பேர்
                  </span>
                  <span className="text-sm font-black text-primary">
                    {fmt(visible.reduce((s, d) => s + Number(d.amount), 0))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CARD VIEW */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {visible.map((d, idx) => (
                  <DonorCard
                    key={d.id}
                    donor={d}
                    rank={serialMap.get(d.id) ?? (idx + 1)}
                    showAmount={showAmounts}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border
                  hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl
                  shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பேர் உள்ளனர்)
              </button>
            </motion.div>
          )}
        </>

      ) : donors.length === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-14 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <p className="text-muted-foreground font-medium">
            முதல் நன்கொடையாளர் ஆக வாய்ப்பு உங்களுக்கே!
          </p>
        </div>
      ) : null}

      {/* In-kind section */}
      {inKindContributions.length > 0 && (
        <InKindWall contributions={inKindContributions} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IN-KIND WALL
   ═══════════════════════════════════════════════════════════════════════════ */

type IKSort = 'date_asc' | 'date_desc' | 'name_asc';
const IK_PAGE_SIZE = 20;

/* ── In-Kind Serial Badge — uniform for every contributor ───────────────── */
function IKSerialBadge({ rank }: { rank: number }) {
  const pad = String(rank).padStart(2, '0');
  return (
    <div className="flex flex-col items-center justify-center rounded-xl
      bg-orange-50 border border-orange-200
      w-14 min-h-[52px] px-1 flex-shrink-0">
      <span className="font-black text-lg text-orange-600 leading-none">{pad}</span>
      <span className="text-[7px] font-medium text-orange-400 leading-tight mt-0.5 text-center">
        நன்கொடை
      </span>
    </div>
  );
}

/* ── In-Kind List Row ────────────────────────────────────────────────────── */
function InKindListRow({ c, rank, stripe }: { c: InKindContribution; rank: number; stripe: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-start gap-3 px-4 py-4 border-b border-border/40 last:border-b-0
        transition-colors hover:bg-orange-50/40
        ${stripe ? 'bg-muted/15' : 'bg-transparent'}`}
    >
      <IKSerialBadge rank={rank} />

      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500
        flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
        <span className="text-white font-bold text-sm">{initials(c.donorName)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-foreground">{c.donorName}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {c.place && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{c.place}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />{dateStr(c.contributedAt)}
          </span>
        </div>
        <div className="mt-1.5 text-sm font-semibold text-primary leading-snug">{c.description}</div>
      </div>
    </motion.div>
  );
}

/* ── In-Kind Card ────────────────────────────────────────────────────────── */
function InKindCard({ c, rank }: { c: InKindContribution; rank: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-card border border-card-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <IKSerialBadge rank={rank} />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500
          flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">{initials(c.donorName)}</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-foreground truncate">{c.donorName}</div>
          {c.place && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.place}</span>
            </div>
          )}
        </div>
      </div>
      <div className="pt-2 border-t border-border/40">
        <div className="text-sm font-semibold text-primary leading-snug break-words">{c.description}</div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
          <Calendar className="w-3 h-3" />{dateStr(c.contributedAt)}
        </div>
      </div>
    </motion.div>
  );
}

/* ── InKindWall ──────────────────────────────────────────────────────────── */
function InKindWall({ contributions }: { contributions: InKindContribution[] }) {
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState<IKSort>('date_asc');
  const [page,     setPage]     = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const ikSerialMap = useMemo(() => {
    const sorted = [...contributions].sort(
      (a, b) => new Date(a.contributedAt).getTime() - new Date(b.contributedAt).getTime()
    );
    const m = new Map<number, number>();
    sorted.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [contributions]);

  const filtered = useMemo(() => {
    let list = [...contributions];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.donorName.toLowerCase().includes(q) ||
        c.place?.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'name_asc':  list.sort((a, b) => a.donorName.localeCompare(b.donorName, 'ta')); break;
      case 'date_desc': list.sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime()); break;
      default:          list.sort((a, b) => new Date(a.contributedAt).getTime() - new Date(b.contributedAt).getTime());
    }
    return list;
  }, [contributions, search, sort]);

  const visible  = filtered.slice(0, page * IK_PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;
  return (
    <div className="space-y-8 pt-8 border-t-2 border-border/30">

      <div className="text-center">
        <h3 className="font-serif font-bold text-2xl text-foreground">
          🎁 பொருள் நன்கொடையாளர்கள்
        </h3>
        <p className="text-sm text-muted-foreground mt-1">பொருளால் ஆலயத்திற்கு உதவியவர்கள்</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center justify-center gap-6
        bg-orange-50 border border-orange-200/60 rounded-2xl px-6 py-4">
        {[
          { value: contributions.length.toLocaleString('en-IN'), label: 'பொருள் நன்கொடையாளர்கள்' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            {i > 0 && <div className="w-px h-8 bg-border hidden sm:block" />}
            <div className="text-center">
              <div className="text-2xl font-black text-orange-700">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {contributions.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="பெயர் / ஊர் / பொருள் தேடவும்..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as IKSort); setPage(1); }}
                className="appearance-none w-full sm:w-48 pl-9 pr-8 py-2.5 rounded-xl border border-border
                  text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="date_asc">தேதி — பழையது முதல்</option>
                <option value="date_desc">தேதி — புதியது முதல்</option>
                <option value="name_asc">பெயர் வரிசையில்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <ViewToggle view={viewMode} onChange={v => { setViewMode(v); setPage(1); }} />
          </div>
          {search && (
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              "{search}" — {filtered.length} பதிவு கிடைத்தது
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 && search ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">"{search}" என்று யாரும் இல்லை</p>
          <button onClick={() => setSearch('')} className="text-primary text-sm mt-2 hover:underline">
            தேடலை நீக்கு
          </button>
        </div>
      ) : visible.length > 0 ? (
        <>
          {viewMode === 'list' ? (
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-b border-border
                text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="w-12 flex-shrink-0 text-center">எண்</div>
                <div className="w-10 flex-shrink-0" />
                <div className="flex-1">நன்கொடையாளர் விவரம்</div>
              </div>
              <AnimatePresence mode="popLayout">
                {visible.map((c, idx) => (
                  <InKindListRow
                    key={c.id}
                    c={c}
                    rank={ikSerialMap.get(c.id) ?? (idx + 1)}
                    stripe={idx % 2 === 1}
                  />
                ))}
              </AnimatePresence>
              <div className="px-4 py-3 bg-orange-50/60 border-t border-orange-200/50">
                <span className="text-xs font-semibold text-muted-foreground">
                  மொத்தம் {filtered.length} பொருள் நன்கொடையாளர்கள்
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {visible.map((c, idx) => (
                  <InKindCard key={c.id} c={c} rank={ikSerialMap.get(c.id) ?? (idx + 1)} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border
                  hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl
                  shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பேர் உள்ளனர்)
              </button>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}
