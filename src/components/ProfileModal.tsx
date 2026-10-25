import React, { useState } from 'react';
import { User } from '../types';
import { storage, DEFAULT_USER_AVATAR } from '../utils/storage';
import { VIP_TIERS, getVipInfo, isFrameUnlocked } from '../utils/vip';
import {
  Shield,
  Award,
  Wallet,
  Gift,
  Calendar,
  Phone,
  CheckCircle2,
  Camera,
  Check,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Lock,
  ChevronRight,
  Zap,
  Star,
  CheckCheck
} from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onOpenWallet: () => void;
  onOpenReferrals: () => void;
  onUserUpdated?: (updated: User) => void;
}

interface AvatarOption {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

const PRESET_AVATARS: AvatarOption[] = [
  {
    id: 'uploaded_user_pic',
    name: 'আমার ছবি (আপলোড করা)',
    subtitle: 'নতুন আপলোড করা প্রোফাইল ছবি',
    url: DEFAULT_USER_AVATAR,
  },
  {
    id: 'aviator_pilot_1',
    name: 'এভিয়েটর ক্যাপটেন',
    subtitle: 'সাইবার জেট পাইলট',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_highroller',
    name: 'গোল্ডেন হাই-রোলার',
    subtitle: 'ভিআইপি লাক্সারি প্লেয়ার',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'lucky_queen',
    name: 'লাকি ডায়মন্ড এস',
    subtitle: 'ক্যাসিনো চ্যাম্পিয়ন',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onOpenWallet,
  onOpenReferrals,
  onUserUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'frames' | 'vip_perks'>('overview');
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const vipInfo = getVipInfo(user);
  const currentAvatar = user.avatar || DEFAULT_USER_AVATAR;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectAvatar = (url: string) => {
    const updated = storage.updateAvatar(user.username, url);
    if (updated) {
      if (onUserUpdated) onUserUpdated(updated);
      showToast('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!');
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    handleSelectAvatar(customUrl.trim());
    setCustomUrl('');
  };

  const handleEquipFrame = (frameId: string) => {
    const unlocked = isFrameUnlocked(frameId, user.totalWagered || 0);
    if (!unlocked) {
      showToast('এই ফ্রেমটি এখনো আনলক হয়নি! আরও বেট করে আনলক করুন।');
      return;
    }
    const updated = storage.updateEquippedFrame(user.username, frameId);
    if (updated) {
      if (onUserUpdated) onUserUpdated(updated);
      showToast('কসমেটিক ফ্রেম সফলভাবে ইকুইপ করা হয়েছে!');
    }
  };

  return (
    <div className="mx-auto max-w-2xl w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 p-3 text-sm text-emerald-300 font-semibold shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Header Card with Cosmetic VIP Frame */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#131926] to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* User Avatar with Equipped VIP Cosmetic Frame */}
            <div className="relative group shrink-0">
              <div
                className={`relative h-20 w-20 sm:h-22 sm:w-22 rounded-2xl p-[3px] transition-all duration-300 ${vipInfo.activeFrameTier.frameOuterClass} ${vipInfo.activeFrameTier.glowShadow}`}
              >
                <div
                  className={`relative h-full w-full rounded-[13px] overflow-hidden bg-slate-950 flex items-center justify-center ${vipInfo.activeFrameTier.frameInnerRing}`}
                >
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={user.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-rose-600 to-amber-500 text-white text-2xl font-black">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick toggle button */}
              <button
                onClick={() => setShowAvatarGallery((prev) => !prev)}
                title="ছবি পরিবর্তন করুন"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg border border-slate-950 transition active:scale-95 cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              {/* Online Indicator */}
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user.username}</h2>
                {/* VIP Level Badge */}
                <button
                  onClick={() => setActiveSubTab('vip_perks')}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black border flex items-center gap-1 transition cursor-pointer hover:brightness-125 ${vipInfo.currentTier.bgBadgeColor} ${vipInfo.currentTier.borderBadgeColor} ${vipInfo.currentTier.textColor}`}
                >
                  <span>{vipInfo.currentTier.accentIcon}</span>
                  <span>{vipInfo.currentTier.badgeTitle}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">({vipInfo.currentTier.nameBn})</span>
                </button>
                {user.role === 'admin' && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 flex items-center gap-1 shadow-sm">
                    <Shield className="h-3 w-3" /> ADMIN
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-500" /> {user.phone || '01XXXXXXXXX'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" /> যোগদান: {user.createdAt}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  onClick={() => setShowAvatarGallery((prev) => !prev)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{showAvatarGallery ? 'ছবি গ্যালারি বন্ধ' : 'ছবি পরিবর্তন'}</span>
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => setActiveSubTab('frames')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <Star className="h-3 w-3 text-cyan-400" />
                  <span>ফ্রেম ইকুইপ করুন ({vipInfo.activeFrameTier.nameBn})</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenWallet}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>ডিপোজিট / উত্তোলন</span>
            </button>
            <button
              onClick={onOpenReferrals}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-amber-950/40 transition active:scale-95 cursor-pointer"
            >
              <Gift className="h-3.5 w-3.5" />
              <span>রেফারেল (৳২০০)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Picker / Gallery Drawer */}
      {showAvatarGallery && (
        <div className="rounded-3xl bg-slate-900/95 border border-amber-500/40 p-5 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                প্রোফাইল ছবি নির্বাচন করুন
              </h3>
            </div>
            <button
              onClick={() => handleSelectAvatar(DEFAULT_USER_AVATAR)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-300 transition cursor-pointer"
              title="ডিফল্ট আপলোড করা ছবিতে ফিরে যান"
            >
              <RefreshCw className="h-3 w-3" />
              <span>রিসেট (আপলোড করা ছবি)</span>
            </button>
          </div>

          {/* Preset Avatar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_AVATARS.map((av) => {
              const isSelected = currentAvatar === av.url;
              return (
                <button
                  key={av.id}
                  onClick={() => handleSelectAvatar(av.url)}
                  className={`group relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                      : 'bg-black/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden mb-2 border border-slate-700 group-hover:scale-105 transition-transform">
                    <img
                      src={av.url}
                      alt={av.name}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-200 line-clamp-1">{av.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{av.subtitle}</span>
                  {isSelected && (
                    <span className="mt-1 text-[9px] font-black uppercase text-amber-400 tracking-wider">
                      সক্রিয়
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Avatar URL option */}
          <form onSubmit={handleApplyCustomUrl} className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="অন্য কোনো ছবির লিংক (Image URL) পেস্ট করুন..."
                className="w-full rounded-xl bg-black/60 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
            >
              ছবি সেট করুন
            </button>
          </form>
        </div>
      )}

      {/* VIP Level Lifetime Turnover & Progress Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-black/80 border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${vipInfo.currentTier.bgBadgeColor} ${vipInfo.currentTier.borderBadgeColor} ${vipInfo.currentTier.glowShadow}`}>
              {vipInfo.currentTier.accentIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black ${vipInfo.currentTier.textColor}`}>
                  {vipInfo.currentTier.badgeTitle} · {vipInfo.currentTier.nameBn}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  লাইফটাইম বেটিং স্ট্যাটাস
                </span>
              </div>
              <p className="text-xs text-slate-400">
                মোট লাইফটাইম বেটিং (টার্নওভার): <strong className="text-amber-400 font-numeric">৳{(user.totalWagered || 0).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] text-slate-400">সর্বোচ্চ ডিপোজিট সীমা:</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-numeric">
              ৳{vipInfo.maxDepositLimit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Level-up Progress Bar */}
        {vipInfo.nextTier ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1">
                <span>{vipInfo.currentTier.badgeTitle}</span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <span className="text-slate-200">{vipInfo.nextTier.badgeTitle} ({vipInfo.nextTier.nameBn})</span>
              </span>
              <span className="font-numeric text-amber-400 font-black">{vipInfo.progressPercent}% সম্পন্ন</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                style={{ width: `${Math.max(4, vipInfo.progressPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>টার্নওভার: ৳{(user.totalWagered || 0).toLocaleString()}</span>
              <span>
                পরবর্তী লেভেলে পৌঁছাতে আর মাত্র <strong className="text-amber-300 font-numeric font-bold">৳{vipInfo.wagerNeededForNext.toLocaleString()}</strong> বেট প্রয়োজন
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 font-bold">
            <Sparkles className="h-4 w-4 text-rose-400 shrink-0" />
            <span>অভিনন্দন! আপনি সর্বোচ্চ ভিআইপি লেভেল ({vipInfo.currentTier.nameBn}) অর্জন করেছেন!</span>
          </div>
        )}

        {/* Sub-tab Navigation */}
        <div className="flex rounded-2xl bg-black/60 p-1 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex-1 py-2 px-3 rounded-xl transition text-center cursor-pointer ${
              activeSubTab === 'overview' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            পরিসংখ্যান ওভারভিউ
          </button>
          <button
            onClick={() => setActiveSubTab('frames')}
            className={`flex-1 py-2 px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'frames' ? 'bg-amber-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5 text-amber-300" />
            <span>কসমেটিক ফ্রেম গ্যালারি</span>
          </button>
          <button
            onClick={() => setActiveSubTab('vip_perks')}
            className={`flex-1 py-2 px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'vip_perks' ? 'bg-rose-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            <span>ভিআইপি প্রিভিলেজ ও লিমিট</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Standard Overview Stats */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-black/40 border border-slate-800 p-4 space-y-1 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">বর্তমান ব্যালেন্স</span>
              <div className="font-numeric text-2xl font-black text-emerald-400">
                ৳{user.balance.toFixed(2)}
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-slate-800 p-4 space-y-1 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">মোট ডিপোজিট</span>
              <div className="font-numeric text-2xl font-black text-slate-200">
                ৳{user.totalDeposited || 0}
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-slate-800 p-4 space-y-1 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">মোট বেটিং (টার্নওভার)</span>
              <div className="font-numeric text-2xl font-black text-amber-400">
                ৳{user.totalWagered || 0}
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-slate-800 p-4 space-y-1 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">মোট জয় (Winnings)</span>
              <div className="font-numeric text-2xl font-black text-purple-400">
                ৳{user.totalWon || 0}
              </div>
            </div>
          </div>

          {/* Referral Info Card */}
          <div className="rounded-2xl bg-black/50 border border-slate-800 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Award className="h-4 w-4" />
              <span>আপনার রেফারেল কোড ও স্ট্যাটাস</span>
            </div>
            <p className="text-xs text-slate-300">
              আপনার রেফার কোড: <strong className="font-numeric text-amber-400 text-sm">{user.referralCode}</strong>
              {user.referredBy && (
                <span className="text-slate-400 block mt-1">
                  (আপনি <strong className="text-slate-200">{user.referredBy}</strong>-এর রেফারেল লিংক দ্বারা যুক্ত হয়েছেন)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Cosmetic Avatar Border Frames Gallery */}
      {activeSubTab === 'frames' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <span>ভিআইপি কসমেটিক ফ্রেম আর্মারি (Cosmetic Border Frames)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                লাইফটাইম বেটিং টার্নওভার বাড়ার সাথে সাথে ফ্রেমগুলো স্বয়ংক্রিয়ভাবে আনলক হয়। আপনি যেকোনো আনলকড ফ্রেম বেছে নিতে পারেন।
              </p>
            </div>

            <button
              onClick={() => handleEquipFrame('auto')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                !user.selectedBorderFrame || user.selectedBorderFrame === 'auto'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-black/40 border-slate-750 text-slate-400 hover:text-white'
              }`}
            >
              স্বয়ংক্রিয় (অটো-ম্যাচ ভিআইপি)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {VIP_TIERS.map((tier) => {
              const unlocked = isFrameUnlocked(tier.id, user.totalWagered || 0);
              const isEquipped =
                (user.selectedBorderFrame === tier.id) ||
                ((!user.selectedBorderFrame || user.selectedBorderFrame === 'auto') && vipInfo.currentTier.id === tier.id);

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isEquipped
                      ? 'bg-gradient-to-b from-slate-900 via-black to-slate-900 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.25)]'
                      : unlocked
                      ? 'bg-black/50 border-slate-800 hover:border-slate-700'
                      : 'bg-black/30 border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Frame Preview with User Avatar */}
                    <div className={`relative h-14 w-14 rounded-2xl p-[2.5px] shrink-0 ${tier.frameOuterClass} ${tier.glowShadow}`}>
                      <div className={`h-full w-full rounded-[11px] overflow-hidden bg-slate-950 flex items-center justify-center ${tier.frameInnerRing}`}>
                        {currentAvatar ? (
                          <img src={currentAvatar} alt={tier.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{user.username.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {!unlocked && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{tier.accentIcon}</span>
                        <h4 className="text-xs font-black text-white truncate">{tier.nameBn}</h4>
                      </div>
                      <span className={`text-[10px] font-bold ${tier.textColor}`}>{tier.badgeTitle}</span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        প্রয়োজন: <span className="font-numeric text-amber-400">৳{tier.minWager.toLocaleString()}</span> টার্নওভার
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {unlocked ? (
                      isEquipped ? (
                        <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                          <CheckCheck className="h-4 w-4" /> সক্রিয় (ইকুইপড)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEquipFrame(tier.id)}
                          className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
                        >
                          ইকুইপ করুন
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> আর ৳{Math.max(0, tier.minWager - (user.totalWagered || 0)).toLocaleString()} বেট
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab 3: VIP Perks and Deposit Limits Matrix */}
      {activeSubTab === 'vip_perks' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>ভিআইপি টিয়ার প্রিভিলেজ ও ডিপোজিট লিমিট চার্ট</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রতিটি ভিআইপি লেভেলে উন্নীত হলে আপনার সর্বোচ্চ ডিপোজিট লিমিট ও বিশেষ সুযোগ-সুবিধা স্বয়ংক্রিয়ভাবে বৃদ্ধি পায়।
            </p>
          </div>

          <div className="space-y-3">
            {VIP_TIERS.map((tier) => {
              const isCurrent = vipInfo.currentTier.id === tier.id;
              const isAchieved = (user.totalWagered || 0) >= tier.minWager;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.2)]'
                      : isAchieved
                      ? 'bg-black/50 border-slate-800'
                      : 'bg-black/30 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${tier.bgBadgeColor} ${tier.borderBadgeColor} ${tier.glowShadow}`}>
                        {tier.accentIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${tier.textColor}`}>
                            {tier.badgeTitle} · {tier.nameBn}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                              বর্তমান লেভেল
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          টার্নওভার যোগ্যতা: <strong className="text-slate-200 font-numeric">৳{tier.minWager.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 block">এককালীন ডিপোজিট সীমা</span>
                        <span className="text-xs font-black text-emerald-400 font-numeric">৳{tier.maxDeposit.toLocaleString()}</span>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">দৈনিক মোট সীমা</span>
                        <span className="text-xs font-black text-cyan-400 font-numeric">৳{tier.dailyDepositLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                      {tier.perksBn.map((perk, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
