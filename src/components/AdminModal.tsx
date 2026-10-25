import React, { useState } from 'react';
import { User, DepositRecord, WithdrawRecord, UserRole } from '../types';
import { storage, WinMode, GameConfig } from '../utils/storage';
import { 
  Shield, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  Sliders, 
  Check, 
  X, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Phone, 
  Search, 
  Copy, 
  Plus, 
  Minus, 
  RefreshCw, 
  Flame, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  UserCheck, 
  UserX,
  CreditCard,
  Zap,
  Dice5,
  Crown
} from 'lucide-react';

interface AdminModalProps {
  onDataChanged: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onDataChanged }) => {
  const [activeSubTab, setActiveSubTab] = useState<'gameConfig' | 'deposits' | 'withdrawals' | 'users' | 'settings'>('gameConfig');
  
  // Data States
  const [deposits, setDeposits] = useState<DepositRecord[]>(() => storage.getDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>(() => storage.getWithdrawals());
  const [users, setUsers] = useState<Record<string, User>>(() => storage.getUsers());
  const [config, setConfig] = useState<GameConfig>(() => storage.getConfig());
  
  // Game Config Form States
  const [customMult, setCustomMult] = useState<string>(config.forcedNextMultiplier ? config.forcedNextMultiplier.toString() : '');
  const [isPersistent, setIsPersistent] = useState<boolean>(!!config.isForcedPersistent);
  const [winRateMode, setWinRateMode] = useState<WinMode>(config.winRateMode || 'medium');
  const [superAceWinMode, setSuperAceWinMode] = useState<WinMode>(config.superAceWinMode || config.winRateMode || 'medium');
  const [bigSmallOverride, setBigSmallOverride] = useState<string>(
    config.bigSmallOverride === null || config.bigSmallOverride === undefined
      ? 'random'
      : String(config.bigSmallOverride)
  );

  // Phone settings
  const [bkashPhone, setBkashPhone] = useState(config.adminPhone || '01788294401');
  const [nagadPhone, setNagadPhone] = useState(config.adminNagadPhone || config.adminPhone || '01788294401');
  const [rocketPhone, setRocketPhone] = useState(config.adminRocketPhone || config.adminPhone || '01788294401');

  // Search and Filter States
  const [userSearch, setUserSearch] = useState('');
  const [depFilter, setDepFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [witFilter, setWitFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTrx, setSearchTrx] = useState('');
  
  // User Balance Custom Form
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<string | null>(null);
  const [customBalanceAmount, setCustomBalanceAmount] = useState<string>('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
  // Notification banner
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: 'success' | 'danger' | 'info' } | null>(null);

  const notify = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // 1. Approve Deposit
  const handleApproveDeposit = (depId: string) => {
    const allDeps = storage.getDeposits();
    const dep = allDeps.find((d) => d.id === depId);
    if (!dep || dep.status !== 'pending') return;

    dep.status = 'approved';
    dep.reviewedAt = new Date().toLocaleString();
    storage.saveDeposits(allDeps);

    // Credit user balance and increment totalDeposited
    const allUsers = storage.getUsers();
    if (allUsers[dep.username]) {
      allUsers[dep.username].balance += dep.amount;
      allUsers[dep.username].totalDeposited = (allUsers[dep.username].totalDeposited || 0) + dep.amount;
      storage.saveUsers(allUsers);
    }

    // Update referral progress
    storage.updateRefereeProgress(dep.username, dep.amount, 0);

    setDeposits([...allDeps]);
    setUsers(storage.getUsers());
    notify(`ডিপোজিট #${dep.id} (৳${dep.amount}) সফলভাবে অনুমোদিত হয়েছে! యూজার ব্যালেন্সে টাকা যোগ হয়েছে।`);
    onDataChanged();
  };

  // 2. Reject Deposit
  const handleRejectDeposit = (depId: string) => {
    const allDeps = storage.getDeposits();
    const dep = allDeps.find((d) => d.id === depId);
    if (!dep || dep.status !== 'pending') return;

    dep.status = 'rejected';
    dep.reviewedAt = new Date().toLocaleString();
    storage.saveDeposits(allDeps);

    setDeposits([...allDeps]);
    notify(`ডিপোজিট #${dep.id} বাতিল করা হয়েছে।`, 'danger');
    onDataChanged();
  };

  // 3. Approve Withdrawal
  const handleApproveWithdrawal = (witId: string) => {
    const allWits = storage.getWithdrawals();
    const wit = allWits.find((w) => w.id === witId);
    if (!wit || wit.status !== 'pending') return;

    wit.status = 'approved';
    wit.reviewedAt = new Date().toLocaleString();
    storage.saveWithdrawals(allWits);

    setWithdrawals([...allWits]);
    notify(`উত্তোলন #${wit.id} (৳${wit.amount}) অনুমোদিত হয়েছে (টাকা পাঠানো সম্পন্ন)!`);
    onDataChanged();
  };

  // 4. Reject Withdrawal (Refund balance back to user)
  const handleRejectWithdrawal = (witId: string) => {
    const allWits = storage.getWithdrawals();
    const wit = allWits.find((w) => w.id === witId);
    if (!wit || wit.status !== 'pending') return;

    wit.status = 'rejected';
    wit.reviewedAt = new Date().toLocaleString();
    storage.saveWithdrawals(allWits);

    // Refund user wallet
    const allUsers = storage.getUsers();
    if (allUsers[wit.username]) {
      allUsers[wit.username].balance += wit.amount;
      storage.saveUsers(allUsers);
    }

    setWithdrawals([...allWits]);
    setUsers(storage.getUsers());
    notify(`উত্তোলন #${wit.id} বাতিল করা হয়েছে এবং ৳${wit.amount} ইউজারের অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।`, 'info');
    onDataChanged();
  };

  // 5. Adjust User Balance (+ or - delta)
  const handleAdjustUserBalance = (username: string, delta: number) => {
    const allUsers = storage.getUsers();
    if (!allUsers[username]) return;

    const newBal = Math.max(0, allUsers[username].balance + delta);
    allUsers[username].balance = newBal;
    storage.saveUsers(allUsers);
    setUsers({ ...allUsers });
    notify(`${username}-এর ব্যালেন্সে ৳${delta > 0 ? '+' : ''}${delta} পরিবর্তন করা হয়েছে। নতুন ব্যালেন্স: ৳${newBal}`);
    onDataChanged();
  };

  // 6. Set Exact User Balance
  const handleSetExactBalance = (username: string, exactAmount: number) => {
    if (isNaN(exactAmount) || exactAmount < 0) return;
    storage.setUserBalance(username, exactAmount);
    setUsers(storage.getUsers());
    setSelectedUserForBalance(null);
    setCustomBalanceAmount('');
    notify(`${username}-এর ব্যালেন্স সরাসরি ৳${exactAmount.toFixed(2)} সেট করা হয়েছে!`);
    onDataChanged();
  };

  // 7. Toggle User Role (Admin / User)
  const handleToggleRole = (username: string) => {
    if (username === 'admin') {
      notify('মাস্টার এডমিনের রোল পরিবর্তন করা যাবে না!', 'danger');
      return;
    }
    const allUsers = storage.getUsers();
    const target = allUsers[username];
    if (!target) return;

    const newRole: UserRole = target.role === 'admin' ? 'user' : 'admin';
    storage.setUserRole(username, newRole);
    setUsers(storage.getUsers());
    notify(`${username}-এর রোল '${newRole === 'admin' ? 'এডমিন (Admin)' : 'ইউজার (User)'}' এ পরিবর্তন করা হয়েছে!`);
    onDataChanged();
  };

  // 8. Delete User
  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      notify('মাস্টার এডমিন একাউন্ট মুছে ফেলা যাবে না!', 'danger');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${username}' অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }
    const success = storage.deleteUser(username);
    if (success) {
      setUsers(storage.getUsers());
      notify(`ইউজার '${username}' সফলভাবে মুছে ফেলা হয়েছে!`, 'danger');
      onDataChanged();
    }
  };

  // 9. Save Game Controls
  const handleSaveGameControls = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mult = customMult.trim() ? parseFloat(customMult) : null;
    let overrideVal: 'big' | 'small' | number | null = null;
    if (bigSmallOverride === 'big' || bigSmallOverride === 'small') {
      overrideVal = bigSmallOverride;
    } else if (bigSmallOverride !== 'random' && !isNaN(parseInt(bigSmallOverride))) {
      overrideVal = parseInt(bigSmallOverride);
    }

    const newCfg: GameConfig = {
      ...config,
      forcedNextMultiplier: mult && mult >= 1.01 ? mult : null,
      isForcedPersistent: isPersistent,
      winRateMode,
      superAceWinMode,
      bigSmallOverride: overrideVal,
      adminPhone: bkashPhone.trim() || '01788294401',
      adminNagadPhone: nagadPhone.trim() || '01788294401',
      adminRocketPhone: rocketPhone.trim() || '01788294401',
    };

    storage.saveConfig(newCfg);
    setConfig(newCfg);
    notify('গেম ইঞ্জিন কন্ট্রোল ও উইনিং রেট সফলভাবে সংরক্ষিত হয়েছে!');
    onDataChanged();
  };

  // 10. Instant Emergency Crash Trigger
  const handleEmergencyCrash = () => {
    window.dispatchEvent(new CustomEvent('aviator_admin_force_crash'));
    notify('🚨 ইমার্জেন্সি কমান্ড পাঠানো হয়েছে: বিমানটি তাৎক্ষণিক ক্র্যাশ করানো হয়েছে!', 'danger');
  };

  // 11. Clear / Reset Forced Multiplier
  const handleResetForcedMultiplier = () => {
    setCustomMult('');
    setIsPersistent(false);
    const newCfg: GameConfig = {
      ...config,
      forcedNextMultiplier: null,
      isForcedPersistent: false,
    };
    storage.saveConfig(newCfg);
    setConfig(newCfg);
    notify('ফিক্সড মাল্টিপ্লায়ার বাতিল করা হয়েছে। এখন স্বাভাবিক অ্যালগরিদম কার্যকর।', 'info');
    onDataChanged();
  };

  // 12. Quick Set Multiplier Preset
  const handleQuickSetMultiplier = (val: number, persistent: boolean = false) => {
    const strVal = val.toFixed(2);
    setCustomMult(strVal);
    setIsPersistent(persistent);
    const newCfg: GameConfig = {
      ...config,
      forcedNextMultiplier: val,
      isForcedPersistent: persistent,
    };
    storage.saveConfig(newCfg);
    setConfig(newCfg);
    notify(`পরবর্তী রাউন্ডের ক্র্যাশ মাল্টিপ্লায়ার ${strVal}x ফিক্সড করা হয়েছে (${persistent ? 'স্থায়ীভাবে' : '১ রাউন্ড'})!`);
    onDataChanged();
  };

  // Calculated Stats
  const pendingDepositsList = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawalsList = withdrawals.filter((w) => w.status === 'pending');
  const userList = Object.values(users) as User[];
  const totalUsersCount = userList.length;
  const totalPlatformBalance = userList.reduce((acc, u) => acc + (u.balance || 0), 0);

  // Filtered Lists
  const filteredUsers = userList.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const filteredDeposits = deposits.filter((d) => {
    if (depFilter !== 'all' && d.status !== depFilter) return false;
    if (searchTrx.trim()) {
      const q = searchTrx.toLowerCase();
      return (
        d.trxId.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.senderPhone.includes(q)
      );
    }
    return true;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (witFilter !== 'all' && w.status !== witFilter) return false;
    if (searchTrx.trim()) {
      const q = searchTrx.toLowerCase();
      return (
        w.username.toLowerCase().includes(q) ||
        w.accountPhone.includes(q) ||
        w.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl w-full space-y-4 animate-in fade-in duration-200">
      {/* Top Banner / Master Dashboard Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/70 border border-purple-500/50 p-5 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  মাস্টার অ্যাডমিন কন্ট্রোল প্যানেল
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-400 uppercase">
                  Live System
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                গেম ইঞ্জিন উইনিং রেট, তাৎক্ষণিক ক্র্যাশ, লেনদেন অনুমোদন ও প্লেয়ার নিয়ন্ত্রণ
              </p>
            </div>
          </div>

          {/* Quick Stat Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-xl bg-black/60 border border-purple-500/30 px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">উইন মোড:</span>
              <span className="font-bold text-amber-400 uppercase">{config.winRateMode}</span>
            </div>
            <div className="rounded-xl bg-black/60 border border-emerald-500/30 px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">মোট ইউজার:</span>
              <span className="font-bold text-emerald-400">{totalUsersCount}</span>
            </div>
            <div className="rounded-xl bg-black/60 border border-blue-500/30 px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">প্লাটফর্ম ব্যালেন্স:</span>
              <span className="font-numeric font-black text-white">৳{totalPlatformBalance.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex rounded-xl bg-black/50 p-1 border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveSubTab('gameConfig')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'gameConfig'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-purple-400" />
            <span>গেম ইঞ্জিন ও উইন কন্ট্রোল</span>
            {config.forcedNextMultiplier && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'deposits'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
            <span>ডিপোজিট রিকোয়েস্ট</span>
            {pendingDepositsList.length > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] text-white font-numeric">
                {pendingDepositsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('withdrawals')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'withdrawals'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
            <span>উত্তোলন রিকোয়েস্ট</span>
            {pendingWithdrawalsList.length > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] text-white font-numeric">
                {pendingWithdrawalsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span>ইউজার ম্যানেজমেন্ট ও ব্যালেন্স</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Phone className="h-3.5 w-3.5 text-amber-400" />
            <span>পেমেন্ট নম্বর সেটিংস</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            actionNotice.type === 'danger'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200 shadow-rose-950/40'
              : actionNotice.type === 'info'
              ? 'bg-blue-950/80 border-blue-500/50 text-blue-200 shadow-blue-950/40'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'danger' ? (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{actionNotice.msg}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: GAME CONFIG & WINNING RIGGING CONTROLS
         ========================================================================= */}
      {activeSubTab === 'gameConfig' && (
        <div className="rounded-2xl bg-black/60 border border-slate-800 p-5 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" /> 
                গেম ইঞ্জিন ও লাইভ উইনিং কন্ট্রোল প্যানেল
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                এভিয়েটর বিমান, সুপার এস এবং বিগ/স্মলের ফলাফল ও সম্ভাবনা এখান থেকেই সম্পূর্ণ নিয়ন্ত্রণ করুন।
              </p>
            </div>

            {/* Emergency Flight Crash Button */}
            <button
              type="button"
              onClick={handleEmergencyCrash}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-black shadow-[0_0_15px_rgba(225,29,72,0.4)] transition active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>🚨 এখনই ক্র্যাশ করান (Crash Now)</span>
            </button>
          </div>

          <form onSubmit={handleSaveGameControls} className="space-y-6 text-xs">
            {/* 1. AVIATOR NEXT CRASH MULTIPLIER OVERRIDE */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500/40 p-4 sm:p-5 space-y-3.5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <label className="font-black text-white text-sm block">
                      পরবর্তী রাউন্ডের ফিক্সড ক্র্যাশ মাল্টিপ্লায়ার (Fixed Crash Multiplier)
                    </label>
                    <p className="text-slate-400 text-[11px]">
                      আপনি যে সংখ্যাটি সেট করবেন, পরবর্তী রাউন্ডে বিমানটি ঠিক ওই সংখ্যায় ক্র্যাশ করবে।
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                {config.forcedNextMultiplier ? (
                  <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 px-3 py-1.5 rounded-xl">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-black text-rose-300">
                      সক্রিয়: {config.forcedNextMultiplier}x ({config.isForcedPersistent ? 'স্থায়ী' : '১টি রাউন্ড'})
                    </span>
                    <button
                      type="button"
                      onClick={handleResetForcedMultiplier}
                      className="ml-1 text-[10px] bg-rose-800 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                    স্বাভাবিক অটো-অ্যালগরিদম সক্রিয়
                  </span>
                )}
              </div>

              {/* Input + Presets */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max="1000"
                      value={customMult}
                      onChange={(e) => setCustomMult(e.target.value)}
                      placeholder="যেমন: 2.50"
                      className="bg-black/90 border border-purple-500/70 rounded-xl px-3.5 py-2.5 text-white font-numeric text-base focus:outline-none focus:ring-2 focus:ring-purple-500 w-48 shadow-inner"
                    />
                    <span className="absolute right-3.5 top-2.5 text-purple-400 font-bold text-sm">x</span>
                  </div>

                  {/* Persistence Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 border border-slate-700/80 px-3 py-2 rounded-xl select-none">
                    <input
                      type="checkbox"
                      checked={isPersistent}
                      onChange={(e) => setIsPersistent(e.target.checked)}
                      className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-300">
                      স্থায়ীভাবে প্রতি রাউন্ডে এই মাল্টিপ্লায়ার কার্যকর থাকবে
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    সেভ ও সক্রিয় করুন
                  </button>
                </div>

                {/* Instant 1-Click Multiplier Presets */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 tracking-wider">
                    এক ক্লিকে তাৎক্ষণিক মাল্টিপ্লায়ার সেট করুন:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { val: 1.10, label: '1.10x (তাৎক্ষণিক লস)', color: 'border-rose-600/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60' },
                      { val: 1.25, label: '1.25x', color: 'border-slate-700 bg-slate-800 text-slate-200' },
                      { val: 1.50, label: '1.50x', color: 'border-slate-700 bg-slate-800 text-slate-200' },
                      { val: 2.00, label: '2.00x (ডাবল)', color: 'border-blue-600/50 bg-blue-950/40 text-blue-300' },
                      { val: 3.50, label: '3.50x', color: 'border-slate-700 bg-slate-800 text-slate-200' },
                      { val: 5.00, label: '5.00x', color: 'border-amber-600/50 bg-amber-950/40 text-amber-300' },
                      { val: 10.00, label: '10.00x', color: 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' },
                      { val: 25.00, label: '25.00x', color: 'border-purple-600/50 bg-purple-950/40 text-purple-300' },
                      { val: 50.00, label: '50.00x', color: 'border-fuchsia-600/50 bg-fuchsia-950/40 text-fuchsia-300' },
                      { val: 100.00, label: '100.00x (মেগা মুন)', color: 'border-yellow-500 bg-yellow-950/60 text-yellow-300 font-black' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => handleQuickSetMultiplier(p.val, false)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition active:scale-95 cursor-pointer ${p.color}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GLOBAL CASINO WIN RATE MODE */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <label className="font-black text-white text-sm block">
                    সার্বজনীন ক্যাসিনো উইনিং রেট মোড (Global Casino Win Mode)
                  </label>
                  <p className="text-slate-400 text-[11px]">
                    প্রতি রাউন্ডে প্লেয়ারদের সামগ্রিক জেতার হার ও হাউস প্রফিট নির্ধারণ করুন:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {[
                  {
                    id: 'low' as WinMode,
                    title: '🔴 লো উইনিং (House Profit)',
                    desc: 'ক্যাসিনোর সর্বোচ্চ লাভ! বেশিরভাগ ক্র্যাশ দ্রুত (1.05x - 1.80x) ঘটবে।',
                    badge: 'ক্যাসিনো লাভ',
                    color: 'from-rose-950/60 to-slate-900 border-rose-700/60 text-rose-300',
                  },
                  {
                    id: 'medium' as WinMode,
                    title: '🟡 ব্যালান্সড (Balanced 97%)',
                    desc: 'স্বাভাবিক ক্যাসিনো রুলস। 1.25x - 8.0x নিয়মিত ক্র্যাশ ও বাস্তবসম্মত অভিজ্ঞতা।',
                    badge: 'ডিফল্ট',
                    color: 'from-amber-950/60 to-slate-900 border-amber-700/60 text-amber-300',
                  },
                  {
                    id: 'high' as WinMode,
                    title: '🟢 হাই উইনিং (Player Friendly)',
                    desc: 'প্লেয়াররা বেশি জিতবে (2.0x - 15.0x)। নতুন গ্রাহক আকর্ষণ করতে সেরা।',
                    badge: 'প্লেয়ার উইন',
                    color: 'from-emerald-950/60 to-slate-900 border-emerald-700/60 text-emerald-300',
                  },
                  {
                    id: 'ultra' as WinMode,
                    title: '🟣 আল্ট্রা জ্যাকপট (Ultra Jackpot)',
                    desc: 'বিশাল মেগা মাল্টিপ্লায়ার (10x - 50x+) এবং স্লটের বড় জ্যাকপট প্রায় প্রতি রাউন্ডে।',
                    badge: 'জ্যাকপট মোড',
                    color: 'from-purple-950/60 to-slate-900 border-purple-700/60 text-purple-200',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setWinRateMode(mode.id);
                      setSuperAceWinMode(mode.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                      winRateMode === mode.id
                        ? 'bg-gradient-to-b ' + mode.color + ' ring-2 ring-purple-500 shadow-lg'
                        : 'bg-black/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-xs text-white">{mode.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 font-bold border border-slate-700/60 text-slate-400">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
                    </div>
                    {winRateMode === mode.id && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <Check className="h-3 w-3" /> নির্বাচিত
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. GAME-SPECIFIC CONTROLS (SUPER ACE & BIG/SMALL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Super Ace Special Controls */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <label className="font-bold text-white text-xs block">
                    সুপার এস (Super Ace) কার্ড উইন রেট
                  </label>
                </div>
                <p className="text-slate-400 text-[11px]">
                  গোল্ডেন কার্ডের পরিমাণ ও স্ক্যাটার (Free Spins) পাওয়ার সুযোগ নির্ধারণ করুন:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'low' as WinMode, label: 'কম উইন (Low Win)' },
                    { id: 'medium' as WinMode, label: 'স্বাভাবিক (97% RTP)' },
                    { id: 'high' as WinMode, label: 'বেশি স্ক্যাটার ও জোকার' },
                    { id: 'ultra' as WinMode, label: 'মেগা জ্যাকপট ও বিগ জোকার' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSuperAceWinMode(s.id)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border text-center transition cursor-pointer ${
                        superAceWinMode === s.id
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big / Small Wingo Controls */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Dice5 className="h-4 w-4 text-blue-400" />
                  <label className="font-bold text-white text-xs block">
                    বিগ / স্মল (Big / Small 1.96x) ফলাফল কন্ট্রোল
                  </label>
                </div>
                <p className="text-slate-400 text-[11px]">
                  পরবর্তী রাউন্ডের রেজাল্ট আগে থেকেই নির্ধারণ করতে চান?
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { val: 'random', label: 'স্বাভাবিক (অটো)' },
                    { val: 'big', label: 'বাধ্যতামূলক BIG' },
                    { val: 'small', label: 'বাধ্যতামূলক SMALL' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setBigSmallOverride(opt.val)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition cursor-pointer ${
                        bigSmallOverride === opt.val
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-1 ring-blue-500 shadow'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                পরিবর্তন সেভ করলে প্ল্যাটফর্মের সব গেমের জন্য সাথে সাথে কার্যকর হবে।
              </span>
              <button
                type="submit"
                className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>উইনিং রেট ও সেটিংস সেভ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PENDING DEPOSITS
         ========================================================================= */}
      {activeSubTab === 'deposits' && (
        <div className="rounded-2xl bg-black/60 border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> 
                ডিপোজিট রিকোয়েস্ট তালিকা ({pendingDepositsList.length} টি পেন্ডিং)
              </h3>
              <p className="text-xs text-slate-400">ব্যবহারকারীদের পাঠানো ডিপোজিট TrxID যাচাই করে অনুমোদন দিন</p>
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setDepFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition capitalize ${
                    depFilter === st ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'pending' ? 'পেন্ডিং' : st === 'approved' ? 'অনুমোদিত' : st === 'rejected' ? 'বাতিল' : 'সকল'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTrx}
              onChange={(e) => setSearchTrx(e.target.value)}
              placeholder="TrxID, ইউজারনেম বা প্রেরকের মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Deposit Cards */}
          <div className="space-y-2.5">
            {filteredDeposits.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                কোনো ডিপোজিট রেকর্ড পাওয়া যায়নি!
              </div>
            ) : (
              filteredDeposits.map((dep, idx) => (
                <div
                  key={`${dep.id}-${idx}`}
                  className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{dep.username}</span>
                      <span className="font-numeric font-black text-emerald-400 text-base">৳{dep.amount}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold border border-slate-700">
                        {dep.method}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          dep.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : dep.status === 'rejected'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {dep.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span><strong>TrxID:</strong> <code className="font-mono text-amber-400 font-bold">{dep.trxId}</code></span>
                      <span>| <strong>প্রেরক নম্বর:</strong> {dep.senderPhone}</span>
                      <span>| <span className="text-slate-500">{dep.createdAt}</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  {dep.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveDeposit(dep.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition active:scale-95 cursor-pointer shadow"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>অনুমোদন (Approve)</span>
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(dep.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold transition active:scale-95 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>বাতিল</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {dep.reviewedAt ? `যাচাই: ${dep.reviewedAt}` : 'নিষ্পন্ন'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PENDING WITHDRAWALS
         ========================================================================= */}
      {activeSubTab === 'withdrawals' && (
        <div className="rounded-2xl bg-black/60 border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" /> 
                উত্তোলন রিকোয়েস্ট তালিকা ({pendingWithdrawalsList.length} টি পেন্ডিং)
              </h3>
              <p className="text-xs text-slate-400">গ্রাহকের বিকাশ/নগদ নম্বরে টাকা পাঠিয়ে অনুমোদন করুন</p>
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setWitFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition capitalize ${
                    witFilter === st ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'pending' ? 'পেন্ডিং' : st === 'approved' ? 'অনুমোদিত' : st === 'rejected' ? 'বাতিল' : 'সকল'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTrx}
              onChange={(e) => setSearchTrx(e.target.value)}
              placeholder="ইউজারনেম বা উত্তোলনের পার্সোনাল নম্বর দিয়ে খুঁজুন..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Withdrawal Cards */}
          <div className="space-y-2.5">
            {filteredWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                কোনো উত্তোলন রেকর্ড পাওয়া যায়নি!
              </div>
            ) : (
              filteredWithdrawals.map((wit, idx) => (
                <div
                  key={`${wit.id}-${idx}`}
                  className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{wit.username}</span>
                      <span className="font-numeric font-black text-blue-400 text-base">৳{wit.amount}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold border border-slate-700">
                        {wit.method}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          wit.status === 'approved'
                            ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                            : wit.status === 'rejected'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-950 text-amber-400 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {wit.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span>
                        <strong>গ্রাহকের পার্সোনাল নম্বর:</strong>{' '}
                        <code className="font-mono text-amber-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-slate-700">
                          {wit.accountPhone}
                        </code>
                      </span>
                      <span>| <span className="text-slate-500">{wit.createdAt}</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  {wit.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveWithdrawal(wit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition active:scale-95 cursor-pointer shadow"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>অনুমোদন (টাকা পাঠানো হয়েছে)</span>
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(wit.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold transition active:scale-95 cursor-pointer"
                        title="উইথড্র বাতিল করে ইউজারের ব্যালেন্সে টাকা ফেরত পাঠান"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>বাতিল ও রিফান্ড</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {wit.reviewedAt ? `যাচাই: ${wit.reviewedAt}` : 'নিষ্পন্ন'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: USER MANAGEMENT & BALANCE CONTROLS
         ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="rounded-2xl bg-black/60 border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" /> 
                রেজিস্টার্ড ইউজার তালিকা ও ব্যালেন্স নিয়ন্ত্রণ ({totalUsersCount} জন)
              </h3>
              <p className="text-xs text-slate-400">যে কোনো ইউজারের ব্যালেন্স সরাসরি যোগ, কর্তন বা রিসেট করুন</p>
            </div>

            {/* User Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ইউজারনেম বা মোবাইল নম্বর..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* User Cards List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                কোনো ইউজার পাওয়া যায়নি!
              </div>
            ) : (
              filteredUsers.map((u, idx) => (
                <div
                  key={`${u.username}-${idx}`}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{u.username}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            u.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                        {u.referredBy && (
                          <span className="text-[10px] text-amber-400/90 font-mono">
                            (Ref by: {u.referredBy})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 mt-1">
                        <span>মোবাইল: <strong className="text-white font-mono">{u.phone || 'N/A'}</strong></span>
                        <div className="flex items-center gap-1">
                          <span>পাসওয়ার্ড:</span>
                          <span className="font-mono text-amber-400 font-bold bg-black/60 px-1.5 py-0.2 rounded border border-slate-800">
                            {revealedPasswords[u.username] ? u.password : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPasswords((prev) => ({
                                ...prev,
                                [u.username]: !prev[u.username],
                              }))
                            }
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            {revealedPasswords[u.username] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                        <span>যোগদান: {u.createdAt || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Balance Highlight */}
                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">বর্তমান ব্যালেন্স</span>
                      <span className="font-numeric text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                        ৳{u.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Balance Controls */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-1">
                    {/* Quick Adjust Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">ব্যালেন্স:</span>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, 100)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-300 font-bold text-[11px] transition active:scale-95"
                      >
                        +৳১০০
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, 500)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-300 font-bold text-[11px] transition active:scale-95"
                      >
                        +৳৫০০
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, 1000)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-300 font-bold text-[11px] transition active:scale-95"
                      >
                        +৳১,০০০
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, 5000)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-300 font-bold text-[11px] transition active:scale-95"
                      >
                        +৳৫,০০০
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, -100)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-800 border border-rose-600/50 text-rose-300 font-bold text-[11px] transition active:scale-95"
                      >
                        -৳১০০
                      </button>
                      <button
                        onClick={() => handleAdjustUserBalance(u.username, -500)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-800 border border-rose-600/50 text-rose-300 font-bold text-[11px] transition active:scale-95"
                      >
                        -৳৫০০
                      </button>
                    </div>

                    {/* Custom Balance Input Popup or Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedUserForBalance === u.username ? (
                        <div className="flex items-center gap-1.5 bg-black/80 border border-purple-500/60 p-1.5 rounded-xl">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={customBalanceAmount}
                            onChange={(e) => setCustomBalanceAmount(e.target.value)}
                            placeholder="টাকার অংক..."
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSetExactBalance(u.username, parseFloat(customBalanceAmount))}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg"
                          >
                            সেট করুন
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForBalance(null);
                              setCustomBalanceAmount('');
                            }}
                            className="px-1.5 py-1 text-slate-400 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForBalance(u.username);
                            setCustomBalanceAmount(u.balance.toString());
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700"
                        >
                          সরাসরি ব্যালেন্স সেট
                        </button>
                      )}

                      {/* Toggle Role */}
                      {u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleRole(u.username)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            u.role === 'admin'
                              ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900'
                              : 'bg-purple-950/60 border-purple-600/50 text-purple-300 hover:bg-purple-900'
                          }`}
                        >
                          {u.role === 'admin' ? 'এডমিন বাতিল' : 'এডমিন বানান'}
                        </button>
                      )}

                      {/* Delete user */}
                      {u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.username)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/40 transition"
                          title="ইউজার অ্যাকাউন্ট মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: PAYMENT RECEIVER PHONE NUMBERS & SETTINGS
         ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="rounded-2xl bg-black/60 border border-slate-800 p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Phone className="h-4 w-4" /> 
              অফিশিয়াল ডিপোজিট গ্রহণকারী নম্বর সেটিংস
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ইউজাররা ওয়ালেটে ডিপোজিট করার সময় বিকাশ, নগদ ও রকেটের যে ব্যক্তিগত নম্বরে সেন্ড মানি করবে:
            </p>
          </div>

          <form onSubmit={handleSaveGameControls} className="space-y-4 max-w-xl text-xs">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1.5">
              <label className="font-bold text-white text-xs block">
                bKash পার্সোনাল নম্বর (Send Money):
              </label>
              <input
                type="text"
                value={bkashPhone}
                onChange={(e) => setBkashPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-black/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-numeric text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1.5">
              <label className="font-bold text-white text-xs block">
                Nagad পার্সোনাল নম্বর (Send Money):
              </label>
              <input
                type="text"
                value={nagadPhone}
                onChange={(e) => setNagadPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-black/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-numeric text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1.5">
              <label className="font-bold text-white text-xs block">
                Rocket পার্সোনাল নম্বর (Send Money):
              </label>
              <input
                type="text"
                value={rocketPhone}
                onChange={(e) => setRocketPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-black/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-numeric text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>পেমেন্ট নম্বরসমূহ সেভ করুন</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
