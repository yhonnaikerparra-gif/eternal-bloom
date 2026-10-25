import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Romantic Pentatonic chime notes (C4, D4, E4, G4, A4, C5, D5, E5, G5)
  const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];

  const playChime = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Soft chime envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3.6);
  };

  const toggleAudio = () => {
    if (!isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      playChime();
      // Schedule gentle random chimes every 3.5 to 5.5 seconds
      intervalRef.current = window.setInterval(() => {
        playChime();
      }, 4200);
      setIsPlaying(true);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <button
      onClick={toggleAudio}
      className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 border ${
        isPlaying
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20'
          : 'bg-slate-900/40 text-slate-400 border-slate-700/40 hover:text-white hover:bg-slate-800/60'
      }`}
      title={isPlaying ? 'Silenciar melodía romántica' : 'Escuchar melodía romántica'}
    >
      {isPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
};
