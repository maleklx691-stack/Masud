import React from 'react';
import { Plane, Sparkles, Binary, Flame, ArrowRight, Trophy, Users, Zap } from 'lucide-react';
import aceCardImg from '../assets/images/ace_spade_card_1789553636721.jpg';

interface GameLobbyBarProps {
  activeTab: 'game' | 'slots' | 'bigsmall' | 'superace' | 'wallet' | 'referral' | 'history' | 'profile' | 'admin';
  setActiveTab: (tab: 'game' | 'slots' | 'bigsmall' | 'superace' | 'wallet' | 'referral' | 'history' | 'profile' | 'admin') => void;
}

export const GameLobbyBar: React.FC<GameLobbyBarProps> = ({ activeTab, setActiveTab }) => {
  const games = [
    {
      id: 'game' as const,
      name: 'এভিয়েটর (Aviator)',
      subtitle: 'ক্র্যাশ বেটিং লাইভ স্পিড',
      tag: 'HOT 🔥',
      multiplier: '১০০x ক্যাশআউট',
      onlineCount: '১,৪২০+ সক্রিয়',
      rtp: '৯৯.৭% RTP',
      icon: (
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 p-0.5 shadow-[0_0_25px_rgba(225,29,72,0.6)] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src="/logo.jpg"
            alt="Aviator"
            className="h-full w-full object-cover rounded-[14px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />
        </div>
      ),
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.4)]',
      gradientBg: 'from-[#1e0a12]/95 via-[#13080e]/90 to-[#0c0812]/90',
      tagBg: 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(225,29,72,0.5)]',
      accentColor: 'text-rose-400',
    },
    {
      id: 'superace' as const,
      name: 'সুপার এস (Super Ace)',
      subtitle: '১০২৪ ওয়েজ কার্ড স্লট',
      tag: 'নতুন 🔥',
      multiplier: '১০x কম্বো মাল্টিপ্লায়ার',
      onlineCount: '১,৭৫০+ সক্রিয়',
      rtp: '৯৯.৭% RTP',
      icon: (
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={aceCardImg}
            alt="Super Ace Card"
            className="h-full w-full object-cover rounded-[14px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
        </div>
      ),
      activeBorder: 'border-amber-400 ring-2 ring-yellow-500/30 shadow-[0_0_30px_rgba(245,158,11,0.5)]',
      gradientBg: 'from-[#250d1a]/95 via-[#180812]/90 to-[#0e0712]/90',
      tagBg: 'bg-gradient-to-r from-amber-400 to-rose-600 text-black font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      accentColor: 'text-amber-400',
    },
    {
      id: 'slots' as const,
      name: '৭৭৭ স্লট (Royal 777)',
      subtitle: '৩-রিল লাকি ড্র জ্যাকপট',
      tag: 'জ্যাকপট 💎',
      multiplier: '৫০x মেগা জ্যাকপট',
      onlineCount: '৮৯০+ সক্রিয়',
      rtp: '৯৯.৪% RTP',
      icon: (
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center overflow-hidden shrink-0">
          <div className="h-full w-full bg-gradient-to-b from-[#2a1705] to-[#0d0702] rounded-[14px] flex flex-col items-center justify-center text-center p-1">
            <span className="text-base font-black tracking-tighter text-amber-300 font-numeric leading-none drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
              777
            </span>
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse mt-0.5" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />
        </div>
      ),
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.4)]',
      gradientBg: 'from-[#1e1305]/95 via-[#140c03]/90 to-[#0e0a12]/90',
      tagBg: 'bg-amber-500 text-black font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      accentColor: 'text-amber-400',
    },
    {
      id: 'bigsmall' as const,
      name: 'বিগ / স্মল (Big Small)',
      subtitle: 'গ্লোবাল কালার ট্রেডিং',
      tag: '১.৯৬x উইন ⚡',
      multiplier: '১.৯৬x ডাবল পেআউট',
      onlineCount: '২,১০০+ সক্রিয়',
      rtp: '৯৯.৬% RTP',
      icon: (
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(59,130,246,0.6)] flex items-center justify-center overflow-hidden shrink-0">
          <div className="h-full w-full bg-gradient-to-b from-[#081734] to-[#040c1c] rounded-[14px] flex flex-col items-center justify-center text-center p-1">
            <div className="flex items-center gap-0.5 font-black text-sm drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]">
              <span className="text-amber-400 font-numeric">B</span>
              <span className="text-slate-400 text-[11px]">/</span>
              <span className="text-cyan-400 font-numeric">S</span>
            </div>
            <Binary className="h-3.5 w-3.5 text-cyan-300 animate-pulse mt-0.5" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />
        </div>
      ),
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.4)]',
      gradientBg: 'from-[#071328]/95 via-[#050e1e]/90 to-[#080a14]/90',
      tagBg: 'bg-blue-500 text-white font-black shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      accentColor: 'text-blue-400',
    },
  ];

  return (
    <div className="w-full space-y-2 mb-3">
      {/* Category header with real casino badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 shadow-md">
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              অফিশিয়াল গেম লবি (Official Games)
            </span>
            <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">
              ● লাইভ সার্ভার ভেরিফায়েড
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full shadow-inner">
          <Zap className="h-3 w-3 text-amber-400 animate-pulse" />
          <span>রিয়েল পেআউট মোড</span>
        </div>
      </div>

      {/* 4 Real-Casino Styled Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {games.map((game) => {
          const isSelected = activeTab === game.id;
          return (
            <button
              key={game.id}
              onClick={() => setActiveTab(game.id)}
              className={`group relative flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl border-2 transition-all text-left overflow-hidden select-none bg-gradient-to-r backdrop-blur-md cursor-pointer ${
                game.gradientBg
              } ${
                isSelected
                  ? `${game.activeBorder} scale-[1.02] bg-opacity-100`
                  : 'border-slate-800/90 hover:border-slate-700 hover:scale-[1.01] opacity-85 hover:opacity-100 shadow-lg'
              }`}
            >
              {/* Distinctive App / Game Logo Badge with luxury neon shine */}
              <div className="shrink-0 transform transition-transform duration-300 group-hover:scale-105">
                {game.icon}
              </div>

              {/* Game Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="text-sm sm:text-base font-black tracking-wide text-white truncate group-hover:text-amber-200 transition-colors">
                    {game.name}
                  </h3>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${game.tagBg}`}
                  >
                    {game.tag}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-400 truncate mb-1">{game.subtitle}</p>

                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
                    <span>{game.multiplier}</span>
                    <ArrowRight
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isSelected ? 'translate-x-1 text-white' : 'text-slate-500 group-hover:translate-x-1'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{game.onlineCount}</span>
                  </div>
                </div>
              </div>

              {/* Live Selected Ring Accent Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    চলমান
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

