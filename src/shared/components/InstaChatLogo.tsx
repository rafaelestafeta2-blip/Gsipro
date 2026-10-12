import React from 'react';

interface InstaChatLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function InstaChatIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,194,255,0.4)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c2ff" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <radialGradient id="glassShine" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Chat Bubble */}
        <path 
          d="M 22 15 H 78 C 88.5 15 90 23.5 90 34 V 62 C 90 72.5 81.5 81 71 81 H 42 L 24 94 V 81 C 14 81 10 72.5 10 62 V 34 C 10 23.5 11.5 15 22 15 Z" 
          fill="url(#bubbleGrad)" 
        />

        {/* Sparkle lines top left */}
        <path d="M 18 10 L 22 14 M 14 18 L 18 22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

        {/* White Camera Body Inside */}
        <rect x="28" y="32" width="44" height="34" rx="10" fill="#ffffff" />
        
        {/* Camera Top Bump */}
        <path d="M 40 32 L 44 26 H 56 L 60 32 Z" fill="#ffffff" />

        {/* Lens Outer Ring */}
        <circle cx="50" cy="49" r="12" fill="url(#lensGrad)" />

        {/* Lens Inner Reflection */}
        <circle cx="50" cy="49" r="7" fill="#1e1b4b" />
        <circle cx="47" cy="46" r="3" fill="#ffffff" opacity="0.9" />

        {/* Small Flash Dot */}
        <circle cx="64" cy="38" r="2.5" fill="#3b82f6" />
      </svg>
    </div>
  );
}

export default function InstaChatLogo({
  className = '',
  size = 'md',
  showText = true,
  layout = 'horizontal'
}: InstaChatLogoProps) {
  const iconSizes = {
    sm: 24,
    md: 36,
    lg: 48,
    xl: 64
  };

  const textClasses = {
    sm: 'text-sm font-black tracking-tight',
    md: 'text-xl font-black tracking-tighter',
    lg: 'text-2xl font-black tracking-tighter',
    xl: 'text-4xl font-black tracking-tighter'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${layout === 'vertical' ? 'flex-col text-center' : 'flex-row'} ${className}`}>
      <InstaChatIcon size={iconSizes[size]} />
      
      {showText && (
        <div className={`flex items-center uppercase ${textClasses[size]}`}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2ff] to-[#38bdf8] drop-shadow-sm font-black">
            INSTA
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#a855f7] to-[#ec4899] font-black ml-1">
            CHAT
          </span>
        </div>
      )}
    </div>
  );
}
