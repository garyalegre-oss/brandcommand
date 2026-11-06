'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Brand,
  Post,
  PostFormat,
  SocialChannel,
  PublishLogEntry,
  AutoPilotConfig
} from '../types/brand';
import { VideoScriptRenderer } from './VideoScriptRenderer';
import { CarouselRenderer } from './CarouselRenderer';
import {
  Library,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Play,
  RefreshCw,
  ShieldCheck,
  Zap,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Video,
  FileText,
  Radio,
  SlidersHorizontal,
  Check
} from 'lucide-react';

interface BrandContentLibraryProps {
  brand: Brand;
  allBrands: Brand[];
  posts: Post[];
  onSavePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  onSaveBatchPosts: (newPosts: Omit<Post, 'id' | 'createdAt'>[]) => void;
  onUpdatePost: (updatedPost: Post) => void;
  onDeletePost: (postId: string) => void;
  onPublishPost: (
    postId: string,
    publishedUrls: Partial<Record<SocialChannel, string>>,
    publishLogs: PublishLogEntry[]
  ) => void;
  onUpdateBrand: (updatedBrand: Brand) => void;
  onOpenSocialHub: () => void;
}

const DEFAULT_AUTOPILOT: AutoPilotConfig = {
  enabled: true,
  mode: 'review_first',
  postsPerDay: 2,
  preferredTimes: ['09:30', '17:30'],
  autoReplenishLibrary: true,
  minLibraryBuffer: 4,
  includeFormats: ['video_script', 'carousel', 'thread', 'single'],
  targetChannels: ['youtube', 'instagram', 'tiktok', 'twitter', 'linkedin']
};

