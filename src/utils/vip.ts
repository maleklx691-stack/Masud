import { User } from '../types';

export interface VipTier {
  level: number;
  id: string; // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic'
  name: string;
  nameBn: string;
  badgeTitle: string;
  minWager: number;
  maxDeposit: number;
  dailyDepositLimit: number;
  colorHex: string;
  textColor: string;
  bgBadgeColor: string;
  borderBadgeColor: string;
  // Border container styling classes
  frameOuterClass: string;
  frameInnerRing: string;
  glowShadow: string;
  accentIcon: string;
  perksBn: string[];
}

export const VIP_TIERS: VipTier[] = [
  {
    level: 0,
    id: 'bronze',
    name: 'Bronze Recruit',
    nameBn: 'ব্রোঞ্জ রিক্রুট',
    badgeTitle: 'VIP 0',
    minWager: 0,
    maxDeposit: 25000,
    dailyDepositLimit: 50000,
    colorHex: '#b45309',
    textColor: 'text-amber-600',
    bgBadgeColor: 'bg-amber-950/40',
    borderBadgeColor: 'border-amber-700/40',
    frameOuterClass: 'border-amber-800/80 bg-gradient-to-tr from-amber-950 via-stone-900 to-amber-900/60',
    frameInnerRing: 'ring-1 ring-amber-700/50',
    glowShadow: 'shadow-[0_0_10px_rgba(180,83,9,0.35)]',
    accentIcon: '🥉',
    perksBn: [
      'স্ট্যান্ডার্ড ২৪/৭ ডিপোজিট ও গেমিং এক্সেস',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳২৫,০০০',
      'দৈনিক ডিপোজিট লিমিট: ৳৫০,০০০',
      'বেসিক ব্রোঞ্জ ফ্রেম আনলক',
    ],
  },
  {
    level: 1,
    id: 'silver',
    name: 'Silver Aviator',
    nameBn: 'সিলভার এভিয়েটর',
    badgeTitle: 'VIP 1',
    minWager: 1000,
    maxDeposit: 50000,
    dailyDepositLimit: 100000,
    colorHex: '#cbd5e1',
    textColor: 'text-slate-200',
    bgBadgeColor: 'bg-slate-800/60',
    borderBadgeColor: 'border-slate-400/50',
    frameOuterClass: 'border-slate-300 bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500',
    frameInnerRing: 'ring-2 ring-slate-300/80',
    glowShadow: 'shadow-[0_0_16px_rgba(203,213,225,0.7)]',
    accentIcon: '🥈',
    perksBn: [
      'সিলভার ক্রোম প্রিজম কসমেটিক ফ্রেম',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳৫০,০০০',
      'দৈনিক ডিপোজিট লিমিট: ৳১,০০,০০০',
      'ফাস্ট-ট্র্যাক ডিপোজিট অনুমোদন',
    ],
  },
  {
    level: 2,
    id: 'gold',
    name: 'Gold Commander',
    nameBn: 'গোল্ড কমান্ডার',
    badgeTitle: 'VIP 2',
    minWager: 5000,
    maxDeposit: 100000,
    dailyDepositLimit: 200000,
    colorHex: '#f59e0b',
    textColor: 'text-amber-400',
    bgBadgeColor: 'bg-amber-950/60',
    borderBadgeColor: 'border-amber-400/60',
    frameOuterClass: 'border-amber-400 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600',
    frameInnerRing: 'ring-2 ring-amber-400/90',
    glowShadow: 'shadow-[0_0_22px_rgba(245,158,11,0.8)]',
    accentIcon: '👑',
    perksBn: [
      'গোল্ডেন অরিওল অ্যানিমেটেড কসমেটিক ফ্রেম',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳১,০০,০০০',
      'দৈনিক ডিপোজিট লিমিট: ৳২,০০,০০০',
      'অগ্রাধিকারভিত্তিতে দ্রুত ট্রানজেকশন ভেরিফিকেশন',
    ],
  },
  {
    level: 3,
    id: 'platinum',
    name: 'Platinum Ace',
    nameBn: 'প্লাটিনাম এস',
    badgeTitle: 'VIP 3',
    minWager: 20000,
    maxDeposit: 200000,
    dailyDepositLimit: 400000,
    colorHex: '#06b6d4',
    textColor: 'text-cyan-300',
    bgBadgeColor: 'bg-cyan-950/60',
    borderBadgeColor: 'border-cyan-400/60',
    frameOuterClass: 'border-cyan-400 bg-gradient-to-tr from-cyan-400 via-teal-300 to-blue-500',
    frameInnerRing: 'ring-2 ring-cyan-300',
    glowShadow: 'shadow-[0_0_24px_rgba(6,182,212,0.85)]',
    accentIcon: '💎',
    perksBn: [
      'প্লাটিনাম সাইবার নিয়ন কসমেটিক ফ্রেম',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳২,০০,০০০',
      'দৈনিক ডিপোজিট লিমিট: ৳৪,০০,০০০',
      'ডেডিকেটেড ভিআইপি ম্যানেজার সাপোর্ট চ্যানেল',
    ],
  },
  {
    level: 4,
    id: 'diamond',
    name: 'Diamond High Roller',
    nameBn: 'ডায়মন্ড হাই-রোলার',
    badgeTitle: 'VIP 4',
    minWager: 50000,
    maxDeposit: 500000,
    dailyDepositLimit: 1000000,
    colorHex: '#d946ef',
    textColor: 'text-fuchsia-300',
    bgBadgeColor: 'bg-fuchsia-950/60',
    borderBadgeColor: 'border-fuchsia-400/60',
    frameOuterClass: 'border-fuchsia-400 bg-gradient-to-tr from-fuchsia-500 via-pink-400 to-purple-600',
    frameInnerRing: 'ring-3 ring-purple-400',
    glowShadow: 'shadow-[0_0_28px_rgba(217,70,239,0.9)]',
    accentIcon: '🔮',
    perksBn: [
      'প্রিজম্যাটিক ডায়মন্ড রয়্যাল ফ্রেম',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳৫,০০,০০০',
      'দৈনিক ডিপোজিট লিমিট: ৳১০,০০,০০০',
      'ইনস্ট্যান্ট ১-মিনিট উইথড্রয়াল অনুমোদন',
    ],
  },
  {
    level: 5,
    id: 'mythic',
    name: 'Mythic Crown Admiral',
    nameBn: 'মিথিক ক্রাউন এডমিরাল',
    badgeTitle: 'VIP 5',
    minWager: 150000,
    maxDeposit: 1000000,
    dailyDepositLimit: 2500000,
    colorHex: '#ef4444',
    textColor: 'text-rose-400 font-black',
    bgBadgeColor: 'bg-rose-950/60',
    borderBadgeColor: 'border-rose-500/80',
    frameOuterClass: 'border-rose-500 bg-gradient-to-tr from-rose-600 via-amber-400 to-red-600 animate-pulse',
    frameInnerRing: 'ring-3 ring-amber-400',
    glowShadow: 'shadow-[0_0_35px_rgba(244,63,94,1),0_0_18px_rgba(251,191,36,0.8)]',
    accentIcon: '⚡',
    perksBn: [
      'মিথিক রয়্যাল ফায়ার গ্লোয়িং ফ্রেম (সর্বোচ্চ মর্যাদা)',
      'সর্বোচ্চ এককালীন ডিপোজিট: ৳১০,০০,০০০ (আনলিমিটেড)',
      'দৈনিক ডিপোজিট লিমিট: ৳২৫,০০,০০০',
      'ব্যক্তিগত ভিআইপি টেলিগ্রাম হটলাইন ও কাস্টম হাই-স্টেক্স টেবিল',
    ],
  },
];

