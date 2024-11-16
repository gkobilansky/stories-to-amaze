'use client';
import { useState, useEffect } from 'react';

type Suggestion = {
  id: number;
  title: string;
  amazon_link: string;
  summary: string;
  totalVotes: number;
  hasVoted: boolean;
};

export function SuggestedStories() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch('/api/suggest')
      .then(res => res.json())
      .then(data => setSuggestions(data));
  }, []);

  const handleVote = async (id: number) => {
    try {
      const response = await fetch(`/api/suggest/${id}/vote`, {
        method: 'POST',
      });
      const data = await response.json();
      
      // Update the suggestions list with new vote count
      setSuggestions(suggestions.map(suggestion => 
        suggestion.id === id 
          ? { ...suggestion, totalVotes: data.totalVotes, hasVoted: true }
          : suggestion
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <section className="mt-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          Suggested Stories
        </h2>
        <p className="mt-4">
          Vote for the stories you'd like to see featured on Stories to Amaze.
        </p>
      </div>
      <div className="max-w-2xl mx-auto px-4">
        <div className="space-y-6">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-black/20 dark:bg-white/5 p-8 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-bold">
                <a href={suggestion.amazon_link} target="_blank" rel="noopener noreferrer">
                  {suggestion.title}
                </a>
              </h3>
              <p className="mt-2">{suggestion.summary}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => handleVote(suggestion.id)}
                  disabled={suggestion.hasVoted}
                  className={`px-6 py-3 rounded-md transition-colors duration-200 ${
                    suggestion.hasVoted 
                      ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                      : 'bg-gray-100 text-black hover:bg-gray-300'
                  }`}
                >
                  {suggestion.hasVoted ? 'Voted' : 'Vote'}
                </button>
                <span>{suggestion.totalVotes} votes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 