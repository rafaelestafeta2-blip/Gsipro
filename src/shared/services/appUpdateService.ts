import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { App } from '@capacitor/app';
import { APP_VERSION } from '../../version';

// Repository details
export const GITHUB_OWNER = 'rafaelestafeta2-blip';
export const GITHUB_REPO = 'Gsipro';
export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const GITHUB_RELEASES_WEB_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

// Current app version fallback synced from src/version.ts
export const CURRENT_APP_VERSION = APP_VERSION;

export interface GitHubReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface ReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  apkAsset: GitHubReleaseAsset | null;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  isMandatory?: boolean;
}

/**
 * Extrai e normaliza partes numéricas e de pré-release de qualquer tag do GitHub.
 * Exemplos: 'v1.0.2' -> [1, 0, 2], 'v1.0.1' -> [1, 0, 1]
 */
export function parseVersion(versionStr: string): number[] {
  if (!versionStr) return [0, 0, 0];
  
  const cleaned = versionStr
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .replace(/[^0-9.]/g, '');
  
  if (!cleaned) return [0, 0, 0];
  const parts = cleaned.split('.').map(num => parseInt(num, 10) || 0);
  
  while (parts.length < 3) {
    parts.push(0);
  }
  
  return parts;
}

/**
 * Compara a tag/versão da release do GitHub com a versão instalada no dispositivo.
 */
export function isNewerVersion(latestTagOrVersion: string, currentVersion: string): boolean {
  if (!latestTagOrVersion) return false;
  if (!currentVersion) return true;

  const latestParts = parseVersion(latestTagOrVersion);
  const currentParts = parseVersion(currentVersion);
  
  const maxLength = Math.max(latestParts.length, currentParts.length);
  for (let i = 0; i < maxLength; i++) {
    const l = latestParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/**
 * Obtém a versão instalada no dispositivo utilizando App.getInfo() do Capacitor.
 */
export async function getAppVersion(): Promise<string> {
  try {
    if (Capacitor.isNativePlatform()) {
      const appInfo = await App.getInfo();
      if (appInfo?.version && appInfo.version !== '0.0.0') {
        return appInfo.version;
      }
    }
  } catch (err) {
    console.warn('[AppUpdate] Failed to get app version from Capacitor App.getInfo:', err);
  }
  return CURRENT_APP_VERSION;
}

/**
 * Checks GitHub Releases API for the latest version and compares with current
 */
export async function checkForAppUpdate(): Promise<ReleaseInfo | null> {
  try {
    const currentVersion = await getAppVersion();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(GITHUB_LATEST_RELEASE_API, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[AppUpdate] No published releases found on GitHub repo yet.');
      } else {
        console.warn(`[AppUpdate] GitHub Releases API returned status ${response.status}`);
      }
      return null;
    }

    const releaseData = await response.json();
    const tagName = (releaseData.tag_name || releaseData.name || '').trim();
    const latestVersion = tagName.replace(/^v/i, '');

    let apkAsset: GitHubReleaseAsset | null = null;
    if (Array.isArray(releaseData.assets)) {
      apkAsset = releaseData.assets.find((asset: any) => 
        asset.name && asset.name.toLowerCase().endsWith('.apk')
      ) || null;
    }

    const hasUpdate = isNewerVersion(tagName || latestVersion, currentVersion);

    const bodyLower = (releaseData.body || '').toLowerCase();
    const isMandatory = bodyLower.includes('[obrigatori') || 
                        bodyLower.includes('[mandatory]') || 
                        bodyLower.includes('[critico]') || 
                        bodyLower.includes('[crítico]');

    return {
      tag_name: tagName,
      name: releaseData.name || tagName,
      body: releaseData.body || '',
      published_at: releaseData.published_at || '',
      html_url: releaseData.html_url || GITHUB_RELEASES_WEB_URL,
      apkAsset,
      hasUpdate,
      currentVersion,
      latestVersion,
      isMandatory,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[AppUpdate] Request to GitHub API timed out.');
    } else {
      console.warn('[AppUpdate] Error checking for app updates:', error?.message || error);
    }
    return null;
  }
}

/**
 * Abre o download do APK diretamente no navegador do smartphone (Chrome/Android)
 * Bypassa 100% qualquer bloqueio de CORS ou rede do WebView.
 */
export function openApkDownloadInBrowser(url: string): void {
  try {
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = 'GSI_PRO_update.apk';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  } catch {
    try {
      window.open(url, '_blank');
    } catch {
      window.location.href = url;
    }
  }
}

/**
 * Downloads the APK and invokes Android system installer
 */
export async function downloadAndInstallApk(
  downloadUrl: string,
  fileName: string = 'GSI_PRO_update.apk',
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Se estiver rodando no Android Nativo (Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('[AppUpdate] Iniciando download nativo via Filesystem.downloadFile:', downloadUrl);
        if (onProgress) onProgress(20, 0, 0);

        const downloadResult = await Filesystem.downloadFile({
          url: downloadUrl,
          path: sanitizedFileName,
          directory: Directory.Cache
        });

        if (downloadResult && downloadResult.path) {
          if (onProgress) onProgress(100, 1, 1);
          console.log('[AppUpdate] APK baixado com sucesso no Cache:', downloadResult.path);

          // Abre com o Instalador de Pacotes do Android
          await FileOpener.openFile({
            path: downloadResult.path,
            mimeType: 'application/vnd.android.package-archive',
          });

          return { success: true };
        }
      } catch (nativeDownloadErr: any) {
        console.warn('[AppUpdate] Filesystem.downloadFile falhou ou sem permissão:', nativeDownloadErr);
        // Fallback: Tenta download via fetch tradicional se a API suportar
      }
    }

    // 2. Tentativa via Fetch tradicional com Stream
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      if (response.body) {
        reader = response.body.getReader();
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedBytes += value.length;
            if (onProgress && totalBytes > 0) {
              const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              onProgress(percent, receivedBytes, totalBytes);
            }
          }
        }
      } else {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
        receivedBytes = arrayBuffer.byteLength;
        if (onProgress) onProgress(100, receivedBytes, receivedBytes);
      }

      const fullBuffer = new Uint8Array(receivedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const base64Data = uint8ArrayToBase64(fullBuffer);

      const writeResult = await Filesystem.writeFile({
        path: sanitizedFileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      await FileOpener.openFile({
        path: writeResult.uri,
        mimeType: 'application/vnd.android.package-archive',
      });

      return { success: true };
    } catch (fetchErr: any) {
      console.warn('[AppUpdate] Fetch direto bloqueado por CORS. Usando fallback do navegador:', fetchErr);
      
      // Fallback supremo: abre no navegador do smartphone
      openApkDownloadInBrowser(downloadUrl);
      return { 
        success: false, 
        error: 'O download foi aberto no navegador do seu celular. Toque em "Baixar" no Chrome para instalar o APK.' 
      };
    }
  } catch (err: any) {
    console.error('[AppUpdate] Erro geral ao baixar APK:', err);
    openApkDownloadInBrowser(downloadUrl);
    return {
      success: false,
      error: 'Download iniciado no navegador do celular.',
    };
  }
}

/**
 * Fast helper to convert Uint8Array chunks into base64 without stack overflow
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}
