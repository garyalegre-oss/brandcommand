'use client';

import React, { useState, useEffect } from 'react';
import { Brand } from '../types/brand';
import { BrandAvatar } from './BrandAvatar';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Wand2, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3 
} from 'lucide-react';

interface ThreadRendererProps {
  brand: Brand;
  tweets: string[];
  onUpdateTweets?: (updatedTweets: string[]) => void;
}

export function ThreadRenderer({ brand, tweets, onUpdateTweets }: ThreadRendererProps) {
  const [currentTweets, setCurrentTweets] = useState<string[]>(tweets);
  const [historyStack, setHistoryStack] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // AI Optimizer State
  const [aiInstruction, setAiInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setCurrentTweets(tweets);
  }, [tweets]);

  if (!currentTweets || currentTweets.length === 0) return null;

  const updateTweets = (newTweets: string[]) => {
    setHistoryStack((prev) => [...prev.slice(-4), currentTweets]);
    setCurrentTweets(newTweets);
    if (onUpdateTweets) {
      onUpdateTweets(newTweets);
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((s) => s.slice(0, -1));
    setCurrentTweets(prev);
    if (onUpdateTweets) {
      onUpdateTweets(prev);
    }
    setAiNotice({ message: 'Reverted to previous thread.', type: 'success' });
    setTimeout(() => setAiNotice(null), 3000);
  };

  const handleAIOptimize = async (customInstruction?: string) => {
    const promptToUse = customInstruction || aiInstruction;
    if (!promptToUse.trim()) return;

    setIsOptimizing(true);
    setAiNotice(null);

    try {
      const savedGeminiKey = typeof window !== 'undefined' 
        ? (localStorage.getItem('brandcommand_voice_api_key') || localStorage.getItem('brandcommand_media_api_key') || '') 
        : '';

      const res = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          format: 'thread',
          currentData: currentTweets,
          instruction: promptToUse,
          apiKey: savedGeminiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiNotice({ message: data.message || 'Optimization failed.', type: 'error' });
      } else {
        const optimized = Array.isArray(data.data) ? data.data : data.data?.tweets || currentTweets;
        updateTweets(optimized);
        setAiNotice({ message: data.explanation || 'Thread successfully optimized!', type: 'success' });
        setAiInstruction('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotice({ message: error.message || 'Network error occurred.', type: 'error' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(currentTweets.join('\n\n---\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTweet = () => {
    const newTweet = `Key takeaway: Here is another critical nuance when working with ${brand.name.toLowerCase()}...`;
    updateTweets([...currentTweets, newTweet]);
  };

  const handleDeleteTweet = (idx: number) => {
    if (currentTweets.length <= 2) {
      alert('A thread requires at least 2 tweets.');
      return;
    }
    updateTweets(currentTweets.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-sky-500" />
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            X / Twitter Thread Series
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            {currentTweets.length} Tweets
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTweet}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-sky-500" />
            <span>Add Tweet</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Thread!' : 'Copy All'}
          </button>
        </div>
      </div>

      {/* Smart AI Optimizer Bar */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border border-sky-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Smart AI Thread Optimizer</span>
          </div>

          {historyStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo Revision
            </button>
          )}
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => handleAIOptimize('Make opening tweet 1 a viral high-curiosity bookmark hook')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ⚡ Viral Hook
          </button>
          <button
            onClick={() => handleAIOptimize('Add statistical proof and specific metric numbers to the thread')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            📊 Add Data & Stats
          </button>
          <button
            onClick={() => handleAIOptimize('Add a compelling engagement question and follow CTA on the final tweet')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            💬 Boost Engagement & Replies
          </button>
          <button
            onClick={() => handleAIOptimize('Condense each tweet to be punchy and under 240 characters')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ✂️ Tighten Length
          </button>
        </div>

        {/* Custom AI Prompt Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAIOptimize();
            }}
            placeholder="Tell AI how to improve this thread (e.g. 'Make the tone more punchy and debate-sparking')..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={() => handleAIOptimize()}
            disabled={isOptimizing || !aiInstruction.trim()}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isOptimizing ? (
              <>
                <Wand2 className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Optimize Thread</span>
              </>
            )}
          </button>
        </div>

        {/* AI Notice */}
        {aiNotice && (
          <div
            className={`p-2 rounded-xl text-xs flex items-center justify-between ${
              aiNotice.type === 'success'
                ? 'bg-sky-100/70 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                : 'bg-red-100/70 dark:bg-red-950/60 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{aiNotice.message}</span>
            </div>
            <button onClick={() => setAiNotice(null)} className="opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tweets stream list */}
      <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
        {currentTweets.map((tweet, index) => (
          <div key={index} className="relative flex items-start gap-3 pl-2 group">
            <BrandAvatar brand={brand} size="sm" className="z-10 shadow-xs" />

            <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line relative">
              <div className="flex items-center justify-between mb-1.5 opacity-60 text-[11px]">
                <span className="font-semibold">@{brand.slug}</span>
                <div className="flex items-center gap-2">
                  <span>Part {index + 1} of {currentTweets.length}</span>
                  <button
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    {editingIndex === index ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteTweet(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    title="Delete Tweet"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {editingIndex === index ? (
                <textarea
                  rows={3}
                  value={tweet}
                  onChange={(e) => {
                    const updated = [...currentTweets];
                    updated[index] = e.target.value;
                    updateTweets(updated);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-sky-400 bg-white dark:bg-neutral-900 focus:outline-none"
                />
              ) : (
                tweet
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
