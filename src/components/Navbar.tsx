import React from 'react';
import { User } from '../types';
import { Plane, Volume2, VolumeX, Wallet, Gift, History, Shield, LogOut, UserCircle, Sparkles, Binary, Crown, Award } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getVipInfo } from '../utils/vip';

interface NavbarProps {
  user: User;
  activeTab: 'game' | 'slots' | 'bigsmall' | 'superace' | 'wallet' | 'referral' | 'history' | 'profile' | 'admin';
  setActiveTab: (tab: 'game' | 'slots' | 'bigsmall' | 'superace' | 'wallet' | 'referral' | 'history' | 'profile' | 'admin') => void;
  onOpenWallet: () => void;
  onLogout: () => void;
  claimableBonusCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenWallet,
  onLogout,
  claimableBonusCount,
}) => {
  const [isMuted, setIsMuted] = React.useState(() => sounds.getIsMuted());

  React.useEffect(() => {
    setIsMuted(sounds.getIsMuted());
    return sounds.subscribe((muted) => {
      setIsMuted(muted);
    });
  }, []);

  const toggleAudio = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const vipInfo = getVipInfo(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rose-950/40 bg-[#0c1017]/90 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('game')}
          className="flex cursor-pointer items-center gap-2.5 select-none group"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-rose-500/50 bg-black shadow-[0_0_18px_rgba(225,29,72,0.4)] group-hover:scale-105 group-hover:border-rose-400 transition-all">
            <img 
              src="/logo.jpg" 
              alt="Aviator Logo" 
              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold italic tracking-wider text-rose-500 font-numeric">
                AVIATOR
              </span>
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                PRO NEXTGEN
              </span>
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider">OFFICIAL CRASH CASINO</span>
          </div>
        </div>

        {/* Center Nav tabs on desktop */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'game'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            এভিয়েটর (Crash)
          </button>
          <button
            onClick={() => setActiveTab('superace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'superace'
                ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white shadow font-bold'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            সুপার এস (Super Ace)
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'slots'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            স্লট (777 Slots)
          </button>
          <button
            onClick={() => setActiveTab('bigsmall')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'bigsmall'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'text-blue-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Binary className="h-3.5 w-3.5 text-blue-400" />
            বিগ / স্মল (১.৯৬x)
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'wallet'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            ডিপোজিট / উইথড্র
          </button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'referral'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>রেফারেল (৳২০০)</span>
            {claimableBonusCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="h-3.5 w-3.5 text-cyan-400" />
            মাই হিস্ট্রি
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-purple-400" />
              এডমিন প্যানেল
            </button>
          )}
        </nav>

        {/* Right side: Balance & User Actions */}
        <div className="flex items-center gap-2">
          {/* Global Audio Toggle (Persists mute/unmute across all games) */}
          <button
            id="navbar-global-sound-toggle"
            type="button"
            onClick={toggleAudio}
            aria-label={isMuted ? 'সকল গেমের সাউন্ড চালু করুন (Unmute All Sounds)' : 'সকল গেমের সাউন্ড বন্ধ করুন (Mute All Sounds)'}
            aria-pressed={!isMuted}
            title={isMuted ? 'সাউন্ড মিউট আছে — চালু করতে ক্লিক করুন' : 'সকল গেমের সাউন্ড চালু আছে — মিউট করতে ক্লিক করুন'}
            className={`relative flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 border text-xs font-bold transition-all active:scale-95 cursor-pointer select-none ${
              isMuted
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 hover:bg-rose-950/80 hover:border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/80 hover:border-emerald-400/70 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
            }`}
          >
            <span className="relative flex items-center justify-center">
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
              )}
            </span>
            <span className="hidden sm:inline tracking-wide">
              {isMuted ? 'মিউট' : 'সাউন্ড'}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isMuted ? 'bg-rose-500' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
              }`}
            />
          </button>

          {/* User Balance Chip with Casino Glow */}
          <div className="flex items-center rounded-2xl bg-black/80 border border-emerald-500/50 p-1 pl-3.5 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <div className="flex flex-col pr-2.5">
              <span className="text-[9px] font-black uppercase text-emerald-400/80 leading-tight tracking-wider">ব্যালেন্স</span>
              <div className="flex items-baseline gap-1">
                <span className="font-numeric text-base sm:text-lg font-black tracking-tight text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                  ৳{user.balance.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 px-3 py-1.5 text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition active:scale-95 cursor-pointer"
            >
              <Wallet className="h-3 w-3" />
              <span>+ ডিপোজিট</span>
            </button>
          </div>

          {/* VIP Level Indicator */}
          <button
            onClick={() => setActiveTab('profile')}
            title={`ভিআইপি লেভেল ${vipInfo.currentTier.level}: ${vipInfo.currentTier.nameBn} (টার্নওভার: ৳${(user.totalWagered || 0).toLocaleString()})`}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition active:scale-95 cursor-pointer ${vipInfo.currentTier.bgBadgeColor} ${vipInfo.currentTier.borderBadgeColor} ${vipInfo.currentTier.glowShadow}`}
          >
            <span className="text-xs">{vipInfo.currentTier.accentIcon}</span>
            <div className="flex flex-col text-left leading-none">
              <span className={`text-[10px] font-black uppercase tracking-wider ${vipInfo.currentTier.textColor}`}>
                {vipInfo.currentTier.badgeTitle}
              </span>
              <span className="text-[8px] text-slate-400 font-semibold">{vipInfo.currentTier.nameBn}</span>
            </div>
          </button>

          {/* User Profile Avatar with Cosmetic VIP Frame */}
          <button
            onClick={() => setActiveTab('profile')}
            title={`প্রোফাইল (${user.username}) - ${vipInfo.activeFrameTier.nameBn} ফ্রেম`}
            className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl p-[2px] transition-all duration-200 active:scale-95 cursor-pointer ${vipInfo.activeFrameTier.frameOuterClass} ${vipInfo.activeFrameTier.glowShadow} ${
              activeTab === 'profile' ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.7)]' : ''
            }`}
          >
            <div className={`relative h-full w-full rounded-[10px] overflow-hidden bg-slate-950 flex items-center justify-center ${vipInfo.activeFrameTier.frameInnerRing}`}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <UserCircle className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="লগআউট"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/40 hover:border-rose-800 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile bottom-bar navigation */}
      <div className="flex lg:hidden mt-2 pt-2 border-t border-slate-800/80 gap-1 overflow-x-auto text-[11px] font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'game' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <Plane className="h-3 w-3" /> এভিয়েটর
        </button>
        <button
          onClick={() => setActiveTab('superace')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'superace' ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black' : 'bg-slate-900 text-amber-300'
          }`}
        >
          <Crown className="h-3 w-3 text-amber-400" /> সুপার এস 🔥
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'slots' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-900 text-amber-300'
          }`}
        >
          <Sparkles className="h-3 w-3 text-amber-400" /> স্লট (777)
        </button>
        <button
          onClick={() => setActiveTab('bigsmall')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'bigsmall' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-blue-300'
          }`}
        >
          <Binary className="h-3 w-3 text-blue-400" /> বিগ/স্মল (১.৯৬x)
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'wallet' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <Wallet className="h-3 w-3 text-emerald-400" /> ওয়ালেট
        </button>
        <button
          onClick={() => setActiveTab('referral')}
          className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'referral' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-amber-300'
          }`}
        >
          <Gift className="h-3 w-3" /> রেফারেল (৳২০০)
          {claimableBonusCount > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'history' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          <History className="h-3 w-3 text-cyan-400" /> মাই হিস্ট্রি
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeTab === 'profile' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <div className={`h-4 w-4 rounded-full p-[1.5px] ${vipInfo.activeFrameTier.frameOuterClass}`}>
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <UserCircle className="h-full w-full text-amber-400" />
            )}
          </div>
          <span>প্রোফাইল</span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-black ${vipInfo.currentTier.textColor} ${vipInfo.currentTier.bgBadgeColor} border ${vipInfo.currentTier.borderBadgeColor}`}>
            {vipInfo.currentTier.badgeTitle}
          </span>
        </button>
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-purple-300'
            }`}
          >
            <Shield className="h-3 w-3" /> এডমিন
          </button>
        )}
      </div>
    </header>
  );
};