export interface VipInfo {
  currentTier: VipTier;
  nextTier: VipTier | null;
  totalWagered: number;
  progressPercent: number; // 0 to 100
  wagerNeededForNext: number;
  maxDepositLimit: number;
  activeFrameTier: VipTier;
}

/**
 * Returns complete VIP information for a given wagering amount and user equipped frame
 */
export const getVipInfo = (user: User | { totalWagered?: number; selectedBorderFrame?: string }): VipInfo => {
  const wager = Math.max(0, user.totalWagered || 0);

  // Find highest tier matched
  let currentTier = VIP_TIERS[0];
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (wager >= VIP_TIERS[i].minWager) {
      currentTier = VIP_TIERS[i];
      break;
    }
  }

  const nextTier = currentTier.level < VIP_TIERS.length - 1 ? VIP_TIERS[currentTier.level + 1] : null;

  let progressPercent = 100;
  let wagerNeededForNext = 0;

  if (nextTier) {
    const range = nextTier.minWager - currentTier.minWager;
    const progress = wager - currentTier.minWager;
    progressPercent = Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));
    wagerNeededForNext = Math.max(0, nextTier.minWager - wager);
  }

  // Active cosmetic frame: can be explicitly equipped or defaults to current unlocked tier
  let activeFrameTier = currentTier;
  if (user.selectedBorderFrame && user.selectedBorderFrame !== 'auto') {
    const matched = VIP_TIERS.find((t) => t.id === user.selectedBorderFrame);
    if (matched && wager >= matched.minWager) {
      activeFrameTier = matched;
    }
  }

  return {
    currentTier,
    nextTier,
    totalWagered: wager,
    progressPercent,
    wagerNeededForNext,
    maxDepositLimit: currentTier.maxDeposit,
    activeFrameTier,
  };
};

/**
 * Checks if a specific frame ID is unlocked by the user's wagering volume
 */
export const isFrameUnlocked = (frameId: string, totalWagered: number): boolean => {
  if (frameId === 'auto') return true;
  const tier = VIP_TIERS.find((t) => t.id === frameId);
  if (!tier) return false;
  return (totalWagered || 0) >= tier.minWager;
};
