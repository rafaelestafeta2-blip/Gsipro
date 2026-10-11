import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../version';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  category: 'notificacoes' | 'download' | 'rede' | 'geral' | 'supabase';
  title: string;
  message: string;
  stack?: string;
  details?: any;
}

const STORAGE_KEY = 'gsi_diagnostics_logs_v1';
const MAX_LOGS = 50;

/**
 * Lê os logs de erro armazenados em cache local
 */
export function getDiagnosticLogs(): DiagnosticLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Registra um erro no histórico permanente do aplicativo
 */
export function logDiagnosticError(
  category: DiagnosticLog['category'],
  title: string,
  error: any,
  details?: any
): DiagnosticLog {
  const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error) || 'Erro desconhecido');
  const stack = error?.stack || (error?.error?.stack) || undefined;

  const newLog: DiagnosticLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    category,
    title,
    message,
    stack,
    details
  };

  try {
    const existing = getDiagnosticLogs();
    const updated = [newLog, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('gsi_diagnostic_log_added', { detail: newLog }));
  } catch (err) {
    console.warn('[ErrorLogService] Falha ao salvar log localmente:', err);
  }

  return newLog;
}

/**
 * Limpa todo o histórico de logs gravados
 */
export function clearDiagnosticLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('gsi_diagnostic_log_cleared'));
  } catch {}
}

/**
 * Gera um relatório completo formatado em texto para o usuário copiar e colar no chat
 */
export function generateSystemReport(): string {
  const logs = getDiagnosticLogs();
  const fcmToken = localStorage.getItem('gsi_fcm_token');
  const platform = Capacitor.isNativePlatform() ? 'Android Nativo (Capacitor)' : 'Web Browser';
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  let report = `=======================================\n`;
  report += `📊 GSI PRO - DIAGNÓSTICO DO SISTEMA\n`;
  report += `=======================================\n`;
  report += `• Data do Relatório: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `• Versão do App: v${APP_VERSION}\n`;
  report += `• Plataforma: ${platform}\n`;
  report += `• Status Conexão: ${isOnline ? 'Online 🟢' : 'Offline 🔴'}\n`;
  report += `• Token FCM Salvo: ${fcmToken ? 'Sim (' + fcmToken.substring(0, 16) + '...)' : 'Não configurado'}\n`;
  report += `• Navegador / WebView: ${navigator.userAgent}\n\n`;

  report += `---------------------------------------\n`;
  report += `📝 HISTÓRICO DE ERROS (${logs.length} registros)\n`;
  report += `---------------------------------------\n`;

  if (logs.length === 0) {
    report += `Nenhum erro registrado recentemente no sistema.\n`;
  } else {
    logs.forEach((l, idx) => {
      report += `\n[${idx + 1}] [${l.timestamp}] [${l.category.toUpperCase()}] ${l.title}\n`;
      report += `Mensagem: ${l.message}\n`;
      if (l.details) {
        report += `Detalhes: ${typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}\n`;
      }
      if (l.stack) {
        report += `Stack:\n${l.stack.split('\n').slice(0, 5).join('\n')}\n`;
      }
    });
  }

  report += `\n=======================================\n`;
  return report;
}

/**
 * Copia o relatório de diagnóstico para a área de transferência do celular
 */
export async function copySystemReportToClipboard(): Promise<boolean> {
  const report = generateSystemReport();
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(report);
      return true;
    }
  } catch {}

  try {
    const textArea = document.createElement('textarea');
    textArea.value = report;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    return false;
  }
}

// Inicializa interceptadores globais de erros
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logDiagnosticError('geral', 'Erro JavaScript Inesperado', {
      message: event.message,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logDiagnosticError('geral', 'Promise Rejeitada Não Tratada', {
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    });
  });
}
