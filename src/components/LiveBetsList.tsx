import React, { useState } from 'react';
import { LiveBot, BetRecord } from '../types';
import { Users, User as UserIcon, Trophy, Bot } from 'lucide-react';

interface LiveBetsListProps {
  bots: LiveBot[];
  myRecentBets: BetRecord[];
  currentMultiplier: number;
  totalBetsCount: number;
}

export const LiveBetsList: React.FC<LiveBetsListProps> = ({
  bots,
  myRecentBets,
  currentMultiplier,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');

  const topWins = [...myRecentBets]
    .filter((b) => b.status === 'won' || b.status === 'cashed_out')
    .sort((a, b) => b.winAmount - a.winAmount)
    .slice(0, 10);

  return (
    <div className="w-full rounded-2xl bg-black/40 border border-slate-800 p-3 backdrop-blur-sm space-y-2.5">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>লাইভ বেটস ({bots.length + 2})</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'my'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="h-3 w-3" />
            <span>আমার বেট ({myRecentBets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              activeTab === 'top'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="h-3 w-3 text-amber-400" />
            <span>টপ উইন</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>সার্ভার সক্রিয়</span>
        </div>
      </div>

      {/* List Container */}
      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {activeTab === 'all' && (
          <>
            {bots.map((bot, idx) => (
              <div
                key={`${bot.id}-${idx}`}
                className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 px-3 py-2 text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-slate-300">{bot.username}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-numeric font-bold text-slate-400">৳{bot.betAmount}</span>
                  {bot.cashedOut ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-numeric text-[11px] text-purple-300 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-500/30">
                        {bot.targetMult.toFixed(2)}x
                      </span>
                      <span className="font-numeric font-bold text-emerald-400 min-w-[65px] text-right">
                        +৳{bot.winAmount.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-400/80 italic min-w-[65px] text-right">
                      উড়ছে...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'my' && (
          <>
            {myRecentBets.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                আপনি এখনও কোনো বেট করেননি
              </div>
            ) : (
              myRecentBets.slice(0, 15).map((bet, idx) => {
                const isWon = bet.status === 'won' || bet.status === 'cashed_out';
                return (
                  <div
                    key={`${bet.id}-${idx}`}
                    className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300">
                        বেট #{bet.roundId} (প্যানেল {bet.panel})
                      </span>
                      <span className="text-[10px] text-slate-500">{bet.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-numeric text-slate-400">৳{bet.betAmount}</span>
                      {isWon ? (
                        <div className="text-right">
                          <span className="font-numeric font-bold text-emerald-400 block">
                            +৳{bet.winAmount.toFixed(2)}
                          </span>
                          <span className="font-numeric text-[10px] text-emerald-500/80">
                            @{bet.cashoutMult?.toFixed(2)}x
                          </span>
                        </div>
                      ) : (
                        <span className="font-numeric font-bold text-rose-500 min-w-[50px] text-right">
                          -৳{bet.betAmount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'top' && (
          <>
            {topWins.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                এখনও কোনো বড় জয়ের রেকর্ড নেই
              </div>
            ) : (
              topWins.map((win, idx) => (
                <div
                  key={`${win.id}-${idx}`}
                  className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-bold text-amber-400 w-4">#{idx + 1}</span>
                    <span className="font-semibold text-slate-300">{win.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/30 text-[11px]">
                      {win.cashoutMult?.toFixed(2)}x
                    </span>
                    <span className="font-numeric font-extrabold text-emerald-400">
                      ৳{win.winAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
