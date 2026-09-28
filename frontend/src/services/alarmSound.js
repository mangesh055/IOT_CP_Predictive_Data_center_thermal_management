/**
 * High-Tech Web Audio API Sound Synthesizer for Cinematic Movie Alerts
 * Uses warm sinusoidal & low-pass filtered harmonics (no harsh sawtooth noise).
 * Offers multiple iconic cinematic presets:
 * 1. 'sci-fi'     : Iconic Hollywood Red Alert frequency sweep ("Wwoooo-up... Wwoooo-up")
 * 2. 'cyber-ping' : Matrix/Mr. Robot high-tech dual electronic security chime
 * 3. 'deep-sonar' : Deep resonant reactor/submarine tactical ping
 * 4. 'two-tone'   : Smooth alternating cinematic facility klaxon
 */

class CyberAlarmAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.currentPreset = 'sci-fi'; // 'sci-fi' | 'cyber-ping' | 'deep-sonar' | 'two-tone'
    this.timer = null;
    this.masterGain = null;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setPreset(preset) {
    if (['sci-fi', 'cyber-ping', 'deep-sonar', 'two-tone'].includes(preset)) {
      this.currentPreset = preset;
      // If currently playing, restart with new preset immediately
      if (this.isPlaying) {
        this.stopAlarm();
        this.startAlarm();
      } else {
        // Play quick preview sample
        this.previewPreset(preset);
      }
    }
    return this.currentPreset;
  }

  previewPreset(preset) {
    this._initContext();
    if (!this.ctx || this.isMuted) return;
    this._playPulse(preset || this.currentPreset, 0.16);
  }

  startAlarm(volume = 0.16) {
    if (this.isPlaying || this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    this.isPlaying = true;

    const intervals = {
      'sci-fi': 1100,
      'cyber-ping': 900,
      'deep-sonar': 1300,
      'two-tone': 850
    };

    const pulseLoop = () => {
      if (!this.isPlaying || this.isMuted || !this.ctx) return;
      this._playPulse(this.currentPreset, volume);
      const delay = intervals[this.currentPreset] || 1000;
      this.timer = setTimeout(pulseLoop, delay);
    };

    pulseLoop();
  }

  _playPulse(preset, volume = 0.16) {
    try {
      const now = this.ctx.currentTime;

      if (preset === 'sci-fi') {
        // Preset 1: Iconic Hollywood Sci-Fi Red Alert (Smooth rising warm sweep + resonant body tone)
        const osc1 = this.ctx.createOscillator();
        const filter1 = this.ctx.createBiquadFilter();
        const gain1 = this.ctx.createGain();

        osc1.type = 'sine';
        // Frequency sweeps up smoothly from 430Hz to 800Hz
        osc1.frequency.setValueAtTime(430, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.44);

        // Low-pass filter removes any harsh digital edges
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(1600, now);

        // Warm volume envelope
        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.linearRampToValueAtTime(volume, now + 0.08);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

        osc1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.60);

        // Sub-harmonic warm body tone for authentic movie depth
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(215, now);
        osc2.frequency.exponentialRampToValueAtTime(400, now + 0.44);

        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.linearRampToValueAtTime(volume * 0.4, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc2.start(now);
        osc2.stop(now + 0.60);

      } else if (preset === 'cyber-ping') {
        // Preset 2: High-Tech Security Ping (Double glass electronic chime)
        const notes = [
          { f: 880, delay: 0, dur: 0.18 },
          { f: 1174, delay: 0.14, dur: 0.28 }
        ];

        notes.forEach(({ f, delay, dur }) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + delay);

          gain.gain.setValueAtTime(0.001, now + delay);
          gain.gain.linearRampToValueAtTime(volume * 0.9, now + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + delay + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + dur + 0.02);
        });

      } else if (preset === 'deep-sonar') {
        // Preset 3: Deep Resonant Submarine / Reactor Ping
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(195, now + 0.7);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 1.2, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.75);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.78);

      } else if (preset === 'two-tone') {
        // Preset 4: Alternating Cinematic Facility Klaxon (Warm rounded tones)
        const tones = [
          { f: 620, delay: 0, dur: 0.22 },
          { f: 490, delay: 0.23, dur: 0.26 }
        ];

        tones.forEach(({ f, delay, dur }) => {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + delay);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(950, now + delay);

          gain.gain.setValueAtTime(0.001, now + delay);
          gain.gain.linearRampToValueAtTime(volume * 0.9, now + delay + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + dur + 0.02);
        });
      }
    } catch (e) {
      console.warn('Alarm audio playback issue', e);
    }
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAlarm();
    }
    return this.isMuted;
  }
}

export const alarmAudio = new CyberAlarmAudioEngine();
