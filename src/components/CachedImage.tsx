import React, { useState, useEffect } from 'react';
import { getCachedMediaSync, getCachedMediaUrl } from '../services/mediaCacheService';
import { ImageIcon } from 'lucide-react';

interface CachedImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export default function CachedImage({
  src,
  alt = '',
  className = '',
  onClick
}: CachedImageProps) {
  // Se a imagem já foi baixada anteriormente e está em memória, recupera em 0ms instantaneamente!
  const syncCached = getCachedMediaSync(src);
  const [displaySrc, setDisplaySrc] = useState<string>(syncCached || src);
  const [isLoaded, setIsLoaded] = useState<boolean>(!!syncCached);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!src) return;

    // Se já estava em cache síncrono, já está pronto
    const immediate = getCachedMediaSync(src);
    if (immediate) {
      setDisplaySrc(immediate);
      setIsLoaded(true);
      return;
    }

    // Busca do banco de dados local IndexedDB ou baixa em segundo plano
    getCachedMediaUrl(src)
      .then(resolvedUrl => {
        if (isMounted) {
          setDisplaySrc(resolvedUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div 
      className="relative overflow-hidden rounded-2xl bg-black/30 inline-block max-w-full cursor-pointer select-none group"
      onClick={onClick}
    >
      {/* Placeholder sutil estilo WhatsApp enquanto renderiza */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center min-h-[140px] min-w-[160px] z-10 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center animate-pulse">
            <ImageIcon size={14} className="text-white/40" />
          </div>
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center justify-center min-h-[140px] min-w-[160px] p-4 bg-black/40 text-center text-white/50 text-xs">
          <ImageIcon size={20} className="mb-1 text-white/30" />
          <span>Toque para recarregar</span>
        </div>
      ) : (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            // Se falhou com blob URL antigo, tenta voltar pro src remoto
            if (displaySrc !== src) {
              setDisplaySrc(src);
            } else {
              setHasError(true);
            }
          }}
          className={`max-w-full max-h-[360px] object-cover transition-opacity duration-200 group-hover:brightness-95 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
}
