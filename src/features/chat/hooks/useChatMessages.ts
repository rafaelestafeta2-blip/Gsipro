import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import { Message, Profile, ReplyInfo, PollData, LocationData, WeatherData } from '../../../shared/types';
import { 
  fetchDirectMessages, 
  markDirectMessagesAsRead, 
  encodeMessagePayload, 
  parseMessage 
} from '../services/chatService';
import { isOnline } from '../../../shared/services/networkService';
import { addToQueue } from '../../../shared/services/offlineSyncService';
import { triggerMessageReceivedHaptic, triggerLightHaptic } from '../../../shared/lib/haptics';
import { playMessageSentSound, playMessageReceivedSound } from '../../../shared/lib/sounds';

interface UseChatMessagesProps {
  currentUserId: string;
  userName: string;
  selectedUser: Profile | null;
  onNewIncomingMessage?: (msg: Message) => void;
}

export function useChatMessages({
  currentUserId,
  userName,
  selectedUser,
  onNewIncomingMessage
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);

  const selectedUserRef = useRef(selectedUser);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  const activeChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load messages when selected user changes
  const loadMessages = useCallback(async () => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const msgs = await fetchDirectMessages(currentUserId, selectedUser.id);
    setMessages(msgs);
    setLoadingMessages(false);
    await markDirectMessagesAsRead(selectedUser.id, currentUserId);
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription for direct messages & typing
  useEffect(() => {
    if (!selectedUser) return;
    const channelName = `dm-${[currentUserId, selectedUser.id].sort().join('-')}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.payload?.userId === selectedUser.id) {
          setIsPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      })
      .on('broadcast', { event: 'new-message' }, (payload: any) => {
        const incoming = parseMessage(payload?.payload);
        if (incoming && incoming.sender_id === selectedUser.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          markDirectMessagesAsRead(selectedUser.id, currentUserId);
          triggerMessageReceivedHaptic();
          playMessageReceivedSound();
          if (onNewIncomingMessage) onNewIncomingMessage(incoming);
        }
      })
      .subscribe();

    activeChannelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUser, onNewIncomingMessage]);

  const sendTypingIndicator = useCallback(() => {
    if (!activeChannelRef.current || !selectedUser) return;
    activeChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId }
    }).catch(() => {});
  }, [currentUserId, selectedUser]);

  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    extraMeta: {
      is_view_once?: boolean;
      poll?: PollData;
      location?: LocationData;
      weather?: WeatherData;
    } = {}
  ) => {
    if (!selectedUser) return;
    const tempId = `temp-${Date.now()}`;
    const encoded = encodeMessagePayload(content, replyTo, {}, extraMeta);

    const optimistic: Message = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content,
      type,
      media_url: mediaUrl,
      reply_to: replyTo || undefined,
      is_view_once: extraMeta.is_view_once || false,
      poll: extraMeta.poll,
      location: extraMeta.location,
      weather: extraMeta.weather,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    playMessageSentSound();
    triggerLightHaptic();

    if (!isOnline()) {
      addToQueue('message', {
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: encoded,
        type,
        media_url: mediaUrl
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content: encoded,
          type,
          media_url: mediaUrl,
          is_read: false
        }])
        .select()
        .single();

      if (!error && data) {
        const parsed = parseMessage(data);
        setMessages(prev => prev.map(m => (m.id === tempId ? parsed : m)));
        if (activeChannelRef.current) {
          activeChannelRef.current.send({
            type: 'broadcast',
            event: 'new-message',
            payload: data
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[useChatMessages] Send error:', err);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    const target = messages.find(m => m.id === messageId);
    if (!target) return;

    const currentReactions = { ...(target.reactions || {}) };
    const userList = currentReactions[emoji] || [];
    const hasReacted = userList.includes(currentUserId);

    if (hasReacted) {
      currentReactions[emoji] = userList.filter(uid => uid !== currentUserId);
      if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
    } else {
      currentReactions[emoji] = [...userList, currentUserId];
    }

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: currentReactions } : m));

    const encoded = encodeMessagePayload(
      target.content,
      target.reply_to,
      currentReactions,
      {
        is_view_once: target.is_view_once,
        view_once_opened: target.view_once_opened,
        opened_by: target.opened_by,
        is_deleted: target.is_deleted,
        deleted_for: target.deleted_for,
        poll: target.poll,
        location: target.location,
        weather: target.weather,
        type: target.type
      }
    );

    try {
      await supabase.from('messages').update({ content: encoded }).eq('id', messageId);
    } catch (err) {
      console.warn('[useChatMessages] Reaction update error:', err);
    }
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (forEveryone) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true, content: '🚫 Esta mensagem foi apagada' } : m));
      try {
        const encoded = encodeMessagePayload('🚫 Esta mensagem foi apagada', null, {}, { is_deleted: true });
        await supabase.from('messages').update({ content: encoded }).eq('id', messageId);
      } catch {}
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      try {
        localStorage.setItem(`gsi_deleted_msg_${messageId}`, 'true');
      } catch {}
    }
  };

  return {
    messages,
    loadingMessages,
    isPartnerTyping,
    replyTo,
    setReplyTo,
    sendMessage,
    toggleReaction,
    deleteMessage,
    sendTypingIndicator,
    reloadMessages: loadMessages
  };
}
