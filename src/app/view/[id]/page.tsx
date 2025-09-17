'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isValidSessionId } from '@/utils/sessionId';
import type { FastingSession } from '@/types';
import type { SessionLink } from '@/types/sessionLink';
import Timer from '@/components/Timer';
import ProgressChart from '@/components/ProgressChart';
import { formatSwedishDateTime } from '@/utils/dateFormat';

export default function ViewSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidSessionId(sessionId)) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        // Load from KV
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const kvSession = await response.json();
          if (kvSession) {
            const sessionWithDates = {
              ...kvSession,
              startTime: new Date(kvSession.startTime),
              endTime: kvSession.endTime ? new Date(kvSession.endTime) : null,
              entries: kvSession.entries.map((e: any) => ({
                ...e,
                timestamp: new Date(e.timestamp)
              })),
              bodyMetrics: kvSession.bodyMetrics.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })),
              notes: kvSession.notes.map((n: any) => ({
                ...n,
                timestamp: new Date(n.timestamp)
              }))
            };
            setSession(sessionWithDates);

            // Save as read-only link to localStorage
            const sessionLink: SessionLink = {
              id: sessionId,
              name: sessionWithDates.name,
              type: 'readonly',
              lastAccessed: new Date(),
              startTime: sessionWithDates.startTime,
              targetDuration: sessionWithDates.targetDuration,
              isActive: sessionWithDates.isActive
            };

            const storedLinks = localStorage.getItem('sessionLinks');
            const links: SessionLink[] = storedLinks ? JSON.parse(storedLinks) : [];

            // Check if this read-only link already exists
            const existingIndex = links.findIndex(l => l.id === sessionId && l.type === 'readonly');
            if (existingIndex !== -1) {
              // Update last accessed time
              links[existingIndex].lastAccessed = new Date();
              links[existingIndex].name = sessionWithDates.name;
              links[existingIndex].isActive = sessionWithDates.isActive;
            } else {
              // Add new read-only link
              links.push(sessionLink);
            }

            localStorage.setItem('sessionLinks', JSON.stringify(links));
          } else {
            setError('Session not found');
          }
        } else if (response.status === 404) {
          setError('Session not found');
        } else {
          setError('Failed to load session');
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Session not found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This session may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Read-only banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              View-only mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Session: {session.name}
            </span>
            <a
              href="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Your Own Session
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Timer Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Timer
              startTime={session.startTime}
              targetDuration={session.targetDuration}
              isActive={session.isActive}
            />
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Session Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Started:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatSwedishDateTime(session.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Target:</span>
                  <span className="text-gray-900 dark:text-white">
                    {session.targetDuration} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-medium ${session.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {session.isActive ? 'Active' : 'Completed'}
                  </span>
                </div>
                {session.endTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ended:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatSwedishDateTime(session.endTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Latest Check-in */}
        {session.entries.length > 0 && (() => {
          const latest = [...session.entries].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];

          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
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
          );
        })()}

        {/* Charts Section */}
        {session.entries.length > 0 && (
          <div className="mb-8">
            <ProgressChart
              entries={session.entries}
            />
          </div>
        )}


        {/* Body Metrics Details */}
        {session.bodyMetrics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Body Metrics History
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Body Fat %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[...session.bodyMetrics].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  ).map((metric) => (
                    <tr key={metric.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatSwedishDateTime(metric.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {metric.weight ? `${metric.weight} kg` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {metric.bodyFatPercentage ? `${metric.bodyFatPercentage}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {session.bodyMetrics.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Progress Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const firstMetric = session.bodyMetrics[0];
                    const lastMetric = session.bodyMetrics[session.bodyMetrics.length - 1];
                    const weightChange = (lastMetric.weight && firstMetric.weight)
                      ? (lastMetric.weight - firstMetric.weight).toFixed(1)
                      : null;
                    const fatChange = (lastMetric.bodyFatPercentage && firstMetric.bodyFatPercentage)
                      ? (lastMetric.bodyFatPercentage - firstMetric.bodyFatPercentage).toFixed(1)
                      : null;

                    return (
                      <>
                        {weightChange && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Weight Change</p>
                            <p className={`text-lg font-semibold ${parseFloat(weightChange) < 0 ? 'text-green-600' : parseFloat(weightChange) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                            </p>
                          </div>
                        )}
                        {fatChange && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Body Fat Change</p>
                            <p className={`text-lg font-semibold ${parseFloat(fatChange) < 0 ? 'text-green-600' : parseFloat(fatChange) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {parseFloat(fatChange) > 0 ? '+' : ''}{fatChange}%
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Journal Section */}
        {session.notes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Journal Entries
            </h3>
            <div className="space-y-4">
              {[...session.notes].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              ).map((note) => (
                <div key={note.id} className="border-l-4 border-indigo-200 dark:border-indigo-800 pl-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {formatSwedishDateTime(note.timestamp)}
                  </div>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Check-ins
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.entries.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Body Metrics
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.bodyMetrics.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Journal Entries
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.notes.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}