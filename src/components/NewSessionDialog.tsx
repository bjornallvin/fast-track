import { useState } from 'react';
import { formatSwedishDateTime } from '../utils/dateFormat';

interface NewSessionDialogProps {
  onCreateSession: (name: string, startTime: Date, targetDuration: number) => void;
  onClose: () => void;
}

const NewSessionDialog: React.FC<NewSessionDialogProps> = ({ onCreateSession, onClose }) => {
  const [name, setName] = useState('');
  const [startNow, setStartNow] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [targetDuration, setTargetDuration] = useState('72');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a name for the session');
      return;
    }

    let sessionStartTime: Date;
    if (startNow) {
      sessionStartTime = new Date();
    } else {
      sessionStartTime = new Date(`${startDate}T${startTime}`);
    }

    onCreateSession(name.trim(), sessionStartTime, parseInt(targetDuration));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">New Fasting Session</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John's Fast, Week 1, etc."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={startNow}
                  onChange={() => setStartNow(true)}
                  className="mr-2 text-indigo-600"
                />
                <span className="text-gray-800 dark:text-gray-200">Start now</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!startNow}
                  onChange={() => setStartNow(false)}
                  className="mr-2 text-indigo-600"
                />
                <span className="text-gray-800 dark:text-gray-200">Custom start time</span>
              </label>
            </div>

            {!startNow && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Duration (hours)
            </label>
            <select
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value="16">16 hours</option>
              <option value="18">18 hours</option>
              <option value="24">24 hours (1 day)</option>
              <option value="36">36 hours</option>
              <option value="48">48 hours (2 days)</option>
              <option value="72">72 hours (3 days)</option>
              <option value="96">96 hours (4 days)</option>
              <option value="120">120 hours (5 days)</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
            >
              Create Session
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSessionDialog;