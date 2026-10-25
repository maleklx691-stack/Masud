import { User, UserRole, DepositRecord, WithdrawRecord, BetRecord, ReferralStat, RoundHistoryItem, BigSmallRound, BigSmallBet } from '../types';

const USERS_KEY = 'aviator_pro_users_v2';
const DEPOSITS_KEY = 'aviator_pro_deposits_v2';
const WITHDRAWALS_KEY = 'aviator_pro_withdrawals_v2';
const BETS_KEY = 'aviator_pro_bets_v2';
const HISTORY_KEY = 'aviator_pro_history_v2';
const REFERRALS_KEY = 'aviator_pro_referrals_v2';
const CURRENT_USER_KEY = 'aviator_pro_current_user_v2';
const GAME_CONFIG_KEY = 'aviator_pro_game_config_v2';
const BIG_SMALL_HISTORY_KEY = 'aviator_pro_big_small_history_v2';
const BIG_SMALL_BETS_KEY = 'aviator_pro_big_small_bets_v2';

export type WinMode = 'normal' | 'low' | 'medium' | 'high' | 'ultra' | 'custom';

export interface GameConfig {
  forcedNextMultiplier: number | null; // Admin can set a fixed multiplier for next round
  isForcedPersistent?: boolean; // If true, forced multiplier repeats every round until turned off
  winRateMode: WinMode; // Admin win rate control: low, medium, high, ultra, custom
  customMaxMultiplier?: number; // Custom max limit
  rtpPercent: number; // Return to player, default 97%
  adminPhone: string; // bKash personal number
  adminNagadPhone?: string; // Nagad personal number
  adminRocketPhone?: string; // Rocket personal number
  superAceWinMode?: WinMode; // Super Ace specific win rate
  bigSmallOverride?: 'big' | 'small' | number | null; // Admin can force Big/Small outcome
}

export const DEFAULT_USER_AVATAR = '/assets/aistudio/images_45dab4cd.jpeg';

// Initial seed data
const initialUsers: Record<string, User> = {
  admin: {
    username: 'admin',
    name: 'Aviator Master Admin',
    phone: '01788294401',
    password: 'admin',
    role: 'admin',
    balance: 50000,
    referralCode: 'ADMINVIP',
    totalDeposited: 0,
    totalWagered: 0,
    totalWon: 0,
    avatar: DEFAULT_USER_AVATAR,
    createdAt: '2025-01-01',
  },
  player1: {
    username: 'player1',
    name: 'সাদ্দাম হোসেন',
    phone: '01711223344',
    password: '123',
    role: 'user',
    balance: 10,
    referralCode: 'PL1001',
    referredBy: 'TOPPRO',
    totalDeposited: 300,
    totalWagered: 1840,
    totalWon: 2150,
    avatar: DEFAULT_USER_AVATAR,
    createdAt: '2025-02-10',
  },
  referee_demo: {
    username: 'rahim_top',
    name: 'রহিম ইসলাম',
    phone: '01899887766',
    password: '123',
    role: 'user',
    balance: 420,
    referralCode: 'RAHIM99',
    referredBy: 'PL1001', // Referred by player1!
    totalDeposited: 150, // Met! (>= 150 BDT)
    totalWagered: 2100, // Met! (>= 2000 BDT)
    totalWon: 2450,
    createdAt: '2025-03-01',
  },
  referee_pending: {
    username: 'tanvir_khan',
    name: 'তানভীর খান',
    phone: '01911223399',
    password: '123',
    role: 'user',
    balance: 210,
    referralCode: 'TANVIR22',
    referredBy: 'PL1001', // Referred by player1!
    totalDeposited: 150, // Met! (>= 150 BDT)
    totalWagered: 950, // In progress! (950 / 2000 BDT)
    totalWon: 1100,
    createdAt: '2025-03-05',
  }
};

