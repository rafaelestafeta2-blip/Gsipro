import React, { useState } from 'react';
import { Profile } from '../../../shared/types';
import { Search, User } from 'lucide-react';
import CachedImage from '../../../shared/components/CachedImage';

interface DirectChatListProps {
  profiles: Profile[];
  currentUserId: string;
  onlineUsers: Map<string, any>;
  unreadCounts: Record<string, number>;
  onSelectUser: (user: Profile) => void;
  accentColor?: string;
}

export default function DirectChatList({
  profiles,
  currentUserId,
  onlineUsers,
  unreadCounts,
  onSelectUser,
  accentColor = '#d4af37'
}: DirectChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = profiles
    .filter(p => p.id !== currentUserId)
    .filter(p => (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                 (p.role || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar colegas ou cargos..."
            className="w-full bg-[#1c2431]/60 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37]/60"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-xs">
            Nenhum colega encontrado.
          </div>
        ) : (
          filtered.map(user => {
            const isOnline = onlineUsers.has(user.id);
            const unread = unreadCounts[user.id] || 0;

            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-[#1c2431] flex items-center justify-center">
                      {user.avatar_url ? (
                        <CachedImage src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-white/40" />
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0e17]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#d4af37] transition-colors">
                      {user.full_name || 'Colega GSI'}
                    </h4>
                    <p className="text-[10px] text-white/40 truncate">
                      {user.role || 'Oficial'} {user.current_obra ? `• ${user.current_obra}` : ''}
                    </p>
                  </div>
                </div>

                {unread > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black text-black flex-shrink-0 animate-pulse"
                    style={{ backgroundColor: accentColor }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
