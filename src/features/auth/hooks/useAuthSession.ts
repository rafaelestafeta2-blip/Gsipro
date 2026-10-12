import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import { Profile } from '../../../shared/types';
import { getProfileCached } from '../../../shared/services/profileService';

export function useAuthSession() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getProfileCached(session.user.id).then((p) => {
          if (p) setProfile(p);
        });
      }
      setIsInitializing(false);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfileCached(session.user.id).then((p) => {
          if (p) setProfile(p);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('hourlyRate');
      setSession(null);
      setProfile(null);
    } catch (e) {
      console.warn('[useAuthSession] Sign out error:', e);
    }
  }, []);

  return {
    session,
    profile,
    setProfile,
    isInitializing,
    signOut
  };
}
