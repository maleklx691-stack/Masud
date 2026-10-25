export type UserRole = 'user' | 'admin';

export interface User {
  username: string;
  name?: string;
  phone?: string;
  password?: string;
  role: UserRole;
  balance: number;
  referralCode: string;
  referredBy?: string; // referral code of the inviter
  totalDeposited: number;
  totalWagered: number;
  totalWon: number;
  avatar?: string;
  selectedBorderFrame?: string; // e.g. 'auto', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'mythic'
  createdAt: string;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Upay';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRecord {
  id: string;
  username: string;
  amount: number;
  trxId: string;
  method: PaymentMethod;
  senderPhone: string;
  status: TransactionStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface WithdrawRecord {
  id: string;
  username: string;
  amount: number;
  method: PaymentMethod;
  accountPhone: string;
  status: TransactionStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface BetRecord {
  id: string;
  roundId: number;
  username: string;
  betAmount: number;
  cashoutMult?: number;
  winAmount: number;
  status: 'won' | 'lost' | 'cashed_out' | 'active';
  panel: 1 | 2;
  createdAt: string;
}

export interface ReferralStat {
  id: string;
  referrerUsername: string;
  refereeUsername: string;
  refereeJoinedAt: string;
  depositMet: boolean; // >= 150 BDT
  currentDeposit: number;
  wagerMet: boolean; // >= 2000 BDT
  currentWager: number;
  isQualified: boolean; // both met
  isClaimed: boolean;
  bonusAmount: number; // 200 BDT
  claimedAt?: string;
}

export interface RoundHistoryItem {
  roundId: number;
  multiplier: number;
  crashedAt: string;
  hash: string;
}

export interface LiveBot {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  targetMult: number;
  cashedOut: boolean;
  winAmount: number;
}

export type BigSmallChoice = 'big' | 'small' | 'green' | 'violet' | 'red';

export interface BigSmallRound {
  periodId: string; // e.g. 20260916001
  number: number; // 0 to 9
  size: 'big' | 'small'; // 0-4 = small, 5-9 = big
  color: 'green' | 'violet' | 'red'; // 1,3,7,9 = green; 2,4,6,8 = red; 0,5 = violet/mixed
  time: string;
}

export interface BigSmallBet {
  id: string;
  periodId: string;
  username: string;
  choice: BigSmallChoice;
  amount: number;
  winAmount: number;
  status: 'pending' | 'won' | 'lost';
  payoutMult: number; // 1.96 for big/small
  createdAt: string;
}
