import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, GroupMessage, ReplyInfo } from '../../../shared/types';
import { AudioPlayer } from '../../../shared/components/AudioPlayer';
import CachedImage from '../../../shared/components/CachedImage';
import WeatherCardDisplay from './WeatherCardDisplay';
import { 
  MapPin, 
  CornerUpLeft, 
  BarChart3, 
  CheckCircle2, 
  Check, 
  CheckCheck, 
  Trash2, 
  Smile, 
  X,
  MoreVertical,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { CHAT_WALLPAPERS } from '../../../shared/lib/chatWallpapers';
import { triggerLightHaptic, triggerMediumHaptic, triggerWarningHaptic } from '../../../shared/lib/haptics';

interface ChatMessageListProps {
  messages: (Message | GroupMessage)[];
  currentUserId: string;
  onReplyTo?: (reply: ReplyInfo) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string, forEveryone: boolean) => void;
  onImageClick?: (url: string) => void;
  accentColor?: string;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👷'];

export default function ChatMessageList({
  messages,
  currentUserId,
  onReplyTo,
  onToggleReaction,
  onDeleteMessage,
  onImageClick,
  accentColor = '#d4af37'
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedMsgForMenu, setSelectedMsgForMenu] = useState<(Message | GroupMessage) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleMessageLongPress = (msg: Message | GroupMessage) => {
    triggerMediumHaptic();
    setSelectedMsgForMenu(msg);
  };

  const handleSelectReaction = (msgId: string, emoji: string) => {
    triggerLightHaptic();
    if (onToggleReaction) onToggleReaction(msgId, emoji);
    setSelectedMsgForMenu(null);
  };

  const handleDeleteMsg = (msgId: string, forEveryone: boolean) => {
    if (forEveryone) triggerWarningHaptic();
    else triggerLightHaptic();
    if (onDeleteMessage) onDeleteMessage(msgId, forEveryone);
    setSelectedMsgForMenu(null);
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-3 relative transition-all"
      style={{
        backgroundImage: `url("${CHAT_WALLPAPERS.classic}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '280px',
        backgroundColor: '#0a0e17'
      }}
    >
      {/* Dark overlay for optimal readability */}
      <div className="absolute inset-0 bg-[#0a0e17]/85 pointer-events-none z-0" />

      <div className="relative z-10 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full py-20 flex flex-col items-center justify-center text-center text-white/40 text-xs">
            <span className="p-3 rounded-full bg-white/5 border border-white/10 mb-2">💬</span>
            <p>Nenhuma mensagem ainda. Envie uma mensagem para iniciar a conversa!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const senderName = 'sender' in msg && msg.sender ? (msg.sender as any).full_name : msg.sender_name;
            const senderAvatar = 'sender' in msg && msg.sender ? (msg.sender as any).avatar_url : msg.sender_avatar;

            // Compute total reactions
            const reactionsMap = msg.reactions || {};
            const reactionEntries = Object.entries(reactionsMap).filter(([_, users]) => users.length > 0);

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} group relative`}
              >
                {/* Avatar for incoming messages */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-[#1c2431] flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#d4af37] shadow-md mb-1">
                    {senderAvatar?.trim() ? (
                      <img src={senderAvatar} alt={senderName || 'Colega'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(senderName || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[82%]`}>
                  {/* Sender Name in Groups */}
                  {!isMe && senderName && (
                    <span className="text-[10px] font-black text-[#d4af37] px-2 mb-0.5">
                      {senderName}
                    </span>
                  )}

                  {/* Message Bubble Container */}
                  <motion.div
                    whileTap={{ scale: 0.99 }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleMessageLongPress(msg);
                    }}
                    className={`rounded-3xl p-3 shadow-md relative ${
                      isMe
                        ? 'bg-gradient-to-r from-[#d4af37]/20 to-[#f3e5ab]/10 border border-[#d4af37]/30 text-white rounded-br-sm'
                        : 'bg-[#1c2431] border border-white/5 text-white rounded-bl-sm'
                    }`}
                  >
                    {/* Reply Context */}
                    {msg.reply_to && (
                      <div className="mb-2 p-2 rounded-xl bg-black/30 border-l-2 border-[#d4af37] text-xs">
                        <span className="text-[10px] font-bold text-[#d4af37] block">
                          {msg.reply_to.sender_name || 'Colega'}
                        </span>
                        <p className="text-white/70 truncate">{msg.reply_to.content}</p>
                      </div>
                    )}

                    {/* Weather Widget */}
                    {msg.weather && (
                      <div className="mb-2">
                        <WeatherCardDisplay weather={msg.weather} />
                      </div>
                    )}

                    {/* Image or Video Media */}
                    {msg.media_url && !msg.weather && (
                      <div 
                        onClick={() => onImageClick && onImageClick(msg.media_url!)}
                        className="mb-2 rounded-2xl overflow-hidden cursor-pointer border border-white/10 max-h-64"
                      >
                        <CachedImage
                          src={msg.media_url}
                          alt="Anexo de Mídia"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Poll / Sondagem */}
                    {msg.poll && (
                      <div className="my-2 p-3 rounded-2xl bg-black/30 border border-white/10 space-y-2 min-w-[220px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37]">
                          <BarChart3 size={14} />
                          <span>{msg.poll.question}</span>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          {msg.poll.options.map((opt) => {
                            const totalVotes = msg.poll?.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;
                            const voteCount = opt.votes?.length || 0;
                            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                            const hasVoted = opt.votes?.includes(currentUserId);

                            return (
                              <div
                                key={opt.id}
                                className={`w-full text-left p-2 rounded-xl border text-xs relative overflow-hidden transition-all ${
                                  hasVoted ? 'border-[#d4af37] bg-[#d4af37]/15' : 'border-white/10 bg-white/5'
                                }`}
                              >
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-[#d4af37]/20 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex justify-between items-center">
                                  <span className="font-medium text-white flex items-center gap-1">
                                    {hasVoted && <CheckCircle2 size={12} className="text-[#d4af37]" />}
                                    {opt.text}
                                  </span>
                                  <span className="text-[10px] text-white/60 font-bold">{voteCount} ({pct}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Audio Voice Player */}
                    {msg.type === 'audio' && msg.media_url && (
                      <div className="my-1 min-w-[240px]">
                        <AudioPlayer audioUrl={msg.media_url} isMe={isMe} />
                      </div>
                    )}

                    {/* Location Card */}
                    {msg.location && (
                      <a
                        href={`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/30 border border-white/10 text-[#d4af37] text-xs mb-1 hover:underline"
                      >
                        <MapPin size={16} />
                        <span>Ver localização no Google Maps</span>
                      </a>
                    )}

                    {/* Text Content */}
                    {msg.content && msg.type !== 'audio' && (
                      <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                    )}

                    {/* Timestamp & Read Receipts */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/40">
                      <span>{format(new Date(msg.created_at || Date.now()), 'HH:mm')}</span>
                      {isMe && (
                        <span>
                          {msg.is_read ? (
                            <CheckCheck size={13} className="text-[#d4af37]" title="Lido" />
                          ) : (
                            <CheckCheck size={13} className="text-white/40" title="Entregue" />
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Reaction Badges Below Bubble */}
                  {reactionEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reactionEntries.map(([emoji, users]) => {
                        const userReacted = users.includes(currentUserId);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all cursor-pointer ${
                              userReacted
                                ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37] font-black'
                                : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{users.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* More Action Trigger Button */}
                <button
                  type="button"
                  onClick={() => handleMessageLongPress(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-white cursor-pointer"
                  title="Opções da mensagem"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Long-Press Action Sheet Modal */}
      <AnimatePresence>
        {selectedMsgForMenu && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-sm bg-[#0a0e17] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedMsgForMenu(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>

              <h4 className="text-xs font-black uppercase text-[#d4af37] tracking-wider">
                Opções da Mensagem
              </h4>

              {/* Emoji Reactions Bar */}
              <div className="flex items-center justify-between gap-1 p-2 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                {QUICK_REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectReaction(selectedMsgForMenu.id, emoji)}
                    className="p-2 hover:bg-white/10 rounded-xl text-lg hover:scale-125 transition-all cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onReplyTo && (
                  <button
                    type="button"
                    onClick={() => {
                      const isMe = selectedMsgForMenu.sender_id === currentUserId;
                      const senderName = 'sender' in selectedMsgForMenu && selectedMsgForMenu.sender ? (selectedMsgForMenu.sender as any).full_name : selectedMsgForMenu.sender_name;
                      onReplyTo({
                        id: selectedMsgForMenu.id,
                        content: selectedMsgForMenu.content,
                        sender_name: isMe ? 'Você' : senderName
                      });
                      setSelectedMsgForMenu(null);
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <CornerUpLeft size={16} className="text-[#d4af37]" />
                    <span>Responder a esta mensagem</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteMsg(selectedMsgForMenu.id, false)}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold flex items-center gap-3 transition-all cursor-pointer"
                >
                  <Trash2 size={16} className="text-amber-400" />
                  <span>Apagar para mim</span>
                </button>

                {selectedMsgForMenu.sender_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMsg(selectedMsgForMenu.id, true)}
                    className="w-full p-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} className="text-rose-400" />
                    <span>Apagar para todos</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
