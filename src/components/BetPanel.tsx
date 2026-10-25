import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';

interface BetPanelProps {
  panelIndex: 1 | 2;
  userBalance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  autoCashout: boolean;
  setAutoCashout: (enabled: boolean) => void;
  autoMult: number;
  setAutoMult: (mult: number) => void;
  isBooked: boolean;
  isCashedOut: boolean;
  winAmount: number;
  gameStatus: 'waiting' | 'flying' | 'crashed';
  currentMultiplier: number;
  onPlaceBet: () => void;
  onCancelBet: () => void;
  onCashout: () => void;
}

export const BetPanel: React.FC<BetPanelProps> = ({
  panelIndex,
  userBalance,
  betAmount,
  setBetAmount,
  autoCashout,
  setAutoCashout,
  autoMult,
  setAutoMult,
  isBooked,
  isCashedOut,
  winAmount,
  gameStatus,
  currentMultiplier,
  onPlaceBet,
  onCancelBet,
  onCashout,
}) => {
  const quickAmounts = [10, 50, 100, 500];

  const handleAdjustAmount = (delta: number) => {
    if (isBooked && gameStatus !== 'waiting') return;
    const next = Math.max(10, Math.min(betAmount + delta, 10000));
    setBetAmount(next);
  };

  const handleMultiply = (factor: number) => {
    if (isBooked && gameStatus !== 'waiting') return;
    const next = Math.max(10, Math.min(Math.round(betAmount * factor), 10000));
    setBetAmount(next);
  };

  // Button State rendering
  const renderActionButton = () => {
    // 1. When game is in waiting countdown
    if (gameStatus === 'waiting') {
      if (isBooked) {
        return (
          <button
            onClick={onCancelBet}
            className="w-full h-full min-h-[76px] rounded-2xl bg-gradient-to-b from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-400/40 transition active:scale-95 flex flex-col items-center justify-center p-2 cursor-pointer"
          >
            <span className="text-sm tracking-wider font-black">CANCEL</span>
            <span className="font-numeric text-xs font-bold text-rose-200">৳{betAmount} (বাতিল করুন)</span>
          </button>
        );
      }
      return (
        <button
          onClick={onPlaceBet}
          disabled={userBalance < betAmount}
          className={`w-full h-full min-h-[76px] rounded-2xl text-white font-black shadow-xl transition active:scale-95 flex flex-col items-center justify-center p-2 cursor-pointer ${
            userBalance < betAmount
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-700 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300/40 animate-pulse'
          }`}
        >
          <span className="text-lg tracking-wider drop-shadow-md">BET</span>
          <span className="font-numeric text-xs font-bold text-emerald-100">৳{betAmount.toFixed(0)}</span>
        </button>
      );
    }

    // 2. When game is flying
    if (gameStatus === 'flying') {
      if (isBooked && !isCashedOut) {
        const liveWin = (betAmount * currentMultiplier).toFixed(2);
        return (
          <button
            onClick={onCashout}
            className="w-full h-full min-h-[76px] rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black shadow-[0_0_35px_rgba(245,158,11,0.7)] border-2 border-yellow-200 transition active:scale-95 flex flex-col items-center justify-center p-2 animate-bounce cursor-pointer"
          >
            <span className="text-xs font-black uppercase tracking-wider">CASH OUT</span>
            <span className="font-numeric text-xl font-black leading-tight drop-shadow-sm">৳{liveWin}</span>
            <span className="text-[11px] font-bold opacity-90">@{currentMultiplier.toFixed(2)}x</span>
          </button>
        );
      }

      if (isBooked && isCashedOut) {
        return (
          <div className="w-full h-full min-h-[76px] rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 text-emerald-300 font-extrabold flex flex-col items-center justify-center p-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <span className="flex items-center gap-1 text-xs">
              <Check className="h-4 w-4 text-emerald-400" /> ক্যাশআউট সফল!
            </span>
            <span className="font-numeric text-lg font-black text-emerald-300">
              +৳{winAmount.toFixed(2)}
            </span>
          </div>
        );
      }

      // Flying without bet
      return (
        <div className="w-full h-full min-h-[76px] rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 font-bold text-xs flex flex-col items-center justify-center p-2">
          <span>রাউন্ড চলছে...</span>
          <span className="text-[10px] text-slate-500">পরের রাউন্ডের অপেক্ষা করুন</span>
        </div>
      );
    }

    // 3. When crashed
    if (gameStatus === 'crashed') {
      if (isBooked && isCashedOut) {
        return (
          <div className="w-full h-full min-h-[76px] rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 text-emerald-300 font-extrabold flex flex-col items-center justify-center p-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <span className="text-xs">জয়ী হয়েছেন</span>
            <span className="font-numeric text-lg font-black text-emerald-300">
              +৳{winAmount.toFixed(2)}
            </span>
          </div>
        );
      }
      if (isBooked && !isCashedOut) {
        return (
          <div className="w-full h-full min-h-[76px] rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-rose-300 font-extrabold flex flex-col items-center justify-center p-2 shadow-[0_0_25px_rgba(225,29,72,0.3)]">
            <span className="text-xs">ক্র্যাশ হয়েছে</span>
            <span className="text-xs text-rose-300/90 font-bold">লস্ট (৳{betAmount})</span>
          </div>
        );
      }
      return (
        <div className="w-full h-full min-h-[76px] rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center p-2">
          <span>পরবর্তী রাউন্ড শুরু হচ্ছে...</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 rounded-3xl bg-gradient-to-b from-[#111622]/90 via-[#0d121c]/90 to-[#090d15]/90 border border-slate-700/80 p-3.5 sm:p-4 backdrop-blur-md shadow-2xl flex flex-col gap-3">
      {/* Header with Panel Tag & Auto Cashout Switch */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          বেট প্যানেল #{panelIndex}
        </span>

        {/* Auto Cashout toggle */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 cursor-pointer">
            <span>অটো ক্যাশআউট:</span>
            <input
              type="checkbox"
              checked={autoCashout}
              onChange={(e) => setAutoCashout(e.target.checked)}
              disabled={isBooked && gameStatus !== 'waiting'}
              className="accent-rose-600 h-3.5 w-3.5 cursor-pointer rounded"
            />
          </label>
          {autoCashout && (
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 px-1.5 py-0.5">
              <input
                type="number"
                step="0.1"
                min="1.05"
                max="100"
                value={autoMult}
                onChange={(e) => setAutoMult(Math.max(1.05, parseFloat(e.target.value) || 1.05))}
                disabled={isBooked && gameStatus !== 'waiting'}
                className="w-14 bg-transparent font-numeric text-xs font-bold text-amber-400 text-center focus:outline-none"
              />
              <span className="font-numeric text-xs font-bold text-slate-400">x</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Controls Row: Bet Input and Big Action Button */}
      <div className="grid grid-cols-12 gap-3 items-stretch">
        {/* Left: Number Stepper */}
        <div className="col-span-7 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-700/80 p-1">
            <button
              onClick={() => handleAdjustAmount(-10)}
              disabled={isBooked && gameStatus !== 'waiting'}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 disabled:opacity-50"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-500">৳</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                disabled={isBooked && gameStatus !== 'waiting'}
                className="w-20 bg-transparent text-center font-numeric text-lg font-black text-amber-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleAdjustAmount(10)}
              disabled={isBooked && gameStatus !== 'waiting'}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-4 gap-1">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                disabled={isBooked && gameStatus !== 'waiting'}
                className="font-numeric rounded-lg bg-slate-900 border border-slate-800 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                +{amt}
              </button>
            ))}
          </div>

          {/* Double / Half buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleMultiply(0.5)}
              disabled={isBooked && gameStatus !== 'waiting'}
              className="rounded-lg bg-slate-900/60 border border-slate-800 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              1/2
            </button>
            <button
              onClick={() => handleMultiply(2)}
              disabled={isBooked && gameStatus !== 'waiting'}
              className="rounded-lg bg-slate-900/60 border border-slate-800 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              2X
            </button>
          </div>
        </div>

        {/* Right: Big Bet / Cashout Button */}
        <div className="col-span-5 flex">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};
