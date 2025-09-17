import { useState } from 'react';

interface ShareButtonProps {
  sessionId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ sessionId }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Share the read-only URL, not the edit URL
    const url = `${window.location.origin}/view/${sessionId}`;

    // Try to use native share if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fast Tracker Session',
          text: 'Track my fasting journey with me!',
          url: url
        });
        return;
      } catch (err) {
        // User cancelled or error, fall back to clipboard
      }
    }

    // Fall back to copying to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
      title="Share read-only view"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
};

export default ShareButton;