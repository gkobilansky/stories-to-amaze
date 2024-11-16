'use client';

import { useState, useEffect } from 'react';

export function PostStats({ slug }: { slug: string }) {
  const [stats, setStats] = useState({ hits: 0, likes: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Record hit on page load
    fetch(`/api/posts/${slug}/stats`)
      .then(async (res) => {
        console.log('Response:', res);
        const data = await res.json();
        setStats(data);
      });
  }, [slug]);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}/stats`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok) {
        setStats(prev => ({ ...prev, likes: data.likes }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1"><span className="text-4xl">👁</span> {stats.hits} {stats.hits === 1 ? 'view' : 'views'}</div>
      <button
        onClick={handleLike}
        disabled={isLoading}
        className="flex items-center gap-1 hover:text-red-500 transition-colors"
      >
        <span className="text-4xl">❤️</span> {stats.likes} {stats.likes === 1 ? 'like' : 'likes'}
      </button>
    </div>
  );
} 