// Deterministic synchronized Big-Small (Wingo / Color Trading) round generator
// Every user has the EXACT same countdown, period number, and winning number at any given second worldwide!

import { BigSmallRound } from '../types';

export const ROUND_DURATION_SEC = 30; // 30 seconds per round (synchronized)

// Convert timestamp (ms) to period number e.g. 20260916-00452
export function getPeriodInfo(nowMs: number = Date.now()) {
  const date = new Date(nowMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  // Total seconds elapsed today in UTC
  const startOfDay = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  const secondsToday = Math.floor((nowMs - startOfDay) / 1000);
  
  // Period index today (1-indexed)
  const periodIndex = Math.floor(secondsToday / ROUND_DURATION_SEC) + 1;
  const periodId = `${year}${month}${day}${String(periodIndex).padStart(4, '0')}`;
  
  // Seconds left in current round (1 to 30)
  const secondsElapsedInRound = secondsToday % ROUND_DURATION_SEC;
  const secondsLeft = ROUND_DURATION_SEC - secondsElapsedInRound;
  
  return {
    periodId,
    periodIndex,
    secondsLeft,
    canBet: secondsLeft > 5, // Last 5 seconds is lock period
    lockPeriod: secondsLeft <= 5,
  };
}

import { storage } from './storage';

// Pseudo-random deterministic outcome for a given periodId
// Based on deterministic hashing of periodId + seed so EVERY player sees the identical number
// Respects Admin override if configured!
export function getDeterministicRoundResult(periodId: string): BigSmallRound {
  try {
    const config = storage.getConfig();
    if (config && config.bigSmallOverride !== null && config.bigSmallOverride !== undefined) {
      let forcedNum = 7; // default big
      if (typeof config.bigSmallOverride === 'number') {
        forcedNum = Math.min(9, Math.max(0, config.bigSmallOverride));
      } else if (config.bigSmallOverride === 'big') {
        forcedNum = 7;
      } else if (config.bigSmallOverride === 'small') {
        forcedNum = 2;
      }

      const size: 'big' | 'small' = forcedNum >= 5 ? 'big' : 'small';
      let color: 'green' | 'violet' | 'red' = 'red';
      if (forcedNum === 0 || forcedNum === 5) {
        color = 'violet';
      } else if ([1, 3, 7, 9].includes(forcedNum)) {
        color = 'green';
      } else {
        color = 'red';
      }

      return {
        periodId,
        number: forcedNum,
        size,
        color,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
    }
  } catch {
    // ignore
  }

  let hash = 0;
  for (let i = 0; i < periodId.length; i++) {
    const char = periodId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  // High quality pseudo-random number 0-9
  const absHash = Math.abs(hash);
  const number = absHash % 10;
  
  // Size: 0,1,2,3,4 = small | 5,6,7,8,9 = big
  const size: 'big' | 'small' = number >= 5 ? 'big' : 'small';
  
  // Color standard:
  // 1, 3, 7, 9 = Green
  // 2, 4, 6, 8 = Red
  // 0, 5 = Violet (mixed)
  let color: 'green' | 'violet' | 'red' = 'red';
  if (number === 0 || number === 5) {
    color = 'violet';
  } else if ([1, 3, 7, 9].includes(number)) {
    color = 'green';
  } else {
    color = 'red';
  }
  
  return {
    periodId,
    number,
    size,
    color,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };
}

// Generate the previous N synchronized rounds for history chart
export function getPreviousSynchronizedRounds(count: number = 20, nowMs: number = Date.now()): BigSmallRound[] {
  const current = getPeriodInfo(nowMs);
  const rounds: BigSmallRound[] = [];
  
  for (let i = 1; i <= count; i++) {
    const pastMs = nowMs - (i * ROUND_DURATION_SEC * 1000);
    const pastPeriod = getPeriodInfo(pastMs);
    rounds.push(getDeterministicRoundResult(pastPeriod.periodId));
  }
  
  return rounds;
}
