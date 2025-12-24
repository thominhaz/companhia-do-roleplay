import { useCallback, useRef } from 'react';
import { useSoundSettings } from './useSoundSettings';

// Simple sound system using Web Audio API for subtle wooden/click sounds
export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { settings } = useSoundSettings();

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Subtle wooden click sound
  const playClick = useCallback(() => {
    if (!settings.enabled) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Wood-like characteristics
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(180, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const baseVolume = 0.15 * settings.volume;
      gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, [getAudioContext, settings.enabled, settings.volume]);

  // Dice roll sound - multiple quick wooden taps
  const playDiceRoll = useCallback(() => {
    if (!settings.enabled) return;
    
    try {
      const ctx = getAudioContext();
      const rollCount = 4 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < rollCount; i++) {
        const delay = i * 0.06 + Math.random() * 0.02;
        const pitch = 120 + Math.random() * 80;
        
        const oscillator = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
        oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.5, ctx.currentTime + delay + 0.04);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300 + Math.random() * 200, ctx.currentTime);
        filter.Q.setValueAtTime(2, ctx.currentTime);

        const baseVolume = (0.08 + Math.random() * 0.06) * settings.volume;
        noiseGain.gain.setValueAtTime(0, ctx.currentTime + delay);
        noiseGain.gain.linearRampToValueAtTime(baseVolume, ctx.currentTime + delay + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.05);

        oscillator.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + 0.06);
      }
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, [getAudioContext, settings.enabled, settings.volume]);

  // Success sound - gentle wooden chime
  const playSuccess = useCallback(() => {
    if (!settings.enabled) return;
    
    try {
      const ctx = getAudioContext();
      const frequencies = [330, 440];
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        const baseVolume = 0.1 * settings.volume;
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gainNode.gain.linearRampToValueAtTime(baseVolume, ctx.currentTime + i * 0.08 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime + i * 0.08);
        oscillator.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext, settings.enabled, settings.volume]);

  return { playClick, playDiceRoll, playSuccess };
};

// Global sound instance for components that can't use hooks
let globalSoundInstance: ReturnType<typeof useSoundEffects> | null = null;

export const getGlobalSounds = () => {
  if (!globalSoundInstance) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playClick = () => {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.05);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
      } catch (e) {}
    };

    const playDiceRoll = () => {
      try {
        const rollCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < rollCount; i++) {
          const delay = i * 0.06 + Math.random() * 0.02;
          const pitch = 120 + Math.random() * 80;
          
          const oscillator = audioContext.createOscillator();
          const noiseGain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();

          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(pitch, audioContext.currentTime + delay);
          oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.5, audioContext.currentTime + delay + 0.04);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(300 + Math.random() * 200, audioContext.currentTime);

          const volume = 0.08 + Math.random() * 0.06;
          noiseGain.gain.setValueAtTime(0, audioContext.currentTime + delay);
          noiseGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + delay + 0.005);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + 0.05);

          oscillator.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + delay);
          oscillator.stop(audioContext.currentTime + delay + 0.06);
        }
      } catch (e) {}
    };

    const playSuccess = () => {
      try {
        const frequencies = [330, 440];
        
        frequencies.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.08);

          gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.08);
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + i * 0.08 + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.08 + 0.2);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + i * 0.08);
          oscillator.stop(audioContext.currentTime + i * 0.08 + 0.25);
        });
      } catch (e) {}
    };

    globalSoundInstance = { playClick, playDiceRoll, playSuccess };
  }
  return globalSoundInstance;
};
