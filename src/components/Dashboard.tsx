import { useState, useRef } from 'react';
import Timer from './Timer';
import CheckinForm from './CheckinForm';
import Journal from './Journal';
import BodyMetrics from './BodyMetrics';
import ProgressChart from './ProgressChart';
import SessionSelector from './SessionSelector';
import NewSessionDialog from './NewSessionDialog';
import type { FastingSession, CheckinEntry, BodyMetric } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';
import { exportSessionData, exportSessionDataAsCSV, importSessionData } from '../utils/dataExport';

interface DashboardProps {
  session: FastingSession | null;
  sessions: FastingSession[];
  activeSessionId: string | null;
  showNewSessionDialog: boolean;
  onAddCheckin: (entry: Omit<CheckinEntry, 'id' | 'timestamp'>) => void;
  onAddBodyMetric: (metric: Omit<BodyMetric, 'id' | 'timestamp'>) => void;
  onAddJournalEntry: (content: string, tags: string[]) => void;
  onEndFast: () => void;
  onImportSession: (session: FastingSession) => void;
  onSwitchSession: (sessionId: string) => void;
  onCreateNewSession: (name: string, startTime: Date, targetDuration: number) => void;
  onDeleteSession: (sessionId: string) => void;
  setShowNewSessionDialog: (show: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  session,
  sessions,
  activeSessionId,
  showNewSessionDialog,
  onAddCheckin,
  onAddBodyMetric,
  onAddJournalEntry,
  onEndFast,
  onImportSession,
  onSwitchSession,
  onCreateNewSession,
  onDeleteSession,
  setShowNewSessionDialog,
}) => {
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLatestCheckin = () => {
    if (!session || session.entries.length === 0) return null;
    return [...session.entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  };

  const latest = getLatestCheckin();

  const handleExportJSON = () => {
    if (!session) return;
    const fileName = exportSessionData(session);
    console.log(`Exported session data to ${fileName}`);
  };

  const handleExportCSV = () => {
    if (!session) return;
    const fileName = exportSessionDataAsCSV(session);
    console.log(`Exported session data to ${fileName}`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const importedSession = await importSessionData(file);
      onImportSession(importedSession);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import session data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Fasting Tracker</h1>
          <SessionSelector
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSwitchSession}
            onCreateNew={() => setShowNewSessionDialog(true)}
            onDeleteSession={onDeleteSession}
          />
        </div>

        {!session ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
            <p className="text-gray-600 mb-4">No active session. Create a new fasting session to get started!</p>
            <button
              onClick={() => setShowNewSessionDialog(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200 font-medium"
            >
              Create New Session
            </button>
          </div>
        ) : (
          <>
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setShowCheckinForm(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200 font-medium"
              disabled={!session || !session.isActive}
            >
              Quick Check-in
            </button>
            {session && session.isActive && (
              <button
                onClick={onEndFast}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition duration-200 font-medium"
              >
                End Fast
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            {session && (
              <Timer
                startTime={session.startTime}
                targetDuration={session.targetDuration}
                isActive={session.isActive}
              />
            )}
          </div>

          {latest && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Latest Check-in</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Energy</p>
                    <p className="text-2xl font-bold text-green-600">{latest.energy}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Hunger</p>
                    <p className="text-2xl font-bold text-red-600">{latest.hunger}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Mental Clarity</p>
                    <p className="text-2xl font-bold text-blue-600">{latest.mentalClarity}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Mood</p>
                    <p className="text-2xl font-bold text-amber-600">{latest.mood}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Physical Comfort</p>
                    <p className="text-2xl font-bold text-violet-600">{latest.physicalComfort}/10</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Last updated: {formatSwedishDateTime(latest.timestamp)}
                </p>
              </div>
            </div>
          )}
        </div>

        {session && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ProgressChart entries={session.entries} />
              <BodyMetrics metrics={session.bodyMetrics} onAddMetric={onAddBodyMetric} />
            </div>

            <div className="mb-6">
              <Journal entries={session.notes} onAddEntry={onAddJournalEntry} />
            </div>
          </>
        )}

        {/* Export/Import Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Data Management</h3>
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {importError}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJSON}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
            <label className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200 cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import Session
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Export your fasting data for backup or analysis. Import previously saved sessions to continue tracking.
          </p>
        </div>

          </>
        )}

        {showCheckinForm && session && (
          <CheckinForm
            onSubmit={onAddCheckin}
            onClose={() => setShowCheckinForm(false)}
          />
        )}

        {showNewSessionDialog && (
          <NewSessionDialog
            onCreateSession={onCreateNewSession}
            onClose={() => setShowNewSessionDialog(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;