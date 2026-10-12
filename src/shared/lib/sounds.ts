import { startCallVibration, stopCallVibration } from './haptics';

/**
 * GSI PRO - Sistema de Sons Premium
 */

export const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (freq: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      // Pitch slide up for a positive "confirmation" feel
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + duration);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    
    // Premium "Confirm" Chime: Arpeggio de Dó Maior (C-E-G-C)
    playTone(523.25, now, 0.6, 0.1);         // C5
    playTone(659.25, now + 0.08, 0.6, 0.08);  // E5
    playTone(783.99, now + 0.16, 0.6, 0.06);  // G5
    playTone(1046.50, now + 0.24, 0.8, 0.04); // C6 (High Octave Sparkle)
    
  } catch (e) {
    console.warn('Falha ao reproduzir som', e);
  }
};

export const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, now, 0.5, 0.05); // A5
    playTone(880, now + 0.2, 0.5, 0.05); // A5 second beep
  } catch (e) {}
};

export const playMessageSentSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
};

export const playMessageReceivedSound = () => {
  playNotificationSound();
};


let ringtoneInterval: any = null;
let currentRingtoneCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let activeHtmlAudio: HTMLAudioElement | null = null;

export const playActiveAudio = (url: string, volume: number = 0.5, loop: boolean = true): HTMLAudioElement => {
  stopAllCallSounds();
  const audio = new Audio(url);
  audio.volume = volume;
  audio.loop = loop;
  activeHtmlAudio = audio;
  audio.play().catch(e => console.warn('[Sounds] Audio play blocked/failed:', e));
  return audio;
};

export const startIncomingCallRingtone = () => {
  stopIncomingCallRingtone();
  try {
    startCallVibration();

    const playRingCycle = () => {
      // Clean up previous cycle audio if still running
      currentOscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      currentOscillators = [];
      if (currentRingtoneCtx) {
        try { currentRingtoneCtx.close(); } catch {}
        currentRingtoneCtx = null;
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      currentRingtoneCtx = ctx;
      const now = ctx.currentTime;

      // Phone dual tone: 440Hz + 480Hz
      const playDualTone = (offset: number, dur: number) => {
        [440, 480].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.05);
          gain.gain.setValueAtTime(0.12, now + offset + dur - 0.05);
          gain.gain.linearRampToValueAtTime(0.001, now + offset + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + dur);
          currentOscillators.push(osc);
        });
      };

      playDualTone(0, 0.8);
      playDualTone(1.0, 0.8);
    };

    playRingCycle();
    ringtoneInterval = setInterval(playRingCycle, 3200);
  } catch (e) {
    console.warn('[Sounds] Erro ao iniciar ringtone:', e);
  }
};

export const stopIncomingCallRingtone = () => {
  stopCallVibration();
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }

  currentOscillators.forEach(osc => {
    try { osc.stop(); osc.disconnect(); } catch {}
  });
  currentOscillators = [];

  if (currentRingtoneCtx) {
    try { currentRingtoneCtx.close(); } catch {}
    currentRingtoneCtx = null;
  }

  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {}
    activeHtmlAudio = null;
  }
};

export const stopAllCallSounds = () => {
  stopIncomingCallRingtone();
};
