import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, ArrowUpDown, Eye, EyeOff, ChevronDown, Star, LayoutGrid, List } from 'lucide-react';
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
const PAGE_SIZE   = 12;
const NEW_DAYS    = 7;
const TOP_AMOUNT  = 5001;
const MEDAL_META  = [
  { emoji: '🥇', bg: 'from-yellow-50 to-amber-100',  border: 'border-amber-300',  text: 'text-amber-700'  },
  { emoji: '🥈', bg: 'from-slate-50 to-slate-100',   border: 'border-slate-300',  text: 'text-slate-600'  },
  { emoji: '🥉', bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
];

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

const isNew    = (iso: string) =>
  Date.now() - new Date(iso).getTime() < NEW_DAYS * 86_400_000;

const isTop    = (amount: string, threshold: number) =>
  Number(amount) >= threshold;

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const displayName = (d: Donor) =>
  d.anonymous ? 'அடையாளம் தெரியாதவர்' : d.donorName;

type ViewMode = 'card' | 'list';

/* ── View Toggle ─────────────────────────────────────────────────────────── */
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/30">
      <button
        onClick={() => onChange('card')}
        title="Card view"
        className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        title="List view"
        className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Donor Card ─────────────────────────────────────────────────────────── */
function DonorCard({ donor, rank, showAmount }: { donor: Donor; rank: number; showAmount: boolean }) {
  const name      = displayName(donor);
  const newBadge  = isNew(donor.reviewedAt);
  const topBadge  = isTop(donor.amount, TOP_AMOUNT);
  const avatarBg  = topBadge
    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
    : 'bg-gradient-to-br from-primary/70 to-primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-card-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden"
    >
      {topBadge && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent pointer-events-none" />
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {newBadge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
            🎉 புதியவர்
          </span>
        )}
        {topBadge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <Star className="w-2.5 h-2.5 fill-amber-500 stroke-none" /> சிறப்பு நன்கொடையாளர்
          </span>
        )}
        {donor.anonymous && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
            🔒 Anonymous
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {donor.anonymous ? (
            <span className="text-lg">🙏</span>
          ) : (
            <span className="text-white font-bold text-sm">{initials(donor.donorName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-foreground text-sm leading-tight truncate">{name}</div>
          {donor.place && !donor.anonymous && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{donor.place}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between pt-1 border-t border-border/50">
        <div>
          {showAmount ? (
            <div className="text-lg font-bold text-primary">{fmt(Number(donor.amount))}</div>
          ) : (
            <div className="text-lg font-bold text-muted-foreground/40">₹ ••••••</div>
          )}
          <div className="text-[10px] text-muted-foreground mt-0.5">📅 {dateStr(donor.reviewedAt)}</div>
        </div>
        <div className="text-2xl opacity-20 font-bold text-muted-foreground">#{rank}</div>
      </div>
      {donor.message && !donor.anonymous && (
        <div className="bg-secondary/10 border-l-2 border-secondary/40 rounded-r-xl px-3 py-2">
          <p className="text-xs text-foreground/70 italic leading-relaxed break-words">
            "{donor.message}"
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ── Donor List Row ──────────────────────────────────────────────────────── */
function DonorListRow({ donor, rank, showAmount, stripe }: { donor: Donor; rank: number; showAmount: boolean; stripe: boolean }) {
  const name     = displayName(donor);
  const newBadge = isNew(donor.reviewedAt);
  const topBadge = isTop(donor.amount, TOP_AMOUNT);
  const avatarBg = topBadge
    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
    : 'bg-gradient-to-br from-primary/70 to-primary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-primary/5 ${stripe ? 'bg-muted/20' : ''}`}
    >
      {/* Rank */}
      <div className="w-7 text-center text-xs font-bold text-muted-foreground/50 flex-shrink-0">
        #{rank}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        {donor.anonymous ? (
          <span className="text-base">🙏</span>
        ) : (
          <span className="text-white font-bold text-xs">{initials(donor.donorName)}</span>
        )}
      </div>

      {/* Name + place */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{name}</span>
          {newBadge && (
            <span className="inline-flex items-center text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 whitespace-nowrap">🎉 புதியவர்</span>
          )}
          {topBadge && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
              <Star className="w-2 h-2 fill-amber-500 stroke-none" /> சிறப்பு
            </span>
          )}
        </div>
        {donor.place && !donor.anonymous && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{donor.place}</span>
          </div>
        )}
        {donor.message && !donor.anonymous && (
          <p className="text-xs text-muted-foreground italic mt-0.5 truncate">"{donor.message}"</p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {showAmount ? (
          <div className="text-sm font-bold text-primary">{fmt(Number(donor.amount))}</div>
        ) : (
          <div className="text-sm font-bold text-muted-foreground/30">₹ •••</div>
        )}
        <div className="text-[10px] text-muted-foreground mt-0.5">{dateStr(donor.reviewedAt)}</div>
      </div>
    </motion.div>
  );
}

/* ── Podium Card (top 3) ─────────────────────────────────────────────────── */
function PodiumCard({ donor, rank, showAmount }: { donor: Donor; rank: number; showAmount: boolean }) {
  const m    = MEDAL_META[rank];
  const name = displayName(donor);

  return (
    <div className={`border-2 ${m.border} bg-gradient-to-br ${m.bg} rounded-2xl p-5 text-center shadow-md relative overflow-hidden`}>
      <div className="text-4xl mb-2">{m.emoji}</div>
      <div className={`font-bold text-sm mb-0.5 truncate ${m.text}`}>{name}</div>
      {donor.place && !donor.anonymous && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />{donor.place}
        </div>
      )}
      {showAmount ? (
        <div className="text-xl font-bold text-primary mt-1">{fmt(Number(donor.amount))}</div>
      ) : (
        <div className="text-xl font-bold text-muted-foreground/30 mt-1">₹ •••</div>
      )}
      <div className="text-[10px] text-muted-foreground mt-1.5">{dateStr(donor.reviewedAt)}</div>
      {donor.message && !donor.anonymous && (
        <div className="mt-3 text-[10px] italic text-muted-foreground leading-relaxed px-1 break-words">
          "{donor.message}"
        </div>
      )}
      {isNew(donor.reviewedAt) && (
        <span className="absolute top-2 right-2 text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
      )}
    </div>
  );
}

/* ── Main DonorWall ──────────────────────────────────────────────────────── */
type SortKey = 'date_asc' | 'date_desc' | 'amount_desc' | 'amount_asc';

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
  const [viewMode,    setViewMode]    = useState<ViewMode>('card');

  const top3 = useMemo(() =>
    [...donors].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, Math.min(3, donors.length)),
  [donors]);
  const top3Ids = useMemo(() => new Set(top3.map(d => d.id)), [top3]);

  // Stable chronological serial numbers — #1 = earliest donor, regardless of current sort
  const serialMap = useMemo(() => {
    const sorted = [...donors].sort(
      (a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime()
    );
    const m = new Map<number, number>();
    sorted.forEach((d, i) => m.set(d.id, i + 1));
    return m;
  }, [donors]);

  const filtered = useMemo(() => {
    let list = donors.filter(d => !top3Ids.has(d.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        (!d.anonymous && d.donorName.toLowerCase().includes(q)) ||
        (d.place?.toLowerCase().includes(q))
      );
    }
    if (sort === 'amount_desc') list = [...list].sort((a, b) => Number(b.amount) - Number(a.amount));
    else if (sort === 'amount_asc') list = [...list].sort((a, b) => Number(a.amount) - Number(b.amount));
    else if (sort === 'date_desc') list = [...list].sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
    else /* date_asc */ list = [...list].sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
    return list;
  }, [donors, top3Ids, search, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const totalNew = donors.filter(d => isNew(d.reviewedAt)).length;

  return (
    <div className="space-y-10">

      {/* ── Stats bar ── */}
      {donors.length > 0 && stats && (
        <div className="flex flex-wrap items-center justify-center gap-6 bg-primary/5 border border-primary/15 rounded-2xl px-6 py-4">
          {[
            { value: donors.length.toLocaleString('en-IN'), label: 'நன்கொடையாளர்கள்' },
            { value: fmt(stats.totalRaised),                label: 'மொத்தம் திரட்டப்பட்டது' },
            ...(totalNew > 0 ? [{ value: totalNew.toString(), label: 'இந்த வாரம் சேர்ந்தவர்கள்' }] : []),
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-8 bg-border hidden sm:block" />}
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Top 3 Podium ── */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif font-bold text-foreground text-lg flex items-center gap-2">
              🏆 நன்கொடையாளர்கள்
            </h4>
            <button
              onClick={() => setShowAmounts(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors min-h-[36px]"
            >
              {showAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAmounts ? 'தொகை மறை' : 'தொகை காட்டு'}
            </button>
          </div>
          <div className={`grid gap-4 ${
            top3.length === 1 ? 'grid-cols-1 max-w-xs mx-auto'
            : top3.length === 2 ? 'grid-cols-2 max-w-md mx-auto'
            : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {top3.map((d, i) => (
              <PodiumCard key={d.id} donor={d} rank={i} showAmount={showAmounts} />
            ))}
          </div>
        </div>
      )}

      {/* ── Search + Sort + View toggle ── */}
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); setPage(1); }}
                className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="date_asc">தேதி வரிசை (பழையது முதல்)</option>
                <option value="date_desc">சமீபத்தியது முதல்</option>
                <option value="amount_desc">அதிக தொகை முதல்</option>
                <option value="amount_asc">குறைந்த தொகை முதல்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
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

      {/* ── Results ── */}
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
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {visible.map((d, idx) => (
                  <DonorCard key={d.id} donor={d} rank={serialMap.get(d.id) ?? (top3.length + idx + 1)} showAmount={showAmounts} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
                <div className="w-7 text-center">#</div>
                <div className="w-9 flex-shrink-0" />
                <div className="flex-1">பெயர் / ஊர்</div>
                <div className="text-right flex-shrink-0 w-28">தொகை / தேதி</div>
              </div>
              <AnimatePresence mode="popLayout">
                {visible.map((d, idx) => (
                  <DonorListRow
                    key={d.id}
                    donor={d}
                    rank={serialMap.get(d.id) ?? (top3.length + idx + 1)}
                    showAmount={showAmounts}
                    stripe={idx % 2 === 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பதிவுகள் உள்ளன)
              </button>
            </motion.div>
          )}
        </>
      ) : null}

      {/* Empty state */}
      {donors.length === 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-14 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <p className="text-muted-foreground font-medium">
            முதல் நன்கொடையாளர் ஆக வாய்ப்பு உங்களுக்கே!
          </p>
        </div>
      )}

      {/* ── In-kind contributions ── */}
      {inKindContributions.length > 0 && (
        <InKindWall contributions={inKindContributions} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IN-KIND WALL
   ═══════════════════════════════════════════════════════════════════════════ */

const IK_PAGE_SIZE = 12;
const IK_MEDAL = [
  { emoji: '🥇', bg: 'from-yellow-50 to-amber-100',  border: 'border-amber-300',  text: 'text-amber-700'  },
  { emoji: '🥈', bg: 'from-slate-50 to-slate-100',   border: 'border-slate-300',  text: 'text-slate-600'  },
  { emoji: '🥉', bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
];

/* ── In-Kind Podium Card ─────────────────────────────────────────────────── */
function InKindPodiumCard({ c, rank }: { c: InKindContribution; rank: number }) {
  const m = IK_MEDAL[rank];
  return (
    <div className={`border-2 ${m.border} bg-gradient-to-br ${m.bg} rounded-2xl p-5 text-center shadow-md relative overflow-hidden`}>
      <div className="text-4xl mb-2">{m.emoji}</div>
      <div className={`font-bold text-sm mb-0.5 truncate ${m.text}`}>{c.donorName}</div>
      {c.place && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />{c.place}
        </div>
      )}
      <div className="text-sm font-semibold text-primary mt-1 leading-snug px-1 break-words">
        {c.description}
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">{dateStr(c.contributedAt)}</div>
      {isNew(c.contributedAt) && (
        <span className="absolute top-2 right-2 text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
      )}
    </div>
  );
}

/* ── In-Kind Card ────────────────────────────────────────────────────────── */
function InKindCard({ c, rank }: { c: InKindContribution; rank: number }) {
  const newBadge = isNew(c.contributedAt);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-card-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden"
    >
      {newBadge && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
            🎉 புதியவர்
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">{initials(c.donorName)}</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-foreground text-sm leading-tight truncate">{c.donorName}</div>
          {c.place && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{c.place}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between pt-1 border-t border-border/50">
        <div className="min-w-0 pr-2">
          <div className="text-sm font-semibold text-primary leading-snug break-words">{c.description}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">📅 {dateStr(c.contributedAt)}</div>
        </div>
        <div className="text-2xl opacity-20 font-bold text-muted-foreground flex-shrink-0">#{rank}</div>
      </div>
    </motion.div>
  );
}

/* ── In-Kind List Row ────────────────────────────────────────────────────── */
function InKindListRow({ c, rank, stripe }: { c: InKindContribution; rank: number; stripe: boolean }) {
  const newBadge = isNew(c.contributedAt);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-orange-50/60 ${stripe ? 'bg-muted/20' : ''}`}
    >
      {/* Rank */}
      <div className="w-7 text-center text-xs font-bold text-muted-foreground/50 flex-shrink-0">
        #{rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white font-bold text-xs">{initials(c.donorName)}</span>
      </div>

      {/* Name + place */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{c.donorName}</span>
          {newBadge && (
            <span className="inline-flex items-center text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 whitespace-nowrap">🎉 புதியவர்</span>
          )}
        </div>
        {c.place && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{c.place}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="hidden sm:block flex-1 min-w-0 px-2">
        <p className="text-xs text-primary font-medium truncate">{c.description}</p>
      </div>

      {/* Date */}
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-medium text-foreground">{dateStr(c.contributedAt)}</div>
        {/* Show description below date on mobile */}
        <p className="text-[10px] text-primary font-medium sm:hidden truncate max-w-[100px]">{c.description}</p>
      </div>
    </motion.div>
  );
}

/* ── InKindWall ──────────────────────────────────────────────────────────── */
type IKSort = 'date_asc' | 'date_desc' | 'name_asc';

function InKindWall({ contributions }: { contributions: InKindContribution[] }) {
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState<IKSort>('date_asc');
  const [page,     setPage]     = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const top3 = useMemo(() =>
    [...contributions]
      .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime())
      .slice(0, Math.min(3, contributions.length)),
  [contributions]);
  const top3Ids = useMemo(() => new Set(top3.map(c => c.id)), [top3]);

  // Stable chronological serial numbers — #1 = earliest contribution
  const ikSerialMap = useMemo(() => {
    const sorted = [...contributions].sort(
      (a, b) => new Date(a.contributedAt).getTime() - new Date(b.contributedAt).getTime()
    );
    const m = new Map<number, number>();
    sorted.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [contributions]);

  const filtered = useMemo(() => {
    let list = contributions.filter(c => !top3Ids.has(c.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.donorName.toLowerCase().includes(q) ||
        c.place?.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (sort === 'name_asc') list = [...list].sort((a, b) => a.donorName.localeCompare(b.donorName, 'ta'));
    else if (sort === 'date_desc') list = [...list].sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime());
    else /* date_asc */ list = [...list].sort((a, b) => new Date(a.contributedAt).getTime() - new Date(b.contributedAt).getTime());
    return list;
  }, [contributions, top3Ids, search, sort]);

  const visible = filtered.slice(0, page * IK_PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const totalNew = contributions.filter(c => isNew(c.contributedAt)).length;

  return (
    <div className="space-y-10 pt-6 border-t border-border/40">

      {/* Section heading */}
      <div className="text-center">
        <h3 className="font-serif font-bold text-2xl text-foreground flex items-center justify-center gap-2">
          🎁 பொருள் நன்கொடையாளர்கள்
        </h3>
        <p className="text-sm text-muted-foreground mt-1">பொருளால் ஆலயத்திற்கு உதவியவர்கள்</p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 bg-orange-50 border border-orange-200/60 rounded-2xl px-6 py-4">
        {[
          { value: contributions.length.toLocaleString('en-IN'), label: 'பொருள் நன்கொடையாளர்கள்' },
          ...(totalNew > 0 ? [{ value: totalNew.toString(), label: 'இந்த வாரம் சேர்ந்தவர்கள்' }] : []),
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <div className="w-px h-8 bg-border hidden sm:block" />}
            <div className="text-center">
              <div className="text-xl font-bold text-orange-700">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div>
          <h4 className="font-serif font-bold text-foreground text-lg flex items-center gap-2 mb-4">
            🏆 பொருள் நன்கொடையாளர்கள்
          </h4>
          <div className={`grid gap-4 ${
            top3.length === 1 ? 'grid-cols-1 max-w-xs mx-auto'
            : top3.length === 2 ? 'grid-cols-2 max-w-md mx-auto'
            : 'grid-cols-1 sm:grid-cols-3'
          }`}>
            {top3.map((c, i) => (
              <InKindPodiumCard key={c.id} c={c} rank={i} />
            ))}
          </div>
        </div>
      )}

      {/* Search + Sort + View toggle */}
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as IKSort); setPage(1); }}
                className="appearance-none w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background cursor-pointer"
              >
                <option value="date_asc">தேதி வரிசை (பழையது முதல்)</option>
                <option value="date_desc">சமீபத்தியது முதல்</option>
                <option value="name_asc">பெயர் வரிசையில்</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
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
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {visible.map((c, idx) => (
                  <InKindCard key={c.id} c={c} rank={ikSerialMap.get(c.id) ?? (top3.length + idx + 1)} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
                <div className="w-7 text-center">#</div>
                <div className="w-9 flex-shrink-0" />
                <div className="flex-1">பெயர் / ஊர்</div>
                <div className="hidden sm:block flex-1">பொருள்</div>
                <div className="text-right flex-shrink-0">தேதி</div>
              </div>
              <AnimatePresence mode="popLayout">
                {visible.map((c, idx) => (
                  <InKindListRow
                    key={c.id}
                    c={c}
                    rank={ikSerialMap.get(c.id) ?? (top3.length + idx + 1)}
                    stripe={idx % 2 === 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {hasMore && (
            <motion.div className="text-center" variants={fadeUpVariant}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 bg-card border border-card-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                மேலும் காண்க ({filtered.length - visible.length} பதிவுகள் உள்ளன)
              </button>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}
