import React, { useState, useEffect, useRef } from 'react';
import { User, BetRecord } from '../types';
import { storage } from '../utils/storage';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCw,
  Zap,
  Trophy,
  Flame,
  Info,
  Volume2,
  VolumeX,
  Coins,
  History as HistoryIcon,
  Crown,
  ChevronRight,
  Award,
  X,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Check,
  Eye
} from 'lucide-react';

import aceCardImg from '../assets/images/ace_spade_card_1789553636721.jpg';
import kingCardImg from '../assets/images/king_royal_card_1789553655643.jpg';
import queenCardImg from '../assets/images/queen_royal_card_1789553681101.jpg';
import jackCardImg from '../assets/images/jack_royal_card_1789553753010.jpg';
import tenCardImg from '../assets/images/ten_card_casino_1789553785847.jpg';
import nineCardImg from '../assets/images/nine_card_casino_1789553802478.jpg';
import wildJokerImg from '../assets/images/wild_joker_card_1789553714765.jpg';
import scatterCardImg from '../assets/images/scatter_card_1789553733310.jpg';

export const DEFAULT_CARD_IMAGES: Record<string, string> = {
  A: aceCardImg,
  K: kingCardImg,
  Q: queenCardImg,
  J: jackCardImg,
  '10': tenCardImg,
  '9': nineCardImg,
  wild: wildJokerImg,
  scatter: scatterCardImg,
};

export const CARD_METADATA: Array<{ key: string; name: string; subtitle: string; tag: string }> = [
  { key: 'A', name: 'সুপার এস (Ace)', subtitle: 'টপ পেআউট সর্বোচ্চ কার্ড (♠️ স্পেড)', tag: '৬.০x মাল্টি' },
  { key: 'K', name: 'রয়্যাল কিং (King)', subtitle: 'রাজকীয় স্বর্ণমুকুট পরিহিত কিং (♥️ হার্ট)', tag: '৪.০x মাল্টি' },
  { key: 'Q', name: 'রয়্যাল কুইন (Queen)', subtitle: 'রত্নখচিত রাজরানী কুইন (♦️ ডায়মন্ড)', tag: '৩.০x মাল্টি' },
  { key: 'J', name: 'রয়্যাল জ্যাক (Jack)', subtitle: 'বর্মধারী বীর নাইট জ্যাক (♣️ ক্লাব)', tag: '২.০x মাল্টি' },
  { key: '10', name: 'লাক্সারি ১০ (Ten)', subtitle: 'স্বর্ণালংকৃত ১০ নম্বর ক্যাসিনো কার্ড', tag: '১.২x মাল্টি' },
  { key: '9', name: 'লাক্সারি ৯ (Nine)', subtitle: 'সায়ান ও স্বর্ণে খচিত ৯ নম্বর কার্ড', tag: '১.০x মাল্টি' },
  { key: 'wild', name: 'ওয়াইল্ড জোকার (Joker)', subtitle: 'গোল্ডেন কার্ড ভাঙলে ওয়াইল্ডে রূপান্তর', tag: 'সবার সাথে ম্যাচ' },
  { key: 'scatter', name: 'স্ক্যাটার ক্রাউন (Scatter)', subtitle: '৩+ স্ক্যাটারে ১০টি ফ্রি স্পিন বোনাস', tag: '১০ ফ্রি স্পিন' },
];

interface SuperAceGameProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
}

export type CardRank = 'A' | 'K' | 'Q' | 'J' | '10' | '9';

export interface CardCell {
  id: string;
  rank: CardRank;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  isGolden: boolean; // Golden cards appear on reels 2, 3, 4
  isWild: boolean; // Little Joker or Big Joker
  wildType?: 'little' | 'big';
  isScatter: boolean; // Scatter for Free Spins
  isWinning?: boolean;
  isTransforming?: boolean;
}

