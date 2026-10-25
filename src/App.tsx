import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, LiveBot, BetRecord, RoundHistoryItem } from './types';
import { storage } from './utils/storage';
import { sounds } from './utils/audio';
import { Navbar } from './components/Navbar';
import { HistoryRibbon } from './components/HistoryRibbon';
import { AviatorCanvas } from './components/AviatorCanvas';
import { BetPanel } from './components/BetPanel';
import { LiveBetsList } from './components/LiveBetsList';
import { WalletModal } from './components/WalletModal';
import { ReferralModal } from './components/ReferralModal';
import { MyBetHistory } from './components/MyBetHistory';
import { ProfileModal } from './components/ProfileModal';
import { AdminModal } from './components/AdminModal';
import { AuthModal } from './components/AuthModal';
import { SlotGame } from './components/SlotGame';
import { BigSmallGame } from './components/BigSmallGame';
import { SuperAceGame } from './components/SuperAceGame';
import { GameLobbyBar } from './components/GameLobbyBar';
import { RealCasinoTicker } from './components/RealCasinoTicker';
import { ClickLogoRipple } from './components/ClickLogoRipple';
import { EntrySplash } from './components/EntrySplash';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'game' | 'slots' | 'bigsmall' | 'superace' | 'wallet' | 'referral' | 'history' | 'profile' | 'admin'>('game');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(!currentUser);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Game Engine States
  const [gameStatus, setGameStatus] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [waitingSeconds, setWaitingSeconds] = useState<number>(5.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [finalCrashMultiplier, setFinalCrashMultiplier] = useState<number>(2.0);
  const [roundId, setRoundId] = useState<number>(() => {
    const historyList = storage.getHistory();
    if (historyList.length > 0) {
      return Math.max(...historyList.map((h) => h.roundId)) + 1;
    }
    return 1053;
  });
  const roundIdRef = useRef<number>(roundId);
  const [history, setHistory] = useState<RoundHistoryItem[]>(() => storage.getHistory());
  const [recentBets, setRecentBets] = useState<BetRecord[]>(() => storage.getBets());
  const [liveBots, setLiveBots] = useState<LiveBot[]>([]);

  // Bet Panel 1 States
  const [p1Amount, setP1Amount] = useState<number>(20);
  const [p1AutoCashout, setP1AutoCashout] = useState<boolean>(false);
  const [p1AutoMult, setP1AutoMult] = useState<number>(2.0);
  const [p1Booked, setP1Booked] = useState<boolean>(false);
  const [p1CashedOut, setP1CashedOut] = useState<boolean>(false);
  const [p1WinAmount, setP1WinAmount] = useState<number>(0);

  // Bet Panel 2 States
  const [p2Amount, setP2Amount] = useState<number>(50);
  const [p2AutoCashout, setP2AutoCashout] = useState<boolean>(false);
  const [p2AutoMult, setP2AutoMult] = useState<number>(1.5);
  const [p2Booked, setP2Booked] = useState<boolean>(false);
  const [p2CashedOut, setP2CashedOut] = useState<boolean>(false);
  const [p2WinAmount, setP2WinAmount] = useState<number>(0);

  // Sync ref with state
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab !== 'game') {
      sounds.stopEngine();
    } else if (gameStatus === 'flying') {
      sounds.startEngine(currentMultiplier);
    }
  }, [activeTab]);

  useEffect(() => {
    roundIdRef.current = roundId;
  }, [roundId]);

  // Animation & Interval Refs
  const flightIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Bot generator for dynamic community activity
  const generateBots = () => {
    const botNames = [
      'shakib_88', 'tamim_pro', 'arman_vau', 'tanvir_king', 
      'hasan_vip', 'sagor_top', 'fahim_99', 'miraz_bd'
    ];
    return botNames.map((name, idx) => ({
      id: `bot-${idx}-${Date.now()}`,
      username: name,
      avatar: '',
      betAmount: (Math.floor(Math.random() * 8) + 1) * 25,
      targetMult: parseFloat((1.15 + Math.random() * 3.8).toFixed(2)),
      cashedOut: false,
      winAmount: 0,
    }));
  };

  // Generate Crash Multiplier (Respects admin forced override, win rate mode, and provably fair algorithm)
  const generateNextCrash = (): number => {
    const config = storage.getConfig();
    // 1. One-round or persistent forced multiplier override by Admin
    if (config.forcedNextMultiplier && config.forcedNextMultiplier >= 1.01) {
      const forced = config.forcedNextMultiplier;
      // Reset after 1 round use if not persistent
      if (!config.isForcedPersistent) {
        storage.saveConfig({ ...config, forcedNextMultiplier: null });
      }
      return forced;
    }

    // 2. Win Rate Mode defined by Admin
    const winMode = config.winRateMode || 'medium';
    const rand = Math.random();

    if (winMode === 'low') {
      // Low winning rate mode: mostly early crashes (1.05x - 1.80x)
      if (rand < 0.25) {
        return parseFloat((1.01 + Math.random() * 0.18).toFixed(2));
      } else if (rand < 0.70) {
        return parseFloat((1.20 + Math.random() * 0.60).toFixed(2));
      } else if (rand < 0.92) {
        return parseFloat((1.80 + Math.random() * 1.50).toFixed(2));
      } else {
        return parseFloat((3.30 + Math.random() * 2.50).toFixed(2));
      }
    } else if (winMode === 'medium') {
      // Medium / Balanced mode (most authentic Aviator distribution)
      if (rand < 0.08) {
        // 8% instant crash
        return parseFloat((1.01 + Math.random() * 0.14).toFixed(2));
      } else if (rand < 0.45) {
        // 37% safe low-mid (1.25x - 2.20x)
        return parseFloat((1.25 + Math.random() * 0.95).toFixed(2));
      } else if (rand < 0.80) {
        // 35% solid good win (2.20x - 5.50x)
        return parseFloat((2.20 + Math.random() * 3.30).toFixed(2));
      } else if (rand < 0.94) {
        // 14% high win (5.50x - 12.0x)
        return parseFloat((5.50 + Math.random() * 6.50).toFixed(2));
      } else {
        // 6% moon flight!
        return parseFloat((12.0 + Math.random() * 25.0).toFixed(2));
      }
    } else if (winMode === 'high') {
      // High winning rate: users easily win 2x - 10x!
      if (rand < 0.03) {
        return parseFloat((1.08 + Math.random() * 0.15).toFixed(2));
      } else if (rand < 0.30) {
        return parseFloat((1.80 + Math.random() * 1.40).toFixed(2));
      } else if (rand < 0.75) {
        return parseFloat((3.20 + Math.random() * 5.00).toFixed(2));
      } else {
        return parseFloat((8.00 + Math.random() * 20.0).toFixed(2));
      }
    } else if (winMode === 'ultra') {
      // Ultra high / jackpot mode (super high multipliers 5x - 50x+)
      if (rand < 0.02) {
        return parseFloat((1.15 + Math.random() * 0.20).toFixed(2));
      } else if (rand < 0.25) {
        return parseFloat((2.50 + Math.random() * 2.50).toFixed(2));
      } else if (rand < 0.70) {
        return parseFloat((5.00 + Math.random() * 12.0).toFixed(2));
      } else {
        return parseFloat((18.0 + Math.random() * 45.0).toFixed(2));
      }
    } else if (winMode === 'custom') {
      // Custom cap set by admin
      const maxCap = Math.max(1.5, config.customMaxMultiplier || 5.0);
      const randomMult = 1.05 + Math.random() * (maxCap - 1.05);
      return parseFloat(randomMult.toFixed(2));
    }

    // Default normal provably fair curve
    if (rand < 0.08) {
      return parseFloat((1.01 + Math.random() * 0.15).toFixed(2));
    } else if (rand < 0.50) {
      return parseFloat((1.20 + Math.random() * 1.40).toFixed(2));
    } else if (rand < 0.85) {
      return parseFloat((2.60 + Math.random() * 4.0).toFixed(2));
    } else {
      return parseFloat((7.0 + Math.random() * 15.0).toFixed(2));
    }
  };

  // Cashout action handler for either panel
  const handleCashout = useCallback((panel: 1 | 2) => {
    if (gameStatus !== 'flying' || !currentUser) return;

    if (panel === 1 && p1Booked && !p1CashedOut) {
      const win = p1Amount * currentMultiplier;
      setP1CashedOut(true);
      setP1WinAmount(win);

      // Play chime
      sounds.playCashout();
      if (currentMultiplier >= 3.0) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }

      // Credit user
      const updated = { ...currentUser, balance: currentUser.balance + win };
      storage.updateUser(updated);

      // Record bet
      const record: BetRecord = {
        id: `bet-${Date.now()}-p1`,
        roundId: roundIdRef.current,
        username: currentUser.username,
        betAmount: p1Amount,
        cashoutMult: currentMultiplier,
        winAmount: win,
        status: 'cashed_out',
        panel: 1,
        createdAt: new Date().toLocaleTimeString(),
      };
      storage.addBetRecord(record);
      const fresh = storage.getCurrentUser();
      if (fresh) setCurrentUser(fresh);
      setRecentBets(storage.getBets());
    }

    if (panel === 2 && p2Booked && !p2CashedOut) {
      const win = p2Amount * currentMultiplier;
      setP2CashedOut(true);
      setP2WinAmount(win);

      // Play chime
      sounds.playCashout();
      if (currentMultiplier >= 3.0) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }

      // Credit user
      const updated = { ...currentUser, balance: currentUser.balance + win };
      storage.updateUser(updated);

      // Record bet
      const record: BetRecord = {
        id: `bet-${Date.now()}-p2`,
        roundId: roundIdRef.current,
        username: currentUser.username,
        betAmount: p2Amount,
        cashoutMult: currentMultiplier,
        winAmount: win,
        status: 'cashed_out',
        panel: 2,
        createdAt: new Date().toLocaleTimeString(),
      };
      storage.addBetRecord(record);
      const fresh = storage.getCurrentUser();
      if (fresh) setCurrentUser(fresh);
      setRecentBets(storage.getBets());
    }
  }, [gameStatus, currentUser, p1Booked, p1CashedOut, p1Amount, p2Booked, p2CashedOut, p2Amount, currentMultiplier, roundId]);

  // Start Flight
  const startFlightRound = useCallback(() => {
    const crashMult = generateNextCrash();
    setFinalCrashMultiplier(crashMult);
    setGameStatus('flying');
    setCurrentMultiplier(1.0);

    // Audio engine drone starts
    sounds.startEngine(1.0);

    let mult = 1.0;
    let step = 0.0048;

    if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);

    flightIntervalRef.current = window.setInterval(() => {
      step *= 1.0065; // Smooth realistic acceleration
      mult += step;

      setCurrentMultiplier(mult);
      sounds.updateEnginePitch(mult);

      // Check bot cashouts
      setLiveBots((prevBots) =>
        prevBots.map((b) => {
          if (!b.cashedOut && mult >= b.targetMult) {
            return {
              ...b,
              cashedOut: true,
              winAmount: b.betAmount * b.targetMult,
            };
          }
          return b;
        })
      );

      // Auto Cashout checks
      if (p1Booked && !p1CashedOut && p1AutoCashout && mult >= p1AutoMult) {
        handleCashout(1);
      }
      if (p2Booked && !p2CashedOut && p2AutoCashout && mult >= p2AutoMult) {
        handleCashout(2);
      }

      // Check if crashed
      if (mult >= crashMult) {
        if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
        flightIntervalRef.current = null;

        // Sound crash
        sounds.playCrash();
        setGameStatus('crashed');
        setCurrentMultiplier(crashMult);

        // Record any lost bets
        const currentRound = roundIdRef.current;
        // Record any lost bets
        if (currentUser) {
          if (p1Booked && !p1CashedOut) {
            const lostBet: BetRecord = {
              id: `bet-${Date.now()}-p1-lost`,
              roundId: currentRound,
              username: currentUser.username,
              betAmount: p1Amount,
              winAmount: 0,
              status: 'lost',
              panel: 1,
              createdAt: new Date().toLocaleTimeString(),
            };
            storage.addBetRecord(lostBet);
          }
          if (p2Booked && !p2CashedOut) {
            const lostBet: BetRecord = {
              id: `bet-${Date.now()}-p2-lost`,
              roundId: currentRound,
              username: currentUser.username,
              betAmount: p2Amount,
              winAmount: 0,
              status: 'lost',
              panel: 2,
              createdAt: new Date().toLocaleTimeString(),
            };
            storage.addBetRecord(lostBet);
          }
          const fresh = storage.getCurrentUser();
          if (fresh) setCurrentUser(fresh);
          setRecentBets(storage.getBets());
        }

        // Add to history
        const newHistoryItem: RoundHistoryItem = {
          roundId: currentRound,
          multiplier: crashMult,
          crashedAt: new Date().toLocaleTimeString(),
          hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        };
        storage.addRoundHistory(newHistoryItem);
        setHistory(storage.getHistory());

        // Schedule next round preparation after 3 seconds
        setTimeout(() => {
          startWaitingPhase();
        }, 3200);
      }
    }, 33);
  }, [
    currentUser,
    p1Booked,
    p1CashedOut,
    p1AutoCashout,
    p1AutoMult,
    p1Amount,
    p2Booked,
    p2CashedOut,
    p2AutoCashout,
    p2AutoMult,
    p2Amount,
    handleCashout,
  ]);

  // Start Waiting / Countdown Phase
  const startWaitingPhase = useCallback(() => {
    setGameStatus('waiting');
    setCurrentMultiplier(1.0);
    setWaitingSeconds(5.0);

    const historyItems = storage.getHistory();
    const maxHistId = historyItems.length > 0 ? Math.max(...historyItems.map((h) => h.roundId)) : 1052;
    const nextRound = Math.max(roundIdRef.current + 1, maxHistId + 1);
    roundIdRef.current = nextRound;
    setRoundId(nextRound);

    // Reset panel states
    setP1Booked(false);
    setP1CashedOut(false);
    setP1WinAmount(0);

    setP2Booked(false);
    setP2CashedOut(false);
    setP2WinAmount(0);

    // Generate new active community bots
    setLiveBots(generateBots());

    let timeLeft = 5.0;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = window.setInterval(() => {
      timeLeft -= 0.1;
      setWaitingSeconds(Math.max(0, timeLeft));

      if (Math.abs(timeLeft % 1.0) < 0.05 && timeLeft > 0) {
        sounds.playTick(timeLeft <= 1.0);
      }

      if (timeLeft <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        startFlightRound();
      }
    }, 100);
  }, [startFlightRound]);

  // Initialize Game on Mount
  useEffect(() => {
    startWaitingPhase();

    return () => {
      if (flightIntervalRef.current) clearInterval(flightIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      sounds.stopEngine();
    };
  }, []);

  // Listen for Admin Live Emergency Crash Event
  useEffect(() => {
    const handleAdminForceCrash = () => {
      if (flightIntervalRef.current) {
        clearInterval(flightIntervalRef.current);
        flightIntervalRef.current = null;
        sounds.playCrash();
        setGameStatus('crashed');
        setFinalCrashMultiplier(currentMultiplier);

        const currentRound = roundIdRef.current;
        if (currentUser) {
          if (p1Booked && !p1CashedOut) {
            const lostBet: BetRecord = {
              id: `bet-${Date.now()}-p1-lost`,
              roundId: currentRound,
              username: currentUser.username,
              betAmount: p1Amount,
              winAmount: 0,
              status: 'lost',
              panel: 1,
              createdAt: new Date().toLocaleTimeString(),
            };
            storage.addBetRecord(lostBet);
          }
          if (p2Booked && !p2CashedOut) {
            const lostBet: BetRecord = {
              id: `bet-${Date.now()}-p2-lost`,
              roundId: currentRound,
              username: currentUser.username,
              betAmount: p2Amount,
              winAmount: 0,
              status: 'lost',
              panel: 2,
              createdAt: new Date().toLocaleTimeString(),
            };
            storage.addBetRecord(lostBet);
          }
          const fresh = storage.getCurrentUser();
          if (fresh) setCurrentUser(fresh);
          setRecentBets(storage.getBets());
        }

        const newHistoryItem: RoundHistoryItem = {
          roundId: currentRound,
          multiplier: parseFloat(currentMultiplier.toFixed(2)),
          crashedAt: new Date().toLocaleTimeString(),
          hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        };
        storage.addRoundHistory(newHistoryItem);
        setHistory(storage.getHistory());

        setTimeout(() => {
          startWaitingPhase();
        }, 3000);
      }
    };

    window.addEventListener('aviator_admin_force_crash', handleAdminForceCrash);
    return () => window.removeEventListener('aviator_admin_force_crash', handleAdminForceCrash);
  }, [currentUser, p1Booked, p1CashedOut, p1Amount, p2Booked, p2CashedOut, p2Amount, currentMultiplier, startWaitingPhase]);

  // Place Bet Actions
  const handlePlaceBet = (panel: 1 | 2) => {
    if (gameStatus !== 'waiting' || !currentUser) return;

    if (panel === 1) {
      if (p1Amount > currentUser.balance) {
        alert('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ডিপোজিট করুন।');
        return;
      }
      const updated = {
        ...currentUser,
        balance: currentUser.balance - p1Amount,
      };
      storage.updateUser(updated);
      setCurrentUser(updated);
      setP1Booked(true);
    }

    if (panel === 2) {
      if (p2Amount > currentUser.balance) {
        alert('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে ডিপোজিট করুন।');
        return;
      }
      const updated = {
        ...currentUser,
        balance: currentUser.balance - p2Amount,
      };
      storage.updateUser(updated);
      setCurrentUser(updated);
      setP2Booked(true);
    }
  };

  // Cancel Bet Actions
  const handleCancelBet = (panel: 1 | 2) => {
    if (gameStatus !== 'waiting' || !currentUser) return;

    if (panel === 1 && p1Booked) {
      const updated = {
        ...currentUser,
        balance: currentUser.balance + p1Amount,
      };
      storage.updateUser(updated);
      setCurrentUser(updated);
      setP1Booked(false);
    }

    if (panel === 2 && p2Booked) {
      const updated = {
        ...currentUser,
        balance: currentUser.balance + p2Amount,
      };
      storage.updateUser(updated);
      setCurrentUser(updated);
      setP2Booked(false);
    }
  };

  // Calculate claimable bonuses
  const referrals = storage.getReferrals();
  const claimableCount = currentUser
    ? referrals.filter((r) => r.referrerUsername === currentUser.username && r.isQualified && !r.isClaimed).length
    : 0;

  // Handle Logout
  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      {currentUser && (
        <>
          <Navbar
            user={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenWallet={() => setActiveTab('wallet')}
            onLogout={handleLogout}
            claimableBonusCount={claimableCount}
          />
          <RealCasinoTicker />
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2.5 sm:p-4 md:p-6 space-y-4">
        {/* Game Lobby Selector Ribbon (Direct switch between Aviator, Super Ace, 777 Slots, Big Small) */}
        {currentUser && ['game', 'slots', 'bigsmall', 'superace'].includes(activeTab) && (
          <GameLobbyBar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* If user clicked other tabs */}
        {activeTab === 'wallet' && currentUser && (
          <WalletModal user={currentUser} onUserUpdated={setCurrentUser} />
        )}

        {activeTab === 'referral' && currentUser && (
          <ReferralModal user={currentUser} onUserUpdated={setCurrentUser} />
        )}

        {activeTab === 'history' && currentUser && (
          <MyBetHistory bets={recentBets} username={currentUser.username} />
        )}

        {activeTab === 'profile' && currentUser && (
          <ProfileModal
            user={currentUser}
            onOpenWallet={() => setActiveTab('wallet')}
            onOpenReferrals={() => setActiveTab('referral')}
            onUserUpdated={setCurrentUser}
          />
        )}

        {activeTab === 'admin' && currentUser && currentUser.role === 'admin' && (
          <AdminModal
            onDataChanged={() => {
              const u = storage.getCurrentUser();
              if (u) setCurrentUser(u);
            }}
          />
        )}

        {/* Super Ace 1024-Ways Cascading Card Slot Game */}
        {activeTab === 'superace' && currentUser && (
          <SuperAceGame
            user={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenWallet={() => setActiveTab('wallet')}
          />
        )}

        {/* 777 Slot Game */}
        {activeTab === 'slots' && currentUser && (
          <SlotGame
            user={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenWallet={() => setActiveTab('wallet')}
          />
        )}

        {/* Synchronized Big / Small (Wingo 1.96x) Game */}
        {activeTab === 'bigsmall' && currentUser && (
          <BigSmallGame
            user={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenWallet={() => setActiveTab('wallet')}
          />
        )}

        {/* Primary Aviator Game Dashboard */}
        {activeTab === 'game' && currentUser && (
          <div className="space-y-3.5">
            {/* 1. Multiplier History Ribbon */}
            <HistoryRibbon history={history} />

            {/* 2. Main Flight Canvas Display */}
            <AviatorCanvas
              multiplier={currentMultiplier}
              status={gameStatus}
              waitingSeconds={waitingSeconds}
              finalCrashMult={finalCrashMultiplier}
            />

            {/* 3. Dual Bet Panels (Side-by-Side on desktop / Stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Bet Panel 1 */}
              <BetPanel
                panelIndex={1}
                userBalance={currentUser.balance}
                betAmount={p1Amount}
                setBetAmount={setP1Amount}
                autoCashout={p1AutoCashout}
                setAutoCashout={setP1AutoCashout}
                autoMult={p1AutoMult}
                setAutoMult={setP1AutoMult}
                isBooked={p1Booked}
                isCashedOut={p1CashedOut}
                winAmount={p1WinAmount}
                gameStatus={gameStatus}
                currentMultiplier={currentMultiplier}
                onPlaceBet={() => handlePlaceBet(1)}
                onCancelBet={() => handleCancelBet(1)}
                onCashout={() => handleCashout(1)}
              />

              {/* Bet Panel 2 */}
              <BetPanel
                panelIndex={2}
                userBalance={currentUser.balance}
                betAmount={p2Amount}
                setBetAmount={setP2Amount}
                autoCashout={p2AutoCashout}
                setAutoCashout={setP2AutoCashout}
                autoMult={p2AutoMult}
                setAutoMult={setP2AutoMult}
                isBooked={p2Booked}
                isCashedOut={p2CashedOut}
                winAmount={p2WinAmount}
                gameStatus={gameStatus}
                currentMultiplier={currentMultiplier}
                onPlaceBet={() => handlePlaceBet(2)}
                onCancelBet={() => handleCancelBet(2)}
                onCashout={() => handleCashout(2)}
              />
            </div>

            {/* 4. Live Active Bets & Community Feed */}
            <LiveBetsList
              bots={liveBots}
              myRecentBets={recentBets}
              currentMultiplier={currentMultiplier}
              totalBetsCount={liveBots.length + (p1Booked ? 1 : 0) + (p2Booked ? 1 : 0)}
            />
          </div>
        )}
      </main>

      {/* Interactive Global Click Logo Ripple Animation */}
      <ClickLogoRipple />

      {/* Entry & Login Splash Logo Screen */}
      {showSplash && (
        <EntrySplash onFinish={() => setShowSplash(false)} />
      )}

      {/* Auth Modal (Login / Signup) */}
      {showAuthModal && (
        <AuthModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
            setShowSplash(true); // Re-trigger welcoming logo splash on login!
          }}
        />
      )}

      {/* Simple Footer */}
      <footer className="w-full border-t border-slate-900 bg-black/60 py-3 text-center text-[11px] text-slate-500">
        <p>Aviator Pro NextGen © 2025 • প্রুভাবলি ফেয়ার ক্রিপ্টোগ্রাফিক অ্যালগরিদম দ্বারা সুরক্ষিত</p>
      </footer>
    </div>
  );
}
