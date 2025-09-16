import type { FastingSession } from '../types';

const SESSIONS_KEY = 'fasting_sessions';
const ACTIVE_SESSION_KEY = 'active_session_id';

export interface SessionsData {
  sessions: FastingSession[];
  activeSessionId: string | null;
}

/**
 * Load all sessions from localStorage
 */
export const loadAllSessions = (): SessionsData => {
  if (typeof window === 'undefined') {
    return { sessions: [], activeSessionId: null };
  }

  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      const sessions = parsed.sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null,
        entries: session.entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })),
        bodyMetrics: session.bodyMetrics.map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        })),
        notes: session.notes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp)
        }))
      }));

      return {
        sessions,
        activeSessionId: parsed.activeSessionId || (sessions.length > 0 ? sessions[0].id : null)
      };
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }

  return { sessions: [], activeSessionId: null };
};

/**
 * Save all sessions to localStorage
 */
export const saveAllSessions = (data: SessionsData) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(data));
    if (data.activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, data.activeSessionId);
    }
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

/**
 * Add a new session
 */
export const addSession = (session: FastingSession): SessionsData => {
  const data = loadAllSessions();
  data.sessions.push(session);
  data.activeSessionId = session.id;
  saveAllSessions(data);
  return data;
};

/**
 * Update an existing session
 */
export const updateSession = (sessionId: string, updatedSession: FastingSession): SessionsData => {
  const data = loadAllSessions();
  const index = data.sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    data.sessions[index] = updatedSession;
    saveAllSessions(data);
  }
  return data;
};

/**
 * Delete a session
 */
export const deleteSession = (sessionId: string): SessionsData => {
  const data = loadAllSessions();
  data.sessions = data.sessions.filter(s => s.id !== sessionId);

  // If we deleted the active session, set a new active session
  if (data.activeSessionId === sessionId) {
    data.activeSessionId = data.sessions.length > 0 ? data.sessions[0].id : null;
  }

  saveAllSessions(data);
  return data;
};

/**
 * Set the active session
 */
export const setActiveSession = (sessionId: string): SessionsData => {
  const data = loadAllSessions();
  if (data.sessions.some(s => s.id === sessionId)) {
    data.activeSessionId = sessionId;
    saveAllSessions(data);
  }
  return data;
};

/**
 * Get the active session
 */
export const getActiveSession = (): FastingSession | null => {
  const data = loadAllSessions();
  if (!data.activeSessionId) return null;

  return data.sessions.find(s => s.id === data.activeSessionId) || null;
};