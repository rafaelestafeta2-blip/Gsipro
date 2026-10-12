import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Phone, 
  Video, 
  X, 
  CircleDashed, 
  User 
} from 'lucide-react';
import { Profile, ChatGroup } from '../../../shared/types';
import { supabase } from '../../../shared/services/supabaseClient';
import { useDailyCall, ActiveCallScreen, IncomingCallScreen } from '../../calls';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatGroups } from '../hooks/useChatGroups';
import { useStatusStories } from '../hooks/useStatusStories';
import { fetchUnreadCounts } from '../services/chatService';

import DirectChatList from './DirectChatList';
import GroupChatList from './GroupChatList';
import StatusTab from './StatusTab';
import ChatMessageList from './ChatMessageList';
import ChatMessageInput from './ChatMessageInput';
import CreateGroupModal from './CreateGroupModal';
import GroupMembersModal from './GroupMembersModal';
import CreateStatusModal from './CreateStatusModal';
import StatusViewerModal from './StatusViewerModal';
import MediaLightboxModal from '../../../shared/components/MediaLightboxModal';

export interface MessengerProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUserId: string;
  userName?: string;
  userAvatar?: string;
  onlineUsers?: Map<string, any>;
  incomingCallSignal?: any;
  onClearIncomingCallSignal?: () => void;
  initialTab?: 'direct' | 'groups' | 'status';
  initialDirectUserId?: string;
  embedded?: boolean;
}

