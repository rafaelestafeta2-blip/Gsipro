import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, TimeEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, HardHat, Phone, Calendar, Search, Plus, Star, Briefcase, Home, MapPin, Users, MessageSquare } from 'lucide-react';
import { getGamificationStats } from '../lib/gamification';
import Messenger from './Messenger';
import ProfileView from './ProfileView';

export default function Society({ 
  isDarkMode = true, 
  onlineUsers = new Map(),
  currentUserId = '',
  userName = '',
  userAvatar = '',
  onToggleImmersive,
  onOpenMessenger
}: { 
  isDarkMode?: boolean,
  onlineUsers?: Map<string, any>,
  currentUserId?: string,
  userName?: string,
  userAvatar?: string,
  onToggleImmersive?: (isOpen: boolean) => void,
  onOpenMessenger?: (tab?: 'direct' | 'groups', userId?: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'team' | 'groups'>('team');
  const [profiles, setProfiles] = useState<(Profile & { stats?: any, todayEntry?: TimeEntry })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [workerEntries, setWorkerEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'team') {
      fetchProfiles();
    }
  }, [activeTab]);

  const fetchProfiles = async () => {
    setLoading(true);
    const now = new Date();
    
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (profilesData) {
      // Fetch stats (all entries count) and today's entry for each profile
      const profilesWithData = await Promise.all(profilesData.map(async (profile) => {
        // Count entries for XP
        const { count } = await supabase
          .from('time_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        // Get today's entry
        const { data: todayData } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', profile.id)
          .eq('day', now.getDate())
          .eq('month', now.getMonth())
          .eq('year', now.getFullYear())
          .single();

        return {
          ...profile,
          stats: getGamificationStats(count || 0, profile.role),
          todayEntry: todayData || undefined
        };
      }));

      setProfiles(profilesWithData);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchWorkerDetails = async (profile: Profile) => {
    setSelectedProfile(profile);
    const now = new Date();
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('month', now.getMonth())
      .eq('year', now.getFullYear())
      .order('day', { ascending: false });
    
    if (data) setWorkerEntries(data);
  };

  return (
    <div className="space-y-8 pb-10 h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex bg-[#1c2431]/60 p-1.5 rounded-2xl border border-white/5 mx-2">
        <button 
          onClick={() => setActiveTab('team')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'team' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <Users size={14} /> Equipa
        </button>
        <button 
          onClick={() => {
            if (onOpenMessenger) {
              onOpenMessenger('groups');
            } else {
              setActiveTab('groups');
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'groups' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <MessageSquare size={14} /> Grupos
        </button>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'team' ? (
            <motion.div 
              key="team-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8 pb-16"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Minha Equipe <span className="text-[10px] text-white/40 font-normal ml-2 tracking-widest">(Em Tempo Real)</span></h2>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar colaborador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1c2431]/50 border border-white/5 text-white placeholder:text-white/20 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-[#d4af37] transition-all shadow-xl"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredProfiles.map((profile, pIdx) => (
                    <motion.div
                      key={profile.id ? `soc-prof-${profile.id}-${pIdx}` : `soc-prof-idx-${pIdx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => fetchWorkerDetails(profile)}
                      className="bg-[#1c2431]/60 border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 group cursor-pointer hover:bg-[#1c2431]/80 transition-all shadow-lg"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-[#d4af37]/30 overflow-hidden shadow-lg group-hover:border-[#d4af37] transition-all">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#0a0e17] flex items-center justify-center"><User className="text-white/20" size={24} /></div>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-[#1c2431] rounded-full shadow-lg transition-colors duration-500 ${onlineUsers.has(profile.id) ? 'bg-green-500' : 'bg-slate-700 opacity-50'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-white truncate">{profile.full_name}</h3>
                          {profile.stats?.level >= 5 && <span className="bg-[#d4af37] text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Elite</span>}
                        </div>
                        <p className="text-[#d4af37] font-black text-[9px] uppercase tracking-widest mt-0.5">{profile.stats?.rankName || profile.role} • Nível {profile.stats?.level || 0}</p>
                        
                        {profile.todayEntry ? (
                          <p className="text-green-400 text-[9px] font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Trabalhando • {profile.todayEntry.obra} • {profile.todayEntry.hours}h
                          </p>
                        ) : (
                          <p className="text-white/20 text-[9px] font-bold mt-1 uppercase tracking-tight italic">Fora de Serviço</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-white/20">
                          <div className="flex items-center gap-1">
                            <Phone size={10} className="text-[#d4af37]" />
                            <span className="text-[8px] font-black text-white/40">{profile.phone || 'Sem contacto'}</span>
                          </div>
                          {profile.location_city && (
                            <div className="flex items-center gap-1">
                              <Home size={10} className="text-[#d4af37]" />
                              <span className="text-[8px] font-black text-white/40">{profile.location_city}</span>
                            </div>
                          )}
                          {profile.current_obra && (
                            <div className="flex items-center gap-1">
                              <Briefcase size={10} className="text-[#d4af37]" />
                              <span className="text-[8px] font-black text-white/40">{profile.current_obra}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <div className="py-24 text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Nenhum colaborador encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="groups-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full min-h-[580px]"
            >
              <Messenger 
                isOpen={true}
                embedded={true}
                initialTab="groups"
                currentUserId={currentUserId} 
                userName={userName} 
                userAvatar={userAvatar}
                onlineUsers={onlineUsers}
                onClose={() => setActiveTab('team')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Premium Instagram-Style Profile View when clicking a colleague */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[120] bg-[#0a0e17] overflow-y-auto p-4 sm:p-6"
          >
            <ProfileView 
              userId={selectedProfile.id} 
              currentUserId={currentUserId}
              onBack={() => setSelectedProfile(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
