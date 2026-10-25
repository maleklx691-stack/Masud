import React from 'react';
import { BetRecord } from '../types';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MyBetHistoryProps {
  bets: BetRecord[];
  username: string;
}

export const MyBetHistory: React.FC<MyBetHistoryProps> = ({ bets, username }) => {
  const userBets = bets.filter((b) => b.username === username);

  return (
    <div className="mx-auto max-w-3xl w-full space-y-4">
      <div className="rounded-2xl bg-black/50 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">আমার বেটিং হিস্ট্রি (My Game Bets)</h3>
          </div>
          <span className="text-xs text-slate-400">সর্বমোট {userBets.length} টি বেট</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {userBets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              আপনি এখনও কোনো খেলায় অংশগ্রহণ করেননি। গেম পেজে গিয়ে বেট করুন!
            </div>
          ) : (
            userBets.map((bet, idx) => {
              const isWon = bet.status === 'won' || bet.status === 'cashed_out';

              return (
                <div
                  key={`${bet.id}-${idx}`}
                  className="flex items-center justify-between rounded-xl bg-slate-900/70 border border-slate-800/80 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isWon ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                      }`}
                    >
                      {isWon ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <span>রাউন্ড #{bet.roundId}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (প্যানেল {bet.panel})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{bet.createdAt}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">বেট এমাউন্ট</span>
                      <span className="font-numeric font-bold text-slate-300">৳{bet.betAmount}</span>
                    </div>

                    <div className="text-right min-w-[70px]">
                      {isWon ? (
                        <>
                          <span className="font-numeric text-xs font-bold text-emerald-400 block">
                            +৳{bet.winAmount.toFixed(2)}
                          </span>
                          <span className="font-numeric text-[10px] text-purple-300">
                            @{bet.cashoutMult?.toFixed(2)}x
                          </span>
                        </>
                      ) : (
                        <span className="font-numeric text-xs font-bold text-rose-400">
                          -৳{bet.betAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
