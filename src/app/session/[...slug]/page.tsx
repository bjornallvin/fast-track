'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useUrlSessionData } from '@/hooks/useUrlSessionData';
import { isValidSessionId } from '@/utils/sessionId';
import { validateEditToken, generateEditToken } from '@/utils/editToken';
import type { SessionLink } from '@/types/sessionLink';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string[];
  const [tokenValidated, setTokenValidated] = useState(false);

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
      // For old format, we need to check KV for the session
      fetch(`/api/sessions/${sessionId}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Session not found');
        })
        .then(session => {
          if (session.editToken) {
            // Redirect to view page since they don't have the token
            router.push(`/view/${sessionId}`);
          } else {
            // Generate new token and update session
            const newEditToken = generateEditToken();
            session.editToken = newEditToken;

            // Save updated session
            return fetch(`/api/sessions/${sessionId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(session)
            }).then(() => {
              // Redirect to new format
              router.push(`/session/${newEditToken}/${sessionId}`);
            });
          }
        })
        .catch(err => {
          console.error('Error handling old format:', err);
          router.push('/');
        });
    }
  }, [sessionId, isOldFormat, router]);

  // Load session data
  const {
    session,
    showNewSessionDialog,
    setShowNewSessionDialog,
    loading,
    isSyncing,
    lastSyncTime,
    addCheckin,
    addBodyMetric,
    addJournalEntry,
    endFast,
    createSession,
    deleteSession,
    updateSession
  } = useUrlSessionData(sessionId);

  // Validate edit token for new format
  useEffect(() => {
    if (isNewFormat && session && !tokenValidated) {
      if (!validateEditToken(session.editToken, editToken)) {
        // Invalid token, redirect to view page
        router.push(`/view/${sessionId}`);
      } else {
        setTokenValidated(true);

        // Save as editable link to localStorage
        const sessionLink: SessionLink = {
          id: sessionId,
          name: session.name,
          type: 'editable',
          editToken: editToken!,
          lastAccessed: new Date(),
          startTime: session.startTime,
          targetDuration: session.targetDuration,
          isActive: session.isActive
        };

        const storedLinks = localStorage.getItem('sessionLinks');
        const links: SessionLink[] = storedLinks ? JSON.parse(storedLinks) : [];

        // Check if this editable link already exists
        const existingIndex = links.findIndex(l => l.id === sessionId && l.type === 'editable');
        if (existingIndex !== -1) {
          // Update last accessed time and session info
          links[existingIndex].lastAccessed = new Date();
          links[existingIndex].name = session.name;
          links[existingIndex].isActive = session.isActive;
        } else {
          // Add new editable link
          links.push(sessionLink);
        }

        localStorage.setItem('sessionLinks', JSON.stringify(links));
      }
    }
  }, [isNewFormat, session, editToken, sessionId, router, tokenValidated]);

  // Show loading for old format redirects
  if (isOldFormat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading while loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show error if no session found
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Session not found
          </h1>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading while validating token
  if (isNewFormat && !tokenValidated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Validating access...</div>
      </div>
    );
  }

  // Render dashboard for validated new format
  return (
    <Dashboard
      session={session}
      activeSessionId={sessionId}
      showNewSessionDialog={showNewSessionDialog}
      onAddCheckin={addCheckin}
      onAddBodyMetric={addBodyMetric}
      onAddJournalEntry={addJournalEntry}
      onEndFast={endFast}
      onCreateNewSession={createSession}
      setShowNewSessionDialog={setShowNewSessionDialog}
      onImportSession={(importedSession) => {
        // Import is not supported with KV-only storage
        console.log('Import not supported');
      }}
    />
  );
}