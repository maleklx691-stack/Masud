import React, { useState, useEffect, useRef } from 'react';
import { User, BigSmallChoice, BigSmallRound, BigSmallBet } from '../types';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audio';
import { 
  getPeriodInfo, 
  getDeterministicRoundResult, 
  getPreviousSynchronizedRounds, 
  ROUND_DURATION_SEC 
} from '../utils/bigSmallEngine';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  Sparkles, 
  Coins, 
  History, 
  TrendingUp, 
  AlertCircle, 
  Flame, 
  CheckCircle2, 
  Award,
  Lock
} from 'lucide-react';

interface BigSmallGameProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
}

const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];

export const BigSmallGame: React.FC<BigSmallGameProps> = ({ user, onUserUpdated, onOpenWallet }) => {
  const [periodInfo, setPeriodInfo] = useState(() => getPeriodInfo());
  const [history, setHistory] = useState<BigSmallRound[]>(() => getPreviousSynchronizedRounds(25));
  const [activeBets, setActiveBets] = useState<BigSmallBet[]>(() => storage.getBigSmallBets());
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(20);
  const [lastResult, setLastResult] = useState<BigSmallRound | null>(() => history[0] || null);
  const [recentWinAnnouncement, setRecentWinAnnouncement] = useState<string | null>(null);

  const prevPeriodIdRef = useRef<string>(periodInfo.periodId);
  const userRef = useRef<User>(user);
  userRef.current = user;

  // Global Synchronized Clock (Runs every 250ms to stay perfectly aligned)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getPeriodInfo();
      setPeriodInfo(current);

      // Period has rotated to a new round!
      if (current.periodId !== prevPeriodIdRef.current) {
        const finishedPeriodId = prevPeriodIdRef.current;
        prevPeriodIdRef.current = current.periodId;

        // Resolve finished round result identically for all users
        const outcome = getDeterministicRoundResult(finishedPeriodId);
        setLastResult(outcome);
        setHistory((prev) => [outcome, ...prev.slice(0, 35)]);

        // Sound effect for round reveal
        sounds.playReelStop();

        // Settle all user bets placed for this finished period
        settleBetsForPeriod(finishedPeriodId, outcome);
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  // Settle user bets placed on the finished period
  const settleBetsForPeriod = (periodId: string, outcome: BigSmallRound) => {
    const allBets = storage.getBigSmallBets();
    const periodBets = allBets.filter((b) => b.periodId === periodId && b.status === 'pending');
    if (periodBets.length === 0) return;

    let totalWonInRound = 0;
    let hasWon = false;

    const updatedBets = allBets.map((b) => {
      if (b.periodId !== periodId || b.status !== 'pending') return b;

      let isWin = false;
      let payoutRate = 1.96; // 1.96x as requested by user

      if (b.choice === 'big' && outcome.size === 'big') {
        isWin = true;
      } else if (b.choice === 'small' && outcome.size === 'small') {
        isWin = true;
      } else if (b.choice === 'green' && outcome.color === 'green') {
        isWin = true;
        payoutRate = 2.0;
      } else if (b.choice === 'red' && outcome.color === 'red') {
        isWin = true;
        payoutRate = 2.0;
      } else if (b.choice === 'violet' && outcome.color === 'violet') {
        isWin = true;
        payoutRate = 4.5;
      }

      if (isWin) {
        const winAmt = Math.round(b.amount * payoutRate * 100) / 100;
        totalWonInRound += winAmt;
        hasWon = true;
        return {
          ...b,
          status: 'won' as const,
          winAmount: winAmt,
          payoutMult: payoutRate,
        };
      } else {
        return {
          ...b,
          status: 'lost' as const,
          winAmount: 0,
        };
      }
    });

    storage.updateBigSmallBets(updatedBets);
    setActiveBets(updatedBets);

    if (hasWon && totalWonInRound > 0) {
      sounds.playSlotWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      const updatedUser: User = {
        ...userRef.current,
        balance: userRef.current.balance + totalWonInRound,
        totalWon: (userRef.current.totalWon || 0) + totalWonInRound,
      };
      storage.updateUser(updatedUser);
      onUserUpdated(updatedUser);

      setRecentWinAnnouncement(
        `🎉 অভিনন্দন! রাউন্ড ${periodId}-এ ১.৯৬ গুণ হারে আপনি ৳${totalWonInRound.toFixed(2)} জিতেছেন!`
      );
    } else {
      setRecentWinAnnouncement(
        `রাউন্ড ${periodId} শেষ হয়েছে। ফলাফল: ${outcome.number} (${outcome.size === 'big' ? 'BIG' : 'SMALL'})`
      );
    }
  };

  // Place a bet on Big, Small, or Color
  const handlePlaceBet = (choice: BigSmallChoice) => {
    sounds.playReelClick();

    if (!periodInfo.canBet) {
      alert('⚠️ সময় শেষ! শেষ ৫ সেকেন্ড বাজি ধরা বন্ধ থাকে। পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন।');
      return;
    }

    if (user.balance < selectedBetAmount) {
      alert('⚠️ আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! ওয়ালেটে টাকা যোগ করুন।');
      onOpenWallet();
      return;
    }

    // Deduct bet amount from user
    const newBalance = user.balance - selectedBetAmount;
    const newWagered = (user.totalWagered || 0) + selectedBetAmount;
    const updatedUser: User = {
      ...user,
      balance: newBalance,
      totalWagered: newWagered,
    };
    storage.updateUser(updatedUser);
    onUserUpdated(updatedUser);

    const newBet: BigSmallBet = {
      id: `bs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      periodId: periodInfo.periodId,
      username: user.username,
      choice,
      amount: selectedBetAmount,
      winAmount: 0,
      status: 'pending',
      payoutMult: 1.96, // 1.96x as requested
      createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };

    storage.saveBigSmallBet(newBet);
    setActiveBets((prev) => [newBet, ...prev.slice(0, 49)]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Banner with Global Sync indicator */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-300">
                  BIG / SMALL (উইন ১.৯৬x)
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  গ্লোবাল সিঙ্ক (LIVE)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সবার জন্য একই রাউন্ড ও একই ফলাফল • জিতে নিন ১.৯৬ গুণ নগদ টাকা!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>ব্যালেন্স: ৳{user.balance.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#101524] via-[#0b0e18] to-[#070911] border border-blue-500/30 p-4 sm:p-6 shadow-2xl space-y-5">
        {/* Period & Live Countdown Timer Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
          {/* Period ID */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">বর্তমান পিরিয়ড:</span>
            <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
              {periodInfo.periodId}
            </span>
          </div>

          {/* Synchronized Countdown Timer */}
          <div className="flex items-center justify-between sm:justify-end sm:gap-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Clock className="h-4 w-4 text-blue-400 animate-spin" />
              <span>সময় বাকি:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xl sm:text-2xl font-black">
              <span className="bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300">00</span>
              <span className="text-slate-500">:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg ${
                  periodInfo.secondsLeft <= 5
                    ? 'bg-rose-600 text-white animate-ping'
                    : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                }`}
              >
                {String(periodInfo.secondsLeft).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Lock Notification or Live Prompt */}
        <div className="text-center h-8 flex items-center justify-center">
          {periodInfo.lockPeriod ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold animate-pulse">
              <Lock className="h-3.5 w-3.5" />
              <span>লক সময়! ফলাফল নির্ধারণ হচ্ছে... পরবর্তী রাউন্ডে বাজি ধরুন।</span>
            </div>
          ) : recentWinAnnouncement ? (
            <span className="text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
              {recentWinAnnouncement}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              বিগ (৫-৯) অথবা স্মল (০-৪) সিলেক্ট করুন এবং জিতে নিন <span className="text-amber-400 font-bold">১.৯৬ গুণ</span> নগদ টাকা!
            </span>
          )}
        </div>

        {/* Big/Small Core Betting Buttons (The Main Game Action) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-2xl mx-auto">
          {/* BIG BUTTON */}
          <button
            disabled={periodInfo.lockPeriod}
            onClick={() => handlePlaceBet('big')}
            className={`group relative flex flex-col items-center justify-center py-7 sm:py-9 rounded-3xl border-2 transition-all overflow-hidden cursor-pointer ${
              periodInfo.lockPeriod
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
                : 'bg-gradient-to-b from-amber-500/25 via-amber-600/10 to-black/40 border-amber-400 hover:border-yellow-300 hover:scale-[1.02] shadow-[0_0_40px_rgba(245,158,11,0.45)] active:scale-95'
            }`}
          >
            <div className="text-3xl sm:text-5xl font-black text-amber-300 tracking-wider font-numeric group-hover:scale-105 transition-transform drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              BIG (বিগ)
            </div>
            <span className="text-xs sm:text-sm font-bold text-amber-100/90 mt-1.5">
              সংখ্যা ৫, ৬, ৭, ৮, ৯
            </span>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-xs sm:text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-yellow-200">
              ১.৯৬x পেআউট
            </div>
          </button>

          {/* SMALL BUTTON */}
          <button
            disabled={periodInfo.lockPeriod}
            onClick={() => handlePlaceBet('small')}
            className={`group relative flex flex-col items-center justify-center py-7 sm:py-9 rounded-3xl border-2 transition-all overflow-hidden cursor-pointer ${
              periodInfo.lockPeriod
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
                : 'bg-gradient-to-b from-blue-500/25 via-blue-600/10 to-black/40 border-blue-400 hover:border-cyan-300 hover:scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.45)] active:scale-95'
            }`}
          >
            <div className="text-3xl sm:text-5xl font-black text-cyan-300 tracking-wider font-numeric group-hover:scale-105 transition-transform drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              SMALL (স্মল)
            </div>
            <span className="text-xs sm:text-sm font-bold text-cyan-100/90 mt-1.5">
              সংখ্যা ০, ১, ২, ৩, ৪
            </span>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs sm:text-sm font-black shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-cyan-200">
              ১.৯৬x পেআউট
            </div>
          </button>
        </div>

        {/* Secondary Color Bets (Green / Violet / Red) */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-xs font-semibold text-slate-400 mb-2">
            অথবা রঙ সিলেক্ট করে বাজি ধরুন:
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              disabled={periodInfo.lockPeriod}
              onClick={() => handlePlaceBet('green')}
              className={`py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition flex flex-col items-center justify-center ${
                periodInfo.lockPeriod
                  ? 'opacity-40 bg-slate-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 active:scale-95'
              }`}
            >
              <span>সবুজ (Green)</span>
              <span className="text-[11px] text-emerald-200 font-extrabold">২.০x</span>
            </button>

            <button
              disabled={periodInfo.lockPeriod}
              onClick={() => handlePlaceBet('violet')}
              className={`py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition flex flex-col items-center justify-center ${
                periodInfo.lockPeriod
                  ? 'opacity-40 bg-slate-900'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95'
              }`}
            >
              <span>বেগুনী (Violet)</span>
              <span className="text-[11px] text-purple-200 font-extrabold">৪.৫x</span>
            </button>

            <button
              disabled={periodInfo.lockPeriod}
              onClick={() => handlePlaceBet('red')}
              className={`py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition flex flex-col items-center justify-center ${
                periodInfo.lockPeriod
                  ? 'opacity-40 bg-slate-900'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 active:scale-95'
              }`}
            >
              <span>লাল (Red)</span>
              <span className="text-[11px] text-rose-200 font-extrabold">২.০x</span>
            </button>
          </div>
        </div>

        {/* Bet Amount Selector */}
        <div className="pt-3 border-t border-slate-800 max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>বাজির পরিমাণ (Amount):</span>
            <span className="text-amber-400 font-numeric text-sm">৳{selectedBetAmount} BDT</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                disabled={periodInfo.lockPeriod}
                onClick={() => {
                  sounds.playReelClick();
                  setSelectedBetAmount(amt);
                }}
                className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs sm:text-sm font-extrabold transition font-numeric ${
                  selectedBetAmount === amt
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronized Live History Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
            <History className="h-4 w-4 text-blue-400" />
            <span>লাইভ রেজাল্ট হিস্ট্রি (সবার জন্য একই)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            সর্বশেষ: {lastResult ? `${lastResult.number} (${lastResult.size.toUpperCase()})` : '-'}
          </span>
        </div>

        {/* Recent Balls Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {history.map((h, i) => (
            <div
              key={h.periodId + i}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-11 h-13 rounded-xl border p-1 text-center ${
                h.size === 'big'
                  ? 'bg-amber-950/40 border-amber-500/50'
                  : 'bg-blue-950/40 border-blue-500/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                  h.color === 'green'
                    ? 'bg-emerald-600'
                    : h.color === 'violet'
                    ? 'bg-purple-600'
                    : 'bg-rose-600'
                }`}
              >
                {h.number}
              </div>
              <span
                className={`text-[9px] font-black uppercase mt-0.5 ${
                  h.size === 'big' ? 'text-amber-400' : 'text-blue-400'
                }`}
              >
                {h.size}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-2 px-3">পিরিয়ড</th>
                <th className="py-2 px-3">সংখ্যা</th>
                <th className="py-2 px-3">বিগ/স্মল</th>
                <th className="py-2 px-3">রঙ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.slice(0, 10).map((row) => (
                <tr key={row.periodId} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-300 font-semibold">{row.periodId}</td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-sm text-white px-2 py-0.5 rounded bg-slate-800">
                      {row.number}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-black px-2 py-0.5 rounded-md text-[11px] uppercase ${
                        row.size === 'big'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {row.size === 'big' ? 'বিগ (BIG)' : 'স্মল (SMALL)'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        row.color === 'green'
                          ? 'text-emerald-400'
                          : row.color === 'violet'
                          ? 'text-purple-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.color.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User's Recent Big Small Bets */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Award className="h-4 w-4 text-amber-400" />
            <span>আপনার বিগ/স্মল বাজি হিস্ট্রি</span>
          </div>
        </div>

        {activeBets.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            এখনও কোনো বাজি ধরা হয়নি। উপরে বিগ বা স্মল সিলেক্ট করে খেলুন!
          </div>
        ) : (
          <div className="space-y-2">
            {activeBets.slice(0, 8).map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded text-[11px] ${
                      bet.choice === 'big'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : bet.choice === 'small'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {bet.choice}
                  </span>
                  <span className="text-slate-400 font-mono">#{bet.periodId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-300">৳{bet.amount}</span>
                  {bet.status === 'pending' ? (
                    <span className="text-[11px] font-bold text-amber-400 animate-pulse bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/40">
                      চলমান...
                    </span>
                  ) : bet.status === 'won' ? (
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40">
                      +৳{bet.winAmount.toFixed(2)} ({bet.payoutMult}x)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      হার (০x)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