export function BrandContentLibrary({
  brand,
  posts,
  onSaveBatchPosts,
  onUpdatePost,
  onDeletePost,
  onPublishPost,
  onUpdateBrand,
  onOpenSocialHub
}: BrandContentLibraryProps) {
  const autoPilot: AutoPilotConfig = {
    ...DEFAULT_AUTOPILOT,
    ...(brand.autoPilot || {}),
    targetChannels:
      brand.autoPilot?.targetChannels && brand.autoPilot.targetChannels.length > 0
        ? brand.autoPilot.targetChannels
        : brand.defaultChannels || DEFAULT_AUTOPILOT.targetChannels
  };

  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<
    'all' | 'pending_approval' | 'scheduled' | 'published'
  >('all');
  const [formatFilter, setFormatFilter] = useState<'all' | PostFormat>('all');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [showAutoPilotSettings, setShowAutoPilotSettings] = useState<boolean>(false);

  // Track which brands have already been auto-seeded in this session so we don't duplicate
  const autoSeededBrandsRef = useRef<Set<string>>(new Set());

  // Posts belonging to the currently selected brand
  const brandPosts = posts.filter((p) => p.brandId === brand.id);
  const pendingApprovalPosts = brandPosts.filter(
    (p) => p.status === 'draft' || p.approvalStatus === 'pending_approval'
  );
  const scheduledPosts = brandPosts.filter((p) => p.status === 'scheduled');
  const publishedPosts = brandPosts.filter((p) => p.status === 'published');

  const updateAutoPilotConfig = (partial: Partial<AutoPilotConfig>) => {
    const updatedConfig: AutoPilotConfig = {
      ...autoPilot,
      ...partial
    };
    onUpdateBrand({
      ...brand,
      autoPilot: updatedConfig
    });
  };

  // Compute the next available smart schedule slot based on preferredTimes & existing scheduled posts
  const getNextSmartScheduleSlot = (offsetIndex = 0): string => {
    const times =
      autoPilot.preferredTimes && autoPilot.preferredTimes.length > 0
        ? autoPilot.preferredTimes
        : ['09:30', '17:30'];

    const now = new Date();
    const candidateSlots: Date[] = [];

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      for (const timeStr of times) {
        const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
        const slot = new Date(now);
        slot.setDate(now.getDate() + dayOffset);
        slot.setHours(hh, mm, 0, 0);
        if (slot.getTime() > now.getTime() + 10 * 60 * 1000) {
          candidateSlots.push(slot);
        }
      }
    }

    // Avoid colliding with already-scheduled posts for this brand (within 2 hours)
    const existingTimes = scheduledPosts.map((p) => new Date(p.scheduledFor).getTime());
    const availableSlots = candidateSlots.filter(
      (slot) => !existingTimes.some((t) => Math.abs(t - slot.getTime()) < 90 * 60 * 1000)
    );

    const chosen =
      availableSlots[offsetIndex] ||
      candidateSlots[offsetIndex] ||
      new Date(Date.now() + (offsetIndex + 1) * 4 * 3600 * 1000);
    return chosen.toISOString();
  };

  // Generate fresh content into this brand's library (or directly into scheduled queue if mode === 'fully_automated')
  const handleGenerateLibraryBatch = async (count = 4, silentAuto = false) => {
    if (isGeneratingBatch) return;
    setIsGeneratingBatch(true);
    if (!silentAuto) {
      setStatusBanner(
        `🤖 AI Content Engine is creating ${count} fresh multi-format posts for ${brand.name}'s Library...`
      );
    }

    try {
      const activeKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            ''
          : '';

      const res = await fetch('/api/auto-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandVoice: brand.voicePersona,
          brandCategory: brand.category,
          brandWebsiteUrl: brand.websiteUrl,
          brandHashtags: brand.commonHashtags,
          suggestedTopics: brand.suggestedTopics,
          defaultChannels: autoPilot.targetChannels,
          brandAssets: brand.brandAssets || [],
          websiteScreenshotUrl:
            brand.websiteDesktopScreenshotUrl ||
            brand.websiteMobileScreenshotUrl ||
            brand.websiteScreenshotUrl,
          count,
          apiKey: activeKey
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        const isHandsFree = autoPilot.enabled && autoPilot.mode === 'fully_automated';

        const preparedPosts: Omit<Post, 'id' | 'createdAt'>[] = data.posts.map(
          (rawPost: any, idx: number) => {
            const slotIso = getNextSmartScheduleSlot(idx);
            return {
              ...rawPost,
              brandId: brand.id,
              status: isHandsFree ? 'scheduled' : 'draft',
              approvalStatus: isHandsFree ? 'approved' : 'pending_approval',
              scheduledFor: slotIso
            };
          }
        );

        onSaveBatchPosts(preparedPosts);
        updateAutoPilotConfig({
          lastGeneratedAt: new Date().toISOString()
        });

        setStatusBanner(
          isHandsFree
            ? `⚡ Fully Automated Mode: Generated & auto-scheduled ${preparedPosts.length} new posts for ${brand.name}!`
            : `✨ Added ${preparedPosts.length} new AI-crafted posts to ${brand.name}'s Content Library for your review & 1-click approval!`
        );
      }
    } catch (err: any) {
      if (!silentAuto) {
        setStatusBanner(`⚠️ Could not generate library batch: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Auto-Replenish Library when switching to a brand whose library buffer is low
  useEffect(() => {
    if (!autoPilot.enabled || !autoPilot.autoReplenishLibrary) return;
    if (autoSeededBrandsRef.current.has(brand.id)) return;

    const currentReadyCount = pendingApprovalPosts.length + scheduledPosts.length;
    if (currentReadyCount < (autoPilot.minLibraryBuffer || 3)) {
      autoSeededBrandsRef.current.add(brand.id);
      const needed = Math.max(2, (autoPilot.minLibraryBuffer || 4) - currentReadyCount);
      handleGenerateLibraryBatch(needed, true);
    } else {
      autoSeededBrandsRef.current.add(brand.id);
    }
  }, [brand.id, autoPilot.enabled, autoPilot.autoReplenishLibrary]);

  // 1-Click Approve & Auto-Schedule a single Library item
  const handleApproveAndSchedule = (post: Post, slotIndex = 0) => {
    const nextSlot = getNextSmartScheduleSlot(slotIndex);
    onUpdatePost({
      ...post,
      status: 'scheduled',
      approvalStatus: 'approved',
      scheduledFor: nextSlot
    });
    const formattedDate = new Date(nextSlot).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setStatusBanner(
      `✅ Approved "${post.title}" and automatically scheduled for ${formattedDate}!`
    );
  };

  // 1-Click Approve & Auto-Schedule ALL Pending Items in this Brand's Library
  const handleApproveAllPending = () => {
    if (pendingApprovalPosts.length === 0) return;
    pendingApprovalPosts.forEach((p, idx) => {
      const slot = getNextSmartScheduleSlot(idx);
      onUpdatePost({
        ...p,
        status: 'scheduled',
        approvalStatus: 'approved',
        scheduledFor: slot
      });
    });
    setStatusBanner(
      `🚀 Approved & Auto-Scheduled all ${pendingApprovalPosts.length} library items for ${brand.name} across your optimal daily time slots!`
    );
  };

  // 1-Click Approve & Publish Immediately via `/api/publish-social`
  const handleApproveAndPublishNow = async (post: Post) => {
    setPublishingPostId(post.id);
    setStatusBanner(null);

    try {
      const res = await fetch('/api/publish-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          post: {
            ...post,
            status: 'published',
            approvalStatus: 'approved'
          },
          channels: post.channels
        })
      });
      const data = await res.json();
      if (data.success) {
        onPublishPost(post.id, data.publishedUrls || {}, data.publishLogs || []);
        setStatusBanner(
          `🎉 Approved & Published "${post.title}" live to ${post.channels.join(', ')}!`
        );
      } else {
        setStatusBanner(`⚠️ Publish notice: ${data.message || 'Check social account connections.'}`);
      }
    } catch (err: any) {
      setStatusBanner(`⚠️ Publish failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPublishingPostId(null);
    }
  };

  // Filter posts displayed in the grid
  const visiblePosts = brandPosts.filter((p) => {
    if (libraryFilter === 'pending_approval') {
      if (p.status !== 'draft' && p.approvalStatus !== 'pending_approval') return false;
    } else if (libraryFilter === 'scheduled') {
      if (p.status !== 'scheduled') return false;
    } else if (libraryFilter === 'published') {
      if (p.status !== 'published') return false;
    }
    if (formatFilter !== 'all' && p.format !== formatFilter) return false;
    return true;
  });

  const channelBadges: Record<SocialChannel, { label: string; icon: string }> = {
    youtube: { label: 'YouTube', icon: '▶️' },
    instagram: { label: 'Instagram', icon: '📸' },
    tiktok: { label: 'TikTok', icon: '🎵' },
    twitter: { label: 'X', icon: '𝕏' },
    linkedin: { label: 'LinkedIn', icon: '💼' },
    facebook: { label: 'Facebook', icon: '👥' },
    pinterest: { label: 'Pinterest', icon: '📌' }
  };

  const formatBadgeInfo: Record<
    PostFormat,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    video_script: {
      label: '🎬 16:9 YouTube & 9:16 Video',
      color:
        'bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      icon: <Video className="w-3 h-3" />
    },
    carousel: {
      label: '📑 Multi-Slide Carousel',
      color:
        'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      icon: <Layers className="w-3 h-3" />
    },
    thread: {
      label: '🧵 X / LinkedIn Thread',
      color:
        'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      icon: <FileText className="w-3 h-3" />
    },
    single: {
      label: '⚡ Visual Post / Ad Hook',
      color:
        'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: <Sparkles className="w-3 h-3" />
    },
    newsletter: {
      label: '✉️ Email Newsletter',
      color:
        'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: <FileText className="w-3 h-3" />
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: AUTONOMOUS BRAND CONTENT LIBRARY & AUTOPILOT COMMAND BAR */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${brand.primaryColor || '#10b981'}, ${
                  brand.secondaryColor || '#059669'
                })`
              }}
            >
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                  📚 {brand.name} Content Library &amp; Auto-Pilot Engine
                </h2>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    autoPilot.enabled && autoPilot.mode === 'fully_automated'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  }`}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  {autoPilot.enabled && autoPilot.mode === 'fully_automated'
                    ? '⚡ Fully Automated Posting Active'
                    : '👀 Review & 1-Click Approve Mode'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                BrandCommand automatically generates fresh videos (16:9 YouTube &amp; 9:16 Reels), carousels, and threads for{' '}
                <strong className="text-neutral-800 dark:text-neutral-200">{brand.name}</strong> using your real app screens and brand voice. Approve to auto-schedule, or switch to{' '}
                <strong>Fully Automated</strong> for hands-free posting.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAutoPilotSettings((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Auto-Pilot Settings</span>
              {showAutoPilotSettings ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const isEvidraw = (brand.slug || brand.name).toLowerCase().includes('evidraw');
                const isHandsFree = autoPilot.enabled && autoPilot.mode === 'fully_automated';
                const slotIso = getNextSmartScheduleSlot(0);
                const cleanUrl = brand.websiteUrl || `https://${brand.slug}.com`;
                const ugcText = isEvidraw
                  ? `paper notes aren't evidence\nif you can edit the picks\nafter Lotto Max or 6/49 hits,\nyour brain will quietly rewrite\nhistory\nI started using Evidraw to lock\nmultiple portfolios with\ntimestamps\nbefore every draw\nthen I leave the record alone\nand let the results judge it`
                  : `manual notes aren't a system\nif you're piecing together\nfive different tabs by hand,\nyour brain will quietly excuse\nall the missed opportunities\nI started using ${brand.name}\nto lock my workflow in\none verified workspace\nbefore every session\nthen I step back and let\nthe live results judge it`;

                const primaryAsset = (brand.brandAssets || [])[0];
                const fallbackUrl =
                  primaryAsset?.url ||
                  brand.websiteMobileScreenshotUrl ||
                  brand.websiteScreenshotUrl ||
                  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80';

                onSaveBatchPosts([
                  {
                    brandId: brand.id,
                    title: `[🤳 UGC Creator Story Reel] Why I Switched to ${brand.name}`,
                    content: `${ugcText.replace(/\n/g, ' ')}\n\nExplore ${brand.name} live at ${cleanUrl} ${(brand.commonHashtags || []).map((t) => `#${t.replace(/^#/, '')}`).join(' ')}`,
                    format: 'video_script',
                    status: isHandsFree ? 'scheduled' : 'draft',
                    approvalStatus: isHandsFree ? 'approved' : 'pending_approval',
                    isAutoGenerated: true,
                    contentPillar: 'UGC Creator Story Reel',
                    mediaPreviewUrl:
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=85',
                    scheduledFor: slotIso,
                    channels: ['tiktok', 'instagram', 'youtube'],
                    videoScript: {
                      hook: `Most people rely on memory or messy notes until they realize their brain quietly rewrites history.`,
                      visualCue: `Front-facing camera selfie POV silent reaction (thinking -> nodding in agreement) with centered story text overlay`,
                      ugcStoryText: ugcText,
                      ugcCreatorId: 'ugc_react_decision_woman',
                      aiDirector: {
                        layout: 'ugc_creator',
                        backgroundId: 'none',
                        stickerId: 'none',
                        filter: 'none',
                        subtitleStyle: 'hormozi',
                        soundwaveStyle: 'off',
                        directorNotes: 'UGC Creator Selfie Hook + Centered Story Text Overlay'
                      },
                      hookBrollMediaUrl: fallbackUrl,
                      hookBrollMediaType: 'image',
                      hookBrollLabel: `${brand.name} UGC Story`,
                      hookUiHighlight: primaryAsset?.uiHighlight,
                      scenes: [
                        {
                          timestamp: '0:03 - 0:10',
                          visual: `Creator holding phone in casual selfie POV with full story text overlay, then cutting to ${brand.name}.`,
                          audio: `I started using ${brand.name} to lock everything in with verifiable clarity before the action starts, and let the results speak for themselves.`,
                          brollMediaUrl: fallbackUrl,
                          brollMediaType: 'image',
                          brollLabel: `STEP 1 • ${primaryAsset?.label || brand.name}`,
                          uiHighlight: primaryAsset?.uiHighlight
                        }
                      ],
                      cta: `Try ${brand.name} yourself right now at ${brand.name} dot com.`,
                      ctaBrollMediaUrl: fallbackUrl,
                      ctaBrollMediaType: 'image',
                      ctaBrollLabel: `${brand.name} Live App`
                    },
                    tags: brand.commonHashtags || []
                  }
                ]);
                setStatusBanner(
                  `🤳 Created a new UGC Creator Story Reel for ${brand.name}! Click "Preview Video / Slides" on the card below to customize the creator model or story overlay.`
                );
              }}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all"
              title="Create a 9:16 UGC Creator Selfie Reel with a model holding the phone and centered white-with-black-stroke story paragraph"
            >
              <span>🤳 + UGC Creator Reel</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateLibraryBatch(4, false)}
              disabled={isGeneratingBatch}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-neutral-900 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isGeneratingBatch ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>+ Generate 4 Posts</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-MODE SWITCHER BAR: REVIEW & APPROVE vs FULLY AUTOMATED HANDS-FREE */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/90 border border-neutral-200/80 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300">
              Automation Mode for {brand.name}:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => updateAutoPilotConfig({ enabled: true, mode: 'review_first' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  autoPilot.mode === 'review_first'
                    ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Review &amp; 1-Click Approve (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAutoPilotConfig({ enabled: true, mode: 'fully_automated' });
                  setStatusBanner(
                    `⚡ Fully Automated Mode enabled for ${brand.name}! New AI content will automatically schedule & publish at ${autoPilot.preferredTimes.join(' & ')}.`
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  autoPilot.mode === 'fully_automated'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>2. Fully Automated (Auto-Schedule &amp; Auto-Post)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingApprovalPosts.length > 0 && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Approve &amp; Auto-Schedule All ({pendingApprovalPosts.length})
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSocialHub}
              className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-all"
            >
              🔌 Connected Accounts
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE AUTO-PILOT SCHEDULE & CADENCE SETTINGS */}
        {showAutoPilotSettings && (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-neutral-400 block">
                Daily Posting Cadence
              </label>
              <div className="flex items-center gap-1.5">
                {([1, 2, 3] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      const defaultSlots =
                        num === 1
                          ? ['10:00']
                          : num === 2
                          ? ['09:30', '17:30']
                          : ['09:00', '13:30', '18:30'];
                      updateAutoPilotConfig({
                        postsPerDay: num,
                        preferredTimes: defaultSlots
                      });
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-bold border transition-all ${
                      autoPilot.postsPerDay === num
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {num}x / Day
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-400">
                Slots: {autoPilot.preferredTimes.join(' • ')}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-neutral-400 block">
                Auto-Replenish Library Buffer
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <input
                  type="checkbox"
                  checked={autoPilot.autoReplenishLibrary}
                  onChange={(e) =>
                    updateAutoPilotConfig({ autoReplenishLibrary: e.target.checked })
                  }
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Keep at least {autoPilot.minLibraryBuffer} fresh posts ready in Library
                </span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-neutral-400 block">
                Target Auto-Publish Channels
              </label>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(channelBadges) as SocialChannel[]).map((ch) => {
                  const active = autoPilot.targetChannels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? autoPilot.targetChannels.filter((c) => c !== ch)
                          : [...autoPilot.targetChannels, ch];
                        updateAutoPilotConfig({
                          targetChannels: next.length > 0 ? next : ['youtube', 'instagram']
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {channelBadges[ch].icon} {channelBadges[ch].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {statusBanner && (
          <div className="p-3.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* VISIBLE 7-DAY TIMELINE SCHEDULE BOARD: EXACT DAY & TIME SLOTS FOR WHAT WILL BE POSTED */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/90 border border-emerald-500/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                🗓️ Live 7-Day Posting Schedule Board ({brand.name})
              </span>
              <span className="text-[10px] font-semibold text-neutral-400">
                • Daily Slots: {autoPilot.preferredTimes.join(' & ')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Locked &amp; Auto-Scheduled ({scheduledPosts.length})
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Proposed Slot (Needs 1-Click Approval: {pendingApprovalPosts.length})
              </span>
            </div>
          </div>

          {(() => {
            // Map all scheduled posts + pending posts (with their projected smart slots) onto a 7-day calendar grid
            const timelineItems = [
              ...scheduledPosts.map((p) => ({
                post: p,
                slotDate: new Date(p.scheduledFor),
                isLocked: true
              })),
              ...pendingApprovalPosts.map((p, pIdx) => ({
                post: p,
                slotDate: new Date(getNextSmartScheduleSlot(pIdx)),
                isLocked: false
              }))
            ].sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime());

            const next7Days = Array.from({ length: 7 }, (_, dayIdx) => {
              const d = new Date();
              d.setDate(d.getDate() + dayIdx);
              d.setHours(0, 0, 0, 0);
              return d;
            });

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                {next7Days.map((dayDate, dIdx) => {
                  const nextDay = new Date(dayDate);
                  nextDay.setDate(dayDate.getDate() + 1);

                  const daySlots = timelineItems.filter(
                    (it) => it.slotDate >= dayDate && it.slotDate < nextDay
                  );
                  const isToday = dIdx === 0;

                  return (
                    <div
                      key={dIdx}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between min-h-[145px] ${
                        isToday
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800 pb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
                            {isToday
                              ? 'Today'
                              : dIdx === 1
                              ? 'Tomorrow'
                              : dayDate.toLocaleDateString([], { weekday: 'short' })}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {dayDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {daySlots.length === 0 ? (
                          <div className="py-4 text-center text-[10px] text-neutral-400 italic">
                            Open slots ({autoPilot.preferredTimes.join(', ')})
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {daySlots.map(({ post: slotPost, slotDate, isLocked }) => (
                              <div
                                key={slotPost.id}
                                className={`p-2 rounded-lg border text-[10px] space-y-1 transition-all ${
                                  isLocked
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-neutral-900 dark:text-neutral-100'
                                    : 'bg-amber-500/10 border-dashed border-amber-500/50 text-neutral-800 dark:text-neutral-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`font-mono font-extrabold px-1.5 py-0.5 rounded text-[9px] ${
                                      isLocked
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-amber-400 text-neutral-950'
                                    }`}
                                  >
                                    ⏰{' '}
                                    {slotDate.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="text-[9px] font-bold opacity-80">
                                    {slotPost.format === 'video_script'
                                      ? '🎬 Video'
                                      : slotPost.format === 'carousel'
                                      ? '📑 Carousel'
                                      : slotPost.format === 'thread'
                                      ? '🧵 Thread'
                                      : '⚡ Post'}
                                  </span>
                                </div>

                                <p className="font-bold line-clamp-2 leading-tight">
                                  {slotPost.title}
                                </p>

                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  <div className="flex items-center gap-0.5">
                                    {slotPost.channels.slice(0, 4).map((ch) => (
                                      <span key={ch} className="text-[9px]">
                                        {channelBadges[ch]?.icon || ch}
                                      </span>
                                    ))}
                                  </div>
                                  {!isLocked && (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveAndSchedule(slotPost)}
                                      className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[8.5px]"
                                      title="Lock in & approve this time slot"
                                    >
                                      ✓ Lock Slot
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* FILTER TABS: PENDING APPROVAL vs SCHEDULED vs PUBLISHED */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLibraryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                libraryFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              All in Library ({brandPosts.length})
            </button>
            <button
              type="button"
              onClick={() => setLibraryFilter('pending_approval')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                libraryFilter === 'pending_approval'
                  ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
            >
              <span>⏳ Needs Approval ({pendingApprovalPosts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLibraryFilter('scheduled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                libraryFilter === 'scheduled'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span>📅 Approved &amp; Scheduled ({scheduledPosts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLibraryFilter('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                libraryFilter === 'published'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
              }`}
            >
              <span>✅ Published ({publishedPosts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-neutral-400">Format:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold"
            >
              <option value="all">All Formats</option>
              <option value="video_script">🎬 Videos (16:9 YouTube &amp; 9:16)</option>
              <option value="carousel">📑 Carousels</option>
              <option value="thread">🧵 Threads</option>
              <option value="single">⚡ Single Posts</option>
            </select>
          </div>
        </div>

        {/* LIBRARY CARDS GRID */}
        {visiblePosts.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-3">
            <p className="text-xs text-neutral-400">
              No content items in this view yet for <strong>{brand.name}</strong>.
            </p>
            <button
              type="button"
              onClick={() => handleGenerateLibraryBatch(4, false)}
              disabled={isGeneratingBatch}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-extrabold text-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Generate 4 Fresh Posts for {brand.name}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePosts.map((post, idx) => {
              const isPending =
                post.status === 'draft' || post.approvalStatus === 'pending_approval';
              const isScheduled = post.status === 'scheduled';
              const isPublished = post.status === 'published';
              const isExpanded = expandedPostId === post.id;
              const isPublishingThis = publishingPostId === post.id;
              const badge = formatBadgeInfo[post.format] || formatBadgeInfo.single;

              const previewImg =
                post.mediaPreviewUrl ||
                post.videoScript?.hookBrollMediaUrl ||
                brand.brandAssets?.[0]?.url ||
                brand.websiteDesktopScreenshotUrl ||
                brand.websiteMobileScreenshotUrl ||
                brand.websiteScreenshotUrl;

              return (
                <div
                  key={post.id}
                  className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-500/40 bg-amber-50/20 dark:bg-neutral-950'
                      : isScheduled
                      ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-neutral-950'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950'
                  }`}
                >
                  <div>
                    {/* Top Visual Thumbnail + Format & Approval Status */}
                    {previewImg && (
                      <div className="relative h-44 w-full bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                        <img
                          src={previewImg}
                          alt={post.title}
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          {post.contentPillar && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/65 text-white backdrop-blur-xs border border-white/15">
                              {post.contentPillar}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-neutral-950 shadow-sm">
                              ⏳ Needs Approval
                            </span>
                          )}
                          {isScheduled && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Auto-Scheduled
                            </span>
                          )}
                          {isPublished && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-sm flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Published
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-white line-clamp-1 drop-shadow-xs">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {post.channels.map((ch) => (
                              <span
                                key={ch}
                                className="px-1.5 py-0.5 rounded bg-black/65 text-white text-[10px]"
                                title={channelBadges[ch]?.label || ch}
                              >
                                {channelBadges[ch]?.icon || ch}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Body: Editable Caption, Schedule Slot & Preview Toggle */}
                    <div className="p-4 space-y-3">
                      {!previewImg && (
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-400">
                            {post.status.toUpperCase()}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-3 whitespace-pre-line">
                        {post.content}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          {isPublished ? (
                            <span className="font-semibold">
                              Published{' '}
                              {new Date(post.publishedAt || post.scheduledFor).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                {isScheduled ? '⏰ Scheduled:' : '⏰ Slot:'}
                              </span>
                              <input
                                type="datetime-local"
                                value={(() => {
                                  const d = new Date(
                                    isScheduled ? post.scheduledFor : getNextSmartScheduleSlot(idx)
                                  );
                                  const tzOffset = d.getTimezoneOffset() * 60000;
                                  return new Date(d.getTime() - tzOffset)
                                    .toISOString()
                                    .slice(0, 16);
                                })()}
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  const chosenIso = new Date(e.target.value).toISOString();
                                  onUpdatePost({
                                    ...post,
                                    scheduledFor: chosenIso
                                  });
                                }}
                                className="px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[10.5px] font-mono font-bold text-neutral-800 dark:text-neutral-200"
                                title="Change the exact date and time this post will be published"
                              />
                            </div>
                          )}
                        </div>

                        {(post.videoScript || post.carouselSlides || post.threadTweets) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPostId(isExpanded ? null : post.id)
                            }
                            className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {isExpanded
                                ? 'Hide Interactive Studio'
                                : post.format === 'video_script'
                                ? 'Open 16:9 YouTube & 9:16 Video Player'
                                : post.format === 'carousel'
                                ? 'Preview & Edit Carousel Slides'
                                : 'View Full Thread'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTION FOOTER: 1-CLICK APPROVE & AUTO-SCHEDULE / PUBLISH NOW */}
                  <div className="p-3.5 bg-white dark:bg-neutral-900 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleApproveAndSchedule(post, idx)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✅ Approve &amp; Auto-Schedule</span>
                        </button>
                      )}

                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handleApproveAndPublishNow(post)}
                          disabled={isPublishingThis}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                            isPending
                              ? 'border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {isPublishingThis ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>{isPending ? 'Approve & Post Now' : 'Publish Now'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove from Library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* EXPANDED INTERACTIVE PLAYER (16:9 YOUTUBE & 9:16 REELS VIDEO / CAROUSEL / THREAD) */}
                  {isExpanded && (
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 md:col-span-2 space-y-4">
                      {post.format === 'video_script' && post.videoScript && (
                        <VideoScriptRenderer
                          brand={brand}
                          script={post.videoScript}
                          onUpdateBrand={onUpdateBrand}
                          defaultAspectRatio="16:9"
                        />
                      )}

                      {post.format === 'carousel' && post.carouselSlides && (
                        <CarouselRenderer
                          brand={brand}
                          slides={post.carouselSlides}
                          onUpdateSlides={(updatedSlides) =>
                            onUpdatePost({
                              ...post,
                              carouselSlides: updatedSlides
                            })
                          }
                        />
                      )}

                      {post.format === 'thread' && post.threadTweets && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-extrabold uppercase text-neutral-400">
                            🧵 Thread Sequence ({post.threadTweets.length} Posts)
                          </h5>
                          {post.threadTweets.map((tw, tIdx) => (
                            <div
                              key={tIdx}
                              className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                            >
                              {tw}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
