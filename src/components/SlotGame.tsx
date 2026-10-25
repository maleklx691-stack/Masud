import React, { useState, useEffect, useRef } from 'react';
import { User, BetRecord } from '../types';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCw, 
  Zap, 
  Trophy, 
  Flame, 
  Info, 
  Volume2, 
  VolumeX, 
  Coins, 
  History as HistoryIcon,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface SlotGameProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
}

// 7 Luxury Casino Symbols with high payout weights
interface SlotSymbol {
  id: string;
  name: string;
  char: string;
  color: string;
  glow: string;
  multiplier3: number; // 3 of a kind
  multiplier2: number; // 2 of a kind (for high tier)
  description: string;
}

const SYMBOLS: SlotSymbol[] = [
  { id: 'seven', name: 'Lucky 7', char: '7️⃣', color: 'text-rose-500', glow: 'rgba(244,63,94,0.6)', multiplier3: 50, multiplier2: 5, description: 'জ্যাকপট ৭ (৫০x)' },
  { id: 'diamond', name: 'Diamond', char: '💎', color: 'text-cyan-400', glow: 'rgba(34,211,238,0.6)', multiplier3: 25, multiplier2: 3, description: 'হীরা (২৫x)' },
  { id: 'bell', name: 'Golden Bell', char: '🔔', color: 'text-amber-400', glow: 'rgba(251,191,36,0.6)', multiplier3: 15, multiplier2: 2, description: 'স্বর্ণ ঘণ্টা (১৫x)' },
  { id: 'crown', name: 'Crown', char: '👑', color: 'text-yellow-300', glow: 'rgba(253,224,71,0.6)', multiplier3: 10, multiplier2: 1.5, description: 'রাজকীয় মুকুট (১০x)' },
  { id: 'cherry', name: 'Cherry', char: '🍒', color: 'text-red-400', glow: 'rgba(248,113,113,0.5)', multiplier3: 6, multiplier2: 1.2, description: 'চেরি (৬x)' },
  { id: 'lemon', name: 'Lemon', char: '🍋', color: 'text-lime-400', glow: 'rgba(163,230,53,0.5)', multiplier3: 4, multiplier2: 1.0, description: 'লেবু (৪x)' },
  { id: 'bar', name: 'Gold BAR', char: '⭐', color: 'text-indigo-300', glow: 'rgba(165,180,252,0.5)', multiplier3: 3, multiplier2: 0.8, description: 'স্টার (৩x)' },
];

const BET_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];

interface SpinHistory {
  id: string;
  time: string;
  bet: number;
  reels: string[];
  win: number;
  multiplier: number;
}

