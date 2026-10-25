import React, { useState } from 'react';
import { User, DepositRecord, WithdrawRecord, PaymentMethod } from '../types';
import { storage } from '../utils/storage';
import { ArrowDownLeft, ArrowUpRight, Copy, Check, AlertCircle, History, Wallet as WalletIcon, Crown, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { getVipInfo } from '../utils/vip';

interface WalletModalProps {
  user: User;
  onUserUpdated: (u: User) => void;
  onClose?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ user, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [copied, setCopied] = useState(false);

  // Deposit Form
  const [depAmount, setDepAmount] = useState<string>('200');
  const [depTrx, setDepTrx] = useState<string>('');
  const [depSender, setDepSender] = useState<string>('');
  const [depSuccessMsg, setDepSuccessMsg] = useState<string | null>(null);

  // Withdraw Form
  const [witAmount, setWitAmount] = useState<string>('300');
  const [witPhone, setWitPhone] = useState<string>('');
  const [witSuccessMsg, setWitSuccessMsg] = useState<string | null>(null);
  const [witErrorMsg, setWitErrorMsg] = useState<string | null>(null);

  // History
  const [deposits, setDeposits] = useState<DepositRecord[]>(() => storage.getDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>(() => storage.getWithdrawals());

  const config = storage.getConfig();
  const officialNumber =
    method === 'Nagad'
      ? config.adminNagadPhone || config.adminPhone || '01788294401'
      : method === 'Rocket'
      ? config.adminRocketPhone || config.adminPhone || '01788294401'
      : config.adminPhone || '01788294401';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(officialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const vipInfo = getVipInfo(user);

  // Quick amounts tailored to user's VIP tier
  const quickAmounts =
    vipInfo.currentTier.level >= 4
      ? [1000, 5000, 10000, 25000, 50000]
      : vipInfo.currentTier.level >= 2
      ? [500, 1000, 2000, 5000, 10000]
      : vipInfo.currentTier.level >= 1
      ? [300, 500, 1000, 2000, 5000]
      : [150, 300, 500, 1000, 2000];

  // Submit Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depAmount);
    if (isNaN(amt) || amt < 100) {
      alert('ন্যূনতম ডিপোজিট পরিমাণ ১০০ টাকা!');
      return;
    }
    if (amt > vipInfo.maxDepositLimit) {
      alert(
        `আপনার বর্তমান ${vipInfo.currentTier.badgeTitle} (${vipInfo.currentTier.nameBn}) লেভেলে এককালীন সর্বোচ্চ ডিপোজিট লিমিট ৳${vipInfo.maxDepositLimit.toLocaleString()}!\nপরবর্তী লিমিট পেতে আরও বেট করে VIP লেভেল আপগ্রেড করুন।`
      );
      return;
    }
    if (!depTrx.trim()) {
      alert('সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন!');
      return;
    }

    const newDep: DepositRecord = {
      id: `dep-${Date.now()}`,
      username: user.username,
      amount: amt,
      trxId: depTrx.trim().toUpperCase(),
      method,
      senderPhone: depSender.trim() || user.phone || 'N/A',
      status: 'pending',
      createdAt: new Date().toLocaleString(),
    };

    const currentDeps = storage.getDeposits();
    const updated = [newDep, ...currentDeps];
    storage.saveDeposits(updated);
    setDeposits(updated);

    setDepSuccessMsg(`আপনার ৳${amt} ডিপোজিট রিকোয়েস্ট জমা হয়েছে! এডমিন শীঘ্রই যাচাই করে ব্যালেন্স যোগ করবেন।`);
    setDepTrx('');
    setDepSender('');
    setTimeout(() => setDepSuccessMsg(null), 6000);
  };

  // Submit Withdraw
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWitErrorMsg(null);
    setWitSuccessMsg(null);

    const amt = parseFloat(witAmount);
    if (isNaN(amt) || amt < 150) {
      setWitErrorMsg('ন্যূনতম উত্তোলনের পরিমাণ ১৫০ টাকা!');
      return;
    }
    if (amt > user.balance) {
      setWitErrorMsg('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }
    if (!witPhone.trim() || witPhone.length < 11) {
      setWitErrorMsg('১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন!');
      return;
    }

    // Deduct balance instantly
    const updatedUser = { ...user, balance: user.balance - amt };
    storage.updateUser(updatedUser);
    onUserUpdated(updatedUser);

    const newWit: WithdrawRecord = {
      id: `wit-${Date.now()}`,
      username: user.username,
      amount: amt,
      method,
      accountPhone: witPhone.trim(),
      status: 'pending',
      createdAt: new Date().toLocaleString(),
    };

    const currentWits = storage.getWithdrawals();
    const updated = [newWit, ...currentWits];
    storage.saveWithdrawals(updated);
    setWithdrawals(updated);

    setWitSuccessMsg(`৳${amt} উত্তোলনের রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে! কিছুক্ষণের মধ্যে টাকা আপনার ${method} নম্বরে পৌঁছে যাবে।`);
    setWitPhone('');
    setTimeout(() => setWitSuccessMsg(null), 6000);
  };

  const myDeposits = deposits.filter((d) => d.username === user.username);
  const myWithdrawals = withdrawals.filter((w) => w.username === user.username);

  return (
    <div className="mx-auto max-w-2xl w-full space-y-4">
      {/* Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-400">বর্তমান মোট ব্যালেন্স</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-numeric text-3xl sm:text-4xl font-black text-emerald-400">
                ৳{user.balance.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-400">BDT (বাংলাদেশী টাকা)</span>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex rounded-xl bg-black/60 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              ডিপোজিট
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'withdraw'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              উত্তোলন
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              হিস্ট্রি
            </button>
          </div>
        </div>
      </div>

      {/* 1. DEPOSIT TAB */}
      {activeTab === 'deposit' && (
        <div className="rounded-2xl bg-black/50 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" /> ইনস্ট্যান্ট ডিপোজিট (bKash / Nagad / Rocket)
            </h3>
            <span className="text-[11px] text-slate-400">মিনিমাম ৳১০০</span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['bKash', 'Nagad', 'Rocket', 'Upay'] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition ${
                  method === m
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Official Number Copy Card */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                আমাদের অফিসিয়াল <strong className="text-white">{method} Personal</strong> নম্বর:
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Send Money (সেন্ড মানি)
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/80 rounded-xl border border-slate-700/80 p-2.5">
              <span className="font-numeric text-lg sm:text-xl font-black text-amber-400 tracking-wider">
                {officialNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              * ওপরের নম্বরে সেন্ড মানি করে প্রাপ্ত TrxID এবং প্রেরকের নম্বর নিচে লিখে সাবমিট করুন।
            </p>
          </div>

          {depSuccessMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-3 text-xs text-emerald-300">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{depSuccessMsg}</span>
            </div>
          )}

          {/* VIP Level Deposit Limit Card */}
          <div className={`rounded-xl border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${vipInfo.currentTier.bgBadgeColor} ${vipInfo.currentTier.borderBadgeColor}`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{vipInfo.currentTier.accentIcon}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider ${vipInfo.currentTier.textColor}`}>
                    {vipInfo.currentTier.badgeTitle} · {vipInfo.currentTier.nameBn}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  সর্বোচ্চ এককালীন ডিপোজিট লিমিট: <strong className="text-white font-numeric">৳{vipInfo.maxDepositLimit.toLocaleString()}</strong> (দৈনিক ৳{vipInfo.currentTier.dailyDepositLimit.toLocaleString()})
                </p>
              </div>
            </div>
            {vipInfo.nextTier && (
              <div className="text-right text-[10px] text-slate-400">
                <span>পরবর্তী {vipInfo.nextTier.badgeTitle}-এ লিমিট: <strong className="text-emerald-400 font-numeric">৳{vipInfo.nextTier.maxDeposit.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">ডিপোজিটের পরিমাণ (BDT)</label>
                <span className="text-[11px] text-slate-500 font-medium">
                  সীমা: ৳১০০ - ৳{vipInfo.maxDepositLimit.toLocaleString()}
                </span>
              </div>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="100"
                  max={vipInfo.maxDepositLimit}
                  required
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  placeholder="যেমন: 200"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-numeric font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">BDT</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickAmounts.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setDepAmount(String(quick))}
                    className={`font-numeric text-xs border px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      Number(depAmount) === quick
                        ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    ৳{quick.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">ট্রানজেকশন আইডি (TrxID)</label>
              <input
                type="text"
                required
                value={depTrx}
                onChange={(e) => setDepTrx(e.target.value)}
                placeholder="যেমন: 9B7X8KL90"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono uppercase text-white focus:outline-none focus:border-emerald-500 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">যে নম্বর থেকে টাকা পাঠিয়েছেন (অপশনাল)</label>
              <input
                type="text"
                value={depSender}
                onChange={(e) => setDepSender(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition active:scale-95"
            >
              ডিপোজিট রিকোয়েস্ট পাঠান
            </button>
          </form>
        </div>
      )}

      {/* 2. WITHDRAW TAB */}
      {activeTab === 'withdraw' && (
        <div className="rounded-2xl bg-black/50 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" /> দ্রুত উত্তোলন (Withdraw)
            </h3>
            <span className="text-[11px] text-slate-400">মিনিমাম ৳১৫০</span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['bKash', 'Nagad', 'Rocket', 'Upay'] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition ${
                  method === m
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {witErrorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-950/30 border border-rose-500/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{witErrorMsg}</span>
            </div>
          )}

          {witSuccessMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-3 text-xs text-emerald-300">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{witSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">উত্তোলনের পরিমাণ (BDT)</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="150"
                  max={Math.floor(user.balance)}
                  required
                  value={witAmount}
                  onChange={(e) => setWitAmount(e.target.value)}
                  placeholder="যেমন: 300"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-numeric font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">BDT</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                সর্বোচ্চ তোলার যোগ্য ব্যালেন্স: ৳{user.balance.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">আপনার {method} পার্সোনাল নম্বর</label>
              <input
                type="text"
                required
                value={witPhone}
                onChange={(e) => setWitPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-numeric text-white focus:outline-none focus:border-blue-500 mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition active:scale-95"
            >
              উইথড্র রিকোয়েস্ট নিশ্চিত করুন
            </button>
          </form>
        </div>
      )}

      {/* 3. TRANSACTION HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="rounded-2xl bg-black/50 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History className="h-4 w-4 text-rose-500" /> ওয়ালেট ট্রানজেকশন হিস্ট্রি
            </h3>
            <span className="text-xs text-slate-400">মোট {myDeposits.length + myWithdrawals.length} টি</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {myDeposits.length === 0 && myWithdrawals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                কোনো ট্রানজেকশন হিস্ট্রি পাওয়া যায়নি
              </div>
            ) : (
              [
                ...myDeposits.map((d) => ({ ...d, type: 'Deposit' as const })),
                ...myWithdrawals.map((w) => ({ ...w, type: 'Withdraw' as const })),
              ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((tx, idx) => {
                  const isDep = tx.type === 'Deposit';
                  const badgeColor =
                    tx.status === 'approved'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : tx.status === 'rejected'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                  const badgeText =
                    tx.status === 'approved'
                      ? 'অ্যাপ্রুভড'
                      : tx.status === 'rejected'
                      ? 'বাতিল'
                      : 'পেন্ডিং';

                  return (
                    <div
                      key={`${tx.type}-${tx.id}-${idx}`}
                      className="flex items-center justify-between rounded-xl bg-slate-900/70 border border-slate-800/80 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isDep ? 'bg-emerald-950/60 text-emerald-400' : 'bg-blue-950/60 text-blue-400'
                          }`}
                        >
                          {isDep ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-200">
                            <span>{isDep ? 'ডিপোজিট' : 'উত্তোলন'}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({tx.method})</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {'trxId' in tx ? `Trx: ${tx.trxId}` : `নম্বর: ${tx.accountPhone}`} • {tx.createdAt}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-numeric text-sm font-bold block ${
                            isDep ? 'text-emerald-400' : 'text-blue-400'
                          }`}
                        >
                          {isDep ? '+' : '-'}৳{tx.amount.toFixed(2)}
                        </span>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
