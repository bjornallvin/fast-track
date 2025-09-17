'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useUrlSessionData } from '@/hooks/useUrlSessionData';
import { isValidSessionId } from '@/utils/sessionId';
import { validateEditToken, generateEditToken } from '@/utils/editToken';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string[];
  const [tokenValidated, setTokenValidated] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse the URL structure
  const isNewFormat = slug.length === 2; // /session/[token]/[id]
  const isOldFormat = slug.length === 1; // /session/[id]

  const sessionId = isNewFormat ? slug[1] : slug[0];
  const editToken = isNewFormat ? slug[0] : null;

  // Validate session ID format
  useEffect(() => {
    if (!sessionId || !isValidSessionId(sessionId)) {
      router.push('/');
      return;
    }

    // Handle old format: /session/[id]
    if (isOldFormat) {
      // Load the session from localStorage
      const sessionData = localStorage.getItem(`session:${sessionId}`);

      if (!sessionData) {
        // Session doesn't exist, redirect to home
        router.push('/');
        return;
      }

      try {
        const session = JSON.parse(sessionData);

        if (session.editToken) {
          // Session already has an edit token - show error
          setShowError(true);
          setLoading(false);
          return;
        } else {
          // Session doesn't have an edit token, create one
          const newEditToken = generateEditToken();
          session.editToken = newEditToken;

          // Save the updated session with the edit token
          localStorage.setItem(`session:${sessionId}`, JSON.stringify(session));

          // Also save to KV if possible
          fetch(`/api/sessions/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
          }).catch(err => console.error('Error saving to KV:', err));

          // Redirect to the new URL format
          router.push(`/session/${newEditToken}/${sessionId}`);
        }
      } catch (error) {
        console.error('Error processing session:', error);
        router.push('/');
      }
    }
  }, [sessionId, isOldFormat, router]);

  // Load session data for new format
  const {
    sessions,
    activeSession,
    activeSessionId,
    showNewSessionDialog,
    setShowNewSessionDialog,
    createNewSession,
    switchToSession,
    deleteSessionById,
    addCheckinEntry,
    addBodyMetric,
    addJournalEntry,
    endFast,
    importSession
  } = useUrlSessionData(sessionId);

  // Validate edit token for new format
  useEffect(() => {
    if (isNewFormat && activeSession && !tokenValidated) {
      if (!validateEditToken(activeSession.editToken, editToken)) {
        router.push('/');
      } else {
        setTokenValidated(true);
        setLoading(false);
      }
    }
  }, [isNewFormat, activeSession, editToken, router, tokenValidated]);

  // Show error page for old format with existing token
  if (showError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This session requires a valid access token in the URL.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              If you're the owner of this session, use your bookmarked edit URL with the access token.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              For read-only access, visit:
              <span className="block mt-1 font-mono text-indigo-600 dark:text-indigo-400">
                /view/{sessionId}
              </span>
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading for old format redirects
  if (isOldFormat && loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to your session...</p>
        </div>
      </div>
    );
  }

  // Show loading while validating token for new format
  if (isNewFormat && (!tokenValidated && activeSession)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Validating access...</div>
      </div>
    );
  }

  // Don't render dashboard for old format (will redirect)
  if (isOldFormat) {
    return null;
  }

  // Render dashboard for validated new format
  return (
    <Dashboard
      session={activeSession}
      sessions={sessions}
      activeSessionId={activeSessionId}
      showNewSessionDialog={showNewSessionDialog}
      onAddCheckin={addCheckinEntry}
      onAddBodyMetric={addBodyMetric}
      onAddJournalEntry={addJournalEntry}
      onEndFast={endFast}
      onImportSession={importSession}
      onSwitchSession={switchToSession}
      onCreateNewSession={createNewSession}
      onDeleteSession={deleteSessionById}
      setShowNewSessionDialog={setShowNewSessionDialog}
    />
  );
}