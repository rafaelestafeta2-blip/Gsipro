import React, { useRef, useEffect } from 'react';
import { Message, GroupMessage, ReplyInfo } from '../../../shared/types';
import { AudioPlayer } from '../../../shared/components/AudioPlayer';
import CachedImage from '../../../shared/components/CachedImage';
import WeatherCardDisplay from './WeatherCardDisplay';
import { MapPin, CornerUpLeft, Trash2, Smile } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageListProps {
  messages: (Message | GroupMessage)[];
  currentUserId: string;
  onReplyTo?: (reply: ReplyInfo) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string, forEveryone: boolean) => void;
  onImageClick?: (url: string) => void;
  accentColor?: string;
}

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center text-white/30 text-xs">
          Nenhuma mensagem ainda. Envie uma mensagem para iniciar a conversa!
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const senderName = 'sender' in msg && msg.sender ? (msg.sender as any).full_name : msg.sender_name;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              {/* Sender name for group chats */}
              {!isMe && senderName && (
                <span className="text-[10px] font-bold text-[#d4af37] px-2 mb-1">
                  {senderName}
                </span>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] rounded-3xl p-3 shadow-md relative ${
                  isMe
                    ? 'bg-gradient-to-r from-[#d4af37]/20 to-[#f3e5ab]/10 border border-[#d4af37]/30 text-white rounded-br-sm'
                    : 'bg-[#1c2431] border border-white/5 text-white rounded-bl-sm'
                }`}
              >
                {/* Reply context */}
                {msg.reply_to && (
                  <div className="mb-2 p-2 rounded-xl bg-black/20 border-l-2 border-[#d4af37] text-xs">
                    <span className="text-[10px] font-bold text-[#d4af37] block">
                      {msg.reply_to.sender_name || 'Colega'}
                    </span>
                    <p className="text-white/70 truncate">{msg.reply_to.content}</p>
                  </div>
                )}

                {/* Weather card */}
                {msg.weather && (
                  <div className="mb-2">
                    <WeatherCardDisplay weather={msg.weather} />
                  </div>
                )}

                {/* Image / Sticker */}
                {(msg.type === 'image' || msg.media_url) && !msg.weather && (
                  <div
                    onClick={() => msg.media_url && onImageClick && onImageClick(msg.media_url)}
                    className="rounded-2xl overflow-hidden mb-2 cursor-pointer max-w-[280px]"
                  >
                    <CachedImage src={msg.media_url!} alt="Anexo" className="w-full object-cover max-h-64" />
                  </div>
                )}

                {/* Audio voice player */}
                {msg.type === 'audio' && msg.media_url && (
                  <div className="my-1 min-w-[240px]">
                    <AudioPlayer audioUrl={msg.media_url} isMe={isMe} />
                  </div>
                )}

                {/* Location card */}
                {msg.location && (
                  <a
                    href={`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl bg-black/20 text-[#d4af37] text-xs mb-1 hover:underline"
                  >
                    <MapPin size={16} />
                    <span>Abrir localização no Google Maps</span>
                  </a>
                )}

                {/* Text Content */}
                {msg.content && msg.type !== 'audio' && (
                  <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/40">
                  <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                </div>
              </div>

              {/* Action row (hover) */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 pt-1 text-white/40">
                {onReplyTo && (
                  <button
                    onClick={() => onReplyTo({ id: msg.id, content: msg.content, sender_name: isMe ? 'Você' : senderName })}
                    className="hover:text-white p-1"
                    title="Responder"
                  >
                    <CornerUpLeft size={12} />
                  </button>
                )}
                {onToggleReaction && (
                  <button
                    onClick={() => onToggleReaction(msg.id, '👍')}
                    className="hover:text-white p-1"
                    title="Reagir 👍"
                  >
                    👍
                  </button>
                )}
                {isMe && onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id, true)}
                    className="hover:text-red-400 p-1"
                    title="Apagar para todos"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