export default function Messenger({
  isOpen = true,
  onClose,
  currentUserId,
  userName = 'Utilizador',
  userAvatar,
  onlineUsers = new Map(),
  incomingCallSignal,
  onClearIncomingCallSignal,
  initialTab = 'direct',
  initialDirectUserId,
  embedded = false
}: MessengerProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'groups' | 'status'>(initialTab);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Group modal controls
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

  // Calls Hook
  const {
    callState,
    callType,
    callUser,
    callRoomUrl,
    isCallMuted,
    isCallCameraOff,
    isSpeakerOn,
    callDurationSec,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker
  } = useDailyCall({
    currentUserId,
    userName,
    userAvatar,
    onClearIncomingSignal: onClearIncomingCallSignal
  });

  // Direct Messages Hook
  const {
    messages,
    isPartnerTyping,
    replyTo,
    setReplyTo,
    sendMessage,
    toggleReaction,
    deleteMessage,
    sendTypingIndicator,
    reloadMessages
  } = useChatMessages({
    currentUserId,
    userName,
    selectedUser
  });

  // Groups Hook
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    groupMessages,
    groupTypingUsers,
    groupUnreadCounts,
    replyTo: groupReplyTo,
    setReplyTo: setGroupReplyTo,
    sendGroupMessage,
    sendGroupTyping,
    reloadGroups
  } = useChatGroups({
    currentUserId,
    userName,
    userAvatar
  });

  // Status Stories Hook
  const {
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
    postStatus,
    deleteStatus
  } = useStatusStories(currentUserId, userName, userAvatar);

  // Load profiles and unread counts
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').order('full_name');
        if (data) setProfiles(data);
        const counts = await fetchUnreadCounts(currentUserId);
        setUnreadCounts(counts);
      } catch (err) {
        console.warn('[Messenger] Load profiles error:', err);
      }
    };
    loadProfiles();
  }, [currentUserId]);

  // Handle initial direct user selection
  useEffect(() => {
    if (initialDirectUserId && profiles.length > 0) {
      const match = profiles.find(p => p.id === initialDirectUserId);
      if (match) setSelectedUser(match);
    }
  }, [initialDirectUserId, profiles]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={
        embedded
          ? "w-full h-full min-h-[560px] bg-[#0a0e17] flex flex-col rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative"
          : "fixed inset-0 z-[100] bg-[#0a0e17] flex flex-col md:inset-auto md:right-6 md:bottom-20 md:w-[440px] md:h-[660px] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl overflow-hidden"
      }
    >
      {/* Top Header */}
      <div className="bg-[#1c2431] px-5 py-3.5 flex items-center justify-between border-b border-white/5 relative z-20">
        <div className="flex items-center gap-3 min-w-0">
          {selectedGroup ? (
            <button
              onClick={() => setSelectedGroup(null)}
              className="p-1.5 hover:bg-white/5 rounded-full text-white/60 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
          ) : selectedUser ? (
            <button
              onClick={() => setSelectedUser(null)}
              className="p-1.5 hover:bg-white/5 rounded-full text-white/60 hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <MessageSquare size={18} />
            </div>
          )}

          <div className="min-w-0">
            {selectedGroup ? (
              <div onClick={() => setShowGroupMembersModal(true)} className="cursor-pointer">
                <h3 className="text-xs font-bold text-white truncate hover:text-[#d4af37]">
                  {selectedGroup.name}
                </h3>
                <span className="text-[10px] text-white/40 block">
                  {groupMembers.length} Participantes • Ver detalhes
                </span>
              </div>
            ) : selectedUser ? (
              <div>
                <h3 className="text-xs font-bold text-white truncate">
                  {selectedUser.full_name}
                </h3>
                <span className="text-[10px] text-white/40 block">
                  {isPartnerTyping ? (
                    <span className="text-emerald-400 font-bold animate-pulse">digitando...</span>
                  ) : onlineUsers.has(selectedUser.id) ? (
                    <span className="text-emerald-400 font-bold">Online</span>
                  ) : (
                    selectedUser.role || 'Colega'
                  )}
                </span>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  GSI Messenger
                </h3>
                <span className="text-[10px] text-[#d4af37] font-bold">
                  Comunicação Corporativa PRO
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1">
          {selectedUser && (
            <>
              <button
                onClick={() => startCall(selectedUser, 'audio')}
                className="p-2 text-white/60 hover:text-[#d4af37] transition-colors"
                title="Chamada de Voz"
              >
                <Phone size={18} />
              </button>
              <button
                onClick={() => startCall(selectedUser, 'video')}
                className="p-2 text-white/60 hover:text-[#d4af37] transition-colors"
                title="Chamada de Vídeo"
              >
                <Video size={18} />
              </button>
            </>
          )}
          {!embedded && (
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatMessageList
            messages={groupMessages}
            currentUserId={currentUserId}
            onReplyTo={(rep) => setGroupReplyTo(rep)}
            onImageClick={(url) => setLightboxUrl(url)}
          />
          <ChatMessageInput
            onSendMessage={(content, type, mediaUrl) => sendGroupMessage(content, type, mediaUrl)}
            onTyping={sendGroupTyping}
            replyTo={groupReplyTo}
            onClearReply={() => setGroupReplyTo(null)}
          />
        </div>
      ) : selectedUser ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatMessageList
            messages={messages}
            currentUserId={currentUserId}
            onReplyTo={(rep) => setReplyTo(rep)}
            onToggleReaction={toggleReaction}
            onDeleteMessage={deleteMessage}
            onImageClick={(url) => setLightboxUrl(url)}
          />
          <ChatMessageInput
            onSendMessage={sendMessage}
            onTyping={sendTypingIndicator}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-[#1c2431]/40 px-3 pt-2 gap-2">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <User size={14} />
              <span>Direto</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <Users size={14} />
              <span>Grupos</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'status'
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <CircleDashed size={14} />
              <span>Status</span>
            </button>
          </div>

          {/* Tab contents */}
          {activeTab === 'direct' && (
            <DirectChatList
              profiles={profiles}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
              unreadCounts={unreadCounts}
              onSelectUser={(u) => setSelectedUser(u)}
            />
          )}

          {activeTab === 'groups' && (
            <GroupChatList
              groups={groups}
              groupUnreadCounts={groupUnreadCounts}
              onSelectGroup={(g) => setSelectedGroup(g)}
              onCreateGroupClick={() => setShowCreateGroupModal(true)}
            />
          )}

          {activeTab === 'status' && (
            <StatusTab
              statuses={statuses}
              currentUserId={currentUserId}
              onOpenCreateStatus={() => setShowCreateStatusModal(true)}
              onViewStatusGroup={(g) => setViewingStatusGroup(g)}
              onDeleteStatus={deleteStatus}
            />
          )}
        </div>
      )}

      {/* Sub Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        currentUserId={currentUserId}
        onGroupCreated={reloadGroups}
      />

      <GroupMembersModal
        isOpen={showGroupMembersModal}
        onClose={() => setShowGroupMembersModal(false)}
        group={selectedGroup}
        members={groupMembers}
        currentUserId={currentUserId}
      />

      <CreateStatusModal
        isOpen={showCreateStatusModal}
        onClose={() => setShowCreateStatusModal(false)}
        statusType={newStatusType}
        setStatusType={setNewStatusType}
        content={newStatusContent}
        setContent={setNewStatusContent}
        mediaUrl={newStatusMediaUrl}
        setMediaUrl={setNewStatusMediaUrl}
        caption={newStatusCaption}
        setCaption={setNewStatusCaption}
        bgGradient={newStatusBg}
        setBgGradient={setNewStatusBg}
        onPostStatus={postStatus}
      />

      <StatusViewerModal
        viewingGroup={viewingStatusGroup}
        currentIndex={currentStatusIndex}
        onNext={() => setCurrentStatusIndex(i => i + 1)}
        onPrev={() => setCurrentStatusIndex(i => i - 1)}
        onClose={() => setViewingStatusGroup(null)}
        onDeleteStatus={deleteStatus}
        currentUserId={currentUserId}
      />

      <MediaLightboxModal
        isOpen={!!lightboxUrl}
        mediaUrl={lightboxUrl || ''}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Active Call Overlay */}
      {callState !== 'idle' && (
        <ActiveCallScreen
          callState={callState}
          callType={callType}
          callUser={callUser}
          roomUrl={callRoomUrl}
          isMuted={isCallMuted}
          isCameraOff={isCallCameraOff}
          isSpeakerOn={isSpeakerOn}
          callDurationSec={callDurationSec}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleSpeaker={toggleSpeaker}
          onHangup={endCall}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          remoteAudioRef={remoteAudioRef}
        />
      )}
    </motion.div>
  );
}
