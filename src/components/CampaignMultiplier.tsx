'use client';

import React, { useState, useEffect } from 'react';
import { Brand, Post } from '../types/brand';
import {
  Zap,
  Sparkles,
  Calendar,
  Video,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  Mail,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Send
} from 'lucide-react';

interface CampaignMultiplierProps {
  brand: Brand;
  onSavePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
}

export function CampaignMultiplier({ brand, onSavePost }: CampaignMultiplierProps) {
  const [seedIdea, setSeedIdea] = useState<string>('');
  const [isMultiplying, setIsMultiplying] = useState<boolean>(false);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [adPreviewUrl, setAdPreviewUrl] = useState<string>('');
  const [isRenderingAdVisual, setIsRenderingAdVisual] = useState<boolean>(false);
  const [scheduledAll, setScheduledAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setSeedIdea(brand.suggestedTopics?.[0] || brand.tagline || '');
    setCampaign(null);
    setAdPreviewUrl(
      brand.websiteMobileScreenshotUrl ||
        brand.websiteScreenshotUrl ||
        'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80'
    );
    setScheduledAll(false);
    setStatusMsg(null);
  }, [brand]);

  const handleMultiplyCampaign = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsMultiplying(true);
    setScheduledAll(false);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/campaign-multiplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: seedIdea,
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandVoice: brand.voicePersona,
          brandCategory: brand.category,
          brandWebsiteUrl: brand.websiteUrl,
          brandHashtags: brand.commonHashtags
        })
      });

      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
        setStatusMsg(
          `⚡ Multiplied "${seedIdea.slice(0, 40)}..." into a 5-Day Omnichannel Campaign for ${brand.name}!`
        );
      }
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to multiply campaign.');
    } finally {
      setIsMultiplying(false);
    }
  };

  const handleRenderDay3AdVisual = async () => {
    if (!campaign?.day3AdCreative) return;
    setIsRenderingAdVisual(true);
    try {
      const activeKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            ''
          : '';

      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          type: 'image',
          prompt: campaign.day3AdCreative.visualPrompt || seedIdea,
          aspectRatio: '1:1',
          imageModel: 'gemini-nano-banana-2.1',
          apiKey: activeKey,
          brandCategory: brand.category
        })
      });
      const data = await res.json();
      if (data.mediaUrl) {
        setAdPreviewUrl(data.mediaUrl);
        setStatusMsg('🎨 Generated custom Nano Banana 2.1 visual for Day 3 Ad Creative!');
      }
    } catch {
      // keep existing preview
    } finally {
      setIsRenderingAdVisual(false);
    }
  };

  const handleScheduleEntireWeek = () => {
    if (!campaign) return;
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    const cleanTags = (brand.commonHashtags || []).map((t) => t.replace(/^#/, ''));

    // Day 1: 9:16 Video Script
    onSavePost({
      brandId: brand.id,
      title: campaign.day1VideoReel.title,
      content: campaign.day1VideoReel.caption,
      format: 'video_script',
      status: 'scheduled',
      scheduledFor: new Date(now + dayMs * 1).toISOString(),
      channels: ['instagram', 'tiktok', 'youtube'],
      videoScript: {
        hook: campaign.day1VideoReel.hook,
        visualCue: campaign.day1VideoReel.visualCue,
        scenes: campaign.day1VideoReel.scenes,
        cta: campaign.day1VideoReel.cta
      },
      firstCommentPlug: campaign.firstCommentPlug,
      dmTriggerKeyword: campaign.dmTriggerKeyword,
      dmAutoReplyScript: campaign.dmAutoReplyScript,
      tags: cleanTags
    });

    // Day 2: 5-Slide Carousel
    onSavePost({
      brandId: brand.id,
      title: campaign.day2Carousel.title,
      content: campaign.day2Carousel.caption,
      format: 'carousel',
      status: 'scheduled',
      scheduledFor: new Date(now + dayMs * 2).toISOString(),
      channels: ['instagram', 'linkedin'],
      carouselSlides: campaign.day2Carousel.slides,
      firstCommentPlug: campaign.firstCommentPlug,
      dmTriggerKeyword: campaign.dmTriggerKeyword,
      dmAutoReplyScript: campaign.dmAutoReplyScript,
      tags: cleanTags
    });

    // Day 3: Ad Creative
    onSavePost({
      brandId: brand.id,
      title: campaign.day3AdCreative.title,
      content: `${campaign.day3AdCreative.headline}\n\n${campaign.day3AdCreative.caption}\n\n${campaign.day3AdCreative.ctaText}`,
      format: 'single',
      status: 'scheduled',
      scheduledFor: new Date(now + dayMs * 3).toISOString(),
      channels: ['instagram', 'twitter', 'facebook'],
      firstCommentPlug: campaign.firstCommentPlug,
      dmTriggerKeyword: campaign.dmTriggerKeyword,
      dmAutoReplyScript: campaign.dmAutoReplyScript,
      tags: cleanTags
    });

    // Day 4: X Thread
    onSavePost({
      brandId: brand.id,
      title: campaign.day4Thread.title,
      content: campaign.day4Thread.tweets.join('\n\n---\n\n'),
      format: 'thread',
      status: 'scheduled',
      scheduledFor: new Date(now + dayMs * 4).toISOString(),
      channels: ['twitter', 'linkedin'],
      threadTweets: campaign.day4Thread.tweets,
      firstCommentPlug: campaign.firstCommentPlug,
      dmTriggerKeyword: campaign.dmTriggerKeyword,
      dmAutoReplyScript: campaign.dmAutoReplyScript,
      tags: cleanTags
    });

    // Day 5: VIP Newsletter
    onSavePost({
      brandId: brand.id,
      title: campaign.day5Newsletter.title,
      content: `${campaign.day5Newsletter.headline}\n\n${campaign.day5Newsletter.intro}`,
      format: 'newsletter',
      status: 'scheduled',
      scheduledFor: new Date(now + dayMs * 5).toISOString(),
      channels: ['linkedin'],
      emailCampaign: {
        subjectLines: [
          { type: 'curiosity', text: campaign.day5Newsletter.subjectLine },
          { type: 'direct', text: `${brand.name}: ${campaign.day5Newsletter.headline}` },
          { type: 'benefit', text: campaign.day5Newsletter.previewText }
        ],
        previewText: campaign.day5Newsletter.previewText,
        headline: campaign.day5Newsletter.headline,
        greeting: 'Hey there,',
        intro: campaign.day5Newsletter.intro,
        keyPoints: campaign.day5Newsletter.keyTakeaways || [],
        ctaButton: {
          text: campaign.day5Newsletter.ctaText || `Explore ${brand.name}`,
          url: campaign.day5Newsletter.ctaUrl || brand.websiteUrl || 'https://evidraw.com'
        },
        signOff: `— The ${brand.name} Team`
      },
      tags: cleanTags
    });

    setScheduledAll(true);
    setStatusMsg(
      `🗓️ Scheduled all 5 omnichannel assets (Reel + Carousel + Ad + X Thread + Newsletter) across the next 5 days in your Publishing Queue!`
    );
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Multiplier Control Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                    1-Click Omnichannel Campaign Multiplier
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    1 Idea → 5-Day Campaign
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Turn a single topic or product update into a synchronized 5-day rollout: 9:16 Reel, 5-Slide Carousel, Ad Graphic, X Thread, Newsletter &amp; Auto-DM Trigger for{' '}
                  <strong className="text-neutral-800 dark:text-neutral-200">{brand.name}</strong>.
                </p>
              </div>
            </div>
          </div>

          {campaign && (
            <button
              type="button"
              onClick={handleScheduleEntireWeek}
              disabled={scheduledAll}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all shrink-0"
            >
              {scheduledAll ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All 5 Days Queued!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>🗓️ Schedule Entire 5-Day Campaign to Queue</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Seed Idea Input Form */}
        <form onSubmit={handleMultiplyCampaign} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={seedIdea}
              onChange={(e) => setSeedIdea(e.target.value)}
              placeholder={`Enter a single campaign topic, feature, or URL for ${brand.name}...`}
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isMultiplying || !seedIdea.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              {isMultiplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Multiplying 5-Day Campaign...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>⚡ Multiply Into 5-Day Campaign</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Topic Chips */}
          {brand.suggestedTopics && brand.suggestedTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-neutral-400 mr-1">Quick Seeds:</span>
              {brand.suggestedTopics.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSeedIdea(t)}
                  className="text-[11px] px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:border-amber-500 text-neutral-600 dark:text-neutral-300 truncate max-w-xs transition-colors"
                >
                  &ldquo;{t}&rdquo;
                </button>
              ))}
            </div>
          )}
        </form>

        {statusMsg && (
          <div className="p-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              {statusMsg}
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-[11px] opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Generated 5-Day Omnichannel Blueprint */}
      {campaign && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Strategy & Lead Magnet Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-neutral-900 via-slate-900 to-indigo-950 text-white border border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Coordinated 5-Day Omnichannel Rollout
                </span>
                <h3 className="text-base font-black text-white">{campaign.campaignName}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-300">
                💬 Lead Trigger Keyword: &ldquo;{campaign.dmTriggerKeyword}&rdquo;
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{campaign.strategySummary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    🔗 Auto-Plug First Comment (All Posts)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('plug', campaign.firstCommentPlug)}
                    className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    {copiedId === 'plug' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'plug' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-neutral-200">{campaign.firstCommentPlug}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    🤖 Automated DM Reply Script (Keyword: {campaign.dmTriggerKeyword})
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('dm', campaign.dmAutoReplyScript)}
                    className="text-[10px] font-bold text-amber-300 flex items-center gap-1 hover:underline"
                  >
                    {copiedId === 'dm' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'dm' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-neutral-200">{campaign.dmAutoReplyScript}</p>
              </div>
            </div>
          </div>

          {/* 5-Day Asset Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* DAY 1: 9:16 Vertical Reel / TikTok */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-extrabold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Day 1 • 9:16 Vertical Reel / TikTok
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'day1',
                      `HOOK: ${campaign.day1VideoReel.hook}\n\n${campaign.day1VideoReel.scenes
                        ?.map((s: any) => `[${s.timestamp}] Visual: ${s.visual}\nVoice: ${s.audio}`)
                        .join('\n\n')}\n\nCTA: ${campaign.day1VideoReel.cta}`
                    )
                  }
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                >
                  {copiedId === 'day1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'day1' ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-rose-500 block">0:00 - 0:03 Hook</span>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">&ldquo;{campaign.day1VideoReel.hook}&rdquo;</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">🎥 {campaign.day1VideoReel.visualCue}</p>
                </div>
                {campaign.day1VideoReel.scenes?.map((sc: any, i: number) => (
                  <div key={i} className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-bold text-neutral-400">{sc.timestamp}</span>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">&ldquo;{sc.audio}&rdquo;</p>
                    <p className="text-[11px] text-neutral-500">🎥 {sc.visual}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DAY 2: 5-Slide Carousel */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-extrabold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Day 2 • 5-Slide IG &amp; LinkedIn Carousel
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'day2',
                      campaign.day2Carousel.slides
                        ?.map((s: any, idx: number) => `Slide ${idx + 1}: ${s.title} — ${s.body}`)
                        .join('\n\n')
                    )
                  }
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                >
                  {copiedId === 'day2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'day2' ? 'Copied' : 'Copy Slides'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaign.day2Carousel.slides?.map((sl: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-500">Slide {i + 1}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                        {sl.highlightText}
                      </span>
                    </div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{sl.title}</p>
                    <p className="text-[11px] text-neutral-500 leading-snug">{sl.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DAY 3: High-Converting Ad Graphic */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-extrabold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Day 3 • High-Converting Ad Creative (IG / X)
                </span>
                <button
                  type="button"
                  onClick={handleRenderDay3AdVisual}
                  disabled={isRenderingAdVisual}
                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  {isRenderingAdVisual ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Rendering...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>🎨 Render AI Ad Background</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
                <img src={adPreviewUrl} alt={campaign.day3AdCreative.headline} className="w-full h-full object-cover" />
                {brand.logoUrl && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                    <img src={brand.logoUrl} alt={brand.name} className="w-5 h-5 object-contain" />
                    <span className="text-[11px] font-bold text-white">{brand.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent p-4 flex flex-col justify-end text-white space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    {campaign.day3AdCreative.badgeText}
                  </span>
                  <h4 className="text-base font-black leading-tight">{campaign.day3AdCreative.headline}</h4>
                  <p className="text-xs text-neutral-200 line-clamp-2">{campaign.day3AdCreative.subheadline}</p>
                  <div className="pt-1">
                    <span
                      className="inline-block px-3 py-1.5 rounded-xl text-xs font-extrabold text-white"
                      style={{ backgroundColor: brand.primaryColor || '#10b981' }}
                    >
                      {campaign.day3AdCreative.ctaText}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DAY 4: Viral X Thread & Day 5 Newsletter */}
            <div className="space-y-4">
              {/* Day 4 X Thread */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-extrabold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Day 4 • 5-Part Viral X Thread
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('day4', campaign.day4Thread.tweets?.join('\n\n'))}
                    className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                  >
                    {copiedId === 'day4' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'day4' ? 'Copied' : 'Copy Thread'}</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {campaign.day4Thread.tweets?.map((tw: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      {tw}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day 5 VIP Newsletter */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-extrabold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Day 5 • VIP Newsletter Blast
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-400 truncate max-w-[220px]">
                    Subject: {campaign.day5Newsletter.subjectLine}
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {campaign.day5Newsletter.headline}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {campaign.day5Newsletter.intro}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
