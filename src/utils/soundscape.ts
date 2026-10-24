// Procedural Web Audio API Soundscape for ReddyMade Seychelles Gallery
// Generates warm tropical tradewinds, distant Indian Ocean surf, and soft island acoustic/kalimba music

class SeychellesSoundscape {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private melodyInterval: number | null = null;
  private chordInterval: number | null = null;
  private windVolume = 0.55;
  private musicVolume = 0.45;
  private isMuted = false;

  // Sunlit D Lydian / Major pentatonic frequencies (Hz) for warm island acoustic feel
  private readonly scaleNotes = [
    293.66, // D4
    329.63, // E4
    369.99, // F#4
    415.30, // G#4 (Lydian warmth)
    440.00, // A4
    493.88, // B4
    554.37, // C#5
    587.33, // D5
    659.25, // E5
    739.99, // F#5
    880.00, // A5
  ];

  private readonly chords = [
    [146.83, 220.00, 277.18, 369.99], // Dmaj7 (D3, A3, C#4, F#4)
    [164.81, 246.94, 329.63, 415.30], // E6/9
    [185.00, 277.18, 369.99, 440.00], // F#m7
    [196.00, 293.66, 369.99, 493.88], // Gmaj7
  ];

  private currentChordIdx = 0;

  public async start(): Promise<void> {
    if (this.isRunning && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 1.0;
    this.masterGain.connect(this.ctx.destination);

    // Wind & Ocean Surf Bus
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = this.windVolume;
    this.windGain.connect(this.masterGain);

    // Music Bus with Stereo Echo/Reverb
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.delayNode = this.ctx.createDelay(1.5);
    this.delayNode.delayTime.value = 0.42;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.36;

    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1800;

    this.delayNode.connect(delayFilter);
    delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.musicGain);

    this.setupTradewindAndSurfNodes();
    this.setupGenerativeIslandMusic();

    this.isRunning = true;
  }

  private setupTradewindAndSurfNodes(): void {
    if (!this.ctx || !this.windGain) return;

    // Create 6-second pink/brown noise buffer
    const bufferSize = this.ctx.sampleRate * 6;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }
    }

    // Layer 1: Warm Tradewind Breeze through Louvered Windows
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 1.6;

    // LFO to modulate wind gusts slowly (0.11 Hz ~ every 9 seconds)
    const windLfo = this.ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.11;

    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 180; // Sweeps bandpass between 160Hz and 520Hz
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const breezeGain = this.ctx.createGain();
    breezeGain.gain.value = 0.5;

    windSource.connect(windFilter);
    windFilter.connect(breezeGain);
    breezeGain.connect(this.windGain);

    // Layer 2: High Palm Frond Whisper & Distant Reef Surf
    const surfSource = this.ctx.createBufferSource();
    surfSource.buffer = buffer;
    surfSource.loop = true;

    const surfFilter = this.ctx.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = 220;

    const surfLfo = this.ctx.createOscillator();
    surfLfo.type = 'sine';
    surfLfo.frequency.value = 0.075; // ~13 sec wave period

    const surfAmpGain = this.ctx.createGain();
    surfAmpGain.gain.value = 0.28;

    const surfLfoDepth = this.ctx.createGain();
    surfLfoDepth.gain.value = 0.14;
    surfLfo.connect(surfLfoDepth);
    surfLfoDepth.connect(surfAmpGain.gain);

    surfSource.connect(surfFilter);
    surfFilter.connect(surfAmpGain);
    surfAmpGain.connect(this.windGain);

    windSource.start();
    windLfo.start();
    surfSource.start();
    surfLfo.start();
  }

  private setupGenerativeIslandMusic(): void {
    this.playWarmPadChord();

    // Play a new warm ambient chord every 6.5 seconds
    this.chordInterval = window.setInterval(() => {
      if (!this.isMuted && this.musicVolume > 0.01) {
        this.playWarmPadChord();
      }
    }, 6500);

    // Gentle acoustic guitar / kalimba pluck every 750ms with natural island syncopation
    this.melodyInterval = window.setInterval(() => {
      if (!this.isMuted && this.musicVolume > 0.01) {
        if (Math.random() < 0.72) {
          this.playAcousticPluck();
        }
      }
    }, 720);
  }

  private playWarmPadChord(): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.currentChordIdx];
    this.currentChordIdx = (this.currentChordIdx + 1) % this.chords.length;

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq * 1.002, now); // Slight detune for warm chorus

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);

      const peakGain = 0.042 / (idx * 0.35 + 1);
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 2.2);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.2);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 7.4);
      subOsc.stop(now + 7.4);
    });
  }

  private playAcousticPluck(): void {
    if (!this.ctx || !this.musicGain || !this.delayNode) return;
    const now = this.ctx.currentTime;
    const freq = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const pluckGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + 1.4);

    pluckGain.gain.setValueAtTime(0.001, now);
    pluckGain.gain.linearRampToValueAtTime(0.065, now + 0.018);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.018, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);

    filter.connect(pluckGain);
    pluckGain.connect(this.musicGain);
    pluckGain.connect(this.delayNode);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 2.2);
    overtone.stop(now + 2.2);
  }

  public playInteractionChime(): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5 gentle harmonic chime
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.0001, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.035, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 1.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 1.3);
    });
  }

  public setWindVolume(val: number): void {
    this.windVolume = Math.max(0, Math.min(1, val));
    if (this.windGain && this.ctx) {
      this.windGain.gain.setTargetAtTime(this.windVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.1);
    }
  }

  public getState() {
    return {
      isRunning: this.isRunning,
      isMuted: this.isMuted,
      windVolume: this.windVolume,
      musicVolume: this.musicVolume,
    };
  }

  public dispose(): void {
    if (this.melodyInterval) clearInterval(this.melodyInterval);
    if (this.chordInterval) clearInterval(this.chordInterval);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isRunning = false;
  }
}

export const soundscape = new SeychellesSoundscape();
