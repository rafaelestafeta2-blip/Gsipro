import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import { Profile, TimeEntry, ProfileGalleryPost, ProfileGalleryComment, ProfileVisitor } from '../../../shared/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, LogOut, Save, Phone, Euro, HardHat, Settings, Briefcase, Camera, Upload, 
  Loader2, Calendar as CalendarIcon, MapPin, ChevronRight, Home as HomeIcon, Download, 
  ChevronLeft, X, Clock, Trash2, Palette, Heart, MessageCircle, Bookmark, Plus, 
  Grid, Edit3, Share2, Send, FileText, Sparkles, Check, Users, UserCheck, ShieldCheck,
  Eye, ZoomIn
} from 'lucide-react';
import SettingsView from '../../settings/components/SettingsView';
import ReportTemplate from '../../clock/components/ReportTemplate';
import MediaLightboxModal from '../../../shared/components/MediaLightboxModal';
import { InstaChatIcon } from '../../../shared/components/InstaChatLogo';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toJpeg } from 'html-to-image';
import { shareContent } from '../../../shared/lib/shareService';
import { triggerSuccessHaptic, triggerLightHaptic, triggerWarningHaptic } from '../../../shared/lib/haptics';
import { isOnline } from '../../../shared/services/networkService';
import { addToQueue } from '../../../shared/services/offlineSyncService';
import { useAppTheme } from '../../../shared/lib/theme';
import { captureNativePhoto } from '../../../shared/lib/cameraService';
import { Capacitor } from '@capacitor/core';
import { getUserDisplayName, getUserCurrentObra, DEFAULT_WORK_HOURS } from '../../../shared/services/profileService';

// Default initial sample posts for Instagram-style 3x3 grid
const INITIAL_SAMPLE_POSTS: ProfileGalleryPost[] = [
  {
    id: 'post-1',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop',
    caption: 'Início do assentamento de estrutura de betão na obra de Lisboa. Rigor e qualidade em primeiro lugar! 🏗️👷‍♂️',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    likes_count: 38,
    liked_by: ['user-2', 'user-3'],
    comments_count: 5,
    comments: [
      { id: 'c1', user_id: 'u1', author_name: 'António Silva', author_avatar: '', content: 'Excelente alinhamento, Mário! Bom trabalho.', created_at: new Date(Date.now() - 3600000 * 20).toISOString() },
      { id: 'c2', user_id: 'u2', author_name: 'Rui Santos', author_avatar: '', content: 'Top! Amanhã levo a betoneira nova.', created_at: new Date(Date.now() - 3600000 * 18).toISOString() }
    ],
    is_saved: true
  },
  {
    id: 'post-2',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
    caption: 'Aferição de nível laser e segurança no estaleiro. Equipa GSI no terreno! 📐⚡',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    likes_count: 52,
    liked_by: [],
    comments_count: 3,
    comments: [
      { id: 'c3', user_id: 'u3', author_name: 'João Mestre', author_avatar: '', content: 'A segurança é sempre prioridade.', created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString() }
    ],
    is_saved: false
  },
  {
    id: 'post-3',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop',
    caption: 'Fim de tarde na remodelação do piso superior. Mais um dia de metas cumpridas! 🌅🔨',
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    likes_count: 41,
    liked_by: [],
    comments_count: 2,
    comments: [],
    is_saved: true
  },
  {
    id: 'post-4',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop',
    caption: 'Café da manhã reforçado com os colegas antes da betonagem. União da equipa! ☕🥐',
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    likes_count: 67,
    liked_by: [],
    comments_count: 8,
    comments: [],
    is_saved: false
  },
  {
    id: 'post-5',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop',
    caption: 'Projeto arquitetónico aprovado e pronto para a próxima fase. Mãos à obra! 📋🏢',
    created_at: new Date(Date.now() - 3600000 * 24 * 16).toISOString(),
    likes_count: 89,
    liked_by: [],
    comments_count: 12,
    comments: [],
    is_saved: true
  },
  {
    id: 'post-6',
    user_id: 'sample-user',
    author_name: 'Mário Ferreira',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    image_url: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&auto=format&fit=crop',
    caption: 'Entrega de chaves e vistoria final com aprovação a 100%. Orgulho da equipa! 🔑🏆',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    likes_count: 104,
    liked_by: [],
    comments_count: 15,
    comments: [],
    is_saved: false
  }
];

const DEFAULT_SAMPLE_VISITORS: ProfileVisitor[] = [];

const formatVisitTime = (visitedAt: string) => {
  try {
    const date = new Date(visitedAt);
    if (isNaN(date.getTime())) return 'recentemente';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  } catch {
    return 'recentemente';
  }
};

