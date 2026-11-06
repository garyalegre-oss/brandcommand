'use client';

import React, { useState } from 'react';
import { Brand, PostFormat, Post } from '../types/brand';
import { generateBrandContent, GenerationResult } from '../lib/contentGenerator';
import { performWebResearch, inspectVideoQuality } from '../lib/videoAgentPipeline';
import { generate7DayCampaign, CampaignPlanDay } from '../lib/campaignGenerator';
import { CarouselRenderer } from './CarouselRenderer';
import { VideoScriptRenderer } from './VideoScriptRenderer';
import { ThreadRenderer } from './ThreadRenderer';
import { EmailPreviewRenderer } from './EmailPreviewRenderer';
import { AdImageStudio } from './AdImageStudio';
import { 
  Sparkles, 
  Calendar, 
  Layers, 
  Video, 
  MessageSquare, 
  Send, 
  Mail, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Activity, 
  Flame, 
  X, 
  Clock, 
  ArrowRight, 
  ListPlus,
  Wand2,
  RotateCcw,
  Edit3,
  Hash,
  Copy,
  Plus,
  Share2,
  Check,
  Tag,
  RefreshCw,
  Key
} from 'lucide-react';
import { generateSmartHashtags } from '../lib/offlineOptimizer';
import { cleanSpeechText } from '../lib/speechUtils';

interface ContentComposerProps {
  brand: Brand;
  onSavePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  onUpdateBrand?: (updatedBrand: Brand) => void;
}

