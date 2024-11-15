'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  slug: string;
}

export function ShareButton({ title, slug }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-sm flex items-center gap-1 hover:text-red-500 transition-colors"
      title="Share this post"
    >
      <span className="text-4xl">🔗</span>
      <span>{shared ? 'Copied!' : 'Share'}</span>
    </button>
  );
} 