/**
 * Serviço de Armazenamento Local e Cache Persistente estilo WhatsApp para GSI PRO
 * Utiliza IndexedDB nativo de alta capacidade + Object URLs em memória RAM.
 *
 * Funcionalidades estilo WhatsApp:
 * 1. Persistência permanente em disco (IndexedDB) para imagens, vídeos, áudios e avatars.
 * 2. Carregamento instantâneo em 0ms se já estiver no banco de dados local.
 * 3. Otimização e compressão client-side de fotos (estilo WhatsApp) antes do upload.
 * 4. Pré-carregamento em segundo plano ao abrir conversas.
 * 5. Download nativo para a galeria do smartphone.
 */

const DB_NAME = 'GSI_PRO_MEDIA_DB_V2';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

// Cache em memória RAM de URLs já instanciadas (retorno em < 1ms durante a sessão)
const memoryBlobUrls = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

interface CachedMediaItem {
  url: string;
  blob: Blob;
  mimeType: string;
  size: number;
  timestamp: number;
}

/**
 * Abre ou inicializa o banco de dados IndexedDB de mídia
 */
function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB não suportado neste ambiente'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retorna instantaneamente da memória se já estiver carregado (Síncrono - 0ms)
 */
export function getCachedMediaSync(remoteUrl: string | null | undefined): string | null {
  if (!remoteUrl) return null;
  if (memoryBlobUrls.has(remoteUrl)) {
    return memoryBlobUrls.get(remoteUrl)!;
  }
  return null;
}

/**
 * Busca a mídia no IndexedDB local ou baixa da rede e armazena permanentemente.
 * Se já existir localmente no banco, retorna em < 3ms sem consumir internet.
 */