const SUITS: ('spades' | 'hearts' | 'diamonds' | 'clubs')[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9'];

// Base pay multipliers (times bet) for 3, 4, 5 of a kind
const PAYTABLE: Record<CardRank, { 3: number; 4: number; 5: number }> = {
  A: { 3: 1.5, 4: 3.0, 5: 6.0 },
  K: { 3: 1.0, 4: 2.0, 5: 4.0 },
  Q: { 3: 0.8, 4: 1.5, 5: 3.0 },
  J: { 3: 0.5, 4: 1.0, 5: 2.0 },
  '10': { 3: 0.3, 4: 0.6, 5: 1.2 },
  '9': { 3: 0.2, 4: 0.4, 5: 1.0 },
};

const BASE_MULTIPLIERS = [1, 2, 3, 5];
const FREE_MULTIPLIERS = [2, 4, 6, 10];
const BET_AMOUNTS = [10, 20, 50, 100, 200, 500];

// Helper to generate a single random card for a given column (col: 0..4, row: 0..3)
const generateRandomCard = (col: number, row: number, allowGolden = true): CardCell => {
  const config = storage.getConfig();
  const winMode = config.superAceWinMode || config.winRateMode || 'medium';

  let scatterChance = 0.035;
  let goldenChance = 0.22;
  if (winMode === 'ultra') {
    scatterChance = 0.08;
    goldenChance = 0.42;
  } else if (winMode === 'high') {
    scatterChance = 0.055;
    goldenChance = 0.32;
  } else if (winMode === 'low') {
    scatterChance = 0.015;
    goldenChance = 0.12;
  }

  const isScatter = Math.random() < scatterChance;
  if (isScatter) {
    return {
      id: `scatter-${col}-${row}-${Date.now()}-${Math.random()}`,
      rank: 'A',
      suit: 'spades',
      isGolden: false,
      isWild: false,
      isScatter: true,
    };
  }

  // Golden cards appear only on reels 2, 3, 4 (col indices 1, 2, 3)
  const isGolden = allowGolden && (col === 1 || col === 2 || col === 3) && Math.random() < goldenChance;
  let rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  if (winMode === 'ultra' && Math.random() < 0.30) {
    rank = Math.random() < 0.6 ? 'A' : 'K';
  } else if (winMode === 'high' && Math.random() < 0.18) {
    rank = Math.random() < 0.5 ? 'A' : 'K';
  }
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];

  return {
    id: `card-${col}-${row}-${Date.now()}-${Math.random()}`,
    rank,
    suit,
    isGolden,
    isWild: false,
    isScatter: false,
  };
};

// Generate an initial 5x4 board (grid[col][row])
const createInitialGrid = (): CardCell[][] => {
  const grid: CardCell[][] = [];
  for (let c = 0; c < 5; c++) {
    const col: CardCell[] = [];
    for (let r = 0; r < 4; r++) {
      col.push(generateRandomCard(c, r, true));
    }
    grid.push(col);
  }
  return grid;
};

