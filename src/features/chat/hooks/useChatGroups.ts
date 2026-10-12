import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import { ChatGroup, GroupMember, GroupMessage, ReplyInfo } from '../../../shared/types';
import { 
  fetchChatGroups, 
  fetchGroupMembers, 
  fetchGroupMessages, 
  markGroupAsRead, 
  encodeMessagePayload, 
  parseMessage 
} from '../services/chatService';
import { isOnline } from '../../../shared/services/networkService';
import { triggerMessageReceivedHaptic, triggerLightHaptic } from '../../../shared/lib/haptics';
import { playMessageSentSound, playMessageReceivedSound } from '../../../shared/lib/sounds';

interface UseChatGroupsProps {
  currentUserId: string;
  userName: string;
  userAvatar?: string;
}

export function useChatGroups({
  currentUserId,
  userName,
  userAvatar
}: UseChatGroupsProps) {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);
  const [groupTypingUsers, setGroupTypingUsers] = useState<Record<string, { userName: string; timestamp: number }>>({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);

  const activeGroupChannelRef = useRef<any>(null);

  // Load groups
  const loadGroups = useCallback(async () => {
    const list = await fetchChatGroups(currentUserId);
    setGroups(list);
  }, [currentUserId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Load messages & members when group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setGroupMessages([]);
      setGroupMembers([]);
      return;
    }

    const loadData = async () => {
      setLoadingGroupMessages(true);
      const [msgs, members] = await Promise.all([
        fetchGroupMessages(selectedGroup.id, currentUserId),
        fetchGroupMembers(selectedGroup.id)
      ]);
      setGroupMessages(msgs);
      setGroupMembers(members);
      setLoadingGroupMessages(false);
      markGroupAsRead(selectedGroup.id);
      setGroupUnreadCounts(prev => ({ ...prev, [selectedGroup.id]: 0 }));
    };

    loadData();

    // Subscribe to group channel
    const channel = supabase.channel(`group-${selectedGroup.id}`);
    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const uId = payload?.payload?.userId;
        const uName = payload?.payload?.userName;
        if (uId && uId !== currentUserId) {
          setGroupTypingUsers(prev => ({
            ...prev,
            [uId]: { userName: uName || 'Colega', timestamp: Date.now() }
          }));
          setTimeout(() => {
            setGroupTypingUsers(prev => {
              const copy = { ...prev };
              delete copy[uId];
              return copy;
            });
          }, 3000);
        }
      })
      .on('broadcast', { event: 'new-group-message' }, (payload: any) => {
        const incoming = parseMessage(payload?.payload);
        if (incoming && incoming.sender_id !== currentUserId) {
          setGroupMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          triggerMessageReceivedHaptic();
          playMessageReceivedSound();
          markGroupAsRead(selectedGroup.id);
        }
      })
      .subscribe();

    activeGroupChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroup, currentUserId]);

  const sendGroupMessage = async (
    content: string,
    type: GroupMessage['type'] = 'text',
    mediaUrl?: string
  ) => {
    if (!selectedGroup) return;
    const tempId = `temp-grp-${Date.now()}`;
    const encoded = encodeMessagePayload(content, replyTo, {});

    const optimistic: GroupMessage = {
      id: tempId,
      group_id: selectedGroup.id,
      sender_id: currentUserId,
      content,
      type,
      media_url: mediaUrl,
      reply_to: replyTo || undefined,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        full_name: userName,
        avatar_url: userAvatar,
        role: 'Oficial' as const,
        hourly_rate: 0
      }
    };

    setGroupMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    playMessageSentSound();
    triggerLightHaptic();

    if (!isOnline()) return;

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert([{
          group_id: selectedGroup.id,
          sender_id: currentUserId,
          content: encoded,
          type,
          media_url: mediaUrl
        }])
        .select('*, sender:profiles!group_messages_sender_id_fkey(*)')
        .single();

      if (!error && data) {
        const parsed = parseMessage(data);
        setGroupMessages(prev => prev.map(m => (m.id === tempId ? parsed : m)));
        if (activeGroupChannelRef.current) {
          activeGroupChannelRef.current.send({
            type: 'broadcast',
            event: 'new-group-message',
            payload: data
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[useChatGroups] Send group message error:', err);
    }
  };

  const sendGroupTyping = useCallback(() => {
    if (!activeGroupChannelRef.current || !selectedGroup) return;
    activeGroupChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, userName }
    }).catch(() => {});
  }, [currentUserId, userName, selectedGroup]);

  return {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    groupMessages,
    loadingGroupMessages,
    groupTypingUsers,
    groupUnreadCounts,
    replyTo,
    setReplyTo,
    sendGroupMessage,
    sendGroupTyping,
    reloadGroups: loadGroups
  };
}
