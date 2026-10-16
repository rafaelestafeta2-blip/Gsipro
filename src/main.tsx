import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App';
import './index.css';
import { ToastProvider } from './shared/lib/ToastContext';

// Ensure splash screen does not get stuck on Android
if (typeof window !== 'undefined') {
  try {
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 500);
    }
  } catch (err) {
    console.warn('[SplashScreen] init hide note:', err);
  }
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Global ErrorBoundary] Uncaught crash:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#07090e',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '2px solid #d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '16px'
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#d4af37', marginBottom: '8px' }}>
            GSI PRO
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '320px' }}>
            Ocorreu uma falha ao iniciar a aplicação no dispositivo. Clique para reiniciar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#d4af37',
              color: '#000000',
              fontWeight: 900,
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '12px',
              letterSpacing: '1px'
            }}
          >
            Recarregar Aplicação
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
