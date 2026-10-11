import { useState, useEffect } from 'react';

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  badge?: string;
  isLight?: boolean;
  accentColor: string;
  secondaryColor: string;
  bgClass: string;
  cardBgClass: string;
  textClass: string;
  subtextClass: string;
  borderClass: string;
  primaryBtnClass: string;
  previewGradient: string;
  headerBg: string;
  navBg: string;
  styles: {
    bg: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    accent: string;
    accentGlow: string;
    nav: string;
    header: string;
  };
}

export const THEMES: AppTheme[] = [
  {
    id: 'instachat-cyan',
    name: 'InstaChat Signature',
    description: 'Gradiente Neon Ciano & Púrpura do Logo Oficial',
    badge: 'OFICIAL',
    accentColor: '#00c2ff',
    secondaryColor: '#a855f7',
    bgClass: 'bg-[#080d1a]',
    cardBgClass: 'bg-[#12192e]/80',
    textClass: 'text-white',
    subtextClass: 'text-cyan-200/50',
    borderClass: 'border-cyan-500/20',
    primaryBtnClass: 'bg-gradient-to-r from-[#00c2ff] to-[#a855f7] text-white shadow-lg shadow-cyan-500/25',
    previewGradient: 'from-[#00c2ff] via-[#3b82f6] to-[#a855f7]',
    headerBg: 'bg-[#080d1a]/90 backdrop-blur-xl border-cyan-500/10',
    navBg: 'bg-[#060a14]/95 backdrop-blur-2xl border-cyan-500/10',
    styles: {
      bg: '#080d1a',
      card: '#12192e',
      text: '#ffffff',
      subtext: 'rgba(165, 243, 252, 0.6)',
      border: 'rgba(6, 182, 212, 0.2)',
      accent: '#00c2ff',
      accentGlow: 'rgba(0, 194, 255, 0.3)',
      nav: '#060a14',
      header: '#080d1a'
    }
  },
  {
    id: 'laranja-social',
    name: 'Laranja Social Hub',
    description: 'Tema Coral Laranja & Branco Inspirado no Mockup Premium',
    badge: 'POPULAR',
    isLight: true,
    accentColor: '#f97316',
    secondaryColor: '#ff6b4a',
    bgClass: 'bg-[#f8f5f0]',
    cardBgClass: 'bg-white shadow-xl shadow-orange-950/5',
    textClass: 'text-slate-900',
    subtextClass: 'text-slate-500',
    borderClass: 'border-orange-200',
    primaryBtnClass: 'bg-gradient-to-r from-[#f97316] to-[#ff6b4a] text-white shadow-lg shadow-orange-500/30',
    previewGradient: 'from-[#ff6b4a] via-[#f97316] to-[#fb923c]',
    headerBg: 'bg-white/90 backdrop-blur-xl border-orange-200',
    navBg: 'bg-white/95 backdrop-blur-2xl border-orange-200',
    styles: {
      bg: '#f8f5f0',
      card: '#ffffff',
      text: '#0f172a',
      subtext: '#64748b',
      border: '#fed7aa',
      accent: '#f97316',
      accentGlow: 'rgba(249, 115, 22, 0.3)',
      nav: '#ffffff',
      header: '#ffffff'
    }
  },
  {
    id: 'ouro-escuro',
    name: 'Escuro & Ouro Imperial',
    description: 'Design Noturno Clássico com Acentos em Dourado 24K',
    badge: 'LUXO',
    accentColor: '#d4af37',
    secondaryColor: '#f59e0b',
    bgClass: 'bg-[#0a0e17]',
    cardBgClass: 'bg-[#1c2431]/70',
    textClass: 'text-white',
    subtextClass: 'text-white/40',
    borderClass: 'border-amber-500/20',
    primaryBtnClass: 'bg-[#d4af37] text-black shadow-lg shadow-amber-500/20 font-black',
    previewGradient: 'from-[#d4af37] via-[#f59e0b] to-[#b45309]',
    headerBg: 'bg-[#0a0e17]/90 backdrop-blur-xl border-white/5',
    navBg: 'bg-[#080b12]/95 backdrop-blur-2xl border-white/5',
    styles: {
      bg: '#0a0e17',
      card: '#1c2431',
      text: '#ffffff',
      subtext: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(212, 175, 55, 0.2)',
      accent: '#d4af37',
      accentGlow: 'rgba(212, 175, 55, 0.3)',
      nav: '#080b12',
      header: '#0a0e17'
    }
  },
  {
    id: 'verde-esmeralda',
    name: 'Verde Esmeralda Mint',
    description: 'Visual Futurista com Menta Neon e Esmeralda Profunda',
    badge: 'MINT',
    accentColor: '#10b981',
    secondaryColor: '#34d399',
    bgClass: 'bg-[#061410]',
    cardBgClass: 'bg-[#0f2820]/80',
    textClass: 'text-white',
    subtextClass: 'text-emerald-200/50',
    borderClass: 'border-emerald-500/20',
    primaryBtnClass: 'bg-gradient-to-r from-[#10b981] to-[#34d399] text-black font-black shadow-lg shadow-emerald-500/25',
    previewGradient: 'from-[#059669] via-[#10b981] to-[#34d399]',
    headerBg: 'bg-[#061410]/90 backdrop-blur-xl border-emerald-500/10',
    navBg: 'bg-[#040e0b]/95 backdrop-blur-2xl border-emerald-500/10',
    styles: {
      bg: '#061410',
      card: '#0f2820',
      text: '#ffffff',
      subtext: 'rgba(167, 243, 208, 0.5)',
      border: 'rgba(16, 185, 129, 0.2)',
      accent: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.3)',
      nav: '#040e0b',
      header: '#061410'
    }
  },
  {
    id: 'rosa-perola',
    name: 'Rose Gold & Magenta',
    description: 'Elegância Rosa Ouro com Acentos Vibrantes e Luxuosos',
    badge: 'DELUXE',
    accentColor: '#f43f5e',
    secondaryColor: '#ec4899',
    bgClass: 'bg-[#180b18]',
    cardBgClass: 'bg-[#2a1329]/80',
    textClass: 'text-white',
    subtextClass: 'text-rose-200/50',
    borderClass: 'border-rose-500/20',
    primaryBtnClass: 'bg-gradient-to-r from-[#f43f5e] to-[#ec4899] text-white font-black shadow-lg shadow-rose-500/25',
    previewGradient: 'from-[#e11d48] via-[#f43f5e] to-[#ec4899]',
    headerBg: 'bg-[#180b18]/90 backdrop-blur-xl border-rose-500/10',
    navBg: 'bg-[#120712]/95 backdrop-blur-2xl border-rose-500/10',
    styles: {
      bg: '#180b18',
      card: '#2a1329',
      text: '#ffffff',
      subtext: 'rgba(254, 205, 211, 0.5)',
      border: 'rgba(244, 63, 94, 0.2)',
      accent: '#f43f5e',
      accentGlow: 'rgba(244, 63, 94, 0.3)',
      nav: '#120712',
      header: '#180b18'
    }
  },
  {
    id: 'oled-midnight',
    name: 'Midnight Pure Black OLED',
    description: 'Preto Absoluto com Violeta Elétrico (Economia de Bateria)',
    badge: 'AMOLED',
    accentColor: '#8b5cf6',
    secondaryColor: '#a78bfa',
    bgClass: 'bg-black',
    cardBgClass: 'bg-[#0f0f13]',
    textClass: 'text-white',
    subtextClass: 'text-slate-400',
    borderClass: 'border-violet-500/20',
    primaryBtnClass: 'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white font-black shadow-lg shadow-violet-500/25',
    previewGradient: 'from-[#7c3aed] via-[#8b5cf6] to-[#c084fc]',
    headerBg: 'bg-black/90 backdrop-blur-xl border-white/10',
    navBg: 'bg-black/95 backdrop-blur-2xl border-white/10',
    styles: {
      bg: '#000000',
      card: '#0f0f13',
      text: '#ffffff',
      subtext: '#94a3b8',
      border: 'rgba(139, 92, 246, 0.25)',
      accent: '#8b5cf6',
      accentGlow: 'rgba(139, 92, 246, 0.35)',
      nav: '#000000',
      header: '#000000'
    }
  }
];

