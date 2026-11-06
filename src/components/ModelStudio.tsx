'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Brand, Post, PostFormat, SocialChannel, VideoScript } from '../types/brand';
import { VideoScriptRenderer } from './VideoScriptRenderer';
import { CarouselRenderer } from './CarouselRenderer';
import {
  Sparkles,
  Search,
  Paperclip,
  Send,
  History,
  CheckCircle2,
  Calendar,
  Video,
  Layers,
  Wand2,
  ChevronDown,
  Maximize2,
  Play,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface ModelStudioProps {
  brand: Brand;
  posts: Post[];
  onSaveBatchPosts: (newPosts: Omit<Post, 'id' | 'createdAt'>[]) => void;
  onUpdatePost: (post: Post) => void;
  onUpdateBrand?: (brand: Brand) => void;
  onOpenLibrary: () => void;
  onOpenInsideAppBot: () => void;
}

type StudioModelId =
  | 'auto'
  | 'ugc_creator'
  | 'inside_app_bot'
  | 'veo_video'
  | 'imagen_4k'
  | 'gemini_carousel';

interface ModelOption {
  id: StudioModelId;
  name: string;
  badge: string;
  provider: string;
  description: string;
  defaultOutput: '9:16_ugc' | '16:9_youtube' | '9:16_reel' | 'carousel';
}

const STUDIO_MODELS: ModelOption[] = [
  {
    id: 'auto',
    name: 'Auto · 6 Frontier Models',
    badge: 'Smart Router',
    provider: 'Gemini + Veo + UGC + Bot',
    description: 'Automatically selects the best video, UGC creator, or carousel engine for your prompt',
    defaultOutput: '9:16_ugc'
  },
  {
    id: 'ugc_creator',
    name: 'UGC Creator Hook Engine',
    badge: '9:16 Reaction POV',
    provider: 'Front-Camera Silent Reaction + Story Text',
    description: 'Front-facing selfie camera POV silent emotional reaction (thinking, nodding, skeptical, frustrated) matched to centered story text',
    defaultOutput: '9:16_ugc'
  },
  {
    id: 'inside_app_bot',
    name: 'Inside-App Walkthrough Bot',
    badge: '16:9 & 9:16 HD',
    provider: 'Playwright + Gemini Vision',
    description: 'Scrolls down real app screens, zooms into key sections & adds animated pointer arrows',
    defaultOutput: '16:9_youtube'
  },
  {
    id: 'veo_video',
    name: 'Google DeepMind Veo 2',
    badge: 'Cinematic Video',
    provider: 'Google Veo 2',
    description: 'Generates high-motion 9:16 or 16:9 AI commercial B-roll & voiceover reels',
    defaultOutput: '9:16_reel'
  },
  {
    id: 'imagen_4k',
    name: 'Google Imagen 3 Studio',
    badge: '4K Visuals',
    provider: 'Google Imagen 3',
    description: 'Renders photorealistic scene visuals, product shots & high-converting ad creatives',
    defaultOutput: '9:16_reel'
  },
  {
    id: 'gemini_carousel',
    name: 'Gemini 2.5 Story & Carousel',
    badge: 'Multi-Slide',
    provider: 'Google Gemini 2.5',
    description: 'Builds 5-slide educational carousels, viral X threads & omnichannel captions',
    defaultOutput: 'carousel'
  }
];

export function ModelStudio({
  brand,
  posts,
  onSaveBatchPosts,
  onUpdatePost,
  onUpdateBrand,
  onOpenLibrary,
  onOpenInsideAppBot
}: ModelStudioProps) {
  const [promptText, setPromptText] = useState('');
  const [selectedModel, setSelectedModel] = useState<StudioModelId>('auto');
  const [outputMode, setOutputMode] = useState<'9:16_ugc' | '16:9_youtube' | '9:16_reel' | 'carousel'>('9:16_ugc');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showRunsDrawer, setShowRunsDrawer] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedAssetUrl, setAttachedAssetUrl] = useState<string | null>(null);
  const [attachedAssetLabel, setAttachedAssetLabel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeGeneratedPostId, setActiveGeneratedPostId] = useState<string | null>(null);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  const brandPosts = useMemo(
    () => posts.filter((p) => p.brandId === brand.id),
    [posts, brand.id]
  );

  const activePost = useMemo(() => {
    if (activeGeneratedPostId) {
      const found = brandPosts.find((p) => p.id === activeGeneratedPostId);
      if (found) return found;
    }
    return brandPosts[0] || null;
  }, [brandPosts, activeGeneratedPostId]);

  const currentModelObj =
    STUDIO_MODELS.find((m) => m.id === selectedModel) || STUDIO_MODELS[0];

  // Brand-tailored prompt templates searchable via top bar
  const promptTemplates = useMemo(() => {
    const isEvidraw = (brand.slug || brand.name).toLowerCase().includes('evidraw');
    return [
      {
        id: 'tpl_ugc_story',
        title: `🤳 UGC Creator Selfie Hook for ${brand.name}`,
        category: 'UGC Creator Reel',
        model: 'ugc_creator' as StudioModelId,
        output: '9:16_ugc' as const,
        previewImg:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        prompt: isEvidraw
          ? `Create a 9:16 UGC creator selfie video where a creator holds her phone in an apartment POV with the centered story text: "paper notes aren't evidence if you can edit the picks after Lotto Max or 6/49 hits, your brain will quietly rewrite history. I started using Evidraw to lock multiple portfolios with timestamps before every draw"`
          : `Create a 9:16 UGC creator selfie video with a model holding her phone and a centered white-with-black-stroke story paragraph about why switching to ${brand.name} beats manual guesswork.`
      },
      {
        id: 'tpl_youtube_walkthrough',
        title: `🖥️ 16:9 YouTube Full-Size App Walkthrough`,
        category: '16:9 YouTube HD',
        model: 'inside_app_bot' as StudioModelId,
        output: '16:9_youtube' as const,
        previewImg:
          brand.websiteDesktopScreenshotUrl ||
          brand.websiteScreenshotUrl ||
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
        prompt: `Generate a full-size 16:9 YouTube tutorial video for ${brand.name} that scrolls top-to-bottom through our main dashboard and market tabs, zooms into the key controls, and points with an animated arrow.`
      },
      {
        id: 'tpl_ugc_to_app_cut',
        title: `🤳➡️💻 Creator Selfie Hook → Live App Screen Cut`,
        category: 'Hybrid Conversion Reel',
        model: 'ugc_creator' as StudioModelId,
        output: '9:16_ugc' as const,
        previewImg:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
        prompt: `Open with a 3-second UGC creator selfie hook holding a phone, then cut directly into ${brand.name}'s scrolling inside-app screens to prove how fast the workflow runs.`
      },
      {
        id: 'tpl_carousel_playbook',
        title: `📑 5-Slide Educational Playbook Carousel`,
        category: 'Instagram / LinkedIn Carousel',
        model: 'gemini_carousel' as StudioModelId,
        output: 'carousel' as const,
        previewImg:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
        prompt: `Create a 5-slide authority carousel breaking down the 3 biggest mistakes ${brand.targetAudience || 'users'} make and how ${brand.name} solves them step by step.`
      }
    ].filter((tpl) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.prompt.toLowerCase().includes(q)
      );
    });
  }, [brand, searchQuery]);

  const handleRunStudioPrompt = async (customPrompt?: string) => {
    const textToRun = (customPrompt ?? promptText).trim();
    if (!textToRun) {
      promptInputRef.current?.focus();
      return;
    }

    setIsGenerating(true);
    setStatusMessage(`✨ Routing prompt through ${currentModelObj.name} for ${brand.name}...`);

    try {
      const lower = textToRun.toLowerCase();
      const effectiveModel: StudioModelId =
        selectedModel !== 'auto'
          ? selectedModel
          : lower.includes('carousel') || lower.includes('slide')
          ? 'gemini_carousel'
          : lower.includes('youtube') || lower.includes('16:9') || lower.includes('walkthrough') || lower.includes('scroll')
          ? 'inside_app_bot'
          : 'ugc_creator';

      const isEvidraw = (brand.slug || brand.name).toLowerCase().includes('evidraw');
      const primaryAsset = (brand.brandAssets || [])[0];
      const secondaryAsset = (brand.brandAssets || [])[1] || primaryAsset;
      const fallbackUrl =
        attachedAssetUrl ||
        primaryAsset?.url ||
        brand.websiteDesktopScreenshotUrl ||
        brand.websiteMobileScreenshotUrl ||
        brand.websiteScreenshotUrl ||
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80';

      const cleanUrl = brand.websiteUrl || `https://${brand.slug}.com`;
      const tagStr = (brand.commonHashtags || [])
        .map((t) => `#${t.replace(/^#/, '')}`)
        .join(' ');
      const defaultKeyword =
        brand.name.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'ACCESS';

      // Next scheduled slot (tomorrow 09:30 or 17:30)
      const nextSlot = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
      const isHandsFree =
        brand.autoPilot?.enabled && brand.autoPilot?.mode === 'fully_automated';

      if (effectiveModel === 'gemini_carousel' || outputMode === 'carousel') {
        const newPost: Omit<Post, 'id' | 'createdAt'> = {
          brandId: brand.id,
          title: `[✨ Model Studio Carousel] ${textToRun.slice(0, 52)}`,
          content: `${textToRun}\n\nSwipe through the full breakdown for ${brand.name} 👉 ${cleanUrl}\n\n${tagStr}`,
          format: 'carousel',
          status: isHandsFree ? 'scheduled' : 'draft',
          approvalStatus: isHandsFree ? 'approved' : 'pending_approval',
          isAutoGenerated: true,
          contentPillar: 'Model Studio Carousel',
          mediaPreviewUrl: fallbackUrl,
          scheduledFor: nextSlot,
          channels: ['instagram', 'linkedin'],
          carouselSlides: [
            {
              title: textToRun.slice(0, 48),
              subtitle: 'SWIPE FOR THE SYSTEM →',
              body: `Why manual guesswork fails — and how ${brand.name} gives you a verifiable edge.`,
              highlightText: brand.name
            },
            {
              title: `Step 1: Open ${primaryAsset?.label || brand.name}`,
              subtitle: '01 / THE SETUP',
              body:
                primaryAsset?.tutorialStepSuggestion ||
                `Lock in your core parameters inside ${brand.name} before the session begins.`,
              highlightText: 'Step 1'
            },
            {
              title: `Step 2: Real-Time Verification`,
              subtitle: '02 / LIVE TELEMETRY',
              body:
                secondaryAsset?.tutorialStepSuggestion ||
                `Let live timestamps and objective data audit the performance automatically.`,
              highlightText: 'Verified'
            },
            {
              title: `Try ${brand.name} Today`,
              subtitle: '03 / GET STARTED',
              body: `Visit ${cleanUrl} or comment "${defaultKeyword}" below for instant access.`,
              highlightText: cleanUrl
            }
          ],
          firstCommentPlug: `⚡ Direct access to ${brand.name}: ${cleanUrl}`,
          dmTriggerKeyword: defaultKeyword,
          dmAutoReplyScript: `Here is your direct link to ${brand.name}: ${cleanUrl}`,
          tags: brand.commonHashtags || []
        };

        onSaveBatchPosts([newPost]);
        setStatusMessage(
          `✅ Generated 4-Slide Carousel in Model Studio & saved to ${brand.name}'s Content Library!`
        );
      } else {
        const useUgcLayout =
          effectiveModel === 'ugc_creator' || outputMode === '9:16_ugc';

        // Extract custom quoted story text if the user typed one in quotes, otherwise craft a multi-line UGC story
        const quotedMatch = textToRun.match(/"([^"]{25,})"/);
        const ugcStoryText = quotedMatch
          ? quotedMatch[1]
              .split(/(?:,\s+|\.\s+|\s+(?=I started|before every|then I|after ))/g)
              .map((s) => s.trim())
              .filter(Boolean)
              .join('\n')
          : isEvidraw
          ? `paper notes aren't evidence\nif you can edit the picks\nafter Lotto Max or 6/49 hits,\nyour brain will quietly rewrite\nhistory\nI started using Evidraw to lock\nmultiple portfolios with\ntimestamps\nbefore every draw\nthen I leave the record alone\nand let the results judge it`
          : `manual notes aren't evidence\nif you're piecing together\nyour workflow after the fact,\nyour brain will quietly rewrite\nhistory\nI started using ${brand.name}\nto lock my strategy in\none verified workspace\nbefore every session\nthen I leave the record alone\nand let the results judge it`;

        const scriptObj: VideoScript = {
          hook: useUgcLayout
            ? `Most people rely on memory or messy notes until they realize their brain quietly rewrites history.`
            : `Want to see how ${brand.name} works on the inside? Follow the arrow as we scroll through the live workspace.`,
          visualCue: useUgcLayout
            ? `Front-facing smartphone camera POV silent emotional reaction matched to centered white-with-black-stroke story paragraph overlay`
            : `Camera scrolls top-to-bottom through ${brand.name} and zooms into the interactive controls`,
          ugcStoryText: useUgcLayout ? ugcStoryText : undefined,
          ugcCreatorId: useUgcLayout ? 'ugc_react_decision_woman' : undefined,
          aiDirector: {
            layout: useUgcLayout ? 'ugc_creator' : 'dynamic_cuts',
            backgroundId: 'none',
            stickerId: 'none',
            filter: 'none',
            subtitleStyle: 'hormozi',
            soundwaveStyle: 'off',
            directorNotes: `Generated via Model Studio (${currentModelObj.name})`
          },
          hookBrollMediaUrl: fallbackUrl,
          hookBrollMediaType: 'image',
          hookBrollLabel: attachedAssetLabel || primaryAsset?.label || `${brand.name} Live`,
          hookUiHighlight: primaryAsset?.uiHighlight,
          scenes: [
            {
              timestamp: '0:03 - 0:10',
              visual: `Camera highlights ${primaryAsset?.label || brand.name} and scrolls smoothly through the key controls.`,
              audio:
                primaryAsset?.tutorialStepSuggestion ||
                `First, open ${brand.name} to lock in your setup and review the live metrics in one clean view.`,
              brollMediaUrl: fallbackUrl,
              brollMediaType: 'image',
              brollLabel: `STEP 1 • ${primaryAsset?.label || 'Overview'}`,
              uiHighlight: primaryAsset?.uiHighlight
            },
            {
              timestamp: '0:10 - 0:18',
              visual: `Camera scrolls down to ${secondaryAsset?.label || 'the action panel'} and zooms into the results.`,
              audio:
                secondaryAsset?.tutorialStepSuggestion ||
                `Next, scroll down to compare your live performance and let the verified record speak for itself.`,
              brollMediaUrl: secondaryAsset?.url || fallbackUrl,
              brollMediaType: 'image',
              brollLabel: `STEP 2 • ${secondaryAsset?.label || 'Live Results'}`,
              uiHighlight: secondaryAsset?.uiHighlight
            }
          ],
          cta: `Try ${brand.name} yourself right now at ${brand.name} dot com.`,
          ctaBrollMediaUrl: secondaryAsset?.url || fallbackUrl,
          ctaBrollMediaType: 'image',
          ctaBrollLabel: `${brand.name} Workspace`,
          ctaUiHighlight: secondaryAsset?.uiHighlight
        };

        const newPost: Omit<Post, 'id' | 'createdAt'> = {
          brandId: brand.id,
          title: useUgcLayout
            ? `[🤳 UGC Creator Reel] ${textToRun.slice(0, 48)}`
            : `[🎬 ${outputMode === '16:9_youtube' ? '16:9 YouTube HD' : '9:16 Reel'}] ${textToRun.slice(0, 48)}`,
          content: `${textToRun}\n\nExplore ${brand.name} live at ${cleanUrl} ${tagStr}`,
          format: 'video_script',
          status: isHandsFree ? 'scheduled' : 'draft',
          approvalStatus: isHandsFree ? 'approved' : 'pending_approval',
          isAutoGenerated: true,
          contentPillar: useUgcLayout ? 'UGC Creator Story Reel' : 'Inside-App Video Tutorial',
          mediaPreviewUrl: useUgcLayout
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=85'
            : fallbackUrl,
          scheduledFor: nextSlot,
          channels:
            outputMode === '16:9_youtube'
              ? (['youtube', 'linkedin', 'twitter'] as SocialChannel[])
              : (['tiktok', 'instagram', 'youtube'] as SocialChannel[]),
          videoScript: scriptObj,
          firstCommentPlug: `⚡ Try ${brand.name} live 👉 ${cleanUrl}`,
          dmTriggerKeyword: defaultKeyword,
          dmAutoReplyScript: `Here is your direct link to ${brand.name}: ${cleanUrl}`,
          tags: brand.commonHashtags || []
        };

        onSaveBatchPosts([newPost]);
        setStatusMessage(
          useUgcLayout
            ? `🤳 Generated 9:16 UGC Creator Story Reel for ${brand.name}! Preview it live below or 1-click approve to schedule.`
            : `🎬 Generated ${outputMode === '16:9_youtube' ? '16:9 YouTube HD' : '9:16 Vertical'} Video for ${brand.name}! Preview it live below.`
        );
      }

      setPromptText('');
      setActiveGeneratedPostId(null); // Selects newest post at index 0
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* TOP HEADER BAR: Model Studio | Any model, any output | Runs | Search prompts & models */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 px-5 py-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
            Model Studio
          </h2>
          <span className="text-xs text-neutral-400 font-medium border-l border-neutral-200 dark:border-neutral-800 pl-3">
            Any model, any output
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Bot Capture Pill */}
          <button
            type="button"
            onClick={onOpenInsideAppBot}
            className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-2 transition-all shadow-2xs"
          >
            <span className="flex items-center -space-x-1">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-black">
                G
              </span>
              <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 text-[9px] flex items-center justify-center font-black">
                🤳
              </span>
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-black">
                🤖
              </span>
            </span>
            <span>Launch Inside-App Bot Recorder</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Runs History Button */}
          <button
            type="button"
            onClick={() => setShowRunsDrawer((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              showRunsDrawer
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Runs ({brandPosts.length})</span>
          </button>

          {/* Search prompts and models */}
          <div className="relative min-w-[220px] sm:min-w-[250px]">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts and models"
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE RUNS DRAWER */}
      {showRunsDrawer && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-md space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>Recent Model Studio Runs for {brand.name}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowRunsDrawer(false)}
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              Close ✕
            </button>
          </div>
          {brandPosts.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">
              No runs yet. Type what you want to make in the prompt bar below!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {brandPosts.slice(0, 9).map((post) => {
                const isSelected = activePost?.id === post.id;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      setActiveGeneratedPostId(post.id);
                      setShowRunsDrawer(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 bg-neutral-50 dark:bg-neutral-950'
                    }`}
                  >
                    {post.mediaPreviewUrl && (
                      <img
                        src={post.mediaPreviewUrl}
                        alt=""
                        className="w-10 h-12 rounded-lg object-cover shrink-0 border border-neutral-700"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                        {post.title || post.content.slice(0, 40)}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                        {post.contentPillar || post.format}
                      </p>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          post.status === 'scheduled'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {post.status === 'scheduled' ? '📅 Scheduled' : '⏳ Pending Approval'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HERO SHOWCASE CARD + FLOATING COMPOSER (Matches Predis Model Studio Aesthetic) */}
      <div className="relative max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#070b14] via-[#091124] to-[#050811] border border-neutral-800 shadow-2xl px-6 pt-10 pb-24 text-center">
          {/* Ambient radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.22),transparent_65%)] pointer-events-none" />

          {/* Floating Angled Showcase Cards Around the Hero Title */}
          <div className="hidden sm:grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-6 opacity-90 pointer-events-none">
            <div className="transform -rotate-6 translate-y-2 rounded-2xl overflow-hidden border border-white/15 shadow-xl h-24 bg-neutral-900">
              <img
                src={
                  brand.websiteDesktopScreenshotUrl ||
                  brand.websiteScreenshotUrl ||
                  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80'
                }
                alt="App Walkthrough"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="transform -translate-y-2 rounded-2xl overflow-hidden border border-white/15 shadow-xl h-24 bg-neutral-900">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80"
                alt="Veo 2 Studio"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="transform rotate-6 translate-y-2 rounded-2xl overflow-hidden border border-amber-400/30 shadow-xl h-24 bg-neutral-900">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                alt="UGC Creator POV"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Center Title */}
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              MODEL STUDIO
            </h1>
            <div className="w-16 h-0.5 bg-blue-500 mx-auto rounded-full" />
            <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] text-neutral-300 uppercase">
              EVERY FRONTIER MODEL &amp; UGC ENGINE, INSIDE BRANDCOMMAND
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => promptInputRef.current?.focus()}
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                Try now
              </button>
            </div>
          </div>
        </div>

        {/* FLOATING BOTTOM PROMPT COMPOSER CARD ("Describe what you want to make") */}
        <div className="relative z-20 -mt-14 mx-3 sm:mx-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-700 shadow-2xl p-3.5 space-y-2.5">
          {/* Attached Screenshot / Asset Pill if selected */}
          {attachedAssetUrl && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={attachedAssetUrl}
                  alt=""
                  className="w-6 h-6 rounded object-cover border border-emerald-500/40"
                />
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Attached Reference: {attachedAssetLabel || 'Brand Screen'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedAssetUrl(null);
                  setAttachedAssetLabel(null);
                }}
                className="text-neutral-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <textarea
            ref={promptInputRef}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRunStudioPrompt();
              }
            }}
            rows={2}
            placeholder={`Describe what you want to make for ${brand.name} (e.g. "9:16 UGC creator selfie hook about locking lottery picks before the draw" or "16:9 YouTube app walkthrough")...`}
            className="w-full resize-none bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none px-1"
          />

          {/* Composer Bottom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-1.5 relative">
              {/* Attach Reference Screen Button */}
              <button
                type="button"
                onClick={() => setShowAssetPicker((prev) => !prev)}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Attach a captured app screen from this brand"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Model Picker Pill ("Auto · 6 models ▾") */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-extrabold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>{currentModelObj.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                    {currentModelObj.badge}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {showModelDropdown && (
                  <div className="absolute left-0 bottom-full mb-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl p-2 z-50 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Select AI Model / Production Engine
                    </div>
                    {STUDIO_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setOutputMode(m.defaultOutput);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all flex items-start justify-between gap-2 ${
                          selectedModel === m.id
                            ? 'bg-blue-500/10 border border-blue-500/30'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <span>{m.name}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-snug mt-0.5">
                            {m.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {m.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Output Format Quick Pills */}
              <div className="hidden sm:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setOutputMode('9:16_ugc')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    outputMode === '9:16_ugc'
                      ? 'bg-amber-500 text-neutral-950 font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  🤳 9:16 UGC Hook
                </button>
                <button
                  type="button"
                  onClick={() => setOutputMode('16:9_youtube')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    outputMode === '16:9_youtube'
                      ? 'bg-emerald-600 text-white font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  🖥️ 16:9 YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setOutputMode('9:16_reel')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    outputMode === '9:16_reel'
                      ? 'bg-pink-600 text-white font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  📱 9:16 App Reel
                </button>
                <button
                  type="button"
                  onClick={() => setOutputMode('carousel')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    outputMode === 'carousel'
                      ? 'bg-indigo-600 text-white font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  📑 Carousel
                </button>
              </div>
            </div>

            {/* Send / Generate Button */}
            <button
              type="button"
              onClick={() => handleRunStudioPrompt()}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          {/* Asset Picker Popover when Paperclip is clicked */}
          {showAssetPicker && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
                <span>Attach a Captured {brand.name} Screen as Visual Reference:</span>
                <button
                  type="button"
                  onClick={() => setShowAssetPicker(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  Close ✕
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(brand.brandAssets || []).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      setAttachedAssetUrl(asset.url);
                      setAttachedAssetLabel(asset.label || asset.name);
                      setShowAssetPicker(false);
                    }}
                    className="shrink-0 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950 flex items-center gap-2 text-left"
                  >
                    <img
                      src={asset.url}
                      alt={asset.label || asset.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="pr-2">
                      <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">
                        {asset.label || asset.name}
                      </p>
                      <span className="text-[9px] text-neutral-400">Click to attach</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div className="max-w-4xl mx-auto p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold shrink-0"
          >
            View in Content Library →
          </button>
        </div>
      )}

      {/* ONE-CLICK PROMPT RECIPES FOR THIS BRAND */}
      <div className="max-w-4xl mx-auto space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
            Ready-to-Run Prompt Templates for {brand.name}
          </span>
          <span className="text-[11px] text-neutral-400">
            Click any card to run or load into the studio
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {promptTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-24 w-full overflow-hidden bg-neutral-950">
                  <img
                    src={tpl.previewImg}
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-extrabold text-amber-300 border border-white/15">
                    {tpl.category}
                  </span>
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white leading-snug">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {tpl.prompt}
                  </p>
                </div>
              </div>
              <div className="px-3 pb-3 pt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel(tpl.model);
                    setOutputMode(tpl.output);
                    setPromptText(tpl.prompt);
                    handleRunStudioPrompt(tpl.prompt);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel(tpl.model);
                    setOutputMode(tpl.output);
                    setPromptText(tpl.prompt);
                    promptInputRef.current?.focus();
                  }}
                  className="py-1.5 px-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold text-neutral-600 dark:text-neutral-300"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE OUTPUT PREVIEW STAGE */}
      {activePost && (
        <div className="max-w-5xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold uppercase">
                  ✨ Latest Studio Output
                </span>
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                  {activePost.title || activePost.contentPillar || 'Generated Asset'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                {activePost.content}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activePost.status !== 'scheduled' ? (
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePost({
                      ...activePost,
                      status: 'scheduled',
                      approvalStatus: 'approved',
                      scheduledFor:
                        activePost.scheduledFor ||
                        new Date(Date.now() + 4 * 3600 * 1000).toISOString()
                    });
                    setStatusMessage(
                      `✅ Approved & added "${activePost.title || 'Post'}" to ${brand.name}'s 7-Day Posting Schedule!`
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve &amp; Auto-Schedule</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Scheduled:{' '}
                    {activePost.scheduledFor
                      ? new Date(activePost.scheduledFor).toLocaleString([], {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Queued'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {activePost.format === 'video_script' && activePost.videoScript ? (
            <VideoScriptRenderer
              brand={brand}
              script={activePost.videoScript}
              onUpdateBrand={onUpdateBrand}
              defaultAspectRatio={
                activePost.title?.includes('16:9') && !activePost.videoScript.ugcStoryText
                  ? '16:9'
                  : '9:16'
              }
            />
          ) : activePost.format === 'carousel' && activePost.carouselSlides ? (
            <CarouselRenderer
              brand={brand}
              slides={activePost.carouselSlides}
              onUpdateSlides={(updatedSlides) =>
                onUpdatePost({
                  ...activePost,
                  carouselSlides: updatedSlides
                })
              }
            />
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs whitespace-pre-line text-neutral-700 dark:text-neutral-200">
              {activePost.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
