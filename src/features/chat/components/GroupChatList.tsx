import React from 'react';
import { ChatGroup } from '../../../shared/types';
import { Users, Plus, Lock } from 'lucide-react';
import CachedImage from '../../../shared/components/CachedImage';

interface GroupChatListProps {
  groups: ChatGroup[];
  groupUnreadCounts: Record<string, number>;
  onSelectGroup: (group: ChatGroup) => void;
  onCreateGroupClick: () => void;
  accentColor?: string;
}

export default function GroupChatList({
  groups,
  groupUnreadCounts,
  onSelectGroup,
  onCreateGroupClick,
  accentColor = '#d4af37'
}: GroupChatListProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top action */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
          Grupos de Trabalho
        </span>
        <button
          onClick={onCreateGroupClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-bold hover:bg-[#d4af37]/30 transition-all"
        >
          <Plus size={14} />
          <span>Criar Grupo</span>
        </button>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
        {groups.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-xs">
            Nenhum grupo ativo. Crie um grupo para começar a conversar em equipe!
          </div>
        ) : (
          groups.map(group => {
            const unread = groupUnreadCounts[group.id] || 0;

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-[#1c2431] flex items-center justify-center">
                      {group.cover_url ? (
                        <CachedImage src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={20} className="text-white/40" />
                      )}
                    </div>
                    {group.is_private && (
                      <div className="absolute top-0 right-0 p-0.5 bg-[#d4af37] rounded-bl text-black">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#d4af37] transition-colors">
                      {group.name}
                    </h4>
                    <p className="text-[10px] text-white/40 truncate">
                      {group.description || `${group.member_count || 1} membros`}
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
