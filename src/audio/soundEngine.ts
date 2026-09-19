import { SoundEvent } from '../core/types';

interface ToneOptions {
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  to?: number | null;
  attack?: number;
}

interface NoiseOptions {
  at?: number;
  dur?: number;
  freq?: number;
  q?: number;
  type?: BiquadFilterType;
  gain?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('knightsweeper-sound');
        this.enabled = stored !== 'off';
      } catch {
        this.enabled = true;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('knightsweeper-sound', val ? 'on' : 'off');
      } catch {
        // ignore
      }
    }
    if (val) {
      this.play({ type: 'fresh' });
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private tone(freq: number, o: ToneOptions = {}): void {
    const c = this.ensureContext();
    if (!c || !this.master) return;

    const {
      at = 0,
      dur = 0.2,
      type = 'sine',
      gain = 0.25,
      to = null,
      attack = 0.005,
    } = o;

    const t = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, to), t + dur);
    }

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(this.master);

    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private noise(o: NoiseOptions = {}): void {
    const c = this.ensureContext();
    if (!c || !this.master) return;

    const {
      at = 0,
      dur = 0.08,
      freq = 1200,
      q = 1,
      type = 'bandpass',
      gain = 0.3,
    } = o;

    const t = c.currentTime + at;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = c.createBufferSource();
    src.buffer = buf;

    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;

    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);

    src.start(t);
  }

  /**
   * Tactile physical chess piece landing:
   * Crisp felt/wood impact transient + weighted wooden body thud.
   */
  public playPieceMove(): void {
    // 1. Initial felt/wood contact transient (short bandpass noise burst)
    this.noise({ dur: 0.016, freq: 1400, q: 2.2, gain: 0.18 });
    // 2. Body resonance: quick downward frequency drop simulating piece mass on wood
    this.tone(125, { dur: 0.048, to: 55, gain: 0.22, attack: 0.003, type: 'triangle' });
    // 3. Hollow board chamber overtone
    this.tone(260, { dur: 0.032, to: 190, gain: 0.09, attack: 0.002, type: 'sine' });
  }

  /**
   * Powerful, balanced landmine detonation:
   * Sharp blast transient + heavy sub-bass boom + lowpass debris rumble.
   */
  public playMineDetonation(): void {
    // Sharp initial explosion transient
    this.noise({ dur: 0.04, freq: 1600, q: 1.5, type: 'bandpass', gain: 0.45 });
    // Sub-bass heavy impact
    this.tone(145, { dur: 0.48, to: 28, gain: 0.55, attack: 0.004, type: 'sine' });
    // Debris / shockwave rumble tail
    this.noise({ at: 0.03, dur: 0.38, freq: 380, q: 1, type: 'lowpass', gain: 0.38 });
  }

  /**
   * Sharp wood-on-wood strike when reaching the King.
   */
  public playKingImpact(): void {
    this.noise({ dur: 0.025, freq: 1800, q: 2, gain: 0.28 });
    this.tone(240, { dur: 0.065, to: 110, gain: 0.35, attack: 0.002, type: 'triangle' });
  }

  /**
   * Heavy wooden King piece toppling and knocking on the board.
   */
  public playKingFall(): void {
    // Primary piece tumble
    this.tone(95, { at: 0.02, dur: 0.08, to: 42, gain: 0.3, type: 'triangle' });
    this.noise({ at: 0.03, dur: 0.04, freq: 850, q: 1.8, gain: 0.14 });
    // Secondary soft rebound tap
    this.tone(70, { at: 0.11, dur: 0.045, to: 40, gain: 0.16, type: 'sine' });
  }

  /**
   * Triumphant, restrained victory arpeggio celebrating King capture.
   */
  public playVictorySting(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.tone(freq, {
        at: idx * 0.09,
        dur: 0.32,
        gain: 0.18,
        attack: 0.005,
        type: 'triangle',
      });
    });
    // High shimmering overtone
    this.tone(1318.51, { at: 0.38, dur: 0.45, gain: 0.08, attack: 0.01, type: 'sine' });
  }

  /**
   * Somber, low defeat cadence when both knights are lost.
   */
  public playDefeatSting(): void {
    this.tone(185, { at: 0.05, dur: 0.28, to: 140, gain: 0.18, type: 'sawtooth' });
    this.tone(130, { at: 0.32, dur: 0.32, to: 95, gain: 0.18, type: 'sawtooth' });
    this.tone(75, { at: 0.62, dur: 0.55, to: 40, gain: 0.24, type: 'sine' });
  }

  /**
   * Tactical flag placement / removal click.
   */
  public playFlagSnap(placed: boolean): void {
    this.noise({
      dur: 0.018,
      freq: placed ? 1600 : 900,
      q: 3,
      gain: placed ? 0.12 : 0.09,
    });
    this.tone(placed ? 880 : 580, {
      dur: 0.025,
      gain: 0.08,
      attack: 0.002,
      type: 'triangle',
    });
  }

  public play(event: SoundEvent): void {
    if (!this.enabled) return;

    switch (event.type) {
      case 'move':
      case 'land':
        this.playPieceMove();
        break;

      case 'mine':
        this.playMineDetonation();
        break;

      case 'respawn':
        // Reinforcement deployment tap
        this.tone(110, { at: 0.05, dur: 0.06, to: 65, gain: 0.22, type: 'triangle' });
        this.noise({ at: 0.05, dur: 0.02, freq: 1100, gain: 0.12 });
        break;

      case 'kingImpact':
        this.playKingImpact();
        break;

      case 'kingFall':
        this.playKingFall();
        break;

      case 'win':
        this.playVictorySting();
        break;

      case 'lose':
        this.playMineDetonation();
        this.playDefeatSting();
        break;

      case 'flag':
        this.playFlagSnap(event.placed);
        break;

      case 'nope':
        this.tone(95, { dur: 0.045, to: 60, gain: 0.12, type: 'triangle' });
        break;

      case 'fresh':
        this.playPieceMove();
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
