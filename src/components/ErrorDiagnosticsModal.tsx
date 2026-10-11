import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  Bell, 
  Cpu, 
  Wifi, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  getDiagnosticLogs, 
  clearDiagnosticLogs, 
  generateSystemReport, 
  copySystemReportToClipboard, 
  DiagnosticLog 
} from '../services/errorLogService';
import { APP_VERSION } from '../version';
import { Capacitor } from '@capacitor/core';
import { triggerLightHaptic, triggerSuccessHaptic } from '../lib/haptics';

interface ErrorDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrorDiagnosticsModal({ isOpen, onClose }: ErrorDiagnosticsModalProps) {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'status'>('logs');

  const refreshLogs = () => {
    setLogs(getDiagnosticLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    triggerLightHaptic();
    const success = await copySystemReportToClipboard();
    if (success) {
      triggerSuccessHaptic();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleClear = () => {
    triggerLightHaptic();
    clearDiagnosticLogs();
    setLogs([]);
  };

  const fcmToken = localStorage.getItem('gsi_fcm_token');
  const isAndroidNative = Capacitor.isNativePlatform();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0a0e17] border border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Diagnóstico & Registros de Erro
                </h3>
                <p className="text-[11px] text-white/50">
                  GSI PRO • Versão v{APP_VERSION}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Abas */}
          <div className="flex gap-2 my-4 p-1 rounded-2xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'logs'
                  ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Erros Gravados ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'status'
                  ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Estado do Sistema
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 my-2">
            {activeTab === 'logs' ? (
              logs.length === 0 ? (
                <div className="py-12 px-4 text-center text-white/40 flex flex-col items-center justify-center">
                  <CheckCircle2 size={36} className="text-emerald-400 mb-2 opacity-80" />
                  <p className="text-xs font-bold text-white/80">Nenhum erro registrado</p>
                  <p className="text-[11px] text-white/40 mt-1 max-w-xs leading-relaxed">
                    Se ocorrer algum travamento ou falha nas notificações, ele será gravado e exibido aqui para você copiar.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-black/50 border border-rose-500/20 text-xs text-rose-300 font-mono space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span className="font-bold uppercase text-[#d4af37]">{log.category}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="font-bold text-white text-[12px]">{log.title}</p>
                    <p className="text-rose-300/90 break-words leading-relaxed">{log.message}</p>
                    {log.details && (
                      <pre className="p-2 bg-black/60 rounded-xl text-[10px] text-white/60 overflow-x-auto whitespace-pre-wrap">
                        {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                      </pre>
                    )}
                  </div>
                ))
              )
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-white/60 flex items-center gap-2">
                    <Cpu size={14} className="text-[#d4af37]" /> Plataforma:
                  </span>
                  <span className="font-bold text-white">
                    {isAndroidNative ? 'Android Nativo (Capacitor)' : 'Web Browser'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-white/60 flex items-center gap-2">
                    <Info size={14} className="text-[#d4af37]" /> Versão no Código:
                  </span>
                  <span className="font-mono font-bold text-[#d4af37]">v{APP_VERSION}</span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-white/60 flex items-center gap-2">
                    <Bell size={14} className="text-[#d4af37]" /> Token FCM:
                  </span>
                  <span className="font-bold text-xs truncate max-w-[160px] text-white">
                    {fcmToken ? '🟢 Configurado' : '🔴 Não configurado'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-white/60 flex items-center gap-2">
                    <Wifi size={14} className="text-[#d4af37]" /> Conexão:
                  </span>
                  <span className="font-bold text-emerald-400">Online</span>
                </div>
              </div>
            )}
          </div>

          {/* Botões Inferiores */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                  : 'bg-[#d4af37] text-black hover:bg-[#b8962d] shadow-[#d4af37]/25'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="stroke-[3]" />
                  <span>Copiado! Cole no Chat Agora</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Relatório Completo</span>
                </>
              )}
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2.5 px-4 rounded-xl text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Limpar Histórico de Erros</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
