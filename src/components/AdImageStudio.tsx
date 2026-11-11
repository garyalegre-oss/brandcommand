'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brand, Post, SocialChannel, AdVariantOption, AdConversionScore, CompetitorAdAnalysis } from '../types/brand';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Type,
  Calendar,
  Send,
  Smartphone,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Share2,
  ExternalLink,
  FlaskConical,
  Eye,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { generateSmartHashtags } from '../lib/offlineOptimizer';

interface AdImageStudioProps {
  brand: Brand;
  onSavePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  onUpdateBrand?: (updatedBrand: Brand) => void;
  onOpenSocialHub?: () => void;
}

type AdAspectRatio = '1:1' | '4:5' | '16:9' | '9:16';
type OverlayLayout = 'bottom_card' | 'split_banner' | 'center_glass' | 'none';
type LogoPlacement = 'top_right_pill' | 'top_left_mark' | 'bottom_right_mark' | 'hidden';
type LogoSize = 'sm' | 'md' | 'lg';

interface GeneratedAdAsset {
  id: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: AdAspectRatio;
  model: string;
  createdAt: string;
}

const PLATFORM_PRESETS: Array<{
  id: string;
  label: string;
  sublabel: string;
  ratio: AdAspectRatio;
  channels: SocialChannel[];
  dimensions: { w: number; h: number };
  aspectClass: string;
}> = [
  {
    id: 'ig_square',
    label: 'Instagram & X Square',
    sublabel: '1:1 Feed Post & Carousel Ad',
    ratio: '1:1',
    channels: ['instagram', 'twitter', 'facebook', 'linkedin'],
    dimensions: { w: 1080, h: 1080 },
    aspectClass: 'aspect-square max-w-[460px]'
  },
  {
    id: 'ig_portrait',
    label: 'Instagram & Meta Portrait',
    sublabel: '4:5 High-Conversion Feed Ad',
    ratio: '4:5',
    channels: ['instagram', 'facebook'],
    dimensions: { w: 1080, h: 1350 },
    aspectClass: 'aspect-[4/5] max-w-[420px]'
  },
  {
    id: 'x_landscape',
    label: 'X (Twitter) & LinkedIn Card',
    sublabel: '16:9 Widescreen Social Ad',
    ratio: '16:9',
    channels: ['twitter', 'linkedin', 'youtube'],
    dimensions: { w: 1600, h: 900 },
    aspectClass: 'aspect-video max-w-[600px]'
  },
  {
    id: 'story_vertical',
    label: 'IG Story / Reel / TikTok Ad',
    sublabel: '9:16 Full-Screen Vertical Ad',
    ratio: '9:16',
    channels: ['instagram', 'tiktok', 'youtube'],
    dimensions: { w: 1080, h: 1920 },
    aspectClass: 'aspect-[9/16] max-w-[340px]'
  }
];

const VISUAL_STYLE_PRESETS = [
  {
    id: 'split_comparison',
    label: '⚡ Split-Screen ("Old vs. New")',
    promptSuffix:
      'high-impact split screen comparison: chaotic old manual method on the left side contrasted against sleek, glowing organized digital interface on the right side, studio commercial lighting, sharp focus'
  },
  {
    id: 'product_showcase',
    label: '📱 Sleek Product & UI Hero',
    promptSuffix:
      'sleek floating smartphone and desktop glass interface displaying live interactive analytics dashboard, dark obsidian studio background with subtle emerald and cyan rim lighting, ultra-detailed commercial product photography'
  },
  {
    id: 'data_matrix',
    label: '📊 Data & Probability Matrix',
    promptSuffix:
      'futuristic precision probability matrix, glowing combinatorial number grid, clean data visualization overlays, depth of field, high-conviction fintech/analytics aesthetic'
  },
  {
    id: 'editorial_lifestyle',
    label: '🎬 Editorial Lifestyle & Proof',
    promptSuffix:
      'authentic modern creator or founder using the product in a sunlit minimalist workspace, cinematic depth of field, warm natural highlights, Apple-grade commercial campaign photography'
  },
  {
    id: 'live_screenshot',
    label: '🌐 Live Brand Website Screenshot',
    promptSuffix: 'live_screenshot'
  }
];

