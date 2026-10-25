import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../utils/storage';
import { Plane, Lock, User as UserIcon, Phone, Gift, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto detect referral query parameter: ?ref=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref.toUpperCase());
      setTab('signup');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const users = storage.getUsers();
    const cleanInput = username.trim().toLowerCase();
    const user =
      users[cleanInput] ||
      Object.values(users).find(
        (u) =>
          u.username.toLowerCase() === cleanInput ||
          u.phone.replace(/[\s-]/g, '') === username.trim().replace(/[\s-]/g, '')
      );

    if (!user) {
      setError("এই ইউজারনেম বা নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি! দয়া করে 'সাইন আপ' করুন।");
      return;
    }

    if (user.password !== password) {
      setError('ভুল পাসওয়ার্ড দিয়ে চেষ্টা করছেন!');
      return;
    }

    storage.setCurrentUser(user);
    onLoginSuccess(user);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে!');
      return;
    }

    const users = storage.getUsers();
    if (users[cleanUsername]) {
      setError('এই ইউজারনেমটি আগে থেকেই রেজিস্টার্ড আছে!');
      return;
    }

    // Generate random personal referral code
    const generatedCode = 'AV' + Math.floor(1000 + Math.random() * 9000);

    // Check if entered referral code is valid
    let validReferrer: User | null = null;
    if (refCode.trim()) {
      const codeUpper = refCode.trim().toUpperCase();
      validReferrer = Object.values(users).find((u) => u.referralCode === codeUpper) || null;
    }

    const newUser: User = {
      username: cleanUsername,
      name: cleanUsername,
      phone: phone.trim() || '01XXXXXXXXX',
      password: password.trim(),
      role: 'user',
      balance: 10, // ৳10 signup bonus only!
      referralCode: generatedCode,
      referredBy: validReferrer ? validReferrer.username : undefined,
      totalDeposited: 0,
      totalWagered: 0,
      totalWon: 0,
      createdAt: new Date().toLocaleDateString(),
    };

    users[cleanUsername] = newUser;
    storage.saveUsers(users);

    // If referred by someone, register the referral tracking stat!
    if (validReferrer) {
      storage.registerReferralLink(validReferrer.username, cleanUsername);
    }

    storage.setCurrentUser(newUser);
    alert('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ১০ টাকা স্বাগতম বোনাস যোগ করা হলো।');
    onLoginSuccess(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden border-2 border-rose-500/60 bg-black p-0.5 shadow-[0_0_25px_rgba(225,29,72,0.5)]">
            <img 
              src="/logo.jpg" 
              alt="Aviator Logo" 
              className="h-full w-full object-cover rounded-xl" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <h2 className="text-2xl font-black italic tracking-wider text-rose-500 font-numeric">
            AVIATOR PRO NEXTGEN
          </h2>
          <p className="text-xs text-slate-400">
            অফিশিয়াল ক্র্যাশ গেমিং পোর্টালে স্বাগতম
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/60 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'login'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            লগইন (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              tab === 'signup'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            নতুন অ্যাকাউন্ট (বোনাস ৳১০)
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Admin Credentials Helper */}
            <div className="rounded-xl bg-purple-950/40 border border-purple-500/30 p-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  👑 এডমিন লগইন (Admin ID):
                </span>
                <p className="text-[11px] text-slate-300">
                  আইডি: <span className="text-amber-400 font-mono font-bold">admin</span> | পাসওয়ার্ড: <span className="text-amber-400 font-mono font-bold">admin</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow transition active:scale-95 shrink-0"
              >
                অটো-পূরণ
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                ইউজারনেম অথবা মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ইউজারনেম (admin) বা মোবাইল নম্বর"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-9 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <UserIcon className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন (admin)"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pl-9 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>লগইন করুন</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                নতুন ইউজারনেম
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: player99"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-9 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <UserIcon className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-9 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <Phone className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="গোপন পাসওয়ার্ড"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-9 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1 flex items-center justify-between">
                <span>রেফারেল কোড (ঐচ্ছিক)</span>
                <span className="text-[10px] text-amber-400">বোনাস সুবিধা</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="রেফার কোড থাকলে লিখুন"
                  className="w-full bg-black/60 border border-slate-700/80 rounded-xl px-3.5 py-2 pl-9 text-sm uppercase text-amber-400 font-numeric font-bold focus:outline-none focus:border-amber-500"
                />
                <Gift className="h-4 w-4 text-amber-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <span>অ্যাকাউন্ট খুলুন (বোনাস ৳১০)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
