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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Journal</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          Add Entry
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your observations..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md mb-3 min-h-[100px]"
            autoFocus
          />
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tags (comma-separated): breakthrough, challenging, physical, mental"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setContent('');
                setTagInput('');
              }}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No journal entries yet</p>
        ) : (
          [...entries].sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
          ).map((entry) => (
            <div key={entry.id} className="border-l-4 border-indigo-200 dark:border-indigo-600 pl-4 py-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatSwedishDateTime(entry.timestamp)}</span>
                <div className="flex gap-1">
                  {entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;