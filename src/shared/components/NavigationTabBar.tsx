import React from 'react';
import { Home, Film, Clock, Users, User } from 'lucide-react';
import { triggerLightHaptic } from '../lib/haptics';

export type AppTab = 'home' | 'reels' | 'ponto' | 'society' | 'profile';

interface NavigationTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeTheme: {
    navBg?: string;
    accentColor: string;
  };
}

export default function NavigationTabBar({
  activeTab,
  onTabChange,
  activeTheme
}: NavigationTabBarProps) {
  const handleSelect = (tab: AppTab) => {
    triggerLightHaptic();
    onTabChange(tab);
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 border-t border-white/10 flex items-center justify-around px-4 z-[60] transition-all ${activeTheme.navBg || 'bg-[#0f172a]/95 backdrop-blur-xl'}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <button 
        type="button"
        onClick={() => handleSelect('home')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'home' ? 'scale-110 font-black' : 'text-white/30'}`}
        style={activeTab === 'home' ? { color: activeTheme.accentColor } : {}}
      >
        <Home size={22} style={activeTab === 'home' ? { color: activeTheme.accentColor } : {}} />
        <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
      </button>

      <button 
        type="button"
        onClick={() => handleSelect('reels')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'reels' ? 'scale-110 font-black' : 'text-white/30'}`}
        style={activeTab === 'reels' ? { color: activeTheme.accentColor } : {}}
      >
        <Film size={22} style={activeTab === 'reels' ? { color: activeTheme.accentColor } : {}} />
        <span className="text-[7px] font-black uppercase tracking-widest">Reels</span>
      </button>

      <button 
        type="button"
        onClick={() => handleSelect('ponto')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'ponto' ? 'scale-110 font-black' : 'text-white/30'}`}
        style={activeTab === 'ponto' ? { color: activeTheme.accentColor } : {}}
      >
        <div 
          className="p-3 rounded-full border-2 -mt-8 transition-all shadow-xl"
          style={activeTab === 'ponto' ? {
            borderColor: activeTheme.accentColor,
            backgroundColor: `${activeTheme.accentColor}20`,
            boxShadow: `0 0 20px ${activeTheme.accentColor}40`,
            color: activeTheme.accentColor
          } : {
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#ffffff'
          }}
        >
          <Clock size={24} />
        </div>
        <span className="text-[7px] font-black uppercase tracking-widest mt-1">Ponto</span>
      </button>

      <button 
        type="button"
        onClick={() => handleSelect('society')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'society' ? 'scale-110 font-black' : 'text-white/30'}`}
        style={activeTab === 'society' ? { color: activeTheme.accentColor } : {}}
      >
        <Users size={22} style={activeTab === 'society' ? { color: activeTheme.accentColor } : {}} />
        <span className="text-[7px] font-black uppercase tracking-widest">Equipa</span>
      </button>

      <button 
        type="button"
        onClick={() => handleSelect('profile')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'profile' ? 'scale-110 font-black' : 'text-white/30'}`}
        style={activeTab === 'profile' ? { color: activeTheme.accentColor } : {}}
      >
        <User size={22} style={activeTab === 'profile' ? { color: activeTheme.accentColor } : {}} />
        <span className="text-[7px] font-black uppercase tracking-widest">Perfil</span>
      </button>
    </nav>
  );
}
