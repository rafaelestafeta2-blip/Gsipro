import React from 'react';
import { UserStatus } from '../hooks/useStatusStories';
import { Plus, User, Eye, Trash2 } from 'lucide-react';
import CachedImage from '../../../shared/components/CachedImage';

interface StatusTabProps {
  statuses: UserStatus[];
  currentUserId: string;
  onOpenCreateStatus: () => void;
  onViewStatusGroup: (group: { userId: string; userName: string; userAvatar?: string; statuses: UserStatus[] }) => void;
  onDeleteStatus: (id: string) => void;
  accentColor?: string;
}

export default function StatusTab({
  statuses,
  currentUserId,
  onOpenCreateStatus,
  onViewStatusGroup,
  onDeleteStatus,
  accentColor = '#d4af37'
}: StatusTabProps) {
  const myStatuses = statuses.filter(s => s.userId === currentUserId);
  const otherStatuses = statuses.filter(s => s.userId !== currentUserId);

  // Group other statuses by user
  const groupedByOtherUser = otherStatuses.reduce<Record<string, UserStatus[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-6">
      {/* My Status Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-white/50">
            Meu Status
          </span>
          <button
            onClick={onOpenCreateStatus}
            className="flex items-center gap-1 text-xs font-bold text-[#d4af37] hover:underline"
          >
            <Plus size={14} />
            <span>Novo</span>
          </button>
        </div>

        <div className="p-3 bg-[#1c2431]/60 border border-white/5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full p-0.5 border-2 ${myStatuses.length > 0 ? 'border-[#d4af37]' : 'border-dashed border-white/20'} flex items-center justify-center`}
              >
                <div className="w-full h-full rounded-full bg-[#0a0e17] overflow-hidden flex items-center justify-center">
                  <User size={20} className="text-white/40" />
                </div>
              </div>
              <button
                onClick={onOpenCreateStatus}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-lg"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white">Meu Status</h4>
              <p className="text-[10px] text-white/40">
                {myStatuses.length > 0
                  ? `${myStatuses.length} actualizações nas últimas 24h`
                  : 'Toque para partilhar fotos ou avisos de obra'}
              </p>
            </div>
          </div>

          {myStatuses.length > 0 && (
            <button
              onClick={() => onViewStatusGroup({
                userId: currentUserId,
                userName: 'Você',
                statuses: myStatuses
              })}
              className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 text-[#d4af37] text-xs font-bold"
            >
              Ver
            </button>
          )}
        </div>
      </div>

      {/* Others Status Section */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-white/50 block mb-3">
          Actualizações Recentes ({Object.keys(groupedByOtherUser).length})
        </span>

        {Object.keys(groupedByOtherUser).length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs bg-[#1c2431]/30 rounded-2xl border border-white/5">
            Nenhuma actualização recente de colegas.
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedByOtherUser).map(([userId, userSts]) => {
              const latest = userSts[0];
              return (
                <button
                  key={userId}
                  onClick={() => onViewStatusGroup({
                    userId,
                    userName: latest.userName,
                    userAvatar: latest.userAvatar,
                    statuses: userSts
                  })}
                  className="w-full p-3 rounded-2xl bg-[#1c2431]/40 border border-white/5 flex items-center gap-3 hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full p-0.5 border-2 border-[#d4af37] flex-shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0e17] flex items-center justify-center">
                      {latest.userAvatar ? (
                        <CachedImage src={latest.userAvatar} alt={latest.userName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-white/40" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{latest.userName}</h4>
                    <p className="text-[10px] text-white/40 truncate">
                      {new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {userSts.length} novo(s)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