export function getStoredTheme(): AppTheme {
  try {
    const savedId = localStorage.getItem('instachat_active_theme');
    const found = THEMES.find(t => t.id === savedId);
    if (found) return found;
  } catch {}
  return THEMES[0]; // Default to InstaChat Signature Cyan
}

export function applyThemeToDOM(theme: AppTheme) {
  try {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    if (theme.isLight) {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }

    // Apply CSS Variables
    root.style.setProperty('--theme-bg', theme.styles.bg);
    root.style.setProperty('--theme-card', theme.styles.card);
    root.style.setProperty('--theme-text', theme.styles.text);
    root.style.setProperty('--theme-subtext', theme.styles.subtext);
    root.style.setProperty('--theme-border', theme.styles.border);
    root.style.setProperty('--theme-accent', theme.styles.accent);
    root.style.setProperty('--theme-accent-glow', theme.styles.accentGlow);

    // Set body style
    document.body.style.backgroundColor = theme.styles.bg;
    document.body.style.color = theme.styles.text;

    localStorage.setItem('instachat_active_theme', theme.id);
  } catch (err) {
    console.warn('[Theme] Error applying theme to DOM:', err);
  }
}

export function useAppTheme() {
  const [activeTheme, setActiveTheme] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    applyThemeToDOM(activeTheme);
  }, [activeTheme]);

  const changeTheme = (themeId: string) => {
    const target = THEMES.find(t => t.id === themeId);
    if (target) {
      setActiveTheme(target);
      applyThemeToDOM(target);
    }
  };

  return { activeTheme, changeTheme, availableThemes: THEMES };
}
