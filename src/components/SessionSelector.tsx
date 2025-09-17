import { useState } from 'react';
import type { FastingSession } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';
import { calculateElapsedTime } from '../utils/calculations';

interface SessionSelectorProps {
  sessions: FastingSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateNew: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNew,
  onDeleteSession,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const getSessionStatus = (session: FastingSession) => {
    if (session.isActive) {
      const elapsed = calculateElapsedTime(session.startTime);
      return `Active - ${elapsed.hours}h ${elapsed.minutes}m`;
    } else {
      return 'Completed';
    }
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm === sessionId) {
      onDeleteSession(sessionId);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(sessionId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-600"
      >
        <div className="text-left">
          <div className="font-semibold text-gray-900 dark:text-white">
            {activeSession ? activeSession.name : 'No Session'}
          </div>
          {activeSession && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getSessionStatus(activeSession)}
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onCreateNew();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Session
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No sessions yet. Create your first session!
                </div>
              ) : (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1">
                    Sessions ({sessions.length})
                  </div>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        session.id === activeSessionId
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {session.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Started: {formatSwedishDateTime(session.startTime)}
                          </div>
                          <div className="text-xs mt-1">
                            {session.isActive ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {getSessionStatus(session)}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {session.entries.length} check-ins, {session.bodyMetrics.length} metrics
                          </div>
                        </div>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className="ml-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete session"
                          >
                            {showDeleteConfirm === session.id ? (
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionSelector;