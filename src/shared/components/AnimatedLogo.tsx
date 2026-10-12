import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface AnimatedLogoProps {
  size?: number;
  withSound?: boolean;
  showText?: boolean;
  className?: string;
}

export default function AnimatedLogo({ size = 120, withSound = true, showText = true, className = '' }: AnimatedLogoProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    if (!withSound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, start + duration);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Premium INSTA CHAT harmonic chord chime (E major / A major smooth tech chord)
      const now = ctx.currentTime;
      playTone(659.25, now, 1.2, 0.05); // E5
      playTone(830.61, now + 0.08, 1.1, 0.04); // G#5
      playTone(987.77, now + 0.16, 1.0, 0.04); // B5
      playTone(1318.51, now + 0.24, 1.4, 0.03); // E6 high shimmer
    } catch (e) {
      console.warn('Audio chime failed', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(playChime, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Background Pulse Glow */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-tr from-[#00c2ff]/30 via-[#3b82f6]/20 to-[#a855f7]/30 blur-2xl pointer-events-none"
        style={{ width: size * 1.4, height: size * 1.4 }}
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Floating Sparkles around logo */}
      <motion.div
        className="absolute -top-1 -right-1 text-cyan-300 pointer-events-none"
        animate={{
          scale: [0, 1.2, 1],
          rotate: [0, 45, 90],
          opacity: [0, 1, 0.8]
        }}
        transition={{ duration: 1.2, delay: 0.6 }}
      >
        <svg width={size * 0.2} height={size * 0.2} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute -bottom-1 -left-2 text-purple-400 pointer-events-none"
        animate={{
          scale: [0, 1, 0.8],
          rotate: [0, -30, -60],
          opacity: [0, 1, 0.7]
        }}
        transition={{ duration: 1.2, delay: 0.9 }}
      >
        <svg width={size * 0.16} height={size * 0.16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </motion.div>

      {/* Main Animated SVG Logo */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.8
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_8px_24px_rgba(0,194,255,0.45)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="animBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c2ff" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="animLensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <radialGradient id="animGlowRing" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00c2ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Chat Bubble */}
          <motion.path
            d="M 22 15 H 78 C 88.5 15 90 23.5 90 34 V 62 C 90 72.5 81.5 81 71 81 H 42 L 24 94 V 81 C 14 81 10 72.5 10 62 V 34 C 10 23.5 11.5 15 22 15 Z"
            fill="url(#animBubbleGrad)"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Sparkle lines top left */}
          <motion.path
            d="M 18 10 L 22 14 M 14 18 L 18 22"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />

          {/* White Camera Body Inside */}
          <motion.rect
            x="28"
            y="32"
            width="44"
            height="34"
            rx="10"
            fill="#ffffff"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 22 }}
          />

          {/* Camera Top Bump */}
          <motion.path
            d="M 40 32 L 44 26 H 56 L 60 32 Z"
            fill="#ffffff"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          />

          {/* Lens Outer Ring */}
          <motion.circle
            cx="50"
            cy="49"
            r="12"
            fill="url(#animLensGrad)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          />

          {/* Lens Inner Reflection */}
          <circle cx="50" cy="49" r="7" fill="#1e1b4b" />
          <motion.circle
            cx="47"
            cy="46"
            r="3"
            fill="#ffffff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8] }}
            transition={{ delay: 0.7 }}
          />

          {/* Flash Dot */}
          <motion.circle
            cx="64"
            cy="38"
            r="2.5"
            fill="#00c2ff"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ delay: 0.8 }}
          />
        </svg>
      </motion.div>

      {/* Brand Text under logo if enabled */}
      {showText && (
        <motion.div
          className="mt-6 text-center select-none"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-center tracking-tighter uppercase font-black text-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2ff] to-[#38bdf8]">
              INSTA
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#a855f7] to-[#ec4899] ml-1.5">
              CHAT
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
