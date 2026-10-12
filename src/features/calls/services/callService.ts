import { supabase } from '../../../shared/services/supabaseClient';
import { isOnline } from '../../../shared/services/networkService';

export interface DailyRoomResult {
  roomUrl: string;
  roomName: string;
}

/**
 * Creates or provisions a Daily.co call room via backend API or fallback URL
 */
export async function createDailyRoom(
  currentUserId: string,
  targetId: string,
  type: 'video' | 'audio'
): Promise<DailyRoomResult> {
  const defaultName = `gsi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    const res = await fetch('/api/daily/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: defaultName,
        callType: type,
        callerId: currentUserId,
        receiverId: targetId
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.roomUrl) {
        return { roomUrl: data.roomUrl, roomName: data.roomName || defaultName };
      }
    }
  } catch (e) {
    console.warn('[CallService] Server room creation fallback:', e);
  }

  // Headless peer fallback room
  const fallbackUrl = `https://gsipro.daily.co/${defaultName}`;
  return { roomUrl: fallbackUrl, roomName: defaultName };
}

/**
 * Dispatches call signaling to the recipient's broadcast channel
 */
export async function sendCallSignal(targetUserId: string, payload: any): Promise<void> {
  if (!targetUserId) return;
  const sigChannel = supabase.channel(`call-signals-${targetUserId}`);
  sigChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      try {
        await sigChannel.send({
          type: 'broadcast',
          event: 'signal',
          payload
        });
      } catch (err) {
        console.warn('[CallService] Signal broadcast error:', err);
      } finally {
        setTimeout(() => supabase.removeChannel(sigChannel), 500);
      }
    }
  });
}

/**
 * Records call summary log in the Supabase messages table
 */
export async function recordCallLog(
  senderId: string,
  partnerId: string,
  status: 'missed' | 'declined' | 'completed',
  callType: 'video' | 'audio',
  durationSec?: number,
  roomUrl?: string | null,
  roomName?: string | null
): Promise<void> {
  if (!isOnline() || !partnerId || !senderId) return;

  const durationText = durationSec ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : undefined;
  let summary = '';
  if (status === 'missed') {
    summary = `Chamada de ${callType === 'video' ? 'vídeo' : 'voz'} não atendida`;
  } else if (status === 'declined') {
    summary = `Chamada de ${callType === 'video' ? 'vídeo' : 'voz'} recusada`;
  } else {
    summary = `Chamada de ${callType === 'video' ? 'vídeo' : 'voz'} terminada (${durationText || '0s'})`;
  }

  const messageData = {
    sender_id: senderId,
    receiver_id: partnerId,
    content: summary,
    type: 'call',
    call_status: status,
    call_duration: durationSec || 0,
    created_at: new Date().toISOString()
  };

  try {
    await supabase.from('messages').insert([messageData]);
  } catch (err) {
    console.warn('[CallService] Call log insert note:', err);
  }
}