export function ContentComposer({ brand, onSavePost, onUpdateBrand }: ContentComposerProps) {
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<PostFormat>('video_script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [enableWebResearch, setEnableWebResearch] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);
  const [scheduledDate, setScheduledDate] = useState('2026-10-29T14:00');
  const [justSaved, setJustSaved] = useState(false);

  // Quick Google Cloud / Gemini Key Connect State
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [keySavedNotice, setKeySavedNotice] = useState<boolean>(false);

  React.useEffect(() => {
    try {
      const saved =
        localStorage.getItem('brandcommand_google_cloud_tts_key') ||
        localStorage.getItem('brandcommand_gemini_key') ||
        localStorage.getItem('brandcommand_voice_api_key') ||
        localStorage.getItem('brandcommand_media_api_key') ||
        '';
      if (saved) {
        setGoogleApiKey(saved);
      }
    } catch {}
  }, []);

  const handleSaveKey = (newKey: string) => {
    const trimmed = newKey.trim();
    setGoogleApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('brandcommand_google_cloud_tts_key', trimmed);
      localStorage.setItem('brandcommand_gemini_key', trimmed);
      localStorage.setItem('brandcommand_voice_api_key', trimmed);
      localStorage.setItem('brandcommand_media_api_key', trimmed);
      setKeySavedNotice(true);
      setTimeout(() => setKeySavedNotice(false), 3000);
    }
  };

  // Single Post AI Optimizer State
  const [singleAiInstruction, setSingleAiInstruction] = useState('');
  const [isOptimizingSingle, setIsOptimizingSingle] = useState(false);
  const [singleHistory, setSingleHistory] = useState<string[]>([]);
  const [singleAiNotice, setSingleAiNotice] = useState<string | null>(null);

  const handleOptimizeSingle = async (customInstruction?: string) => {
    if (!generatedResult || generatedResult.format !== 'single') return;
    const promptToUse = customInstruction || singleAiInstruction;
    if (!promptToUse.trim()) return;

    setIsOptimizingSingle(true);
    setSingleAiNotice(null);

    try {
      const savedGeminiKey = typeof window !== 'undefined' 
        ? (localStorage.getItem('brandcommand_voice_api_key') || localStorage.getItem('brandcommand_media_api_key') || '') 
        : '';

      const res = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          format: 'single',
          currentData: generatedResult.content,
          instruction: promptToUse,
          apiKey: savedGeminiKey
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSingleHistory((prev) => [...prev, generatedResult.content]);
        setGeneratedResult({
          ...generatedResult,
          content: typeof data.data === 'string' ? data.data : data.data.content || generatedResult.content
        });
        setSingleAiNotice(data.explanation || 'Post optimized successfully!');
        setSingleAiInstruction('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSingleAiNotice(error.message || 'Optimization failed.');
    } finally {
      setIsOptimizingSingle(false);
    }
  };

  const handleUndoSingle = () => {
    if (singleHistory.length === 0 || !generatedResult) return;
    const prev = singleHistory[singleHistory.length - 1];
    setSingleHistory((s) => s.slice(0, -1));
    setGeneratedResult({
      ...generatedResult,
      content: prev
    });
    setSingleAiNotice('Reverted to previous version.');
  };

  // Social Caption & Hashtags Management State
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isBoostingTags, setIsBoostingTags] = useState(false);

  const handleCopyCaption = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.content);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyTags = () => {
    if (!generatedResult || !generatedResult.tags) return;
    const tagStr = generatedResult.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    navigator.clipboard.writeText(tagStr);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleCopyAll = () => {
    if (!generatedResult) return;
    const tagStr = (generatedResult.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    const fullText = tagStr ? `${generatedResult.content}\n\n${tagStr}` : generatedResult.content;
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!generatedResult) return;
    const currentTags = generatedResult.tags || [];
    setGeneratedResult({
      ...generatedResult,
      tags: currentTags.filter((t) => t !== tagToRemove)
    });
  };

  const handleAddTag = () => {
    if (!generatedResult || !newTagInput.trim()) return;
    let formatted = newTagInput.trim();
    if (!formatted.startsWith('#')) formatted = `#${formatted}`;
    formatted = formatted.replace(/\s+/g, '');
    const currentTags = generatedResult.tags || [];
    if (!currentTags.includes(formatted)) {
      setGeneratedResult({
        ...generatedResult,
        tags: [...currentTags, formatted]
      });
    }
    setNewTagInput('');
  };

  const handleBoostHashtags = () => {
    if (!generatedResult) return;
    setIsBoostingTags(true);
    try {
      const currentTags = generatedResult.tags || [];
      const boosted = generateSmartHashtags(brand, topic, currentTags);
      setGeneratedResult({
        ...generatedResult,
        tags: boosted
      });
      const addedCount = Math.max(0, boosted.length - currentTags.length);
      setSingleAiNotice(
        addedCount > 0
          ? `✨ Added ${addedCount} trending viral hashtags tailored to ${brand.name}!`
          : `✨ Refreshed high-intent hashtags for ${brand.name}!`
      );
      setTimeout(() => setSingleAiNotice(null), 3500);
    } finally {
      setIsBoostingTags(false);
    }
  };

  const handleResetHashtags = () => {
    if (!generatedResult) return;
    const defaultTags = (brand.commonHashtags || []).map((t) => (t.startsWith('#') ? t : `#${t}`));
    setGeneratedResult({
      ...generatedResult,
      tags: defaultTags
    });
    setSingleAiNotice(`Reset to ${brand.name}'s default core hashtags.`);
    setTimeout(() => setSingleAiNotice(null), 3000);
  };

  // 1-Click 7-Day Campaign Generator State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignFocus, setCampaignFocus] = useState('');
  const [campaignPlan, setCampaignPlan] = useState<CampaignPlanDay[]>([]);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [campaignQueuedSuccess, setCampaignQueuedSuccess] = useState(false);

  const handleOpenCampaignModal = () => {
    setIsCampaignModalOpen(true);
    setCampaignQueuedSuccess(false);
    if (campaignPlan.length === 0) {
      handleGenerateCampaign();
    }
  };

  const handleGenerateCampaign = () => {
    setIsGeneratingCampaign(true);
    setTimeout(() => {
      const plan = generate7DayCampaign(brand, campaignFocus);
      setCampaignPlan(plan);
      setIsGeneratingCampaign(false);
    }, 400);
  };

  const handleQueueAllCampaign = () => {
    campaignPlan.forEach((item) => {
      onSavePost(item.post);
    });
    setCampaignQueuedSuccess(true);
    setTimeout(() => {
      setCampaignQueuedSuccess(false);
      setIsCampaignModalOpen(false);
    }, 1800);
  };

  React.useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    setScheduledDate(tomorrow.toISOString().slice(0, 16));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPipelineStage('🧠 Summoning Gemini 2.5 Flash & Creative Director...');

    const cleanTopic = topic.trim() || brand.suggestedTopics[0];
    let userKey: string | undefined = undefined;
    try {
      userKey = localStorage.getItem('brandcommand_voice_api_key') ||
                localStorage.getItem('brandcommand_google_cloud_tts_key') || 
                localStorage.getItem('brandcommand_gemini_key') || 
                localStorage.getItem('brandcommand_media_api_key') || 
                undefined;
    } catch {}

    try {
      if (format === 'video_script') {
        setPipelineStage('🎬 Gemini 2.5 Flash: Scripting viral hook & scene architecture...');

        // Step 1: Base script generated with smart template + optional web research
        let sources: any[] | undefined = undefined;
        if (enableWebResearch) {
          setPipelineStage('🌐 Browsing real-time intelligence for ' + brand.name + '...');
          sources = await performWebResearch(brand, cleanTopic);
        }

        const baseResult = generateBrandContent(brand, cleanTopic, format, sources);
        let finalScript = baseResult.videoScript!;

        // Step 2: Use Gemini 2.5 Flash to intelligently write the finished video if API key is present
        if (userKey) {
          setPipelineStage('⚡ Gemini 2.5 Flash: Optimizing retention pacing & high-converting dialog...');
          try {
            const optimizeRes = await fetch('/api/optimize-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                brand,
                format: 'video_script',
                currentData: finalScript,
                instruction: `Creative Director: Produce a 100% finished, high-converting 9:16 vertical video (TikTok/Reels/Shorts) for "${cleanTopic}".
1. Hook (0-3s): Punchy, magnetic, stopping thumb-scrollers instantly.
2. Scenes: 3 crisp scenes that clearly demonstrate the product value with real interface walkthroughs.
3. CTA: Direct, actionable call to action.`,
                apiKey: userKey
              })
            });

            const optData = await optimizeRes.json();
            if (optData.success && optData.data) {
              finalScript = {
                ...finalScript,
                ...optData.data
              };
            }
          } catch (optErr) {
            console.warn('Gemini 2.5 Flash optimization fallback:', optErr);
          }
        }

        // Step 2.5: Clean speech text so the voiceover never speaks emojis as words
        finalScript.hook = cleanSpeechText(finalScript.hook) || finalScript.hook;
        finalScript.scenes = finalScript.scenes.map((sc) => ({
          ...sc,
          audio: cleanSpeechText(sc.audio) || sc.audio
        }));
        finalScript.cta = cleanSpeechText(finalScript.cta) || finalScript.cta;

        // Step 3: Automatically render Google Imagen 3 AI Visuals for all scene visual actions in parallel
        if (userKey) {
          setPipelineStage('🎨 Google DeepMind Imagen 3: Rendering 9:16 visuals for each scene action in parallel...');
          const mobileScreenshot = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl;

          const visualPromises = [
            // Hook Visual Action
            (async () => {
              try {
                const hookAction = finalScript.visualCue || `${brand.name} opening product reveal`;
                const res = await fetch('/api/generate-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    provider: 'gemini',
                    prompt: `${hookAction}, realistic product presentation for ${brand.name} (${brand.category}), 9:16 vertical composition, commercial studio lighting, 8k resolution`,
                    type: 'image',
                    apiKey: userKey,
                    brandCategory: brand.category
                  })
                });
                const data = await res.json();
                if (data.mediaUrl) {
                  finalScript.hookBrollMediaUrl = data.mediaUrl;
                  finalScript.hookBrollMediaType = 'image';
                  finalScript.hookBrollLabel = `AI: ${hookAction.slice(0, 30)}...`;
                }
              } catch (e) {
                console.warn('Auto hook visual generation note:', e);
              }
            })(),
            // Scene Visual Actions
            ...finalScript.scenes.map(async (sc, idx) => {
              // If Scene 0 has a live mobile app screenshot, bind that for authentic product UI proof!
              if (idx === 0 && mobileScreenshot) {
                sc.brollMediaUrl = mobileScreenshot;
                sc.brollMediaType = 'image';
                sc.brollLabel = `${brand.name} 📱 Live Mobile App`;
                return;
              }
              try {
                const sceneAction = sc.visual || `Scene ${idx + 1} action demonstration for ${brand.name}`;
                const res = await fetch('/api/generate-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    provider: 'gemini',
                    prompt: `${sceneAction}, clear visual action for ${brand.name} (${brand.category}), authentic user interface, 9:16 vertical video frame, commercial 4k quality`,
                    type: 'image',
                    apiKey: userKey,
                    brandCategory: brand.category
                  })
                });
                const data = await res.json();
                if (data.mediaUrl) {
                  sc.brollMediaUrl = data.mediaUrl;
                  sc.brollMediaType = 'image';
                  sc.brollLabel = `AI: ${sceneAction.slice(0, 30)}...`;
                }
              } catch (e) {
                console.warn(`Auto scene ${idx} visual generation note:`, e);
              }
            })
          ];

          await Promise.all(visualPromises);
        } else {
          // If no API key, bind authentic mobile screenshots & brand diagrams as fallback
          const mobileScreenshot = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl;
          const brandDiagram = brand.brandAssets?.find(a => a.type === 'hero' || a.viewport === 'desktop')?.url;
          finalScript.scenes = finalScript.scenes.map((sc, idx) => {
            if (idx === 0 && mobileScreenshot) {
              return {
                ...sc,
                brollMediaUrl: mobileScreenshot,
                brollMediaType: 'image',
                brollLabel: `${brand.name} 📱 Mobile App View`
              };
            }
            if (idx === 1 && brandDiagram) {
              return {
                ...sc,
                brollMediaUrl: brandDiagram,
                brollMediaType: 'image',
                brollLabel: `${brand.name} Architecture Diagram`
              };
            }
            return sc;
          });
        }

        // Step 4: Configure AI Director style properties automatically
        if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) {
          finalScript.aiDirector = {
            layout: 'dynamic_cuts',
            backgroundId: 'lottery_data_matrix',
            stickerId: 'odds_matrix',
            filter: 'cyberpunk',
            subtitleStyle: 'cyber',
            soundwaveStyle: 'neon_bars',
            directorNotes: 'Auto-built for Evidraw: Live 9:16 mobile app screenshot, cyber matrix pacing & odds badge'
          };
        } else if (brand.category === 'fintech') {
          finalScript.aiDirector = {
            layout: 'dynamic_cuts',
            backgroundId: 'live_candlesticks',
            stickerId: 'options_gain',
            filter: 'cyberpunk',
            subtitleStyle: 'cyber',
            soundwaveStyle: 'neon_bars',
            directorNotes: 'Auto-built for OptionCove: Live candlestick scanner & trading execution'
          };
        } else {
          finalScript.aiDirector = {
            layout: 'dynamic_cuts',
            backgroundId: 'cozy_workspace',
            stickerId: 'none',
            filter: 'golden_hour',
            subtitleStyle: 'hormozi',
            soundwaveStyle: 'off',
            directorNotes: 'Clean cinematic multi-cuts with Hormozi kinetic captions'
          };
        }

        finalScript.qaInspection = inspectVideoQuality(finalScript, brand);

        setGeneratedResult({
          ...baseResult,
          videoScript: finalScript
        });
      } else {
        // Other formats (carousel, thread, newsletter)
        const result = generateBrandContent(brand, cleanTopic, format);
        setGeneratedResult(result);
      }
    } catch (err) {
      console.error('Generation error:', err);
      const fallbackResult = generateBrandContent(brand, cleanTopic, format);
      setGeneratedResult(fallbackResult);
    } finally {
      setIsGenerating(false);
      setPipelineStage(null);
    }
  };

  const handleSaveToQueue = (status: 'scheduled' | 'draft') => {
    if (!generatedResult) return;

    onSavePost({
      brandId: brand.id,
      title: generatedResult.title,
      content: generatedResult.content,
      format: generatedResult.format,
      status: status,
      scheduledFor: new Date(scheduledDate).toISOString(),
      channels: brand.defaultChannels,
      carouselSlides: generatedResult.carouselSlides,
      videoScript: generatedResult.videoScript,
      threadTweets: generatedResult.threadTweets,
      emailCampaign: generatedResult.emailCampaign,
      tags: generatedResult.tags
    });

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Main Composer Box */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Multi-Format Composer
              </h2>
              <button
                onClick={handleOpenCampaignModal}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all transform hover:scale-[1.02]"
                title="Generate an entire synchronized 7-day omnichannel campaign for this brand"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>1-Click 7-Day Campaign</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Generates tailored content strictly adhering to <span className="font-semibold text-neutral-800 dark:text-neutral-200">{brand.name}</span>&apos;s persona and audience.
            </p>
          </div>

          {/* Format selector buttons */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs">
            <button
              onClick={() => setFormat('carousel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                format === 'carousel'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Carousel Deck
            </button>
            <button
              onClick={() => setFormat('video_script')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                format === 'video_script'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Reel / TikTok Script
            </button>
            <button
              onClick={() => setFormat('thread')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                format === 'thread'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              X Thread
            </button>
            <button
              onClick={() => setFormat('newsletter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                format === 'newsletter'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email Newsletter
            </button>
            <button
              onClick={() => setFormat('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                format === 'single'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              🎨 Ad &amp; Image (IG / X)
            </button>
          </div>
        </div>

        {/* Autonomous Web Research & QA Audit Bar */}
        {format === 'video_script' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  Autonomous Web Intelligence & 4K Media Sourcing
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    Live Crawl
                  </span>
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Researches industry facts, pulls matching 4K B-roll presets, and inspects video safe-zones.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enableWebResearch}
                onChange={(e) => setEnableWebResearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}

        {/* Live Multi-Stage Agent Pipeline Progress Indicator */}
        {pipelineStage && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-500/20 text-xs flex items-center gap-3 animate-pulse">
            <Activity className="w-4 h-4 text-blue-500 shrink-0 animate-spin" />
            <div className="flex-1">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                AI Production Pipeline in Progress:
              </span>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {pipelineStage}
              </p>
            </div>
          </div>
        )}

        {/* Google Cloud & Gemini API Key Quick-Connect Hub */}
        <div className="space-y-2">
          {googleApiKey ? (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Google API Key Connected ({googleApiKey.slice(0, 4)}...{googleApiKey.slice(-4)})
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 hidden sm:inline">
                  • Active for Journey Voice, Gemini 2.5 Flash & Veo 2
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {showKeyInput ? 'Hide Key' : 'Change Key'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 px-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    Connect Google API Key
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      1-Time Setup
                    </span>
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Paste your Google Cloud / Gemini key once to activate real-time Journey voice & smart video generation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
              >
                🔑 Paste Key Here
              </button>
            </div>
          )}

          {showKeyInput && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-purple-300 dark:border-purple-800 shadow-md space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-500" />
                  Paste Google API Key (starts with AIza... or AQ...)
                </span>
                {keySavedNotice && <span className="text-emerald-600 font-semibold text-[11px]">✓ Saved and connected!</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => handleSaveKey(e.target.value)}
                  placeholder="Paste your key ending in ...4EuA"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKeyInput(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Topic Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            What should this post be about?
          </label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`e.g., "${brand.suggestedTopics[0]}"`}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="absolute right-2 top-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Building Finished Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Generate Finished Video</span>
                </>
              )}
            </button>
          </div>

          {/* 1-Click Smart Build Indicator */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Finished Build:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
              Gemini 2.5 Flash
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              📱 9:16 Mobile UI Screenshot
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              🎙️ Google Cloud Journey Voice
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
              ⚡ Hormozi Captions & Music
            </span>
          </div>
        </div>

        {/* 1-Click Topic Inspiration Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-neutral-400">
            ⚡ Quick inspiration for {brand.name}:
          </span>
          <div className="flex flex-wrap gap-2">
            {brand.suggestedTopics.map((st, i) => (
              <button
                key={i}
                onClick={() => setTopic(st)}
                className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors truncate max-w-xs text-left"
              >
                &ldquo;{st}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Ad & Social Image Studio when 'single' (Ad & Image) format is selected */}
      {format === 'single' && (
        <AdImageStudio
          brand={brand}
          onSavePost={onSavePost}
          onUpdateBrand={onUpdateBrand}
        />
      )}

      {/* Generated Result Container */}
      {generatedResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Format-specific Interactive Renderers */}
          {generatedResult.format === 'carousel' && generatedResult.carouselSlides && (
            <CarouselRenderer
              brand={brand}
              slides={generatedResult.carouselSlides}
              onUpdateSlides={(updatedSlides) => {
                setGeneratedResult({
                  ...generatedResult,
                  carouselSlides: updatedSlides
                });
              }}
            />
          )}

          {generatedResult.format === 'video_script' && generatedResult.videoScript && (
            <VideoScriptRenderer brand={brand} script={generatedResult.videoScript} onUpdateBrand={onUpdateBrand} />
          )}

          {generatedResult.format === 'thread' && generatedResult.threadTweets && (
            <ThreadRenderer
              brand={brand}
              tweets={generatedResult.threadTweets}
              onUpdateTweets={(updatedTweets) => {
                setGeneratedResult({
                  ...generatedResult,
                  threadTweets: updatedTweets
                });
              }}
            />
          )}

          {generatedResult.format === 'newsletter' && generatedResult.emailCampaign && (
            <EmailPreviewRenderer
              brand={brand}
              campaign={generatedResult.emailCampaign}
              onUpdateBrand={onUpdateBrand}
              onUpdateCampaign={(updatedCampaign) => {
                setGeneratedResult({
                  ...generatedResult,
                  emailCampaign: updatedCampaign
                });
              }}
            />
          )}

          {/* Universal Social Caption & Target Hashtags Command Center (All Formats) */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Header & Quick Clipboard Action Shelf */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  {generatedResult.format === 'single' ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    {generatedResult.format === 'single'
                      ? 'Single Social Post Copy & Hashtags'
                      : 'Accompanying Social Caption & Target Hashtags'}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      {generatedResult.format.replace('_', ' ')}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {generatedResult.format === 'single'
                      ? 'The main post copy and niche hashtags published to your active channels.'
                      : `The caption and discovery tags accompanying this ${generatedResult.format.replace('_', ' ')} when publishing to Instagram, TikTok, LinkedIn, or X.`}
                  </p>
                </div>
              </div>

              {/* 1-Click Clipboard Actions */}
              <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
                <button
                  onClick={handleCopyCaption}
                  title="Copy post caption / description only"
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Caption Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyTags}
                  title="Copy hashtags string only"
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  {copiedTags ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Tags Copied!</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Tags</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyAll}
                  title="Copy full post: Caption + All Hashtags (ready to paste into Instagram, TikTok, LinkedIn, X)"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Caption + Tags!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Copy Caption + Tags</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart AI Caption & Post Optimizer */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Smart AI Caption & Copy Optimizer</span>
                </div>
                {singleHistory.length > 0 && (
                  <button
                    onClick={handleUndoSingle}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo Revision
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleOptimizeSingle('Add a provocative unpopular opinion opening hook')}
                  disabled={isOptimizingSingle}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
                >
                  ⚡ Provocative Hook
                </button>
                <button
                  onClick={() => handleOptimizeSingle('Format with clean whitespace and add an engagement prompt for LinkedIn')}
                  disabled={isOptimizingSingle}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
                >
                  💼 LinkedIn Format
                </button>
                <button
                  onClick={() => handleOptimizeSingle('Make the tone sharper, more confident, and add high-intent hashtags')}
                  disabled={isOptimizingSingle}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
                >
                  🔥 High Conviction
                </button>
                <button
                  onClick={() => handleOptimizeSingle('Condense into a crisp punchy 2-liner post')}
                  disabled={isOptimizingSingle}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
                >
                  ✂️ Short & Punchy
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={singleAiInstruction}
                  onChange={(e) => setSingleAiInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOptimizeSingle();
                  }}
                  placeholder="Tell AI how to improve this caption (e.g. 'Add a question for the comments', 'Make it sound authentic')..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleOptimizeSingle()}
                  disabled={isOptimizingSingle || !singleAiInstruction.trim()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isOptimizingSingle ? (
                    <>
                      <Wand2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Optimize Caption</span>
                    </>
                  )}
                </button>
              </div>

              {singleAiNotice && (
                <div className="p-2 rounded-xl text-xs bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{singleAiNotice}</span>
                  </div>
                  <button onClick={() => setSingleAiNotice(null)} className="opacity-60 hover:opacity-100">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Editable Social Caption / Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold uppercase tracking-wider">
                  {generatedResult.format === 'single' ? 'Post Copy' : 'Social Caption / Feed Description'}
                </span>
                <span>
                  {generatedResult.content.length} characters • ~{generatedResult.content.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={generatedResult.format === 'single' ? 6 : 4}
                value={generatedResult.content}
                onChange={(e) => {
                  setGeneratedResult({
                    ...generatedResult,
                    content: e.target.value
                  });
                }}
                className="w-full text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            {/* Target Hashtags Shelf */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    #
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Target Hashtags & Keywords
                    </span>
                    <span className="text-[10px] text-neutral-400 ml-1.5 font-medium">
                      ({(generatedResult.tags || []).length} active)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBoostHashtags}
                    disabled={isBoostingTags}
                    title="Generate trending, algorithmically targeted hashtags for this niche and topic"
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isBoostingTags ? 'Boosting...' : '✨ AI Viral Booster'}</span>
                  </button>

                  <button
                    onClick={handleResetHashtags}
                    title="Reset to brand core hashtags"
                    className="px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Interactive Hashtag Pills & Add Input */}
              <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800">
                {(generatedResult.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-2xs group hover:border-emerald-500 transition-colors"
                  >
                    <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      title={`Remove ${tag}`}
                      className="text-neutral-400 hover:text-red-500 group-hover:text-neutral-500 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Inline Add Tag Input */}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ Add tag (e.g. #NewTrend)..."
                    className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 w-36 transition-colors"
                  />
                  {newTagInput.trim() && (
                    <button
                      onClick={handleAddTag}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar: Scheduling & Publishing */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-neutral-400">Schedule Date & Time:</span>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="text-xs bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleSaveToQueue('draft')}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSaveToQueue('scheduled')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                {justSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Added to Queue!
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Approve & Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 1-Click 7-Day Omnichannel Campaign Generator Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs"
                  style={{ backgroundColor: brand.primaryColor, color: brand.textColor }}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      7-Day Omnichannel Campaign Generator
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      7 Synchronized Posts
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Drafts a complete 7-day multi-channel content blitz tailored for <span className="font-semibold text-neutral-700 dark:text-neutral-300">{brand.name}</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campaign Theme & Regeneration controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Campaign Focus / Theme (Optional)
                </label>
                <input
                  type="text"
                  value={campaignFocus}
                  onChange={(e) => setCampaignFocus(e.target.value)}
                  placeholder={`e.g., "${brand.suggestedTopics[0]}"`}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200"
                />
              </div>

              <button
                onClick={handleGenerateCampaign}
                disabled={isGeneratingCampaign}
                className="self-end sm:self-auto px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isGeneratingCampaign ? 'Synthesizing 7 Days...' : 'Regenerate Plan'}</span>
              </button>
            </div>

            {/* Campaign Days List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {campaignPlan.map((day) => (
                <div
                  key={day.dayNumber}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-white dark:hover:bg-neutral-850 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex flex-col items-center justify-center shrink-0 border border-emerald-500/20">
                      <span className="text-[9px] uppercase leading-none text-neutral-400">Day</span>
                      <span className="text-sm font-black leading-none">{day.dayNumber}</span>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {day.dayName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                          {day.format}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(day.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {day.post.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {day.post.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                    {day.post.channels.map((ch) => (
                      <span
                        key={ch}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 uppercase"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer & Queue Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4 gap-3">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Dates automatically spaced across the upcoming 7 days in the queue.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleQueueAllCampaign}
                  disabled={campaignQueuedSuccess}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-80"
                >
                  {campaignQueuedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All 7 Posts Added to Calendar!</span>
                    </>
                  ) : (
                    <>
                      <ListPlus className="w-4 h-4" />
                      <span>Queue All 7 Days to Publishing Calendar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