export const SlotGame: React.FC<SlotGameProps> = ({ user, onUserUpdated, onOpenWallet }) => {
  const [betAmount, setBetAmount] = useState<number>(20);
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    SYMBOLS[0],
    SYMBOLS[1],
    SYMBOLS[2],
  ]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningReel, setSpinningReel] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [lastMultiplier, setLastMultiplier] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([]);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  const userRef = useRef(user);
  userRef.current = user;

  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup all timers when navigating away or unmounting
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((t) => clearTimeout(t));
      activeTimersRef.current.forEach((t) => clearInterval(t));
    };
  }, []);

  // Sound effects helper
  const handleSpinClickSound = () => {
    sounds.playReelClick();
  };

  // Check paytable win
  const calculatePayout = (r1: SlotSymbol, r2: SlotSymbol, r3: SlotSymbol, bet: number) => {
    // 3 of a kind
    if (r1.id === r2.id && r2.id === r3.id) {
      const mult = r1.multiplier3;
      return { win: bet * mult, multiplier: mult, type: 'triple', name: r1.name };
    }

    // 2 of a kind (first two, or outer two, or last two matching)
    if (r1.id === r2.id || r2.id === r3.id || r1.id === r3.id) {
      const matchSymbol = (r1.id === r2.id || r1.id === r3.id) ? r1 : r2;
      const mult = matchSymbol.multiplier2;
      return { win: bet * mult, multiplier: mult, type: 'double', name: matchSymbol.name };
    }

    return { win: 0, multiplier: 0, type: 'none', name: '' };
  };

  // Trigger spin logic
  const handleSpin = () => {
    if (isSpinningRef.current) return;

    const currentUser = userRef.current;
    if (betAmount > currentUser.balance) {
      alert('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ওয়ালেট থেকে ডিপোজিট করুন।');
      setAutoSpin(false);
      return;
    }

    // Deduct bet amount immediately from user
    const balanceAfterBet = currentUser.balance - betAmount;
    const newWagered = (currentUser.totalWagered || 0) + betAmount;
    const userAfterBet: User = {
      ...currentUser,
      balance: balanceAfterBet,
      totalWagered: newWagered,
    };
    storage.updateUser(userAfterBet);
    onUserUpdated(userAfterBet);
    userRef.current = userAfterBet;

    setIsSpinning(true);
    isSpinningRef.current = true;
    setSpinningReel([true, true, true]);
    setWinMessage(null);
    setLastWin(0);
    setLastMultiplier(0);

    // Get winrate mode from game configuration
    const config = storage.getConfig();
    const winMode = config.winRateMode || 'medium';

    // Weighted selection based on win rate mode
    const pickSymbol = () => {
      const r = Math.random();
      if (winMode === 'ultra') {
        if (r < 0.25) return SYMBOLS[0]; // 777
        if (r < 0.50) return SYMBOLS[1]; // Diamond
        if (r < 0.75) return SYMBOLS[2]; // Bell
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      } else if (winMode === 'high') {
        if (r < 0.15) return SYMBOLS[0];
        if (r < 0.35) return SYMBOLS[1];
        if (r < 0.55) return SYMBOLS[2];
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      } else if (winMode === 'low') {
        const lowPool = [SYMBOLS[3], SYMBOLS[4], SYMBOLS[5], SYMBOLS[6], SYMBOLS[6], SYMBOLS[5]];
        if (r < 0.15) return SYMBOLS[Math.floor(Math.random() * 3)];
        return lowPool[Math.floor(Math.random() * lowPool.length)];
      }

      return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    };

    // Determine outcomes beforehand
    let finalR1 = pickSymbol();
    let finalR2 = pickSymbol();
    let finalR3 = pickSymbol();

    // Small boost probability for 3-of-a-kind if winRate is high or ultra
    if (winMode === 'ultra' && Math.random() < 0.40) {
      finalR2 = finalR1;
      finalR3 = finalR1;
    } else if (winMode === 'high' && Math.random() < 0.25) {
      finalR2 = finalR1;
      finalR3 = finalR1;
    } else if (Math.random() < 0.12) {
      finalR2 = finalR1;
      finalR3 = finalR1;
    }

    // Interval ticker for reel visual blur
    const ticker = setInterval(() => {
      sounds.playReelClick();
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 85);
    activeTimersRef.current.push(ticker);

    // Stop Reel 1 at 900ms
    const t1 = setTimeout(() => {
      setReels((prev) => [finalR1, prev[1], prev[2]]);
      setSpinningReel([false, true, true]);
      sounds.playReelStop();
    }, 900);
    activeTimersRef.current.push(t1);

    // Stop Reel 2 at 1400ms
    const t2 = setTimeout(() => {
      setReels((prev) => [finalR1, finalR2, prev[2]]);
      setSpinningReel([false, false, true]);
      sounds.playReelStop();
    }, 1400);
    activeTimersRef.current.push(t2);

    // Stop Reel 3 at 1900ms and calculate win
    const t3 = setTimeout(() => {
      clearInterval(ticker);
      setReels([finalR1, finalR2, finalR3]);
      setSpinningReel([false, false, false]);
      sounds.playReelStop();
      setIsSpinning(false);
      isSpinningRef.current = false;

      const result = calculatePayout(finalR1, finalR2, finalR3, betAmount);

      const latestUser = userRef.current;

      if (result.win > 0) {
        sounds.playSlotWin();
        setLastWin(result.win);
        setLastMultiplier(result.multiplier);

        if (result.type === 'triple') {
          setWinMessage(`🔥 মেগা জ্যাকপট! ৩টি ${result.name} মিলেছে (${result.multiplier}x)`);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'],
          });
        } else {
          setWinMessage(`🎉 উইন! ২টি ${result.name} ম্যাচ হয়েছে (${result.multiplier}x)`);
        }

        // Credit user account
        const updatedUser: User = {
          ...latestUser,
          balance: latestUser.balance + result.win,
          totalWon: (latestUser.totalWon || 0) + result.win,
        };
        storage.updateUser(updatedUser);
        onUserUpdated(updatedUser);
        userRef.current = updatedUser;

        // Record Bet history in user profile
        const betRecord: BetRecord = {
          id: `slot_${Date.now()}`,
          roundId: Date.now() % 100000,
          username: latestUser.username,
          betAmount: betAmount,
          cashoutMult: result.multiplier,
          winAmount: result.win,
          status: 'won',
          panel: 1,
          createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
        storage.addBetRecord(betRecord);
      } else {
        setWinMessage('পরের বার চেষ্টা করুন!');
        const betRecord: BetRecord = {
          id: `slot_${Date.now()}`,
          roundId: Date.now() % 100000,
          username: latestUser.username,
          betAmount: betAmount,
          cashoutMult: 0,
          winAmount: 0,
          status: 'lost',
          panel: 1,
          createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
        storage.addBetRecord(betRecord);
      }

      // Add to local spin history ribbon
      const historyItem: SpinHistory = {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString(),
        bet: betAmount,
        reels: [finalR1.char, finalR2.char, finalR3.char],
        win: result.win,
        multiplier: result.multiplier,
      };
      setSpinHistory((prev) => [historyItem, ...prev.slice(0, 19)]);

      // Auto spin chain
      if (autoSpinRef.current) {
        setAutoSpinCount((c) => {
          const next = c + 1;
          if (next >= 10) {
            setAutoSpin(false);
            return 0;
          }
          const nextSpinTimer = setTimeout(() => {
            if (autoSpinRef.current && !isSpinningRef.current) handleSpin();
          }, 1200);
          activeTimersRef.current.push(nextSpinTimer);
          return next;
        });
      }
    }, 1900);
    activeTimersRef.current.push(t3);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Banner & Header */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-slate-900 border border-amber-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/40">
              <Sparkles className="h-6 w-6 text-yellow-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-300 to-yellow-200">
                  ROYAL 777 SLOTS
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LIVE CASINO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ৩টি আইটেম মিলিয়ে পান ৫০ গুণ জ্যাকপট পর্যন্ত নগদ টাকা!
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaytable(!showPaytable)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-amber-500 transition"
            >
              <Info className="h-3.5 w-3.5 text-amber-400" />
              <span>পে-টেবিল (উইন রুলস)</span>
            </button>
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>ব্যালেন্স: ৳{user.balance.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Paytable Modal / Collapsible */}
      {showPaytable && (
        <div className="rounded-2xl bg-slate-900/95 border border-amber-500/40 p-4 sm:p-5 shadow-xl animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Trophy className="h-4 w-4" />
              <span>পে-টেবিল মাল্টিপ্লায়ার (Paytable Multipliers)</span>
            </div>
            <button
              onClick={() => setShowPaytable(false)}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
            >
              ✕ বন্ধ করুন
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-3">
            {SYMBOLS.map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-slate-800 hover:border-amber-500/50 transition"
              >
                <span className="text-3xl mb-1 filter drop-shadow">{s.char}</span>
                <span className="text-xs font-bold text-slate-200">{s.name}</span>
                <span className="text-[11px] font-black text-amber-400 mt-1">
                  ৩টি = {s.multiplier3}x
                </span>
                <span className="text-[10px] text-slate-400">
                  ২টি = {s.multiplier2}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot Machine Display Machine Box with Real Casino Golden Bevel Frame */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#181f2e] via-[#0d121c] to-[#080b12] border-2 border-amber-500/60 p-4 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Machine Neon Top & Bottom Glowing Lamps */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-2.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm animate-pulse" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-2.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent blur-sm animate-pulse" />

        {/* Real Casino Flashing Light Bulbs Row */}
        <div className="flex justify-between items-center px-4 mb-3">
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i % 2 === 0
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
              }`}
            />
          ))}
        </div>

        {/* Win Alert Banner */}
        <div className="h-14 flex items-center justify-center mb-4">
          {winMessage ? (
            <div
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-sm sm:text-base font-black tracking-wide shadow-2xl animate-bounce ${
                lastWin > 0
                  ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white border-2 border-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-800/95 text-slate-300 border border-slate-700'
              }`}
            >
              {lastWin > 0 && <Award className="h-6 w-6 text-yellow-200 animate-spin" />}
              <span>{winMessage}</span>
              {lastWin > 0 && (
                <span className="bg-black/50 px-2.5 py-1 rounded-xl text-amber-300 text-sm font-numeric font-black shadow-inner">
                  +৳{lastWin.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-bold bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-inner">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>স্পিন বাটনে চাপ দিয়ে রিল ঘুরান এবং ৫০ গুণ মেগা জ্যাকপট জিতুন!</span>
            </div>
          )}
        </div>

        {/* 3 Reels Display with Casino Bevel & Golden Payline Glass */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto my-2 p-2 sm:p-3 rounded-2xl bg-black/60 border border-amber-500/30 shadow-inner">
          {reels.map((symbol, idx) => {
            const spinning = spinningReel[idx];
            return (
              <div
                key={idx}
                className={`relative flex flex-col items-center justify-center h-44 sm:h-56 rounded-2xl bg-gradient-to-b from-[#0a0d14] via-[#141b2b] to-[#0a0d14] border-2 shadow-inner transition-all overflow-hidden ${
                  spinning
                    ? 'border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)] scale-[0.99]'
                    : 'border-slate-700/80 hover:border-amber-500/60 shadow-lg'
                }`}
              >
                {/* Visual Glass reflection line */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Center Payline Highlight Guide with red laser pointers */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 sm:h-20 bg-amber-500/10 border-y border-amber-400/40 pointer-events-none flex items-center justify-between px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" />
                </div>

                {/* Symbol with Glow */}
                <div
                  className={`text-6xl sm:text-8xl select-none transition-transform duration-100 ${
                    spinning ? 'blur-[2px] scale-95 opacity-75' : 'scale-100 opacity-100 drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]'
                  }`}
                >
                  {symbol.char}
                </div>

                <span className="mt-2 text-[11px] sm:text-xs font-black text-amber-200/90 tracking-wider">
                  {symbol.name}
                </span>

                {/* Reel Number Badge */}
                <span className="absolute top-2 left-2 text-[9px] font-black text-amber-300 bg-black/70 px-2 py-0.5 rounded border border-amber-500/40">
                  REEL {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bet Selection & Action Controls */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 max-w-2xl mx-auto space-y-4">
          {/* Bet Amount Selector */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                বাজির পরিমাণ (Bet Amount):
              </span>
              <span className="text-amber-300 font-numeric text-base font-black">৳{betAmount} BDT</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {BET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  disabled={isSpinning}
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 min-w-[50px] py-2.5 rounded-xl text-xs sm:text-sm font-black transition font-numeric ${
                    betAmount === amt
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 border border-yellow-200'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-white'
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Main Spin Buttons */}
          <div className="flex items-center gap-3">
            {/* Auto Spin Toggle */}
            <button
              onClick={() => {
                if (autoSpin) {
                  setAutoSpin(false);
                  setAutoSpinCount(0);
                } else {
                  setAutoSpin(true);
                  setAutoSpinCount(0);
                  if (!isSpinning) handleSpin();
                }
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black border transition ${
                autoSpin
                  ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.5)] animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{autoSpin ? `অটো চলছে (${10 - autoSpinCount})` : 'অটো স্পিন (১০x)'}</span>
            </button>

            {/* Big Spin Action Button */}
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base sm:text-xl font-black tracking-wider uppercase shadow-2xl transition-all ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-[0_0_35px_rgba(245,158,11,0.45)] active:scale-95 border border-yellow-300/40 cursor-pointer'
              }`}
            >
              <RotateCw className={`h-6 w-6 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'রিল ঘুরছে...' : `স্পিন করুন (৳${betAmount})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spin History & High Payout Ribbon */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <HistoryIcon className="h-4 w-4 text-cyan-400" />
            <span>লাইভ স্পিন হিস্ট্রি (Recent Spins)</span>
          </div>
          <span className="text-[11px] text-slate-400">রিয়েল-টাইম ফলাফল</span>
        </div>

        {spinHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            এখনও কোনো স্পিন খেলা হয়নি। উপরে স্পিন বাটনে ক্লিক করে খেলা শুরু করুন!
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {spinHistory.map((item) => (
              <div
                key={item.id}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  item.win > 0
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                    : 'bg-black/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex tracking-tight text-sm">
                  {item.reels.map((r, i) => (
                    <span key={i}>{r}</span>
                  ))}
                </div>
                <div className="flex flex-col text-[10px]">
                  <span>৳{item.bet}</span>
                  <span className={item.win > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {item.win > 0 ? `+৳${item.win.toFixed(0)}` : '০x'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
