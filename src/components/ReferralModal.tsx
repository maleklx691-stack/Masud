import React, { useState } from 'react';
import { User, ReferralStat } from '../types';
import { storage } from '../utils/storage';
import { Gift, Users, Award, Copy, Check, Share2, Sparkles, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface ReferralModalProps {
  user: User;
  onUserUpdated: (u: User) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ user, onUserUpdated }) => {
  const [referrals, setReferrals] = useState<ReferralStat[]>(() => storage.getReferrals());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const myReferrals = referrals.filter((r) => r.referrerUsername === user.username);

  const totalInvited = myReferrals.length;
  const qualifiedCount = myReferrals.filter((r) => r.isQualified && !r.isClaimed).length;
  const totalEarned = myReferrals
    .filter((r) => r.isClaimed)
    .reduce((acc, curr) => acc + curr.bonusAmount, 0);

  const inviteLink = `${window.location.origin}?ref=${user.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🔥 Aviator Pro NextGen ক্র্যাশ গেমে জয়েন করুন এবং জিতুন! আমার রেফার কোড ব্যবহার করুন: ${user.referralCode} \nলিংক: ${inviteLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Claim 200 BDT reward
  const handleClaim = (refId: string) => {
    const result = storage.claimReferralBonus(refId);
    if (result.success) {
      // Trigger audio & confetti
      sounds.playCashout();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      // Refresh referrals & current user
      setReferrals(storage.getReferrals());
      const updatedCurrentUser = storage.getCurrentUser();
      if (updatedCurrentUser) {
        onUserUpdated(updatedCurrentUser);
      }

      setClaimToast(result.message);
      setTimeout(() => setClaimToast(null), 5000);
    } else {
      alert(result.message);
    }
  };

  // Quick demo test helper: simulate a test friend depositing or betting
  const handleSimulateRefereeActivity = (refId: string, addDeposit: number, addWager: number) => {
    const target = referrals.find((r) => r.id === refId);
    if (!target) return;
    storage.updateRefereeProgress(target.refereeUsername, addDeposit, addWager);
    setReferrals(storage.getReferrals());
  };

  // Add a new test friend referral to test instantly
  const handleAddTestReferee = () => {
    const randomId = Math.floor(Math.random() * 900 + 100);
    const newFriendUsername = `friend_${randomId}`;
    storage.registerReferralLink(user.username, newFriendUsername);
    setReferrals(storage.getReferrals());
  };

  return (
    <div className="mx-auto max-w-3xl w-full space-y-4">
      {/* Toast Alert */}
      {claimToast && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 p-4 text-xs font-bold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{claimToast}</span>
        </div>
      )}

      {/* Hero Rule Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/60 via-[#10141e] to-amber-950/40 border border-rose-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
              <Gift className="h-3.5 w-3.5" />
              <span>রেফারেল ও রেফারি প্রোগ্রাম</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              বন্ধুকে রেফার করে আয় করুন <span className="text-amber-400">প্রতি রেফারে ৳২০০</span>!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              আপনার রেফার করা বন্ধু যখন <strong className="text-emerald-400">১৫০ টাকা ডিপোজিট</strong> করবে 
              এবং খেলায় মোট <strong className="text-amber-400">২,০০০ টাকার ব্যাটিং</strong> সম্পন্ন করবে, 
              সাথে সাথে আপনি রেফারার হিসেবে পাবেন <strong className="text-amber-400">নগদ ৳২০০ টাকা</strong> সরাসরি আপনার ওয়ালেটে!
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>WhatsApp-এ শেয়ার</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-2xl bg-black/40 border border-slate-800 p-3 sm:p-4 flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>মোট রেফারেল</span>
          </div>
          <span className="font-numeric text-2xl sm:text-3xl font-black text-white">
            {totalInvited} জন
          </span>
        </div>

        <div className="rounded-2xl bg-black/40 border border-emerald-500/30 p-3 sm:p-4 flex flex-col items-center sm:items-start bg-emerald-950/10">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>ক্লেইমযোগ্য বোনাস</span>
          </div>
          <span className="font-numeric text-2xl sm:text-3xl font-black text-amber-400">
            ৳{qualifiedCount * 200}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">({qualifiedCount} টি প্রস্তুত)</span>
        </div>

        <div className="rounded-2xl bg-black/40 border border-slate-800 p-3 sm:p-4 flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Award className="h-3.5 w-3.5 text-purple-400" />
            <span>মোট অর্জিত আয়</span>
          </div>
          <span className="font-numeric text-2xl sm:text-3xl font-black text-emerald-400">
            ৳{totalEarned}
          </span>
        </div>
      </div>

      {/* Referral Link & Code Box */}
      <div className="rounded-2xl bg-black/50 border border-slate-800 p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          আপনার ব্যক্তিগত রেফারেল লিংক ও কোড
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Referral Code */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-700/80 p-2.5 pl-3">
            <div>
              <span className="text-[10px] text-slate-400 block">রেফারেল কোড:</span>
              <span className="font-numeric text-lg font-black text-amber-400 tracking-wider">
                {user.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition active:scale-95"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'কপি হয়েছে' : 'কোড কপি'}</span>
            </button>
          </div>

          {/* Referral Link */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-700/80 p-2.5 pl-3">
            <div className="truncate pr-2">
              <span className="text-[10px] text-slate-400 block">ইনভাইট লিংক:</span>
              <span className="font-mono text-xs text-slate-300 truncate block max-w-[180px]">
                {inviteLink}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition active:scale-95 shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Referral Progress List */}
      <div className="rounded-2xl bg-black/50 border border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">আমন্ত্রিত বন্ধুদের অগ্রগতি (Referral Status)</h3>
          </div>
          <button
            onClick={handleAddTestReferee}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
          >
            + নতুন ডেমো বন্ধু যোগ করুন
          </button>
        </div>

        <div className="space-y-3">
          {myReferrals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              আপনি এখনও কাউকে রেফার করেননি। আপনার কোড শেয়ার করে বন্ধুদের আমন্ত্রণ জানান!
            </div>
          ) : (
            myReferrals.map((ref, idx) => {
              const depositPercent = Math.min(100, Math.round((ref.currentDeposit / 150) * 100));
              const wagerPercent = Math.min(100, Math.round((ref.currentWager / 2000) * 100));

              return (
                <div
                  key={`${ref.id}-${idx}`}
                  className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 transition ${
                    ref.isQualified && !ref.isClaimed
                      ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  {/* Top row: Username & Claim Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                        {ref.refereeUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{ref.refereeUsername}</span>
                          <span className="text-[10px] text-slate-400">যোগদান: {ref.refereeJoinedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Claim Button or Status Badge */}
                    <div>
                      {ref.isClaimed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>৳২০০ বোনাস সংগৃহীত</span>
                        </div>
                      ) : ref.isQualified ? (
                        <button
                          onClick={() => handleClaim(ref.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-lg transition active:scale-95 animate-bounce"
                        >
                          <Gift className="h-4 w-4 text-slate-950" />
                          <span>ক্লেইম করুন (নগদ ৳২০০)</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-400 text-[11px] font-semibold">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>শর্ত পূরণের অপেক্ষায়</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conditions Progress Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80 text-xs">
                    {/* 1. Deposit condition (৳150) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">
                          ১. ডিপোজিট শর্ত (মিনিমাম ৳১৫০):
                        </span>
                        <span className={`font-numeric font-bold ${ref.depositMet ? 'text-emerald-400' : 'text-slate-300'}`}>
                          ৳{ref.currentDeposit} / ৳১৫০ {ref.depositMet && '✓'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            ref.depositMet ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${depositPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Wager condition (৳2,000) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">
                          ২. গেমে মোট ব্যাটিং (টার্নওভার ৳২,০০০):
                        </span>
                        <span className={`font-numeric font-bold ${ref.wagerMet ? 'text-emerald-400' : 'text-slate-300'}`}>
                          ৳{ref.currentWager} / ৳২০০০ {ref.wagerMet && '✓'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            ref.wagerMet ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${wagerPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulation Helper Buttons for testing this referee */}
                  {!ref.isQualified && (
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                      <span>টেস্ট করুন:</span>
                      <button
                        onClick={() => handleSimulateRefereeActivity(ref.id, 150, 0)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        +৳১৫০ ডিপোজিট সিমুলেট
                      </button>
                      <button
                        onClick={() => handleSimulateRefereeActivity(ref.id, 0, 500)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        +৳৫০০ ব্যাটিং সিমুলেট
                      </button>
                      <button
                        onClick={() => handleSimulateRefereeActivity(ref.id, 150, 2000)}
                        className="px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30"
                      >
                        ⚡ শর্ত পূর্ণ করুন
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
