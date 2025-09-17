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
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load session from KV
  const loadSession = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
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
            // Save directly without using saveToKV to avoid circular dependency
            fetch(`/api/sessions/${sessionId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sessionWithDates)
            }).catch(err => console.error('Error saving token:', err));
          }

          // Only update state if the session has actually changed
          setSession(prevSession => {
            // If it's the initial load or data has changed, update
            if (!prevSession || JSON.stringify(prevSession) !== JSON.stringify(sessionWithDates)) {
              return sessionWithDates;
            }
            // Otherwise keep the same reference
            return prevSession;
          });
          setLastSyncTime(new Date());
        }
      } else if (response.status === 404) {
        // Session doesn't exist
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading from KV:', error);
      setSession(null);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
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
          headers: {
            'Content-Type': 'application/json',
          },
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

  // Load all sessions is removed for privacy - sessions are only stored in localStorage

  // Update session and save
  const updateSession = useCallback((updates: Partial<FastingSession>) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveToKV(updated);
      return updated;
    });
  }, [saveToKV]);

  // Add check-in
  const addCheckin = useCallback((checkin: Omit<CheckinEntry, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newCheckin: CheckinEntry = {
      ...checkin,
      id: generateId(),
      timestamp: new Date()
    };

    const updatedSession = {
      ...session,
      entries: [...session.entries, newCheckin]
    };

    setSession(updatedSession);
    saveToKV(updatedSession);
  }, [session, saveToKV]);

  // Add body metric
  const addBodyMetric = useCallback((metric: Omit<BodyMetric, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newMetric: BodyMetric = {
      ...metric,
      id: generateId(),
      timestamp: new Date()
    };

    const updatedSession = {
      ...session,
      bodyMetrics: [...session.bodyMetrics, newMetric]
    };

    setSession(updatedSession);
    saveToKV(updatedSession);
  }, [session, saveToKV]);

  // Add journal entry
  const addJournalEntry = useCallback((content: string, tags: string[]) => {
    if (!session) return;

    const newEntry: JournalEntry = {
      id: generateId(),
      content,
      tags,
      timestamp: new Date()
    };

    const updatedSession = {
      ...session,
      notes: [...session.notes, newEntry]
    };

    setSession(updatedSession);
    saveToKV(updatedSession);
  }, [session, saveToKV]);

  // End fast
  const endFast = useCallback(() => {
    if (!session) return;

    const updatedSession = {
      ...session,
      endTime: new Date(),
      isActive: false
    };

    setSession(updatedSession);
    saveToKV(updatedSession);
  }, [session, saveToKV]);

  // Delete session
  const deleteSession = useCallback(async (idToDelete: string) => {
    try {
      await fetch(`/api/sessions/${idToDelete}`, {
        method: 'DELETE'
      });

      // If deleting current session, redirect
      if (idToDelete === sessionId) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [sessionId, router]);

  // Create new session
  const createSession = useCallback(async (name: string, startTime: Date, targetDuration: number) => {
    const newId = generateSessionId();
    const editToken = generateEditToken();
    const newSession: FastingSession = {
      id: newId,
      name,
      startTime,
      endTime: null,
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
      editToken
    };

    try {
      await fetch(`/api/sessions/${newId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession)
      });

      // Navigate to the new session
      router.push(`/session/${editToken}/${newId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  }, [router]);

  // Load session on mount and set up sync
  useEffect(() => {
    loadSession(true); // Initial load

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      loadSession(false); // Background sync, don't show loading
    }, SYNC_INTERVAL);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadSession]);

  return {
    session,
    showNewSessionDialog,
    setShowNewSessionDialog,
    isSyncing,
    lastSyncTime,
    loading,
    addCheckin,
    addBodyMetric,
    addJournalEntry,
    endFast,
    createSession,
    deleteSession,
    updateSession
  };
};