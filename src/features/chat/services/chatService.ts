import { supabase } from '../../../shared/services/supabaseClient';
import { 
  Profile, 
  Message, 
  Block, 
  ChatGroup, 
  GroupMember, 
  GroupMessage, 
  ReplyInfo, 
  PollData, 
  LocationData, 
  WeatherData 
} from '../../../shared/types';
import { isOnline } from '../../../shared/services/networkService';
import { addToQueue } from '../../../shared/services/offlineSyncService';
import { precacheMediaUrls } from '../../../shared/services/mediaCacheService';

/**
 * Parses message metadata encoded into the content string
 */
export function parseMessage(msg: any): any {
  if (!msg) return msg;
  let content = msg.content || '';
  let reply_to = msg.reply_to;
  let reactions = msg.reactions;
  let is_view_once = msg.is_view_once || false;
  let view_once_opened = msg.view_once_opened || false;
  let opened_by: string[] = msg.opened_by || [];
  let is_deleted = msg.is_deleted || false;
  let deleted_for: string[] = msg.deleted_for || [];
  let poll: PollData | undefined = msg.poll;
  let location: LocationData | undefined = msg.location;
  let weather: WeatherData | undefined = msg.weather;

  // 1. Parse metadata embedded in content
  if (typeof content === 'string' && content.includes('\n__GSI_META__')) {
    const parts = content.split('\n__GSI_META__');
    content = parts[0];
    try {
      const parsed = JSON.parse(parts[1]);
      if (parsed.reply_to && !reply_to) reply_to = parsed.reply_to;
      if (parsed.reactions) {
        if (!reactions || Object.keys(reactions).length === 0) {
          reactions = parsed.reactions;
        } else {
          const merged = { ...reactions };
          Object.entries(parsed.reactions).forEach(([emoji, uids]: [string, any]) => {
            if (Array.isArray(uids)) {
              merged[emoji] = Array.from(new Set([...(merged[emoji] || []), ...uids]));
            }
          });
          reactions = merged;
        }
      }
      if (parsed.is_view_once !== undefined) is_view_once = parsed.is_view_once;
      if (parsed.view_once_opened !== undefined) view_once_opened = parsed.view_once_opened;
      if (Array.isArray(parsed.opened_by)) opened_by = parsed.opened_by;
      if (parsed.is_deleted !== undefined) is_deleted = parsed.is_deleted;
      if (Array.isArray(parsed.deleted_for)) deleted_for = parsed.deleted_for;
      if (parsed.poll) poll = parsed.poll;
      if (parsed.location) location = parsed.location;
      if (parsed.weather) weather = parsed.weather;
      if (parsed.type) msg.type = parsed.type;
    } catch {}
  }

  // 2. Check if content itself says it was deleted
  if (content === '🚫 Esta mensagem foi apagada' || content === 'Esta mensagem foi apagada') {
    is_deleted = true;
  }

  // 3. LocalStorage Fallback & Merge
  if (!reply_to && msg.id) {
    try {
      const storedReply = localStorage.getItem(`gsi_reply_${msg.id}`);
      if (storedReply) reply_to = JSON.parse(storedReply);
    } catch {}
  }
  if (msg.id) {
    try {
      const storedReactionsStr = localStorage.getItem(`gsi_reactions_${msg.id}`);
      if (storedReactionsStr) {
        const storedReactions = JSON.parse(storedReactionsStr);
        if (!reactions || Object.keys(reactions).length === 0) {
          reactions = storedReactions;
        } else {
          const merged = { ...reactions };
          Object.entries(storedReactions).forEach(([emoji, uids]: [string, any]) => {
            if (Array.isArray(uids)) {
              merged[emoji] = Array.from(new Set([...(merged[emoji] || []), ...uids]));
            }
          });
          reactions = merged;
        }
      }
    } catch {}
  }

  return {
    ...msg,
    content,
    reply_to,
    reactions: reactions || {},
    is_view_once,
    view_once_opened,
    opened_by,
    is_deleted,
    deleted_for,
    poll,
    location,
    weather
  };
}

/**
 * Encodes extra message metadata into content string for persistence
 */
