import React, { useState, useEffect, useRef, memo } from 'react';
import { getCachedMediaSync, getCachedMediaUrl } from '../services/mediaCacheService';
import { ImageIcon } from 'lucide-react';

interface CachedImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

const CachedImage = memo(function CachedImage({
  src,
  alt = '',
  className = '',
  onClick
}: CachedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // If already synchronously in RAM cache, visible immediately
    return !!getCachedMediaSync(src);
  });

  const syncCached = getCachedMediaSync(src);
  const [displaySrc, setDisplaySrc] = useState<string>(syncCached || src);
  const [isLoaded, setIsLoaded] = useState<boolean>(!!syncCached);
  const [hasError, setHasError] = useState<boolean>(false);

  // 1. Intersection Observer for Viewport Virtualization
  useEffect(() => {
    if (isVisible) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' } // Pre-fetch 250px before scrolling into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  // 2. Fetch or retrieve from IndexedDB / RAM cache when visible
  useEffect(() => {
    if (!isVisible || !src) return;

    let isMounted = true;

    // Check RAM sync cache
    const immediate = getCachedMediaSync(src);
    if (immediate) {
      setDisplaySrc(immediate);
      setIsLoaded(true);
      return;
    }

    // Fetch from IndexedDB / network
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
  }, [isVisible, src]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-black/30 inline-block max-w-full cursor-pointer select-none group transform-gpu"
      onClick={onClick}
    >
      {/* Placeholder sutil estilo WhatsApp / Instagram */}
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
      ) : isVisible ? (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (displaySrc !== src) {
              setDisplaySrc(src);
            } else {
              setHasError(true);
            }
          }}
          className={`max-w-full max-h-[360px] object-cover transition-opacity duration-200 group-hover:brightness-95 transform-gpu ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      ) : (
        <div className="min-h-[140px] min-w-[160px] bg-slate-900/40 animate-pulse" />
      )}
    </div>
  );
});

export default CachedImage;