export const SuperAceGame: React.FC<SuperAceGameProps> = ({
  user,
  onUserUpdated,
  onOpenWallet,
}) => {
  const [grid, setGrid] = useState<CardCell[][]>(() => createInitialGrid());
  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [comboLevel, setComboLevel] = useState<number>(0); // 0 = 1x, 1 = 2x, 2 = 3x, 3 = 5x
  const [isFreeSpinActive, setIsFreeSpinActive] = useState<boolean>(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinTotalWin, setFreeSpinTotalWin] = useState<number>(0);
  const [lastRoundWin, setLastRoundWin] = useState<number>(0);
  const [totalWinMessage, setTotalWinMessage] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getIsMuted());
  const [recentWins, setRecentWins] = useState<Array<{ id: string; mult: string; win: number; time: string }>>([
    { id: '1', mult: '5.4x', win: 108, time: '11:42' },
    { id: '2', mult: '14.8x', win: 296, time: '11:39' },
    { id: '3', mult: '32.0x', win: 640, time: '11:30' },
  ]);

  const [customCardImages, setCustomCardImages] = useState<Record<string, string>>(() => storage.getCustomCardImages());
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const getCardImage = (key: string): string => {
    return customCardImages[key] || DEFAULT_CARD_IMAGES[key] || DEFAULT_CARD_IMAGES['A'];
  };

  const handleFileUpload = (key: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে একটি ছবি ফাইল (JPG, PNG, WebP ইত্যাদি) সিলেক্ট করুন');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...customCardImages, [key]: dataUrl };
      setCustomCardImages(updated);
      storage.saveCustomCardImages(updated);
      setUploadSuccessMessage(`কার্ড '${key}' সফলভাবে আপডেট করা হয়েছে!`);
      setTimeout(() => setUploadSuccessMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleResetCard = (key: string) => {
    const updated = { ...customCardImages };
    delete updated[key];
    setCustomCardImages(updated);
    storage.saveCustomCardImages(updated);
  };

  const handleResetAllCards = () => {
    setCustomCardImages({});
    storage.saveCustomCardImages({});
    setUploadSuccessMessage('সকল কার্ড ডিফল্ট রিয়াল ক্যাসিনো কার্ডে রিসেট করা হয়েছে!');
    setTimeout(() => setUploadSuccessMessage(null), 3000);
  };

  const activeSpinRef = useRef<boolean>(false);
  const autoSpinRef = useRef<boolean>(false);
  autoSpinRef.current = autoSpin;

  // Active multipliers depending on mode
  const currentMultipliers = isFreeSpinActive ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
  const currentMultiplier = currentMultipliers[Math.min(comboLevel, currentMultipliers.length - 1)];

  // Keep local mute indicator synchronized with global SoundManager
  useEffect(() => {
    setIsMuted(sounds.getIsMuted());
    return sounds.subscribe((muted) => {
      setIsMuted(muted);
    });
  }, []);

  // Audio mute handler
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Find 1024-ways matching symbols starting from reel 1
  const evaluateBoard = (currentGrid: CardCell[][]) => {
    // Collect non-scatter winning lines
    const winningColsByRank: Record<CardRank, { cols: number[]; countPerCol: number[] }> = {
      A: { cols: [], countPerCol: [] },
      K: { cols: [], countPerCol: [] },
      Q: { cols: [], countPerCol: [] },
      J: { cols: [], countPerCol: [] },
      '10': { cols: [], countPerCol: [] },
      '9': { cols: [], countPerCol: [] },
    };

    let totalRoundBasePay = 0;
    const winningCardIds = new Set<string>();

    // For each standard rank, test how many consecutive reels (starting from 0) have that card OR Wild
    RANKS.forEach((rank) => {
      let consecutiveReels = 0;
      let ways = 1;
      const matchedIdsForRank: string[] = [];

      for (let c = 0; c < 5; c++) {
        const matchingInCol = currentGrid[c].filter(
          (cell) => !cell.isScatter && (cell.rank === rank || cell.isWild)
        );
        if (matchingInCol.length > 0) {
          consecutiveReels++;
          ways *= matchingInCol.length;
          matchingInCol.forEach((cell) => matchedIdsForRank.push(cell.id));
        } else {
          break;
        }
      }

      // 3 or more consecutive reels = WIN
      if (consecutiveReels >= 3) {
        const payScale = PAYTABLE[rank][consecutiveReels as 3 | 4 | 5] || 0;
        const linePay = payScale * ways;
        totalRoundBasePay += linePay;
        matchedIdsForRank.forEach((id) => winningCardIds.add(id));
      }
    });

    // Check for Scatters across whole grid
    let scatterCount = 0;
    const scatterIds: string[] = [];
    currentGrid.forEach((col) => {
      col.forEach((cell) => {
        if (cell.isScatter) {
          scatterCount++;
          scatterIds.push(cell.id);
        }
      });
    });

    return {
      totalRoundBasePay,
      winningCardIds,
      scatterCount,
      scatterIds,
      hasWin: totalRoundBasePay > 0,
    };
  };

  // The Cascade Step Processor
  const processCascades = async (
    startGrid: CardCell[][],
    accumulatedWin: number,
    currentCombo: number,
    isFree: boolean
  ): Promise<{ finalGrid: CardCell[][]; totalWin: number; triggeredFree: boolean }> => {
    const multList = isFree ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
    const mult = multList[Math.min(currentCombo, multList.length - 1)];

    const evalResult = evaluateBoard(startGrid);

    // If no win on this cascade step, return finished board
    if (!evalResult.hasWin) {
      return {
        finalGrid: startGrid,
        totalWin: accumulatedWin,
        triggeredFree: evalResult.scatterCount >= 3,
      };
    }

    // There is a win! Highlight winning cards
    sounds.playCardElimination(currentCombo + 1);
    const highlightedGrid = startGrid.map((col) =>
      col.map((cell) => ({
        ...cell,
        isWinning: evalResult.winningCardIds.has(cell.id),
      }))
    );
    setGrid(highlightedGrid);
    setComboLevel(currentCombo);

    // Calculate win for this cascade
    const stepWin = evalResult.totalRoundBasePay * betAmount * mult;
    const newTotal = accumulatedWin + stepWin;
    setLastRoundWin(newTotal);

    // Wait for highlight flash
    await new Promise((r) => setTimeout(r, isTurbo ? 250 : 500));

    // Handle Golden Card transformations into Wild Jokers!
    let transformedCount = 0;
    const transformedGrid = highlightedGrid.map((col, colIdx) =>
      col.map((cell) => {
        if (cell.isWinning && cell.isGolden && !cell.isWild) {
          transformedCount++;
          // Random chance for Big Joker or Little Joker
          const isBig = Math.random() < 0.25;
          return {
            ...cell,
            isGolden: false,
            isWinning: false,
            isWild: true,
            wildType: isBig ? ('big' as const) : ('little' as const),
            isTransforming: true,
          };
        }
        return cell;
      })
    );

    if (transformedCount > 0) {
      sounds.playJokerTransform();
      setGrid(transformedGrid);
      await new Promise((r) => setTimeout(r, isTurbo ? 200 : 350));
    }

    // Now remove winning non-wild symbols and let cards drop down
    const nextGrid: CardCell[][] = [];
    for (let c = 0; c < 5; c++) {
      const surviving = transformedGrid[c].filter(
        (cell) => !cell.isWinning || (cell.isWild && cell.isTransforming)
      );
      // Clean up transform flags
      surviving.forEach((c) => (c.isTransforming = false));

      // Fill missing from top with fresh cards
      const missingCount = 4 - surviving.length;
      const newCards: CardCell[] = [];
      for (let r = 0; r < missingCount; r++) {
        newCards.push(generateRandomCard(c, r, !isFree));
      }
      nextGrid.push([...newCards, ...surviving]);
    }

    sounds.playCardDeal();
    setGrid(nextGrid);
    sounds.playComboMultiplier(mult);

    await new Promise((r) => setTimeout(r, isTurbo ? 220 : 450));

    // Recurse to next cascade with combo level + 1
    return processCascades(nextGrid, newTotal, currentCombo + 1, isFree);
  };

  // Handle Main Spin Action
  const handleSpin = async (isFreeRound = false) => {
    if (activeSpinRef.current) return;

    if (!isFreeRound) {
      if (user.balance < betAmount) {
        setTotalWinMessage('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে রিচার্জ করুন।');
        setAutoSpin(false);
        return;
      }

      // Deduct Bet
      const updatedUser: User = {
        ...user,
        balance: user.balance - betAmount,
        totalWagered: (user.totalWagered || 0) + betAmount,
      };
      storage.setCurrentUser(updatedUser);
      onUserUpdated(updatedUser);
    }

    activeSpinRef.current = true;
    setIsSpinning(true);
    setTotalWinMessage(null);
    setLastRoundWin(0);
    setComboLevel(0);

    // Initial spin drop animation
    sounds.playCardDeal();

    // Create fresh initial grid
    const freshGrid = createInitialGrid();
    setGrid(freshGrid);

    await new Promise((r) => setTimeout(r, isTurbo ? 300 : 600));

    // Check for Scatters in initial grid
    let scattersFound = 0;
    freshGrid.forEach((col) =>
      col.forEach((c) => {
        if (c.isScatter) scattersFound++;
      })
    );

    // Run Cascading Elimination Loop
    const cascadeResult = await processCascades(freshGrid, 0, 0, isFreeRound || isFreeSpinActive);

    const roundWin = cascadeResult.totalWin;

    // Credit Winnings if any
    if (roundWin > 0) {
      const u = storage.getCurrentUser();
      const newBal = u.balance + roundWin;
      const finalUser: User = {
        ...u,
        balance: newBal,
        totalWon: (u.totalWon || 0) + roundWin,
      };
      storage.setCurrentUser(finalUser);
      onUserUpdated(finalUser);

      // Record bet in system
      const betRecord: BetRecord = {
        id: `superace-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        roundId: Math.floor(Date.now() / 1000),
        username: user.username,
        betAmount: isFreeRound ? 0 : betAmount,
        cashoutMult: parseFloat((roundWin / (betAmount || 1)).toFixed(2)),
        winAmount: roundWin,
        status: 'won',
        panel: 1,
        createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      storage.addBetRecord(betRecord);

      // Add to recent wins ribbon
      setRecentWins((prev) => [
        {
          id: String(Date.now()),
          mult: `${(roundWin / betAmount).toFixed(1)}x`,
          win: roundWin,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);

      // Sound & Celebration
      if (roundWin >= betAmount * 10) {
        sounds.playSlotWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#ffffff'],
        });
        setTotalWinMessage(`💥 সুপার এস মেগা উইন! +৳${roundWin.toFixed(2)} জিতেছেন!`);
      } else if (roundWin >= betAmount * 3) {
        sounds.playSlotWin();
        setTotalWinMessage(`🎉 বিগ উইন! +৳${roundWin.toFixed(2)} জিতেছেন!`);
      } else {
        setTotalWinMessage(`👏 দারুণ উইন! +৳${roundWin.toFixed(2)}`);
      }

      if (isFreeRound) {
        setFreeSpinTotalWin((prev) => prev + roundWin);
      }
    } else {
      if (!isFreeRound) {
        const betRecord: BetRecord = {
          id: `superace-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          roundId: Math.floor(Date.now() / 1000),
          username: user.username,
          betAmount,
          cashoutMult: 0,
          winAmount: 0,
          status: 'lost',
          panel: 1,
          createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
        storage.addBetRecord(betRecord);
      }
      setTotalWinMessage('কোনো ম্যাচ নেই! পরের রাউন্ডে চেষ্টা করুন।');
    }

    // Trigger Free Game if 3+ Scatters appeared!
    if (scattersFound >= 3 && !isFreeSpinActive) {
      sounds.playSlotWin();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
      setIsFreeSpinActive(true);
      setFreeSpinsRemaining(10);
      setFreeSpinTotalWin(roundWin);
      setTotalWinMessage('🌟 অভিনন্দিত! ৩টি স্ক্যাটার এসেছে — ১০টি ফ্রি স্পিন সক্রিয় হয়েছে!');
    }

    activeSpinRef.current = false;
    setIsSpinning(false);
  };

  // Free Spins automated loop
  useEffect(() => {
    if (isFreeSpinActive && freeSpinsRemaining > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        setFreeSpinsRemaining((prev) => prev - 1);
        handleSpin(true);
      }, isTurbo ? 800 : 1400);
      return () => clearTimeout(timer);
    } else if (isFreeSpinActive && freeSpinsRemaining === 0 && !isSpinning) {
      setIsFreeSpinActive(false);
      confetti({ particleCount: 150, spread: 100 });
      setTotalWinMessage(`👑 ফ্রি গেম সমাপ্ত! সর্বমোট অর্জন: ৳${freeSpinTotalWin.toFixed(2)} BDT!`);
    }
  }, [isFreeSpinActive, freeSpinsRemaining, isSpinning]);

  // Auto Spin loop for base game
  useEffect(() => {
    if (autoSpin && !isSpinning && !isFreeSpinActive && autoSpinCount > 0) {
      const timer = setTimeout(() => {
        setAutoSpinCount((c) => c - 1);
        handleSpin(false);
      }, isTurbo ? 700 : 1200);
      return () => clearTimeout(timer);
    } else if (autoSpin && autoSpinCount <= 0) {
      setAutoSpin(false);
    }
  }, [autoSpin, autoSpinCount, isSpinning, isFreeSpinActive]);

  // Render individual card face with real casino playing cards
  const renderCardCell = (cell: CardCell) => {
    // Scatter Crown Card
    if (cell.isScatter) {
      const imgSrc = getCardImage('scatter');
      return (
        <div
          className={`relative h-20 sm:h-28 md:h-32 w-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-1 border-2 transition-all select-none overflow-hidden group shadow-lg ${
            cell.isWinning
              ? 'border-yellow-200 ring-2 ring-yellow-400 shadow-[0_0_28px_rgba(245,158,11,0.95)] scale-105 z-20 animate-pulse'
              : 'border-amber-500/70 bg-[#170a04]'
          }`}
        >
          {/* Real Card Background Image */}
          <img
            src={imgSrc}
            alt="Scatter Crown Card"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover rounded-[10px] sm:rounded-[14px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50 pointer-events-none rounded-[10px] sm:rounded-[14px]" />

          {/* Top Badge */}
          <div className="relative z-10 w-full flex items-center justify-center pt-0.5">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black text-[7px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow tracking-wider">
              SCATTER
            </span>
          </div>

          {/* Bottom Label */}
          <div className="relative z-10 w-full flex flex-col items-center pb-1">
            <span className="text-[8px] sm:text-[10px] font-black text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              ১০ ফ্রি স্পিন
            </span>
          </div>
        </div>
      );
    }

    // Wild Joker Card
    if (cell.isWild) {
      const isBig = cell.wildType === 'big';
      const imgSrc = getCardImage('wild');
      return (
        <div
          className={`relative h-20 sm:h-28 md:h-32 w-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-1 border-2 transition-all select-none overflow-hidden group shadow-lg ${
            cell.isWinning
              ? 'border-white ring-2 ring-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.95)] scale-105 z-20 animate-pulse'
              : isBig
              ? 'border-pink-500 ring-1 ring-pink-400/40 shadow-[0_0_16px_rgba(236,72,153,0.4)] bg-[#200518]'
              : 'border-purple-500/80 shadow-[0_0_14px_rgba(168,85,247,0.4)] bg-[#12051d]'
          }`}
        >
          {/* Real Card Background Image */}
          <img
            src={imgSrc}
            alt="Wild Joker Card"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover rounded-[10px] sm:rounded-[14px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none rounded-[10px] sm:rounded-[14px]" />

          {/* Top Ribbon */}
          <div className="relative z-10 w-full flex items-center justify-between px-1 pt-0.5">
            <Sparkles className="h-3 w-3 text-pink-300 animate-spin" />
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow uppercase">
              {isBig ? 'BIG WILD' : 'WILD'}
            </span>
          </div>

          {/* Bottom Label */}
          <div className="relative z-10 w-full flex items-center justify-center pb-1">
            <span className="text-[9px] sm:text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {isBig ? 'বিগ জোকার' : 'ওয়াইল্ড'}
            </span>
          </div>
        </div>
      );
    }

    // Normal or Golden Playing Card
    const isRedSuit = cell.suit === 'hearts' || cell.suit === 'diamonds';
    const suitSymbol = {
      spades: '♠',
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
    }[cell.suit];
    const imgSrc = getCardImage(cell.rank);

    return (
      <div
        className={`relative h-20 sm:h-28 md:h-32 w-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-1 sm:p-1.5 border-2 transition-all select-none overflow-hidden group shadow-lg ${
          cell.isWinning
            ? 'border-yellow-200 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.95)] scale-105 z-20'
            : cell.isGolden
            ? 'border-yellow-400 ring-1 ring-yellow-400/50 shadow-[0_0_20px_rgba(234,179,8,0.5)] bg-[#211704]'
            : 'border-slate-700/80 bg-[#0d121c]'
        }`}
      >
        {/* Real Card Background Image */}
        <img
          src={imgSrc}
          alt={`Card ${cell.rank}`}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover rounded-[10px] sm:rounded-[14px]"
        />

        {/* Shading / Golden Foil Overlay */}
        {cell.isGolden ? (
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/25 via-transparent to-amber-950/70 pointer-events-none rounded-[10px] sm:rounded-[14px]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45 pointer-events-none rounded-[10px] sm:rounded-[14px]" />
        )}

        {/* Golden Card Top Banner */}
        {cell.isGolden && (
          <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-center py-0.5 shadow z-10">
            ★ GOLDEN
          </div>
        )}

        {/* Top Rank & Suit Corner */}
        <div className={`relative z-10 w-full flex items-center justify-between text-[10px] sm:text-xs font-black font-numeric leading-none ${cell.isGolden ? 'pt-3 sm:pt-3.5' : 'pt-0.5'} px-0.5`}>
          <span className={`bg-black/60 px-1 py-0.5 rounded ${isRedSuit ? 'text-rose-400' : 'text-slate-100'} drop-shadow`}>
            {cell.rank}
          </span>
          <span className={`bg-black/60 px-1 py-0.5 rounded text-[11px] sm:text-xs ${isRedSuit ? 'text-rose-500' : 'text-slate-300'} drop-shadow`}>
            {suitSymbol}
          </span>
        </div>

        {/* Bottom Corner / Wild Transformation Indicator */}
        <div className="relative z-10 w-full flex items-center justify-between px-0.5 pb-0.5 text-[9px] sm:text-[11px] leading-none">
          {cell.isGolden ? (
            <span className="bg-yellow-500/90 text-black font-black text-[7px] sm:text-[8px] px-1 py-0.5 rounded shadow">
              জোকার রূপান্তর
            </span>
          ) : (
            <span className="text-transparent">.</span>
          )}
          <span className={`bg-black/60 px-1 py-0.5 rounded text-[10px] sm:text-xs ${isRedSuit ? 'text-rose-400' : 'text-slate-300'} drop-shadow`}>
            {suitSymbol}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Header & Ticker Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#170a14] via-[#1f0e1a] to-[#120610] p-3 sm:p-4 rounded-2xl border border-rose-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-400 p-0.5 shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center justify-center overflow-hidden shrink-0">
            <div className="h-full w-full bg-gradient-to-b from-[#2b0c16] to-[#0d0306] rounded-[14px] flex flex-col items-center justify-center">
              <span className="text-base sm:text-lg font-black text-amber-300 font-numeric leading-none">
                ACE
              </span>
              <Sparkles className="h-3 w-3 text-yellow-300 mt-0.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white tracking-wide">
                সুপার এস (Super Ace)
              </h2>
              <span className="text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-rose-600 text-black px-2 py-0.5 rounded shadow">
                1024 WAYS
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              গোল্ডেন কার্ড ওয়াইল্ড রূপান্তর ও ক্যাস্কেডিং মাল্টিপ্লায়ার স্লট
            </p>
          </div>
        </div>

        {/* Sound, Upload & Info Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 text-purple-200 text-xs font-bold hover:brightness-125 transition shadow-sm"
            id="super-ace-upload-cards-btn"
            title="কাস্টম কার্ড ছবি আপলোড বা পরিবর্তন করুন"
          >
            <Upload className="h-4 w-4 text-pink-400" />
            <span className="hidden sm:inline">কার্ড আপলোড</span>
            <span className="sm:hidden">কার্ড</span>
          </button>
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="সাউন্ড অন/অফ"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => setShowPaytable(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:brightness-125 transition"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">নিয়ম ও পেটেবিল</span>
          </button>
        </div>
      </div>

      {/* Signature Super Ace Elimination Multiplier Ladder */}
      <div className={`p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all shadow-xl ${
        isFreeSpinActive
          ? 'bg-gradient-to-r from-[#2c0828] via-[#1a0418] to-[#2c0828] border-pink-500/80 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
          : 'bg-gradient-to-r from-[#171207] via-[#0f0c05] to-[#171207] border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
      }`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
            <Flame className={`h-4 w-4 animate-bounce ${isFreeSpinActive ? 'text-pink-400' : 'text-amber-400'}`} />
            <span className={isFreeSpinActive ? 'text-pink-300' : 'text-amber-300'}>
              {isFreeSpinActive ? 'ফ্রি স্পিন মাল্টিপ্লায়ার লেডার (ডাবল রেইট)' : 'এলিমিনেশন কম্বো মাল্টিপ্লায়ার'}
            </span>
          </div>
          {isFreeSpinActive && (
            <span className="text-xs font-black font-numeric text-white bg-pink-600 px-2.5 py-0.5 rounded-full shadow animate-pulse">
              ফ্রি স্পিন বাকি: {freeSpinsRemaining}
            </span>
          )}
        </div>

        {/* 4 Multiplier Steps */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {currentMultipliers.map((m, idx) => {
            const isActive = comboLevel >= idx;
            const isCurrent = comboLevel === idx;
            return (
              <div
                key={m}
                className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border transition-all ${
                  isActive
                    ? isFreeSpinActive
                      ? 'bg-gradient-to-b from-pink-500 to-purple-700 border-pink-300 text-white shadow-[0_0_20px_rgba(236,72,153,0.7)] scale-105 font-black'
                      : 'bg-gradient-to-b from-amber-400 to-amber-600 border-yellow-200 text-black shadow-[0_0_20px_rgba(245,158,11,0.7)] scale-105 font-black'
                    : 'bg-black/50 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide opacity-90">
                  {idx === 0 ? '১ম কম্বো' : idx === 1 ? '২য় কম্বো' : idx === 2 ? '৩য় কম্বো' : '৪র্থ+ কম্বো'}
                </span>
                <span className="text-lg sm:text-2xl font-black font-numeric leading-tight">
                  x{m}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 5x4 Grid Board Frame with Real Casino Bevel & Red Carpet Velvet */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#1c0c16] via-[#10050c] to-[#090206] border-2 border-amber-500/50 p-3 sm:p-6 shadow-[0_0_60px_rgba(244,63,94,0.2)] overflow-hidden">
        {/* Glow neon lamp line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm" />

        {/* Status / Win Alert Strip */}
        <div className="h-12 flex items-center justify-center mb-3">
          {totalWinMessage ? (
            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white text-xs sm:text-sm font-black shadow-2xl border border-yellow-300 animate-bounce">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-200" />
              <span>{totalWinMessage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-bold bg-black/50 px-4 py-1.5 rounded-full border border-amber-500/20">
              <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
              <span>স্পিন চাপুন! গোল্ডেন কার্ড এলিমিনেট হলে ওয়াইল্ড জোকারে পরিণত হবে</span>
            </div>
          )}
        </div>

        {/* 5 Columns x 4 Rows Grid Display */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 max-w-3xl mx-auto p-2 sm:p-4 rounded-2xl bg-black/60 border border-amber-500/30 shadow-inner">
          {grid.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5 sm:gap-2.5">
              {col.map((cell) => (
                <div key={cell.id}>{renderCardCell(cell)}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Live Round Stats Ribbon */}
        <div className="flex items-center justify-between max-w-3xl mx-auto mt-4 px-2 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>সক্রিয় মাল্টিপ্লায়ার: <strong className="text-amber-400 font-numeric text-sm">x{currentMultiplier}</strong></span>
          </div>
          <div>
            <span>চলতি রাউন্ড আর্ন: <strong className="text-emerald-400 font-numeric text-sm">৳{lastRoundWin.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Betting Controls & Action Dashboard */}
      <div className="rounded-2xl bg-gradient-to-b from-[#131722] via-[#0d121c] to-[#090d15] border border-slate-700 p-3 sm:p-5 shadow-xl space-y-4">
        {/* Quick Bet Buttons */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              বাজির পরিমাণ (Bet Amount):
            </span>
            <span className="text-amber-300 font-numeric text-base font-black">
              ৳{betAmount} BDT
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {BET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                disabled={isSpinning}
                onClick={() => setBetAmount(amt)}
                className={`flex-1 min-w-[50px] py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition font-numeric ${
                  betAmount === amt
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 border border-yellow-200'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-white'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Turbo Mode Toggle */}
          <button
            disabled={isSpinning}
            onClick={() => setIsTurbo(!isTurbo)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold border transition ${
              isTurbo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Zap className={`h-4 w-4 ${isTurbo ? 'text-amber-400' : ''}`} />
            <span>টার্বো (স্পিড)</span>
          </button>

          {/* Auto Spin Toggle */}
          <button
            disabled={isSpinning && !autoSpin}
            onClick={() => {
              if (autoSpin) {
                setAutoSpin(false);
                setAutoSpinCount(0);
              } else {
                setAutoSpin(true);
                setAutoSpinCount(10);
                if (!isSpinning) handleSpin(false);
              }
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold border transition ${
              autoSpin
                ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.5)] animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <RotateCw className="h-4 w-4" />
            <span>{autoSpin ? `অটো চলছে (${autoSpinCount})` : 'অটো স্পিন (১০x)'}</span>
          </button>

          {/* Big Spin Action Button */}
          <button
            disabled={isSpinning}
            onClick={() => handleSpin(false)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg font-black tracking-wider uppercase shadow-2xl transition-all ${
              isSpinning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 hover:brightness-110 text-white shadow-[0_0_35px_rgba(245,158,11,0.5)] active:scale-95 border border-yellow-300/40 cursor-pointer'
            }`}
          >
            <RotateCw className={`h-5 w-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'কার্ড ড্র হচ্ছে...' : `স্পিন করুন (৳${betAmount})`}</span>
          </button>
        </div>
      </div>

      {/* Paytable & Rules Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-lg rounded-3xl bg-[#0f1420] border-2 border-amber-500/50 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  সুপার এস (Super Ace) গেম নিয়ম ও পেটেবিল
                </h3>
              </div>
              <button
                onClick={() => setShowPaytable(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 rounded-xl bg-black/50 border border-amber-500/30 space-y-1.5">
                <h4 className="font-bold text-amber-300 flex items-center gap-1">
                  <Flame className="h-4 w-4" /> ১০২৪ ওয়েজ টু উইন (1024 Ways to Win)
                </h4>
                <p className="text-xs text-slate-400">
                  রিল ১ থেকে শুরু করে পাশাপাশি রিলগুলোতে ৩ বা ততোধিক একই কার্ড থাকলে পেআউট অর্জিত হয়। কার্ডগুলোর অবস্থান যে লাইনেই থাকুক, তারা ম্যাচ হিসেবে গণ্য হয়।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-yellow-500/30 space-y-1.5">
                <h4 className="font-bold text-yellow-300 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> গোল্ডেন কার্ড ও ওয়াইল্ড জোকার
                </h4>
                <p className="text-xs text-slate-400">
                  ২, ৩ এবং ৪ নম্বর রিলে গোল্ডেন কার্ড আসে। যখন গোল্ডেন কার্ড কোনো উইনিং কম্বোতে পড়ে, তখন তা অদৃশ্য না হয়ে <strong>ওয়াইল্ড জোকারে</strong> রূপান্তরিত হয় এবং পরবর্তী কম্বো অর্জনে সহায়তা করে!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-pink-500/30 space-y-1.5">
                <h4 className="font-bold text-pink-300 flex items-center gap-1">
                  <Crown className="h-4 w-4" /> ফ্রি গেম (১০ ফ্রি স্পিন)
                </h4>
                <p className="text-xs text-slate-400">
                  বোর্ডে ৩টি বা তার বেশি স্ক্যাটার (SCATTER) আসলে সাথে সাথে ১০টি ফ্রি স্পিন সক্রিয় হয়। ফ্রি স্পিন চলাকালীন এলিমিনেশন মাল্টিপ্লায়ার দ্বিগুণ হয়ে যায়: <strong>x2, x4, x6, x10</strong>!
                </p>
              </div>

              {/* Paytable Grid with Real Card Graphics */}
              <div className="pt-2">
                <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">
                  প্রতীক পেআউট তালিকা (Symbol Paytable):
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {CARD_METADATA.map((card) => {
                    const imgSrc = getCardImage(card.key);
                    return (
                      <div
                        key={card.key}
                        className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5"
                      >
                        <img
                          src={imgSrc}
                          alt={card.name}
                          referrerPolicy="no-referrer"
                          className="h-10 w-8 object-cover rounded-lg border border-amber-500/40 shrink-0 shadow"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 text-xs truncate">{card.name}</span>
                            <span className="text-[10px] font-black text-yellow-400 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-500/30 font-numeric">
                              {card.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{card.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaytable(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition"
            >
              বুঝেছি, খেলা শুরু করুন
            </button>
          </div>
        </div>
      )}

      {/* Card Upload & Customization Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0c0813] border-2 border-purple-500/50 p-4 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    সুপার এস কার্ড আপলোড ও পরিবর্তন
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      রিয়াল ৩ডি ক্যাসিনো কার্ড
                    </span>
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    প্রতিটি কার্ডের নিজস্ব ছবি আপলোড করুন অথবা আসল ৩ডি রিয়াল কার্ড ব্যবহার করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Notification Bar */}
            {uploadSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* Bulk Actions Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/50 to-pink-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300 space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-white flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  রিয়াল ৩ডি কার্ড গ্রাফিক্স সক্রিয় রয়েছে
                </span>
                <p className="text-[11px] text-slate-400">
                  যেকোনো ফাইলে ড্র্যাগ অ্যান্ড ড্রপ বা ক্লিক করে আপনার নিজস্ব ছবি যুক্ত করুন (PNG/JPG)।
                </p>
              </div>
              <button
                onClick={handleResetAllCards}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition shrink-0 shadow"
                title="সকল কার্ড ডিফল্ট ৩ডি রিয়াল কার্ডে ফিরিয়ে আনুন"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                <span>সব কার্ড রিসেট (রিয়াল কার্ড)</span>
              </button>
            </div>

            {/* Cards Upload Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {CARD_METADATA.map((card) => {
                const isCustom = Boolean(customCardImages[card.key]);
                const activeImg = getCardImage(card.key);

                return (
                  <div
                    key={card.key}
                    className="p-2.5 rounded-2xl bg-[#140e21] border border-purple-900/50 flex flex-col justify-between space-y-2 hover:border-purple-500/60 transition group"
                  >
                    {/* Card Title & Tag */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">{card.name}</span>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {card.tag}
                      </span>
                    </div>

                    {/* Card Image Preview */}
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-md bg-black">
                      <img
                        src={activeImg}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      {/* Custom / Real Badge */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-center">
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shadow ${
                            isCustom
                              ? 'bg-purple-600 text-white border border-purple-400'
                              : 'bg-emerald-600 text-white border border-emerald-400'
                          }`}
                        >
                          {isCustom ? 'কাস্টম' : 'রিয়াল ৩ডি'}
                        </span>

                        {isCustom && (
                          <button
                            onClick={() => handleResetCard(card.key)}
                            className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white text-[9px] transition"
                            title="রিয়াল কার্ডে রিসেট করুন"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Card subtitle at bottom */}
                      <div className="absolute bottom-1 inset-x-1 text-center">
                        <span className="text-[8px] text-slate-300 leading-none drop-shadow">
                          {card.key}
                        </span>
                      </div>
                    </div>

                    {/* Drag and Drop / File Input */}
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(card.key, file);
                      }}
                      className="cursor-pointer flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold transition text-center"
                    >
                      <Upload className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(card.key, file);
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-900/40">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-xs sm:text-sm transition shadow-lg"
              >
                সংরক্ষণ ও খেলা চালু রাখুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
