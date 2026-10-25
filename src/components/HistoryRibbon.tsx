import React, { useState } from 'react';
import { RoundHistoryItem } from '../types';
import { Clock, ShieldCheck, X } from 'lucide-react';

interface HistoryRibbonProps {
  history: RoundHistoryItem[];
}

export const HistoryRibbon: React.FC<HistoryRibbonProps> = ({ history }) => {
  const [selectedItem, setSelectedItem] = useState<RoundHistoryItem | null>(null);

  const getBadgeStyle = (mult: number) => {
    if (mult >= 10.0) {
      return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400 hover:border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black scale-105';
    }
    if (mult >= 2.0) {
      return 'bg-purple-950/60 text-purple-300 border-purple-500/50 hover:border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    }
    return 'bg-blue-950/60 text-cyan-300 border-blue-500/50 hover:border-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.25)]';
  };

  const reversed = [...history].slice(-15).reverse();

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/40 border border-slate-800/80 p-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 whitespace-nowrap pr-1 border-r border-slate-800">
          <Clock className="h-3 w-3 text-rose-500" />
          <span>হিস্ট্রি:</span>
        </div>

        {reversed.map((item, idx) => (
          <button
            key={`${item.roundId}-${idx}`}
            onClick={() => setSelectedItem(item)}
            className={`font-numeric cursor-pointer whitespace-nowrap rounded-lg border px-2 py-0.5 text-xs font-black transition-all hover:scale-105 active:scale-95 ${getBadgeStyle(
              item.multiplier
            )}`}
          >
            {item.multiplier.toFixed(2)}x
          </button>
        ))}
      </div>

      {/* Provably Fair Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">প্রুভাবলি ফেয়ার ভেরিফিকেশন (Round #{selectedItem.roundId})</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">ফাইনাল ক্র্যাশ মাল্টিপ্লায়ার:</span>
                <div className="font-numeric text-3xl font-extrabold text-amber-400 mt-0.5">
                  {selectedItem.multiplier.toFixed(2)}x
                </div>
              </div>

              <div>
                <span className="text-slate-400">রাউন্ডের সময়:</span>
                <div className="font-semibold text-slate-200 mt-0.5">{selectedItem.crashedAt}</div>
              </div>

              <div>
                <span className="text-slate-400">ক্রিপ্টোগ্রাফিক হ্যাশ (SHA-256):</span>
                <div className="font-mono text-[10px] break-all bg-black/60 p-2 rounded-lg border border-slate-800 text-slate-300 mt-1">
                  {selectedItem.hash}
                </div>
              </div>

              <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3 text-[11px] text-emerald-300/90 leading-relaxed">
                ✓ এই রাউন্ডের ফলাফল ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত ও নিরপেক্ষ অ্যালগরিদম দ্বারা নির্ধারিত হয়েছে। কোনো তৃতীয় পক্ষ দ্বারা এটি পরিবর্তনযোগ্য নয়।
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
