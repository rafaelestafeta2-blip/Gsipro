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
  Loader2 
} from 'lucide-react';
import { ReplyInfo, WeatherData } from '../../../shared/types';
import { UniversalAudioRecorder } from '../../../shared/lib/audioRecorder';
import { captureNativePhoto } from '../../../shared/lib/cameraService';
import { getCurrentLocation } from '../../../shared/lib/locationService';
import { getWeatherByCoordinates } from '../../../shared/services/weatherService';
import { triggerLightHaptic, triggerMediumHaptic } from '../../../shared/lib/haptics';
import { showGlobalToast } from '../../../shared/lib/ToastContext';
import { ANIMATED_STICKERS_PACKS } from '../../../data/animatedStickers';

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
  const [isLocating, setIsLocating] = useState(false);

  const recorderRef = useRef<UniversalAudioRecorder | null>(null);
  const timerRef = useRef<any>(null);

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
        showGlobalToast('Acesso ao microfone necessário para gravar áudio. Verifique as permissões do navegador.', 'warning');
      }
    } catch {
      setIsRecording(false);
      showGlobalToast('Não foi possível aceder ao microfone.', 'error');
    }
  };

  const stopRecording = async (cancel = false) => {
    if (!recorderRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const audioUrl = await recorderRef.current.stopRecording();
    setIsRecording(false);

    if (!cancel && audioUrl) {
      await triggerLightHaptic();
      onSendMessage('🎤 Mensagem de voz', 'audio', audioUrl);
    }
  };

  const handleCameraCapture = async () => {
    await triggerLightHaptic();
    const photoFile = await captureNativePhoto();
    if (photoFile) {
      const photoUrl = URL.createObjectURL(photoFile);
      onSendMessage('📷 Foto enviada', 'image', photoUrl);
    }
  };

  const handleShareLocation = async () => {
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

  return (
    <div className="border-t border-white/5 bg-[#1c2431]/80 backdrop-blur-md p-3 relative">
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
        <div className="mb-2 p-3 rounded-2xl bg-[#0a0e17] border border-white/10 max-h-48 overflow-y-auto grid grid-cols-5 gap-2">
          {ANIMATED_STICKERS_PACKS.flatMap(p => p.stickers).map(st => (
            <button
              key={st.id}
              onClick={() => {
                onSendMessage(st.title, 'image', st.url);
                setShowStickerPicker(false);
              }}
              className="p-1 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center"
            >
              <img src={st.url} alt={st.title} className="w-12 h-12 object-contain" />
            </button>
          ))}
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
                onClick={() => stopRecording(true)}
                className="p-1 text-white/40 hover:text-white text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => stopRecording(false)}
                className="p-1.5 rounded-full bg-red-500 text-white"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className="p-2 text-white/50 hover:text-[#d4af37] transition-colors"
            >
              <Smile size={20} />
            </button>

            <button
              onClick={handleCameraCapture}
              className="p-2 text-white/50 hover:text-[#d4af37] transition-colors"
            >
              <Camera size={20} />
            </button>

            <button
              onClick={handleShareLocation}
              disabled={isLocating}
              className="p-2 text-white/50 hover:text-[#d4af37] transition-colors"
              title="Partilhar Localização"
            >
              {isLocating ? <Loader2 size={20} className="animate-spin text-[#d4af37]" /> : <MapPin size={20} />}
            </button>

            <button
              onClick={handleShareWeather}
              disabled={isLocating}
              className="p-2 text-white/50 hover:text-[#d4af37] transition-colors"
              title="Partilhar Clima"
            >
              <Sun size={20} />
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
                onClick={handleSend}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Send size={16} />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-[#d4af37]/20 text-white/70 hover:text-[#d4af37] flex items-center justify-center transition-all"
              >
                <Mic size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
