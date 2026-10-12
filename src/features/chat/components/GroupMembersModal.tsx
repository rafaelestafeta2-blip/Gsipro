import React from 'react';
import { X, Users, Shield, User, LogOut } from 'lucide-react';
import { ChatGroup, GroupMember } from '../../../shared/types';
import CachedImage from '../../../shared/components/CachedImage';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatGroup | null;
  members: GroupMember[];
  currentUserId: string;
  onLeaveGroup?: () => void;
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  group,
  members,
  currentUserId,
  onLeaveGroup
}: GroupMembersModalProps) {
  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0e17] border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Group header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#d4af37]/30 bg-[#1c2431]">
            <CachedImage src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">{group.name}</h3>
            <p className="text-xs text-white/50">{group.description}</p>
            <span className="text-[10px] text-[#d4af37] font-bold block mt-1">
              {members.length} Participantes
            </span>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {members.map(member => {
            const isMe = member.user_id === currentUserId;
            const profile = member.profile;

            return (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-[#1c2431]/40 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0a0e17] border border-white/10 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <CachedImage src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-white/40" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {profile?.full_name || 'Colega'} {isMe ? '(Você)' : ''}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {profile?.role || 'Oficial'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {member.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full border border-[#d4af37]/20">
                      <Shield size={10} />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="text-[9px] text-white/40 uppercase tracking-wider">
                      Membro
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave group */}
        {onLeaveGroup && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={onLeaveGroup}
              className="w-full py-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <LogOut size={16} />
              <span>Sair do Grupo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
