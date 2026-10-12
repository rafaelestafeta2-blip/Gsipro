import { useState, useEffect, useCallback } from 'react';
import { Profile } from '../../../shared/types';
import { 
  getProfileCached, 
  saveProfileLocal, 
  updateProfileCloud,
  getUserDisplayName,
  getUserCurrentObra 
} from '../../../shared/services/profileService';
import { getGamificationStats } from '../../../shared/lib/gamification';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getProfileCached(userId);
    if (data) setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return false;
    saveProfileLocal(userId, updates);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
    return await updateProfileCloud(userId, updates);
  };

  const displayName = getUserDisplayName(profile);
  const currentObra = getUserCurrentObra(profile);

  return {
    profile,
    loading,
    displayName,
    currentObra,
    updateProfile,
    reloadProfile: loadProfile
  };
}
