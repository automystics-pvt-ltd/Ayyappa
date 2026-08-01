/**
 * Visual smoke test: Contributions row at 320 px (smallest Android phones)
 * Verifies action buttons stack below donor text without horizontal scroll.
 */

import { Gift, Receipt, Copy, Check, CheckCircle2, Pencil, Trash2 } from "lucide-react";

const WhatsAppIcon = () => (
  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function ContributionRow({ hasToken, isActive, longName }: { hasToken: boolean; isActive: boolean; longName?: boolean }) {
  const donorName = longName ? "Ramasubramanian Venkatasubramanian" : "Saravanan Kumar";
  const place = "Vadamadurai";
  const description = "25 bags of cement donated for construction";
  const date = "15 Jun 2026";

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm ${!isActive ? 'opacity-50' : ''}`}>
      {/* Top row: icon + text */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 break-words">{donorName}</span>
            <span className="text-xs text-gray-500">📍 {place}</span>
            {!isActive && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{date}</p>
        </div>
      </div>
      {/* Action buttons — stacked below text on small screens, pl-14 aligns past icon */}
      <div className="flex items-center gap-2 flex-wrap mt-3 pl-14">
        {hasToken && (
          <>
            <a href="#" title="View Receipt"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-orange-200 flex items-center justify-center hover:bg-orange-50 transition-colors">
              <Receipt className="w-4 h-4 text-orange-500" />
            </a>
            <button title="Copy link"
              className="min-w-[44px] min-h-[44px] rounded-lg border border-orange-200 flex items-center justify-center gap-1 px-2 hover:bg-orange-50 transition-colors">
              <Copy className="w-4 h-4 text-orange-500" />
            </button>
            <a href="#" title="Share on WhatsApp"
              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-green-200 flex items-center justify-center hover:bg-green-50 transition-colors">
              <WhatsAppIcon />
            </a>
          </>
        )}
        <button title="Toggle visibility"
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </button>
        <button title="Edit"
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
        <button title="Delete"
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export default function ContributionRow320() {
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Simulate 320px phone screen */}
      <div className="mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden" style={{ width: 320 }}>
        {/* Status bar simulation */}
        <div className="bg-orange-600 px-4 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-semibold">Admin · In-kind Contributions</span>
          <span className="text-white/70 text-xs">320px</span>
        </div>

        <div className="p-3 space-y-3 bg-gray-50">
          {/* Row 1: active, with receipt token (all 6 buttons) */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">All 6 buttons (with receipt)</p>
            <ContributionRow hasToken={true} isActive={true} />
          </div>

          {/* Row 2: active, no receipt token (3 buttons) */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">3 buttons (no receipt yet)</p>
            <ContributionRow hasToken={false} isActive={true} />
          </div>

          {/* Row 3: hidden/inactive with long name */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 pl-1">Long name + hidden badge</p>
            <ContributionRow hasToken={true} isActive={false} longName={true} />
          </div>
        </div>

        {/* Ruler to confirm no horizontal scroll */}
        <div className="bg-white border-t border-gray-100 px-3 py-2">
          <div className="flex justify-between text-[9px] text-gray-400">
            <span>0px</span>
            <span>160px</span>
            <span>320px</span>
          </div>
          <div className="h-1 bg-gradient-to-r from-orange-200 to-orange-500 rounded-full mt-0.5" />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">Contributions row layout at 320 px viewport</p>
    </div>
  );
}
