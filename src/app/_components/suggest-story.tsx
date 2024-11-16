'use client';

import { useState } from 'react';
import { SuggestedStories } from "@/app/_components/suggested-stories";

export function SuggestStory() {
  const [formData, setFormData] = useState({
    title: '',
    amazonLink: '',
    summary: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit story');
      }
      setSubmitSuccess(true);
      setFormData({ title: '', amazonLink: '', summary: '' });
      setRefreshTrigger(prev => prev + 1);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

      // Clear form after successful submission
    } catch (error) {
      setSubmitError('Failed to submit story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <section className="bg-black/5 dark:bg-white/5 py-16 my-16 border-t border-gray-800">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Suggest a Product Story</h2>
          <p className="mt-4">
            Have an interesting product story to share? Submit it here and help others discover amazing products.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-black/20 dark:bg-white/5 p-8 rounded-lg backdrop-blur-sm">
          <div>
            <label htmlFor="title" className="block mb-2">
              Story Title
            </label>
            <input
              type="text"
              id="title"
              required
              className="w-full p-2 border border-gray-700 rounded bg-black/10 text-gray-100"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="amazonLink" className="mb-2 flex items-center gap-2">
              Amazon Product Link
              <div className="relative group">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-sm text-gray-100 rounded shadow-lg">
                  Use a shortened affiliate link, like <a href="https://amzn.to/48Qkkfe" target="_blank" rel="noopener noreferrer">https://amzn.to/48Qkkfe</a>
                </div>
              </div>
            </label>
            <input
              type="url"
              id="amazonLink"
              required
              className="w-full p-2 border border-gray-700 rounded bg-black/10 text-gray-100"
              value={formData.amazonLink}
              onChange={(e) => {
                const url = e.target.value;
                setFormData({ ...formData, amazonLink: url })
              }}
            />
          </div>
          <div>
            <label htmlFor="summary" className="block mb-2">
              Summary (200 characters max)
            </label>
            <textarea
              id="summary"
              required
              maxLength={200}
              className="w-full p-2 border border-gray-700 rounded bg-black/10 text-gray-100"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>
          {submitError && (
            <p className="text-red-500 text-sm mt-2">{submitError}</p>
          )}
          {submitSuccess && (
            <p className="text-green-400 bg-green-950/50 mt-2 p-2 rounded-md text-center">Thank you for your submission!</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-100 text-black px-6 py-3 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Story'}
          </button>
        </form>
        <p className="text-justify text-gray-400 mt-4">📝 Every day we pick a submission and turn it into a full fledged story that get's featured on Stories to Amaze. If your story gets selected, we'll use your affiliate link as the Tool of the Day.</p>
        <p className="text-gray-400 mt-4 flex items-center">Follow us on 
          <a 
            href="https://www.youtube.com/@storiestoamaze-j8b" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF0000] px-2 rounded-md mx-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </a> to see which stories get featured.</p>
      </div>
      <SuggestedStories key={refreshTrigger} />
    </section>
  );
} 