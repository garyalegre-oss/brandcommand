/**
 * Autonomous Web Audio Royalty-Free Soundbed Engine
 * Generates 100% copyright-free background music and audio beds in real-time
 * with zero external downloads, zero latency, and zero social media copyright strikes.
 */

export type SoundtrackGenre = 'lofi_chill' | 'cyber_tech' | 'stadium_hype' | 'acoustic_warm' | 'none';

export interface SoundtrackPreset {
  id: SoundtrackGenre;
  name: string;
  emoji: string;
  bpm: number;
  description: string;
  recommendedFor: string;
}

export const SOUNDTRACK_PRESETS: SoundtrackPreset[] = [
  {
    id: 'lofi_chill',
    name: 'Lo-Fi Chill & Aesthetics',
    emoji: '☕',
    bpm: 82,
    description: 'Mellow Rhodes chords, warm low-pass tones, relaxed groove.',
    recommendedFor: 'Salons, Hair Extensions, Lifestyle, Beauty'
  },
  {
    id: 'cyber_tech',
    name: 'Cyberpunk & Fintech Pulse',
    emoji: '⚡',
    bpm: 118,
    description: 'Driving arpeggiated synth pulses, modern tech momentum.',
    recommendedFor: 'OptionCove, SaaS, Web Apps, Finance'
  },
  {
    id: 'stadium_hype',
    name: 'Stadium Hype & Wonderkid Energy',
    emoji: '⚽',
    bpm: 132,
    description: 'High-energy bass pulses, rapid kick transitions, matchday excitement.',
    recommendedFor: 'Varbona, Fantasy Football, Gaming, Tournaments'
  },
  {
    id: 'acoustic_warm',
    name: 'Warm Acoustic & Community',
    emoji: '🧉',
    bpm: 96,
    description: 'Organic acoustic harmonics, melodic warmth, friendly conversational feel.',
    recommendedFor: 'Uruguay Conecta, Community, Storytelling'
  },
  {
    id: 'none',
    name: 'No Background Music',
    emoji: '🔇',
    bpm: 0,
    description: 'Pure voiceover with zero musical soundbed.',
    recommendedFor: 'Direct Speech Only'
  }
];

class BackgroundMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private intervalId: any = null;
  private isRunning: boolean = false;
  private currentGenre: SoundtrackGenre = 'none';
  private targetVolume: number = 0.18; // Default 18% volume
  private isDucked: boolean = false;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.targetVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      const actual = this.isDucked ? this.targetVolume * 0.4 : this.targetVolume;
      this.musicGain.gain.setTargetAtTime(actual, this.ctx.currentTime, 0.1);
    }
  }

  public setDucking(duck: boolean) {
    this.isDucked = duck;
    if (this.musicGain && this.ctx) {
      const actual = duck ? this.targetVolume * 0.35 : this.targetVolume;
      this.musicGain.gain.setTargetAtTime(actual, this.ctx.currentTime, 0.15);
    }
  }

  public play(genre: SoundtrackGenre) {
    this.initContext();
    this.stop();
    this.currentGenre = genre;
    if (genre === 'none' || !this.ctx) return;

    this.isRunning = true;
    const preset = SOUNDTRACK_PRESETS.find((p) => p.id === genre);
    const bpm = preset?.bpm || 100;
    const beatDurationMs = (60 / bpm) * 1000;

    let step = 0;

    // Musical Chord Progressions (in Hz)
    const chords: Record<SoundtrackGenre, number[][]> = {
      lofi_chill: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 392.00]  // G7
      ],
      cyber_tech: [
        [110.00, 220.00, 261.63, 329.63], // A minor bass
        [98.00, 196.00, 246.94, 293.66],  // G bass
        [87.31, 174.61, 220.00, 261.63],  // F bass
        [123.47, 246.94, 293.66, 370.00]  // B dim
      ],
      stadium_hype: [
        [146.83, 220.00, 293.66, 369.99], // D maj punch
        [110.00, 164.81, 220.00, 277.18], // A maj
        [123.47, 185.00, 246.94, 311.13], // B min
        [98.00, 146.83, 196.00, 246.94]   // G maj
      ],
      acoustic_warm: [
        [196.00, 246.94, 293.66, 392.00], // G chord
        [164.81, 220.00, 261.63, 329.63], // E min
        [130.81, 164.81, 196.00, 261.63], // C chord
        [146.83, 196.00, 220.00, 293.66]  // D sus
      ],
      none: []
    };

    const activeChords = chords[genre] || chords.lofi_chill;

    this.intervalId = setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isRunning) return;

      const chordIdx = Math.floor(step / 4) % activeChords.length;
      const currentChord = activeChords[chordIdx];

      // Play soft arpeggiated note from current chord
      const noteFreq = currentChord[step % currentChord.length];
      this.playNote(noteFreq, genre);

      // Add gentle percussion beat for rhythm
      if (step % 2 === 0 && genre !== 'acoustic_warm') {
        this.playBeat(step % 4 === 0, genre);
      }

      step++;
    }, beatDurationMs / 2);
  }

  private playNote(freq: number, genre: SoundtrackGenre) {
    if (!this.ctx || !this.musicGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      if (genre === 'cyber_tech') {
        osc.type = 'sawtooth';
      } else if (genre === 'stadium_hype') {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Low-pass filter for smooth warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genre === 'cyber_tech' ? 1200 : 800, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  }

  private playBeat(isKick: boolean, genre: SoundtrackGenre) {
    if (!this.ctx || !this.musicGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const beatGain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      if (isKick) {
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        beatGain.gain.setValueAtTime(0.15, now);
        beatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        beatGain.gain.setValueAtTime(0.04, now);
        beatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      }

      osc.connect(beatGain);
      beatGain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public pause() {
    this.stop();
  }

  public resume() {
    if (this.currentGenre !== 'none') {
      this.play(this.currentGenre);
    }
  }
}

export const soundbedEngine = new BackgroundMusicEngine();
