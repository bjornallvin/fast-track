'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSessionId } from '@/utils/sessionId';
import { generateEditToken } from '@/utils/editToken';
import NewSessionDialog from '@/components/NewSessionDialog';
import type { FastingSession } from '@/types';

export default function Home() {
  const router = useRouter();
  const [showNewSession, setShowNewSession] = useState(false);
  const [recentSessions, setRecentSessions] = useState<FastingSession[]>([]);

  useEffect(() => {
    // Load recent sessions from localStorage
    const sessions: FastingSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('session:')) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            sessions.push(session);
          } catch (e) {
            console.error('Error parsing session:', e);
          }
        }
      }
    }

    // Sort by most recent activity
    sessions.sort((a, b) => {
      const aTime = a.endTime ? new Date(a.endTime).getTime() : new Date(a.startTime).getTime();
      const bTime = b.endTime ? new Date(b.endTime).getTime() : new Date(b.startTime).getTime();
      return bTime - aTime;
    });

    setRecentSessions(sessions.slice(0, 5)); // Show only 5 most recent
  }, []);

  const handleCreateSession = (name: string, startTime: Date, targetDuration: number) => {
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
      editToken
    };

    // Save to localStorage
    localStorage.setItem(`session:${sessionId}`, JSON.stringify(newSession));

    // Navigate to the new session
    router.push(`/session/${editToken}/${sessionId}`);
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
            <button
              onClick={() => setShowNewSession(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition duration-200 text-lg font-medium shadow-lg transform hover:scale-105"
            >
              Start New Fasting Session
            </button>
          </div>

          {recentSessions.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Your Recent Sessions
              </h3>
              <div className="space-y-3">
                {recentSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => router.push(`/session/${session.editToken}/${session.id}`)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
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
                      <div className="text-right">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {session.targetDuration}h fast
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
                <span>Enhanced mental clarity and focus</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Improved metabolic health</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Cellular autophagy activation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Increased energy levels</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Better insulin sensitivity</span>
              </li>
            </ul>
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
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
            Fasting Timeline & Metabolic Phases
          </h3>
          <div className="space-y-4">
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">0-4h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Fed State</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Body digesting and absorbing nutrients</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">4-16h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Early Fasting</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Blood sugar normalizes, body starts using stored glycogen</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">16-24h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Fat Burning</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Significant fat burning begins, HGH increases</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">24-48h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Autophagy</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cellular cleanup and regeneration accelerates</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-20 text-right mr-4">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">48-72h</span>
              </div>
              <div className="flex-1 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 p-3 rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
                <span className="font-medium text-gray-800 dark:text-white">Deep Ketosis</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Maximum autophagy, stem cell regeneration begins</p>
              </div>
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
    </div>
  );
}