'use client';

import { useState } from 'react';

interface ShareButtonProps {
  sessionId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ sessionId }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Share the read-only URL, not the edit URL
    const url = `${window.location.origin}/view/${sessionId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fast Track',
          text: 'Follow my fast',
          url,
        });
        return;
      } catch {
        // User cancelled or error, fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`Share this read-only link:\n\n${url}`);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 min-w-[110px] rounded-xl py-3.5 px-4 font-semibold border border-line bg-transparent cursor-pointer hover:border-sage hover:text-sage transition-colors"
      title="Share read-only view"
    >
      {copied ? 'Link copied ✓' : 'Share'}
    </button>
  );
};

export default ShareButton;
