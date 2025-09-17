import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionLink } from '../types/sessionLink';

interface SessionSelectorProps {
  currentSessionId: string | null;
  currentSessionName?: string;
  onCreateNew: () => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
  currentSessionId,
  currentSessionName,
  onCreateNew,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessionLinks, setSessionLinks] = useState<SessionLink[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load session links from localStorage
    const loadSessionLinks = () => {
      const storedLinks = localStorage.getItem('sessionLinks');
      if (storedLinks) {
        try {
          const links: SessionLink[] = JSON.parse(storedLinks);
          // Only show editable sessions in the dropdown
          const editableLinks = links.filter(link => link.type === 'editable');
          // Sort by last accessed
          editableLinks.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
          setSessionLinks(editableLinks);
        } catch (e) {
          console.error('Error loading session links:', e);
        }
      }
    };

    loadSessionLinks();
    // Reload when dropdown opens
    if (isDropdownOpen) {
      loadSessionLinks();
    }
  }, [isDropdownOpen]);

  const handleSelectSession = (link: SessionLink) => {
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

    // Navigate to the session
    router.push(`/session/${link.editToken}/${link.id}`);
    setIsDropdownOpen(false);
  };

  const handleDeleteSession = (link: SessionLink, e: React.MouseEvent) => {
    e.stopPropagation();

    // Remove from localStorage
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      const links: SessionLink[] = JSON.parse(storedLinks);
      const filteredLinks = links.filter(l => !(l.id === link.id && l.type === link.type));
      localStorage.setItem('sessionLinks', JSON.stringify(filteredLinks));

      // Update state
      setSessionLinks(prev => prev.filter(l => l.id !== link.id));
    }

    // If deleting current session, redirect to home
    if (link.id === currentSessionId) {
      router.push('/');
    }
  };

  const currentSession = sessionLinks.find(s => s.id === currentSessionId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-600"
      >
        <div className="text-left">
          <div className="font-semibold text-gray-900 dark:text-white">
            {currentSessionName || currentSession?.name || 'Session'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentSession ? (
              currentSession.isActive ? 'Active' : 'Completed'
            ) : (
              'Select a session'
            )}
          </div>
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
              {sessionLinks.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No sessions yet. Create your first session!
                </div>
              ) : (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1">
                    Your Sessions ({sessionLinks.length})
                  </div>
                  {sessionLinks.map((link) => (
                    <div
                      key={link.id}
                      onClick={() => handleSelectSession(link)}
                      className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        link.id === currentSessionId
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {link.name}
                            </span>
                            {link.isActive && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {link.targetDuration}h fast
                          </div>
                        </div>
                        {sessionLinks.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSession(link, e)}
                            className="ml-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove from list"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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