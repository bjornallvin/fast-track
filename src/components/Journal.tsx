'use client';

import { useState } from 'react';
import type { JournalEntry } from '../types';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface JournalProps {
  entries: JournalEntry[];
  onAddEntry: (content: string, tags: string[]) => void;
}

const Journal: React.FC<JournalProps> = ({ entries, onAddEntry }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const tags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      onAddEntry(content, tags);
      setContent('');
      setTagInput('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card border border-line rounded-2xl px-5 py-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-serif font-medium text-lg">Journal</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl border border-clay text-clay font-semibold text-sm cursor-pointer hover:bg-clay hover:text-white transition-colors"
          >
            Write
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What is this hour like?"
            className="w-full px-3.5 py-3 border border-line rounded-xl bg-white mb-2.5 min-h-[100px]"
            autoFocus
          />
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="tags, comma-separated: breakthrough, challenging, mental"
            className="w-full px-3.5 py-2.5 border border-line rounded-xl bg-white mb-3 text-sm"
          />
          <div className="flex gap-2.5">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-clay text-white font-semibold text-sm cursor-pointer hover:opacity-90"
            >
              Save entry
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setContent('');
                setTagInput('');
              }}
              className="px-5 py-2.5 rounded-xl border border-line font-semibold text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="font-serif italic text-muted text-sm">
            nothing written yet — a line or two goes a long way
          </p>
        ) : (
          [...entries]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map(entry => (
              <div key={entry.id} className="border-l-[3px] border-ochre pl-4 py-1">
                <div className="flex justify-between items-start mb-1 gap-2 flex-wrap">
                  <span className="text-xs text-muted">
                    {formatSwedishDateTime(entry.timestamp)}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {entry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-paper border border-line text-muted px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-[15px]">{entry.content}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Journal;
