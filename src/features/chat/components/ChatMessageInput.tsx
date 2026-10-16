import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Square, 
  Camera, 
  Smile, 
  Paperclip, 
  MapPin, 
  Sun, 
  X, 
  Loader2,
  BarChart3,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { ReplyInfo, WeatherData, PollData } from '../../../shared/types';
import { UniversalAudioRecorder } from '../../../shared/lib/audioRecorder';
import { captureNativePhoto } from '../../../shared/lib/cameraService';
import { getCurrentLocation } from '../../../shared/lib/locationService';
import { getWeatherByCoordinates } from '../../../shared/services/weatherService';
import { triggerLightHaptic, triggerMediumHaptic } from '../../../shared/lib/haptics';
import { showGlobalToast } from '../../../shared/lib/ToastContext';
import { ANIMATED_STICKERS_PACKS } from '../../../data/animatedStickers';
import CreatePollModal from './CreatePollModal';

interface ChatMessageInputProps {
  onSendMessage: (
    content: string, 
    type?: any, 
    mediaUrl?: string, 
    extraMeta?: any
  ) => void;
  onTyping?: () => void;
  replyTo?: ReplyInfo | null;
  onClearReply?: () => void;
  accentColor?: string;
}

export default function ChatMessageInput({
  onSendMessage,
  onTyping,
  replyTo,
  onClearReply,
  accentColor = '#d4af37'
}: ChatMessageInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const recorderRef = useRef<UniversalAudioRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    recorderRef.current = new UniversalAudioRecorder();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text');
    setText('');
    setShowStickerPicker(false);
    setShowAttachmentMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    if (!recorderRef.current) return;
    await triggerMediumHaptic();
    try {
      const started = await recorderRef.current.startRecording();
      if (started) {
        setIsRecording(true);
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } else {
        setIsRecording(false);
        showGlobalToast('Acesso ao microfone necessário para gravar áudio. Verifique as permissões.', 'warning');
      }
    } catch {
      setIsRecording(false);
      showGlobalToast('Não foi possível aceder ao microfone.', 'error');
    }
  };

  const stopRecording = async (cancel = false) => {
    if (!recorderRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const audioData = await recorderRef.current.stopRecording();
    setIsRecording(false);

    if (!cancel && audioData?.url) {
      await triggerLightHaptic();
      onSendMessage('🎤 Mensagem de voz', 'audio', audioData.url);
    }
  };

  const handleCameraCapture = async () => {
    setShowAttachmentMenu(false);
    await triggerLightHaptic();
    const photoFile = await captureNativePhoto();
    if (photoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onSendMessage('📷 Foto enviada', 'image', reader.result as string);
        }
      };
      reader.readAsDataURL(photoFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAttachmentMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const isVideo = file.type.startsWith('video/');
        onSendMessage(isVideo ? '📹 Vídeo enviado' : '📷 Foto enviada', 'image', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShareLocation = async () => {
    setShowAttachmentMenu(false);
    try {
      setIsLocating(true);
      await triggerLightHaptic();
      const loc = await getCurrentLocation();
      if (loc) {
        onSendMessage(`📍 Localização de obra (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`, 'location', undefined, {
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy
          }
        });
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleShareWeather = async () => {
    setShowAttachmentMenu(false);
    try {
      setIsLocating(true);
      await triggerLightHaptic();
      const loc = await getCurrentLocation();
      if (loc) {
        const weather = await getWeatherByCoordinates(loc.latitude, loc.longitude);
        if (weather) {
          onSendMessage(`🌤 Clima ao vivo em ${weather.city}: ${weather.temp}°C`, 'text', undefined, {
            weather
          });
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleCreatePoll = (poll: PollData) => {
    setShowPollModal(false);
    setShowAttachmentMenu(false);
    onSendMessage(`📊 Sondagem: ${poll.question}`, 'poll', undefined, { poll });
  };

  return (
    <div className="border-t border-white/5 bg-[#1c2431]/95 backdrop-blur-md p-3 relative z-30">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,video/*" 
        className="hidden" 
      />

      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-2 p-2 rounded-xl bg-white/5 border-l-4 border-[#d4af37] flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-[#d4af37] block">
              Respondendo a {replyTo.sender_name || 'Colega'}
            </span>
            <p className="text-xs text-white/70 truncate">{replyTo.content}</p>
          </div>
          <button onClick={onClearReply} className="p-1 text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Animated Stickers Drawer */}
      {showStickerPicker && (
        <div className="mb-2 p-3 rounded-2xl bg-[#0a0e17] border border-white/10 max-h-48 overflow-y-auto grid grid-cols-5 gap-2 shadow-2xl">
          {ANIMATED_STICKERS_PACKS.flatMap(p => p.stickers).map(st => (
            <button
              key={st.id}
              onClick={() => {
                onSendMessage(st.title, 'image', st.url);
                setShowStickerPicker(false);
              }}
              className="p-1 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              <img src={st.url} alt={st.title} className="w-12 h-12 object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popup (WhatsApp Style) */}
      {showAttachmentMenu && (
        <div className="mb-3 p-3 rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={handleCameraCapture}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 hover:scale-105 transition-all cursor-pointer"
          >
            <Camera size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Câmara</span>
          </button>

          <button
            onClick={() => {
              setShowAttachmentMenu(false);
              fileInputRef.current?.click();
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-cyan-300 hover:scale-105 transition-all cursor-pointer"
          >
            <ImageIcon size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Galeria</span>
          </button>

          <button
            onClick={() => {
              setShowAttachmentMenu(false);
              setShowPollModal(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-[#d4af37]/30 text-[#d4af37] hover:scale-105 transition-all cursor-pointer"
          >
            <BarChart3 size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Sondagem</span>
          </button>

          <button
            onClick={handleShareLocation}
            disabled={isLocating}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 hover:scale-105 transition-all cursor-pointer"
          >
            {isLocating ? <Loader2 size={22} className="animate-spin" /> : <MapPin size={22} />}
            <span className="text-[10px] font-black uppercase tracking-wider">Localização</span>
          </button>

          <button
            onClick={handleShareWeather}
            disabled={isLocating}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-amber-300 hover:scale-105 transition-all cursor-pointer"
          >
            <Sun size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Clima Obra</span>
          </button>

          <button
            onClick={() => {
              setShowAttachmentMenu(false);
              setShowStickerPicker(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-300 hover:scale-105 transition-all cursor-pointer"
          >
            <Smile size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Stickers</span>
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-500/20 border border-red-500/40 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Gravando áudio ({recordingSeconds}s)...</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stopRecording(true)}
                className="p-1 text-white/40 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => stopRecording(false)}
                className="p-1.5 rounded-full bg-red-500 text-white cursor-pointer"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Attachment (+) Button */}
            <button
              type="button"
              onClick={() => {
                triggerLightHaptic();
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowStickerPicker(false);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showAttachmentMenu ? 'bg-[#d4af37] text-black rotate-45' : 'text-white/60 hover:text-[#d4af37]'
              }`}
              title="Anexar Ficheiro ou Sondagem"
            >
              <Plus size={20} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowStickerPicker(!showStickerPicker);
                setShowAttachmentMenu(false);
              }}
              className="p-2 text-white/50 hover:text-[#d4af37] transition-colors cursor-pointer"
              title="Stickers & Emojis"
            >
              <Smile size={20} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem..."
                className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>

            {text.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-[#d4af37]/20 text-white/70 hover:text-[#d4af37] flex items-center justify-center transition-all cursor-pointer"
                title="Gravar Mensagem de Voz"
              >
                <Mic size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Poll Modal */}
      {showPollModal && (
        <CreatePollModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={handleCreatePoll}
        />
      )}
    </div>
  );
}