export function encodeMessagePayload(
  rawContent: string,
  replyTo?: ReplyInfo | null,
  reactions?: Record<string, string[]>,
  metaExt: {
    is_view_once?: boolean;
    view_once_opened?: boolean;
    opened_by?: string[];
    is_deleted?: boolean;
    deleted_for?: string[];
    poll?: PollData;
    location?: LocationData;
    weather?: WeatherData;
    type?: string;
    [key: string]: any;
  } = {}
): string {
  let text = rawContent || '';
  if (text.includes('\n__GSI_META__')) {
    text = text.split('\n__GSI_META__')[0];
  }
  const meta: any = { ...metaExt };
  if (replyTo) meta.reply_to = replyTo;
  if (reactions && Object.keys(reactions).length > 0) meta.reactions = reactions;
  if (Object.keys(meta).length > 0) {
    text += `\n__GSI_META__${JSON.stringify(meta)}`;
  }
  return text;
}

/**
 * Fetch messages between current user and target user
 */
export async function fetchDirectMessages(currentUserId: string, targetUserId: string): Promise<Message[]> {
  if (!currentUserId || !targetUserId) return [];
  const cacheKey = `gsi_chat_cache_${targetUserId}`;

  let cachedMessages: Message[] = [];
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      cachedMessages = JSON.parse(cached);
    }
  } catch {}

  if (!isOnline()) return cachedMessages;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[ChatService] Error fetching direct messages:', error);
      return cachedMessages;
    }

    if (data) {
      const clearedKey = `gsi_cleared_chat_${currentUserId}_${targetUserId}`;
      const clearedTime = typeof window !== 'undefined' ? localStorage.getItem(clearedKey) : null;

      const parsed = data.map(parseMessage).filter((msg: any) => {
        if (msg.deleted_for && Array.isArray(msg.deleted_for) && msg.deleted_for.includes(currentUserId)) {
          return false;
        }
        if (typeof window !== 'undefined' && localStorage.getItem(`gsi_deleted_msg_${msg.id}`) === 'true') {
          return false;
        }
        if (clearedTime && new Date(msg.created_at) <= new Date(clearedTime)) {
          return false;
        }
        return true;
      });

      const mediaUrlsToPrecache = parsed
        .filter((msg: any) => msg.type === 'image' || (msg.media_url && typeof msg.media_url === 'string'))
        .map((msg: any) => msg.media_url);
      precacheMediaUrls(mediaUrlsToPrecache);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch {}

      return parsed;
    }
  } catch (err) {
    console.warn('[ChatService] Error querying direct messages:', err);
  }

  return cachedMessages;
}

/**
 * Fetch messages for a group
 */
export async function fetchGroupMessages(groupId: string, currentUserId: string): Promise<GroupMessage[]> {
  if (!groupId) return [];
  const cacheKey = `gsi_group_chat_cache_${groupId}`;

  let cachedMessages: GroupMessage[] = [];
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      cachedMessages = JSON.parse(cached);
    }
  } catch {}

  if (!isOnline()) return cachedMessages;

  try {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, sender:profiles!group_messages_sender_id_fkey(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const parsed = data.map(parseMessage).filter((msg: any) => {
        if (msg.deleted_for && Array.isArray(msg.deleted_for) && msg.deleted_for.includes(currentUserId)) {
          return false;
        }
        if (typeof window !== 'undefined' && localStorage.getItem(`gsi_deleted_msg_${msg.id}`) === 'true') {
          return false;
        }
        return true;
      });

      const mediaUrlsToPrecache = parsed
        .filter((msg: any) => msg.type === 'image' || (msg.media_url && typeof msg.media_url === 'string'))
        .map((msg: any) => msg.media_url);
      precacheMediaUrls(mediaUrlsToPrecache);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch {}

      return parsed;
    }
  } catch (err) {
    console.warn('[ChatService] Error querying group messages:', err);
  }

  return cachedMessages;
}

/**
 * Fetch unread counts for 1-on-1 chats
 */
export async function fetchUnreadCounts(currentUserId: string): Promise<Record<string, number>> {
  if (!currentUserId || !isOnline()) return {};
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      return counts;
    }
  } catch (err) {
    console.warn('[ChatService] Error fetching unread counts:', err);
  }
  return {};
}

/**
 * Fetch unread counts for groups
 */