export async function getCachedMediaUrl(remoteUrl: string): Promise<string> {
  if (!remoteUrl || !remoteUrl.startsWith('http')) {
    return remoteUrl;
  }

  // 1. Checagem em memória RAM instantânea
  if (memoryBlobUrls.has(remoteUrl)) {
    return memoryBlobUrls.get(remoteUrl)!;
  }

  // 2. Se já estiver sendo baixado agora mesmo, reaproveita a mesma promessa
  if (pendingFetches.has(remoteUrl)) {
    return pendingFetches.get(remoteUrl)!;
  }

  const fetchPromise = (async () => {
    try {
      // 3. Busca no banco de dados local IndexedDB
      const db = await openMediaDatabase();
      const cached = await new Promise<CachedMediaItem | null>((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const getReq = store.get(remoteUrl);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (cached && cached.blob) {
        const objectUrl = URL.createObjectURL(cached.blob);
        memoryBlobUrls.set(remoteUrl, objectUrl);
        return objectUrl;
      }

      // 4. Se não estiver no IndexedDB, baixa e armazena localmente
      const response = await fetch(remoteUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        memoryBlobUrls.set(remoteUrl, objectUrl);

        // Salva de forma assíncrona no IndexedDB sem travar a thread
        try {
          const writeTx = db.transaction([STORE_NAME], 'readwrite');
          const writeStore = writeTx.objectStore(STORE_NAME);
          writeStore.put({
            url: remoteUrl,
            blob,
            mimeType: blob.type,
            size: blob.size,
            timestamp: Date.now()
          });
        } catch (dbErr) {
          console.warn('[Media Cache DB Save Warning]:', dbErr);
        }

        return objectUrl;
      }
    } catch (err) {
      console.warn('[Media Cache] Usando URL remota original:', err);
    } finally {
      pendingFetches.delete(remoteUrl);
    }

    return remoteUrl;
  })();

  pendingFetches.set(remoteUrl, fetchPromise);
  return fetchPromise;
}

/**
 * Salva uma mídia localmente no banco IndexedDB e na memória de imediato
 * (Útil para fotos tiradas na hora ou áudios gravados pelo usuário)
 */
export async function saveMediaLocally(url: string, blob: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  memoryBlobUrls.set(url, objectUrl);

  try {
    const db = await openMediaDatabase();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      url,
      blob,
      mimeType: blob.type,
      size: blob.size,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('[Save Media Locally Error]:', err);
  }

  return objectUrl;
}

/**
 * Pré-carrega uma lista de mídias em segundo plano em lote estilo WhatsApp
 * Baixa e guarda no IndexedDB sem travar a rolagem ou digitação.
 */
export function precacheMediaUrls(urls: (string | null | undefined)[]): void {
  const validUrls = urls.filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
  if (validUrls.length === 0) return;

  const runPrecache = async () => {
    // Processa até 3 mídias concorrentes por vez para não engarrafar a rede
    const batchSize = 3;
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      await Promise.all(
        batch.map(url => getCachedMediaUrl(url).catch(() => {}))
      );
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPrecache, { timeout: 3000 });
  } else {
    setTimeout(runPrecache, 250);
  }
}

/**
 * Comprime imagens no cliente estilo WhatsApp antes de enviar para o servidor
 * Redimensiona para no máximo 1280px e 80% de qualidade, reduzindo de 5MB para ~150KB.
 */
export async function compressImageFile(file: File, maxDimension: number = 1280, quality: number = 0.82): Promise<{ file: File; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      return resolve({ file, previewUrl: preview });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const preview = URL.createObjectURL(file);
          return resolve({ file, previewUrl: preview });
        }

        // Desenha imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            const preview = URL.createObjectURL(file);
            return resolve({ file, previewUrl: preview });
          }

          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          const previewUrl = URL.createObjectURL(blob);
          resolve({ file: compressedFile, previewUrl });
        }, 'image/jpeg', quality);
      };

      img.onerror = () => {
        const preview = URL.createObjectURL(file);
        resolve({ file, previewUrl: preview });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Faz download do arquivo de mídia para a galeria / downloads do dispositivo do usuário
 */
export async function downloadMediaFile(url: string, suggestedFilename?: string): Promise<boolean> {
  return downloadMediaFileWithWatermark(url, suggestedFilename);
}

/**
 * Faz download do arquivo de mídia com a marca d'água InstaChat embutida na imagem
 */
export async function downloadMediaFileWithWatermark(url: string, suggestedFilename?: string, authorName?: string): Promise<boolean> {
  try {
    const cachedUrl = await getCachedMediaUrl(url);
    const filename = suggestedFilename || `INSTACHAT_${Date.now()}.jpg`;

    if (url && (url.match(/\.(jpeg|jpg|png|webp)(\?.*)?$/i) || url.startsWith('data:image'))) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = cachedUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 1080;
      canvas.height = img.naturalHeight || img.height || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);

        // Watermark badge at bottom-right
        const padding = Math.max(20, Math.round(canvas.width * 0.03));
        const badgeWidth = Math.round(canvas.width * 0.28);
        const badgeHeight = Math.round(canvas.height * 0.07);
        const x = canvas.width - badgeWidth - padding;
        const y = canvas.height - badgeHeight - padding;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2);
        } else {
          ctx.rect(x, y, badgeWidth, badgeHeight);
        }
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();

        // Circle icon
        const circleRadius = badgeHeight * 0.35;
        const circleX = x + badgeHeight / 2;
        const circleY = y + badgeHeight / 2;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(badgeHeight * 0.38)}px sans-serif`;
        ctx.fillText('INSTA CHAT', x + badgeHeight + 4, y + badgeHeight * 0.58);
        
        if (authorName) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.font = `${Math.round(badgeHeight * 0.3)}px sans-serif`;
          ctx.fillText(`@${authorName.toLowerCase().replace(/\\s+/g, '')}`, x + badgeHeight + 4, y + badgeHeight * 0.85);
        }
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      }
    }

    const a = document.createElement('a');
    a.href = cachedUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 120);
    return true;
  } catch (err) {
    console.error('[Download Watermark Error]:', err);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedFilename || 'INSTACHAT_DOWNLOAD.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }
}
