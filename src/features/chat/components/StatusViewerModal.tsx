import React from 'react';
import { X, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { UserStatus } from '../hooks/useStatusStories';
import CachedImage from '../../../shared/components/CachedImage';

interface StatusViewerModalProps {
  viewingGroup: {
    userId: string;
    userName: string;
    userAvatar?: string;
    statuses: UserStatus[];
  } | null;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onDeleteStatus?: (id: string) => void;
  currentUserId: string;
}

export default function StatusViewerModal({
  viewingGroup,
  currentIndex,
  onNext,
  onPrev,
  onClose,
  onDeleteStatus,
  currentUserId
}: StatusViewerModalProps) {
  if (!viewingGroup || viewingGroup.statuses.length === 0) return null;

  const currentStatus = viewingGroup.statuses[currentIndex];
  if (!currentStatus) return null;

  const isAuthor = currentStatus.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md">
      {/* Top progress indicators */}
      <div className="w-full flex items-center gap-1.5 pt-2">
        {viewingGroup.statuses.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-[#d4af37] transition-all duration-300 ${
                idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header with user info */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d4af37] bg-[#1c2431] flex items-center justify-center">
            {viewingGroup.userAvatar ? (
              <CachedImage src={viewingGroup.userAvatar} alt={viewingGroup.userName} className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-white/40" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{viewingGroup.userName}</h4>
            <span className="text-[10px] text-white/50">
              {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthor && onDeleteStatus && (
            <button
              onClick={() => onDeleteStatus(currentStatus.id)}
              className="p-2 text-white/50 hover:text-red-400 transition-colors"
              title="Apagar este status"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative my-4">
        {/* Navigation tap targets */}
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/60 hover:text-white disabled:opacity-0"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === viewingGroup.statuses.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/60 hover:text-white disabled:opacity-0"
        >
          <ChevronRight size={24} />
        </button>

        {currentStatus.type === 'image' && currentStatus.mediaUrl ? (
          <div className="max-w-md w-full max-h-[70vh] flex flex-col items-center">
            <img
              src={currentStatus.mediaUrl}
              alt="Status"
              className="max-h-[60vh] object-contain rounded-2xl shadow-2xl"
            />
            {currentStatus.caption && (
              <p className="text-sm font-bold text-white text-center mt-3 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md">
                {currentStatus.caption}
              </p>
            )}
          </div>
        ) : (
          <div
            className={`w-full max-w-sm h-80 rounded-3xl bg-gradient-to-br ${
              currentStatus.background || 'from-amber-500 to-orange-600'
            } p-6 flex items-center justify-center text-center shadow-2xl`}
          >
            <p className="text-lg font-black text-white leading-relaxed">
              {currentStatus.content}
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-white/30 text-[10px]">
        Toque nas laterais para avançar ou voltar
      </div>
    </div>
  );
}
