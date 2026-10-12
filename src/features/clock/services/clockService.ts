import { supabase } from '../../../shared/services/supabaseClient';
import { isOnline } from '../../../shared/services/networkService';
import { addToQueue } from '../../../shared/services/offlineSyncService';
import { TimeEntry } from '../../../shared/types';

export function getMonthCacheKey(month: number, year: number): string {
  return `entries_${month}_${year}`;
}

export function getCachedMonthEntries(month: number, year: number): TimeEntry[] {
  try {
    const raw = localStorage.getItem(getMonthCacheKey(month, year));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveCachedMonthEntries(month: number, year: number, entries: TimeEntry[]): void {
  try {
    localStorage.setItem(getMonthCacheKey(month, year), JSON.stringify(entries));
  } catch {}
}

export async function fetchMonthEntries(
  userId: string,
  month: number,
  year: number
): Promise<TimeEntry[]> {
  const cached = getCachedMonthEntries(month, year);

  if (!isOnline()) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .order('day', { ascending: false });

    if (!error && data) {
      saveCachedMonthEntries(month, year, data);
      return data;
    }
  } catch (err) {
    console.warn('[ClockService] Erro ao buscar pontos na cloud:', err);
  }

  return cached;
}

export async function saveOrQueueTimeEntry(entry: TimeEntry): Promise<{ entry: TimeEntry; isOffline: boolean }> {
  const isOfflineNow = !isOnline();
  const monthKey = getMonthCacheKey(entry.month, entry.year);
  const current = getCachedMonthEntries(entry.month, entry.year);

  const updatedEntry: TimeEntry = {
    ...entry,
    sync_status: isOfflineNow ? 'pending_sync' : 'synced'
  };

  const filtered = current.filter(e => e.day !== entry.day);
  const nextEntries = [...filtered, updatedEntry].sort((a, b) => a.day - b.day);
  saveCachedMonthEntries(entry.month, entry.year, nextEntries);

  if (isOfflineNow) {
    addToQueue('time_entry', updatedEntry);
    return { entry: updatedEntry, isOffline: true };
  }

  try {
    // Delete existing day entry if any, then insert
    await supabase
      .from('time_entries')
      .delete()
      .eq('user_id', entry.user_id)
      .eq('day', entry.day)
      .eq('month', entry.month)
      .eq('year', entry.year);

    const { error } = await supabase.from('time_entries').insert([{
      user_id: entry.user_id,
      day: entry.day,
      month: entry.month,
      year: entry.year,
      hours: entry.hours,
      obra: entry.obra,
      description: entry.description,
      is_absence: entry.is_absence || false,
      absence_reason: entry.absence_reason || ''
    }]);

    if (error) throw error;
    return { entry: updatedEntry, isOffline: false };
  } catch (err) {
    console.warn('[ClockService] Fallback offline ao guardar ponto:', err);
    updatedEntry.sync_status = 'pending_sync';
    addToQueue('time_entry', updatedEntry);
    return { entry: updatedEntry, isOffline: true };
  }
}

export async function deleteTimeEntry(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
