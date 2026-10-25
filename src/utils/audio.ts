// Web Audio API Synthesizer for realistic Aviator Pro & Casino Game sounds
type MuteListener = (isMuted: boolean) => void;

const SOUND_STORAGE_KEY = 'aviator_muted';

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isEngineShouldRun: boolean = false;
  private lastEngineMult: number = 1.0;
  private listeners: Set<MuteListener> = new Set();

  constructor() {
    // Load saved global audio mute preference from localStorage
    try {
      const savedMute = localStorage.getItem(SOUND_STORAGE_KEY);
      this.isMuted = savedMute === 'true';
    } catch {
      this.isMuted = false;
    }

    // Keep state synced across tabs/windows if storage changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SOUND_STORAGE_KEY && e.newValue !== null) {
          const nextMuted = e.newValue === 'true';
          if (this.isMuted !== nextMuted) {
            this.isMuted = nextMuted;
            if (this.isMuted) {
              this.stopEngineNode();
            } else if (this.isEngineShouldRun) {
              this.startEngine(this.lastEngineMult);
            }
            this.notifyListeners();
          }
        }
      });
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isMuted);
      } catch {
        // ignore listener errors
      }
    });
  }

  public subscribe(listener: MuteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setMuted(muted: boolean): boolean {
    if (this.isMuted === muted) return this.isMuted;
    this.isMuted = muted;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(this.isMuted));
    } catch {
      // ignore storage quota errors
    }

    if (this.isMuted) {
      this.stopEngineNode();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      this.initContext();
      this.playUnmuteFeedback();
      if (this.isEngineShouldRun) {
        this.startEngine(this.lastEngineMult);
      }
    }

    this.notifyListeners();
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Subtle confirmation tone when user unmutes global sound
  private playUnmuteFeedback() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880]; // D5 -> A5 crisp confirmation chime
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.055 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // Engine sound that climbs in pitch as multiplier increases
  public startEngine(initialMult = 1.0) {
    this.isEngineShouldRun = true;
    this.lastEngineMult = initialMult;
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopEngineNode();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Base frequency mapped from multiplier
      const baseFreq = 65 + Math.min(initialMult * 25, 400);
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.engineOsc = osc;
      this.engineGain = gain;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateEnginePitch(multiplier: number) {
    this.lastEngineMult = multiplier;
    if (this.isMuted || !this.engineOsc || !this.ctx) return;
    try {
      const freq = 65 + Math.min(multiplier * 28, 550);
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    } catch {
      // ignore
    }
  }

  private stopEngineNode() {
    if (this.engineOsc) {
      const oscToStop = this.engineOsc;
      const gainToStop = this.engineGain;
      this.engineOsc = null;
      this.engineGain = null;
      try {
        if (gainToStop && this.ctx) {
          gainToStop.gain.setValueAtTime(gainToStop.gain.value, this.ctx.currentTime);
          gainToStop.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
        }
        setTimeout(() => {
          try {
            oscToStop.stop();
            oscToStop.disconnect();
          } catch {
            // ignore
          }
        }, 90);
      } catch {
        // ignore
      }
    }
  }

  public stopEngine() {
    this.isEngineShouldRun = false;
    this.stopEngineNode();
  }

  // Pleasant win / cashout chime
  public playCashout() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // Crash / Flew Away sound (subtle explosion / white noise sweep)
  public playCrash() {
    this.stopEngine();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Low bass impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // ignore
    }
  }

  // Countdown beep for round start
  public playTick(isLast = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isLast ? 880 : 440, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  // Slot Reel Click sound
  public playReelClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // Slot Reel Stop Sound
  public playReelStop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  // Slot Big Win Chime
  public playSlotWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C E G B C

      chord.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.14, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // Super Ace - Card deal sound
  public playCardDeal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.07);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // Super Ace - Card elimination explosion
  public playCardElimination(comboLevel = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 400 + comboLevel * 100;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  // Super Ace - Combo level-up chime
  public playComboMultiplier(mult = 2) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [350 * (mult * 0.5 + 0.5), 440 * (mult * 0.5 + 0.5), 554 * (mult * 0.5 + 0.5)];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.1, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.28);
      });
    } catch {
      // ignore
    }
  }

  // Super Ace - Golden Card transform to Wild Joker
  public playJokerTransform() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundManager();
