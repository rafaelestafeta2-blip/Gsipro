import React from 'react';
import { X, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import { captureNativePhoto } from '../../../shared/lib/cameraService';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusType: 'text' | 'image';
  setStatusType: (type: 'text' | 'image') => void;
  content: string;
  setContent: (content: string) => void;
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  caption: string;
  setCaption: (caption: string) => void;
  bgGradient: string;
  setBgGradient: (bg: string) => void;
  onPostStatus: () => void;
  accentColor?: string;
}

const BG_PRESETS = [
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-700',
  'from-blue-600 to-indigo-800',
  'from-purple-600 to-pink-600',
  'from-zinc-800 to-black'
];

export default function CreateStatusModal({
  isOpen,
  onClose,
  statusType,
  setStatusType,
  content,
  setContent,
  mediaUrl,
  setMediaUrl,
  caption,
  setCaption,
  bgGradient,
  setBgGradient,
  onPostStatus,
  accentColor = '#d4af37'
}: CreateStatusModalProps) {
  if (!isOpen) return null;

  const handleCapturePhoto = async () => {
    const photo = await captureNativePhoto();
    if (photo) {
      const url = URL.createObjectURL(photo);
      setMediaUrl(url);
      setStatusType('image');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0e17] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
          Publicar Novo Status
        </h3>

        {/* Type toggle */}
        <div className="flex rounded-2xl bg-[#1c2431] p-1 mb-4 border border-white/5">
          <button
            onClick={() => setStatusType('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              statusType === 'text' ? 'bg-[#d4af37] text-black shadow' : 'text-white/60'
            }`}
          >
            <Type size={14} />
            <span>Texto</span>
          </button>
          <button
            onClick={() => setStatusType('image')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              statusType === 'image' ? 'bg-[#d4af37] text-black shadow' : 'text-white/60'
            }`}
          >
            <ImageIcon size={14} />
            <span>Foto / Mídia</span>
          </button>
        </div>

        {/* Text Status mode */}
        {statusType === 'text' ? (
          <div className="space-y-4">
            <div
              className={`w-full h-44 rounded-2xl bg-gradient-to-br ${bgGradient} p-4 flex items-center justify-center text-center shadow-inner`}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva algo para compartilhar com a equipe..."
                className="w-full bg-transparent text-white placeholder-white/60 text-sm font-bold text-center resize-none focus:outline-none"
                rows={3}
              />
            </div>

            {/* Background palette */}
            <div className="flex items-center gap-2 justify-center">
              {BG_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBgGradient(preset)}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${preset} border-2 ${
                    bgGradient === preset ? 'border-white scale-110' : 'border-transparent'
                  } transition-transform`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Image Status mode */
          <div className="space-y-4">
            {mediaUrl ? (
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 relative">
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleCapturePhoto}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#d4af37] flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white transition-all"
                >
                  <ImageIcon size={28} className="text-[#d4af37]" />
                  <span className="text-xs font-bold">Tirar foto com câmera ou escolher</span>
                </button>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Ou cole a URL da imagem..."
                  className="w-full bg-[#1c2431] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicionar legenda à foto..."
              className="w-full bg-[#1c2431] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        )}

        {/* Post Button */}
        <button
          onClick={onPostStatus}
          className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-black transition-all mt-4 shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          Publicar no Status
        </button>
      </div>
    </div>
  );
}