export default function ProfileView({ 
  userId, 
  currentUserId,
  isDarkMode = true,
  onProfileUpdate,
  onBack
}: { 
  userId: string, 
  currentUserId?: string,
  isDarkMode?: boolean,
  onProfileUpdate?: (profile: Partial<Profile>) => void,
  onBack?: () => void
}) {
  const { activeTheme } = useAppTheme();
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const cached = localStorage.getItem(`instachat_profile_${userId}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(!profile);
  const [showSettings, setShowSettings] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    try {
      const today = new Date();
      const localKey = `entries_${today.getMonth()}_${today.getFullYear()}`;
      const cached = localStorage.getItem(localKey);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [viewDate, setViewDate] = useState(new Date());
  const [exporting, setExporting] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  
  // Social Network Features State
  const [bio, setBio] = useState(() => {
    return localStorage.getItem(`instachat_bio_${userId}`) || '';
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(() => {
    const saved = localStorage.getItem(`instachat_followers_count_${userId}`);
    return saved ? Number(saved) : 0;
  });
  const [followingCount, setFollowingCount] = useState(() => {
    const saved = localStorage.getItem(`instachat_following_count_${userId}`);
    return saved ? Number(saved) : 0;
  });
  const [activeTab, setActiveTab] = useState<'gallery' | 'saved' | 'entries'>('gallery');

  // Gallery Posts State
  const [posts, setPosts] = useState<ProfileGalleryPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ProfileGalleryPost | null>(null);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostUploading, setNewPostUploading] = useState(false);
  
  // Lightbox Comments
  const [commentText, setCommentText] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Profile Cover Banner Modal State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Check if viewing own profile
  const isOwnProfile = !userId || userId === currentUserId || (profile?.id && currentUserId && profile.id === currentUserId) || (profile?.id && userId && profile.id === userId);

  // Time Entries Editing - Default 9 hours as required
  const [selectedDayEntry, setSelectedDayEntry] = useState<{ day: number, entry?: TimeEntry } | null>(null);
  const [editHours, setEditHours] = useState('9');
  const [editObra, setEditObra] = useState('');
  const [editIsAbsence, setEditIsAbsence] = useState(false);
  const [editAbsenceReason, setEditAbsenceReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Profile Visitors State
  const [recentVisitors, setRecentVisitors] = useState<ProfileVisitor[]>([]);
  const [showVisitorsModal, setShowVisitorsModal] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Profile data & social network sync (runs on user change only, NOT on month change)
  useEffect(() => {
    getProfile();
    loadPostsAndSocialData();
    checkFollowStatusAndSync();
    handleVisitorTracking();
  }, [userId, currentUserId]);

  // Monthly time entries sync (runs when viewDate or userId changes)
  useEffect(() => {
    getEntries();
  }, [userId, viewDate]);

  const handleVisitorTracking = async () => {
    try {
      const cached = localStorage.getItem(`instachat_visitors_${userId}`);
      let currentVisitors: ProfileVisitor[] = cached ? JSON.parse(cached) : DEFAULT_SAMPLE_VISITORS;

      if (currentUserId && currentUserId !== userId) {
        let visitorName = 'Utilizador Conectado';
        let visitorAvatar = '';
        let visitorRole = 'Colaborador';

        if (isOnline()) {
          const { data: vProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', currentUserId)
            .single();
          if (vProfile) {
            if (vProfile.full_name) visitorName = vProfile.full_name;
            if (vProfile.avatar_url) visitorAvatar = vProfile.avatar_url;
            if (vProfile.role) visitorRole = vProfile.role;
          }
        }

        const newVisit: ProfileVisitor = {
          id: currentUserId,
          full_name: visitorName,
          avatar_url: visitorAvatar,
          role: visitorRole,
          visited_at: new Date().toISOString()
        };

        const filtered = currentVisitors.filter(v => v.id !== currentUserId);
        currentVisitors = [newVisit, ...filtered].slice(0, 10);

        localStorage.setItem(`instachat_visitors_${userId}`, JSON.stringify(currentVisitors));

        if (isOnline()) {
          await supabase.from('profiles').update({
            recent_visitors: currentVisitors,
            updated_at: new Date().toISOString()
          }).eq('id', userId);
        }
      }

      setRecentVisitors(currentVisitors);
    } catch (err) {
      console.warn('Error tracking visitors:', err);
      setRecentVisitors(DEFAULT_SAMPLE_VISITORS);
    }
  };

  const checkFollowStatusAndSync = async () => {
    if (!currentUserId || currentUserId === userId) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();

      if (!error && data) {
        setIsFollowing(true);
        localStorage.setItem(`instachat_is_following_${userId}`, 'true');
      } else if (!error && !data) {
        setIsFollowing(false);
        localStorage.setItem(`instachat_is_following_${userId}`, 'false');
      } else {
        const storedFollowing = localStorage.getItem(`instachat_is_following_${userId}`);
        if (storedFollowing !== null) setIsFollowing(storedFollowing === 'true');
      }
    } catch {
      const storedFollowing = localStorage.getItem(`instachat_is_following_${userId}`);
      if (storedFollowing !== null) setIsFollowing(storedFollowing === 'true');
    }
  };

  const loadPostsAndSocialData = () => {
    try {
      // Bio local cache
      const storedBio = localStorage.getItem(`instachat_bio_${userId}`);
      if (storedBio !== null) setBio(storedBio);

      // Follower state
      const storedFollowing = localStorage.getItem(`instachat_is_following_${userId}`);
      if (storedFollowing !== null) setIsFollowing(storedFollowing === 'true');

      // Gallery Posts cache
      const storedPosts = localStorage.getItem(`instachat_posts_${userId}`);
      if (storedPosts) {
        const parsed = JSON.parse(storedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
          return;
        }
      }
      if (isOwnProfile) {
        setPosts(INITIAL_SAMPLE_POSTS);
        localStorage.setItem(`instachat_posts_${userId}`, JSON.stringify(INITIAL_SAMPLE_POSTS));
      } else {
        setPosts([]);
      }
    } catch {
      setPosts(isOwnProfile ? INITIAL_SAMPLE_POSTS : []);
    }
  };

  const syncPostsToCloud = async (updatedPosts: ProfileGalleryPost[]) => {
    localStorage.setItem(`instachat_posts_${userId}`, JSON.stringify(updatedPosts));
    if (isOnline()) {
      try {
        await supabase.from('profiles').update({
          gallery_posts: updatedPosts,
          posts_count: updatedPosts.length,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        console.warn('Cloud posts sync pending offline:', err);
      }
    }
  };

  const handleSaveBanner = async (newBannerUrl: string) => {
    triggerLightHaptic();
    setSavingBanner(true);
    try {
      const updatedProfile = { ...(profile || {} as Profile), banner_url: newBannerUrl };
      setProfile(updatedProfile as Profile);
      localStorage.setItem(`instachat_profile_${userId}`, JSON.stringify(updatedProfile));
      if (onProfileUpdate) onProfileUpdate({ banner_url: newBannerUrl });

      if (isOnline()) {
        await supabase.from('profiles').update({
          banner_url: newBannerUrl,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      }
      triggerSuccessHaptic();
      setIsBannerModalOpen(false);
    } catch (err) {
      console.warn('Error saving banner to cloud:', err);
      triggerSuccessHaptic();
      setIsBannerModalOpen(false);
    } finally {
      setSavingBanner(false);
    }
  };

  const getProfile = async () => {
    try {
      const cached = localStorage.getItem(`instachat_profile_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setProfile(parsed);
          setLoading(false);
        }
      }
    } catch {}

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
        localStorage.setItem(`instachat_profile_${userId}`, JSON.stringify(data));
        if (data.current_obra) {
          localStorage.setItem(`gsi_current_obra_${userId}`, data.current_obra);
        }
        const currentBio = data.bio || localStorage.getItem(`instachat_bio_${userId}`) || 'Oficial de Construção Civil • Apaixonado por grandes estruturas e trabalho de equipa na obra. 🏗️⚡';
        setBio(currentBio);
        if (data.followers_count !== undefined) setFollowersCount(data.followers_count);
        if (data.following_count !== undefined) setFollowingCount(data.following_count);
        if (Array.isArray(data.gallery_posts) && data.gallery_posts.length > 0) {
          setPosts(data.gallery_posts);
          localStorage.setItem(`instachat_posts_${userId}`, JSON.stringify(data.gallery_posts));
        }
        if (Array.isArray(data.recent_visitors) && data.recent_visitors.length > 0) {
          setRecentVisitors(data.recent_visitors);
          localStorage.setItem(`instachat_visitors_${userId}`, JSON.stringify(data.recent_visitors));
        }
      } else {
        const fallbackBio = localStorage.getItem(`instachat_bio_${userId}`) || 'Oficial de Construção Civil • Apaixonado por grandes estruturas e trabalho de equipa na obra. 🏗️⚡';
        setBio(fallbackBio);
      }
    } catch {
      const fallbackBio = localStorage.getItem(`instachat_bio_${userId}`) || 'Oficial de Construção Civil • Apaixonado por grandes estruturas e trabalho de equipa na obra. 🏗️⚡';
      setBio(fallbackBio);
    } finally {
      setLoading(false);
    }
  };

  const getEntries = async () => {
    const localKey = `entries_${viewDate.getMonth()}_${viewDate.getFullYear()}`;
    try {
      const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (Array.isArray(localData) && localData.length > 0) {
        setEntries(localData);
      }
    } catch {}

    if (!isOnline()) return;

    try {
      const { data } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('month', viewDate.getMonth())
        .eq('year', viewDate.getFullYear())
        .order('day', { ascending: false });

      if (data) {
        setEntries(data);
        localStorage.setItem(localKey, JSON.stringify(data));
      }
    } catch {}
  };

  // Follow / Unfollow Toggle
  const toggleFollow = async () => {
    triggerLightHaptic();
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    const nextCount = nextState ? followersCount + 1 : Math.max(0, followersCount - 1);
    setFollowersCount(nextCount);
    localStorage.setItem(`instachat_is_following_${userId}`, String(nextState));
    localStorage.setItem(`instachat_followers_count_${userId}`, String(nextCount));

    if (isOnline()) {
      try {
        if (nextState) {
          await supabase.from('follows').insert([{ follower_id: currentUserId, following_id: userId }]);
        } else {
          await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
        }

        await supabase.from('profiles').update({
          followers_count: nextCount,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        console.warn('Could not sync followers_count to cloud:', err);
      }
    }
    triggerSuccessHaptic();
  };

  // Delete Photo from Profile Gallery
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tens a certeza que pretendes eliminar esta fotografia da tua galeria?')) return;
    triggerLightHaptic();
    const updated = posts.filter(p => p.id !== postId);
    setPosts(updated);
    setSelectedPost(null);
    await syncPostsToCloud(updated);
    triggerSuccessHaptic();
  };

  // Upload photo for New Post
  const handleSelectNewPostPhoto = async (e?: React.ChangeEvent<HTMLInputElement>, nativeFile?: File) => {
    let file = nativeFile || (e?.target.files && e.target.files[0]);
    if (!file && Capacitor.isNativePlatform()) {
      file = await captureNativePhoto('photos') || undefined;
    }
    if (!file) return;

    setNewPostUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPostImage(event.target?.result as string);
        setNewPostUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setNewPostUploading(false);
    }
  };

  // Create New Photo Post
  const handlePublishPost = async () => {
    if (!newPostImage) {
      alert('Por favor seleciona uma fotografia para publicar.');
      return;
    }
    triggerLightHaptic();

    const newPostItem: ProfileGalleryPost = {
      id: `post-${Date.now()}`,
      user_id: userId,
      author_name: profile?.full_name || 'Mário Ferreira',
      author_avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      image_url: newPostImage,
      caption: newPostCaption.trim(),
      created_at: new Date().toISOString(),
      likes_count: 1,
      liked_by: [userId],
      comments_count: 0,
      comments: [],
      is_saved: false
    };

    const updatedPosts = [newPostItem, ...posts];
    setPosts(updatedPosts);
    await syncPostsToCloud(updatedPosts);

    setNewPostImage('');
    setNewPostCaption('');
    setIsNewPostOpen(false);
    triggerSuccessHaptic();
  };

  // Like / Heart Post Toggle
  const toggleLikePost = async (postId: string) => {
    triggerLightHaptic();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const hasLiked = p.liked_by.includes(userId);
        const nextLikedBy = hasLiked ? p.liked_by.filter(id => id !== userId) : [...p.liked_by, userId];
        const nextLikesCount = hasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1;
        const updatedPost = { ...p, liked_by: nextLikedBy, likes_count: nextLikesCount };
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
        return updatedPost;
      }
      return p;
    });
    setPosts(updated);
    await syncPostsToCloud(updated);
  };

  // Toggle Save / Bookmark
  const toggleSavePost = async (postId: string) => {
    triggerLightHaptic();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const nextSaved = !p.is_saved;
        const updatedPost = { ...p, is_saved: nextSaved };
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
        return updatedPost;
      }
      return p;
    });
    setPosts(updated);
    await syncPostsToCloud(updated);
  };

  // Add Comment to Post
  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    triggerLightHaptic();

    const newComment: ProfileGalleryComment = {
      id: `comm-${Date.now()}`,
      user_id: userId,
      author_name: profile?.full_name || 'Utilizador GSI',
      author_avatar: profile?.avatar_url || '',
      content: commentText.trim(),
      created_at: new Date().toISOString()
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        const nextComments = [...p.comments, newComment];
        const updatedPost = {
          ...p,
          comments: nextComments,
          comments_count: nextComments.length
        };
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
        return updatedPost;
      }
      return p;
    });

    setPosts(updated);
    await syncPostsToCloud(updated);
    setCommentText('');
    triggerSuccessHaptic();
  };

  const handleDayClick = (day: number, entry?: TimeEntry) => {
    setSelectedDayEntry({ day, entry });
    const formattedHours = entry ? (entry.hours.includes(':') ? entry.hours.split(':')[0] : entry.hours) : '9';
    setEditHours(formattedHours);
    const prefilledObra = entry?.obra || getUserCurrentObra(profile) || '';
    setEditObra(prefilledObra);
    setEditIsAbsence(entry?.is_absence || false);
    setEditAbsenceReason(entry?.absence_reason || '');
  };

  const saveEntryEdit = async () => {
    if (!selectedDayEntry) return;
    setSavingEdit(true);
    
    const isOfflineNow = !isOnline();
    const finalObra = editIsAbsence 
      ? 'FALTA' 
      : (editObra.trim() || getUserCurrentObra(profile) || 'OBRA PRINCIPAL').toUpperCase();

    const newEntry: TimeEntry = {
      user_id: userId,
      day: selectedDayEntry.day,
      month: viewDate.getMonth(),
      year: viewDate.getFullYear(),
      hours: editIsAbsence ? '0' : editHours,
      obra: finalObra,
      description: profile?.role?.toUpperCase() || localStorage.getItem('userRole')?.toUpperCase() || 'OFICIAL',
      is_absence: editIsAbsence,
      absence_reason: editIsAbsence ? editAbsenceReason : '',
      sync_status: isOfflineNow ? 'pending_sync' : 'synced'
    };

    const localKey = `entries_${viewDate.getMonth()}_${viewDate.getFullYear()}`;

    setEntries(prev => {
      const filtered = prev.filter(e => e.day !== selectedDayEntry.day);
      const updated = editHours === '0' && !editIsAbsence ? filtered : [...filtered, newEntry].sort((a, b) => a.day - b.day);
      localStorage.setItem(localKey, JSON.stringify(updated));
      return updated;
    });

    if (isOfflineNow) {
      if (editHours !== '0' || editIsAbsence) {
        addToQueue('time_entry', newEntry);
      }
      setSelectedDayEntry(null);
      setSavingEdit(false);
      return;
    }

    try {
      await supabase
        .from('time_entries')
        .delete()
        .eq('user_id', userId)
        .eq('day', selectedDayEntry.day)
        .eq('month', viewDate.getMonth())
        .eq('year', viewDate.getFullYear());

      if (editHours !== '0' || editIsAbsence) {
        const { error } = await supabase.from('time_entries').insert([{
          user_id: userId,
          day: selectedDayEntry.day,
          month: viewDate.getMonth(),
          year: viewDate.getFullYear(),
          hours: editIsAbsence ? '0' : editHours,
          obra: finalObra,
          description: profile?.role?.toUpperCase() || localStorage.getItem('userRole')?.toUpperCase() || 'OFICIAL',
          is_absence: editIsAbsence,
          absence_reason: editIsAbsence ? editAbsenceReason : ''
        }]);
        if (error) throw error;
      }
      
      await getEntries();
      setSelectedDayEntry(null);
    } catch (err) {
      if (editHours !== '0' || editIsAbsence) {
        newEntry.sync_status = 'pending_sync';
        addToQueue('time_entry', newEntry);
      }
      setSelectedDayEntry(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteEntry = async () => {
    if (!selectedDayEntry?.entry) return;
    setSavingEdit(true);
    try {
      await supabase
        .from('time_entries')
        .delete()
        .eq('id', selectedDayEntry.entry.id);
      
      await getEntries();
      setSelectedDayEntry(null);
    } catch (err) {
      alert('Erro ao excluir registro');
    } finally {
      setSavingEdit(false);
    }
  };

  const generateJPG = async () => {
    try {
      triggerLightHaptic();
      setExporting(true);
      setIsExportingJpg(true);

      // Wait a moment so offscreen ReportTemplate mounts in DOM
      await new Promise(r => setTimeout(r, 200));

      if (!reportRef.current) {
        throw new Error('Falha ao aceder ao template da folha de ponto');
      }
      
      const dataUrl = await toJpeg(reportRef.current, { 
        quality: 0.95,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        pixelRatio: 2,
        cacheBust: true
      });
      
      const fileName = `Folha_Ponto_${format(viewDate, 'MM_yyyy')}.jpg`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await triggerSuccessHaptic();

      try {
        await shareContent({
          title: 'Relatório Mensal Insta Chat',
          text: `Relatório de ${format(viewDate, 'MMMM yyyy', { locale: ptBR })} gerado com sucesso.`,
          dialogTitle: 'Partilhar Folha de Ponto'
        });
      } catch {}
    } catch (err) {
      console.error('[ProfileView] Erro ao gerar JPG:', err);
      alert('Não foi possível gerar a folha em JPG. Por favor tente novamente.');
    } finally {
      setExporting(false);
      setIsExportingJpg(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja sair da conta?')) {
      try {
        await supabase.auth.signOut();
        window.location.href = '/';
      } catch (err) {
        window.location.reload();
      }
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate)
  });

  const totalHours = entries.reduce((acc, curr) => {
    if (!curr.hours) return acc;
    if (curr.hours.includes(':')) {
      const [h, m] = curr.hours.split(':').map(Number);
      return acc + (isNaN(h) ? 0 : h) + (isNaN(m) ? 0 : m / 60);
    }
    return acc + Number(curr.hours);
  }, 0);
  const totalPayment = totalHours * (profile?.hourly_rate || 0);

  const savedPosts = posts.filter(p => p.is_saved);

  if (loading && !profile) return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-pulse pt-2">
      <div className="flex justify-between items-center px-1">
        <div className="h-8 w-32 bg-white/10 rounded-xl" />
        <div className="h-8 w-24 bg-white/10 rounded-xl" />
      </div>
      <div className="border border-white/5 rounded-[2.5rem] bg-[#111b21] p-6 space-y-6">
        <div className="h-40 -mx-6 -mt-6 bg-white/5 rounded-t-[2.5rem]" />
        <div className="flex flex-col sm:flex-row items-center gap-6 -mt-16 sm:-mt-20">
          <div className="w-28 h-28 rounded-full bg-white/10 border-4 border-[#111b21]" />
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="h-7 w-48 bg-white/10 rounded-xl mx-auto sm:mx-0" />
            <div className="flex justify-center sm:justify-start gap-2">
              <div className="h-5 w-24 bg-white/10 rounded-full" />
              <div className="h-5 w-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 py-4 bg-black/20 rounded-2xl">
          <div className="h-10 bg-white/5 rounded-xl mx-2" />
          <div className="h-10 bg-white/5 rounded-xl mx-2" />
          <div className="h-10 bg-white/5 rounded-xl mx-2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      <AnimatePresence mode="wait">
        {!showSettings ? (
          <motion.div
            key="profile-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Top Bar Navigation */}
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-white/5 hover:bg-white/10 text-white mr-1"
                    style={{ borderColor: activeTheme.styles.border }}
                  >
                    <ChevronLeft size={16} style={{ color: activeTheme.accentColor }} /> Voltar
                  </button>
                )}
                <h2 className="text-2xl font-black uppercase tracking-tighter text-current">Perfil</h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-black uppercase tracking-wider" style={{ backgroundColor: `${activeTheme.accentColor}20`, color: activeTheme.accentColor }}>
                  INSTA CHAT
                </span>
              </div>

              {(!currentUserId || currentUserId === userId) && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-white/5 hover:bg-white/10"
                    style={{ borderColor: activeTheme.styles.border, color: activeTheme.accentColor }}
                  >
                    <Palette size={14} /> Temas
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-white/5 hover:bg-white/10 text-white/80"
                    style={{ borderColor: activeTheme.styles.border }}
                  >
                    <Settings size={14} /> Ajustes
                  </button>
                </div>
              )}
            </div>

            {/* Main Instagram-Style Profile Card with Cover Photo Banner */}
            <div className={`border rounded-[2.5rem] overflow-hidden shadow-2xl relative transition-all ${activeTheme.cardBgClass} ${activeTheme.borderClass}`}>
              
              {/* Cover Photo Banner with Gradient Fade (Degradê ao Fundo) */}
              <div className="relative w-full h-40 sm:h-52 bg-slate-900 overflow-hidden group">
                {profile?.banner_url ? (
                  <img src={profile.banner_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-purple-900/40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/60"></div>
                  </div>
                )}

                {/* Gradient Fade into card background (No hard borders) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/50 to-transparent"></div>

                {/* Edit Banner Button (Only for own profile) */}
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerLightHaptic();
                      setBannerUrlInput(profile?.banner_url || '');
                      setIsBannerModalOpen(true);
                    }}
                    className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white py-1.5 px-3 rounded-full shadow-xl transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-wider z-20 group active:scale-95 cursor-pointer"
                    title="Alterar capa de fundo"
                  >
                    <Camera size={14} className="text-[#d4af37] group-hover:rotate-12 transition-transform" />
                    <span>Editar Capa</span>
                  </button>
                )}
              </div>

              {/* Profile Body Padding */}
              <div className="p-6 sm:p-8 space-y-6 -mt-16 sm:-mt-20 relative z-10">
              
              {/* Profile Avatar + Social Metrics Bar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                {/* Avatar with Glow Ring */}
                <div className="relative flex-shrink-0">
                  <div 
                    onClick={() => {
                      if (profile?.avatar_url) {
                        triggerLightHaptic();
                        setIsAvatarModalOpen(true);
                      }
                    }}
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 p-1 shadow-2xl transition-all ${profile?.avatar_url ? 'cursor-pointer hover:scale-105 active:scale-95 group' : ''}`}
                    style={{ borderColor: activeTheme.accentColor }}
                    title={profile?.avatar_url ? "Clique para ver a foto de perfil em tela cheia" : undefined}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/50 relative">
                      {profile?.avatar_url ? (
                        <>
                          <img src={profile.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={24} />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/30 text-4xl font-black">
                          {profile?.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Counters Bar (Publicações, Seguidores, A seguir) */}
                <div className="flex-1 w-full space-y-4 text-center sm:text-left">
                  <div>
                    <h3 className="text-2xl font-black text-current tracking-tighter uppercase">
                      {getUserDisplayName(profile, localStorage.getItem('userName') || 'Colaborador GSI')}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span 
                        className="text-black text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md"
                        style={{ backgroundColor: activeTheme.accentColor }}
                      >
                        {profile?.role || localStorage.getItem('userRole') || 'Oficial'}
                      </span>
                      <span className="bg-white/5 border border-white/10 text-white/80 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <HardHat size={11} style={{ color: activeTheme.accentColor }} />
                        {getUserCurrentObra(profile) || 'Obra Geral GSI'}
                      </span>
                      {profile?.location_city && (
                        <span className="bg-white/5 border border-white/10 text-white/70 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <MapPin size={10} style={{ color: activeTheme.accentColor }} /> {profile.location_city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Metrics: Posts, Followers, Following */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                    <div>
                      <p className="text-lg font-black text-current">{posts.length}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-white/40">Publicações</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-current">{followersCount}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-white/40">Seguidores</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-current">{followingCount}</p>
                      <p className="text-[8px] font-black uppercase tracking-wider text-white/40">A seguir</p>
                    </div>
                  </div>

                  {/* Action Buttons: Editar Perfil / Configurações & Seguir */}
                  <div className="flex gap-2 pt-1">
                    {(!currentUserId || currentUserId === userId) ? (
                      <button 
                        type="button"
                        onClick={() => {
                          triggerLightHaptic();
                          setShowSettings(true);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-current cursor-pointer active:scale-95"
                      >
                        <Settings size={14} style={{ color: activeTheme.accentColor }} /> Editar Perfil & Obra
                      </button>
                    ) : (
                      <button 
                        onClick={toggleFollow}
                        className={`flex-1 py-2.5 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                          isFollowing 
                            ? 'bg-white/10 border border-white/15 text-white/80' 
                            : `${activeTheme.primaryBtnClass}`
                        }`}
                      >
                        {isFollowing ? (
                          <><UserCheck size={14} /> A Seguir</>
                        ) : (
                          <><Users size={14} /> Seguir</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Bio Section with 150 Limit Indicator */}
              <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5">
                    <FileText size={12} style={{ color: activeTheme.accentColor }} /> Biografia
                  </span>
                  <span className="text-[9px] font-mono text-white/30">
                    {bio.length}/150 carateres
                  </span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed font-medium italic">
                  "{bio || 'Sem biografia definida. Toca em Editar Perfil para adicionar uma introdução!'}"
                </p>
              </div>

              {/* Fast Stats Row (Horas & Previsto) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Horas / Mês</p>
                  <p className="text-base font-black flex items-center justify-center gap-1.5" style={{ color: activeTheme.accentColor }}>
                    <Clock size={14} /> {totalHours.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Previsão €</p>
                  <p className="text-base font-black text-white flex items-center justify-center gap-1">
                    <Euro size={14} style={{ color: activeTheme.accentColor }} /> 
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalPayment)}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Obra Atual</p>
                  <p className="text-xs font-black text-white/80 truncate flex items-center justify-center gap-1">
                    <Briefcase size={12} style={{ color: activeTheme.accentColor }} /> {profile?.current_obra || 'Sem obra'}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Contacto</p>
                  <p className="text-xs font-black text-white/80 flex items-center justify-center gap-1">
                    <Phone size={12} style={{ color: activeTheme.accentColor }} /> {profile?.phone || 'Privado'}
                  </p>
                </div>
              </div>

              {/* Discreet & Premium Recent Profile Visitors Card */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md transition-all hover:border-white/10">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div 
                    className="p-2 rounded-xl flex items-center justify-center text-black font-bold shadow-md flex-shrink-0"
                    style={{ backgroundColor: activeTheme.accentColor }}
                  >
                    <Eye size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black uppercase tracking-wider text-white/90">
                        Últimos Visitantes
                      </p>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                        {recentVisitors.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium">
                      Pessoas que visualizaram este perfil recentemente
                    </p>
                  </div>
                </div>

                {/* Overlapping Avatars & Modal Trigger */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div 
                    onClick={() => { triggerLightHaptic(); setShowVisitorsModal(true); }}
                    className="flex items-center -space-x-2 cursor-pointer hover:scale-105 transition-all p-1 rounded-full bg-black/40 border border-white/10"
                  >
                    {recentVisitors.slice(0, 4).map((visitor, idx) => (
                      <div 
                        key={visitor.id || idx}
                        className="relative group"
                        title={`${visitor.full_name} (${visitor.role || 'Visitante'})`}
                      >
                        <div className="w-7 h-7 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center text-[9px] font-black text-white/80">
                          {visitor.avatar_url ? (
                            <img src={visitor.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            visitor.full_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        {idx === 0 && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full" />
                        )}
                      </div>
                    ))}
                    {recentVisitors.length > 4 && (
                      <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-white/10 text-white/80 flex items-center justify-center text-[9px] font-black">
                        +{recentVisitors.length - 4}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { triggerLightHaptic(); setShowVisitorsModal(true); }}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition-all flex items-center gap-1 active:scale-95"
                  >
                    Ver Todos <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs (Publicações / Guardados / Ponto) */}
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => { triggerLightHaptic(); setActiveTab('gallery'); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'gallery'
                    ? 'border-current opacity-100 text-current'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
                style={activeTab === 'gallery' ? { borderColor: activeTheme.accentColor, color: activeTheme.accentColor } : undefined}
              >
                <Grid size={16} /> Publicações
              </button>

              <button 
                onClick={() => { triggerLightHaptic(); setActiveTab('saved'); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'saved'
                    ? 'border-current opacity-100 text-current'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
                style={activeTab === 'saved' ? { borderColor: activeTheme.accentColor, color: activeTheme.accentColor } : undefined}
              >
                <Bookmark size={16} /> Guardados ({savedPosts.length})
              </button>

              <button 
                onClick={() => { triggerLightHaptic(); setActiveTab('entries'); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'entries'
                    ? 'border-current opacity-100 text-current'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
                style={activeTab === 'entries' ? { borderColor: activeTheme.accentColor, color: activeTheme.accentColor } : undefined}
              >
                <CalendarIcon size={16} /> Folha de Ponto
              </button>
            </div>

            {/* Tab 1: Instagram-Style 3x3 Photo Grid & Publishing */}
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                {/* Header Action: Add New Photo */}
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                    <Sparkles size={14} style={{ color: activeTheme.accentColor }} /> Galeria de Fotos ({posts.length})
                  </h4>

                  <button 
                    onClick={() => { triggerLightHaptic(); setIsNewPostOpen(true); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 ${activeTheme.primaryBtnClass}`}
                  >
                    <Plus size={16} /> Publicar Foto
                  </button>
                </div>

                {/* 3x3 Grid Layout */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { triggerLightHaptic(); setSelectedPost(post); }}
                      className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-white/10 bg-black/40 shadow-lg"
                    >
                      <img 
                        src={post.image_url} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        alt="Publicação" 
                      />

                      {/* Discrete Instagram-style Watermark */}
                      <div className="absolute bottom-1.5 right-1.5 z-10 bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                        <InstaChatIcon size={10} />
                        <span className="text-[7px] font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">INSTA CHAT</span>
                      </div>

                      {/* Hover Overlay with Likes & Comments */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-black text-xs">
                        <span className="flex items-center gap-1">
                          <Heart size={16} className="fill-white text-white" /> {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={16} className="fill-white text-white" /> {post.comments_count}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {posts.length === 0 && (
                  <div className="py-16 text-center rounded-[2rem] border border-dashed border-white/10 bg-black/20 space-y-3">
                    <Camera size={36} className="mx-auto text-white/20" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/40">Nenhuma fotografia publicada</p>
                    <button 
                      onClick={() => setIsNewPostOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white/10 text-white hover:bg-white/20"
                    >
                      Publicar Primeira Foto
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Saved / Bookmarked Photos */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="px-1">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                    <Bookmark size={14} style={{ color: activeTheme.accentColor }} /> Destaques e Fotos Guardadas
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {savedPosts.map((post) => (
                    <motion.div
                      key={`saved-${post.id}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { triggerLightHaptic(); setSelectedPost(post); }}
                      className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-white/10 bg-black/40 shadow-lg"
                    >
                      <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-amber-400">
                        <Bookmark size={12} className="fill-amber-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {savedPosts.length === 0 && (
                  <div className="py-16 text-center rounded-[2rem] border border-dashed border-white/10 bg-black/20 space-y-2">
                    <Bookmark size={36} className="mx-auto text-white/20" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/40">Nenhuma publicação guardada</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Time Entry Calendar & Work Hours */}
            {activeTab === 'entries' && (
              <div className="space-y-6">
                <div className="space-y-3 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.25em] text-white/50 flex items-center gap-2">
                      <CalendarIcon size={14} style={{ color: activeTheme.accentColor }} /> Histórico Mensal de Ponto
                    </h4>
                    
                    <button 
                      onClick={generateJPG}
                      disabled={exporting}
                      className={`flex items-center gap-2 px-3.5 py-2 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 flex-shrink-0 ${activeTheme.primaryBtnClass}`}
                      title="Baixar folha de ponto em JPG"
                    >
                      <Download size={14} className="stroke-[2.5]" />
                      <span>{exporting ? 'A Gerar...' : 'Folha JPG'}</span>
                    </button>
                  </div>
                  
                  {/* Month Switcher */}
                  <div className="flex items-center justify-between rounded-2xl border p-1.5 shadow-inner" style={{ backgroundColor: activeTheme.styles.card, borderColor: activeTheme.styles.border }}>
                    <button 
                      onClick={() => setViewDate(subMonths(viewDate, 1))} 
                      className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
                      style={{ color: activeTheme.accentColor }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-black uppercase tracking-wider text-center" style={{ color: activeTheme.styles.text }}>
                      {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button 
                      onClick={() => setViewDate(addMonths(viewDate, 1))} 
                      className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
                      style={{ color: activeTheme.accentColor }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-3xl p-6" style={{ backgroundColor: `${activeTheme.styles.card}80`, borderColor: activeTheme.styles.border }}>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                      <span key={d} className="text-[8px] font-black uppercase text-center opacity-40">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getDay(startOfMonth(viewDate)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {days.map((day) => {
                      const entry = entries.find(e => e.day === day.getDate());
                      return (
                        <button 
                          key={day.toISOString()}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerLightHaptic();
                            handleDayClick(day.getDate(), entry);
                          }}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center relative border transition-all cursor-pointer active:scale-95 ${
                            entry 
                              ? (entry.is_absence ? 'bg-red-500/20 border-red-500/50' : '') 
                              : 'bg-black/20 border-white/5 hover:border-white/20'
                          }`}
                          style={entry && !entry.is_absence ? {
                            backgroundColor: `${activeTheme.accentColor}25`,
                            borderColor: `${activeTheme.accentColor}70`
                          } : undefined}
                        >
                          <span className={`text-[10px] font-black ${entry ? 'text-current' : 'opacity-30'}`}>{day.getDate()}</span>
                          {entry && (
                            <span 
                              className={`text-[6px] font-black mt-0.5 ${entry.is_absence ? 'text-red-500' : ''}`}
                              style={!entry.is_absence ? { color: activeTheme.accentColor } : undefined}
                            >
                              {entry.is_absence ? 'FALTA' : `${entry.hours}h`}
                            </span>
                          )}
                          {isSameDay(day, new Date()) && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-black shadow-lg" style={{ backgroundColor: activeTheme.accentColor }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Entries List */}
                <div className="space-y-3">
                  {entries.map((entry, entryIdx) => (
                    <motion.div
                      key={entry.id ? `profile-entry-${entry.id}-${entryIdx}` : `profile-entry-idx-${entryIdx}`}
                      className={`group border rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer ${entry.is_absence ? 'bg-red-500/10 border-red-500/20' : 'bg-[#1c2431]/40 border-white/5'}`}
                      onClick={() => handleDayClick(entry.day, entry)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center ${entry.is_absence ? 'bg-red-500/20 border-red-500/30' : 'bg-black/40 border-white/5'}`}>
                          <span className="text-sm font-black text-white">{entry.day.toString().padStart(2, '0')}</span>
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${entry.is_absence ? 'text-red-500' : 'text-white'}`}>
                            {entry.is_absence ? 'FALTA REGISTRADA' : entry.obra}
                          </p>
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
                            {entry.is_absence ? `Motivo: ${entry.absence_reason || 'Não informado'}` : `Carga: ${entry.hours} horas`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/20" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full py-5 rounded-[2rem] border border-red-500/10 bg-red-500/5 text-red-500/60 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={16} /> Sair do Sistema GSI
            </button>
              </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SettingsView 
              userId={userId} 
              isDarkMode={isDarkMode}
              onBack={() => {
                setShowSettings(false);
                getProfile();
              }}
              onUpdate={(updates) => {
                setProfile(prev => prev ? { ...prev, ...updates } : null);
                if (onProfileUpdate) onProfileUpdate(updates);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2: Create New Photo Post Modal */}
      <AnimatePresence>
        {isNewPostOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsNewPostOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#12192e] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl text-white"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Camera size={20} style={{ color: activeTheme.accentColor }} /> Publicar Nova Fotografia
                </h3>
                <button onClick={() => setIsNewPostOpen(false)} className="p-2 text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Photo Select / Preview Area */}
              <div className="space-y-4">
                <div className="aspect-square w-full rounded-2xl border-2 border-dashed border-white/20 bg-black/40 overflow-hidden flex flex-col items-center justify-center relative group">
                  {newPostImage ? (
                    <img src={newPostImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Camera size={40} className="mx-auto text-white/20" />
                      <p className="text-xs font-bold text-white/60">Carrega uma foto da galeria ou câmara</p>
                      <button 
                        onClick={() => document.getElementById('new-post-file')?.click()}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase"
                      >
                        Escolher Foto
                      </button>
                    </div>
                  )}

                  <input 
                    type="file" 
                    id="new-post-file" 
                    accept="image/*" 
                    onChange={handleSelectNewPostPhoto} 
                    className="hidden" 
                  />
                </div>

                {/* Preset Quick Images */}
                {!newPostImage && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Ou escolhe uma foto de exemplo:</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800',
                        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
                        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
                        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'
                      ].map((imgUrl, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setNewPostImage(imgUrl)}
                          className="w-14 h-14 rounded-xl border border-white/20 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-all"
                        >
                          <img src={imgUrl} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caption Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Legenda / Descrição</label>
                  <textarea 
                    value={newPostCaption} 
                    onChange={e => setNewPostCaption(e.target.value)} 
                    rows={3}
                    placeholder="Escreve uma legenda para a tua publicação..."
                    className="w-full bg-[#080d1a] border border-white/10 rounded-xl p-3 text-xs font-medium outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handlePublishPost}
                  disabled={!newPostImage}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${activeTheme.primaryBtnClass}`}
                >
                  <Send size={16} /> Publicar no Perfil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 3: Lightbox Photo Viewer Modal (Likes, Comments & Saved) */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]"
            >
              {/* Lightbox Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-black/60">
                    <img src={selectedPost.author_avatar || profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">{selectedPost.author_name}</h4>
                    <p className="text-[9px] text-white/40 font-mono">
                      {format(new Date(selectedPost.created_at), 'dd MMM yyyy • HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleDeletePost(selectedPost.id)} 
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar Publicação"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => setSelectedPost(null)} className="p-2 text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Photo Display */}
              <div className="relative bg-black flex items-center justify-center max-h-[380px] overflow-hidden">
                <img src={selectedPost.image_url} className="w-full max-h-[380px] object-contain" />
                {/* Discrete Instagram-style Animated Watermark */}
                <div className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-md p-0.5">
                    <InstaChatIcon size={12} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">INSTA CHAT</span>
                  <span className="text-[8px] font-medium text-white/70">@{selectedPost.author_name?.toLowerCase().replace(/\s+/g, '') || 'instachat'}</span>
                </div>
              </div>

              {/* Interaction Bar (Likes, Comment Count, Save) */}
              <div className="p-4 space-y-3 bg-[#0a0e17] flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLikePost(selectedPost.id)}
                      className="flex items-center gap-1.5 text-xs font-black transition-transform active:scale-125"
                    >
                      <Heart 
                        size={22} 
                        className={selectedPost.liked_by.includes(userId) ? 'fill-red-500 text-red-500' : 'text-white/60'} 
                      />
                      <span>{selectedPost.likes_count} gostos</span>
                    </button>

                    <span className="flex items-center gap-1.5 text-xs font-black text-white/60">
                      <MessageCircle size={20} />
                      <span>{selectedPost.comments_count} comentários</span>
                    </span>
                  </div>

                  <button 
                    onClick={() => toggleSavePost(selectedPost.id)}
                    className="p-1.5 rounded-full transition-transform active:scale-125"
                  >
                    <Bookmark 
                      size={20} 
                      className={selectedPost.is_saved ? 'fill-amber-400 text-amber-400' : 'text-white/60'} 
                    />
                  </button>
                </div>

                {/* Caption */}
                {selectedPost.caption && (
                  <p className="text-xs text-white/90 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="font-black text-white mr-1.5">{selectedPost.author_name}:</span>
                    {selectedPost.caption}
                  </p>
                )}

                {/* Comments List */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Comentários</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedPost.comments.map(comm => (
                      <div key={comm.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-black/60 flex-shrink-0">
                          {comm.author_avatar ? (
                            <img src={comm.author_avatar} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white/40">
                              {comm.author_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-white">{comm.author_name}</span>
                            <span className="text-[8px] text-white/30 font-mono">
                              {format(new Date(comm.created_at), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-xs text-white/80 mt-0.5">{comm.content}</p>
                        </div>
                      </div>
                    ))}

                    {selectedPost.comments.length === 0 && (
                      <p className="text-[10px] text-white/30 italic text-center py-2">Sê o primeiro a comentar!</p>
                    )}
                  </div>
                </div>

                {/* Add Comment Input */}
                <div className="flex gap-2 pt-2">
                  <input 
                    type="text" 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                    placeholder="Adiciona um comentário..." 
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-white/30"
                  />
                  <button 
                    onClick={() => handleAddComment(selectedPost.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 ${activeTheme.primaryBtnClass}`}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Visitors Modal */}
      <AnimatePresence>
        {showVisitorsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVisitorsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md border rounded-3xl p-6 space-y-4 shadow-2xl relative ${activeTheme.cardBgClass} ${activeTheme.borderClass}`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2.5 rounded-2xl text-black font-bold shadow-md"
                    style={{ backgroundColor: activeTheme.accentColor }}
                  >
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      Últimos Visitantes
                    </h3>
                    <p className="text-[10px] text-white/40">
                      Histórico recente de quem acedeu a este perfil
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVisitorsModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recentVisitors.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs font-medium">
                    Nenhuma visita registada recentemente.
                  </div>
                ) : (
                  recentVisitors.map((v, index) => (
                    <div 
                      key={v.id || index}
                      className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center text-xs font-black text-white/70">
                          {v.avatar_url ? (
                            <img src={v.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            v.full_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{v.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span 
                              className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-black"
                              style={{ backgroundColor: activeTheme.accentColor }}
                            >
                              {v.role || 'Colaborador'}
                            </span>
                            <span className="text-[9px] text-white/40 font-mono">
                              {formatVisitTime(v.visited_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Cover Banner Edit Modal */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
            onClick={() => setIsBannerModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111b21] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="text-[#d4af37]" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Editar Capa do Perfil</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preview Box */}
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group">
                {bannerUrlInput ? (
                  <img src={bannerUrlInput} className="w-full h-full object-cover" alt="Preview Capa" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-purple-900/40 flex items-center justify-center">
                    <span className="text-xs text-white/50 font-bold">Sem Foto de Capa (Usa Degradê Padrão)</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/40 to-transparent"></div>
              </div>

              {/* Device File Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                  1. Carregar Foto do Teu Dispositivo / Galeria
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={bannerFileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setBannerUrlInput(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d4af37] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Upload size={16} className="text-[#d4af37]" />
                  <span>Escolher Fotografia da Galeria</span>
                </button>
              </div>

              {/* Preset Gallery */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                  2. Ou Escolha uma Capa Estilizada
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { title: 'Cyber Steel', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop' },
                    { title: 'Néon Obra', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=1200&auto=format&fit=crop' },
                    { title: 'Sunset Dark', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop' },
                    { title: 'Golden Glow', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&auto=format&fit=crop' },
                    { title: 'Carbon Minimal', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop' },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setBannerUrlInput(preset.url)}
                      className="h-14 rounded-xl overflow-hidden border border-white/10 relative group hover:border-[#d4af37] transition-all cursor-pointer"
                    >
                      <img src={preset.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-white drop-shadow text-center">{preset.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                  3. Ou Inserir Link/URL Direto
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl p-3 text-xs font-mono text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                {bannerUrlInput && (
                  <button
                    type="button"
                    onClick={() => setBannerUrlInput('')}
                    className="py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingBanner}
                  onClick={() => handleSaveBanner(bannerUrlInput)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {savingBanner ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Guardar Capa</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Time Entry Edit / Marking Modal for Folha de Ponto */}
      <AnimatePresence>
        {selectedDayEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedDayEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#111b21] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-2xl text-white select-none"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2.5 rounded-2xl text-black font-black"
                    style={{ backgroundColor: activeTheme.accentColor }}
                  >
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Ponto - Dia {selectedDayEntry.day.toString().padStart(2, '0')}
                    </h3>
                    <p className="text-[10px] text-white/40">
                      {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayEntry(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Absence Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Registar Falta / Ausência</span>
                <button
                  type="button"
                  onClick={() => setEditIsAbsence(!editIsAbsence)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${editIsAbsence ? 'bg-red-500' : 'bg-white/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editIsAbsence ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {!editIsAbsence ? (
                <>
                  {/* Hours Selector - 7, 8, 9, 10, 12 with 9 as default */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                        Horas Trabalhadas
                      </label>
                      <span className="text-[10px] font-mono text-[#d4af37] font-black">
                        {editHours} Horas Selecionadas
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['7', '8', '9', '10', '12'].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => {
                            triggerLightHaptic();
                            setEditHours(hrs);
                          }}
                          className={`py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                            editHours === hrs
                              ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20 scale-105'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Obra Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                      Nome da Obra / Local
                    </label>
                    <input
                      type="text"
                      value={editObra}
                      onChange={(e) => setEditObra(e.target.value)}
                      placeholder="Ex: Obra Centro, Lote 14..."
                      className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl p-3.5 text-xs font-bold text-white outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </>
              ) : (
                /* Absence Reason */
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">
                    Motivo da Ausência / Falta
                  </label>
                  <input
                    type="text"
                    value={editAbsenceReason}
                    onChange={(e) => setEditAbsenceReason(e.target.value)}
                    placeholder="Ex: Doença, Assuntos Pessoais, Intempérie..."
                    className="w-full bg-[#0a0e17] border border-red-500/30 rounded-2xl p-3.5 text-xs font-bold text-white outline-none focus:border-red-500"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                {selectedDayEntry.entry && (
                  <button
                    type="button"
                    onClick={deleteEntry}
                    disabled={savingEdit}
                    className="py-3 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDayEntry(null)}
                  className="flex-1 py-3 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={saveEntryEdit}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Guardar Ponto</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Fullscreen Lightbox Modal */}
      <MediaLightboxModal 
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        mediaUrl={profile?.avatar_url || ''}
        senderName={profile?.full_name}
        caption={`Foto de perfil de ${profile?.full_name || 'Utilizador'}`}
      />

      {/* Dynamic Off-screen Report Template for Exporting JPG (Only mounted when generating) */}
      {isExportingJpg && (
        <div 
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            zIndex: -999, 
            opacity: 1, 
            pointerEvents: 'none',
            width: '794px',
            minHeight: '1123px',
            backgroundColor: '#ffffff'
          }}
        >
          <div ref={reportRef} style={{ width: '794px', backgroundColor: '#ffffff' }}>
            <ReportTemplate 
              userName={getUserDisplayName(profile, localStorage.getItem('userName') || 'Colaborador GSI')}
              userRole={profile?.role || localStorage.getItem('userRole') || 'Oficial'}
              month={viewDate.getMonth()}
              year={viewDate.getFullYear()}
              entries={entries}
              totalHours={totalHours}
              totalPayment={totalPayment || 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
