import { useState, useRef } from 'react';
import Timer from './Timer';
import CheckinForm from './CheckinForm';
import Journal from './Journal';
import BodyMetrics from './BodyMetrics';
import ProgressChart from './ProgressChart';
import SessionSelector from './SessionSelector';
import NewSessionDialog from './NewSessionDialog';
import ShareButton from './ShareButton';
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

  const handleShareSession = () => {
    if (!session) return;

    // Create shareable read-only URL (simple, without token)
    const shareUrl = `${window.location.origin}/view/${session.id}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Show success message (you might want to add a toast notification here)
      console.log('Share link copied to clipboard:', shareUrl);
      alert(`Share link copied to clipboard!\n\n${shareUrl}\n\nAnyone with this link can view your fasting session (read-only).`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback: show the URL in an alert so user can copy manually
      alert(`Share this link to allow others to view your session:\n\n${shareUrl}`);
    });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fasting Tracker</h1>
          <SessionSelector
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSwitchSession}
            onCreateNew={() => setShowNewSessionDialog(true)}
            onDeleteSession={onDeleteSession}
          />
        </div>

        {!session ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No active session. Create a new fasting session to get started!</p>
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
            {session && <ShareButton sessionId={session.id} />}
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Latest Check-in</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center group relative">
                    <p className="text-sm text-gray-600 dark:text-gray-400 cursor-help">Energy</p>
                    <p className="text-2xl font-bold text-green-600">{latest.energy}/10</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">Energy Level</div>
                      <div>1-3: Very tired, exhausted</div>
                      <div>4-6: Some fatigue, manageable</div>
                      <div>7-10: Good energy, feeling strong</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center group relative">
                    <p className="text-sm text-gray-600 dark:text-gray-400 cursor-help">Hunger</p>
                    <p className="text-2xl font-bold text-red-600">{latest.hunger}/10</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">Hunger Level</div>
                      <div>1-3: Minimal hunger</div>
                      <div>4-6: Moderate, manageable</div>
                      <div>7-10: Strong hunger, challenging</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center group relative">
                    <p className="text-sm text-gray-600 dark:text-gray-400 cursor-help">Mental Clarity</p>
                    <p className="text-2xl font-bold text-blue-600">{latest.mentalClarity}/10</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">Mental Clarity</div>
                      <div>1-3: Brain fog, difficulty focusing</div>
                      <div>4-6: Average clarity</div>
                      <div>7-10: Sharp, clear thinking</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center group relative">
                    <p className="text-sm text-gray-600 dark:text-gray-400 cursor-help">Mood</p>
                    <p className="text-2xl font-bold text-amber-600">{latest.mood}/10</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">Mood</div>
                      <div>1-3: Irritable, low mood</div>
                      <div>4-6: Neutral, stable</div>
                      <div>7-10: Positive, upbeat</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center group relative">
                    <p className="text-sm text-gray-600 dark:text-gray-400 cursor-help">Physical Comfort</p>
                    <p className="text-2xl font-bold text-violet-600">{latest.physicalComfort}/10</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold mb-1">Physical Comfort</div>
                      <div>1-3: Significant discomfort</div>
                      <div>4-6: Some discomfort</div>
                      <div>7-10: Comfortable, feeling good</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Data Management</h3>
          {importError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
              {importError}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJSON}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Export your fasting data for backup or analysis.
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