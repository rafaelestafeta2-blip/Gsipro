import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  Check
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { downloadMediaFile, getCachedMediaSync, getCachedMediaUrl } from '../services/mediaCacheService';
import { triggerLightHaptic, triggerSuccessHaptic } from '../lib/haptics';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  senderName?: string;
  timestamp?: string;
  caption?: string;
}

export default function MediaLightboxModal({
  isOpen,
  onClose,
  mediaUrl,
  senderName = 'Foto',
  timestamp,
  caption
}: MediaLightboxModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string>(() => getCachedMediaSync(mediaUrl) || mediaUrl);
  const [showControls, setShowControls] = useState(true);
  const [dragY, setDragY] = useState(0);

  const touchStartY = useRef<number | null>(null);

  // Carrega imediatamente da memória ou do banco local IndexedDB
  useEffect(() => {
    if (isOpen && mediaUrl) {
      setZoomLevel(1);
      setIsDownloaded(false);
      setDragY(0);

      const immediate = getCachedMediaSync(mediaUrl);
      if (immediate) {
        setCachedSrc(immediate);
      } else {
        setCachedSrc(mediaUrl);
        getCachedMediaUrl(mediaUrl).then(url => {
          setCachedSrc(url);
        });
      }
    }
  }, [isOpen, mediaUrl]);

  // Suporte à tecla Esc e ao botão Voltar nativo do Android
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // No Android nativo, intercepta o botão voltar físico para fechar o visualizador
    let backListener: any = null;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', () => {
        onClose();
      }).then(handle => {
        backListener = handle;
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (backListener) {
        backListener.remove();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const handleToggleZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerLightHaptic();
    setZoomLevel(prev => (prev === 1 ? 2.3 : 1));
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerLightHaptic();
    const success = await downloadMediaFile(mediaUrl, `GSI_PRO_CHAT_${Date.now()}.jpg`);
    if (success) {
      triggerSuccessHaptic();
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2500);
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerLightHaptic();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Foto enviada por ${senderName}`,
          text: caption || 'Foto compartilhada no GSI PRO',
          url: mediaUrl
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(mediaUrl);
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 2000);
      } catch {}
    }
  };

  // Gestos de arrastar para baixo para fechar estilo WhatsApp / Instagram
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoomLevel > 1 || touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 90) {
      triggerLightHaptic();
      onClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] bg-black select-none touch-manipulation overflow-hidden flex flex-col justify-between"
        style={{
          opacity: dragY > 0 ? Math.max(0.4, 1 - dragY / 300) : 1,
          transition: dragY === 0 ? 'opacity 0.2s ease-out' : 'none'
        }}
        onClick={() => {
          if (zoomLevel > 1) {
            setZoomLevel(1);
          } else {
            setShowControls(prev => !prev);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barra Superior estilo WhatsApp */}
        <motion.div 
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: showControls ? 0 : -80, opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          className="w-full bg-gradient-to-b from-black/95 via-black/70 to-transparent p-4 pt-6 flex items-center justify-between text-white z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerLightHaptic();
                onClose();
              }}
              className="p-2 -ml-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white"
              aria-label="Voltar para a conversa"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h4 className="text-sm font-bold truncate tracking-wide text-white">
                {senderName}
              </h4>
              {timestamp && (
                <p className="text-[11px] text-white/60 font-medium">
                  {timestamp}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Alternar Zoom */}
            <button
              type="button"
              onClick={handleToggleZoom}
              className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white"
              title={zoomLevel === 1 ? 'Aproximar' : 'Afastar'}
            >
              {zoomLevel === 1 ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
            </button>

            {/* Compartilhar */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white"
              title="Compartilhar"
            >
              <Share2 size={20} />
            </button>

            {/* Salvar na Galeria */}
            <button
              type="button"
              onClick={handleDownload}
              className={`p-2.5 rounded-full active:scale-95 transition-all ${
                isDownloaded 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'hover:bg-white/10 text-white/80 hover:text-white'
              }`}
              title="Salvar no celular"
            >
              {isDownloaded ? <Check size={20} /> : <Download size={20} />}
            </button>
          </div>
        </motion.div>

        {/* Área Central da Imagem com Gestos e Zoom Suave */}
        <div 
          className="flex-1 flex items-center justify-center p-2 relative overflow-hidden"
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px) scale(${Math.max(0.85, 1 - dragY / 1000)})` : 'none',
            transition: dragY === 0 ? 'transform 0.2s ease-out' : 'none'
          }}
        >
          <motion.img
            src={cachedSrc}
            alt={caption || 'Imagem em tela cheia'}
            animate={{ scale: zoomLevel }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-h-[85vh] max-w-full object-contain cursor-pointer transition-transform duration-200 select-none shadow-2xl"
            onDoubleClick={handleToggleZoom}
            draggable={false}
          />
        </div>

        {/* Barra Inferior estilo WhatsApp com Legenda / Caption */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: showControls ? 0 : 80, opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-5 pb-8 flex flex-col items-center justify-center text-center text-white z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {caption && caption.trim().length > 0 && (
            <p className="text-sm font-medium text-white/95 bg-black/60 px-5 py-2.5 rounded-2xl max-w-md backdrop-blur-md border border-white/10 mb-2 shadow-lg">
              {caption}
            </p>
          )}
          <span className="text-[10px] text-white/40 tracking-wider">
            Toque duas vezes para aproximar • Arraste para baixo para fechar
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
