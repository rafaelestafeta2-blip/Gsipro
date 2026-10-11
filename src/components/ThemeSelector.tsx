import React from 'react';
import { motion } from 'motion/react';
import { THEMES, AppTheme, useAppTheme } from '../lib/theme';
import { Check, Sparkles, Palette, Sun, Moon, Shield } from 'lucide-react';
import { triggerSuccessHaptic, triggerLightHaptic } from '../lib/haptics';

interface ThemeSelectorProps {
  currentThemeId?: string;
  onThemeSelect?: (themeId: string) => void;
}

export default function ThemeSelector({ currentThemeId, onThemeSelect }: ThemeSelectorProps) {
  const { activeTheme, changeTheme, availableThemes } = useAppTheme();
  const selectedId = currentThemeId || activeTheme.id;

  const handleSelect = (theme: AppTheme) => {
    triggerLightHaptic();
    changeTheme(theme.id);
    if (onThemeSelect) {
      onThemeSelect(theme.id);
    }
    triggerSuccessHaptic();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#00c2ff]/20 to-[#a855f7]/20 border border-cyan-500/20 text-[#00c2ff]">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-current">
              Temas & Cores do Perfil Premium
            </h3>
            <p className="text-[10px] opacity-60 font-medium">
              Personalize o aplicativo com paletas exclusivas de alta performance
            </p>
          </div>
        </div>
        <span className="bg-gradient-to-r from-[#00c2ff] to-[#a855f7] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-cyan-500/20">
          PRO
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableThemes.map((theme) => {
          const isSelected = selectedId === theme.id;

          return (
            <motion.div
              key={theme.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(theme)}
              className={`relative rounded-3xl p-4 cursor-pointer transition-all border-2 overflow-hidden ${
                isSelected 
                  ? 'border-[#00c2ff] bg-cyan-500/10 shadow-xl shadow-cyan-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              {/* Badge top right */}
              {theme.badge && (
                <div className="absolute top-3 right-3 z-10">
                  <span 
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm ${
                      theme.id === 'laranja-social'
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-white/10 text-white border-white/20 backdrop-blur-md'
                    }`}
                  >
                    {theme.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                {/* Theme Color Preview Circle */}
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${theme.previewGradient} flex items-center justify-center shadow-md p-0.5`}>
                  {isSelected ? (
                    <div className="w-full h-full rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                      <Check size={18} className="stroke-[3]" />
                    </div>
                  ) : (
                    <Sparkles size={16} className="text-white opacity-80" />
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-current flex items-center gap-1.5">
                    {theme.name}
                    {theme.isLight && <Sun size={12} className="text-amber-500" />}
                  </h4>
                  <p className="text-[9px] opacity-60 font-medium line-clamp-1">
                    {theme.description}
                  </p>
                </div>
              </div>

              {/* Mini UI Preview Box */}
              <div 
                className="rounded-2xl p-3 border space-y-2 transition-all"
                style={{
                  backgroundColor: theme.styles.bg,
                  borderColor: theme.styles.border,
                  color: theme.styles.text
                }}
              >
                {/* Header preview line */}
                <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme.styles.border }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.styles.accent }} />
                    <span className="text-[8px] font-black tracking-wider uppercase" style={{ color: theme.styles.text }}>
                      {theme.id === 'laranja-social' ? 'Social Hub - Laranja' : 'INSTA CHAT'}
                    </span>
                  </div>
                  <div className="w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: theme.styles.text }} />
                </div>

                {/* Card preview box */}
                <div 
                  className="p-2 rounded-xl border flex items-center gap-2"
                  style={{
                    backgroundColor: theme.styles.card,
                    borderColor: theme.styles.border
                  }}
                >
                  <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: theme.styles.accent }} />
                  <div className="flex-1 min-w-0">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: theme.styles.accent }} />
                    <div className="w-16 h-1 rounded-full mt-1 opacity-40" style={{ backgroundColor: theme.styles.text }} />
                  </div>
                  <div className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: theme.styles.accent, color: theme.isLight ? '#ffffff' : '#000000' }}>
                    PRO
                  </div>
                </div>
              </div>

              {/* Selection status footer */}
              {isSelected && (
                <div className="mt-3 flex items-center justify-between text-[10px] font-black text-[#00c2ff]">
                  <span className="uppercase tracking-widest flex items-center gap-1">
                    <Check size={12} /> Ativo no Aparelho
                  </span>
                  <span className="text-[8px] bg-[#00c2ff]/10 px-2 py-0.5 rounded-full border border-[#00c2ff]/20">
                    Sincronizado
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
