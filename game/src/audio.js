// SOLMAR HEAT — WebAudio Synthesizer & Sound FX / Ambient Music
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;

    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTime = 0;
    this.padOscs = [];
    this.padGain = null;
    this.padChordIndex = 0;

    this.stations = ['SOLMAR FM', 'NEON NIGHTS', 'PALM RADIO'];
    this.stationIndex = 0;
    this.musicInterval = null;

    this.setupListeners();
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.initialized = true;
      this.startStationMusic();
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  setupListeners() {
    const triggerAudio = () => {
      this.init();
      window.removeEventListener('keydown', triggerAudio);
      window.removeEventListener('mousedown', triggerAudio);
      window.removeEventListener('touchstart', triggerAudio);
    };
    window.addEventListener('keydown', triggerAudio);
    window.addEventListener('mousedown', triggerAudio);
    window.addEventListener('touchstart', triggerAudio);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.toggleMute();
      }
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      if (this.muted && this.ctx.state === 'running') {
        this.ctx.suspend();
      } else if (!this.muted && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.textContent = this.muted ? 'UNMUTE (M)' : 'MUTE (M)';
      muteBtn.style.borderColor = this.muted ? '#ef4444' : '#fbbf24';
    }
  }

  playGunshot() {
    if (this.muted || !this.ctx || !this.initialized) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  playCrash(hard = false) {
    if (this.muted || !this.ctx || !this.initialized) return;
    try {
      const dur = hard ? 0.4 : 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hard ? 80 : 120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + dur);

      gain.gain.setValueAtTime(hard ? 0.8 : 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  }

  playPickup() {
    if (this.muted || !this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playMissionComplete() {
    if (this.muted || !this.ctx || !this.initialized) return;
    try {
      const notes = [330, 392, 523, 659];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch (e) {}
  }

  playClick() {
    if (this.muted || !this.ctx || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  updateEngineAndSiren(player, policeManager, dt) {
    if (!this.ctx || !this.initialized) return;
    try {
      if (player.inCar && player.currentCar) {
        if (!this.engineOsc) {
          this.engineOsc = this.ctx.createOscillator();
          this.engineGain = this.ctx.createGain();
          this.engineOsc.type = 'sawtooth';
          this.engineGain.gain.value = 0.0;
          this.engineOsc.connect(this.engineGain);
          this.engineGain.connect(this.ctx.destination);
          this.engineOsc.start();
        }
        const speed = Math.abs(player.currentCar.speed || 0);
        const freq = 40 + speed * 1.5;
        this.engineOsc.frequency.setTargetAtTime(Math.min(300, freq), this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(this.muted ? 0 : 0.2, this.ctx.currentTime, 0.1);
      } else {
        if (this.engineGain) {
          this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
      }

      const isChasing = policeManager && policeManager.policeCars && policeManager.policeCars.length > 0 && player.wanted > 0;
      if (isChasing) {
        if (!this.sirenOsc) {
          this.sirenOsc = this.ctx.createOscillator();
          this.sirenGain = this.ctx.createGain();
          this.sirenOsc.type = 'sine';
          this.sirenGain.gain.value = 0.0;
          this.sirenOsc.connect(this.sirenGain);
          this.sirenGain.connect(this.ctx.destination);
          this.sirenOsc.start();
        }
        this.sirenTime += dt * 3;
        const sirenFreq = 600 + Math.sin(this.sirenTime * Math.PI) * 250;
        this.sirenOsc.frequency.setTargetAtTime(sirenFreq, this.ctx.currentTime, 0.05);
        this.sirenGain.gain.setTargetAtTime(this.muted ? 0 : 0.15, this.ctx.currentTime, 0.1);
      } else {
        if (this.sirenGain) {
          this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
      }
    } catch (e) {}
  }

  stopMusic() {
    try {
      if (this.musicInterval) {
        clearInterval(this.musicInterval);
        this.musicInterval = null;
      }
      if (this.padOscs) {
        this.padOscs.forEach(o => { try { o.stop(); } catch(e){} });
        this.padOscs = [];
      }
    } catch (e) {}
  }

  cycleStation() {
    this.stationIndex = (this.stationIndex + 1) % this.stations.length;
    this.stopMusic();
    if (this.initialized && this.ctx && !this.muted) {
      this.startStationMusic();
    }
    if (window.game && window.game.hud) {
      window.game.hud.updateRadioStation(this.getCurrentStationName());
    }
  }

  getCurrentStationName() {
    return this.stations[this.stationIndex] || 'SOLMAR FM';
  }

  startStationMusic() {
    try {
      if (!this.ctx) return;
      const station = this.getCurrentStationName();

      if (station === 'SOLMAR FM') {
        const chords = [
          [130.81, 164.81, 196.00],
          [110.00, 138.59, 164.81],
          [98.00, 123.47, 146.83],
          [116.54, 146.83, 174.61]
        ];
        this.padGain = this.ctx.createGain();
        this.padGain.gain.value = 0.08;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        this.padGain.connect(filter);
        filter.connect(this.ctx.destination);

        const playChord = () => {
          if (!this.ctx || this.muted) return;
          try {
            this.padChordIndex = (this.padChordIndex + 1) % chords.length;
            const chord = chords[this.padChordIndex];
            if (this.padOscs) {
              this.padOscs.forEach(o => { try { o.stop(); } catch(e){} });
            }
            this.padOscs = chord.map(freq => {
              const osc = this.ctx.createOscillator();
              osc.type = 'triangle';
              osc.frequency.value = freq * 0.5;
              osc.connect(this.padGain);
              osc.start();
              return osc;
            });
          } catch (e) {}
        };
        playChord();
        this.musicInterval = setInterval(playChord, 8000);

      } else if (station === 'NEON NIGHTS') {
        const arpNotes = [220, 261.63, 329.63, 392.00, 440, 523.25];
        this.padGain = this.ctx.createGain();
        this.padGain.gain.value = 0.06;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        this.padGain.connect(filter);
        filter.connect(this.ctx.destination);

        let noteIdx = 0;
        const playArp = () => {
          if (!this.ctx || this.muted) return;
          try {
            if (this.padOscs) {
              this.padOscs.forEach(o => { try { o.stop(); } catch(e){} });
            }
            const freq = arpNotes[noteIdx % arpNotes.length];
            noteIdx++;
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.connect(this.padGain);
            osc.start();
            this.padOscs = [osc];
          } catch (e) {}
        };
        playArp();
        this.musicInterval = setInterval(playArp, 1800);

      } else if (station === 'PALM RADIO') {
        const mellowChords = [
          [261.63, 329.63, 392.00],
          [220.00, 261.63, 329.63],
          [196.00, 246.94, 293.66]
        ];
        this.padGain = this.ctx.createGain();
        this.padGain.gain.value = 0.07;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        this.padGain.connect(filter);
        filter.connect(this.ctx.destination);

        const playMellow = () => {
          if (!this.ctx || this.muted) return;
          try {
            this.padChordIndex = (this.padChordIndex + 1) % mellowChords.length;
            const chord = mellowChords[this.padChordIndex];
            if (this.padOscs) {
              this.padOscs.forEach(o => { try { o.stop(); } catch(e){} });
            }
            this.padOscs = chord.map(freq => {
              const osc = this.ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.value = freq * 0.75;
              osc.connect(this.padGain);
              osc.start();
              return osc;
            });
          } catch (e) {}
        };
        playMellow();
        this.musicInterval = setInterval(playMellow, 10000);
      }
    } catch (e) {}
  }
}
