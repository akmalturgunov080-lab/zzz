// Procedural Web Audio engine for 8-bit retro arcade sounds

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Audio Context is initialized lazily upon user interaction
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngine();
    } else {
      this.startEngine();
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Engine hum using low-frequency sawtooth wave
  public startEngine() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.engineOsc) return; // Already running

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55; // Low power A1 pitch

      // Nice soft engine volume so it is background
      this.engineGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch (err) {
      console.error("Failed to start engine audio:", err);
    }
  }

  public updateEnginePitch(speedRatio: number) {
    if (this.isMuted || !this.ctx || !this.engineOsc || !this.engineGain) return;
    // Speed ratio goes 0 to 1. Engine frequency ramps from 55hz to 180hz
    const freq = 45 + speedRatio * 150;
    this.engineOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Slight volume rattle depending on speed
    const vol = 0.04 + speedRatio * 0.05;
    this.engineGain.gain.setValueAtTime(vol, this.ctx.currentTime);
  }

  public stopEngine() {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
    } catch (e) {
      // Ignore audio teardown errors
    }
  }

  // Double arpeggio coin chime
  public playCoinSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5 note
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note (classic retro interval)

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Refuel laser swoop up
  public playGasSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // High-powered sci-fi laser rise for turbo powerup
  public playTurboSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(1600, now + 0.5);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  // Crash noise explosion (synthetically generated with random buffered white noise or fast sweeping pitch)
  public playCrashSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Let's create an extreme low end sweeping white-noise explosion
      const bufferSize = this.ctx.sampleRate * 0.6; // 0.6 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Low pass filter to make it sound muffled and thuddy, not key hiss
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start();
      noiseNode.stop(now + 0.6);
    } catch (e) {
      // Fallback simple frequency drop of triangle wave
      try {
        const now = this.ctx.currentTime;
        const fallbackOsc = this.ctx.createOscillator();
        const fallbackGain = this.ctx.createGain();
        fallbackOsc.type = 'sawtooth';
        fallbackOsc.frequency.setValueAtTime(150, now);
        fallbackOsc.frequency.linearRampToValueAtTime(30, now + 0.4);
        fallbackGain.gain.setValueAtTime(0.25, now);
        fallbackGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        fallbackOsc.connect(fallbackGain);
        fallbackGain.connect(this.ctx.destination);
        fallbackOsc.start();
        fallbackOsc.stop(now + 0.4);
      } catch (ex) {}
    }
  }

  // Spin sound (siren alert frequency wobble)
  public playSpinSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.1);
      osc.frequency.setValueAtTime(400, now + 0.2);
      osc.frequency.setValueAtTime(200, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Laser blaster projectile fire sound
  public playShootSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Champion victory fanfare tune (melody!)
  public playWinSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.25 }, // C6 (staccato rise)
        { f: 880.00, d: 0.12 }, // A5
        { f: 1046.50, d: 0.50 } // C6 (long winner peak)
      ];

      let elapsed = 0;
      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, now + elapsed);

        gain.gain.setValueAtTime(0.10, now + elapsed);
        gain.gain.exponentialRampToValueAtTime(0.001, now + elapsed + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + elapsed);
        osc.stop(now + elapsed + note.d);
        elapsed += note.d + 0.04;
      });
    } catch (e) {}
  }
}

// Global sound manager instance
export const soundManager = new SoundManager();
