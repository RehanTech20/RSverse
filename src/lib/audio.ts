class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicOscs: OscillatorNode[] = [];
  private musicGain: GainNode | null = null;
  public soundEnabled = true;
  public musicEnabled = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playMove() {
    this.tone(520, 0.09, 'triangle', 0.07);
  }

  playMatch() {
    this.tone(587.33, 0.12, 'sine', 0.08, 0);
    this.tone(880, 0.16, 'sine', 0.08, 0.08);
  }

  playWin() {
    this.tone(523.25, 0.14, 'triangle', 0.09, 0);
    this.tone(659.25, 0.14, 'triangle', 0.09, 0.1);
    this.tone(783.99, 0.16, 'triangle', 0.09, 0.2);
    this.tone(1046.5, 0.35, 'sine', 0.1, 0.3);
  }

  playNotify() {
    this.tone(740, 0.12, 'sine', 0.06, 0);
    this.tone(987.77, 0.16, 'sine', 0.06, 0.09);
  }

  playError() {
    this.tone(220, 0.14, 'sawtooth', 0.05);
  }

  setAmbientMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
      return;
    }
    const ctx = this.getContext();
    if (!ctx || this.musicOscs.length > 0) return;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 1.5);
    master.connect(ctx.destination);
    this.musicGain = master;

    // Gentle midnight fifths chord pad (D3, A3, F#4)
    const freqs = [146.83, 220.0, 369.99];
    this.musicOscs = freqs.map((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.connect(master);
      osc.start();
      return osc;
    });
  }

  private stopMusic() {
    for (const osc of this.musicOscs) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    }
    this.musicOscs = [];
    if (this.musicGain) {
      try {
        this.musicGain.disconnect();
      } catch {
        // ignore
      }
      this.musicGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
