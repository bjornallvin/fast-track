import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { FastingSession, CheckinEntry, BodyMetric, JournalEntry } from '../types';
import { generateId } from '../utils/calculations';
import { generateSessionId } from '../utils/sessionId';
import { generateEditToken } from '../utils/editToken';

const SYNC_INTERVAL = 30000; // Sync every 30 seconds
const DEBOUNCE_DELAY = 2000; // Debounce saves by 2 seconds

export const useUrlSessionData = (sessionId: string) => {
  const [session, setSession] = useState<FastingSession | null>(null);
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load session from KV or localStorage
  const loadSession = useCallback(async () => {
    // First check localStorage
    const localData = localStorage.getItem(`session:${sessionId}`);
    if (localData) {
      const localSession = JSON.parse(localData, (key, value) => {
        if (key === 'startTime' || key === 'timestamp' || key === 'endTime') {
          return value ? new Date(value) : value;
        }
        return value;
      });

      // Add editToken if it doesn't exist (for backward compatibility)
      if (!localSession.editToken) {
        localSession.editToken = generateEditToken();
        localStorage.setItem(`session:${sessionId}`, JSON.stringify(localSession));
      }

      setSession(localSession);
    }

    // Then try to load from KV
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const kvSession = await response.json();
        if (kvSession) {
          // Convert date strings to Date objects
          const sessionWithDates = {
            ...kvSession,
            startTime: new Date(kvSession.startTime),
            endTime: kvSession.endTime ? new Date(kvSession.endTime) : null,
            entries: kvSession.entries.map((e: any) => ({
              ...e,
              timestamp: new Date(e.timestamp)
            })),
            bodyMetrics: kvSession.bodyMetrics.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })),
            notes: kvSession.notes.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp)
            }))
          };

          // Add editToken if it doesn't exist (for backward compatibility)
          if (!sessionWithDates.editToken) {
            sessionWithDates.editToken = generateEditToken();
          }

          setSession(sessionWithDates);
          // Update localStorage with KV data
          localStorage.setItem(`session:${sessionId}`, JSON.stringify(sessionWithDates));
          setLastSyncTime(new Date());
        }
      } else if (response.status === 404) {
        // Session doesn't exist in KV, create it if we have local data
        if (localData) {
          const localSession = JSON.parse(localData);
          await saveToKV(localSession);
        }
      }
    } catch (error) {
      console.error('Error loading from KV:', error);
    }
  }, [sessionId]);

  // Save session to KV (debounced)
  const saveToKV = useCallback(async (sessionData: FastingSession) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });
        setLastSyncTime(new Date());
      } catch (error) {
        console.error('Error saving to KV:', error);
      } finally {
        setIsSyncing(false);
      }
    }, DEBOUNCE_DELAY);
  }, [sessionId]);

  // Save session to both localStorage and KV
  const saveSession = useCallback((sessionData: FastingSession) => {
    // Save to localStorage immediately
    localStorage.setItem(`session:${sessionId}`, JSON.stringify(sessionData));
    setSession(sessionData);

    // Save to KV (debounced)
    saveToKV(sessionData);
  }, [sessionId, saveToKV]);

  // Load session on mount
  useEffect(() => {
    loadSession();

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      loadSession();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [sessionId, loadSession]);

  // Load all sessions from localStorage for the selector
  useEffect(() => {
    const loadAllSessions = () => {
      const allSessions: FastingSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('session:')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const parsedSession = JSON.parse(sessionData, (key, value) => {
              if (key === 'startTime' || key === 'timestamp' || key === 'endTime') {
                return value ? new Date(value) : value;
              }
              return value;
            });
            allSessions.push(parsedSession);
          }
        }
      }
      setSessions(allSessions);
    };

    loadAllSessions();
  }, [session]);

  const createNewSession = (name: string, startTime: Date, targetDuration: number) => {
    const newSessionId = generateSessionId();
    const newEditToken = generateEditToken();
    const newSession: FastingSession = {
      id: newSessionId,
      name,
      startTime,
      endTime: null,
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
      editToken: newEditToken
    };

    // Save locally and to KV
    localStorage.setItem(`session:${newSessionId}`, JSON.stringify(newSession));
    saveToKV(newSession);

    // Navigate to the new session
    router.push(`/session/${newEditToken}/${newSessionId}`);
    setShowNewSessionDialog(false);
  };

  const switchToSession = (newSessionId: string) => {
    // Load the session to get its editToken
    const sessionData = localStorage.getItem(`session:${newSessionId}`);
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      if (parsedSession.editToken) {
        router.push(`/session/${parsedSession.editToken}/${newSessionId}`);
      } else {
        // For old sessions without editToken, generate one
        const newEditToken = generateEditToken();
        parsedSession.editToken = newEditToken;
        localStorage.setItem(`session:${newSessionId}`, JSON.stringify(parsedSession));
        router.push(`/session/${newEditToken}/${newSessionId}`);
      }
    }
  };

  const deleteSessionById = async (idToDelete: string) => {
    // Delete from localStorage
    localStorage.removeItem(`session:${idToDelete}`);

    // Delete from KV
    try {
      await fetch(`/api/sessions/${idToDelete}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting from KV:', error);
    }

    // If deleting current session, redirect to home
    if (idToDelete === sessionId) {
      router.push('/');
    }

    // Update sessions list
    setSessions(prev => prev.filter(s => s.id !== idToDelete));
  };

  const addCheckinEntry = (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newEntry: CheckinEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date(),
    };

    const updatedSession = {
      ...session,
      entries: [...session.entries, newEntry],
    };

    saveSession(updatedSession);
  };

  const addBodyMetric = (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newMetric: BodyMetric = {
      ...metric,
      id: generateId(),
      timestamp: new Date(),
    };

    const updatedSession = {
      ...session,
      bodyMetrics: [...session.bodyMetrics, newMetric],
    };

    saveSession(updatedSession);
  };

  const addJournalEntry = (content: string, tags: string[]) => {
    if (!session) return;

    const newEntry: JournalEntry = {
      id: generateId(),
      timestamp: new Date(),
      content,
      tags,
    };

    const updatedSession = {
      ...session,
      notes: [...session.notes, newEntry],
    };

    saveSession(updatedSession);
  };

  const endFast = () => {
    if (!session) return;

    const updatedSession = {
      ...session,
      endTime: new Date(),
      isActive: false,
    };

    saveSession(updatedSession);
  };

  const importSession = (importedSession: FastingSession) => {
    // Generate new ID for imported session
    const newSessionId = generateSessionId();
    const sessionWithNewId = {
      ...importedSession,
      id: newSessionId
    };

    // Save and navigate to it
    localStorage.setItem(`session:${newSessionId}`, JSON.stringify(sessionWithNewId));
    saveToKV(sessionWithNewId);
    router.push(`/session/${newSessionId}`);
  };

  return {
    sessions,
    activeSession: session,
    activeSessionId: sessionId,
    showNewSessionDialog,
    setShowNewSessionDialog,
    createNewSession,
    switchToSession,
    deleteSessionById,
    addCheckinEntry,
    addBodyMetric,
    addJournalEntry,
    endFast,
    importSession,
    isSyncing,
    lastSyncTime
  };
};