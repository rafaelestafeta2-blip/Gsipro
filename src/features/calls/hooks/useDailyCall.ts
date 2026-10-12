import { useState, useRef, useEffect, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Profile } from '../../../shared/types';
import { supabase } from '../../../shared/services/supabaseClient';
import { startIncomingCallRingtone, stopIncomingCallRingtone, stopAllCallSounds } from '../../../shared/lib/sounds';
import { triggerSuccessHaptic, triggerWarningHaptic, triggerLightHaptic } from '../../../shared/lib/haptics';
import { showGlobalToast } from '../../../shared/lib/ToastContext';
import { createDailyRoom, sendCallSignal, recordCallLog } from '../services/callService';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'reconnecting' | 'ended';

interface UseDailyCallProps {
  currentUserId: string;
  userName: string;
  userAvatar?: string;
  onClearIncomingSignal?: () => void;
}

export function useDailyCall({
  currentUserId,
  userName,
  userAvatar,
  onClearIncomingSignal
}: UseDailyCallProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [callUser, setCallUser] = useState<Profile | null>(null);
  const [callRoomUrl, setCallRoomUrl] = useState<string | null>(null);
  const [callRoomName, setCallRoomName] = useState<string | null>(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallCameraOff, setIsCallCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
  const [callDurationSec, setCallDurationSec] = useState(0);

  const dialtoneRef = useRef<HTMLAudioElement | null>(null);
  const dailyCallRef = useRef<DailyCall | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const outgoingTimeoutRef = useRef<any>(null);

  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const callUserRef = useRef(callUser);
  useEffect(() => { callUserRef.current = callUser; }, [callUser]);

  const callTypeRef = useRef(callType);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);

  // Sound helpers
  const playDialtone = useCallback(() => {
    stopDialtone();
    try {
      dialtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3');
      dialtoneRef.current.loop = true;
      dialtoneRef.current.volume = 0.3;
      dialtoneRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const stopDialtone = useCallback(() => {
    if (dialtoneRef.current) {
      try {
        dialtoneRef.current.pause();
        dialtoneRef.current.currentTime = 0;
      } catch {}
      dialtoneRef.current = null;
    }
  }, []);

  const playRingtone = useCallback(() => {
    stopIncomingCallRingtone();
    startIncomingCallRingtone();
  }, []);

  const stopRingtone = useCallback(() => {
    stopIncomingCallRingtone();
    stopAllCallSounds();
  }, []);

  // Sync Daily audio and video tracks to DOM elements
  const syncDailyTracks = useCallback(() => {
    if (!dailyCallRef.current) return;
    try {
      const participants = dailyCallRef.current.participants();
      if (!participants) return;

      // 1. Local track
      const local = participants.local;
      if (local && localVideoRef.current && local.tracks?.video) {
        const videoTrack = local.tracks.video.persistentTrack;
        const currentSrc = localVideoRef.current.srcObject as MediaStream | null;
        if (videoTrack && (!currentSrc || currentSrc.getVideoTracks()[0] !== videoTrack)) {
          localVideoRef.current.srcObject = new MediaStream([videoTrack]);
          localVideoRef.current.play().catch(() => {});
        }
      }

      // 2. Remote track
      const remotes = (Object.values(participants) as any[]).filter(p => !p.local);
      if (remotes.length > 0) {
        const remote = remotes[0];
        const remoteVideoTrack = remote?.tracks?.video?.persistentTrack;
        setIsRemoteCameraOff(!remoteVideoTrack || remote?.tracks?.video?.state === 'off' || remote?.tracks?.video?.state === 'blocked');

        if (remoteVideoRef.current && remoteVideoTrack) {
          const currentSrc = remoteVideoRef.current.srcObject as MediaStream | null;
          if (!currentSrc || currentSrc.getVideoTracks()[0] !== remoteVideoTrack) {
            remoteVideoRef.current.srcObject = new MediaStream([remoteVideoTrack]);
            remoteVideoRef.current.play().catch(() => {});
          }
        }

        if (remoteAudioRef.current && remote?.tracks?.audio) {
          const audioTrack = remote.tracks.audio.persistentTrack;
          const currentSrc = remoteAudioRef.current.srcObject as MediaStream | null;
          if (audioTrack && (!currentSrc || currentSrc.getAudioTracks()[0] !== audioTrack)) {
            remoteAudioRef.current.srcObject = new MediaStream([audioTrack]);
            remoteAudioRef.current.play().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('[useDailyCall] Track sync error:', err);
    }
  }, []);

  // Poll tracks periodically when connected
  useEffect(() => {
    if (callState === 'connected') {
      syncDailyTracks();
      const interval = setInterval(syncDailyTracks, 1000);
      return () => clearInterval(interval);
    }
  }, [callState, syncDailyTracks]);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      setCallDurationSec(0);
      const timer = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDurationSec(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCallDurationSec(0);
    }
  }, [callState]);

  // Ensure ringtone/dialtone stops when callState changes
  useEffect(() => {
    if (callState !== 'incoming') stopRingtone();
    if (callState !== 'outgoing') stopDialtone();
    if (callState === 'idle' || callState === 'ended' || callState === 'connected') {
      stopAllCallSounds();
    }
  }, [callState, stopRingtone, stopDialtone]);

  // Cleanup on unmount
  useEffect(() => {
    const handleGlobalStop = () => {
      stopRingtone();
      stopDialtone();
      stopAllCallSounds();
    };
    window.addEventListener('gsi:stop_all_call_sounds', handleGlobalStop);

    return () => {
      window.removeEventListener('gsi:stop_all_call_sounds', handleGlobalStop);
      stopRingtone();
      stopDialtone();
      stopAllCallSounds();
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
      if (dailyCallRef.current) {
        try {
          dailyCallRef.current.leave();
          dailyCallRef.current.destroy();
        } catch {}
        dailyCallRef.current = null;
      }
    };
  }, [stopRingtone, stopDialtone]);

  // Join Daily.co Call Object
  const joinDailyRoom = async (url: string, type: 'video' | 'audio') => {
    try {
      if (dailyCallRef.current) {
        try {
          await dailyCallRef.current.leave();
          await dailyCallRef.current.destroy();
        } catch {}
        dailyCallRef.current = null;
      }

      const call = DailyIframe.createCallObject({
        url,
        subscribeToTracksAutomatically: true,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
          useDevicePreferenceCookies: false
        } as any
      });
      dailyCallRef.current = call;

      call
        .on('joined-meeting', () => syncDailyTracks())
        .on('participant-joined', () => syncDailyTracks())
        .on('participant-updated', () => syncDailyTracks())
        .on('track-started', () => syncDailyTracks())
        .on('track-stopped', () => syncDailyTracks())
        .on('participant-left', (evt) => {
          if (!evt?.participant?.local) {
            handleHangUpLocal(false);
          }
        })
        .on('error', (err) => {
          console.error('[useDailyCall] Call error:', err);
          showGlobalToast('Erro na chamada de vídeo/voz.', 'error');
          handleHangUpLocal(true);
        });

      await call.join({
        url,
        userName: userName || 'Utilizador GSI',
        startVideoOff: type === 'audio',
        startAudioOff: false
      });
      syncDailyTracks();
    } catch (joinErr) {
      console.error('[useDailyCall] Error joining room:', joinErr);
      showGlobalToast('Não foi possível conectar à chamada. Verifique a sua rede.', 'error');
      handleHangUpLocal(true);
    }
  };

  // Start outgoing call
  const startOutgoingCall = async (targetUser: Profile, type: 'video' | 'audio') => {
    if (!targetUser) return;
    setCallUser(targetUser);
    setCallType(type);
    setCallState('outgoing');
    callStartTimeRef.current = null;
    playDialtone();

    const { roomUrl, roomName } = await createDailyRoom(currentUserId, targetUser.id, type);
    setCallRoomUrl(roomUrl);
    setCallRoomName(roomName);

    await joinDailyRoom(roomUrl, type);

    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
    outgoingTimeoutRef.current = setTimeout(() => {
      if (callStateRef.current === 'outgoing') {
        recordCallLog(currentUserId, targetUser.id, 'missed', type, undefined, roomUrl, roomName);
        handleHangUpLocal(true);
      }
    }, 45000);

    await sendCallSignal(targetUser.id, {
      type: 'incoming-call',
      senderId: currentUserId,
      senderName: userName,
      senderAvatar: userAvatar || '',
      callType: type,
      roomUrl,
      roomName
    });
  };

  // Accept incoming call
  const acceptCall = async (signalData?: any) => {
    const targetUser = signalData?.senderId ? {
      id: signalData.senderId,
      full_name: signalData.senderName,
      avatar_url: signalData.senderAvatar || '',
      role: 'Oficial' as const,
      current_obra: '',
      hourly_rate: 0
    } : callUser;

    const targetUrl = signalData?.roomUrl || callRoomUrl;
    const targetName = signalData?.roomName || callRoomName;
    const targetType = signalData?.callType || callType;

    if (!targetUser || !targetUrl) return;

    triggerSuccessHaptic();
    stopRingtone();
    stopAllCallSounds();

    setCallUser(targetUser);
    setCallRoomUrl(targetUrl);
    setCallRoomName(targetName);
    setCallType(targetType);
    setCallState('connected');
    callStartTimeRef.current = Date.now();

    await sendCallSignal(targetUser.id, {
      type: 'call-accepted',
      roomUrl: targetUrl,
      roomName: targetName
    });

    await joinDailyRoom(targetUrl, targetType);
  };

  // Decline incoming call
  const declineCall = async () => {
    if (!callUser) return;
    triggerWarningHaptic();
    stopRingtone();
    stopAllCallSounds();

    const partnerId = callUser.id;
    const cType = callType;
    const rUrl = callRoomUrl;
    const rName = callRoomName;

    await sendCallSignal(partnerId, { type: 'call-declined' });

    if (dailyCallRef.current) {
      try {
        await dailyCallRef.current.leave();
        await dailyCallRef.current.destroy();
      } catch {}
      dailyCallRef.current = null;
    }

    setCallState('idle');
    setCallUser(null);
    setCallRoomUrl(null);
    setCallRoomName(null);
    await recordCallLog(currentUserId, partnerId, 'declined', cType, undefined, rUrl, rName);
  };

  // Hang up local
  const handleHangUpLocal = async (notifyPartner: boolean = true) => {
    stopRingtone();
    stopDialtone();
    stopAllCallSounds();

    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    const partner = callUserRef.current;
    const previousState = callStateRef.current;
    const cType = callTypeRef.current;
    const startTime = callStartTimeRef.current;
    const rUrl = callRoomUrl;
    const rName = callRoomName;

    if (notifyPartner && partner) {
      await sendCallSignal(partner.id, { type: 'call-ended' });
    }

    if (dailyCallRef.current) {
      try {
        await dailyCallRef.current.leave();
        await dailyCallRef.current.destroy();
      } catch {}
      dailyCallRef.current = null;
    }

    setCallState('idle');
    setCallUser(null);
    setCallRoomUrl(null);
    setCallRoomName(null);
    callStartTimeRef.current = null;
    setIsCallMuted(false);
    setIsCallCameraOff(false);

    if (partner) {
      const dur = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const status = previousState === 'outgoing' ? 'missed' : (previousState === 'connected' ? 'completed' : 'declined');
      await recordCallLog(currentUserId, partner.id, status, cType, dur, rUrl, rName);
    }
  };

  const toggleCallMute = () => {
    if (dailyCallRef.current) {
      const nextMuted = !isCallMuted;
      dailyCallRef.current.setLocalAudio(!nextMuted);
      setIsCallMuted(nextMuted);
    }
  };

  const toggleCallCamera = () => {
    if (dailyCallRef.current) {
      const nextCameraOff = !isCallCameraOff;
      dailyCallRef.current.setLocalVideo(!nextCameraOff);
      setIsCallCameraOff(nextCameraOff);
      if (nextCameraOff && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      } else {
        syncDailyTracks();
      }
    }
  };

  const flipCallCamera = async () => {
    if (dailyCallRef.current) {
      try {
        await (dailyCallRef.current as any).cycleCamera();
        syncDailyTracks();
        showGlobalToast('Câmara alternada', 'info');
      } catch (e) {
        console.warn('[useDailyCall] Flip camera note:', e);
      }
    }
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextSpeaker ? 1.0 : 0.2;
    }
    showGlobalToast(nextSpeaker ? 'Altifalante ligado' : 'Altifalante atenuado', 'info');
  };

  return {
    callState,
    setCallState,
    callType,
    setCallType,
    callUser,
    setCallUser,
    callRoomUrl,
    callRoomName,
    isCallMuted,
    isCallCameraOff,
    isSpeakerOn,
    isRemoteCameraOff,
    callDurationSec,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    startOutgoingCall,
    startCall: startOutgoingCall,
    acceptCall,
    declineCall,
    hangUp: handleHangUpLocal,
    endCall: handleHangUpLocal,
    toggleCallMute,
    toggleMute: toggleCallMute,
    toggleCallCamera,
    toggleCamera: toggleCallCamera,
    flipCallCamera,
    toggleSpeaker,
    incomingCallUser: callUser,
    incomingCallType: callType,
    playRingtone,
    stopRingtone,
    playDialtone,
    stopDialtone
  };
}
