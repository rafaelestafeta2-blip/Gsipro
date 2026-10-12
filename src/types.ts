export interface ProfileVisitor {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  visited_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: 'Ajudante' | 'Oficial' | 'Motorista' | 'Encarregado' | 'Mestre de Obra';
  avatar_url?: string;
  banner_url?: string;
  hourly_rate: number;
  current_obra?: string;
  location_city?: string;
  phone?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  gallery_posts?: ProfileGalleryPost[];
  recent_visitors?: ProfileVisitor[];
  is_following?: boolean;
  is_admin?: boolean;
  notification_hour?: number;
  notification_days?: number[]; // 0 for Sunday, 1-6 for Mon-Sat
  updated_at?: string;
  last_seen?: string;
}

export interface Announcement {
  id?: string;
  title?: string;
  subtitle?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'none';
  badge?: string;
  created_at: string;
  user_id: string;
  author_name: string;
}

export interface PollOption {
  id: string;
  text: string;
  image_url?: string;
  votes: string[]; // user_ids who voted for this option
}

export interface PollData {
  question: string;
  options: PollOption[];
  multiple_answers?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface WeatherData {
  city: string;
  region?: string;
  country?: string;
  temp: number;
  feels_like: number;
  condition: string;
  weather_code: number;
  icon: string;
  humidity: number;
  wind_speed: number;
  is_day: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ReplyInfo {
  id: string;
  content: string;
  sender_name?: string;
  sender_id?: string;
  type?: 'text' | 'image' | 'audio' | 'call_log' | 'location' | 'poll' | 'sticker' | 'weather';
  media_url?: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  type?: 'text' | 'image' | 'audio' | 'call_log' | 'location' | 'poll' | 'sticker' | 'weather';
  media_url?: string;
  sticker_info?: {
    id: string;
    url: string;
    title: string;
    category: string;
    emoji: string;
  };
  is_view_once?: boolean;
  view_once_opened?: boolean;
  opened_by?: string[];
  is_deleted?: boolean;
  deleted_for?: string[];
  poll?: PollData;
  location?: LocationData;
  weather?: WeatherData;
  call_info?: {
    type: 'video' | 'audio';
    status: 'missed' | 'declined' | 'completed' | 'cancelled';
    duration?: number;
  };
  reply_to?: ReplyInfo;
  reactions?: Record<string, string[]>; // emoji -> [user_id_1, user_id_2]
  sync_status?: 'synced' | 'pending' | 'sending' | 'failed';
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  rules?: string;
  cover_url: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'location' | 'poll' | 'sticker' | 'weather';
  media_url?: string;
  sticker_info?: {
    id: string;
    url: string;
    title: string;
    category: string;
    emoji: string;
  };
  is_view_once?: boolean;
  view_once_opened?: boolean;
  opened_by?: string[];
  is_deleted?: boolean;
  deleted_for?: string[];
  poll?: PollData;
  location?: LocationData;
  weather?: WeatherData;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  reply_to?: ReplyInfo;
  reactions?: Record<string, string[]>;
  sync_status?: 'synced' | 'pending' | 'sending' | 'failed';
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  author_name: string;
  author_role?: string;
  author_avatar?: string;
  content: string;
  media_type?: 'none' | 'image' | 'video';
  media_url?: string;
  created_at: string;
  likes?: string[]; // user_ids of people who liked
  comments?: SocialComment[];
}

export interface TimeEntry {
  id?: string;
  day: number;
  month: number;
  year: number;
  hours: string;
  obra: string;
  description: string;
  is_absence?: boolean;
  absence_reason?: string;
  created_at?: string;
  user_id: string;
  sync_status?: 'synced' | 'pending_sync';
}

export interface ProfileGalleryComment {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface ProfileGalleryPost {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  image_url: string;
  caption?: string;
  created_at: string;
  likes_count: number;
  liked_by: string[]; // user_ids
  comments_count: number;
  comments: ProfileGalleryComment[];
  is_saved?: boolean;
}
