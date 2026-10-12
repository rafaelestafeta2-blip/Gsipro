import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Zap, Bell, X } from 'lucide-react';

// Shared utilities & UI
import { useAppTheme } from './shared/lib/theme';
import { useNetworkStatus } from './shared/services/networkService';
import { getGamificationStats } from './shared/lib/gamification';
import { checkForAppUpdate, ReleaseInfo } from './shared/services/appUpdateService';
import AnimatedLogo from './shared/components/AnimatedLogo';
import ThemeSelector from './shared/components/ThemeSelector';
import NetworkStatusBar from './shared/components/NetworkStatusBar';
import AppUpdateModal from './shared/components/AppUpdateModal';
import NavigationTabBar, { AppTab } from './shared/components/NavigationTabBar';

// Feature modules
import { Auth, Onboarding, ONBOARDING_STORAGE_KEY, useAuthSession } from './features/auth';
import { FCMPushModal, usePushNotifications } from './features/notifications';
import { useDailyCall, IncomingCallScreen, ActiveCallScreen } from './features/calls';
import { useTimeEntries } from './features/clock/hooks/useTimeEntries';
import HomeDashboard from './features/dashboard/components/HomeDashboard';
import ClockMarking from './features/clock/components/ClockMarking';
import Society from './features/social/components/Society';
import ProfileView from './features/profile/components/ProfileView';
import ReelsView from './features/social/components/ReelsView';
import Messenger from './features/chat/components/Messenger';

