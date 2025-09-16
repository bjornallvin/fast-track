'use client';

import Dashboard from '@/components/Dashboard';
import { useMultiSessionData } from '@/hooks/useMultiSessionData';

export default function Home() {
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
  } = useMultiSessionData();

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