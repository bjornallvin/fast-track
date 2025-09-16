import type { FastingSession } from '../types';

const STORAGE_KEY = 'fasting-tracker-data';

export const loadSession = (): FastingSession | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const session = JSON.parse(data);
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      session.entries = session.entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      session.bodyMetrics = session.bodyMetrics.map((metric: any) => ({
        ...metric,
        timestamp: new Date(metric.timestamp),
      }));
      session.notes = session.notes.map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
      }));
      return session;
    }
    return null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

export const saveSession = (session: FastingSession): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};