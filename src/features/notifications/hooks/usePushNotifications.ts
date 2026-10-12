import { useState, useEffect, useCallback } from 'react';
import { 
  setupNativePushNotifications, 
  setupForegroundMessageListener, 
  requestNativeNotificationPermission,
  configureAndroidNotificationChannel,
  checkNativeNotificationPermission
} from '../../../shared/services/firebaseMessaging';
import { Capacitor } from '@capacitor/core';
import { playNotificationSound } from '../../../shared/lib/sounds';

interface UsePushNotificationsProps {
  userId?: string;
  onIncomingCallSignal?: (signal: any) => void;
  onForegroundMessage?: (msg: { senderId: string; senderName: string; senderAvatar?: string; content: string }) => void;
}

export function usePushNotifications({
  userId,
  onIncomingCallSignal,
  onForegroundMessage
}: UsePushNotificationsProps) {
  const [fcmRegistered, setFcmRegistered] = useState(!!localStorage.getItem('gsi_fcm_token'));
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // 1. Silent channel initialization
    configureAndroidNotificationChannel().catch(() => {});
    checkNativeNotificationPermission().then(granted => {
      setHasPermission(granted);
    });

    // 2. Setup listeners if native Capacitor
    if (Capacitor.isNativePlatform() && userId) {
      setupNativePushNotifications({
        userId,
        onNotificationReceived: (notification) => {
          playNotificationSound();
          const data = notification.data || {};
          if (data?.type === 'call_signal' && onIncomingCallSignal) {
            onIncomingCallSignal(data);
          } else if (onForegroundMessage) {
            onForegroundMessage({
              senderId: data?.senderId || '',
              senderName: notification.title || 'Nova Mensagem',
              content: notification.body || ''
            });
          }
        }
      });
    }

    // 3. Foreground web listener
    setupForegroundMessageListener((payload) => {
      playNotificationSound();
      if (onForegroundMessage && payload.notification) {
        onForegroundMessage({
          senderId: payload.data?.senderId || '',
          senderName: payload.notification.title || 'GSI PRO Alerta',
          content: payload.notification.body || ''
        });
      }
    });
  }, [userId, onIncomingCallSignal, onForegroundMessage]);

  const requestPermission = useCallback(async () => {
    if (!userId) return false;
    const token = await requestNativeNotificationPermission(userId);
    if (token) {
      setFcmRegistered(true);
      setHasPermission(true);
      return true;
    }
    return false;
  }, [userId]);

  return {
    fcmRegistered,
    hasPermission,
    requestPermission
  };
}
