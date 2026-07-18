'use client';

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
    const loadSessionLinks = () => {
      const storedLinks = localStorage.getItem('sessionLinks');
      if (storedLinks) {
        try {
          const links: SessionLink[] = JSON.parse(storedLinks);
          const editableLinks = links.filter(link => link.type === 'editable');
          editableLinks.sort(
            (a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
          );
          setSessionLinks(editableLinks);
        } catch (e) {
          console.error('Error loading session links:', e);
        }
      }
    };

    loadSessionLinks();
    if (isDropdownOpen) {
      loadSessionLinks();
    }
  }, [isDropdownOpen]);

  const handleSelectSession = (link: SessionLink) => {
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      const links: SessionLink[] = JSON.parse(storedLinks);
      const index = links.findIndex(l => l.id === link.id && l.type === link.type);
      if (index !== -1) {
        links[index].lastAccessed = new Date();
        localStorage.setItem('sessionLinks', JSON.stringify(links));
      }
    }
    router.push(`/session/${link.editToken}/${link.id}`);
    setIsDropdownOpen(false);
  };

  const handleDeleteSession = (link: SessionLink, e: React.MouseEvent) => {
    e.stopPropagation();
    const storedLinks = localStorage.getItem('sessionLinks');
    if (storedLinks) {
      const links: SessionLink[] = JSON.parse(storedLinks);
      const filteredLinks = links.filter(l => !(l.id === link.id && l.type === link.type));
      localStorage.setItem('sessionLinks', JSON.stringify(filteredLinks));
      setSessionLinks(prev => prev.filter(l => l.id !== link.id));
    }
    if (link.id === currentSessionId) {
      router.push('/');
    }
  };

  const currentSession = sessionLinks.find(s => s.id === currentSessionId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-card border border-line px-3.5 py-2 rounded-xl cursor-pointer hover:border-muted"
      >
        <div className="text-left">
          <div className="font-semibold text-sm">
            {currentSessionName || currentSession?.name || 'Your fasts'}
          </div>
          <div className="text-xs text-muted">
            {currentSession
              ? currentSession.isActive
                ? 'fasting'
                : 'completed'
              : 'switch fast'}
          </div>
        </div>
        <span
          className={`text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        >
          ⌄
        </span>
      </button>

      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-72 bg-paper rounded-2xl shadow-xl border border-line z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onCreateNew();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-card text-clay font-semibold text-sm cursor-pointer"
              >
                ＋ Start a new fast
              </button>
            </div>

            <div className="border-t border-line">
              {sessionLinks.length === 0 ? (
                <div className="p-4 text-center font-serif italic text-muted text-sm">
                  no fasts on this device yet
                </div>
              ) : (
                <div className="p-2">
                  {sessionLinks.map(link => (
                    <div
                      key={link.id}
                      onClick={() => handleSelectSession(link)}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        link.id === currentSessionId ? 'bg-card border border-line' : 'hover:bg-card'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{link.name}</span>
                            {link.isActive && (
                              <span className="text-[10px] uppercase tracking-wider text-sage font-semibold">
                                fasting
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted mt-0.5">{link.targetDuration}h fast</div>
                        </div>
                        {sessionLinks.length > 1 && (
                          <button
                            onClick={e => handleDeleteSession(link, e)}
                            className="ml-2 px-1.5 text-muted hover:text-clay cursor-pointer"
                            title="Remove from list"
                          >
                            ×
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
