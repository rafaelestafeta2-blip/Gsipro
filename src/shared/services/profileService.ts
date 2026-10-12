import { supabase } from './supabaseClient';
import { Profile } from '../types';

/**
 * GSI PRO - Serviço Unificado de Perfil e Obras
 * Centraliza cache local, busca no Supabase e valores padrão de perfil.
 */

const PROFILE_CACHE_PREFIX = 'instachat_profile_';
const OBRA_CACHE_KEY = 'gsi_current_obra_';

export async function getProfileCached(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  // 1. Tentar ler do cache local para resposta instantânea
  try {
    const cached = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  // 2. Buscar do Supabase
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(data));
      if (data.current_obra) {
        localStorage.setItem(`${OBRA_CACHE_KEY}${userId}`, data.current_obra);
      }
      return data;
    }
  } catch (err) {
    console.warn('[ProfileService] Erro ao buscar perfil na cloud:', err);
  }

  return null;
}

export function saveProfileLocal(userId: string, updates: Partial<Profile>): void {
  if (!userId) return;
  try {
    const cached = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    const existing = cached ? JSON.parse(cached) : {};
    const merged = { ...existing, ...updates };
    localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(merged));
    if (updates.current_obra) {
      localStorage.setItem(`${OBRA_CACHE_KEY}${userId}`, updates.current_obra);
    }
  } catch {}
}

export async function updateProfileCloud(userId: string, updates: Partial<Profile>): Promise<boolean> {
  if (!userId) return false;
  saveProfileLocal(userId, updates);

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return !error;
  } catch (err) {
    console.warn('[ProfileService] Erro ao sincronizar perfil na nuvem:', err);
    return false;
  }
}

export const DEFAULT_WORK_HOURS = '9';
export const DEFAULT_WORK_HOURS_NUM = 9;
export const QUICK_HOURS_OPTIONS = ['7', '8', '9', '10', '12'] as const;
export const QUICK_HOURS_NUM_OPTIONS = [7, 8, 9, 10, 12] as const;

export function getUserDisplayName(profile?: Profile | null, fallback: string = 'Colaborador GSI'): string {
  if (profile?.full_name && profile.full_name.trim().length > 0) {
    return profile.full_name.trim();
  }
  const localName = localStorage.getItem('userName');
  if (localName && localName.trim().length > 0) {
    return localName.trim();
  }
  return fallback;
}

export function getUserCurrentObra(profile?: Profile | null, fallback: string = 'Obra Principal GSI'): string {
  if (profile?.current_obra && profile.current_obra.trim().length > 0) {
    return profile.current_obra.trim();
  }
  if (profile?.id) {
    const cached = localStorage.getItem(`${OBRA_CACHE_KEY}${profile.id}`);
    if (cached && cached.trim().length > 0) return cached.trim();
  }
  const globalObra = localStorage.getItem('currentObra');
  if (globalObra && globalObra.trim().length > 0) return globalObra.trim();
  return fallback;
}

export function getUserAvatar(profile?: Profile | null): string | undefined {
  return profile?.avatar_url || undefined;
}
