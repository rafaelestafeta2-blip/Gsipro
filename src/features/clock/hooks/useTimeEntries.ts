import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '../../../shared/types';
import { fetchMonthEntries, saveOrQueueTimeEntry, deleteTimeEntry, getCachedMonthEntries } from '../services/clockService';
import { triggerSuccessHaptic, triggerWarningHaptic } from '../../../shared/lib/haptics';
import { playSuccessSound } from '../../../shared/lib/sounds';
import { useToast } from '../../../shared/lib/ToastContext';

interface UseTimeEntriesProps {
  userId: string;
  userRole?: string;
  currentObra?: string;
  selectedMonth: number;
  selectedYear: number;
}

export function useTimeEntries({
  userId,
  userRole = 'Oficial',
  currentObra = '',
  selectedMonth,
  selectedYear
}: UseTimeEntriesProps) {
  const { showSuccess, showInfo, showError } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    return getCachedMonthEntries(selectedMonth, selectedYear);
  });
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await fetchMonthEntries(userId, selectedMonth, selectedYear);
    setEntries(data);
    setLoading(false);
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const quickMark = async (quickHours: number = 9) => {
    if (!userId) return;
    await triggerSuccessHaptic();
    playSuccessSound();

    const today = new Date();
    const workSite = currentObra.trim() || 'OBRA PRINCIPAL';

    const newEntry: TimeEntry = {
      user_id: userId,
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      hours: `${quickHours.toString().padStart(2, '0')}:00`,
      obra: workSite.toUpperCase(),
      description: userRole.toUpperCase(),
      is_absence: false
    };

    const { isOffline } = await saveOrQueueTimeEntry(newEntry);
    setEntries(prev => {
      const filtered = prev.filter(e => e.day !== today.getDate());
      return [...filtered, newEntry].sort((a, b) => a.day - b.day);
    });

    if (isOffline) {
      showInfo('Ponto guardado offline. Sincronizará quando houver rede.', 'PONTO OFFLINE');
    } else {
      showSuccess(`Ponto registado para hoje: ${quickHours}h na obra ${workSite}!`, 'PONTO REGISTADO');
    }
  };

  const markAbsence = async (reason: string) => {
    if (!userId) return;
    triggerWarningHaptic();
    const today = new Date();

    const newEntry: TimeEntry = {
      user_id: userId,
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      hours: '0',
      obra: 'FALTA',
      description: userRole.toUpperCase(),
      is_absence: true,
      absence_reason: reason
    };

    const { isOffline } = await saveOrQueueTimeEntry(newEntry);
    setEntries(prev => {
      const filtered = prev.filter(e => e.day !== today.getDate());
      return [...filtered, newEntry].sort((a, b) => a.day - b.day);
    });

    if (isOffline) {
      showInfo('Falta guardada offline. Sincronizará assim que houver rede.', 'FALTA OFFLINE');
    } else {
      showSuccess('Falta justificada com sucesso!', 'FALTA REGISTADA');
    }
  };

  const addCustomEntry = async (
    dayNum: number,
    hoursVal: string,
    obraVal: string,
    isAbsence: boolean = false,
    reasonVal: string = ''
  ) => {
    if (!userId) return;
    const workSite = isAbsence ? 'FALTA' : (obraVal.trim() || currentObra.trim() || 'OBRA PRINCIPAL');

    const newEntry: TimeEntry = {
      user_id: userId,
      day: dayNum,
      month: selectedMonth,
      year: selectedYear,
      hours: isAbsence ? '0' : hoursVal,
      obra: workSite.toUpperCase(),
      description: userRole.toUpperCase(),
      is_absence: isAbsence,
      absence_reason: isAbsence ? reasonVal : ''
    };

    const { isOffline } = await saveOrQueueTimeEntry(newEntry);
    setEntries(prev => {
      const filtered = prev.filter(e => e.day !== dayNum);
      return [...filtered, newEntry].sort((a, b) => a.day - b.day);
    });

    if (isOffline) {
      showInfo('Registo guardado offline.', 'OFFLINE');
    } else {
      showSuccess(`Registo do dia ${dayNum} gravado!`, 'SUCESSO');
    }
  };

  const removeEntry = async (id: string, dayNum: number) => {
    if (!id && !dayNum) return;
    if (id) {
      await deleteTimeEntry(id);
    }
    setEntries(prev => prev.filter(e => e.day !== dayNum && e.id !== id));
    showSuccess('Registo removido com sucesso!', 'REMOVIDO');
  };

  return {
    entries,
    loading,
    refreshEntries: loadEntries,
    quickMark,
    markAbsence,
    addCustomEntry,
    removeEntry
  };
}