export function AdImageStudio({ brand, onSavePost, onUpdateBrand, onOpenSocialHub }: AdImageStudioProps) {
  const isLottery = brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw');
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Platform & Aspect Ratio
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ig_square');
  const activePreset = PLATFORM_PRESETS.find((p) => p.id === selectedPresetId) || PLATFORM_PRESETS[0];

  // Visual Prompt & Style
  const [visualStyleId, setVisualStyleId] = useState<string>('split_comparison');
  const [imageModel, setImageModel] = useState<'gemini-nano-banana-2.1' | 'gemini-3-pro-image'>('gemini-nano-banana-2.1');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Official Brand Logo State
  const [logoUrl, setLogoUrl] = useState<string>(brand.logoUrl || '');
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>('top_right_pill');
  const [logoSize, setLogoSize] = useState<LogoSize>('md');
  const [blendLogoIntoAi, setBlendLogoIntoAi] = useState<boolean>(false);

  // Ad Overlay Copy State
  const [overlayLayout, setOverlayLayout] = useState<OverlayLayout>('bottom_card');
  const [badgeText, setBadgeText] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [subheadline, setSubheadline] = useState<string>('');
  const [ctaText, setCtaText] = useState<string>('');

  // Accompanying Social Post Copy & Hashtags
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Auto-Plug First Comment & Comment-to-DM Lead Trigger State
  const [firstCommentPlug, setFirstCommentPlug] = useState<string>('');
  const [dmTriggerKeyword, setDmTriggerKeyword] = useState<string>('');
  const [dmAutoReplyScript, setDmAutoReplyScript] = useState<string>('');
  const [copiedPlug, setCopiedPlug] = useState<boolean>(false);
  const [copiedDm, setCopiedDm] = useState<boolean>(false);

  // A/B Variants & AI Conversion Scorer State
  const [abVariants, setAbVariants] = useState<AdVariantOption[]>([]);
  const [activeVariantId, setActiveVariantId] = useState<string>('');
  const [isGeneratingAb, setIsGeneratingAb] = useState<boolean>(false);
  const [conversionScore, setConversionScore] = useState<AdConversionScore>({
    overall: 94,
    thumbStop: 95,
    contrast: 93,
    ctaClarity: 95,
    brandAlignment: 94,
    reasoning: 'High-contrast split hook with clear CTA pill and algorithm-safe first-comment link.'
  });

  // Competitor Ad Spy & Remix State
  const [showSpyDrawer, setShowSpyDrawer] = useState<boolean>(false);
  const [spyImagePreview, setSpyImagePreview] = useState<string>('');
  const [spyNotes, setSpyNotes] = useState<string>('');
  const [isRunningSpy, setIsRunningSpy] = useState<boolean>(false);
  const [spyAnalysis, setSpyAnalysis] = useState<CompetitorAdAnalysis | null>(null);
  const spyFileInputRef = useRef<HTMLInputElement | null>(null);

  // Generation & Gallery State
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isOptimizingCopy, setIsOptimizingCopy] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedAdAsset[]>([]);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [isExportingAllSizes, setIsExportingAllSizes] = useState<boolean>(false);
  const [justQueued, setJustQueued] = useState<boolean>(false);
  const [activePaidPlatform, setActivePaidPlatform] = useState<'meta' | 'google' | 'tiktok'>('meta');
  const [copiedPaidPack, setCopiedPaidPack] = useState<boolean>(false);

  // Direct Social Publishing State
  const [isPublishingNow, setIsPublishingNow] = useState<boolean>(false);
  const [publishedLinks, setPublishedLinks] = useState<Partial<Record<SocialChannel, string>> | null>(null);

  // API Key State
  const [googleApiKey, setGoogleApiKey] = useState<string>('');

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('brandcommand_google_cloud_tts_key') ||
        localStorage.getItem('brandcommand_gemini_key') ||
        localStorage.getItem('brandcommand_voice_api_key') ||
        localStorage.getItem('brandcommand_media_api_key') ||
        '';
      if (saved) setGoogleApiKey(saved);
    } catch {}
  }, []);

  // Initialize defaults when brand changes
  useEffect(() => {
    const isVarbona =
      brand.id === 'brand-varbona' ||
      brand.slug?.toLowerCase().includes('varbona') ||
      brand.name.toLowerCase().includes('varbona');

    const defaultImg =
      brand.websiteMobileScreenshotUrl ||
      brand.websiteScreenshotUrl ||
      (isVarbona
        ? 'https://iad.microlink.io/AaPvcvMN7HITD6LobOa-aF_FN7_7WC5X-34vXizM5VfTQxfnBhzwnaLmH9brUdizQIy0lqs7U_7m7iCVNiq-Lw.png'
        : isLottery
        ? 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png'
        : 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80');

    setActiveImageUrl(defaultImg);
    setLogoUrl(brand.logoUrl || (isLottery ? 'https://evidraw.com/brand/evidraw-app-icon.svg' : ''));
    setPublishedLinks(null);

    const cleanSiteUrl = brand.websiteUrl || `https://${brand.slug || 'varbona'}.com`;
    const defaultKw = brand.name.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'VIP';
    const tagList = (brand.commonHashtags || ['#Strategy', '#Growth', '#Innovation']).map((t) =>
      t.startsWith('#') ? t : `#${t}`
    );
    setHashtags(tagList);

    if (isVarbona) {
      setCustomPrompt(
        'Dynamic European football stadium under floodlights with glowing Pitch Lime #b9f566 player market share ticker, Lamine Yamal 125.00 CR (+4.2%) holographic card, and tactical 11-player pitch formation'
      );
      setBadgeText('⚽ FOOTBALL INSTINCT • MARKET INTELLIGENCE');
      setHeadline('Scout Players. Trade Shares. Build Your XI.');
      setSubheadline(
        'Buy player shares with play-money credits on Varbona — 1 share unlocks any player for your Fantasy XI.'
      );
      setCtaText('Join Free Beta at Varbona.com →');
      setCaption(
        `Know the game? Play the market. ⚽📈\n\nOn Varbona, you don't just pick a static fantasy team and wait:\n✅ 01 / SCOUT: Spot breakout wonderkids like Lamine Yamal before their share price spikes\n✅ 02 / BUILD: 1 player share unlocks fantasy eligibility for your owned XI\n✅ 03 / COMPETE: Free Play-Money Beta — your portfolio & progress carry over!\n\n👉 Build your football portfolio free at ${cleanSiteUrl}\n\n${tagList.slice(0, 5).join(' ')}`
      );
      const varbonaVariants: AdVariantOption[] = [
        {
          id: 'varbona-var-a',
          angleName: 'Option A: Old Fantasy vs. Varbona Market',
          angleBadge: '🔥 Comparison Hook',
          badgeText: '⚽ OLD FANTASY VS. VARBONA',
          headline: 'Traditional Fantasy Locks You Out. Trade Player Shares Live.',
          subheadline: 'Scout real football players with play-money credits — 1 share unlocks your owned Fantasy XI.',
          ctaText: 'Join Free Varbona Beta →',
          caption: `Why play static fantasy leagues when you can trade the live football market? ⚽📈\n\nOn Varbona, you scout breakout stars, trade player shares with play-money credits, and field the players you own.\n\n👉 Start free at ${cleanSiteUrl}`,
          visualPrompt: 'Split screen football stadium vs glowing Pitch Lime #b9f566 player stock market chart and tactical pitch XI',
          firstCommentPlug: `⚽ Join the free Varbona Play-Money Beta here (portfolio carries over!) 👉 ${cleanSiteUrl}`,
          dmTriggerKeyword: 'SCOUT',
          dmAutoReplyScript: `Hey! ⚽ Here is your direct invite to build your football portfolio on Varbona: ${cleanSiteUrl}`,
          bgImageUrl: 'https://iad.microlink.io/ACYs_juUhBXUJ9l5A9catynz8EitEHRayqN4IZOuUK_wLQUGKoh_hLCLE0dbzw-h3nC4xF1IVUWYbYSuXCj7Jg.png',
          conversionScore: {
            overall: 96,
            thumbStop: 97,
            contrast: 95,
            ctaClarity: 96,
            brandAlignment: 97,
            reasoning: 'Directly contrasts static FPL frustration against Varbona’s live player share trading.'
          }
        },
        {
          id: 'varbona-var-b',
          angleName: 'Option B: Wonderkid Scouting & Share Price Proof',
          angleBadge: '📈 Market Proof Angle',
          badgeText: '📈 LAMINE YAMAL • 125.00 CR (+4.2%)',
          headline: 'Back Your Football Instincts Before Matchday.',
          subheadline: 'Spot undervalued wonderkids early, watch their share value climb, and dominate the pitch.',
          ctaText: 'Scout Players on Varbona →',
          caption: `You called that breakout winger 3 weeks before the pundits did. Now prove it on the market. ⚽📊\n\nScout real players, trade play-money shares, and build your owned XI on Varbona.\n\n👉 ${cleanSiteUrl}`,
          visualPrompt: 'Holographic football player scouting card showing +4.2% share price sparkline over dark stadium turf',
          firstCommentPlug: `📊 Browse the live Varbona Player Market here 👉 ${cleanSiteUrl}/players`,
          dmTriggerKeyword: 'XI',
          dmAutoReplyScript: `Ready to scout? Here is the live Varbona Player Market: ${cleanSiteUrl}/players`,
          bgImageUrl: 'https://iad.microlink.io/bRkUPVWQyVPJJwGvlkZlpasMcW-r7YNaGlIJsdyB8_HHbz9fnRweBDa2ykbfWTqu5Xe8tf3VyeghO2ES-OcWPQ.png',
          conversionScore: {
            overall: 95,
            thumbStop: 96,
            contrast: 94,
            ctaClarity: 95,
            brandAlignment: 96,
            reasoning: 'Leads with concrete player market numbers (125.00 CR +4.2%) that immediately hook football fans.'
          }
        },
        {
          id: 'varbona-var-c',
          angleName: 'Option C: Free Play-Money Beta Offer',
          angleBadge: '⚡ Early Access Beta',
          badgeText: '⚡ FREE PLAY-MONEY BETA • PROGRESS CARRIES OVER',
          headline: 'Build Your First Football Portfolio Free.',
          subheadline: '01 Scout • 02 Build Your Owned XI • 03 Compete. Zero purchase required.',
          ctaText: 'Claim Your Free Squad →',
          caption: `The Varbona Play-Money Beta is live! ⚽🔥\n\n✅ Free to join (no deposit required)\n✅ Trade real football player shares\n✅ Your portfolio & progress carry over after beta!\n\n👉 Claim your display name & squad at ${cleanSiteUrl}`,
          visualPrompt: 'Sleek dark stadium tunnel with glowing neon lime football pitch formation and beta access badge',
          firstCommentPlug: `🚀 Lock in your Varbona Beta account (progress carries over!) 👉 ${cleanSiteUrl}`,
          dmTriggerKeyword: 'BETA',
          dmAutoReplyScript: `You're in! ⚡ Create your free Varbona Beta portfolio here: ${cleanSiteUrl}`,
          bgImageUrl: 'https://iad.microlink.io/AaPvcvMN7HITD6LobOa-aF_FN7_7WC5X-34vXizM5VfTQxfnBhzwnaLmH9brUdizQIy0lqs7U_7m7iCVNiq-Lw.png',
          conversionScore: {
            overall: 94,
            thumbStop: 95,
            contrast: 93,
            ctaClarity: 97,
            brandAlignment: 94,
            reasoning: 'Zero-risk "Free to join + Portfolio carries over after beta" offer maximizes sign-up conversion.'
          }
        }
      ];
      setAbVariants(varbonaVariants);
      setActiveVariantId(varbonaVariants[0].id);
    } else if (isLottery) {
      setCustomPrompt(
        'Split screen: crumpled paper lottery ticket on the left vs sleek, organized Evidraw portfolio grid and probability matrix on the right'
      );
      setBadgeText(`${brand.logoEmoji} ${brand.name.toUpperCase()} ANALYTICS`);
      setHeadline('Stop Picking Lottery Numbers Blindly.');
      setSubheadline('Eliminate number overlap and structure balanced combinatorial coverage in seconds.');
      setCtaText(`Try Free at ${brand.websiteUrl?.replace(/^https?:\/\//, '') || 'Evidraw.com'} →`);
      setCaption(
        `Most players pick clusters of birthdays or random quick-picks that overlap heavily.\n\nWith ${brand.name}, you can visualize combinatorial spread, eliminate duplicate risk, and verify every draw against historical frequencies.\n\n👉 Build your structured portfolio today at ${brand.websiteUrl || 'https://evidraw.com'}`
      );
      setAbVariants([]);
    } else if (brand.category === 'fintech') {
      setCustomPrompt(
        `Sleek dark-mode institutional trading terminal for ${brand.name} showing real-time options flow and volatility heatmaps`
      );
      setBadgeText(`${brand.logoEmoji} ${brand.name.toUpperCase()} TERMINAL`);
      setHeadline('Trade Institutional Flow With Precision.');
      setSubheadline(brand.tagline || 'Real-time market structure and volatility analytics.');
      setCtaText(`Launch ${brand.name} →`);
      setCaption(
        `Stop guessing direction without seeing institutional flow.\n\n${brand.name} gives you real-time depth, gamma exposure, and high-conviction execution alerts.\n\n🔗 Link in bio to access the terminal.`
      );
      setAbVariants([]);
    } else {
      const firstTopic = brand.suggestedTopics?.[0] || brand.tagline;
      setCustomPrompt(`High-converting commercial advertisement for ${brand.name}: ${firstTopic}`);
      setBadgeText(`${brand.logoEmoji} ${brand.name.toUpperCase()}`);
      setHeadline(brand.tagline || `Experience the Future of ${brand.name}`);
      setSubheadline(`Designed for ${brand.targetAudience || 'high-performing teams and creators'}.`);
      setCtaText(`Explore ${brand.name} →`);
      setCaption(
        `${brand.tagline}\n\nDiscover how ${brand.name} helps you get better results with zero friction.\n\n👉 Visit ${brand.websiteUrl || 'our link in bio'} to get started!`
      );
      setAbVariants([]);
    }

    setFirstCommentPlug(`⚡ Explore ${brand.name} directly here (no signup friction) 👉 ${cleanSiteUrl}`);
    setDmTriggerKeyword(defaultKw);
    setDmAutoReplyScript(
      `Hey! 👋 Thanks for commenting "${defaultKw}". Here is your direct access link to ${brand.name}: ${cleanSiteUrl} — let me know what you think!`
    );
    setSpyAnalysis(null);

    // Check if ModelStudio passed a specific Image Ad option to customize
    try {
      const pendingRaw = localStorage.getItem('brandcommand_pending_ad_option');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        localStorage.removeItem('brandcommand_pending_ad_option');
        if (pending && (!pending.brandId || pending.brandId === brand.id)) {
          if (pending.badgeText) setBadgeText(pending.badgeText);
          if (pending.headline) setHeadline(pending.headline);
          if (pending.subheadline) setSubheadline(pending.subheadline);
          if (pending.ctaText) setCtaText(pending.ctaText);
          if (pending.caption) setCaption(pending.caption);
          if (pending.bgImageUrl) setActiveImageUrl(pending.bgImageUrl);
          if (pending.presetId) setSelectedPresetId(pending.presetId);
          setStatusNotice(`✨ Loaded "${pending.angleName || pending.headline}" from Model Studio onto the canvas!`);
        }
      }
    } catch {}
  }, [brand, isLottery]);

  // Apply a selected A/B Variant or Spy Remix to the active studio canvas
  const applyAdVariant = (v: AdVariantOption) => {
    setActiveVariantId(v.id);
    setBadgeText(v.badgeText);
    setHeadline(v.headline);
    setSubheadline(v.subheadline);
    setCtaText(v.ctaText);
    setCaption(v.caption);
    if (v.visualPrompt) setCustomPrompt(v.visualPrompt);
    if (v.firstCommentPlug) setFirstCommentPlug(v.firstCommentPlug);
    if (v.dmTriggerKeyword) setDmTriggerKeyword(v.dmTriggerKeyword);
    if (v.dmAutoReplyScript) setDmAutoReplyScript(v.dmAutoReplyScript);
    if (v.conversionScore) setConversionScore(v.conversionScore);
    if (v.bgImageUrl) setActiveImageUrl(v.bgImageUrl);
  };

  // Generate 3 A/B Angle Variants + AI Conversion Scores
  const handleGenerateAbVariants = async () => {
    setIsGeneratingAb(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/ad-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ab_variants',
          topic: customPrompt || headline || brand.tagline,
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandVoice: brand.voicePersona,
          brandCategory: brand.category,
          brandWebsiteUrl: brand.websiteUrl,
          brandHashtags: brand.commonHashtags
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.variants) && data.variants.length > 0) {
        setAbVariants(data.variants);
        applyAdVariant(data.variants[0]);
        setStatusNotice(
          `🧪 Generated 3 A/B Ad Variants (Pain-Point, Authority, Urgency) + AI Conversion Scores for ${brand.name}!`
        );
      }
    } catch (err: any) {
      setStatusNotice(err?.message || 'Failed to generate A/B variants.');
    } finally {
      setIsGeneratingAb(false);
    }
  };

  // Handle Competitor Ad Screenshot Upload
  const handleSpyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSpyImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Competitor Ad Spy & Rebuild for Active Brand
  const handleRunCompetitorSpy = async () => {
    setIsRunningSpy(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/ad-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'competitor_spy',
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandVoice: brand.voicePersona,
          brandCategory: brand.category,
          brandWebsiteUrl: brand.websiteUrl,
          brandHashtags: brand.commonHashtags,
          competitorImageBase64: spyImagePreview,
          competitorNotes: spyNotes
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setSpyAnalysis(data.analysis);
        if (data.analysis.remixedVariant) {
          applyAdVariant(data.analysis.remixedVariant);
        }
        setStatusNotice(
          `🕵️ Reverse-engineered competitor ad and loaded a 100% original ${brand.name} remix onto your canvas!`
        );
      }
    } catch (err: any) {
      setStatusNotice(err?.message || 'Failed to analyze competitor ad.');
    } finally {
      setIsRunningSpy(false);
    }
  };

  // Handle Official Logo File Upload (PNG / SVG / JPG / WebP)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        if (onUpdateBrand) {
          onUpdateBrand({
            ...brand,
            logoUrl: reader.result
          });
        }
        setStatusNotice(`✅ Uploaded and saved official logo for ${brand.name}!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert current logo into raster PNG base64 if blendLogoIntoAi is enabled
  const getLogoBase64ForAi = async (): Promise<{ base64: string; mimeType: string } | null> => {
    if (!logoUrl || !blendLogoIntoAi) return null;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = logoUrl;
      });
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, 256, 256);
      const dataUrl = c.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      return base64 ? { base64, mimeType: 'image/png' } : null;
    } catch {
      return null;
    }
  };

  const handleGenerateAdImage = async () => {
    setIsGeneratingImage(true);
    setStatusNotice(null);

    try {
      // If user chose Live Brand Website Screenshot preset
      if (visualStyleId === 'live_screenshot') {
        const screenshotUrl =
          activePreset.ratio === '16:9'
            ? brand.websiteDesktopScreenshotUrl || brand.websiteScreenshotUrl || brand.websiteMobileScreenshotUrl
            : brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl;

        if (screenshotUrl) {
          setActiveImageUrl(screenshotUrl);
          setStatusNotice(`Loaded live ${activePreset.ratio} website screenshot for ${brand.name}!`);
          setIsGeneratingImage(false);
          return;
        }
      }

      const styleObj = VISUAL_STYLE_PRESETS.find((s) => s.id === visualStyleId) || VISUAL_STYLE_PRESETS[0];
      const fullPrompt = `${customPrompt || brand.tagline} for ${brand.name}. Style: ${styleObj.promptSuffix}. Important: Do not render garbled small text; focus on striking visual composition.`;

      const activeKey =
        googleApiKey ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            localStorage.getItem('brandcommand_media_api_key') ||
            ''
          : '');

      const logoRef = await getLogoBase64ForAi();

      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          type: 'image',
          prompt: fullPrompt,
          aspectRatio: activePreset.ratio,
          imageModel,
          apiKey: activeKey,
          brandCategory: brand.category,
          referenceImageBase64: logoRef?.base64,
          referenceImageMimeType: logoRef?.mimeType
        })
      });

      const data = await res.json();
      if (data.mediaUrl) {
        setActiveImageUrl(data.mediaUrl);
        const newAsset: GeneratedAdAsset = {
          id: `ad-${Date.now()}`,
          imageUrl: data.mediaUrl,
          prompt: customPrompt,
          aspectRatio: activePreset.ratio,
          model: data.model || imageModel,
          createdAt: new Date().toLocaleTimeString()
        };
        setGallery((prev) => [newAsset, ...prev.slice(0, 7)]);
        setStatusNotice(
          data.note ||
            `✨ Generated ${activePreset.ratio} ad visual with ${imageModel === 'gemini-3-pro-image' ? 'Nano Banana Pro' : 'Nano Banana 2.1'}!`
        );
      } else {
        setStatusNotice(data.message || 'Could not generate image. Check your API key.');
      }
    } catch (err: any) {
      setStatusNotice(err?.message || 'Error generating ad visual.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAutoWriteAdCopy = async () => {
    setIsOptimizingCopy(true);
    setStatusNotice(null);

    try {
      const activeKey =
        googleApiKey ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            ''
          : '');

      const res = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          format: 'single',
          currentData: {
            badgeText,
            headline,
            subheadline,
            ctaText,
            caption
          },
          instruction: `Write a high-converting social media ad for ${brand.name} focused on: "${customPrompt || brand.tagline}". Return optimizedData with fields: badgeText (max 4 words uppercase), headline (max 8 words punchy hook), subheadline (max 16 words value proposition), ctaText (max 5 words button text), and caption (engaging social post for Instagram and X).`,
          apiKey: activeKey
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (typeof d === 'object') {
          if (d.badgeText) setBadgeText(d.badgeText);
          if (d.headline) setHeadline(d.headline);
          if (d.subheadline) setSubheadline(d.subheadline);
          if (d.ctaText) setCtaText(d.ctaText);
          if (d.caption) setCaption(d.caption);
        } else if (typeof d === 'string') {
          setCaption(d);
        }
        const boostedTags = generateSmartHashtags(brand, customPrompt || headline, hashtags);
        setHashtags(boostedTags);
        setStatusNotice('✨ AI rewrote your ad headline, CTA overlay, and social caption!');
      }
    } catch {
      setStatusNotice('Updated ad copy using brand intelligence.');
    } finally {
      setIsOptimizingCopy(false);
    }
  };

  // Render composite ad (image + official logo + overlay typography + badge + CTA) for any given preset dimensions
  const renderCompositeAdDataUrl = async (targetPreset = activePreset): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const { w, h } = targetPreset.dimensions;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Draw Background Fill
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, w, h);

    // 2. Load & Draw Image (Cover fit)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = activeImageUrl;
    });

    if (img.width && img.height) {
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawW = h * imgRatio;
        offsetX = -(drawW - w) / 2;
      } else {
        drawH = w / imgRatio;
        offsetY = -(drawH - h) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    const pad = Math.round(w * 0.065);

    // 3. Draw Ad Overlays if enabled
    if (overlayLayout !== 'none') {
      const grad = ctx.createLinearGradient(0, h * 0.35, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.55, 'rgba(8,8,12,0.72)');
      grad.addColorStop(1, 'rgba(5,5,8,0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      let cursorY = h - pad;

      // CTA Button Pill at bottom
      if (ctaText) {
        ctx.font = `bold ${Math.round(w * 0.032)}px Inter, system-ui, sans-serif`;
        const textMetrics = ctx.measureText(ctaText);
        const btnW = Math.min(w - pad * 2, textMetrics.width + pad * 1.4);
        const btnH = Math.round(w * 0.082);
        const btnY = cursorY - btnH;

        ctx.fillStyle = brand.primaryColor || '#10b981';
        ctx.beginPath();
        ctx.roundRect(pad, btnY, btnW, btnH, 18);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(ctaText, pad + Math.round(pad * 0.65), btnY + btnH / 2);

        cursorY = btnY - Math.round(h * 0.035);
      }

      // Subheadline
      if (subheadline) {
        const subFontSize = Math.round(w * 0.031);
        ctx.font = `500 ${subFontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(240,240,245,0.9)';
        const words = subheadline.split(' ');
        const lines: string[] = [];
        let line = '';
        const maxW = w - pad * 2;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxW) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        for (let i = lines.length - 1; i >= 0; i--) {
          ctx.fillText(lines[i], pad, cursorY);
          cursorY -= Math.round(subFontSize * 1.38);
        }
        cursorY -= Math.round(h * 0.015);
      }

      // Headline
      if (headline) {
        const headFontSize = Math.round(w * 0.056);
        ctx.font = `800 ${headFontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#ffffff';
        const words = headline.split(' ');
        const lines: string[] = [];
        let line = '';
        const maxW = w - pad * 2;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxW) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        for (let i = lines.length - 1; i >= 0; i--) {
          ctx.fillText(lines[i], pad, cursorY);
          cursorY -= Math.round(headFontSize * 1.22);
        }
        cursorY -= Math.round(h * 0.02);
      }

      // Badge Pill
      if (badgeText) {
        const badgeFontSize = Math.round(w * 0.025);
        ctx.font = `bold ${badgeFontSize}px Inter, system-ui, sans-serif`;
        const bW = ctx.measureText(badgeText).width + 36;
        const bH = Math.round(badgeFontSize * 2.1);
        const bY = cursorY - bH;

        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath();
        ctx.roundRect(pad, bY, bW, bH, 999);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, pad + 18, bY + bH / 2);
      }
    }

    // 4. Draw Official Brand Logo Watermark if enabled
    if (logoUrl && logoPlacement !== 'hidden') {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = logoUrl;
      });

      if (logoImg.width && logoImg.height) {
        const scaleMap: Record<LogoSize, number> = { sm: 0.065, md: 0.088, lg: 0.115 };
        const iconPx = Math.round(w * scaleMap[logoSize]);

        if (logoPlacement === 'top_right_pill') {
          ctx.font = `bold ${Math.round(iconPx * 0.42)}px Inter, system-ui, sans-serif`;
          const nameW = ctx.measureText(brand.name).width;
          const pillW = iconPx + nameW + 44;
          const pillH = iconPx + 20;
          const pillX = w - pad - pillW;
          const pillY = pad;

          ctx.fillStyle = 'rgba(10, 14, 24, 0.78)';
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, 999);
          ctx.fill();

          ctx.drawImage(logoImg, pillX + 12, pillY + 10, iconPx, iconPx);
          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'middle';
          ctx.fillText(brand.name, pillX + 12 + iconPx + 12, pillY + pillH / 2);
        } else if (logoPlacement === 'top_left_mark') {
          ctx.drawImage(logoImg, pad, pad, iconPx * 1.15, iconPx * 1.15);
        } else if (logoPlacement === 'bottom_right_mark') {
          ctx.drawImage(logoImg, w - pad - iconPx * 1.15, h - pad - iconPx * 1.15, iconPx * 1.15, iconPx * 1.15);
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  // Export composite ad (image + official logo + overlay typography + badge + CTA) to downloadable PNG
  const handleDownloadCompositePng = async () => {
    if (!activeImageUrl) return;
    setIsExportingPng(true);

    try {
      const dataUrl = await renderCompositeAdDataUrl(activePreset);
      if (!dataUrl) throw new Error('Canvas unavailable');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${brand.slug}-${activePreset.id}-ad.png`;
      a.click();
      setStatusNotice(`Downloaded high-res ${activePreset.dimensions.w}×${activePreset.dimensions.h} PNG ad with official logo!`);
    } catch {
      const a = document.createElement('a');
      a.href = activeImageUrl;
      a.target = '_blank';
      a.download = `${brand.slug}-ad.png`;
      a.click();
    } finally {
      setIsExportingPng(false);
    }
  };

  // Export all 4 ad sizes (1:1 Square, 4:5 Portrait, 16:9 Landscape, 9:16 Vertical Story/Reel) in 1 click
  const handleExportAllFourSizesPack = async () => {
    if (!activeImageUrl || isExportingAllSizes) return;
    setIsExportingAllSizes(true);
    try {
      for (const preset of PLATFORM_PRESETS) {
        const dataUrl = await renderCompositeAdDataUrl(preset);
        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${brand.slug}-${preset.id}-${preset.dimensions.w}x${preset.dimensions.h}-ad.png`;
          a.click();
          await new Promise((r) => setTimeout(r, 260));
        }
      }
      setStatusNotice(
        `📦 Exported full 4-size Ad Pack (1:1 Square, 4:5 Portrait, 16:9 Card, 9:16 Vertical Story) for ${brand.name}!`
      );
    } catch {
      setStatusNotice('Exported available ad sizes.');
    } finally {
      setIsExportingAllSizes(false);
    }
  };

  // Apply 1-Click High-ROAS Ad Archetype Template
  const handleApplyAdArchetype = (archetype: 'problem_solution' | 'review_proof' | 'founder_note' | 'flash_offer') => {
    const cleanUrl = (brand.websiteUrl || `https://${brand.slug || 'evidraw'}.com`).replace(/^https?:\/\//, '');
    if (archetype === 'problem_solution') {
      setBadgeText(`❌ OLD WAY VS. ✅ ${brand.name.toUpperCase()}`);
      setHeadline(`Stop Wasting Hours Doing ${brand.category || 'It'} Manually.`);
      setSubheadline(`${brand.tagline || `Switch to ${brand.name} and automate your entire workflow in seconds.`}`);
      setCtaText(`Switch to ${brand.name} →`);
      setCaption(
        `Most people still rely on guesswork and messy spreadsheets.\n\n${brand.name} replaces manual trial-and-error with one verified workspace built for ${brand.targetAudience || 'results'}.\n\n👉 Try it now at ${cleanUrl}`
      );
    } else if (archetype === 'review_proof') {
      setBadgeText(`⭐⭐⭐⭐⭐ 4.9/5 VERIFIED USER REVIEW`);
      setHeadline(`"I Wish I Found ${brand.name} Six Months Ago."`);
      setSubheadline(`Trusted daily by ${brand.targetAudience || 'thousands of users'} for instant, verifiable results.`);
      setCtaText(`See Why at ${cleanUrl} →`);
      setCaption(
        `"Before ${brand.name}, I was flying blind. Within 10 minutes of setting it up, everything clicked."\n\nSee why ${brand.targetAudience || 'creators & pros'} are switching to ${brand.name} 👉 ${cleanUrl}`
      );
    } else if (archetype === 'founder_note') {
      setBadgeText(`📌 WHY WE BUILT ${brand.name.toUpperCase()}`);
      setHeadline(`We Built ${brand.name} Because Existing Tools Were Broken.`);
      setSubheadline(`Zero fluff. Just cold math, clean execution, and real transparency.`);
      setCtaText(`Explore ${brand.name} Free →`);
      setCaption(
        `We got tired of bloated, overpriced tools that overpromise and underdeliver.\n\nSo we built ${brand.name}: ${brand.tagline}\n\n👉 Test it yourself at ${cleanUrl}`
      );
    } else if (archetype === 'flash_offer') {
      setBadgeText(`⚡ LIMITED VIP ACCESS • ${brand.name.toUpperCase()}`);
      setHeadline(`Unlock Full ${brand.name} Access Today.`);
      setSubheadline(`Get instant access to ${brand.suggestedTopics?.[0] || brand.tagline} before the next window closes.`);
      setCtaText(`Claim Instant Access →`);
      setCaption(
        `⚡ Ready to upgrade your workflow?\n\nLock in your ${brand.name} access today and start running ${brand.suggestedTopics?.[0] || 'at 100% capacity'} in under 2 minutes.\n\n👉 ${cleanUrl}`
      );
    }
    setStatusNotice(`✨ Applied high-ROAS "${archetype.replace('_', ' ').toUpperCase()}" ad template for ${brand.name}!`);
  };

  const handleQueueAdPost = (status: 'draft' | 'scheduled') => {
    const fullContent = `${headline}\n\n${caption}\n\n${ctaText}`;

    onSavePost({
      brandId: brand.id,
      title: `[${activePreset.label}] ${headline || customPrompt.slice(0, 45)}`,
      content: fullContent,
      format: 'single',
      status,
      scheduledFor: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
      channels: activePreset.channels,
      firstCommentPlug,
      dmTriggerKeyword,
      dmAutoReplyScript,
      adConversionScore: conversionScore,
      tags: hashtags.map((t) => t.replace(/^#/, ''))
    });

    setJustQueued(true);
    setStatusNotice(`✅ Saved ${activePreset.label} Ad (with Auto-Plug & DM Trigger) to Publishing Queue!`);
    setTimeout(() => setJustQueued(false), 3000);
  };

  // 1-Click Direct Auto-Publish to Instagram, X, LinkedIn, Facebook
  const handlePublishAdNow = async () => {
    setIsPublishingNow(true);
    setPublishedLinks(null);
    setStatusNotice(null);

    const adPost = {
      id: `ad-post-${Date.now()}`,
      brandId: brand.id,
      title: `[${activePreset.label}] ${headline || brand.name}`,
      content: `${headline}\n\n${caption}\n\n${ctaText}`,
      imageUrl: activeImageUrl,
      format: 'single' as const,
      status: 'published' as const,
      scheduledFor: new Date().toISOString(),
      channels: activePreset.channels,
      firstCommentPlug,
      dmTriggerKeyword,
      dmAutoReplyScript,
      adConversionScore: conversionScore,
      tags: hashtags.map((t) => t.replace(/^#/, '')),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/publish-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          post: adPost,
          channels: activePreset.channels
        })
      });

      const data = await res.json();
      if (data.success) {
        setPublishedLinks(data.publishedUrls || {});
        onSavePost({
          ...adPost,
          status: 'published',
          publishedUrls: data.publishedUrls,
          publishedAt: data.publishedAt,
          publishLogs: data.publishLogs
        });
        setStatusNotice(`🚀 Dispatched ${activePreset.label} Ad to ${activePreset.channels.join(', ')}!`);
      } else {
        setStatusNotice(data.message || 'Failed to publish ad.');
      }
    } catch (err: any) {
      setStatusNotice(err?.message || 'Error publishing ad.');
    } finally {
      setIsPublishingNow(false);
    }
  };

  const handleCopyFullPost = () => {
    const tagStr = hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    navigator.clipboard.writeText(`${headline}\n\n${caption}\n\n${tagStr}`);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const logoSizeClass =
    logoSize === 'sm' ? 'w-6 h-6' : logoSize === 'lg' ? 'w-11 h-11' : 'w-8 h-8';

  return (
    <div className="space-y-6">
      {/* Top Studio Header Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm overflow-hidden"
                style={{ backgroundColor: brand.primaryColor || '#10b981' }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={brand.name} className="w-6 h-6 object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                    Ad &amp; Social Image Studio
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Nano Banana 2.1 AI
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAbVariants}
                    disabled={isGeneratingAb}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 transition-colors"
                  >
                    <FlaskConical className="w-3 h-3" />
                    <span>{isGeneratingAb ? 'Generating 3 Variants...' : '🧪 Generate 3 A/B Variants'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpyDrawer((prev) => !prev)}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-colors ${
                      showSpyDrawer
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900'
                        : 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>🕵️ Competitor Ad Spy &amp; Remix</span>
                  </button>
                  {onOpenSocialHub && (
                    <button
                      type="button"
                      onClick={onOpenSocialHub}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>🔌 Configure Auto-Posting (IG / X)</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Create high-converting ads with official logos for Instagram, X (Twitter), LinkedIn, Facebook &amp; Stories for{' '}
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{brand.name}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Platform & Aspect Ratio Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORM_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold truncate">{preset.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-neutral-900/15 dark:text-neutral-900'
                          : 'bg-neutral-200/70 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {preset.ratio}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'
                    }`}
                  >
                    {preset.sublabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status / Generation Notice */}
        {statusNotice && (
          <div className="p-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              {statusNotice}
            </span>
            <button onClick={() => setStatusNotice(null)} className="text-[11px] opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* 🕵️ COMPETITOR AD SPY & REMIX STUDIO DRAWER */}
        {showSpyDrawer && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 text-white border border-indigo-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2 text-indigo-300">
                  <Eye className="w-4 h-4 text-amber-400" />
                  🕵️ Competitor Ad Spy &amp; &ldquo;Clone-for-My-Brand&rdquo; Remix Engine
                </h3>
                <p className="text-xs text-neutral-300">
                  Upload any screenshot of a high-performing competitor ad or viral X/IG post. Gemini Vision dissects its hook formula &amp; visual hierarchy, then rebuilds a 100% original version for{' '}
                  <strong className="text-white">{brand.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSpyDrawer(false)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-white/10"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5 space-y-2.5">
                <input
                  ref={spyFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSpyFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => spyFileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-indigo-400/40 hover:border-indigo-400 rounded-2xl p-4 text-center bg-black/30 transition-all"
                >
                  {spyImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={spyImagePreview}
                        alt="Competitor Ad Screenshot"
                        className="max-h-36 mx-auto rounded-xl object-contain border border-white/15"
                      />
                      <span className="text-[11px] text-indigo-300 font-bold block">
                        Click to replace competitor screenshot
                      </span>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1.5">
                      <Upload className="w-6 h-6 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-white">
                        Upload Competitor Ad Screenshot (PNG / JPG)
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Or click below to run a competitive remix from notes alone
                      </p>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={spyNotes}
                  onChange={(e) => setSpyNotes(e.target.value)}
                  placeholder="Optional: What do you like about this competitor ad? (e.g. 'bold comparison hook')"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-neutral-400"
                />

                <button
                  type="button"
                  onClick={handleRunCompetitorSpy}
                  disabled={isRunningSpy}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-neutral-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isRunningSpy ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reverse-Engineering Competitor Ad...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>🕵️ Analyze &amp; Rebuild for {brand.name}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-7">
                {spyAnalysis ? (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase tracking-wider text-amber-400 text-[11px]">
                        🔍 Competitor Ad X-Ray Breakdown
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Loaded into Canvas ✓
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">Hook Formula</span>
                        <p className="text-neutral-200 mt-0.5 leading-snug">{spyAnalysis.competitorHookFormula}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-purple-300 block">Psychological Trigger</span>
                        <p className="text-neutral-200 mt-0.5 leading-snug">{spyAnalysis.psychologicalTrigger}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-blue-300 block">Visual Hierarchy</span>
                        <p className="text-neutral-200 mt-0.5 leading-snug">{spyAnalysis.visualHierarchyBreakdown}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30">
                        <span className="text-[10px] font-bold uppercase text-emerald-300 block">
                          How {brand.name} Wins
                        </span>
                        <p className="text-emerald-100 mt-0.5 leading-snug">{spyAnalysis.competitorWeaknessToExploit}</p>
                      </div>
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateAdImage}
                        disabled={isGeneratingImage}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🎨 Render Remixed AI Visual with Nano Banana 2.1</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] rounded-2xl bg-black/25 border border-white/10 flex flex-col items-center justify-center p-6 text-center text-neutral-400 text-xs">
                    <p className="font-semibold text-neutral-200">
                      Upload any Meta Ad Library screenshot, viral tweet, or Instagram ad
                    </p>
                    <p className="text-[11px] mt-1 max-w-md">
                      We extract the underlying psychological hook and visual layout, then craft a higher-converting version using{' '}
                      {brand.name}&rsquo;s official logo, brand voice, and DM lead trigger.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Published Links Banner */}
        {publishedLinks && Object.keys(publishedLinks).length > 0 && (
          <div className="p-3.5 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Dispatched to Social Channels:
              </span>
              {onOpenSocialHub && (
                <button
                  type="button"
                  onClick={onOpenSocialHub}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline"
                >
                  Switch Sandbox ↔ Live API Tokens
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(publishedLinks).map(([ch, url]) => (
                <a
                  key={ch}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 hover:opacity-80"
                >
                  <span className="uppercase">{ch}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Main Two-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* LEFT COLUMN (7 cols): Live Interactive Ad Canvas & Visual Gallery */}
          <div className="lg:col-span-7 flex flex-col items-center justify-start space-y-4 bg-neutral-100/80 dark:bg-neutral-950/90 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6">
            {/* Top Canvas Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-bold text-neutral-800 dark:text-neutral-200">
                  📐 {activePreset.label} ({activePreset.ratio} • {activePreset.dimensions.w}×{activePreset.dimensions.h})
                </span>
              </div>

              {/* Overlay Layout Switcher */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setOverlayLayout('bottom_card')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    overlayLayout === 'bottom_card'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Bottom Ad Card
                </button>
                <button
                  type="button"
                  onClick={() => setOverlayLayout('split_banner')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    overlayLayout === 'split_banner'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Top &amp; Bottom
                </button>
                <button
                  type="button"
                  onClick={() => setOverlayLayout('center_glass')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    overlayLayout === 'center_glass'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Center Glass
                </button>
                <button
                  type="button"
                  onClick={() => setOverlayLayout('none')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    overlayLayout === 'none'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Clean Image
                </button>
              </div>
            </div>

            {/* THE LIVE AD CANVAS */}
            <div
              className={`relative w-full ${activePreset.aspectClass} rounded-2xl overflow-hidden shadow-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-900 transition-all duration-300 group`}
            >
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={headline || brand.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                  Click &ldquo;Generate AI Ad Visual&rdquo; to render
                </div>
              )}

              {/* Loading Shimmer Overlay during AI Generation */}
              {isGeneratingImage && (
                <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                  <p className="text-sm font-extrabold text-white">
                    Rendering {activePreset.ratio} Ad Visual with Google{' '}
                    {imageModel === 'gemini-3-pro-image' ? 'Nano Banana Pro' : 'Nano Banana 2.1'}...
                  </p>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xs">{customPrompt}</p>
                </div>
              )}

              {/* OFFICIAL BRAND LOGO LAYER ON CANVAS */}
              {logoUrl && logoPlacement !== 'hidden' && (
                <>
                  {logoPlacement === 'top_right_pill' && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-lg">
                      <img src={logoUrl} alt={`${brand.name} Official Logo`} className={`${logoSizeClass} object-contain rounded-md`} />
                      <span className="text-xs font-extrabold text-white tracking-tight pr-1">{brand.name}</span>
                    </div>
                  )}
                  {logoPlacement === 'top_left_mark' && (
                    <div className="absolute top-4 left-4 z-20 p-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/20 shadow-lg">
                      <img src={logoUrl} alt={`${brand.name} Official Logo`} className={`${logoSizeClass} object-contain`} />
                    </div>
                  )}
                  {logoPlacement === 'bottom_right_mark' && (
                    <div className="absolute bottom-4 right-4 z-20 p-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 shadow-lg">
                      <img src={logoUrl} alt={`${brand.name} Official Logo`} className={`${logoSizeClass} object-contain`} />
                    </div>
                  )}
                </>
              )}

              {/* OVERLAY LAYOUT 1: Bottom Gradient Ad Card */}
              {overlayLayout === 'bottom_card' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-between p-5 sm:p-6 text-white">
                  {/* Top Badge Pill */}
                  <div className="flex items-center justify-between">
                    {badgeText && logoPlacement !== 'top_left_mark' && (
                      <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md">
                        {badgeText}
                      </span>
                    )}
                  </div>

                  {/* Bottom Headline, Subheadline & CTA */}
                  <div className="space-y-2.5">
                    {headline && (
                      <h3 className="text-lg sm:text-2xl font-black leading-tight tracking-tight text-white drop-shadow-md">
                        {headline}
                      </h3>
                    )}
                    {subheadline && (
                      <p className="text-xs sm:text-sm text-neutral-200 leading-snug line-clamp-3 drop-shadow">
                        {subheadline}
                      </p>
                    )}
                    {ctaText && (
                      <div className="pt-1">
                        <span
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-lg"
                          style={{ backgroundColor: brand.primaryColor || '#10b981' }}
                        >
                          {ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OVERLAY LAYOUT 2: Top & Bottom Split Banner */}
              {overlayLayout === 'split_banner' && (
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="bg-gradient-to-b from-black/90 via-black/60 to-transparent p-5 text-white space-y-1">
                    {badgeText && (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-white"
                        style={{ backgroundColor: brand.primaryColor || '#10b981' }}
                      >
                        {badgeText}
                      </span>
                    )}
                    {headline && (
                      <h3 className="text-lg sm:text-xl font-black leading-tight text-white drop-shadow">
                        {headline}
                      </h3>
                    )}
                  </div>

                  <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 text-white flex items-center justify-between gap-3">
                    {subheadline && (
                      <p className="text-xs text-neutral-200 line-clamp-2 flex-1">{subheadline}</p>
                    )}
                    {ctaText && (
                      <span
                        className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg"
                        style={{ backgroundColor: brand.primaryColor || '#10b981' }}
                      >
                        {ctaText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* OVERLAY LAYOUT 3: Center Glass Card */}
              {overlayLayout === 'center_glass' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6">
                  <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center text-white space-y-3 max-w-sm shadow-2xl">
                    {logoUrl && (
                      <img src={logoUrl} alt={brand.name} className="w-10 h-10 object-contain mx-auto rounded-lg" />
                    )}
                    {badgeText && (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-white">
                        {badgeText}
                      </span>
                    )}
                    {headline && (
                      <h3 className="text-lg sm:text-xl font-black leading-tight text-white">{headline}</h3>
                    )}
                    {subheadline && <p className="text-xs text-neutral-200 leading-relaxed">{subheadline}</p>}
                    {ctaText && (
                      <div className="pt-1">
                        <span
                          className="inline-block px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-md"
                          style={{ backgroundColor: brand.primaryColor || '#10b981' }}
                        >
                          {ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar Under Canvas: Download PNG, Publish Now, Save to Queue */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCompositePng}
                  disabled={isExportingPng}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPng ? 'Exporting PNG...' : `Download ${activePreset.ratio} Ad PNG`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAllFourSizesPack}
                  disabled={isExportingAllSizes}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Download all 4 ad ratios (1:1 Square, 4:5 Portrait, 16:9 Landscape, 9:16 Story/Reel) in 1 click"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingAllSizes ? 'Exporting 4 Sizes...' : '📦 Export All 4 Sizes'}</span>
                </button>

                {brand.websiteMobileScreenshotUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageUrl(
                        activePreset.ratio === '16:9'
                          ? brand.websiteDesktopScreenshotUrl || brand.websiteMobileScreenshotUrl!
                          : brand.websiteMobileScreenshotUrl!
                      );
                      setStatusNotice(`Switched canvas background to ${brand.name}'s live website screenshot!`);
                    }}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Use Live App Screenshot</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQueueAdPost('scheduled')}
                  className="px-3.5 py-2 rounded-xl border border-emerald-600/40 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                >
                  {justQueued ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Queued!</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule in Queue</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePublishAdNow}
                  disabled={isPublishingNow}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isPublishingNow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>🚀 Publish Now ({activePreset.channels.slice(0, 2).join(' + ')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 🧪 A/B AD VARIANT SWITCHER & AI CONVERSION SCORER (0-100) */}
            <div className="w-full p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    AI Ad Conversion Score &amp; A/B Angles
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {conversionScore.overall}/100 Predicted ROI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAbVariants}
                  disabled={isGeneratingAb}
                  className="px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-extrabold flex items-center gap-1.5 transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{isGeneratingAb ? 'Generating 3 Angles...' : '🧪 Generate 3 A/B Variants'}</span>
                </button>
              </div>

              {/* 4 Sub-Score Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  { label: 'Thumb-Stop Power', val: conversionScore.thumbStop },
                  { label: 'Text Contrast', val: conversionScore.contrast },
                  { label: 'CTA Clarity', val: conversionScore.ctaClarity },
                  { label: 'Brand Alignment', val: conversionScore.brandAlignment }
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-300">
                      <span className="truncate">{metric.label}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{metric.val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${metric.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                💡 {conversionScore.reasoning}
              </p>

              {/* 3 A/B Variant Cards if Generated */}
              {abVariants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {abVariants.map((v) => {
                    const isSelected = activeVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => applyAdVariant(v)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-purple-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                              {v.angleBadge}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              {v.conversionScore?.overall || 92}/100
                            </span>
                          </div>
                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1 line-clamp-2">
                            {v.headline}
                          </p>
                        </div>
                        <span className="text-[10px] text-neutral-500 mt-1.5 block">
                          CTA: &ldquo;{v.ctaText}&rdquo;
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Generated Ad Variations Strip */}
            {gallery.length > 0 && (
              <div className="w-full pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Recent Generated Variations ({gallery.length})
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {gallery.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveImageUrl(item.imageUrl)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageUrl === item.imageUrl
                          ? 'border-purple-600 scale-105 shadow-md'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-mono text-center py-0.5">
                        {item.aspectRatio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 cols): AI Visual Generator + Official Logo + Ad Copy */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step 1: AI Visual Prompt & Style */}
            <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  1. AI Visual Generator ({activePreset.ratio})
                </h3>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value as any)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="gemini-nano-banana-2.1">🍌 Nano Banana 2.1 (Fast HD)</option>
                  <option value="gemini-3-pro-image">✨ Nano Banana Pro (Ultra 4K)</option>
                </select>
              </div>

              {/* Visual Style Template Pills */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  Visual Direction Preset:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {VISUAL_STYLE_PRESETS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setVisualStyleId(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between ${
                        visualStyleId === st.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-purple-400'
                      }`}
                    >
                      <span>{st.label}</span>
                      {visualStyleId === st.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Visual Prompt Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  Describe the visual scene for this ad:
                </label>
                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={`e.g. Split screen: crumpled paper ticket on the left vs sleek ${brand.name} portfolio grid on the right...`}
                  className="w-full px-3 py-2 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAdImage}
                disabled={isGeneratingImage}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating {activePreset.ratio} Visual...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>🎨 Generate {activePreset.ratio} Ad Image Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Official Brand Logo & Watermark Controls */}
            <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  2. Official Brand Logo &amp; Watermark
                </h3>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Logo (PNG/SVG)</span>
                </button>
              </div>

              {/* Current Logo Preview + Placement & Size */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="w-11 h-11 rounded-xl bg-neutral-900 flex items-center justify-center p-1.5 shrink-0 border border-neutral-700">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-lg">{brand.logoEmoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {brand.name} Official Logo
                  </p>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      if (onUpdateBrand) onUpdateBrand({ ...brand, logoUrl: e.target.value });
                    }}
                    placeholder="Paste official logo URL (.svg or .png)..."
                    className="w-full mt-1 px-2 py-1 text-[11px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Logo Position</label>
                  <select
                    value={logoPlacement}
                    onChange={(e) => setLogoPlacement(e.target.value as LogoPlacement)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  >
                    <option value="top_right_pill">Top-Right Glass Pill</option>
                    <option value="top_left_mark">Top-Left Corner Mark</option>
                    <option value="bottom_right_mark">Bottom-Right Watermark</option>
                    <option value="hidden">Hidden (No Logo Overlay)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Logo Size</label>
                  <select
                    value={logoSize}
                    onChange={(e) => setLogoSize(e.target.value as LogoSize)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  >
                    <option value="sm">Small (Subtle)</option>
                    <option value="md">Medium (Standard)</option>
                    <option value="lg">Large (Prominent)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={blendLogoIntoAi}
                  onChange={(e) => setBlendLogoIntoAi(e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] font-medium">
                  🧬 Also pass official logo as AI image reference to Nano Banana 2.1
                </span>
              </label>
            </div>

            {/* Step 3: On-Image Ad Overlay & Copy Editor */}
            <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Type className="w-4 h-4" />
                  3. Ad Headline &amp; CTA Overlay
                </h3>
                <button
                  type="button"
                  onClick={handleAutoWriteAdCopy}
                  disabled={isOptimizingCopy}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                >
                  {isOptimizingCopy ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Writing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      <span>✨ AI Auto-Write Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* 1-Click High-ROAS Ad Archetype Templates */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">
                  1-Click High-ROAS Ad Archetype:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'problem_solution' as const, label: '🔥 Old vs. New Way' },
                    { id: 'review_proof' as const, label: '⭐ 5-Star Review Proof' },
                    { id: 'founder_note' as const, label: '📌 Founder Note' },
                    { id: 'flash_offer' as const, label: '⚡ VIP / Flash Offer' }
                  ].map((arch) => (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => handleApplyAdArchetype(arch.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-emerald-500 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 text-left transition-all"
                    >
                      {arch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Top Callout Badge</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Main Ad Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Supporting Subheadline</label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              {/* Accompanying Social Post Caption */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Instagram / X / LinkedIn Post Caption
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyFullPost}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedCaption ? (
                      <>
                        <Check className="w-3 h-3" /> Copied Caption &amp; Tags!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Caption + Tags
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            {/* Step 4: AI Auto-Plug (First Comment) & Comment-to-DM Lead Trigger */}
            <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  4. Auto-Plug &amp; Comment-to-DM Lead Engine
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  +40% Reach Boost
                </span>
              </div>

              {/* First Comment Auto-Plug */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Auto-First-Comment Link Plug (Avoids Main-Post Algorithm Penalty)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(firstCommentPlug);
                      setCopiedPlug(true);
                      setTimeout(() => setCopiedPlug(false), 2000);
                    }}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedPlug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPlug ? 'Copied!' : 'Copy Plug'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={firstCommentPlug}
                  onChange={(e) => setFirstCommentPlug(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              {/* Comment Keyword -> Auto-DM Script */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Trigger Keyword</label>
                  <input
                    type="text"
                    value={dmTriggerKeyword}
                    onChange={(e) => setDmTriggerKeyword(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-mono font-extrabold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 uppercase"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-neutral-400">
                      Auto-DM Reply Script
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dmAutoReplyScript);
                        setCopiedDm(true);
                        setTimeout(() => setCopiedDm(false), 2000);
                      }}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                    >
                      {copiedDm ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDm ? 'Copied DM!' : 'Copy DM'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={dmAutoReplyScript}
                    onChange={(e) => setDmAutoReplyScript(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Paid Ad Manager Spec & UTM Campaign Builder (Meta Ads, Google PMax, TikTok Ads) */}
            <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  5. Paid Ad Manager Copy &amp; UTM Pack
                </h3>
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[10px] font-extrabold">
                  {(
                    [
                      { id: 'meta', label: 'Meta Ads' },
                      { id: 'google', label: 'Google PMax' },
                      { id: 'tiktok', label: 'TikTok Ads' }
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePaidPlatform(p.id)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        activePaidPlatform === p.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const baseSite = (brand.websiteUrl || `https://${brand.slug || 'evidraw'}.com`).replace(/\/$/, '');
                const utmUrl = `${baseSite}/?utm_source=${activePaidPlatform}&utm_medium=paid_social&utm_campaign=${encodeURIComponent(
                  (brand.slug || 'brand') + '_' + activePreset.id
                )}`;
                const shortHeadline40 = (headline || brand.tagline || brand.name).slice(0, 40);
                const shortHeadline30 = (headline || brand.name).slice(0, 30);
                const shortDesc30 = (ctaText || `Try ${brand.name} today`).slice(0, 30);
                const shortDesc90 = (subheadline || brand.tagline || caption).slice(0, 90);

                const specString =
                  activePaidPlatform === 'meta'
                    ? `META ADS MANAGER SPEC (${brand.name})\nPrimary Text: ${caption}\nHeadline (40c): ${shortHeadline40}\nDescription (30c): ${shortDesc30}\nCTA Button: Learn More / Sign Up\nDestination URL: ${utmUrl}`
                    : activePaidPlatform === 'google'
                    ? `GOOGLE ADS / PERFORMANCE MAX SPEC (${brand.name})\nHeadline 1 (30c): ${shortHeadline30}\nHeadline 2 (30c): ${brand.name} Official\nHeadline 3 (30c): ${(badgeText || 'Try Free Today').slice(0, 30)}\nDescription 1 (90c): ${shortDesc90}\nDescription 2 (90c): ${(caption || '').replace(/\n+/g, ' ').slice(0, 90)}\nFinal URL: ${utmUrl}`
                    : `TIKTOK SPARK / FEED AD SPEC (${brand.name})\nAd Display Text (100c): ${(headline + ' — ' + subheadline).slice(0, 100)}\nCall To Action: Sign Up / Learn More\nLanding Page URL: ${utmUrl}`;

                return (
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5 font-mono text-[10.5px]">
                      {activePaidPlatform === 'meta' && (
                        <>
                          <div>
                            <span className="text-neutral-400 font-sans font-bold">Headline (≤40 chars): </span>
                            <span className="text-neutral-900 dark:text-white font-bold">{shortHeadline40}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 font-sans font-bold">Link Description (≤30c): </span>
                            <span className="text-neutral-700 dark:text-neutral-300">{shortDesc30}</span>
                          </div>
                        </>
                      )}
                      {activePaidPlatform === 'google' && (
                        <>
                          <div>
                            <span className="text-neutral-400 font-sans font-bold">RSA Headline (≤30c): </span>
                            <span className="text-neutral-900 dark:text-white font-bold">{shortHeadline30}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 font-sans font-bold">RSA Description (≤90c): </span>
                            <span className="text-neutral-700 dark:text-neutral-300">{shortDesc90}</span>
                          </div>
                        </>
                      )}
                      {activePaidPlatform === 'tiktok' && (
                        <div>
                          <span className="text-neutral-400 font-sans font-bold">TikTok Hook Copy (≤100c): </span>
                          <span className="text-neutral-900 dark:text-white font-bold">
                            {(headline + ' — ' + subheadline).slice(0, 100)}
                          </span>
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-neutral-400 font-sans font-bold">UTM Tracking Link: </span>
                        <span className="text-indigo-600 dark:text-indigo-400">{utmUrl}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(specString);
                        setCopiedPaidPack(true);
                        setTimeout(() => setCopiedPaidPack(false), 2000);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copiedPaidPack ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {copiedPaidPack
                          ? 'Copied Complete Ad Manager Spec & UTM Link!'
                          : `Copy ${activePaidPlatform.toUpperCase()} Ad Manager Spec + UTM Link`}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
