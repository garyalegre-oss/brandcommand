'use client';

import React, { useState } from 'react';
import { Brand, VideoScript } from '../types/brand';
import { VideoPlayerPreview } from './VideoPlayerPreview';
import { Video, Copy, Check, Clock, Sparkles, Play, FileText } from 'lucide-react';

interface VideoScriptRendererProps {
  brand: Brand;
  script: VideoScript;
  onUpdateBrand?: (brand: Brand) => void;
  defaultAspectRatio?: '16:9' | '9:16';
}

export function VideoScriptRenderer({
  brand,
  script,
  onUpdateBrand,
  defaultAspectRatio = '16:9'
}: VideoScriptRendererProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'simulator' | 'storyboard'>('simulator');
  const [currentScript, setCurrentScript] = useState<VideoScript>(script);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(defaultAspectRatio);

  React.useEffect(() => {
    setAspectRatio(defaultAspectRatio);
  }, [defaultAspectRatio]);

  React.useEffect(() => {
    setCurrentScript(script);
  }, [script]);

  if (!currentScript) return null;

  const handleCopy = () => {
    const text = `HOOK (0-3s): ${currentScript.hook}\nVISUAL CUE: ${currentScript.visualCue}\n\nSCENES:\n${currentScript.scenes
      .map((s) => `[${s.timestamp}]\nVisual: ${s.visual}\nVoiceover: "${s.audio}"`)
      .join('\n\n')}\n\nCTA: ${currentScript.cta}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 block leading-none">
              Video Preview &amp; Export
            </span>
            <span className="text-[10px] text-neutral-400">
              Switch between App Walkthrough, UGC Creator Hook, 16:9 YouTube &amp; 9:16 Reels
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Video Player vs Storyboard Script */}
          <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-xl p-0.5 bg-neutral-100/80 dark:bg-neutral-950 text-xs">
            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'simulator'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Video Player</span>
            </button>
            <button
              onClick={() => setViewMode('storyboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'storyboard'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Storyboard Script</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Script'}
          </button>
        </div>
      </div>

      {viewMode === 'simulator' ? (
        <VideoPlayerPreview
          brand={brand}
          script={currentScript}
          onScriptChange={setCurrentScript}
          onUpdateBrand={onUpdateBrand}
          defaultAspectRatio={aspectRatio}
        />
      ) : (
        <>
          {/* The Hook Alert Box */}
          <div className="p-4 rounded-xl border-l-4 border-l-pink-500 bg-pink-50/50 dark:bg-pink-950/20 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              <Sparkles className="w-3.5 h-3.5" />
              The 3-Second Retention Hook
            </div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              &ldquo;{currentScript.hook}&rdquo;
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">
              Camera Note: {currentScript.visualCue}
            </div>
          </div>

          {/* Scene by scene breakdown */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Timeline & Scene Flow
            </div>

            {currentScript.scenes.map((scene, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    Scene {idx + 1} ({scene.timestamp})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                    <span className="font-semibold block text-neutral-800 dark:text-neutral-200 mb-0.5">
                      🎬 Visual Action:
                    </span>
                    {scene.visual}
                  </div>

                  <div className="text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                    <span className="font-semibold block text-neutral-800 dark:text-neutral-200 mb-0.5">
                      🎙️ Voiceover Script:
                    </span>
                    &ldquo;{scene.audio}&rdquo;
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <div>
              <span className="font-bold">End Screen CTA: </span>
              {currentScript.cta}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