export default function App() {
  const { activeTheme } = useAppTheme();
  const { session, profile, setProfile, isInitializing } = useAuthSession();
  const { isOnline } = useNetworkStatus();

  // Tab & Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [messengerTab, setMessengerTab] = useState<'direct' | 'groups'>('groups');
  const [messengerTargetUserId, setMessengerTargetUserId] = useState<string | undefined>(undefined);
  const [onlineUsers] = useState<Map<string, any>>(new Map());

  // App Modals State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFCMModalOpen, setIsFCMModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [updateRelease, setUpdateRelease] = useState<ReleaseInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // User Profile Helpers
  const userName = profile?.full_name || localStorage.getItem('userName') || 'Colaborador GSI';
  const userRole = profile?.role || localStorage.getItem('userRole') || 'Oficial';
  const stats = getGamificationStats(0, userRole);

  // Time Entries for Clock Marking
  const {
    entries,
    quickMark,
    markAbsence
  } = useTimeEntries({
    userId: session?.user?.id || '',
    userRole,
    currentObra: profile?.current_obra || '',
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear()
  });

  const todayNum = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const todayEntry = entries.find(
    e => e.day === todayNum && e.month === currentMonth && e.year === currentYear
  );

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
    incomingCallUser,
    incomingCallType,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker
  } = useDailyCall({
    currentUserId: session?.user?.id || '',
    userName,
    userAvatar: profile?.avatar_url
  });

  // Push Notifications Hook
  const { fcmRegistered, requestPermission } = usePushNotifications({
    userId: session?.user?.id
  });

  // Check Onboarding
  useEffect(() => {
    if (session && !localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      setShowOnboarding(true);
    }
  }, [session]);

  // Check Native Updates & Status Bar
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    checkForAppUpdate().then(release => {
      if (release?.hasUpdate) {
        setUpdateRelease(release);
        setIsUpdateModalOpen(true);
      }
    }).catch(() => {});

    // Native Back Button
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (showOnboarding) {
        setShowOnboarding(false);
      } else if (isUpdateModalOpen) {
        setIsUpdateModalOpen(false);
      } else if (isThemeModalOpen) {
        setIsThemeModalOpen(false);
      } else if (isMessengerOpen) {
        setIsMessengerOpen(false);
      } else if (isFCMModalOpen) {
        setIsFCMModalOpen(false);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove()).catch(() => {});
    };
  }, [showOnboarding, isUpdateModalOpen, isThemeModalOpen, isMessengerOpen, isFCMModalOpen, activeTab]);

  const handleOpenMessenger = (tab: 'direct' | 'groups' = 'groups', targetUserId?: string) => {
    setMessengerTab(tab);
    setMessengerTargetUserId(targetUserId);
    setIsMessengerOpen(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4">
        <AnimatedLogo className="w-16 h-16 animate-pulse" />
        <span className="text-xs font-black tracking-widest text-[#d4af37] uppercase mt-4">
          A carregar GSI PRO...
        </span>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className={`min-h-screen ${activeTheme.bgClass} text-white flex flex-col font-sans transition-colors duration-300 relative select-none pb-24`}>
      <NetworkStatusBar />

      {/* Top Header */}
      <header
        className="px-5 py-3 border-b border-white/5 flex items-center justify-between sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center gap-3">
          <AnimatedLogo className="w-9 h-9" />
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              <span>GSI PRO</span>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#d4af37] text-black">
                {userRole.toUpperCase()}
              </span>
            </h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">
              {profile?.current_obra || 'Estaleiro Geral'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFCMModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all relative cursor-pointer"
            title="Notificações Push"
          >
            <Bell size={18} />
            {fcmRegistered && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            )}
          </button>

          {/* O Raio do Messenger */}
          <button
            type="button"
            onClick={() => handleOpenMessenger('groups')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#d4af37]/30 to-[#f3e5ab]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            title="Abrir Messenger"
          >
            <Zap size={20} className="fill-[#d4af37] stroke-[#d4af37]" />
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeDashboard
              key="home"
              profile={profile}
              userName={userName}
              userRole={userRole}
              userId={session.user.id}
              stats={stats}
              activeTheme={activeTheme}
            />
          )}

          {activeTab === 'reels' && (
            <motion.div
              key="reels"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ReelsView
                currentUserId={session.user.id}
                userName={userName}
                userAvatar={profile?.avatar_url}
                isAdmin={profile?.is_admin || false}
              />
            </motion.div>
          )}

          {activeTab === 'ponto' && (
            <motion.div
              key="ponto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ClockMarking
                onMark={(h) => quickMark(h)}
                onAbsence={(r) => markAbsence(r)}
                isDarkMode={true}
                hasMarkedToday={!!todayEntry}
                todayEntry={todayEntry}
                isOffline={!isOnline}
              />
            </motion.div>
          )}

          {activeTab === 'society' && (
            <motion.div
              key="society"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Society
                currentUserId={session.user.id}
                userName={userName}
                userAvatar={profile?.avatar_url}
                onlineUsers={onlineUsers}
                onOpenMessenger={handleOpenMessenger}
                isDarkMode={true}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ProfileView
                userId={session.user.id}
                currentUserId={session.user.id}
                isDarkMode={true}
                onProfileUpdate={(updated) => {
                  if (profile) setProfile({ ...profile, ...updated });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <NavigationTabBar
        activeTab={activeTab}
        onTabChange={(newTab) => setActiveTab(newTab)}
        activeTheme={activeTheme}
      />

      {/* Global Modals */}
      <AnimatePresence>
        {/* Theme Selector Modal (Popup dialog, never covering screen on startup) */}
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[#0a0e17] border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsThemeModalOpen(false)}
                className="absolute top-5 right-5 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
              <ThemeSelector onThemeSelect={() => setIsThemeModalOpen(false)} />
            </motion.div>
          </div>
        )}

        {isMessengerOpen && (
          <Messenger
            isOpen={isMessengerOpen}
            onClose={() => setIsMessengerOpen(false)}
            currentUserId={session.user.id}
            userName={userName}
            userAvatar={profile?.avatar_url}
            onlineUsers={onlineUsers}
            initialTab={messengerTab}
            initialDirectUserId={messengerTargetUserId}
          />
        )}

        {showOnboarding && (
          <Onboarding
            onComplete={() => setShowOnboarding(false)}
            userId={session.user.id}
            onRequestNotifications={requestPermission}
          />
        )}

        {isFCMModalOpen && (
          <FCMPushModal
            isOpen={isFCMModalOpen}
            onClose={() => setIsFCMModalOpen(false)}
            userId={session.user.id}
          />
        )}

        {isUpdateModalOpen && updateRelease && (
          <AppUpdateModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            release={updateRelease}
          />
        )}

        {/* Incoming Call Screen */}
        {callState === 'incoming' && incomingCallUser && (
          <IncomingCallScreen
            callerName={incomingCallUser.full_name}
            callerAvatar={incomingCallUser.avatar_url}
            callType={incomingCallType}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}

        {/* Active Call Screen */}
        {callState !== 'idle' && callState !== 'incoming' && (
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
      </AnimatePresence>
    </div>
  );
}
