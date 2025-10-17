'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSessionId } from '@/utils/sessionId';
import { generateEditToken } from '@/utils/editToken';
import NewSessionDialog from '@/components/NewSessionDialog';
import EmailSessionLinksDialog from '@/components/EmailSessionLinksDialog';
import type { FastingSession } from '@/types';
import type { SessionLink } from '@/types/sessionLink';

export default function Home() {
  const router = useRouter();
  const [showNewSession, setShowNewSession] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editableSessions, setEditableSessions] = useState<SessionLink[]>([]);
  const [readOnlySessions, setReadOnlySessions] = useState<SessionLink[]>([]);

  useEffect(() => {
    // Load session links from localStorage
    const loadSessionLinks = () => {
      const storedLinks = localStorage.getItem('sessionLinks');
      if (storedLinks) {
        try {
          const links: SessionLink[] = JSON.parse(storedLinks);
          // Convert dates
          const parsedLinks = links.map(link => ({
            ...link,
            lastAccessed: new Date(link.lastAccessed),
            startTime: new Date(link.startTime)
          }));

          // Split into editable and read-only
          const editable = parsedLinks.filter(link => link.type === 'editable');
          const readOnly = parsedLinks.filter(link => link.type === 'readonly');

          // Sort by last accessed
          editable.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
          readOnly.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());

          setEditableSessions(editable.slice(0, 5)); // Show max 5
          setReadOnlySessions(readOnly.slice(0, 5)); // Show max 5
        } catch (e) {
          console.error('Error loading session links:', e);
        }
      }
    };

    loadSessionLinks();
  }, []);

  const handleCreateSession = async (
    name: string,
    startTime: Date,
    targetDuration: number,
    email?: string
  ) => {
    const sessionId = generateSessionId();
    const editToken = generateEditToken();
    const newSession: FastingSession = {
      id: sessionId,
      name,
      startTime,
      endTime: null,
      targetDuration,
      isActive: true,
      entries: [],
      bodyMetrics: [],
      notes: [],
      editToken,
      email
    };

    // Save to KV
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });

      // Save link to localStorage
      const sessionLink: SessionLink = {
        id: sessionId,
        name,
        type: 'editable',
        editToken,
        lastAccessed: new Date(),
        startTime,
        targetDuration,
        isActive: true
      };

      const storedLinks = localStorage.getItem('sessionLinks');
      const links: SessionLink[] = storedLinks ? JSON.parse(storedLinks) : [];
      links.push(sessionLink);
      localStorage.setItem('sessionLinks', JSON.stringify(links));

    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to create session. Please try again.');
      return;
    }

    // Navigate to the new session
    router.push(`/session/${editToken}/${sessionId}`);
  };

  const navigateToSession = (link: SessionLink) => {
    // Update last accessed time
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      const links: SessionLink[] = JSON.parse(storedLinks);
      const index = links.findIndex(l => l.id === link.id && l.type === link.type);
      if (index !== -1) {
        links[index].lastAccessed = new Date();
        localStorage.setItem('sessionLinks', JSON.stringify(links));
      }
    }

    // Navigate based on type
    if (link.type === 'editable' && link.editToken) {
      router.push(`/session/${link.editToken}/${link.id}`);
    } else {
      router.push(`/view/${link.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Fast Track
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your comprehensive fasting companion with real-time tracking, insights, and shareable progress
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Begin Your Fasting Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              Start tracking your fast with comprehensive metrics, journal entries, and body measurements
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowNewSession(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition duration-200 text-lg font-medium shadow-lg transform hover:scale-105 cursor-pointer"
              >
                Start New Fasting Session
              </button>
              <button
                onClick={() => setShowEmailDialog(true)}
                className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 px-10 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-600 transition duration-200 text-lg font-medium shadow-lg transform hover:scale-105 cursor-pointer"
              >
                Email Me My Sessions
              </button>
            </div>
          </div>

          {(editableSessions.length > 0 || readOnlySessions.length > 0) && (
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              {editableSessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Your Sessions
                  </h3>
                  <div className="space-y-3">
                    {editableSessions.map(session => (
                      <button
                        key={`${session.id}-editable`}
                        onClick={() => navigateToSession(session)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                          session.isActive
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 hover:shadow-lg transform hover:-translate-y-1'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {session.name}
                              </span>
                              {session.isActive && (
                                <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full font-semibold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {session.targetDuration}h fast
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {readOnlySessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Sessions You're Following
                  </h3>
                  <div className="space-y-3">
                    {readOnlySessions.map(session => (
                      <button
                        key={`${session.id}-readonly`}
                        onClick={() => navigateToSession(session)}
                        className="w-full text-left p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-transparent hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {session.name}
                              </span>
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                View Only
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {session.targetDuration}h fast
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Benefits Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Fasting Benefits
              </h3>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Better blood sugar control</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Lower blood pressure and heart rate</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Reduced inflammation in the body</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Weight loss and less belly fat</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>May improve brain function (still being studied)</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Learn more:</p>
              <div className="space-y-1 mt-2">
                <a href="https://www.nejm.org/doi/full/10.1056/NEJMra1905136" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block">
                  → NEJM: Effects of Intermittent Fasting
                </a>
                <a href="https://pubmed.ncbi.nlm.nih.gov/31614992/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block">
                  → Effects on Health, Aging, and Disease
                </a>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Powerful Features
              </h3>
            </div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span>Real-time progress tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span>5 key wellness metrics</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span>Body composition tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span>Journal with tagging system</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span>Shareable read-only views</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Fasting Phases Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2 text-center">
            Metabolic Changes During Fasting
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Based on scientific literature - individual responses may vary
          </p>
          <div className="space-y-4">
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">0-4h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">After Eating</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Body processes food, stores energy for later use</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">4-16h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Early Fasting</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Body starts using stored sugar, making new energy</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">12-18h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Sugar Stores Running Low</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Liver sugar mostly used up, body starts burning more fat</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">18-24h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Fat Burning Mode</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Body switches to burning fat for energy</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">48-72h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Extended Fasting</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fat burning peaks, growth hormone rises, cell cleanup increases</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>⚠️ Medical Disclaimer:</strong> Fasting may not be suitable for everyone. Consult a healthcare provider before starting any fasting regimen, especially if you have diabetes, take medications, are pregnant/nursing, or have a history of eating disorders.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Scientific references:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5783752/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                → How the body responds to fasting (Anton et al., 2018)
              </a>
              <a href="https://www.cell.com/cell-metabolism/fulltext/S1550-4131(15)00224-7" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                → Fasting and brain health (Mattson et al., 2018)
              </a>
              <a href="https://pubmed.ncbi.nlm.nih.gov/30172870/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                → Cell cleanup during fasting (Levine et al., 2017)
              </a>
              <a href="https://www.annualreviews.org/doi/10.1146/annurev-nutr-071816-064634" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                → Body clocks and eating patterns (Panda, 2016)
              </a>
            </div>
          </div>
        </div>
      </div>

      {showNewSession && (
        <NewSessionDialog
          onCreateSession={handleCreateSession}
          onClose={() => setShowNewSession(false)}
        />
      )}

      {showEmailDialog && (
        <EmailSessionLinksDialog
          onClose={() => setShowEmailDialog(false)}
        />
      )}
    </div>
  );
}