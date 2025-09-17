import { useState, useEffect } from 'react';
import type { FastingSession, CheckinEntry, BodyMetric, JournalEntry } from '../types';
import { loadSession, saveSession } from '../utils/storage';
import { generateId } from '../utils/calculations';

// Get yesterday at 5 PM
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(17, 0, 0, 0);
const DEFAULT_START_TIME = yesterday;

export const useFastingData = () => {
  const [session, setSession] = useState<FastingSession | null>(null);

  useEffect(() => {
    const loadedSession = loadSession();
    if (loadedSession) {
      setSession(loadedSession);
    } else {
      // Create default session starting yesterday at 5 PM
      const newSession: FastingSession = {
        id: generateId(),
        name: 'Default Session',
        startTime: DEFAULT_START_TIME,
        targetDuration: 72,
        isActive: true,
        entries: [],
        bodyMetrics: [],
        notes: [],
      };
      setSession(newSession);
      saveSession(newSession);
    }
  }, []);

  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  const addCheckinEntry = (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newEntry: CheckinEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date(),
    };

    setSession({
      ...session,
      entries: [...session.entries, newEntry],
    });
  };

  const addBodyMetric = (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => {
    if (!session) return;

    const newMetric: BodyMetric = {
      ...metric,
      id: generateId(),
      timestamp: new Date(),
    };

    setSession({
      ...session,
      bodyMetrics: [...session.bodyMetrics, newMetric],
    });
  };

  const addJournalEntry = (content: string, tags: string[]) => {
    if (!session) return;

    const newNote: JournalEntry = {
      id: generateId(),
      timestamp: new Date(),
      content,
      tags,
    };

    setSession({
      ...session,
      notes: [...session.notes, newNote],
    });
  };

  const endFast = () => {
    if (!session) return;

    setSession({
      ...session,
      isActive: false,
    });
  };

  const startNewFast = (startTime?: Date, targetDuration = 72) => {
    const newSession: FastingSession = {
      id: generateId(),
      name: 'New Session',
      startTime: startTime || new Date(),
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
    };
    setSession(newSession);
  };

  const importSession = (importedSession: FastingSession) => {
    setSession(importedSession);
    saveSession(importedSession);
  };

  return {
    session,
    addCheckinEntry,
    addBodyMetric,
    addJournalEntry,
    endFast,
    startNewFast,
    importSession,
  };
};