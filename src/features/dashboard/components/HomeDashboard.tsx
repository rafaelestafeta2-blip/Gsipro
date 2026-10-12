import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Profile } from '../../../shared/types';
import AnnouncementBoard from '../../social/components/AnnouncementBoard';
import SocialFeed from '../../social/components/SocialFeed';

interface HomeDashboardProps {
  key?: string;
  profile: Profile | null;
  userName: string;
  userRole: string;
  userId: string;
  stats: {
    level: number;
    rankName: string;
    xp: number;
    progress: number;
  };
  activeTheme: any;
}

export default function HomeDashboard({
  profile,
  userName,
  userRole,
  userId,
  stats,
  activeTheme
}: HomeDashboardProps) {
  return (
    <motion.div 
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* User Profile Card */}
      <div 
        className={`border rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-4 shadow-2xl relative overflow-hidden group transition-all ${activeTheme.cardBgClass} ${activeTheme.borderClass}`}
      >
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ background: `linear-gradient(to right, transparent, ${activeTheme.accentColor}, transparent)` }}
        />
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full border-[3px] p-1 shadow-2xl"
            style={{ borderColor: activeTheme.accentColor }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border border-white/10">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt={userName} />
              ) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/20 text-3xl font-black">
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
          </div>
          <div 
            className="absolute -bottom-1 -right-1 w-6 h-6 border-4 border-[#1c2431] rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: activeTheme.accentColor }}
          >
            <TrendingUp size={10} className="text-black" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{userName || 'Usuário'}</h2>
            <span 
              className="text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm"
              style={{ backgroundColor: activeTheme.accentColor }}
            >
              NV {stats.level}
            </span>
          </div>
          <div 
            className="rounded-full px-4 py-1 inline-block border"
            style={{ 
              backgroundColor: `${activeTheme.accentColor}18`, 
              borderColor: `${activeTheme.accentColor}35`,
              color: activeTheme.accentColor
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest">{stats.rankName}</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="w-full pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">XP Progress</p>
              <p className="text-[9px] font-black" style={{ color: activeTheme.accentColor }}>
                {stats.xp} / {(stats.level + 1) * 1000} XP
              </p>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to right, ${activeTheme.accentColor}, ${activeTheme.secondaryColor})` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full border-[3px] border-r-transparent animate-[spin_4s_linear_infinite] flex items-center justify-center"
                style={{ borderColor: activeTheme.accentColor, borderRightColor: 'transparent' }}
              >
                <div 
                  className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-[8px] font-black"
                  style={{ color: activeTheme.accentColor }}
                >
                  {Math.floor(stats.progress)}%
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Carreira Profissional</p>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Patente: {stats.rankName} | Total XP: {stats.xp}</p>
              </div>
            </div>
            <TrendingUp size={24} style={{ color: activeTheme.accentColor }} className="opacity-60" />
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <AnnouncementBoard 
        isAdmin={profile?.is_admin || false} 
        userId={userId}
        userName={userName}
      />

      {/* Social Feed Section */}
      <SocialFeed 
        currentUserId={userId}
        userName={userName}
        userRole={userRole}
        userAvatar={profile?.avatar_url}
        isAdmin={profile?.is_admin || false}
      />
    </motion.div>
  );
}
