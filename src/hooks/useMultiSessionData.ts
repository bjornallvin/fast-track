import { useState, useEffect } from 'react';
import type { FastingSession, CheckinEntry, BodyMetric, JournalEntry } from '../types';
import {
  loadAllSessions,
  saveAllSessions,
  addSession,
  updateSession,
  deleteSession,
  setActiveSession as setActiveSessionInStorage,
  type SessionsData
} from '../utils/multiSessionStorage';
import { generateId } from '../utils/calculations';
import { loadSession as loadLegacySession } from '../utils/storage';

export const useMultiSessionData = () => {
  const [sessionsData, setSessionsData] = useState<SessionsData>({ sessions: [], activeSessionId: null });
  const [activeSession, setActiveSession] = useState<FastingSession | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    let data = loadAllSessions();

    // Migrate legacy session if exists and no sessions yet
    if (data.sessions.length === 0) {
      const legacySession = loadLegacySession();
      if (legacySession) {
        // Add name to legacy session
        const migratedSession: FastingSession = {
          ...legacySession,
          name: 'Session 1',
          endTime: legacySession.isActive ? null : new Date()
        };
        data = addSession(migratedSession);
      }
    }

    // If still no sessions, don't create one automatically - let user create
    setSessionsData(data);

    if (data.activeSessionId) {
      const active = data.sessions.find(s => s.id === data.activeSessionId);
      setActiveSession(active || null);
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessionsData.sessions.length > 0) {
      saveAllSessions(sessionsData);
    }
  }, [sessionsData]);

  const createNewSession = (name: string, startTime?: Date, targetDuration = 72) => {
    const newSession: FastingSession = {
      id: generateId(),
      name,
      startTime: startTime || new Date(),
      endTime: null,
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
    };

    const updatedData = addSession(newSession);
    setSessionsData(updatedData);
    setActiveSession(newSession);
    setShowNewSessionDialog(false);
    return newSession;
  };

  const switchToSession = (sessionId: string) => {
    const updatedData = setActiveSessionInStorage(sessionId);
    setSessionsData(updatedData);
    const session = updatedData.sessions.find(s => s.id === sessionId);
    setActiveSession(session || null);
  };

  const deleteSessionById = (sessionId: string) => {
    const updatedData = deleteSession(sessionId);
    setSessionsData(updatedData);

    if (sessionsData.activeSessionId === sessionId) {
      const newActive = updatedData.sessions.length > 0 ? updatedData.sessions[0] : null;
      setActiveSession(newActive);
    }
  };

  const updateCurrentSession = (updater: (session: FastingSession) => FastingSession) => {
    if (!activeSession) return;

    const updatedSession = updater(activeSession);
    const updatedData = updateSession(activeSession.id, updatedSession);
    setSessionsData(updatedData);
    setActiveSession(updatedSession);
  };

  const addCheckinEntry = (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => {
    updateCurrentSession(session => ({
      ...session,
      entries: [...session.entries, {
        ...entry,
        id: generateId(),
        timestamp: new Date()
      }]
    }));
  };

  const addBodyMetric = (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => {
    updateCurrentSession(session => ({
      ...session,
      bodyMetrics: [...session.bodyMetrics, {
        ...metric,
        id: generateId(),
        timestamp: new Date()
      }]
    }));
  };

  const addJournalEntry = (content: string, tags: string[]) => {
    updateCurrentSession(session => ({
      ...session,
      notes: [...session.notes, {
        id: generateId(),
        timestamp: new Date(),
        content,
        tags
      }]
    }));
  };

  const endFast = () => {
    updateCurrentSession(session => ({
      ...session,
      isActive: false,
      endTime: new Date()
    }));
  };

  const importSession = (importedSession: FastingSession) => {
    // Ensure the imported session has a name
    const sessionWithName: FastingSession = {
      ...importedSession,
      name: importedSession.name || `Imported ${new Date().toISOString().split('T')[0]}`
    };

    const updatedData = addSession(sessionWithName);
    setSessionsData(updatedData);
    setActiveSession(sessionWithName);
  };

  return {
    sessions: sessionsData.sessions,
    activeSession,
    activeSessionId: sessionsData.activeSessionId,
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
  };
};