const initialHistory: RoundHistoryItem[] = [
  { roundId: 1045, multiplier: 1.25, crashedAt: '12:01', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { roundId: 1046, multiplier: 2.45, crashedAt: '12:02', hash: '8799a7fd552f6b8a8b13928e46959b81b7a2d1d07ecbe23e20e8903c7379ee05' },
  { roundId: 1047, multiplier: 1.12, crashedAt: '12:03', hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b' },
  { roundId: 1048, multiplier: 14.80, crashedAt: '12:04', hash: '7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c65dd0041765fb5a0' },
  { roundId: 1049, multiplier: 3.18, crashedAt: '12:05', hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae' },
  { roundId: 1050, multiplier: 1.05, crashedAt: '12:06', hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9' },
  { roundId: 1051, multiplier: 6.72, crashedAt: '12:07', hash: '043a718774c572bd8a25adbeb1bfcd5c0256ae11cecf9f9c0f2550d58d49cbfb' },
  { roundId: 1052, multiplier: 2.10, crashedAt: '12:08', hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0' }
];

const initialReferrals: ReferralStat[] = [
  {
    id: 'ref-1',
    referrerUsername: 'player1',
    refereeUsername: 'rahim_top',
    refereeJoinedAt: '2025-03-01',
    depositMet: true,
    currentDeposit: 150,
    wagerMet: true,
    currentWager: 2100,
    isQualified: true, // Conditions met: deposit >= 150 and wager >= 2000!
    isClaimed: false, // Ready to claim ৳200 bonus!
    bonusAmount: 200,
  },
  {
    id: 'ref-2',
    referrerUsername: 'player1',
    refereeUsername: 'tanvir_khan',
    refereeJoinedAt: '2025-03-05',
    depositMet: true,
    currentDeposit: 150,
    wagerMet: false,
    currentWager: 950, // 950 / 2000 BDT
    isQualified: false,
    isClaimed: false,
    bonusAmount: 200,
  }
];

const initialDeposits: DepositRecord[] = [
  {
    id: 'dep-101',
    username: 'player1',
    amount: 300,
    trxId: '9A7X8KL90',
    method: 'bKash',
    senderPhone: '01711223344',
    status: 'approved',
    createdAt: '2025-03-08 14:20',
  }
];

const initialConfig: GameConfig = {
  forcedNextMultiplier: null,
  isForcedPersistent: false,
  winRateMode: 'medium', // Default steady balanced flights
  customMaxMultiplier: 10,
  rtpPercent: 97,
  adminPhone: '01788294401',
  adminNagadPhone: '01788294401',
  adminRocketPhone: '01788294401',
  superAceWinMode: 'medium',
  bigSmallOverride: null,
};

export const storage = {
  getUsers: (): Record<string, User> => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    try {
      const parsed: Record<string, User> = JSON.parse(data);
      let modified = false;
      // Ensure player1 and admin have the newly uploaded avatar by default if not set
      if (parsed['player1'] && !parsed['player1'].avatar) {
        parsed['player1'].avatar = DEFAULT_USER_AVATAR;
        modified = true;
      }
      if (parsed['admin'] && !parsed['admin'].avatar) {
        parsed['admin'].avatar = DEFAULT_USER_AVATAR;
        modified = true;
      }
      if (modified) {
        localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return initialUsers;
    }
  },

  saveUsers: (users: Record<string, User>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    const username = localStorage.getItem(CURRENT_USER_KEY);
    const users = storage.getUsers();
    if (username && users[username]) {
      return users[username];
    }
    // Default to player1 for seamless instant play if not logged in
    const defaultUser = users['player1'] || Object.values(users)[0] || null;
    if (defaultUser) {
      localStorage.setItem(CURRENT_USER_KEY, defaultUser.username);
    }
    return defaultUser;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.username);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  updateUser: (updated: User) => {
    const users = storage.getUsers();
    users[updated.username] = updated;
    storage.saveUsers(users);
  },

  updateAvatar: (username: string, avatarUrl: string): User | null => {
    const users = storage.getUsers();
    if (!users[username]) return null;
    users[username].avatar = avatarUrl;
    storage.saveUsers(users);
    return users[username];
  },

  updateEquippedFrame: (username: string, frameId: string): User | null => {
    const users = storage.getUsers();
    if (!users[username]) return null;
    users[username].selectedBorderFrame = frameId;
    storage.saveUsers(users);
    return users[username];
  },

  deleteUser: (username: string) => {
    const users = storage.getUsers();
    if (username === 'admin') return false; // Prevent deleting master admin
    delete users[username];
    storage.saveUsers(users);
    return true;
  },

  setUserBalance: (username: string, newBalance: number) => {
    const users = storage.getUsers();
    if (!users[username]) return;
    users[username].balance = Math.max(0, newBalance);
    storage.saveUsers(users);
  },

  setUserRole: (username: string, role: UserRole) => {
    const users = storage.getUsers();
    if (!users[username]) return;
    users[username].role = role;
    storage.saveUsers(users);
  },

  setUserPassword: (username: string, pass: string) => {
    const users = storage.getUsers();
    if (!users[username]) return;
    users[username].password = pass;
    storage.saveUsers(users);
  },

  getDeposits: (): DepositRecord[] => {
    const data = localStorage.getItem(DEPOSITS_KEY);
    if (!data) {
      localStorage.setItem(DEPOSITS_KEY, JSON.stringify(initialDeposits));
      return initialDeposits;
    }
    return JSON.parse(data);
  },

  saveDeposits: (deposits: DepositRecord[]) => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(deposits));
  },

  getWithdrawals: (): WithdrawRecord[] => {
    const data = localStorage.getItem(WITHDRAWALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveWithdrawals: (wits: WithdrawRecord[]) => {
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(wits));
  },

  getBets: (): BetRecord[] => {
    const data = localStorage.getItem(BETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBets: (bets: BetRecord[]) => {
    localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  },

  addBetRecord: (bet: BetRecord) => {
    const bets = storage.getBets();
    bets.unshift(bet);
    // Keep last 150 bets
    if (bets.length > 150) bets.pop();
    storage.saveBets(bets);

    // Update user stats & check referral progress if user is a referee!
    const users = storage.getUsers();
    const user = users[bet.username];
    if (user) {
      user.totalWagered = (user.totalWagered || 0) + bet.betAmount;
      if (bet.status === 'won' || bet.status === 'cashed_out') {
        user.totalWon = (user.totalWon || 0) + bet.winAmount;
      }
      users[bet.username] = user;
      storage.saveUsers(users);

      // Check referee wager condition
      storage.updateRefereeProgress(user.username, 0, bet.betAmount);
    }
  },

  getHistory: (): RoundHistoryItem[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(initialHistory));
      return initialHistory;
    }
    try {
      const parsed: RoundHistoryItem[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return initialHistory;

      // Deduplicate by roundId to prevent React duplicate key errors
      const seen = new Set<number>();
      const unique: RoundHistoryItem[] = [];
      for (const item of parsed) {
        if (item && typeof item.roundId === 'number' && !seen.has(item.roundId)) {
          seen.add(item.roundId);
          unique.push(item);
        }
      }

      if (unique.length !== parsed.length) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(unique));
      }
      return unique;
    } catch {
      return initialHistory;
    }
  },

  addRoundHistory: (item: RoundHistoryItem) => {
    const history = storage.getHistory().filter((h) => h.roundId !== item.roundId);
    history.push(item);
    if (history.length > 50) history.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  getReferrals: (): ReferralStat[] => {
    const data = localStorage.getItem(REFERRALS_KEY);
    if (!data) {
      localStorage.setItem(REFERRALS_KEY, JSON.stringify(initialReferrals));
      return initialReferrals;
    }
    return JSON.parse(data);
  },

  saveReferrals: (referrals: ReferralStat[]) => {
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
  },

  // When a referee deposits or wagers, update their referral tracking
  updateRefereeProgress: (refereeUsername: string, addedDeposit = 0, addedWager = 0) => {
    const referrals = storage.getReferrals();
    let updated = false;

    referrals.forEach(ref => {
      if (ref.refereeUsername === refereeUsername) {
        if (addedDeposit > 0) {
          ref.currentDeposit += addedDeposit;
          if (ref.currentDeposit >= 150) {
            ref.depositMet = true;
          }
        }
        if (addedWager > 0) {
          ref.currentWager += addedWager;
          if (ref.currentWager >= 2000) {
            ref.wagerMet = true;
          }
        }

        // Check if both 150 deposit and 2000 wager are met!
        if (ref.depositMet && ref.wagerMet && !ref.isQualified) {
          ref.isQualified = true;
        }
        updated = true;
      }
    });

    if (updated) {
      storage.saveReferrals(referrals);
    }
  },

  // Referrer claims the 200 BDT reward
  claimReferralBonus: (referralId: string): { success: boolean; message: string; amount: number } => {
    const referrals = storage.getReferrals();
    const ref = referrals.find(r => r.id === referralId);
    if (!ref) return { success: false, message: 'রেফারেল পাওয়া যায়নি!', amount: 0 };
    if (!ref.isQualified) return { success: false, message: 'শর্ত এখনও পূরণ হয়নি (১৫০ টাকা ডিপোজিট ও ২০০০ টাকা ব্যাটিং প্রয়োজন)।', amount: 0 };
    if (ref.isClaimed) return { success: false, message: 'এই বোনাসটি ইতিমধ্যে গ্রহণ করা হয়েছে!', amount: 0 };

    ref.isClaimed = true;
    ref.claimedAt = new Date().toLocaleString();
    storage.saveReferrals(referrals);

    // Add 200 BDT to referrer balance
    const users = storage.getUsers();
    if (users[ref.referrerUsername]) {
      users[ref.referrerUsername].balance += ref.bonusAmount; // 200 BDT
      storage.saveUsers(users);
    }

    return {
      success: true,
      message: `অভিনন্দন! ${ref.refereeUsername}-এর সফল অ্যাক্টিভেশনের জন্য ৳${ref.bonusAmount} বোনাস যোগ হয়েছে!`,
      amount: ref.bonusAmount
    };
  },

  // Register new referee linkage
  registerReferralLink: (referrerUsername: string, refereeUsername: string) => {
    const referrals = storage.getReferrals();
    const newRef: ReferralStat = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      referrerUsername,
      refereeUsername,
      refereeJoinedAt: new Date().toLocaleDateString(),
      depositMet: false,
      currentDeposit: 0,
      wagerMet: false,
      currentWager: 0,
      isQualified: false,
      isClaimed: false,
      bonusAmount: 200,
    };
    referrals.push(newRef);
    storage.saveReferrals(referrals);
  },

  getConfig: (): GameConfig => {
    const data = localStorage.getItem(GAME_CONFIG_KEY);
    return data ? JSON.parse(data) : initialConfig;
  },

  saveConfig: (cfg: GameConfig) => {
    localStorage.setItem(GAME_CONFIG_KEY, JSON.stringify(cfg));
  },

  // Big Small Game Storage
  getBigSmallHistory: (): BigSmallRound[] => {
    const data = localStorage.getItem(BIG_SMALL_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBigSmallHistory: (history: BigSmallRound[]) => {
    localStorage.setItem(BIG_SMALL_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  },

  getBigSmallBets: (): BigSmallBet[] => {
    const data = localStorage.getItem(BIG_SMALL_BETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBigSmallBet: (bet: BigSmallBet) => {
    const bets = storage.getBigSmallBets();
    bets.unshift(bet);
    localStorage.setItem(BIG_SMALL_BETS_KEY, JSON.stringify(bets.slice(0, 50)));
  },

  updateBigSmallBets: (bets: BigSmallBet[]) => {
    localStorage.setItem(BIG_SMALL_BETS_KEY, JSON.stringify(bets.slice(0, 50)));
  },

  // Super Ace Custom Card Images
  getCustomCardImages: (): Record<string, string> => {
    const data = localStorage.getItem('aviator_superace_card_images');
    return data ? JSON.parse(data) : {};
  },

  saveCustomCardImages: (images: Record<string, string>) => {
    localStorage.setItem('aviator_superace_card_images', JSON.stringify(images));
  },
};
