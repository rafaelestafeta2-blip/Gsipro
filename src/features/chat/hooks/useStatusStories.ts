import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';

export interface UserStatus {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'text' | 'image';
  content?: string;
  mediaUrl?: string;
  background?: string;
  caption?: string;
  createdAt: string;
  views?: string[];
}

export function useStatusStories(currentUserId: string, userName: string, userAvatar?: string) {
  const [statuses, setStatuses] = useState<UserStatus[]>(() => {
    try {
      const saved = localStorage.getItem('instachat_statuses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false);
  const [newStatusType, setNewStatusType] = useState<'text' | 'image'>('text');
  const [newStatusContent, setNewStatusContent] = useState('');
  const [newStatusMediaUrl, setNewStatusMediaUrl] = useState('');
  const [newStatusBg, setNewStatusBg] = useState('from-amber-500 to-orange-600');
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [viewingStatusGroup, setViewingStatusGroup] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
    statuses: UserStatus[];
  } | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [isStatusPaused, setIsStatusPaused] = useState(false);
  const [statusReplyInput, setStatusReplyInput] = useState('');

  const loadStatusesFromCloud = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const active: UserStatus[] = data
          .map((st: any) => ({
            id: st.id,
            userId: st.user_id,
            userName: st.user_name || 'Utilizador',
            userAvatar: st.user_avatar,
            type: st.type || 'text',
            content: st.content,
            mediaUrl: st.media_url,
            background: st.background,
            caption: st.caption,
            createdAt: st.created_at,
            views: st.views || []
          }))
          .filter((st: UserStatus) => {
            const age = now - new Date(st.createdAt).getTime();
            return age < twentyFourHours;
          });

        if (active.length > 0) {
          setStatuses(active);
          try {
            localStorage.setItem('instachat_statuses', JSON.stringify(active));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[StatusStories] Cloud fetch error:', err);
    }
  }, []);

  useEffect(() => {
    loadStatusesFromCloud();
  }, [loadStatusesFromCloud]);

  // Story progression timer
  useEffect(() => {
    if (!viewingStatusGroup || isStatusPaused) return;

    const currentGroupStatuses = viewingStatusGroup.statuses;
    const duration = currentGroupStatuses[currentStatusIndex]?.type === 'image' ? 6000 : 5000;

    const timer = setInterval(() => {
      if (currentStatusIndex < currentGroupStatuses.length - 1) {
        setCurrentStatusIndex(prev => prev + 1);
      } else {
        setViewingStatusGroup(null);
        setCurrentStatusIndex(0);
      }
    }, duration);

    return () => clearInterval(timer);
  }, [viewingStatusGroup, currentStatusIndex, isStatusPaused]);

  const postStatus = async () => {
    if (newStatusType === 'text' && !newStatusContent.trim()) return;
    if (newStatusType === 'image' && !newStatusMediaUrl.trim()) return;

    const newStatus: UserStatus = {
      id: 'status-' + Date.now(),
      userId: currentUserId,
      userName: userName,
      userAvatar: userAvatar,
      type: newStatusType,
      content: newStatusType === 'text' ? newStatusContent.trim() : undefined,
      mediaUrl: newStatusType === 'image' ? newStatusMediaUrl.trim() : undefined,
      background: newStatusType === 'text' ? newStatusBg : undefined,
      caption: newStatusType === 'image' ? newStatusCaption.trim() : undefined,
      createdAt: new Date().toISOString(),
      views: []
    };

    const updated = [newStatus, ...statuses];
    setStatuses(updated);
    try {
      localStorage.setItem('instachat_statuses', JSON.stringify(updated));
    } catch {}

    setShowCreateStatusModal(false);
    setNewStatusContent('');
    setNewStatusMediaUrl('');
    setNewStatusCaption('');

    try {
      await supabase.from('statuses').insert([{
        id: newStatus.id,
        user_id: currentUserId,
        user_name: userName,
        user_avatar: userAvatar,
        type: newStatusType,
        content: newStatus.content || null,
        media_url: newStatus.mediaUrl || null,
        background: newStatus.background || null,
        caption: newStatus.caption || null,
        created_at: newStatus.createdAt,
        views: []
      }]);
    } catch (err) {
      console.warn('[StatusStories] Cloud insert error:', err);
    }
  };

  const deleteStatus = async (id: string) => {
    const updated = statuses.filter(s => s.id !== id);
    setStatuses(updated);
    try {
      localStorage.setItem('instachat_statuses', JSON.stringify(updated));
      await supabase.from('statuses').delete().eq('id', id);
    } catch (err) {
      console.warn('[StatusStories] Delete error:', err);
    }
  };

  return {
    statuses,
    showCreateStatusModal,
    setShowCreateStatusModal,
    newStatusType,
    setNewStatusType,
    newStatusContent,
    setNewStatusContent,
    newStatusMediaUrl,
    setNewStatusMediaUrl,
    newStatusBg,
    setNewStatusBg,
    newStatusCaption,
    setNewStatusCaption,
    viewingStatusGroup,
    setViewingStatusGroup,
    currentStatusIndex,
    setCurrentStatusIndex,
    isStatusPaused,
    setIsStatusPaused,
    statusReplyInput,
    setStatusReplyInput,
    postStatus,
    deleteStatus,
    reloadStatuses: loadStatusesFromCloud
  };
}