export async function fetchGroupUnreadCounts(
  groups: ChatGroup[], 
  currentUserId: string
): Promise<Record<string, number>> {
  if (!groups || groups.length === 0 || !isOnline()) return {};
  const counts: Record<string, number> = {};
  try {
    await Promise.all(groups.map(async (group) => {
      const lastReadStr = localStorage.getItem(`gsi_last_read_time_${group.id}`);
      const lastReadTime = lastReadStr || new Date(0).toISOString();

      const { count, error } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .gt('created_at', lastReadTime)
        .neq('sender_id', currentUserId);

      if (!error && count !== null) {
        counts[group.id] = count;
      }
    }));
  } catch (err) {
    console.warn('[ChatService] Error fetching group unread counts:', err);
  }
  return counts;
}

/**
 * Mark messages as read from a sender
 */
export async function markDirectMessagesAsRead(senderId: string, currentUserId: string): Promise<void> {
  if (!senderId || !currentUserId) return;
  try {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
  } catch (err) {
    console.warn('[ChatService] Error marking messages read:', err);
  }
}

/**
 * Mark group messages as read
 */
export function markGroupAsRead(groupId: string): void {
  if (!groupId) return;
  try {
    localStorage.setItem(`gsi_last_read_time_${groupId}`, new Date().toISOString());
  } catch {}
}

/**
 * Fetch chat groups for user
 */
export async function fetchChatGroups(currentUserId: string): Promise<ChatGroup[]> {
  try {
    const { data: memData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', currentUserId);

    const memSet = new Set(memData?.map(m => m.group_id) || []);

    const { data: groupData, error } = await supabase
      .from('chat_groups')
      .select('*, group_members(count)');

    if (!error && groupData) {
      const userJoinedGroups = groupData.filter(g => memSet.has(g.id));
      const mapped = userJoinedGroups.map(g => ({
        ...g,
        member_count: g.group_members?.[0]?.count || 0
      }));
      try { localStorage.setItem('gsi_cached_groups', JSON.stringify(mapped)); } catch {}
      return mapped;
    }
  } catch (err) {
    console.warn('[ChatService] Error fetching groups:', err);
  }

  try {
    const cached = localStorage.getItem('gsi_cached_groups');
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

/**
 * Fetch group members with profiles
 */
export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  if (!groupId) return [];
  try {
    const { data: members, error: mError } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, role, joined_at')
      .eq('group_id', groupId);

    if (mError) throw mError;

    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      return members.map(m => ({
        ...m,
        profile: profs?.find(p => p.id === m.user_id) || {
          id: m.user_id,
          full_name: 'Colega',
          role: 'Oficial' as const,
          hourly_rate: 0
        }
      }));
    }
  } catch (err) {
    console.warn('[ChatService] Error fetching group members:', err);
  }
  return [];
}

/**
 * Create a new chat group
 */
export async function createChatGroup(
  name: string,
  description: string,
  coverUrl: string,
  isPrivate: boolean,
  creatorId: string
): Promise<ChatGroup | null> {
  try {
    const { data: newGroup, error: groupErr } = await supabase
      .from('chat_groups')
      .insert([{
        name: name.trim(),
        description: description.trim() || 'Grupo de trabalho GSI',
        cover_url: coverUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=400&q=80',
        created_by: creatorId,
        is_private: isPrivate
      }])
      .select()
      .single();

    if (groupErr || !newGroup) throw groupErr;

    // Add creator as admin
    await supabase.from('group_members').insert([{
      group_id: newGroup.id,
      user_id: creatorId,
      role: 'admin'
    }]);

    return { ...newGroup, member_count: 1 };
  } catch (err) {
    console.error('[ChatService] Error creating group:', err);
    return null;
  }
}

/**
 * Fetch blocks
 */
export async function fetchBlocks(currentUserId: string): Promise<{ myBlocks: Block[]; blockedBy: Block[] }> {
  try {
    const [blocksRes, blockedByRes] = await Promise.all([
      supabase.from('blocks').select('*').eq('blocker_id', currentUserId),
      supabase.from('blocks').select('*').eq('blocked_id', currentUserId)
    ]);
    return {
      myBlocks: blocksRes.data || [],
      blockedBy: blockedByRes.data || []
    };
  } catch (err) {
    console.warn('[ChatService] Error fetching blocks:', err);
    return { myBlocks: [], blockedBy: [] };
  }
}

/**
 * Block user
 */
export async function blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('blocks').insert([{
      blocker_id: currentUserId,
      blocked_id: targetUserId
    }]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Unblock user
 */
export async function unblockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', targetUserId);
    return !error;
  } catch {
    return false;
  }
}
