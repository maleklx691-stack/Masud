import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, TrendingUp, ShieldCheck, Flame } from 'lucide-react';

const RECENT_WINNERS = [
  { user: 'Rahim***8', game: 'Aviator', win: '৳৪,৮৫০.০০', mult: '12.45x' },
  { user: 'Shakil***3', game: 'Super Ace', win: '৳১৫,৬০০.০০', mult: '31.20x' },
  { user: 'Sabbir***2', game: '777 Slots', win: '৳১২,৫০০.০০', mult: '50.00x' },
  { user: 'Tanvir***9', game: 'Big Small', win: '৳৩,৯২০.০০', mult: '1.96x' },
  { user: 'Mizan***6', game: 'Super Ace', win: '৳৯,৪০০.০০', mult: '18.80x' },
  { user: 'Biplob***4', game: 'Aviator', win: '৳৮,৬২০.০০', mult: '18.90x' },
  { user: 'Fahim***1', game: '777 Slots', win: '৳৬,২০০.০০', mult: '25.00x' },
  { user: 'Hasan***5', game: 'Big Small', win: '৳১,৯৬০.০০', mult: '1.96x' },
  { user: 'Nazmul***7', game: 'Aviator', win: '৳২১,৪০০.০০', mult: '42.80x' },
];

export const RealCasinoTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % RECENT_WINNERS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const current = RECENT_WINNERS[index];

  return (
    <div className="w-full bg-gradient-to-r from-[#0d121c] via-[#141b29] to-[#0d121c] border-y border-amber-500/20 py-1.5 px-3 select-none overflow-hidden shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        {/* Left: Announcement Icon & Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full text-rose-400 font-extrabold text-[10px] tracking-wider uppercase">
            <Flame className="h-3 w-3 text-rose-500 animate-pulse" />
            <span>লাইভ ক্যাশআউট</span>
          </div>
        </div>

        {/* Center: Live Rolling Winner Broadcast */}
        <div className="flex-1 overflow-hidden px-2 flex items-center justify-center">
          <div
            key={index}
            className="flex items-center gap-2 truncate animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <span className="text-slate-400 text-xs">অভিনন্দন</span>
            <span className="font-extrabold text-white font-numeric tracking-wide">
              {current.user}
            </span>
            <span className="text-slate-400 hidden sm:inline">[{current.game}]</span>
            <span className="text-amber-400 font-black font-numeric text-xs bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
              {current.mult}
            </span>
            <span className="font-numeric font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              {current.win} জিতে নিয়েছেন!
            </span>
          </div>
        </div>

        {/* Right: Provably Fair & Live Stat Badge */}
        <div className="hidden md:flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">৯৯.৮% আরটিপি</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>অফিশিয়াল প্রুভাবলি ফেয়ার</span>
          </div>
        </div>
      </div>
    </div>
  );
};
