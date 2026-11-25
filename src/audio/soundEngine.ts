import { AudioSettings, RealmId } from '../types/story';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientTimer: number | null = null;
  private birdTimer: number | null = null;
  private customMusicEl: HTMLAudioElement | null = null;
  private currentRealm: RealmId = 'pantano';
  private unlocked = false;
  private settings: AudioSettings = {
    masterVolume: 0.82,
    musicEnabled: true,
    sfxEnabled: true,
    voiceEnabled: true,
    autoNarrate: true,
    customAmbientMusicUrl: '',
    customDiscoverySfxUrl: '',
  };

  private stepCounter = 0;
  private speechDucking = false;

  public unlockAudio(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.unlocked = true;
    this.syncMusicPlayback();
  }

  public updateSettings(next: AudioSettings): void {
    const musicUrlChanged =
      next.customAmbientMusicUrl !== this.settings.customAmbientMusicUrl;
    this.settings = { ...next };
    this.applyGains();
    if (this.unlocked) {
      if (musicUrlChanged) {
        this.stopCustomMusic();
      }
      this.syncMusicPlayback();
    }
  }

  public setRealm(realm: RealmId): void {
    this.currentRealm = realm;
  }

  public setSpeechDucking(active: boolean): void {
    if (this.speechDucking === active) return;
    this.speechDucking = active;
    this.applyGains();
  }

  private applyGains(): void {
    const duckFactor = this.speechDucking ? 0.34 : 1.0;
    if (this.ctx && this.masterGain && this.musicGain && this.sfxGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.settings.masterVolume, now, 0.08);
      this.musicGain.gain.setTargetAtTime(
        this.settings.musicEnabled ? 0.24 * duckFactor : 0,
        now,
        0.18,
      );
      this.sfxGain.gain.setTargetAtTime(
        this.settings.sfxEnabled ? 0.55 : 0,
        now,
        0.08,
      );
    }
    if (this.customMusicEl) {
      this.customMusicEl.volume = this.settings.musicEnabled
        ? Math.min(1, this.settings.masterVolume * 0.45 * duckFactor)
        : 0;
    }
  }

  private stopCustomMusic(): void {
    if (this.customMusicEl) {
      this.customMusicEl.pause();
      this.customMusicEl.src = '';
      this.customMusicEl = null;
    }
  }

  private syncMusicPlayback(): void {
    if (!this.unlocked) return;

    if (!this.settings.musicEnabled) {
      this.stopLoops();
      if (this.customMusicEl) this.customMusicEl.pause();
      return;
    }

    const customUrl = this.settings.customAmbientMusicUrl.trim();
    if (customUrl) {
      this.stopProceduralMusicLoop();
      if (!this.customMusicEl) {
        this.customMusicEl = new Audio(customUrl);
        this.customMusicEl.loop = true;
        this.customMusicEl.volume = Math.min(1, this.settings.masterVolume * 0.45);
        this.customMusicEl.play().catch(() => {
          this.stopCustomMusic();
          this.startProceduralMusicLoop();
        });
      } else if (this.customMusicEl.paused) {
        this.customMusicEl.play().catch(() => {});
      }
      this.startNatureLoop();
      return;
    }

    this.stopCustomMusic();
    this.startProceduralMusicLoop();
    this.startNatureLoop();
  }

  private startProceduralMusicLoop(): void {
    if (this.ambientTimer !== null) return;
    // Medieval D-Dorian lute/harp notes
    const scale = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];
    const pattern = [0, 2, 4, 5, 4, 2, 1, 3, 4, 6, 7, 4];

    const playNextNote = () => {
      if (!this.ctx || !this.musicGain || !this.settings.musicEnabled) return;
      const idx = pattern[this.stepCounter % pattern.length];
      const freq = scale[idx];
      this.stepCounter++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(380, now + 1.4);

      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.14, now + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0008, now + 1.5);

      osc.connect(filter);
      harmonic.connect(filter);
      filter.connect(env);
      env.connect(this.musicGain);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 1.55);
      harmonic.stop(now + 1.55);

      // Gentle bass drone on downbeat
      if (this.stepCounter % 6 === 1) {
        const bass = this.ctx.createOscillator();
        const bassEnv = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(146.83, now);
        bassEnv.gain.setValueAtTime(0.001, now);
        bassEnv.gain.linearRampToValueAtTime(0.09, now + 0.25);
        bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
        bass.connect(bassEnv);
        bassEnv.connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 3.25);
      }
    };

    playNextNote();
    this.ambientTimer = window.setInterval(playNextNote, 680);
  }

  private startNatureLoop(): void {
    if (this.birdTimer !== null) return;
    this.birdTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.settings.musicEnabled) return;
      if (this.currentRealm === 'pantano') {
        this.playSwampBubble();
      } else if (
        this.currentRealm === 'bosque_encantado' ||
        this.currentRealm === 'bosque_hadas' ||
        this.currentRealm === 'destino_final'
      ) {
        this.playBirdChirp();
      }
    }, 3400);
  }

  private stopProceduralMusicLoop(): void {
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  private stopLoops(): void {
    this.stopProceduralMusicLoop();
    if (this.birdTimer !== null) {
      clearInterval(this.birdTimer);
      this.birdTimer = null;
    }
  }

  private playBirdChirp(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    const base = 1850 + Math.random() * 650;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.28, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(base * 0.92, now + 0.17);
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.045, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0005, now + 0.22);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  private playSwampBubble(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    const f = 260 + Math.random() * 140;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 2.1, now + 0.12);
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.06, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0005, now + 0.14);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBookOpenMagic(): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain || !this.settings.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const notes = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + i * 0.09;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.16, t + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 0.85);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  public playPageTurn(): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain || !this.settings.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.24;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(1.4, now);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.18, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    noise.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    noise.start(now);
  }

  public playFootstep(realm: RealmId): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain || !this.settings.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const pitchVar = 0.92 + Math.random() * 0.16;

    if (realm === 'pantano') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(115 * pitchVar, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);
    } else if (realm === 'bosque_encantado' || realm === 'bosque_hadas') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 * pitchVar, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.06);
    } else {
      // Cobblestone / castle stone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240 * pitchVar, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);
    }

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.09, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0005, now + 0.085);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playStationDiscover(): void {
    if (!this.unlocked || !this.settings.sfxEnabled) return;
    const customSfx = this.settings.customDiscoverySfxUrl.trim();
    if (customSfx) {
      const audio = new Audio(customSfx);
      audio.volume = Math.min(1, this.settings.masterVolume);
      audio.play().catch(() => this.playProceduralFanfare());
      return;
    }
    this.playProceduralFanfare();
  }

  private playProceduralFanfare(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + idx * 0.075;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.025);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 0.72);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.76);
    });
  }

  public dispose(): void {
    this.stopLoops();
    this.stopCustomMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
