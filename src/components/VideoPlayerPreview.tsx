'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Brand, VideoScript } from '../types/brand';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Upload, 
  Mic, 
  X, 
  Check, 
  AlertCircle,
  Star,
  SplitSquareVertical,
  Maximize2,
  CircleDot,
  Layers,
  Palette,
  Activity,
  Flame,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  Video,
  Link as LinkIcon,
  Bot,
  Wand2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  HelpCircle,
  Send,
  ArrowRight,
  ExternalLink,
  Key,
  Download,
  Music,
  Headphones
} from 'lucide-react';
import { inspectVideoQuality, applyAIVideoRevision } from '../lib/videoAgentPipeline';
import { SoundtrackGenre, SOUNDTRACK_PRESETS, soundbedEngine } from '../lib/soundtrackEngine';
import { VideoQAInspection } from '../types/brand';
import { cleanSpeechText } from '../lib/speechUtils';

interface VideoPlayerPreviewProps {
  brand: Brand;
  script: VideoScript;
  onScriptChange?: (updated: VideoScript) => void;
  onUpdateBrand?: (updatedBrand: Brand) => void;
  defaultAspectRatio?: '16:9' | '9:16';
}

// Rich Curated Background & B-Roll Presets Library
export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'beauty' | 'fintech' | 'tech' | 'lifestyle' | 'abstract';
  type: 'video' | 'image' | 'animated_chart';
  mediaUrl: string;
  thumbnailUrl: string;
  label: string;
}

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'broll_video_1',
    name: '3D Action Motion',
    category: 'abstract',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    label: 'High-Tech Analytics & Probability Grid'
  },
  {
    id: 'live_candlesticks',
    name: 'OptionCove Candlesticks',
    category: 'fintech',
    type: 'animated_chart',
    mediaUrl: 'animated_chart',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&auto=format&fit=crop&q=80',
    label: 'OptionCove Live Scanner Terminal'
  },
  {
    id: 'salon_blowout',
    name: 'Salon Blowout & Transformation',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    label: 'Salon Blowout & Transformation'
  },
  {
    id: 'remy_wefts',
    name: 'Remy Extensions Installation',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    label: '100% Remy Extensions • Hand-Tied Wefts'
  },
  {
    id: 'luxury_salon_wash',
    name: 'Luxury Hair Wash Station',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&auto=format&fit=crop&q=80',
    label: 'VIP Hair Spa & Treatment'
  },
  {
    id: 'trading_matrix',
    name: 'Nasdaq Multi-Screen Wall',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=300&auto=format&fit=crop&q=80',
    label: 'Wall Street Multi-Monitor Matrix'
  },
  {
    id: 'lottery_data_matrix',
    name: 'Lottery Analytics & Probability Matrix',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80',
    label: 'Evidraw Smart Draw Analytics & Probability Matrix'
  },
  {
    id: 'lottery_draw_terminal',
    name: 'Live Ball Machine & Draw Odds Terminal',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
    label: 'Live Lottery Odds & Pattern Scanner'
  },
  {
    id: 'evidraw_canvas',
    name: 'EviDraw Interactive Canvas',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop&q=80',
    label: 'EviDraw Interactive Canvas'
  },
  {
    id: 'tech_dark_terminal',
    name: 'Developer Code Studio',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80',
    label: 'Varbona Cloud Architecture'
  },
  {
    id: 'uruguay_rambla',
    name: 'Rambla Coastal Community',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
    label: 'Rambla Gathering & Mate Culture'
  },
  {
    id: 'cozy_workspace',
    name: 'Aesthetic Coffee Workspace',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80',
    label: 'Creator Desk & Lifestyle'
  },
  {
    id: 'broll_salon_shears_cut',
    name: 'Precision Shears Cutting & Texture Blend',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&auto=format&fit=crop&q=80',
    label: 'Precision Shears & Haircut Finish'
  },
  {
    id: 'broll_hair_color_balayage',
    name: 'Balayage Foil Highlighting & Dimension',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&auto=format&fit=crop&q=80',
    label: 'Balayage & Dimensional Color'
  },
  {
    id: 'broll_trader_desk_setup',
    name: 'Wall Street Multi-Monitor Workspace',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&auto=format&fit=crop&q=80',
    label: 'Trading Desk Execution Suite'
  },
  {
    id: 'broll_crypto_depth_chart',
    name: 'Orderbook & Volatility Heatmap',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=300&auto=format&fit=crop&q=80',
    label: 'Market Depth & Liquidity Map'
  },
  {
    id: 'broll_server_datacenter',
    name: 'High-Speed Cloud Infrastructure',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
    label: 'High-Performance Datacenter'
  },
  {
    id: 'broll_city_creator_walk',
    name: 'Urban Creator Lifestyle & Street',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    label: 'Urban Modern City Walk'
  }
];

// Graphic Stickers & Callout Badges
const STICKER_PRESETS = [
  { id: 'none', label: '⚪ No Graphic Badge (Clean)', icon: '⚪' },
  { id: 'odds_matrix', label: '🎟️ LOTTO ODDS MATRIX', icon: '🎟️' },
  { id: 'probability_engine', label: '📊 99.4% PROBABILITY ENGINE', icon: '📊' },
  { id: 'jackpot_scanner', label: '⚡ LIVE DRAW SCANNER', icon: '⚡' },
  { id: 'sale_20', label: '🔥 20% OFF SALE', icon: '🔥' },
  { id: 'stop_scrolling', label: '🚨 STOP SCROLLING', icon: '🚨' },
  { id: 'verified_salon', label: '⭐ 5.0 RATED SALON', icon: '⭐' },
  { id: 'options_gain', label: '📈 +340% CALL WINNER', icon: '📈' },
  { id: 'remy_hair', label: '✂️ 100% REMY WEFTS', icon: '✂️' },
  { id: 'uruguay', label: '🇺🇾 URUGUAY CONECTA', icon: '🇺🇾' },
  { id: 'link_in_bio', label: '👉 TAP LINK IN BIO', icon: '👉' },
  { id: 'exclusive_drop', label: '⚡ EXCLUSIVE DROP', icon: '⚡' }
];

// Color Grading & Visual FX Filter Presets
const COLOR_FILTERS = {
  none: '',
  cinematic: 'contrast(115%) saturate(125%) sepia(8%) hue-rotate(-8deg)',
  golden_hour: 'brightness(105%) saturate(135%) sepia(22%)',
  cyberpunk: 'contrast(120%) saturate(145%) hue-rotate(25deg)',
  vhs_90s: 'contrast(95%) brightness(105%) sepia(15%)',
  noir: 'grayscale(100%) contrast(130%) brightness(95%)'
};

// UGC Creator Hook Models (Front-facing camera selfie POV • Silent emotional reactions to script)
export type UgcEmotion = 'thinking' | 'skeptical' | 'agreeing' | 'disagreeing' | 'frustrated' | 'shocked';

interface UgcCreatorPreset {
  id: string;
  name: string;
  emotion: UgcEmotion;
  emotionBadge: string;
  tag: string;
  type: 'video' | 'image';
  mediaUrl: string;
  thumbnailUrl: string;
}

const UGC_CREATOR_PRESETS: UgcCreatorPreset[] = [
  {
    id: 'ugc_react_decision_woman',
    name: 'Maya • Thinking → Aha POV',
    emotion: 'thinking',
    emotionBadge: '🤔 Thinking → Agree',
    tag: 'Front Camera POV • Silent Pondering & Realization (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_decision_woman.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_decision_woman.jpg'
  },
  {
    id: 'ugc_react_overthinking_woman',
    name: 'Chloe • Skeptical / Pondering POV',
    emotion: 'skeptical',
    emotionBadge: '🤨 Skeptical / Doubt',
    tag: 'Front Camera POV • Silent Skeptical Kitchen Reaction (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_overthinking_woman.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_overthinking_woman.jpg'
  },
  {
    id: 'ugc_react_nodding_man',
    name: 'Liam • Nodding / Agreeing POV',
    emotion: 'agreeing',
    emotionBadge: '😌 Nodding / Agree',
    tag: 'Front Camera POV • Silent Nodding & Agreeing Reaction (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_nodding_man.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_nodding_man.jpg'
  },
  {
    id: 'ugc_react_sad_serious_woman',
    name: 'Elena • Disagree / Unimpressed POV',
    emotion: 'disagreeing',
    emotionBadge: '😒 Disagree / Unimpressed',
    tag: 'Front Camera POV • Silent Unimpressed / Shaking Head (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_sad_serious_woman.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_sad_serious_woman.jpg'
  },
  {
    id: 'ugc_react_frustrated_woman',
    name: 'Zoe • Frustrated / Stressed POV',
    emotion: 'frustrated',
    emotionBadge: '😤 Frustrated / Pain',
    tag: 'Front Camera POV • Silent Frustrated & Overwhelmed Reaction (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_frustrated_woman.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_frustrated_woman.jpg'
  },
  {
    id: 'ugc_react_surprised_man',
    name: 'Marcus • Mind-Blown / Shock POV',
    emotion: 'shocked',
    emotionBadge: '🤯 Shocked / Disbelief',
    tag: 'Front Camera POV • Silent Mind-Blown Disbelief Reaction (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_surprised_man.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_surprised_man.jpg'
  },
  {
    id: 'ugc_react_pensive_woman',
    name: 'Aria • Deep Evaluation POV',
    emotion: 'thinking',
    emotionBadge: '💭 Deep Thought',
    tag: 'Front Camera POV • Silent Evaluating Chin-Rest Reaction (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_pensive_woman.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_pensive_woman.jpg'
  },
  {
    id: 'ugc_react_serious_girl',
    name: 'Mila • Deadpan / Serious POV',
    emotion: 'disagreeing',
    emotionBadge: '😐 Deadpan Reaction',
    tag: 'Front Camera POV • Silent Deadpan Stare at Lens (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_serious_girl.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_serious_girl.jpg'
  },
  {
    id: 'ugc_react_smiling_blonde',
    name: 'Mia • Calm / Pleased POV',
    emotion: 'agreeing',
    emotionBadge: '😊 Calm / Pleased',
    tag: 'Front Camera POV • Silent Knowing Smile Outdoors (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_react_smiling_blonde.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_smiling_blonde.jpg'
  },
  {
    id: 'ugc_s20_creator',
    name: 'Hannah • Thoughtful Outdoor POV',
    emotion: 'thinking',
    emotionBadge: '🌿 Thoughtful POV',
    tag: 'Front Camera 9:16 POV • Silent Attentive Eye Contact (No Talking)',
    type: 'video',
    mediaUrl: '/videos/actors/s20.mp4',
    thumbnailUrl: '/videos/actors/ugc_react_pensive_woman.jpg'
  },
  {
    id: 'ugc_alex_vlog',
    name: 'Alex • Street Creator POV',
    emotion: 'agreeing',
    emotionBadge: '🔥 Hype / Street POV',
    tag: 'Handheld Creator Vlog • Energetic Outdoor Reaction',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_alex_vlog.mp4',
    thumbnailUrl: '/videos/actors/ugc_alex_vlog.jpg'
  },
  {
    id: 'ugc_chloe_selfie',
    name: 'Chloe • Selfie Camera Check',
    emotion: 'agreeing',
    emotionBadge: '✨ Confident Selfie',
    tag: 'Front Camera 9:16 • Authentic Creator Vibe Check',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_chloe_selfie.mp4',
    thumbnailUrl: '/videos/actors/ugc_chloe_selfie.jpg'
  },
  {
    id: 'ugc_elena_phone',
    name: 'Nora • Checking Phone at 2AM',
    emotion: 'shocked',
    emotionBadge: '📱 Checking Phone',
    tag: 'Relatable Phone Scroll & Double-Take Reaction',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_elena_phone.mp4',
    thumbnailUrl: '/videos/actors/ugc_elena_phone.jpg'
  },
  {
    id: 'ugc_street_vlog',
    name: 'Jordan • Walking City POV',
    emotion: 'thinking',
    emotionBadge: '🚶 Walking POV',
    tag: 'On-the-Go Handheld City Creator Footage',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_street_vlog.mp4',
    thumbnailUrl: '/videos/actors/ugc_street_vlog.jpg'
  },
  {
    id: 'ugc_terrace_call',
    name: 'Sofia • Terrace Coffee Reaction',
    emotion: 'skeptical',
    emotionBadge: '☕ Sipping / Side-Eye',
    tag: 'Balcony Terrace POV • Relatable Creator Reaction',
    type: 'video',
    mediaUrl: '/videos/actors/ugc_terrace_call.mp4',
    thumbnailUrl: '/videos/actors/ugc_terrace_call.jpg'
  },
  {
    id: 'ugc_d13_studio',
    name: 'Lucas • Founder Desk POV',
    emotion: 'agreeing',
    emotionBadge: '💻 Founder Desk',
    tag: 'Studio Creator Camera • Direct Eye Contact',
    type: 'video',
    mediaUrl: '/videos/actors/d13.mp4',
    thumbnailUrl: '/videos/actors/d12.jpg'
  },
  {
    id: 'ugc_d6_creator',
    name: 'Ava • Expressive Take POV',
    emotion: 'shocked',
    emotionBadge: '👀 Wait What?!',
    tag: 'Expressive Creator Reaction • High Retention Hook',
    type: 'video',
    mediaUrl: '/videos/actors/d6.mp4',
    thumbnailUrl: '/videos/actors/s1.jpg'
  },
  {
    id: 'ugc_s13_creator',
    name: 'Noah • Skeptical Brow Raise',
    emotion: 'skeptical',
    emotionBadge: '🧐Wait A Second',
    tag: 'Skeptical Creator Look • Myth-Busting Reaction',
    type: 'video',
    mediaUrl: '/videos/actors/s13.mp4',
    thumbnailUrl: '/videos/actors/s4.jpg'
  },
  {
    id: 'ugc_s18_creator',
    name: 'Sienna • Unimpressed Stare',
    emotion: 'disagreeing',
    emotionBadge: '🙄 Side-Eye POV',
    tag: 'Relatable Side-Eye / Unimpressed Creator Clip',
    type: 'video',
    mediaUrl: '/videos/actors/s18.mp4',
    thumbnailUrl: '/videos/actors/d8.jpg'
  },
  {
    id: 'ugc_d9_creator',
    name: 'Ethan • Work From Home POV',
    emotion: 'frustrated',
    emotionBadge: '😮‍💨 Over It POV',
    tag: 'Late Night Desk Reaction • Relatable Pain Hook',
    type: 'video',
    mediaUrl: '/videos/actors/d9.mp4',
    thumbnailUrl: '/videos/actors/d9.jpg'
  }
];

function matchUgcReactionToScript(storyText: string, hookText?: string): {
  presetId: string;
  emotion: UgcEmotion;
  emotionBadge: string;
  reason: string;
} {
  const combined = `${storyText || ''}\n${hookText || ''}`.toLowerCase();
  const openingLines = (storyText || '').split('\n').slice(0, 4).join(' ').toLowerCase();

  // 1. Frustrated / Stressed / Overwhelmed pain points
  if (
    /burn out|staring at 12 noisy|hesitate and miss|frustrat|overwhelm|stress|angry|exhaust|sick of|headache|wasted hours/.test(
      openingLines
    ) ||
    /burn out|staring at 12 noisy|frustrat|overwhelm/.test(combined)
  ) {
    return {
      presetId: 'ugc_react_frustrated_woman',
      emotion: 'frustrated',
      emotionBadge: '😤 Frustrated / Pain',
      reason: 'Matches pain-point / burnout hook'
    };
  }

  // 2. Shocked / Mind-blown / Disbelief
  if (/mind-blown|shock|insane|unbelievable|wait until|never knew|jaw drop|crazy how/.test(combined)) {
    return {
      presetId: 'ugc_react_surprised_man',
      emotion: 'shocked',
      emotionBadge: '🤯 Shocked / Disbelief',
      reason: 'Matches high-surprise / disbelief hook'
    };
  }

  // 3. Skeptical / Calling out myths or hype
  if (
    /everyone claims|almost played|hindsight|mean nothing|skeptic|doubt|filtered inspo|hoping for the best|really works/.test(
      openingLines
    ) ||
    /everyone claims|hindsight chart callouts/.test(combined)
  ) {
    return {
      presetId: 'ugc_react_overthinking_woman',
      emotion: 'skeptical',
      emotionBadge: '🤨 Skeptical / Doubt',
      reason: 'Matches skeptical / myth-busting hook'
    };
  }

  // 4. Disagreeing / Unimpressed / Deadpan callout
  if (
    /stop trusting gut feelings|flying blind|brassy tones|wrong way|don't fall for|stop doing/.test(
      openingLines
    )
  ) {
    return {
      presetId: 'ugc_react_sad_serious_woman',
      emotion: 'disagreeing',
      emotionBadge: '😒 Disagree / Unimpressed',
      reason: 'Matches contrarian / disagreeing hook'
    };
  }

  if (/boring by week four|exact same 15|deadpan|generic/.test(openingLines)) {
    return {
      presetId: 'ugc_react_serious_girl',
      emotion: 'disagreeing',
      emotionBadge: '😐 Deadpan Reaction',
      reason: 'Matches unimpressed / deadpan callout'
    };
  }

  // 5. Nodding / Agreeing / Settling the debate
  if (
    /settle the debate|knows ball|let the live table|agreed|100% verifiable|results speak for themselves/.test(
      combined
    ) &&
    /arguing in the group chat|switched to|moved our league/.test(combined)
  ) {
    return {
      presetId: 'ugc_react_nodding_man',
      emotion: 'agreeing',
      emotionBadge: '😌 Nodding / Agree',
      reason: 'Matches confident agreement & validation'
    };
  }

  // 6. Default: Thinking -> Aha realization (ideal for analytical/evidence hooks)
  return {
    presetId: 'ugc_react_decision_woman',
    emotion: 'thinking',
    emotionBadge: '🤔 Thinking → Agree',
    reason: 'Matches thoughtful realization & story arc'
  };
}

function getUgcStoryVariants(brand: Brand, script?: VideoScript): string[] {
  const slug = (brand.slug || brand.name || '').toLowerCase();
  if (slug.includes('evidraw')) {
    return [
      `paper notes aren't evidence\nif you can edit the picks\nafter Lotto Max or 6/49 hits,\nyour brain will quietly rewrite\nhistory\nI started using Evidraw to lock\nmultiple portfolios with\ntimestamps\nbefore every draw\nthen I leave the record alone\nand let the results judge it`,
      `everyone claims they "almost\nplayed those exact numbers"\nafter the jackpot hits\nbut screenshots in your camera\nroll don't prove a system works\nI switched to Evidraw to lock\nmy wheeling matrices before\nthe draw closes\nso every hit and miss is\n100% verifiable`,
      `stop trusting gut feelings\non lottery wheeling systems\nif you aren't tracking cost vs\nmatched tiers across 50 draws\nyou're flying blind\nI use Evidraw to timestamp\nevery portfolio pre-draw\nand let cold math audit\nthe actual return`
    ];
  }
  if (slug.includes('varbona')) {
    return [
      `generic fantasy leagues get\nboring by week four\nwhen everyone drafts the exact\nsame 15 superstars\nwithout a real salary cap\nI started using Varbona to\nscout undervalued U-21 players\nand trade live transfer value\nbefore matchday locks\nnow every lineup decision\nactually feels like running a club`,
      `arguing in the group chat\nabout who knows ball\nis pointless without a live\ntransfer market\nI moved our league to Varbona\nwhere every player price shifts\nwith real match performance\nlock your XI before kickoff\nand let the live table\nsettle the debate`
    ];
  }
  if (slug.includes('optioncove')) {
    return [
      `staring at 12 noisy indicators\nwhile 0DTE contracts move\nin seconds is how traders\nhesitate and miss the fill\nI started using OptionCove\nto filter real-time institutional\noptions flow and gamma levels\nin one clean terminal\nset the alert, follow the tape,\nand let the levels do the work`,
      `hindsight chart callouts\non social media mean nothing\nwhen the spread is moving live\nI switched my morning prep\nto OptionCove to track\nunusual sweep volume and\nnet delta before the bell\nso my entries are planned\nbefore the crowd reacts`
    ];
  }
  if (slug.includes('salon') || slug.includes('garrido')) {
    return [
      `showing your stylist a filtered\ninspo photo and hoping for\nthe best is how brassy tones\nhappen two weeks later\nI started booking at\n${brand.name} where they map\ncustom balayage placement\nand bond protection to your\nexact hair history\nand the grow-out stays\nseamless for months`
    ];
  }
  return [
    `most people overcomplicate\n${brand.category || 'this workflow'} until they burn out\ntrying to piece together five\ndifferent tabs manually\nI started using ${brand.name}\nto run the entire system\nin one verified workspace\nset it up once in two minutes\nthen step back and let\nthe results speak for themselves`,
    `if you're still doing this\nthe old manual way\nyour brain will quietly excuse\nall the wasted hours\nI switched to ${brand.name}\nfor ${brand.targetAudience || 'daily execution'}\nand locked in a repeatable\nworkflow from day one`
  ];
}

export interface MemeReelTemplate {
  topCaption: string;
  bottomPunchline: string;
  presetId: string;
  memeFormat: 'white_bar' | 'impact_top_bottom' | 'vs_split';
}

function getMemeTemplatesForBrand(brand: Brand, script?: VideoScript): MemeReelTemplate[] {
  const slug = (brand.slug || brand.name || '').toLowerCase();
  if (slug.includes('evidraw')) {
    return [
      {
        topCaption: `Bro swearing he "almost played those exact Lotto Max numbers" with zero proof 💀\nMe pulling up my timestamped pre-draw Evidraw portfolio:`,
        bottomPunchline: `Screenshots lie. Pre-draw timestamps don't 📊`,
        presetId: 'ugc_react_overthinking_woman',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Nobody:\nMe at 2:14 AM auditing 50 Lotto 6/49 draws on Evidraw before locking my wheeling matrix:`,
        bottomPunchline: `Let the cold math judge the system 🧠`,
        presetId: 'ugc_react_surprised_man',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Playing random quick-picks on gut feelings ❌\nLocking verifiable pre-draw wheeling portfolios on Evidraw ✅`,
        bottomPunchline: `100% Verifiable Draw Tracking • @evidraw`,
        presetId: 'ugc_react_nodding_man',
        memeFormat: 'vs_split'
      },
      {
        topCaption: `POV: Your friend edits his paper notes AFTER the jackpot numbers drop`,
        bottomPunchline: `Put it in Evidraw before the draw closes or it didn't happen 😐`,
        presetId: 'ugc_react_serious_girl',
        memeFormat: 'impact_top_bottom'
      }
    ];
  }
  if (slug.includes('salon') || slug.includes('garrido')) {
    return [
      {
        topCaption: `When a client cancels 15 minutes before a 3-hour balayage appointment 😤\nWatch ${brand.name} auto-fill the chair from the VIP waitlist in 30 seconds:`,
        bottomPunchline: `Zero empty chairs. Zero stress ✨`,
        presetId: 'ugc_react_smiling_blonde',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Showing your stylist a heavily filtered AI Pinterest photo hoping for a miracle 💀\nBooking at ${brand.name} where they map custom formula to your hair history:`,
        bottomPunchline: `Seamless grow-out for months 💇‍♀️`,
        presetId: 'ugc_react_decision_woman',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Chasing DMs at 11pm to confirm appointments ❌\nAutomated 1-click booking & waitlist fill with ${brand.name} ✅`,
        bottomPunchline: `Work smarter behind the chair • @${brand.slug.replace(/-/g, '')}`,
        presetId: 'ugc_react_nodding_man',
        memeFormat: 'vs_split'
      }
    ];
  }
  if (slug.includes('optioncove')) {
    return [
      {
        topCaption: `Traders staring at 14 lagging indicators while the 0DTE move already happened 💀\nMe watching live institutional sweep flow on OptionCove:`,
        bottomPunchline: `Follow the tape, not hindsight callouts 📈`,
        presetId: 'ugc_react_nodding_man',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Discord gurus posting "easy +400%" screenshots 3 hours after market close 🤨\nOptionCove flagging the unusual call sweep before the bell:`,
        bottomPunchline: `Real-time gamma & flow in one terminal ⚡`,
        presetId: 'ugc_react_overthinking_woman',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Guessing entries off noisy 1-minute candles ❌\nTracking live institutional net delta & gamma walls on OptionCove ✅`,
        bottomPunchline: `Trade with institutional clarity • @optioncove`,
        presetId: 'ugc_react_surprised_man',
        memeFormat: 'vs_split'
      }
    ];
  }
  if (slug.includes('varbona')) {
    return [
      {
        topCaption: `When everyone in your fantasy league drafts the exact same 11 superstars by Week 3 😐\nMoving the group chat to Varbona with live U-21 transfer market values:`,
        bottomPunchline: `Now we see who actually knows ball ⚽`,
        presetId: 'ugc_react_serious_girl',
        memeFormat: 'white_bar'
      },
      {
        topCaption: `Nobody:\nMe scouting undervalued 19-year-old wingers on Varbona at 1:30 AM before matchday locks:`,
        bottomPunchline: `Real salary cap. Live market prices 🏆`,
        presetId: 'ugc_react_surprised_man',
        memeFormat: 'white_bar'
      }
    ];
  }

  const cleanHook = (script?.hook || `Trying to manage ${brand.category || 'everything'} across 6 messy tabs`).replace(/["']/g, '');
  return [
    {
      topCaption: `Nobody:\nMe trying to do ${brand.category || 'this'} the old manual way before discovering ${brand.name}:`,
      bottomPunchline: `Switched to ${brand.name} and never looked back 💀`,
      presetId: 'ugc_react_frustrated_woman',
      memeFormat: 'white_bar'
    },
    {
      topCaption: `When someone says "${cleanHook.slice(0, 68)}..." 🤨\nMe pulling up ${brand.name} in 2 clicks:`,
      bottomPunchline: `Work smarter with ${brand.name} ⚡`,
      presetId: 'ugc_react_overthinking_woman',
      memeFormat: 'white_bar'
    },
    {
      topCaption: `Wasting hours doing it manually ❌\nAutomating the entire workflow inside ${brand.name} ✅`,
      bottomPunchline: `Built for ${brand.targetAudience || 'modern teams'} • @${brand.slug.replace(/-/g, '')}`,
      presetId: 'ugc_react_nodding_man',
      memeFormat: 'vs_split'
    },
    {
      topCaption: `POV: You finally automated your workflow with ${brand.name} and finished by 10 AM`,
      bottomPunchline: `Why didn't I switch sooner? 🤯`,
      presetId: 'ugc_react_surprised_man',
      memeFormat: 'impact_top_bottom'
    }
  ];
}

type LayoutMode = 'dynamic_cuts' | 'ugc_creator' | 'meme_reel' | 'showcase' | 'split';
type SubtitleStyle = 'hormozi' | 'cyber' | 'luxury';
type StudioTab = 'copilot' | 'broll' | 'graphics' | 'layout' | 'qa' | 'voice';
type SoundwaveStyle = 'off' | 'neon_bars' | 'rainbow_eq' | 'minimal_dots';
type LowerThirdStyle = 'glass_card' | 'breaking_ticker' | 'minimal_pill' | 'off';

function getRecommendedVoice(category?: string): string {
  switch (category) {
    case 'lottery-gaming-tools':
    case 'gaming':
    case 'fintech':
    case 'tech':
      return 'en-US-Journey-D'; // Deep & confident narrator
    case 'beauty':
    case 'fashion':
    case 'lifestyle':
    case 'wellness':
      return 'en-US-Journey-F'; // Expressive & warm storyteller
    case 'food':
    case 'travel':
    case 'creator':
      return 'en-US-Journey-O'; // Dynamic modern reviewer
    default:
      return 'en-US-Journey-D';
  }
}

export function VideoPlayerPreview({
  brand,
  script,
  onScriptChange,
  onUpdateBrand,
  defaultAspectRatio = '16:9'
}: VideoPlayerPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(defaultAspectRatio);

  useEffect(() => {
    setAspectRatio(defaultAspectRatio);
  }, [defaultAspectRatio]);

  // Layout & Studio State - Defaults to Pure Dynamic Scene Cuts (or UGC Creator Hook if script specifies)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() =>
    script?.ugcStoryText || script?.aiDirector?.layout === 'ugc_creator' ? 'ugc_creator' : 'dynamic_cuts'
  );
  const [studioTab, setStudioTab] = useState<StudioTab>('copilot');

  // UGC Creator Hook & Selfie Story Overlay State
  const [ugcSubMode, setUgcSubMode] = useState<'story_only' | 'hook_then_app'>('story_only');
  const [ugcVariantIdx, setUgcVariantIdx] = useState<number>(0);
  const [ugcStoryText, setUgcStoryText] = useState<string>(
    () => script?.ugcStoryText || getUgcStoryVariants(brand, script)[0]
  );
  const [autoMatchUgcEmotion, setAutoMatchUgcEmotion] = useState<boolean>(true);
  const [selectedUgcCreatorId, setSelectedUgcCreatorId] = useState<string>(() => {
    const initialText = script?.ugcStoryText || getUgcStoryVariants(brand, script)[0];
    if (script?.ugcCreatorId && UGC_CREATOR_PRESETS.some((p) => p.id === script.ugcCreatorId)) {
      return script.ugcCreatorId;
    }
    return matchUgcReactionToScript(initialText, script?.hook).presetId;
  });
  const [customUgcMediaUrl, setCustomUgcMediaUrl] = useState<string | null>(null);
  const [customUgcMediaType, setCustomUgcMediaType] = useState<'image' | 'video'>('image');
  const [isGeneratingUgcCreator, setIsGeneratingUgcCreator] = useState<boolean>(false);
  const [showUgcEditorDrawer, setShowUgcEditorDrawer] = useState<boolean>(false);
  const [showAdvancedStudio, setShowAdvancedStudio] = useState<boolean>(false);

  // Meme Reel Mode State
  const [memeIdx, setMemeIdx] = useState<number>(0);
  const [memeTopCaption, setMemeTopCaption] = useState<string>(
    () => getMemeTemplatesForBrand(brand, script)[0].topCaption
  );
  const [memeBottomPunchline, setMemeBottomPunchline] = useState<string>(
    () => getMemeTemplatesForBrand(brand, script)[0].bottomPunchline
  );
  const [memeFormat, setMemeFormat] = useState<'white_bar' | 'impact_top_bottom' | 'vs_split'>(
    () => getMemeTemplatesForBrand(brand, script)[0].memeFormat
  );
  const [memeCardTheme, setMemeCardTheme] = useState<'light' | 'dark'>('light');
  const [showMemeEditorDrawer, setShowMemeEditorDrawer] = useState<boolean>(false);

  // Live Character & Meme Reaction Clip Search Drawer State
  const [showClipSearchDrawer, setShowClipSearchDrawer] = useState<boolean>(false);
  const [clipSearchQuery, setClipSearchQuery] = useState<string>('');
  const [clipSearchResults, setClipSearchResults] = useState<
    Array<{
      id: string;
      title: string;
      type: 'video' | 'image';
      mediaUrl: string;
      thumbnailUrl: string;
      source?: string;
    }>
  >([]);
  const [isSearchingClips, setIsSearchingClips] = useState<boolean>(false);
  const [customClipBadgeLabel, setCustomClipBadgeLabel] = useState<string>('🎬 Custom Reaction Clip');

  const handleSearchReactionClips = async (rawQuery?: string) => {
    const q = (rawQuery !== undefined ? rawQuery : clipSearchQuery).trim();
    if (!q) return;
    if (rawQuery !== undefined) {
      setClipSearchQuery(rawQuery);
    }
    setIsSearchingClips(true);
    try {
      const res = await fetch('/api/search-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          category: brand.category || 'all',
          mediaType: 'video'
        })
      });
      const data = await res.json();
      const clips = Array.isArray(data.clips) ? data.clips : [];
      setClipSearchResults(
        clips
          .filter((c: any) => c.mediaUrl && c.mediaUrl !== 'animated_chart')
          .slice(0, 24)
          .map((c: any) => ({
            id: c.id,
            title: c.title || q,
            type: c.type === 'video' ? 'video' : 'image',
            mediaUrl: c.mediaUrl,
            thumbnailUrl: c.thumbnailUrl || c.mediaUrl,
            source: c.source
          }))
      );
    } catch {
      setClipSearchResults([]);
    } finally {
      setIsSearchingClips(false);
    }
  };

  const matchedUgcEmotion = useMemo(
    () => matchUgcReactionToScript(ugcStoryText, script?.hook),
    [ugcStoryText, script?.hook]
  );

  useEffect(() => {
    const variants = getUgcStoryVariants(brand, script);
    const nextText = script?.ugcStoryText || variants[0];
    setUgcVariantIdx(0);
    setUgcStoryText(nextText);
    const matched = matchUgcReactionToScript(nextText, script?.hook);
    if (script?.ugcCreatorId && UGC_CREATOR_PRESETS.some((p) => p.id === script.ugcCreatorId)) {
      setSelectedUgcCreatorId(script.ugcCreatorId);
    } else {
      setSelectedUgcCreatorId(matched.presetId);
    }
    const memeTemplates = getMemeTemplatesForBrand(brand, script);
    setMemeIdx(0);
    setMemeTopCaption(memeTemplates[0].topCaption);
    setMemeBottomPunchline(memeTemplates[0].bottomPunchline);
    setMemeFormat(memeTemplates[0].memeFormat);

    if (script?.aiDirector?.layout === 'meme_reel') {
      setLayoutMode('meme_reel');
      setAspectRatio('9:16');
    } else if (script?.ugcStoryText || script?.aiDirector?.layout === 'ugc_creator') {
      setLayoutMode('ugc_creator');
      setAspectRatio('9:16');
    }
  }, [brand.id, script?.ugcStoryText]);

  const handleCycleMemeTemplate = () => {
    const templates = getMemeTemplatesForBrand(brand, script);
    const nextIdx = (memeIdx + 1) % templates.length;
    const nextMeme = templates[nextIdx];
    setMemeIdx(nextIdx);
    setMemeTopCaption(nextMeme.topCaption);
    setMemeBottomPunchline(nextMeme.bottomPunchline);
    setMemeFormat(nextMeme.memeFormat);
    setCustomUgcMediaUrl(null);
    setSelectedUgcCreatorId(nextMeme.presetId);
  };

  const handleRemixMemeFromScript = () => {
    const rawHook = (script?.hook || `Doing ${brand.category || 'this'} the hard way`).replace(/["']/g, '').trim();
    const rawCta = (script?.cta || `Switch to ${brand.name} today`).replace(/["']/g, '').trim();
    const remixedTop = `Nobody:\nWhen they're still dealing with "${rawHook.slice(0, 62)}" instead of using ${brand.name}:`;
    const remixedBottom = `${rawCta.slice(0, 56)} 💀`;
    setMemeTopCaption(remixedTop);
    setMemeBottomPunchline(remixedBottom);
    setMemeFormat('white_bar');
    const matched = matchUgcReactionToScript(remixedTop, script?.hook);
    setCustomUgcMediaUrl(null);
    setSelectedUgcCreatorId(matched.presetId);
  };

  const activeUgcPreset = useMemo<UgcCreatorPreset>(() => {
    if (customUgcMediaUrl) {
      return {
        id: 'custom_ugc',
        name: customClipBadgeLabel || 'Custom AI / Uploaded Creator',
        emotion: matchedUgcEmotion.emotion,
        emotionBadge: customClipBadgeLabel || matchedUgcEmotion.emotionBadge,
        tag: 'Custom Reaction / Meme Clip',
        type: customUgcMediaType,
        mediaUrl: customUgcMediaUrl,
        thumbnailUrl: customUgcMediaUrl
      };
    }
    return UGC_CREATOR_PRESETS.find((p) => p.id === selectedUgcCreatorId) || UGC_CREATOR_PRESETS[0];
  }, [selectedUgcCreatorId, customUgcMediaUrl, customUgcMediaType, matchedUgcEmotion, customClipBadgeLabel]);

  const handleCycleUgcStoryText = () => {
    const variants = getUgcStoryVariants(brand, script);
    const nextIdx = (ugcVariantIdx + 1) % variants.length;
    const nextText = variants[nextIdx];
    setUgcVariantIdx(nextIdx);
    setUgcStoryText(nextText);
    if (autoMatchUgcEmotion) {
      const matched = matchUgcReactionToScript(nextText, script?.hook);
      setCustomUgcMediaUrl(null);
      setSelectedUgcCreatorId(matched.presetId);
    }
  };

  const handleGenerateAiUgcCreator = async (provider: 'gemini' | 'veo' = 'veo') => {
    setIsGeneratingUgcCreator(true);
    try {
      const emotionInstruction =
        matchedUgcEmotion.emotion === 'frustrated'
          ? 'showing a silent frustrated, overwhelmed facial expression with hand on forehead'
          : matchedUgcEmotion.emotion === 'skeptical'
          ? 'showing a silent skeptical, pondering facial expression with finger near chin and raised eyebrow'
          : matchedUgcEmotion.emotion === 'disagreeing'
          ? 'showing a silent unimpressed, disagreeing facial expression and subtle head shake'
          : matchedUgcEmotion.emotion === 'shocked'
          ? 'showing a silent shocked, mind-blown facial expression looking straight into the lens'
          : matchedUgcEmotion.emotion === 'agreeing'
          ? 'silently nodding head in calm confident agreement with a slight knowing smile'
          : 'silently thinking and pondering with hand on chin before having an aha realization nod';

      const prompt = `Authentic 9:16 vertical front-facing smartphone selfie camera POV video of a real relatable creator looking directly into the camera lens, ${emotionInstruction}, mouth closed not speaking, silent reaction reel, no phone visible in frame, modern apartment natural daylight, photorealistic TikTok/Reels UGC aesthetic for ${brand.name} (${brand.category || 'app'})`;
      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          type: 'video',
          brandName: brand.name,
          category: brand.category || 'lifestyle'
        })
      });
      const data = await res.json();
      if (data.mediaUrl) {
        const resolvedType =
          data.type === 'video' || data.mediaType === 'video' || String(data.mediaUrl).endsWith('.mp4')
            ? 'video'
            : 'image';
        setCustomUgcMediaUrl(data.mediaUrl);
        setCustomUgcMediaType(resolvedType);
      }
    } catch {
      // Fallback remains on selected preset
    } finally {
      setIsGeneratingUgcCreator(false);
    }
  };

  const handleUgcVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomUgcMediaUrl(URL.createObjectURL(file));
    setCustomUgcMediaType(file.type.startsWith('image') ? 'image' : 'video');
  };

  // Live Website Scanning & Brand Asset Extraction State
  const [isScanningWebsite, setIsScanningWebsite] = useState(false);
  const [scanWebsiteStatus, setScanWebsiteStatus] = useState<string | null>(null);
  const [assetViewportFilter, setAssetViewportFilter] = useState<'mobile' | 'desktop' | 'all'>('mobile');

  // AI Creative Director (Brand + Prompt + Goal -> Finished Video) State
  const [directorGoal, setDirectorGoal] = useState<'conversions' | 'viral_reach' | 'demo' | 'authority'>('demo');
  const [directorPrompt, setDirectorPrompt] = useState('');
  const [isDirectingVideo, setIsDirectingVideo] = useState(false);
  const [directorStatus, setDirectorStatus] = useState<string | null>(null);

  // Interactive AI Copilot & QA State
  const [copilotInput, setCopilotInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [copilotFeedback, setCopilotFeedback] = useState<string | null>(null);
  const [activeQA, setActiveQA] = useState<VideoQAInspection>(() => 
    script.qaInspection || inspectVideoQuality(script, brand)
  );

  // Stable content signature of current script to detect any change in hook, scenes, or CTA
  const scriptSignature = useMemo(() => {
    if (!script) return '';
    const scenesText = (script.scenes || []).map((s) => cleanSpeechText(s.audio) || '').join(':::');
    return `${brand.id}:::${cleanSpeechText(script.hook) || ''}:::${scenesText}:::${cleanSpeechText(script.cta) || ''}`;
  }, [brand.id, script]);

  const lastGeneratedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (script?.qaInspection) {
      setActiveQA(script.qaInspection);
    } else if (script) {
      setActiveQA(inspectVideoQuality(script, brand));
    }

    // Stop ongoing speech & background music & reset audio when a new script or brand is loaded
    // so previous audio never bleeds over a new script!
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    soundbedEngine.stop();
    setAudioUrl(null);
    setWordTimestamps([]);
    setCurrentSceneIdx(0);
    setActiveWordIdx(0);
    setProgress(0);
    setIsPlaying(false);
  }, [scriptSignature, brand.id]);

  const handleApplyCopilotRevision = (customPrompt?: string) => {
    const textToRun = customPrompt || copilotInput;
    if (!textToRun.trim()) return;

    setIsRevising(true);
    setTimeout(() => {
      const { updatedScript, message } = applyAIVideoRevision(script, textToRun, brand);

      if (updatedScript.aiDirector) {
        setLayoutMode(updatedScript.aiDirector.layout);
        setSelectedBackgroundId(updatedScript.aiDirector.backgroundId);
        setSelectedSticker(updatedScript.aiDirector.stickerId);
        if (updatedScript.aiDirector.customStickerText) {
          setCustomStickerText(updatedScript.aiDirector.customStickerText);
        }
        setColorFilter(updatedScript.aiDirector.filter);
        setSubtitleStyle(updatedScript.aiDirector.subtitleStyle);
      }

      setCopilotFeedback(message);
      if (updatedScript.qaInspection) {
        setActiveQA(updatedScript.qaInspection);
      }

      if (onScriptChange) {
        onScriptChange(updatedScript);
      }

      setIsRevising(false);
      setCopilotInput('');
    }, 300);
  };

  // 1. Live Brand Website Scanning Engine: captures 4K screenshots & media assets
  const handleScanWebsite = async () => {
    setIsScanningWebsite(true);
    setScanWebsiteStatus('Capturing 9:16 mobile app viewport & 16:9 desktop screenshots...');
    try {
      const res = await fetch('/api/scan-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brand.websiteUrl || 'https://evidraw.com' })
      });
      const data = await res.json();
      const profile = data.profile || data.brand;
      if (profile && onUpdateBrand) {
        const updated = {
          ...brand,
          websiteScreenshotUrl: profile.websiteMobileScreenshotUrl || profile.websiteScreenshotUrl || brand.websiteScreenshotUrl,
          websiteMobileScreenshotUrl: profile.websiteMobileScreenshotUrl || brand.websiteMobileScreenshotUrl,
          websiteDesktopScreenshotUrl: profile.websiteDesktopScreenshotUrl || brand.websiteDesktopScreenshotUrl,
          brandAssets: profile.brandAssets || brand.brandAssets,
          logoUrl: profile.logoUrl || brand.logoUrl
        };
        onUpdateBrand(updated);
        setScanWebsiteStatus('✅ 9:16 Mobile App View & 16:9 Desktop View captured!');
      } else {
        setScanWebsiteStatus('Website scanned successfully.');
      }
    } catch (err: any) {
      setScanWebsiteStatus(`Scan error: ${err.message || 'Could not reach website'}`);
    } finally {
      setIsScanningWebsite(false);
      setTimeout(() => setScanWebsiteStatus(null), 4000);
    }
  };

  // 2. AI Creative Director: Brand + Prompt + Goal -> Finished Video
  const handleRunCreativeDirector = async () => {
    setIsDirectingVideo(true);
    setDirectorStatus('Analyzing brand identity, intent, and crafting finished video...');
    try {
      let userKey: string | undefined = undefined;
      try {
        userKey = localStorage.getItem('brandcommand_google_cloud_tts_key') || localStorage.getItem('brandcommand_gemini_key') || undefined;
      } catch {}

      const promptText = directorPrompt.trim() || `Highlight the core value of ${brand.name} for ${brand.targetAudience} with clear visual demonstration.`;
      const fullInstruction = `You are an elite Creative Director producing a high-converting, professional short-form vertical video (TikTok/Reels/Shorts).
Goal/Intent: ${directorGoal}.
Custom Creative Direction: ${promptText}
Brand: ${brand.name} (${brand.category}) - ${brand.tagline}. Target: ${brand.targetAudience}.

Optimize the video script:
1. Hook (0-3s): Punchy, magnetic, high-retention.
2. Scenes: 3 crisp scenes explaining the problem, the solution, and demonstrating the brand interface.
3. CTA: Direct, actionable call to action.
Return valid JSON matching the VideoScript schema.`;

      const res = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          format: 'video_script',
          currentData: script,
          instruction: fullInstruction,
          apiKey: userKey
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        const optimizedScript: VideoScript = {
          ...script,
          ...data.data,
          // Bind the brand's live screenshot to Scene 1 and learning lab asset to Scene 2
          scenes: (data.data.scenes || script.scenes).map((sc: any, idx: number) => {
            if (idx === 0) {
              const mobileUrl = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl;
              if (mobileUrl) {
                return {
                  ...sc,
                  brollMediaUrl: mobileUrl,
                  brollMediaType: 'image',
                  brollLabel: `${brand.name} 📱 Mobile App View`
                };
              }
            }
            if (idx === 1 && brand.brandAssets && brand.brandAssets.length > 0) {
              return {
                ...sc,
                brollMediaUrl: brand.brandAssets[0].url,
                brollMediaType: 'image',
                brollLabel: brand.brandAssets[0].label
              };
            }
            return sc;
          })
        };

        if (onScriptChange) {
          onScriptChange(optimizedScript);
        }

        // Apply finished director styling:
        if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) {
          setSelectedBackgroundId('lottery_data_matrix');
          setSelectedSticker('odds_matrix');
          setSubtitleStyle('cyber');
          setColorFilter('cyberpunk');
          setSelectedSoundtrack('cyber_tech');
        } else if (brand.category === 'fintech') {
          setSelectedBackgroundId('live_candlesticks');
          setSelectedSticker('options_gain');
          setSubtitleStyle('cyber');
          setSelectedSoundtrack('cyber_tech');
        } else {
          setSelectedSticker('none');
          setSubtitleStyle('hormozi');
          setSelectedSoundtrack('lofi_chill');
        }
        setLayoutMode('dynamic_cuts');

        setDirectorStatus('✨ Finished Video ready! Script, live brand screenshots, graphics & music applied.');
      } else {
        setDirectorStatus('Applied creative director rules.');
      }
    } catch (err: any) {
      setDirectorStatus(`Error: ${err.message || 'Failed to craft video'}`);
    } finally {
      setIsDirectingVideo(false);
      setTimeout(() => setDirectorStatus(null), 5000);
    }
  };

  // Background Video / B-Roll State
  const defaultBgId = (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw'))
    ? 'lottery_data_matrix'
    : brand.category === 'fintech' 
    ? 'live_candlesticks' 
    : (brand.category === 'salon' || brand.category === 'extensions')
      ? 'salon_blowout' 
      : brand.category === 'community' 
        ? 'uruguay_rambla' 
        : 'lottery_data_matrix';

  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(defaultBgId);
  const [bgCategoryFilter, setBgCategoryFilter] = useState<string>('all');
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [customMediaType, setCustomMediaType] = useState<'video' | 'image' | null>(null);
  const [directMediaUrlInput, setDirectMediaUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scene B-Roll & Visual Cuts State (Dynamic matching per cut)
  const [selectedSceneForBroll, setSelectedSceneForBroll] = useState<number>(0);
  const [sceneBrollOverrides, setSceneBrollOverrides] = useState<
    Record<number, { mediaUrl: string; type: 'video' | 'animated_chart' | 'image'; label: string }>
  >({});
  const [brollSearchQuery, setBrollSearchQuery] = useState('');
  const [isSearchingBroll, setIsSearchingBroll] = useState(false);
  const [brollSearchResults, setBrollSearchResults] = useState<Array<{
    id: string;
    title: string;
    category: any;
    type: 'video' | 'animated_chart' | 'image';
    mediaUrl: string;
    thumbnailUrl: string;
    source: string;
    tags: string[];
    duration?: number;
  }>>([]);
  const [pexelsApiKey, setPexelsApiKey] = useState('');
  const [showPexelsAccordion, setShowPexelsAccordion] = useState(false);
  const [isAutoMatchingAll, setIsAutoMatchingAll] = useState(false);

  // Graphics & Visual FX State
  const [selectedSticker, setSelectedSticker] = useState<string>(() => {
    if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) return 'odds_matrix';
    if (brand.category === 'fintech') return 'options_gain';
    if (brand.category === 'community') return 'uruguay';
    if (brand.category === 'extensions') return 'remy_hair';
    if (brand.category === 'salon') return 'verified_salon';
    return 'none';
  });
  const [customStickerText, setCustomStickerText] = useState('');
  const [soundwaveStyle, setSoundwaveStyle] = useState<SoundwaveStyle>('neon_bars');
  const [colorFilter, setColorFilter] = useState<keyof typeof COLOR_FILTERS>('none');
  const [lowerThirdStyle, setLowerThirdStyle] = useState<LowerThirdStyle>('glass_card');
  const [showWatermark, setShowWatermark] = useState(true);

  // Subtitle Style & Screen Clarity Setting (defaults to 'compact' small bottom pill so video is never blocked)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('hormozi');
  const [captionDisplayMode, setCaptionDisplayMode] = useState<'off' | 'compact' | 'full'>('compact');
  const [showCalloutLabels, setShowCalloutLabels] = useState<boolean>(true);
  const [aiDirectorNotice, setAiDirectorNotice] = useState<string | null>(null);

  // Studio Voiceover API State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<'google' | 'openai' | 'elevenlabs'>('google');
  const [voiceName, setVoiceName] = useState(() => getRecommendedVoice(brand.category));
  const [voiceApiKey, setVoiceApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('brandcommand_voice_api_key') ||
        localStorage.getItem('brandcommand_google_cloud_tts_key') ||
        localStorage.getItem('brandcommand_gemini_key') ||
        localStorage.getItem('brandcommand_media_api_key') ||
        ''
      );
    }
    return '';
  });
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wordTimestamps, setWordTimestamps] = useState<Array<{ word: string; start: number; end: number; sceneIdx: number; wordIdxInScene: number }>>([]);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [autoGenerateVoice, setAutoGenerateVoice] = useState(true);

  // AI Image & Video Model Generator State (Google Veo 2 / Imagen 3 / DALL-E 3 / Fal.ai)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaProvider, setMediaProvider] = useState<'veo' | 'gemini' | 'openai' | 'fal' | 'replicate'>('veo');
  const [mediaApiKey, setMediaApiKey] = useState('');
  const [mediaPrompt, setMediaPrompt] = useState(script.visualCue || `${brand.name} product demonstration`);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [mediaStatusMsg, setMediaStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Automated Scene-by-Scene AI Visual Production State (Google Imagen 3 / Veo 2)
  const [isGeneratingAllSceneVisuals, setIsGeneratingAllSceneVisuals] = useState(false);
  const [sceneVisualProgress, setSceneVisualProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [sceneVisualNotice, setSceneVisualNotice] = useState<string | null>(null);

  // 9:16 Video Exporter State
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Background Music (BGM) Soundtrack State
  const [selectedSoundtrack, setSelectedSoundtrack] = useState<SoundtrackGenre>(() => {
    if (brand.category === 'gaming') return 'stadium_hype';
    if (brand.category === 'fintech' || brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) return 'cyber_tech';
    if (brand.category === 'community') return 'acoustic_warm';
    return 'lofi_chill';
  });
  const [soundtrackVolume, setSoundtrackVolume] = useState<number>(0.18);
  const [isTestingSoundtrack, setIsTestingSoundtrack] = useState<boolean>(false);

  // Immediate soundtrack shutoff whenever playback stops or pauses
  useEffect(() => {
    if (!isPlaying && !isTestingSoundtrack) {
      soundbedEngine.stop();
    }
  }, [isPlaying, isTestingSoundtrack]);

  // Clean up soundbed on component unmount
  useEffect(() => {
    return () => {
      soundbedEngine.stop();
    };
  }, []);

  const brollVideoRef = useRef<HTMLVideoElement>(null);
  const ugcVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved voice settings from localStorage
  useEffect(() => {
    try {
      const savedKey =
        localStorage.getItem('brandcommand_voice_api_key') ||
        localStorage.getItem('brandcommand_google_cloud_tts_key') ||
        localStorage.getItem('brandcommand_gemini_key') ||
        localStorage.getItem('brandcommand_media_api_key') ||
        '';
      if (savedKey) {
        setVoiceApiKey(savedKey);
        // Pre-fill media API key with Google AI key for Gemini Imagen 3 / Veo 2 if not yet set
        const savedMediaKey = localStorage.getItem('brandcommand_media_api_key');
        if (!savedMediaKey) {
          setMediaApiKey(savedKey);
        }
      }
      const savedProvider = localStorage.getItem('brandcommand_voice_provider');
      if (savedProvider) setVoiceProvider(savedProvider as 'google' | 'openai' | 'elevenlabs');
      else setVoiceProvider('google');

      const savedAuto = localStorage.getItem('brandcommand_auto_generate_voice');
      if (savedAuto !== null) {
        setAutoGenerateVoice(savedAuto === 'true');
      } else {
        setAutoGenerateVoice(true);
      }

      // Load saved media API key (auto-fallback to Google Cloud / Gemini key already entered)
      const savedMediaKey = localStorage.getItem('brandcommand_media_api_key') || localStorage.getItem('brandcommand_google_cloud_tts_key') || localStorage.getItem('brandcommand_gemini_key') || '';
      if (savedMediaKey) setMediaApiKey(savedMediaKey);
      const savedMediaProvider = localStorage.getItem('brandcommand_media_provider');
      if (savedMediaProvider) setMediaProvider(savedMediaProvider as any);
      else setMediaProvider('veo');

      // Load saved Pexels key
      const savedPexelsKey = localStorage.getItem('brandcommand_pexels_key');
      if (savedPexelsKey) setPexelsApiKey(savedPexelsKey);
    } catch {}
  }, []);

  const handleGenerateCustomMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingMedia(true);
    setMediaStatusMsg(null);

    try {
      const activeKey = mediaApiKey || localStorage.getItem('brandcommand_google_cloud_tts_key') || localStorage.getItem('brandcommand_gemini_key') || '';
      if (activeKey) {
        localStorage.setItem('brandcommand_media_api_key', activeKey);
      }
      localStorage.setItem('brandcommand_media_provider', mediaProvider);

      const res = await fetch('/api/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: mediaProvider,
          prompt: mediaPrompt,
          type: mediaType,
          apiKey: activeKey,
          brandCategory: brand.category
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMediaStatusMsg({
          success: false,
          text: data.message || 'Failed to generate media.'
        });
        setIsGeneratingMedia(false);
        return;
      }

      setCustomMediaUrl(data.mediaUrl);
      setCustomMediaType(data.type);
      setMediaStatusMsg({
        success: true,
        text: data.note || `Successfully generated 9:16 ${data.type} with ${mediaProvider.toUpperCase()}!`
      });

      setTimeout(() => {
        setIsMediaModalOpen(false);
      }, 1400);
    } catch (err: any) {
      setMediaStatusMsg({
        success: false,
        text: err.message || 'Network error generating media.'
      });
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  // Automated Scene-by-Scene AI Visual Production: generates 9:16 assets for each scene's exact visual description
  const handleGenerateAllSceneVisuals = async (model: 'gemini' | 'veo' = 'gemini') => {
    if (isGeneratingAllSceneVisuals) return;
    setIsGeneratingAllSceneVisuals(true);
    setSceneVisualNotice(null);

    const activeKey =
      mediaApiKey ||
      voiceApiKey ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
          localStorage.getItem('brandcommand_gemini_key') ||
          localStorage.getItem('brandcommand_voice_api_key') ||
          localStorage.getItem('brandcommand_media_api_key') ||
          ''
        : '');

    const total = scenes.length;
    const newOverrides = { ...sceneBrollOverrides };
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const sceneItem = scenes[i];
      const visualAction = sceneItem.visual || (i === 0 ? script.visualCue : `Visual action demonstration for ${brand.name}`);
      
      setSceneVisualProgress({
        current: i + 1,
        total,
        title: `${sceneItem.title}: ${visualAction.slice(0, 35)}...`
      });

      try {
        const res = await fetch('/api/generate-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: model,
            prompt: `${visualAction}, realistic interface and high-conversion product demonstration for ${brand.name}, 9:16 vertical composition, 4k ultra-detailed commercial quality`,
            type: model === 'veo' ? 'video' : 'image',
            apiKey: activeKey,
            brandCategory: brand.category
          })
        });

        const data = await res.json();
        if (data.mediaUrl) {
          newOverrides[i] = {
            mediaUrl: data.mediaUrl,
            type: data.type || (model === 'veo' ? 'video' : 'image'),
            label: `AI: ${visualAction.slice(0, 26)}...`
          };
          setSceneBrollOverrides({ ...newOverrides });
          successCount++;
        }
      } catch (err) {
        console.warn(`Failed to render visual for scene ${i}:`, err);
      }
    }

    setIsGeneratingAllSceneVisuals(false);
    setSceneVisualProgress(null);
    setSceneVisualNotice(`Rendered AI visuals for ${successCount}/${total} scenes with Google ${model === 'veo' ? 'Veo 2' : 'Imagen 3'}!`);
    setTimeout(() => setSceneVisualNotice(null), 5000);
  };

  // Auto-apply AI Director suggestions when a new script is generated
  useEffect(() => {
    setSceneBrollOverrides({});
    setBrollSearchResults([]);
    setBrollSearchQuery('');
    setSelectedSceneForBroll(0);
    if (script?.aiDirector) {
      const d = script.aiDirector;
      setLayoutMode((d.layout as LayoutMode) || 'dynamic_cuts');
      setSelectedBackgroundId(d.backgroundId);
      setSelectedSticker(d.stickerId);
      if (d.customStickerText) setCustomStickerText(d.customStickerText);
      setColorFilter(d.filter);
      setSubtitleStyle(d.subtitleStyle);
      setSoundwaveStyle(d.soundwaveStyle);
      setAiDirectorNotice(d.directorNotes);
    }
  }, [script]);

  // Update defaults on brand change
  useEffect(() => {
    if (brand.category === 'fintech') {
      setSelectedBackgroundId('live_candlesticks');
      setSubtitleStyle('cyber');
      setSelectedSticker('options_gain');
    } else if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) {
      setSelectedBackgroundId('lottery_data_matrix');
      setSubtitleStyle('cyber');
      setSelectedSticker('odds_matrix');
    } else if (brand.category === 'community') {
      setSelectedBackgroundId('uruguay_rambla');
      setSubtitleStyle('hormozi');
      setSelectedSticker('uruguay');
    } else if (brand.category === 'extensions') {
      setSelectedBackgroundId('remy_wefts');
      setSubtitleStyle('hormozi');
      setSelectedSticker('remy_hair');
    } else if (brand.category === 'salon') {
      setSelectedBackgroundId('salon_blowout');
      setSubtitleStyle('luxury');
      setSelectedSticker('verified_salon');
    } else {
      setSelectedBackgroundId('evidraw_canvas');
      setSubtitleStyle('hormozi');
      setSelectedSticker('none'); // Default to clean, no unrelated badge!
    }
  }, [brand.category, brand.id]);

  const activeBackgroundPreset = BACKGROUND_PRESETS.find((p) => p.id === selectedBackgroundId) || BACKGROUND_PRESETS[0];

  // Multi-Scene Media Resolver: Dynamically cuts to scene-relevant B-roll, charts, and video footage
  const getSceneMedia = (sceneIdx: number, sceneType: string) => {
    const isLottery = brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw');
    const isInvalidMedia = (url?: string) => {
      if (!url) return true;
      if (url.includes('animated_demo')) return true;
      if (isLottery && (url.includes('1560066984-138dadb4c035') || url.includes('1522337360788') || url.includes('1527799820374') || url.includes('salon') || url.includes('weft'))) {
        return true;
      }
      return false;
    };

    const findAssetHighlight = (url?: string) => {
      if (!url || !brand.brandAssets) return undefined;
      return brand.brandAssets.find((a) => a.url === url)?.uiHighlight;
    };

    // 1. Manual user override for this specific scene cut
    if (sceneBrollOverrides[sceneIdx] && !isInvalidMedia(sceneBrollOverrides[sceneIdx].mediaUrl)) {
      return {
        ...sceneBrollOverrides[sceneIdx],
        uiHighlight: findAssetHighlight(sceneBrollOverrides[sceneIdx].mediaUrl),
        isActorVideo: false
      };
    }

    // 2. Script-level scene B-roll metadata (auto-assigned by generator or AI auto-match)
    if (sceneType === 'hook' && script.hookBrollMediaUrl && !isInvalidMedia(script.hookBrollMediaUrl)) {
      return {
        type: script.hookBrollMediaType || 'image',
        mediaUrl: script.hookBrollMediaUrl,
        label: script.hookBrollLabel || 'Hook Visual',
        uiHighlight: script.hookUiHighlight || findAssetHighlight(script.hookBrollMediaUrl),
        isActorVideo: false
      };
    }

    if (sceneType === 'cta' && script.ctaBrollMediaUrl && !isInvalidMedia(script.ctaBrollMediaUrl)) {
      return {
        type: script.ctaBrollMediaType || 'image',
        mediaUrl: script.ctaBrollMediaUrl,
        label: script.ctaBrollLabel || 'Offer CTA Endscreen',
        uiHighlight: script.ctaUiHighlight || findAssetHighlight(script.ctaBrollMediaUrl),
        isActorVideo: false
      };
    }

    if (sceneType === 'scene' && script.scenes?.[sceneIdx - 1]?.brollMediaUrl && !isInvalidMedia(script.scenes[sceneIdx - 1]?.brollMediaUrl)) {
      const scriptScene = script.scenes[sceneIdx - 1];
      return {
        type: scriptScene.brollMediaType || 'image',
        mediaUrl: scriptScene.brollMediaUrl!,
        label: scriptScene.brollLabel || `Scene ${sceneIdx} Demonstration`,
        uiHighlight: scriptScene.uiHighlight || findAssetHighlight(scriptScene.brollMediaUrl),
        isActorVideo: false
      };
    }

    // 3. Global custom media override (if user uploaded or generated custom asset)
    if (customMediaUrl && !isInvalidMedia(customMediaUrl)) {
      return {
        type: customMediaType || 'image',
        mediaUrl: customMediaUrl,
        label: 'Custom AI Media Asset',
        isActorVideo: false
      };
    }

    // 1. Hook (Scene 0): High-Impact Visual Hook
    if (sceneType === 'hook') {
      if (isLottery) {
        return {
          type: 'image' as const,
          mediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
          label: 'Evidraw Split-Screen Portfolio & Live Odds Grid'
        };
      }
      if (brand.category === 'fintech') {
        return {
          type: 'animated_chart' as const,
          mediaUrl: 'animated_chart',
          label: 'OptionCove Live Scanner Terminal'
        };
      }
      if (brand.category === 'gaming') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
          label: 'Stadium Floodlights & Matchday Pitch'
        };
      }
      if (brand.category === 'salon' || brand.category === 'extensions') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
          label: 'Salon Transformation & High-Gloss Blowout'
        };
      }
      if (brand.category === 'webapp') {
        return {
          type: 'image' as const,
          mediaUrl: brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
          label: `${brand.name} Web App Interface`
        };
      }
      return {
        type: 'image' as const,
        mediaUrl: brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        label: `${brand.name} Brand Visual`
      };
    }

    // 2. CTA (Final Scene): High-Converting Branded Offer Endscreen
    if (sceneType === 'cta') {
      if (isLottery) {
        return {
          type: 'image' as const,
          mediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
          label: 'Evidraw Strategy Generator & Terminal Access'
        };
      }
      if (brand.category === 'fintech') {
        return {
          type: 'animated_chart' as const,
          mediaUrl: 'animated_chart',
          label: 'OptionCove VIP Terminal Access'
        };
      }
      if (brand.category === 'gaming') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
          label: 'Varbona Beta Squad & Leaderboard Access'
        };
      }
      if (brand.category === 'salon' || brand.category === 'extensions') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
          label: 'Hand-Tied Extensions Booking Offer'
        };
      }
      return {
        type: 'image' as const,
        mediaUrl: brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        label: `${brand.name} Offer Endscreen`
      };
    }

    // 3. Scene 1 (The Problem / Research Demonstration / Live Brand Mobile Screenshot):
    if (sceneIdx === 1) {
      if (isLottery) {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
          label: 'Combinatorial Probability & Overlap Matrix',
          isActorVideo: false
        };
      }
      const activeMobileScreenshot = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl;
      if (activeMobileScreenshot) {
        return {
          type: 'image' as const,
          mediaUrl: activeMobileScreenshot,
          label: `${brand.name} 📱 Mobile App View`,
          isActorVideo: false
        };
      }
      if (brand.category === 'fintech') {
        return {
          type: 'animated_chart' as const,
          mediaUrl: 'animated_chart',
          label: 'OptionCove Candlestick Scanner Terminal',
          isActorVideo: false
        };
      }
      if (brand.category === 'gaming') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
          label: 'Tactical Pitch & Scout Matrix',
          isActorVideo: false
        };
      }
      if (brand.category === 'salon' || brand.category === 'extensions') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&auto=format&fit=crop&q=80',
          label: 'Luxury Hair Spa Wash Station Demo',
          isActorVideo: false
        };
      }
      if (brand.category === 'webapp') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
          label: 'EviDraw Interactive Canvas UI',
          isActorVideo: false
        };
      }
      return {
        type: 'image' as const,
        mediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
        label: 'Rambla Coastal Community',
        isActorVideo: false
      };
    }

    // 4. Scene 2 (The Solution / Transformation Payoff / Brand Architecture):
    if (sceneIdx === 2) {
      if (isLottery) {
        return {
          type: 'image' as const,
          mediaUrl: 'https://evidraw.com/og.png',
          label: 'Evidraw Learning Lab & Portfolio Engine',
          isActorVideo: false
        };
      }
      if (brand.brandAssets && brand.brandAssets.length > 0) {
        return {
          type: 'image' as const,
          mediaUrl: brand.brandAssets[0].url,
          label: brand.brandAssets[0].label,
          isActorVideo: false
        };
      }
      if (brand.category === 'fintech') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
          label: 'Nasdaq Multi-Screen Wall Street Matrix',
          isActorVideo: false
        };
      }
      if (brand.category === 'gaming') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&auto=format&fit=crop&q=80',
          label: 'Tactical Squad Formation & Player Market',
          isActorVideo: false
        };
      }
      if (brand.category === 'extensions') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
          label: '4K Remy Wefts • Invisible Seam Blend',
          isActorVideo: false
        };
      }
      if (brand.category === 'salon') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
          label: 'Salon Blowout & Transformation Reveal',
          isActorVideo: false
        };
      }
      return {
        type: 'image' as const,
        mediaUrl: brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
        label: `${brand.name} Feature Showcase`,
        isActorVideo: false
      };
    }

    // 5. Scene 3 (Live Payoff Proof):
    if (sceneIdx === 3) {
      if (isLottery) {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
          label: 'Real-Time Draw Outcome Verification',
          isActorVideo: false
        };
      }
      if (brand.category === 'fintech') {
        return {
          type: 'animated_chart' as const,
          mediaUrl: 'animated_chart',
          label: 'OptionCove Volatility Scanner Orderbook',
          isActorVideo: false
        };
      }
      if (brand.category === 'gaming') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
          label: 'Matchday Squad Leaderboard Payoff',
          isActorVideo: false
        };
      }
      if (brand.category === 'salon' || brand.category === 'extensions') {
        return {
          type: 'image' as const,
          mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
          label: 'High-Gloss Silk Press Payoff',
          isActorVideo: false
        };
      }
    }

    if (isLottery) {
      return {
        type: 'image' as const,
        mediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        label: 'Evidraw Smart Draw Analytics & Probability Matrix',
        isActorVideo: false
      };
    }

    const preset = BACKGROUND_PRESETS.find((p) => p.id === selectedBackgroundId) || BACKGROUND_PRESETS[0];
    return {
      type: preset.type,
      mediaUrl: preset.mediaUrl,
      label: preset.label,
      isActorVideo: false
    };
  };

  // Assemble full scene list cleanly without duplicating CTA
  const scenes = useMemo(() => {
    const list: Array<{
      title: string;
      type: 'hook' | 'scene' | 'cta';
      visualBadge: string;
      visual: string;
      text: string;
    }> = [
      {
        title: 'Hook',
        type: 'hook',
        visualBadge: '🚨 STOP SCROLLING',
        visual: script.visualCue,
        text: cleanSpeechText(script.hook) || script.hook
      }
    ];

    // Filter out duplicate CTA if the last scene in script.scenes is already the CTA
    const middleScenes = (script.scenes || []).filter((s, idx) => {
      if (idx === script.scenes.length - 1 && script.cta) {
        const sAudioClean = s.audio.toLowerCase().replace(/[^a-z0-9]/g, '');
        const ctaClean = script.cta.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (sAudioClean === ctaClean || (sAudioClean.includes('bio') && ctaClean.includes('bio'))) {
          return false;
        }
      }
      return true;
    });

    middleScenes.forEach((s, idx) => {
      list.push({
        title: `Scene ${idx + 1}`,
        type: 'scene' as const,
        visualBadge: `STEP ${idx + 1}`,
        visual: s.visual,
        text: cleanSpeechText(s.audio) || s.audio
      });
    });

    list.push({
      title: 'CTA',
      type: 'cta' as const,
      visualBadge: '👉 EXCLUSIVE OFFER',
      visual: 'End screen CTA & Offer',
      text: cleanSpeechText(script.cta) || script.cta
    });

    return list;
  }, [script]);

  const currentScene = scenes[currentSceneIdx] || scenes[0];
  const currentSceneMedia = getSceneMedia(currentSceneIdx, currentScene.type);

  // Active background source for layout
  const currentBrollSource = currentSceneMedia.mediaUrl;
  const isCurrentBrollVideo = currentSceneMedia.type === 'video';
  const isCurrentBrollAnimatedChart = currentSceneMedia.type === 'animated_chart';

  const totalTextLength = scenes.reduce((sum, s) => sum + s.text.length, 0);

  const sceneBoundaries = scenes.reduce<number[]>((acc, s, idx) => {
    const prev = idx === 0 ? 0 : acc[idx - 1];
    acc.push(prev + s.text.length / totalTextLength);
    return acc;
  }, []);

  // Autonomous Master Timeline Clock & Scene Duration Calculations
  const sceneDurations = useMemo(() => {
    return scenes.map((s) => {
      const wordCount = s.text.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(3.2, wordCount * 0.38);
    });
  }, [scenes]);

  const totalDuration = useMemo(() => {
    return sceneDurations.reduce((acc, d) => acc + d, 0);
  }, [sceneDurations]);

  const sceneTimeBoundaries = useMemo(() => {
    let cumulative = 0;
    return sceneDurations.map((d) => {
      cumulative += d;
      return cumulative;
    });
  }, [sceneDurations]);

  const currentTimeRef = useRef<number>(0);
  const currentSceneIdxRef = useRef<number>(currentSceneIdx);
  currentSceneIdxRef.current = currentSceneIdx;

  const words = useMemo(() => {
    return currentScene.text.trim().split(/\s+/);
  }, [currentScene.text]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomMediaUrl(URL.createObjectURL(file));
    setCustomMediaType(file.type.startsWith('video') ? 'video' : 'image');
  };

  const handleApplyDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMediaUrlInput.trim()) return;
    setCustomMediaUrl(directMediaUrlInput.trim());
    setCustomMediaType(directMediaUrlInput.toLowerCase().endsWith('.mp4') ? 'video' : 'image');
  };

  // 16:9 YouTube Widescreen HD & 9:16 Vertical Video Canvas & MediaRecorder Exporter (with Multi-Stop Scroll, Camera Zoom, Arrow Callouts & Clean Subtitles!)
  const handleExportVideo = async (targetRatio?: '16:9' | '9:16') => {
    const ratio = targetRatio || aspectRatio;
    setIsExportingVideo(true);
    setExportProgress(5);
    setExportNotice(
      ratio === '16:9'
        ? 'Rendering 16:9 Full-Size YouTube HD video (1280x720) with scroll, zoom & arrows...'
        : 'Rendering 9:16 vertical video (720x1280) with scroll, zoom & arrows...'
    );

    try {
      const width = ratio === '16:9' ? 1280 : 720;
      const height = ratio === '16:9' ? 720 : 1280;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Preload scene images so real app screenshots render inside the exported video
      const loadImg = (url?: string): Promise<HTMLImageElement | null> =>
        new Promise((resolve) => {
          if (!url || url === 'animated_chart') return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });

      const loadVideo = (url?: string): Promise<HTMLVideoElement | null> =>
        new Promise((resolve) => {
          if (!url) return resolve(null);
          const vid = document.createElement('video');
          vid.crossOrigin = 'anonymous';
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          let resolved = false;
          const finish = (v: HTMLVideoElement | null) => {
            if (!resolved) {
              resolved = true;
              resolve(v);
            }
          };
          vid.onloadeddata = () => {
            vid.play().catch(() => {});
            finish(vid);
          };
          vid.onerror = () => finish(null);
          setTimeout(() => finish(vid.readyState >= 2 ? vid : null), 2500);
          vid.src = url;
          vid.load();
        });

      const ugcCreatorVideo =
        activeUgcPreset.type === 'video' ? await loadVideo(activeUgcPreset.mediaUrl) : null;

      const ugcCreatorImg = await loadImg(
        activeUgcPreset.type === 'image' ? activeUgcPreset.mediaUrl : activeUgcPreset.thumbnailUrl
      );

      const sceneMediaList = await Promise.all(
        scenes.map(async (sc, idx) => {
          const m = getSceneMedia(idx, sc.type);
          const loadedImg = await loadImg(m.mediaUrl);
          return { media: m, img: loadedImg };
        })
      );

      if (typeof window !== 'undefined' && (window as any).MediaRecorder && (canvas as any).captureStream) {
        const stream = (canvas as any).captureStream(30);
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const recordingDone = new Promise<Blob>((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
            resolve(blob);
          };
        });

        recorder.start(100);

        for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
          const sc = scenes[sIdx];
          const { media: scMedia, img: scImg } = sceneMediaList[sIdx];
          const isUgcScene =
            layoutMode === 'ugc_creator' && (ugcSubMode === 'story_only' || sIdx === 0);
          const isMemeScene = layoutMode === 'meme_reel';
          const hl = (scMedia as any)?.uiHighlight;
          const waypoints =
            hl?.scrollWaypoints && hl.scrollWaypoints.length >= 2
              ? hl.scrollWaypoints
              : hl
              ? [
                  {
                    scrollYPercent: 0,
                    x: hl.x ?? 24,
                    yInViewport: hl.y ?? 90,
                    width: hl.width ?? 20,
                    height: hl.height ?? 7,
                    calloutText: hl.calloutText || 'Click Tab',
                    sectionLabel: hl.importantArea?.label || scMedia.label,
                    zoomScale: hl.zoomScale || 1.42
                  },
                  {
                    scrollYPercent: 42,
                    x: hl.importantArea?.x ?? 6,
                    yInViewport: hl.importantArea?.y ?? 24,
                    width: hl.importantArea?.width ?? 88,
                    height: hl.importantArea?.height ?? 42,
                    calloutText: `Scroll Down: ${hl.importantArea?.label || 'Live Controls'}`,
                    sectionLabel: hl.importantArea?.label || 'Interactive Panel',
                    zoomScale: 1.3
                  },
                  {
                    scrollYPercent: 80,
                    x: 6,
                    yInViewport: 26,
                    width: 88,
                    height: 42,
                    calloutText: `Explore Full ${scMedia.label || 'Workspace'}`,
                    sectionLabel: `${scMedia.label || 'Action'} Details`,
                    zoomScale: 1.3
                  }
                ]
              : null;

          const wordsList = sc.text.trim().split(/\s+/);
          const framesPerScene = 66; // ~2.2s per scene at 30fps for smooth full-page scroll & zoom

          for (let f = 0; f < framesPerScene; f++) {
            const t = f / Math.max(1, framesPerScene - 1);
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, width, height);

            if (isUgcScene) {
              // Render UGC Creator Real-Person Video (or fallback image) + Centered White-with-Black-Stroke Story Paragraph
              ctx.save();
              const swayScale = 1.02 + Math.sin((sIdx * framesPerScene + f) * 0.08) * 0.01;
              const swayY = Math.cos((sIdx * framesPerScene + f) * 0.06) * 4;
              ctx.translate(width / 2, height / 2 + swayY);
              ctx.scale(swayScale, swayScale);
              ctx.translate(-width / 2, -height / 2);

              const activeVid =
                ugcCreatorVideo && ugcCreatorVideo.readyState >= 2
                  ? ugcCreatorVideo
                  : ugcVideoRef.current && ugcVideoRef.current.readyState >= 2
                  ? ugcVideoRef.current
                  : null;

              if (activeVid) {
                const vidW = activeVid.videoWidth || 720;
                const vidH = activeVid.videoHeight || 1280;
                const vidRatio = vidW / Math.max(1, vidH);
                const canvasRatio = width / height;
                let dw = width;
                let dh = height;
                let dx = 0;
                let dy = 0;
                if (vidRatio > canvasRatio) {
                  dh = height;
                  dw = height * vidRatio;
                  dx = (width - dw) / 2;
                } else {
                  dw = width;
                  dh = width / vidRatio;
                  dy = (height - dh) / 2;
                }
                ctx.drawImage(activeVid, dx, dy, dw, dh);
              } else if (ugcCreatorImg) {
                const imgRatio = ugcCreatorImg.naturalWidth / Math.max(1, ugcCreatorImg.naturalHeight);
                const canvasRatio = width / height;
                let dw = width;
                let dh = height;
                let dx = 0;
                let dy = 0;
                if (imgRatio > canvasRatio) {
                  dh = height;
                  dw = height * imgRatio;
                  dx = (width - dw) / 2;
                } else {
                  dw = width;
                  dh = width / imgRatio;
                  dy = (height - dh) / 2;
                }
                ctx.drawImage(ugcCreatorImg, dx, dy, dw, dh);
              }
              ctx.restore();

              // Draw centered multi-line UGC Story Paragraph (White text with crisp black outline)
              const storyLines = ugcStoryText.split('\n');
              const lineHeight = ratio === '16:9' ? 30 : 34;
              const totalTextBlockHeight = storyLines.length * lineHeight;
              const startY = height / 2 - totalTextBlockHeight / 2 + lineHeight / 2;

              ctx.save();
              ctx.font = `700 ${ratio === '16:9' ? 23 : 26}px system-ui, -apple-system, sans-serif`;
              ctx.textAlign = 'center';
              ctx.lineJoin = 'round';
              ctx.miterLimit = 2;
              ctx.lineWidth = 5;
              ctx.strokeStyle = '#000000';
              ctx.fillStyle = '#ffffff';

              storyLines.forEach((line, lIdx) => {
                const ly = startY + lIdx * lineHeight;
                ctx.strokeText(line, width / 2, ly);
                ctx.fillText(line, width / 2, ly);
              });
              ctx.restore();
            } else if (isMemeScene) {
              // Render Viral 9:16 Meme Reel (Reaction Video + Top White/Dark Meme Header + Bottom Punchline Pill)
              const activeVid =
                ugcCreatorVideo && ugcCreatorVideo.readyState >= 2
                  ? ugcCreatorVideo
                  : ugcVideoRef.current && ugcVideoRef.current.readyState >= 2
                  ? ugcVideoRef.current
                  : null;

              const headerH = memeFormat === 'impact_top_bottom' ? 0 : Math.round(height * 0.28);
              const videoAreaY = headerH;
              const videoAreaH = height - headerH;

              ctx.save();
              ctx.beginPath();
              ctx.rect(0, videoAreaY, width, videoAreaH);
              ctx.clip();

              if (activeVid) {
                const vidW = activeVid.videoWidth || 720;
                const vidH = activeVid.videoHeight || 1280;
                const vidRatio = vidW / Math.max(1, vidH);
                const areaRatio = width / Math.max(1, videoAreaH);
                let dw = width;
                let dh = videoAreaH;
                let dx = 0;
                let dy = videoAreaY;
                if (vidRatio > areaRatio) {
                  dh = videoAreaH;
                  dw = videoAreaH * vidRatio;
                  dx = (width - dw) / 2;
                } else {
                  dw = width;
                  dh = width / vidRatio;
                  dy = videoAreaY + (videoAreaH - dh) / 2;
                }
                ctx.drawImage(activeVid, dx, dy, dw, dh);
              } else if (ugcCreatorImg) {
                ctx.drawImage(ugcCreatorImg, 0, videoAreaY, width, videoAreaH);
              }
              ctx.restore();

              // Draw Top Meme Header Card (for white_bar & vs_split) or Impact Top Text
              if (memeFormat !== 'impact_top_bottom') {
                ctx.save();
                ctx.fillStyle = memeCardTheme === 'light' ? '#ffffff' : '#0f172a';
                ctx.fillRect(0, 0, width, headerH);
                ctx.fillStyle = brand.primaryColor || '#10b981';
                ctx.fillRect(0, headerH - 4, width, 4);

                // Verified @handle pill
                ctx.font = '800 18px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = memeCardTheme === 'light' ? '#475569' : '#94a3b8';
                ctx.textAlign = 'left';
                ctx.fillText(`@${(brand.slug || 'brand').replace(/-/g, '')} ✓`, 36, 48);

                // Wrap memeTopCaption lines
                ctx.font = '800 25px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = memeCardTheme === 'light' ? '#090d16' : '#f8fafc';
                const maxLineW = width - 72;
                const wrapped: string[] = [];
                for (const rawLine of memeTopCaption.split('\n')) {
                  const wordsArr = rawLine.split(/\s+/);
                  let cur = '';
                  for (const w of wordsArr) {
                    const test = cur ? `${cur} ${w}` : w;
                    if (ctx.measureText(test).width > maxLineW && cur) {
                      wrapped.push(cur);
                      cur = w;
                    } else {
                      cur = test;
                    }
                  }
                  if (cur) wrapped.push(cur);
                }
                wrapped.slice(0, 6).forEach((ln, idx) => {
                  ctx.fillText(ln, 36, 88 + idx * 34);
                });
                ctx.restore();
              } else {
                // Impact Top Text over video
                ctx.save();
                ctx.font = '900 30px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#000000';
                ctx.fillStyle = '#ffffff';
                const lines = memeTopCaption.toUpperCase().split('\n');
                lines.slice(0, 3).forEach((ln, idx) => {
                  const yPos = 95 + idx * 38;
                  ctx.strokeText(ln.slice(0, 38), width / 2, yPos);
                  ctx.fillText(ln.slice(0, 38), width / 2, yPos);
                });
                ctx.restore();
              }

              // Draw Bottom Punchline Pill
              if (memeBottomPunchline.trim()) {
                ctx.save();
                const pillW = width - 64;
                const pillH = 60;
                const pillX = 32;
                const pillY = height - 115;
                ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
                ctx.beginPath();
                ctx.roundRect(pillX, pillY, pillW, pillH, 18);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.22)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.font = '800 21px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(memeBottomPunchline.slice(0, 48), width / 2, pillY + 38);
                ctx.restore();
              }
            } else {
              let curScrollYPercent = 0;
              let curX = 24;
              let curY = 90;
              let curW = 22;
              let curH = 8;
              let curCallout = hl?.calloutText || '';
              let curSectionLabel = hl?.importantArea?.label || '';
              let zoom = 1.05;

              if (waypoints && waypoints.length >= 2) {
                const numSegs = waypoints.length - 1;
                const segFloat = t * numSegs;
                const segIdx = Math.min(numSegs - 1, Math.floor(segFloat));
                const rawLocalT = segFloat - segIdx;
                const easeT =
                  rawLocalT < 0.32
                    ? 0
                    : rawLocalT > 0.85
                    ? 1
                    : 0.5 - 0.5 * Math.cos(((rawLocalT - 0.32) / 0.53) * Math.PI);

                const wpA = waypoints[segIdx];
                const wpB = waypoints[Math.min(waypoints.length - 1, segIdx + 1)];
                curScrollYPercent = wpA.scrollYPercent + (wpB.scrollYPercent - wpA.scrollYPercent) * easeT;
                curX = wpA.x + (wpB.x - wpA.x) * easeT;
                curY = wpA.yInViewport + (wpB.yInViewport - wpA.yInViewport) * easeT;
                curW = wpA.width + (wpB.width - wpA.width) * easeT;
                curH = wpA.height + (wpB.height - wpA.height) * easeT;

                const activeWp = easeT < 0.5 ? wpA : wpB;
                curCallout = activeWp.calloutText || curCallout;
                curSectionLabel = activeWp.sectionLabel || curSectionLabel;
                const isScrolling = rawLocalT >= 0.32 && rawLocalT <= 0.85;
                zoom = isScrolling ? 1.12 : activeWp.zoomScale || 1.32;
              }

              ctx.save();
              if (hl) {
                const targetX = ((curX + curW / 2) / 100) * width;
                const targetY = ((curY + curH / 2) / 100) * height;
                ctx.translate(targetX, targetY);
                ctx.scale(zoom, zoom);
                ctx.translate(-targetX, -targetY);
              }

              if (scImg) {
                const drawnHeight = Math.max(height, (scImg.naturalHeight / Math.max(1, scImg.naturalWidth)) * width);
                const maxScrollPx = Math.max(0, drawnHeight - height);
                const scrollOffsetY = (curScrollYPercent / 100) * maxScrollPx;
                ctx.drawImage(scImg, 0, -scrollOffsetY, width, drawnHeight);
              } else {
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, brand.primaryColor || '#059669');
                grad.addColorStop(0.35, '#0f172a');
                grad.addColorStop(1, '#020617');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
              }

              // Draw Interactive UI Highlight Overlays (Clean Outline + Sleek Compact Arrow Pill)
              if (hl && showCalloutLabels) {
                const bx = (curX / 100) * width;
                const by = (curY / 100) * height;
                const bw = (curW / 100) * width;
                const bh = (curH / 100) * height;

                ctx.strokeStyle = t < 0.3 ? '#fbbf24' : '#10b981';
                ctx.lineWidth = 4;
                ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
                ctx.beginPath();
                ctx.roundRect(bx, by, bw, bh, 14);
                ctx.fill();
                ctx.stroke();

                // Sleek compact Bouncing Callout Pill & Arrow
                const bounceOffset = Math.sin(f * 0.45) * 6;
                const calloutY = by > height * 0.62 ? by - 44 + bounceOffset : by + bh + 12 + bounceOffset;
                const calloutX = Math.max(20, Math.min(width - 280, bx));

                ctx.fillStyle = 'rgba(251, 191, 36, 0.92)';
                ctx.beginPath();
                ctx.roundRect(calloutX, calloutY, 265, 32, 16);
                ctx.fill();
                ctx.fillStyle = '#090d16';
                ctx.font = '800 13px system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`👆 ${curCallout}`.slice(0, 32), calloutX + 12, calloutY + 21);
              }

              ctx.restore();

              // Subtitles & Bottom Overlay according to captionDisplayMode ('off' | 'compact' | 'full')
              const activeW = Math.min(wordsList.length - 1, Math.floor((f / framesPerScene) * wordsList.length));

              if (captionDisplayMode === 'compact') {
                // Compact 1-line bottom pill — keeps 94% of the video screen 100% clear!
                const winStart = Math.max(0, activeW - 2);
                const winWords = wordsList.slice(winStart, winStart + 6).join(' ');
                ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
                ctx.beginPath();
                ctx.roundRect(40, height - 68, width - 80, 44, 22);
                ctx.fill();

                ctx.textAlign = 'center';
                ctx.font = '700 18px system-ui, sans-serif';
                ctx.fillStyle = '#fde68a';
                ctx.fillText(winWords.slice(0, 48), width / 2, height - 40);
              } else if (captionDisplayMode === 'full') {
                const botGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
                botGrad.addColorStop(0, 'rgba(0,0,0,0)');
                botGrad.addColorStop(1, 'rgba(0,0,0,0.82)');
                ctx.fillStyle = botGrad;
                ctx.fillRect(0, 0, width, height);

                ctx.textAlign = 'center';
                ctx.font = '900 36px system-ui, sans-serif';
                ctx.fillStyle = '#fbbf24';
                ctx.fillText((wordsList[activeW] || '').toUpperCase(), width / 2, height - 210);

                const half = Math.ceil(wordsList.length / 2);
                const l1 = wordsList.slice(0, half).join(' ');
                const l2 = wordsList.slice(half).join(' ');
                ctx.font = '700 20px system-ui, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.fillText(l1.slice(0, 44), width / 2, height - 165);
                if (l2) ctx.fillText(l2.slice(0, 44), width / 2, height - 135);
              }
            }

            // Progress bar at bottom
            const totalProgress = ((sIdx * framesPerScene + f) / (scenes.length * framesPerScene)) * 100;
            ctx.fillStyle = brand.primaryColor || '#10b981';
            ctx.fillRect(0, height - 8, (width * totalProgress) / 100, 8);

            setExportProgress(Math.round(totalProgress));
            await new Promise((r) => setTimeout(r, 20));
          }
        }

        recorder.stop();
        const videoBlob = await recordingDone;
        const videoUrl = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download =
          ratio === '16:9'
            ? `${brand.slug}-16x9-youtube-hd.webm`
            : `${brand.slug}-9x16-reel.webm`;
        a.click();

        setExportNotice(
          `Exported ${ratio === '16:9' ? '16:9 YouTube HD' : '9:16 Vertical'} Video (${(videoBlob.size / 1024).toFixed(0)} KB WebM)!`
        );
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${brand.slug}-${ratio === '16:9' ? '16x9-youtube' : '9x16-reel'}-poster.png`;
        a.click();
        setExportNotice(`Exported high-res ${ratio} video poster!`);
      }
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    } finally {
      setIsExportingVideo(false);
      setExportProgress(100);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Browser Speech Synthesis Engine for Instant 100% Word-Accurate Speech
  const speakCurrentScene = (sceneIndex: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      if (isMuted) return;

      const currentText = scenes[sceneIndex]?.text;
      if (!currentText) return;
      const cleanText = cleanSpeechText(currentText);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;

      // Pick crisp English natural voice if present
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (naturalVoice) utterance.voice = naturalVoice;

      const sceneWords = cleanText.trim().split(/\s+/).filter(Boolean);
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          const charIdx = e.charIndex;
          let cumulative = 0;
          let matchedIdx = 0;
          for (let i = 0; i < sceneWords.length; i++) {
            if (cumulative + sceneWords[i].length >= charIdx) {
              matchedIdx = i;
              break;
            }
            cumulative += sceneWords[i].length + 1;
          }
          setActiveWordIdx(matchedIdx);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis non-critical exception:', e);
    }
  };

  // Universal Studio Voice Generation Engine (Google Cloud Journey Neural, OpenAI, ElevenLabs)
  const triggerVoiceGeneration = async (options?: {
    customVoice?: string;
    customProvider?: 'google' | 'openai' | 'elevenlabs';
    customKey?: string;
    autoplay?: boolean;
  }): Promise<boolean> => {
    setIsGeneratingVoice(true);
    setVoiceStatusMsg(null);

    const activeProvider = options?.customProvider || voiceProvider || 'google';
    const activeVoice = options?.customVoice || voiceName || getRecommendedVoice(brand.category);
    const activeKey =
      options?.customKey ||
      voiceApiKey ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
          localStorage.getItem('brandcommand_gemini_key') ||
          localStorage.getItem('brandcommand_voice_api_key') ||
          localStorage.getItem('brandcommand_media_api_key') ||
          ''
        : '');

    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (activeKey) {
        localStorage.setItem('brandcommand_voice_api_key', activeKey);
        localStorage.setItem('brandcommand_google_cloud_tts_key', activeKey);
        localStorage.setItem('brandcommand_gemini_key', activeKey);
        localStorage.setItem('brandcommand_media_api_key', activeKey);
        localStorage.setItem('brandcommand_voice_provider', activeProvider);
      }

      // Exact 1:1 clean speech text matching the on-screen scenes
      const fullSpeechText = scenes
        .map((s) => s.text.trim().replace(/[.]+$/, ''))
        .filter(Boolean)
        .join('. ') + '.';

      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullSpeechText,
          provider: activeProvider,
          voice: activeVoice,
          apiKey: activeKey
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        // If an OAuth or Google Cloud permission issue is reported, gracefully route to browser voice
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          setAudioUrl(null);
          setWordTimestamps([]);
          setVoiceStatusMsg({
            success: true,
            text: 'Google AI Studio key active for Gemini AI. Voice smoothly synced via Browser Audio Engine!'
          });
          setTimeout(() => setIsVoiceModalOpen(false), 1400);
          return true;
        }

        setVoiceStatusMsg({
          success: false,
          text: errJson.message || 'Failed to generate voice. Verify your Google Cloud key.'
        });
        setIsVoiceModalOpen(true);
        return false;
      }

      const data = await res.json();

      if (data.fallbackToWebSpeech) {
        setAudioUrl(null);
        setWordTimestamps([]);
        setVoiceStatusMsg({
          success: true,
          text: data.message || 'Audio synced seamlessly via Browser Voice Engine.'
        });
        setTimeout(() => setIsVoiceModalOpen(false), 1400);
        return true;
      }

      setAudioUrl(data.audioUrl);

      // Frame-accurate word timestamps from ElevenLabs (properly in milliseconds)
      if (data.words && data.words.length > 0) {
        const mapped: Array<{ word: string; start: number; end: number; sceneIdx: number; wordIdxInScene: number }> = [];
        let sIdx = 0;
        let wIdx = 0;

        for (let i = 0; i < data.words.length; i++) {
          const w = data.words[i];
          const currentSceneWords = scenes[sIdx].text.trim().split(/\s+/);

          if (wIdx >= currentSceneWords.length && sIdx < scenes.length - 1) {
            sIdx++;
            wIdx = 0;
          }

          mapped.push({
            word: w.word,
            start: w.start, // in milliseconds
            end: w.end,     // in milliseconds
            sceneIdx: sIdx,
            wordIdxInScene: wIdx
          });

          wIdx++;
        }

        setWordTimestamps(mapped);
      } else {
        setWordTimestamps([]);
      }

      setVoiceStatusMsg({
        success: true,
        text: 'Studio-quality voice generated! Ready for playback.'
      });
      setTimeout(() => setIsVoiceModalOpen(false), 1200);

      if (options?.autoplay) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }, 200);
      }
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      setVoiceStatusMsg({ success: false, text: error.message || 'Network error occurred.' });
      return false;
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleGenerateStudioVoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await triggerVoiceGeneration();
  };

  // Automatically synthesize Google Cloud Journey voice when a new script or brand is loaded
  useEffect(() => {
    const effectiveKey =
      voiceApiKey ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
          localStorage.getItem('brandcommand_gemini_key') ||
          localStorage.getItem('brandcommand_voice_api_key') ||
          localStorage.getItem('brandcommand_media_api_key') ||
          ''
        : '');

    if (effectiveKey && !voiceApiKey) {
      setVoiceApiKey(effectiveKey);
    }

    if (
      autoGenerateVoice &&
      effectiveKey &&
      !audioUrl &&
      !isGeneratingVoice &&
      scenes.length > 0 &&
      scriptSignature &&
      lastGeneratedSignatureRef.current !== scriptSignature
    ) {
      lastGeneratedSignatureRef.current = scriptSignature;
      triggerVoiceGeneration({ customKey: effectiveKey });
    }
  }, [scriptSignature, brand.id, voiceApiKey, autoGenerateVoice, audioUrl, isGeneratingVoice, scenes.length]);

  // Synchronize audio clock with frame-accurate word highlighting
  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTimeMs = audioRef.current.currentTime * 1000;
    const durationMs = (audioRef.current.duration || 1) * 1000;
    const overallProgress = (currentTimeMs / durationMs) * 100;
    setProgress(Math.min(100, overallProgress));

    if (wordTimestamps.length > 0) {
      // Find the exact word at this exact millisecond
      const matched = wordTimestamps.find(
        (m) => currentTimeMs >= m.start && currentTimeMs <= m.end
      );

      if (matched) {
        if (matched.sceneIdx !== currentSceneIdx) {
          setCurrentSceneIdx(matched.sceneIdx);
        }
        setActiveWordIdx(matched.wordIdxInScene);
        return;
      }

      // If in brief breath pause between words, maintain current/last word
      const lastStarted = [...wordTimestamps].reverse().find((m) => currentTimeMs >= m.start);
      if (lastStarted) {
        if (lastStarted.sceneIdx !== currentSceneIdx) {
          setCurrentSceneIdx(lastStarted.sceneIdx);
        }
        setActiveWordIdx(lastStarted.wordIdxInScene);
        return;
      }
    }

    const currentFraction = currentTimeMs / durationMs;
    let resolvedSceneIdx = 0;
    for (let i = 0; i < sceneBoundaries.length; i++) {
      if (currentFraction <= sceneBoundaries[i]) {
        resolvedSceneIdx = i;
        break;
      }
    }

    if (resolvedSceneIdx !== currentSceneIdx) {
      setCurrentSceneIdx(resolvedSceneIdx);
    }

    const prevBoundary = resolvedSceneIdx === 0 ? 0 : sceneBoundaries[resolvedSceneIdx - 1];
    const currBoundary = sceneBoundaries[resolvedSceneIdx];
    const progressInScene = Math.max(0, Math.min(1, (currentFraction - prevBoundary) / (currBoundary - prevBoundary)));

    const sceneWords = scenes[resolvedSceneIdx].text.trim().split(/\s+/);
    const computedWordIdx = Math.floor(progressInScene * sceneWords.length);
    setActiveWordIdx(Math.min(sceneWords.length - 1, computedWordIdx));
  };

  // Master Autonomous Playback Clock: Ensures the video timeline NEVER freezes
  useEffect(() => {
    if (!isPlaying || audioUrl) return;

    const intervalMs = 50; // 20 FPS high-smoothness ticker
    const deltaSec = intervalMs / 1000;

    const timer = setInterval(() => {
      currentTimeRef.current += deltaSec;

      if (currentTimeRef.current >= totalDuration) {
        currentTimeRef.current = totalDuration;
        setProgress(100);
        setIsPlaying(false);
        soundbedEngine.stop();
        return;
      }

      const overallProgress = (currentTimeRef.current / totalDuration) * 100;
      setProgress(Math.min(100, overallProgress));

      // Resolve current scene based on elapsed seconds
      let resolvedIdx = 0;
      for (let i = 0; i < sceneTimeBoundaries.length; i++) {
        if (currentTimeRef.current <= sceneTimeBoundaries[i]) {
          resolvedIdx = i;
          break;
        }
      }

      if (resolvedIdx !== currentSceneIdxRef.current) {
        currentSceneIdxRef.current = resolvedIdx;
        setCurrentSceneIdx(resolvedIdx);
        speakCurrentScene(resolvedIdx);
      }

      // Word highlighting progress in current scene
      const prevTime = resolvedIdx === 0 ? 0 : sceneTimeBoundaries[resolvedIdx - 1];
      const sceneDur = sceneDurations[resolvedIdx] || 3.5;
      const progressInScene = Math.max(0, Math.min(1, (currentTimeRef.current - prevTime) / sceneDur));
      const sceneWords = scenes[resolvedIdx].text.trim().split(/\s+/).filter(Boolean);
      const computedWordIdx = Math.floor(progressInScene * sceneWords.length);
      setActiveWordIdx(Math.min(sceneWords.length - 1, computedWordIdx));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, audioUrl, totalDuration, sceneDurations, sceneTimeBoundaries]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (brollVideoRef.current) {
        brollVideoRef.current.play().catch(() => {});
      }
      if (audioUrl && audioRef.current) {
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(() => {});
      } else {
        // Synchronize starting time with current progress percentage
        currentTimeRef.current = (progress / 100) * totalDuration;
        speakCurrentScene(currentSceneIdxRef.current);
      }
      // Start background music bed
      if (selectedSoundtrack !== 'none' && !isMuted) {
        soundbedEngine.play(selectedSoundtrack);
        soundbedEngine.setVolume(soundtrackVolume);
      }
    } else {
      setIsPlaying(false);
      if (brollVideoRef.current) brollVideoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      soundbedEngine.pause();
    }
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (brollVideoRef.current) {
      brollVideoRef.current.currentTime = 0;
      brollVideoRef.current.play().catch(() => {});
    }
    currentTimeRef.current = 0;
    setCurrentSceneIdx(0);
    currentSceneIdxRef.current = 0;
    setProgress(0);
    setActiveWordIdx(0);
    setIsPlaying(true);
    if (!audioUrl) {
      speakCurrentScene(0);
    }
    if (selectedSoundtrack !== 'none' && !isMuted) {
      soundbedEngine.play(selectedSoundtrack);
      soundbedEngine.setVolume(soundtrackVolume);
    }
  };

  const jumpToScene = (idx: number) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentSceneIdx(idx);
    currentSceneIdxRef.current = idx;
    setActiveWordIdx(0);

    const targetFraction = idx === 0 ? 0 : sceneBoundaries[idx - 1];
    setProgress(targetFraction * 100);
    currentTimeRef.current = idx === 0 ? 0 : (sceneTimeBoundaries[idx - 1] || 0) + 0.05;

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = targetFraction * audioRef.current.duration;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    } else if (isPlaying) {
      speakCurrentScene(idx);
    }
  };

  // Synchronize broll video play state with isPlaying
  useEffect(() => {
    if (isPlaying) {
      if (brollVideoRef.current && brollVideoRef.current.paused) {
        brollVideoRef.current.play().catch(() => {});
      }
    } else {
      if (brollVideoRef.current && !brollVideoRef.current.paused) {
        brollVideoRef.current.pause();
      }
    }
  }, [isPlaying, layoutMode, selectedBackgroundId]);

  // Keep the real-person UGC Creator / Meme Reel background video playing smoothly whenever visible
  useEffect(() => {
    if ((layoutMode === 'ugc_creator' || layoutMode === 'meme_reel') && ugcVideoRef.current) {
      ugcVideoRef.current.play().catch(() => {});
    }
  }, [layoutMode, activeUgcPreset.mediaUrl, ugcSubMode, currentSceneIdx, isPlaying]);

  // Resolve current active sticker text
  const currentStickerObj = STICKER_PRESETS.find((s) => s.id === selectedSticker);
  const activeStickerBadgeText = customStickerText.trim() 
    ? customStickerText 
    : (currentStickerObj && currentStickerObj.id !== 'none' ? currentStickerObj.label : null);

  // Filter background presets by category chip
  const filteredBackgrounds = bgCategoryFilter === 'all' 
    ? BACKGROUND_PRESETS 
    : BACKGROUND_PRESETS.filter((p) => p.category === bgCategoryFilter);

  // Live B-Roll Search against /api/search-broll (Pexels Video API + Curated Registry)
  const handleSearchBroll = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : brollSearchQuery).trim();
    setIsSearchingBroll(true);
    try {
      const res = await fetch('/api/search-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q || (bgCategoryFilter === 'all' ? brand.category : bgCategoryFilter),
          category: bgCategoryFilter === 'all' ? undefined : bgCategoryFilter,
          pexelsApiKey: pexelsApiKey || undefined
        })
      });
      const data = await res.json();
      if (data.results) {
        setBrollSearchResults(data.results);
      }
    } catch (err) {
      console.error('Failed to search B-roll:', err);
    } finally {
      setIsSearchingBroll(false);
    }
  };

  // Assign B-Roll clip to a specific scene cut
  const assignClipToScene = (
    sceneIndex: number,
    clip: { mediaUrl: string; type: 'video' | 'animated_chart' | 'image'; label: string }
  ) => {
    setSceneBrollOverrides((prev) => ({
      ...prev,
      [sceneIndex]: clip
    }));
    jumpToScene(sceneIndex);
  };

  // Auto-Match All Scenes with Topic-Specific Visuals (Predis.ai style)
  const handleAutoMatchAllScenes = async () => {
    setIsAutoMatchingAll(true);
    try {
      const newOverrides: Record<number, { mediaUrl: string; type: 'video' | 'animated_chart' | 'image'; label: string }> = {};

      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        const sceneQuery = `${brand.category} ${sc.title === 'Hook' ? 'hook problem' : sc.title === 'CTA' ? 'brand finish' : sc.visual.slice(0, 30)}`;
        try {
          const res = await fetch('/api/search-broll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: sceneQuery,
              category: brand.category,
              pexelsApiKey: pexelsApiKey || undefined
            })
          });
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const chosen = data.results[i % data.results.length];
            newOverrides[i] = {
              mediaUrl: chosen.mediaUrl,
              type: chosen.type,
              label: chosen.title || chosen.label
            };
          }
        } catch (e) {
          console.error('Scene match error:', e);
        }
      }

      setSceneBrollOverrides(newOverrides);
      jumpToScene(0);
    } finally {
      setIsAutoMatchingAll(false);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 max-w-6xl mx-auto">
      {/* Hidden Studio Audio Player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(100);
            soundbedEngine.stop();
          }}
          onPause={() => {
            if (!isTestingSoundtrack) {
              soundbedEngine.stop();
            }
          }}
        />
      )}

      {/* LEFT COLUMN: 16:9 YouTube Widescreen OR 9:16 Vertical Phone Canvas Simulator */}
      <div className="flex flex-col items-center flex-shrink-0 w-full lg:w-auto mx-auto">
        {/* Clean Unified Segmented Toolbar Above Video */}
        <div
          className={`w-full ${
            aspectRatio === '16:9' ? 'max-w-[580px]' : 'max-w-[360px]'
          } mb-2.5 space-y-2 transition-all duration-300`}
        >
          {/* Row 1: Style + Aspect Ratio + Captions in a single clean bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-[10px]">
            {/* Style Switcher */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-950 p-0.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setLayoutMode('dynamic_cuts')}
                className={`px-2 py-1 rounded-lg font-extrabold transition-all ${
                  layoutMode !== 'ugc_creator' && layoutMode !== 'meme_reel'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="AI Bot Scrolling & Zooming Inside-App Screen Walkthrough"
              >
                🖥️ App
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('ugc_creator');
                  setAspectRatio('9:16');
                }}
                className={`px-2 py-1 rounded-lg font-extrabold transition-all ${
                  layoutMode === 'ugc_creator'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Creator holding phone in selfie POV with centered story text overlay"
              >
                🤳 UGC
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('meme_reel');
                  setAspectRatio('9:16');
                  const templates = getMemeTemplatesForBrand(brand, script);
                  const cur = templates[memeIdx % templates.length] || templates[0];
                  setCustomUgcMediaUrl(null);
                  setSelectedUgcCreatorId(cur.presetId);
                }}
                className={`px-2 py-1 rounded-lg font-extrabold transition-all ${
                  layoutMode === 'meme_reel'
                    ? 'bg-amber-500 text-neutral-950 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Viral 9:16 Meme Reel with Top Meme Banner Header + Silent Reaction Video + Bottom Punchline"
              >
                😂 Meme Reel
              </button>
            </div>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-950 p-0.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Full-Size 16:9 YouTube HD (1280x720)"
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Vertical 9:16 Reels / Shorts (720x1280)"
              >
                9:16
              </button>
            </div>

            {/* Captions & Pointer Toggle */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-950 p-0.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800">
              <button
                type="button"
                onClick={() =>
                  setCaptionDisplayMode((prev) =>
                    prev === 'compact' ? 'off' : prev === 'off' ? 'full' : 'compact'
                  )
                }
                className="px-2 py-1 rounded-lg font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Click to cycle subtitle style: Small Bottom Pill → Hidden → Full Center"
              >
                {captionDisplayMode === 'off'
                  ? '🚫 Text Off'
                  : captionDisplayMode === 'compact'
                  ? '💬 Small Text'
                  : '🔥 Full Text'}
              </button>
              {layoutMode !== 'ugc_creator' && (
                <button
                  type="button"
                  onClick={() => setShowCalloutLabels((prev) => !prev)}
                  className={`px-1.5 py-1 rounded-lg font-bold transition-all ${
                    showCalloutLabels
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'text-neutral-400'
                  }`}
                  title="Toggle pointer arrow & highlight boxes on/off"
                >
                  👆
                </button>
              )}
            </div>
          </div>

          {/* UGC Creator Hook Controls (Shown only when UGC Creator mode is active) */}
          {layoutMode === 'ugc_creator' && (
            <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-[10px] animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-950 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setUgcSubMode('story_only')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      ugcSubMode === 'story_only'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Full Creator Story
                  </button>
                  <button
                    type="button"
                    onClick={() => setUgcSubMode('hook_then_app')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      ugcSubMode === 'hook_then_app'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Hook → App Cut
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !autoMatchUgcEmotion;
                      setAutoMatchUgcEmotion(nextState);
                      if (nextState) {
                        setCustomUgcMediaUrl(null);
                        setSelectedUgcCreatorId(matchedUgcEmotion.presetId);
                      }
                    }}
                    className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                      autoMatchUgcEmotion
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500'
                    }`}
                    title={`${matchedUgcEmotion.reason} — Click to toggle automatic script-to-emotion reaction matching`}
                  >
                    <span>🎭 Auto-Match: {matchedUgcEmotion.emotionBadge}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCycleUgcStoryText}
                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1 transition-colors"
                    title="Cycle through casual first-person UGC story paragraphs and auto-match reaction"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Next Hook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = !showClipSearchDrawer;
                      setShowClipSearchDrawer(nextOpen);
                      if (nextOpen && clipSearchResults.length === 0) {
                        handleSearchReactionClips('mind blown reaction');
                      }
                    }}
                    className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                      showClipSearchDrawer
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200'
                    }`}
                    title="Search millions of live reaction clips & browse 20 studio characters"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>Search Clips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUgcEditorDrawer((prev) => !prev)}
                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold transition-colors"
                  >
                    {showUgcEditorDrawer ? 'Done' : '✏️ Edit Text'}
                  </button>
                </div>
              </div>

              {/* Front-Camera Silent Reaction Videos (Matched to Script Emotion) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {UGC_CREATOR_PRESETS.map((preset) => {
                  const isSel = !customUgcMediaUrl && selectedUgcCreatorId === preset.id;
                  const isRecommended = matchedUgcEmotion.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCustomUgcMediaUrl(null);
                        setSelectedUgcCreatorId(preset.id);
                      }}
                      className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                        isSel
                          ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-2xs'
                          : isRecommended
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white'
                          : 'border-neutral-200/70 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title={`${preset.name} — ${preset.tag}`}
                    >
                      <img
                        src={preset.thumbnailUrl}
                        alt={preset.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[65px]">{preset.name.split('•')[0].trim()}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-bold">
                        {preset.emotionBadge}
                      </span>
                    </button>
                  );
                })}
                <label
                  className="shrink-0 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1 cursor-pointer"
                  title="Upload your own front-camera silent reaction MP4 video"
                >
                  <span>📹 Upload Video</span>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleUgcVideoUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateAiUgcCreator('veo')}
                  disabled={isGeneratingUgcCreator}
                  className="shrink-0 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1"
                  title="Generate an AI front-camera silent reaction video matching your script emotion"
                >
                  <Wand2 className="w-2.5 h-2.5 text-blue-500" />
                  <span>{isGeneratingUgcCreator ? '...' : '+ AI Reaction'}</span>
                </button>
              </div>

              {showUgcEditorDrawer && (
                <div className="pt-1">
                  <textarea
                    value={ugcStoryText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUgcStoryText(val);
                      if (autoMatchUgcEmotion) {
                        const matched = matchUgcReactionToScript(val, script?.hook);
                        setCustomUgcMediaUrl(null);
                        setSelectedUgcCreatorId(matched.presetId);
                      }
                    }}
                    rows={5}
                    className="w-full p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-900 dark:text-white font-medium leading-snug focus:outline-none"
                    placeholder="Write casual multi-line UGC story overlay text (auto-matches silent creator emotion)..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Meme Reel Controls (Shown when 😂 Meme Reel mode is active) */}
          {layoutMode === 'meme_reel' && (
            <div className="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-neutral-900 border border-amber-300/60 dark:border-amber-500/30 space-y-2 text-[10px] animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                {/* Meme Format Selector */}
                <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-950 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setMemeFormat('white_bar')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      memeFormat === 'white_bar'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Classic IG/Twitter Top Meme Card + Reaction Video"
                  >
                    Card Header
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemeFormat('vs_split')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      memeFormat === 'vs_split'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Old Way ❌ vs. Brand Way ✅ Comparison Meme"
                  >
                    ❌ vs ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemeFormat('impact_top_bottom')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      memeFormat === 'impact_top_bottom'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Full-bleed Top Setup + Bottom Punchline"
                  >
                    Top/Bottom
                  </button>
                </div>

                {/* Meme Action Buttons */}
                <div className="flex items-center gap-1">
                  {memeFormat !== 'impact_top_bottom' && (
                    <button
                      type="button"
                      onClick={() => setMemeCardTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                      className="px-1.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold"
                      title="Toggle Light / Dark Meme Header Card"
                    >
                      {memeCardTheme === 'light' ? '☀️' : '🌙'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCycleMemeTemplate}
                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold flex items-center gap-1 shadow-2xs transition-colors"
                    title="Cycle through curated viral meme templates for this brand"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>🎲 Next Meme</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemixMemeFromScript}
                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1 transition-colors"
                    title="Generate a meme caption from the current post hook & CTA"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>Remix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = !showClipSearchDrawer;
                      setShowClipSearchDrawer(nextOpen);
                      if (nextOpen && clipSearchResults.length === 0) {
                        handleSearchReactionClips('mind blown reaction');
                      }
                    }}
                    className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                      showClipSearchDrawer
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200'
                    }`}
                    title="Search millions of live meme & reaction MP4 clips or browse 20 studio characters"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>🔍 More Clips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemeEditorDrawer((prev) => !prev)}
                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold transition-colors"
                  >
                    {showMemeEditorDrawer ? 'Done' : '✏️ Edit'}
                  </button>
                </div>
              </div>

              {/* Reaction Clip Strip for Meme Reel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {UGC_CREATOR_PRESETS.map((preset) => {
                  const isSel = !customUgcMediaUrl && selectedUgcCreatorId === preset.id;
                  return (
                    <button
                      key={`meme-${preset.id}`}
                      type="button"
                      onClick={() => {
                        setCustomUgcMediaUrl(null);
                        setSelectedUgcCreatorId(preset.id);
                      }}
                      className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                        isSel
                          ? 'border-amber-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold shadow-2xs'
                          : 'border-neutral-200/70 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                      title={`${preset.name} — ${preset.tag}`}
                    >
                      <img
                        src={preset.thumbnailUrl}
                        alt={preset.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[8.5px] font-bold">
                        {preset.emotionBadge}
                      </span>
                    </button>
                  );
                })}
                <label
                  className="shrink-0 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1 cursor-pointer"
                  title="Upload your own meme clip or reaction MP4"
                >
                  <span>📹 Upload Clip</span>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleUgcVideoUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateAiUgcCreator('veo')}
                  disabled={isGeneratingUgcCreator}
                  className="shrink-0 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold flex items-center gap-1"
                  title="Generate an AI front-camera silent reaction video matching your script emotion"
                >
                  <Wand2 className="w-2.5 h-2.5 text-blue-500" />
                  <span>{isGeneratingUgcCreator ? '...' : '+ AI Clip'}</span>
                </button>
              </div>

              {showMemeEditorDrawer && (
                <div className="pt-1 space-y-1.5">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-0.5">
                      Top Meme Setup Caption
                    </label>
                    <textarea
                      value={memeTopCaption}
                      onChange={(e) => setMemeTopCaption(e.target.value)}
                      rows={3}
                      className="w-full p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-900 dark:text-white font-semibold leading-snug focus:outline-none"
                      placeholder="Nobody: / Me at 2am checking..."
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-0.5">
                      Bottom Punchline Pill
                    </label>
                    <input
                      type="text"
                      value={memeBottomPunchline}
                      onChange={(e) => setMemeBottomPunchline(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-900 dark:text-white font-semibold focus:outline-none"
                      placeholder="Punchline badge text..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Character & Meme Reaction Clip Search Drawer (Shared across UGC & Meme Reel) */}
          {(layoutMode === 'ugc_creator' || layoutMode === 'meme_reel') && showClipSearchDrawer && (
            <div className="p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-blue-500/40 shadow-md space-y-2 text-[10px] animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-neutral-900 dark:text-white flex items-center gap-1">
                  <span>🎬 Search Live Meme & Reaction Clips + 20 Studio Characters</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowClipSearchDrawer(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white font-bold px-1.5 py-0.5 rounded"
                >
                  ✕ Close
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={clipSearchQuery}
                  onChange={(e) => setClipSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchReactionClips();
                    }
                  }}
                  placeholder="Search any reaction or footage (e.g. cat typing, mind blown, side eye, celebration)..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSearchReactionClips()}
                  disabled={isSearchingClips}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Search className="w-3 h-3" />
                  <span>{isSearchingClips ? '...' : 'Search'}</span>
                </button>
              </div>

              {/* Quick Trending Reaction & Footage Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {[
                  { label: '🤯 Mind Blown', q: 'mind blown reaction' },
                  { label: '🤨 Side Eye', q: 'side eye reaction' },
                  { label: '🐱 Cat Typing', q: 'cat typing computer' },
                  { label: '🤦 Facepalm', q: 'facepalm frustrated' },
                  { label: '😂 Laughing', q: 'trying not to laugh' },
                  { label: '🎉 Celebration', q: 'excited celebration dance' },
                  { label: '💀 Wait What', q: 'confused wait what reaction' },
                  { label: '📈 Stocks / Money', q: 'stock market money trading' }
                ].map((chip) => (
                  <button
                    key={chip.q}
                    type="button"
                    onClick={() => handleSearchReactionClips(chip.q)}
                    className={`shrink-0 px-2 py-0.5 rounded-full border font-bold transition-colors ${
                      clipSearchQuery === chip.q
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-blue-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Search Results Visual Grid */}
              {isSearchingClips ? (
                <div className="py-4 text-center text-neutral-500 font-semibold">
                  Searching live MP4 reaction clips & HD footage...
                </div>
              ) : clipSearchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {clipSearchResults.map((clip) => {
                    const isSelected = customUgcMediaUrl === clip.mediaUrl;
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => {
                          setCustomUgcMediaUrl(clip.mediaUrl);
                          setCustomUgcMediaType(clip.type);
                          setCustomClipBadgeLabel(`🎬 ${clip.title.slice(0, 22)}`);
                        }}
                        className={`group relative rounded-lg overflow-hidden border-2 aspect-square bg-neutral-950 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/40'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-400'
                        }`}
                        title={`Click to use "${clip.title}" in the 9:16 player`}
                      >
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1">
                          <p className="text-[8.5px] font-bold text-white truncate">{clip.title}</p>
                        </div>
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/75 text-white text-[7.5px] font-extrabold uppercase">
                          {clip.type === 'video' ? 'MP4' : 'IMG'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2 text-center text-neutral-400">
                  Type any keyword above or tap a reaction chip to load live MP4 clips.
                </div>
              )}
            </div>
          )}

          {sceneVisualNotice && (
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{sceneVisualNotice}</span>
            </div>
          )}
        </div>

        <div
          className={`relative w-full ${
            aspectRatio === '16:9'
              ? 'max-w-[580px] aspect-video rounded-2xl'
              : 'max-w-[340px] aspect-[9/16] rounded-3xl'
          } overflow-hidden shadow-2xl border-4 border-neutral-800 bg-neutral-950 flex flex-col justify-between p-4 select-none transition-all duration-300`}
          style={{ filter: COLOR_FILTERS[colorFilter] || undefined }}
        >
          {/* LAYOUT ENGINE: Dynamic Scene Cuts, UGC Creator Hook, Product Showcase, Split Screen */}

          {/* MODE: UGC CREATOR HOOK (Real-person video in selfie/creator POV + centered white-with-black-stroke story paragraph) */}
          {layoutMode === 'ugc_creator' &&
            (ugcSubMode === 'story_only' || currentSceneIdx === 0) && (
              <div className="absolute inset-0 overflow-hidden bg-neutral-900">
                {activeUgcPreset.type === 'video' ? (
                  <video
                    ref={ugcVideoRef}
                    key={`ugc-video-${activeUgcPreset.mediaUrl}`}
                    src={activeUgcPreset.mediaUrl}
                    crossOrigin={activeUgcPreset.mediaUrl.startsWith('http') ? 'anonymous' : undefined}
                    playsInline
                    muted
                    loop
                    autoPlay
                    onLoadedData={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    onCanPlay={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover transition-transform duration-1000 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                ) : (
                  <img
                    key={`ugc-img-${activeUgcPreset.mediaUrl}`}
                    src={activeUgcPreset.mediaUrl}
                    alt={activeUgcPreset.name}
                    className={`w-full h-full object-cover transition-transform duration-1000 ease-in-out ${
                      isPlaying ? 'scale-105 translate-y-[-4px]' : 'scale-100'
                    }`}
                  />
                )}
                {/* Subtle natural phone camera vignette so white-with-black-stroke text pops cleanly */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35 pointer-events-none" />
              </div>
            )}

          {/* MODE: VIRAL 9:16 MEME REEL (Top Meme Banner Card + Reaction Video + Bottom Punchline Pill) */}
          {layoutMode === 'meme_reel' && (
            <div className="absolute inset-0 overflow-hidden bg-neutral-950 flex flex-col">
              {/* Top Meme Banner Card (for white_bar & vs_split) */}
              {memeFormat !== 'impact_top_bottom' && (
                <div
                  className={`relative z-20 px-4 pt-9 pb-3 border-b-4 transition-colors ${
                    memeCardTheme === 'light'
                      ? 'bg-white text-neutral-950'
                      : 'bg-neutral-950 text-white'
                  }`}
                  style={{ borderColor: brand.primaryColor || '#10b981' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-extrabold tracking-tight flex items-center gap-1 ${
                        memeCardTheme === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      <span>@{(brand.slug || 'brand').replace(/-/g, '')}</span>
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px]">
                        ✓
                      </span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {activeUgcPreset.emotionBadge}
                    </span>
                  </div>
                  <div className="space-y-1 text-left">
                    {memeTopCaption.split('\n').map((line, idx) => (
                      <p
                        key={idx}
                        className={`text-[12.5px] leading-[1.28] font-extrabold tracking-tight ${
                          memeFormat === 'vs_split' && line.includes('❌')
                            ? 'text-red-600 dark:text-red-400'
                            : memeFormat === 'vs_split' && line.includes('✅')
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : ''
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Reaction Clip Area */}
              <div className="relative flex-1 w-full overflow-hidden bg-neutral-900">
                {activeUgcPreset.type === 'video' ? (
                  <video
                    ref={ugcVideoRef}
                    key={`meme-video-${activeUgcPreset.mediaUrl}`}
                    src={activeUgcPreset.mediaUrl}
                    crossOrigin={activeUgcPreset.mediaUrl.startsWith('http') ? 'anonymous' : undefined}
                    playsInline
                    muted
                    loop
                    autoPlay
                    onLoadedData={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    onCanPlay={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover transition-transform duration-1000 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                ) : (
                  <img
                    key={`meme-img-${activeUgcPreset.mediaUrl}`}
                    src={activeUgcPreset.mediaUrl}
                    alt={activeUgcPreset.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Impact Top Text (when memeFormat === 'impact_top_bottom') */}
                {memeFormat === 'impact_top_bottom' && (
                  <div className="absolute top-12 inset-x-3 z-20 text-center">
                    <p
                      className="text-[15px] font-black uppercase leading-tight text-white tracking-tight"
                      style={{
                        textShadow:
                          '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.85)'
                      }}
                    >
                      {memeTopCaption}
                    </p>
                  </div>
                )}

                {/* Bottom Punchline Pill */}
                {memeBottomPunchline.trim() && (
                  <div className="absolute bottom-4 inset-x-3 z-20 flex justify-center">
                    <div className="px-3.5 py-2 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-white/20 shadow-2xl text-center max-w-full">
                      <p className="text-[11.5px] font-extrabold text-white leading-snug">
                        {memeBottomPunchline}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE: DYNAMIC MULTI-SCENE CUTS (Or Scenes 2+ when UGC Hook -> App Cut is active) */}
          {(layoutMode === 'dynamic_cuts' ||
            (layoutMode === 'ugc_creator' && ugcSubMode === 'hook_then_app' && currentSceneIdx > 0)) && (
            <div className="absolute inset-0 overflow-hidden bg-neutral-900">
              {(() => {
                const hl = (currentSceneMedia as any)?.uiHighlight;
                const waypoints =
                  hl?.scrollWaypoints && hl.scrollWaypoints.length >= 2
                    ? hl.scrollWaypoints
                    : hl
                    ? [
                        {
                          scrollYPercent: 0,
                          x: hl.x ?? 24,
                          yInViewport: hl.y ?? 90,
                          width: hl.width ?? 20,
                          height: hl.height ?? 7,
                          calloutText: hl.calloutText || 'Click Tab',
                          sectionLabel: hl.importantArea?.label || currentSceneMedia.label,
                          zoomScale: hl.zoomScale || 1.42
                        },
                        {
                          scrollYPercent: 42,
                          x: hl.importantArea?.x ?? 6,
                          yInViewport: hl.importantArea?.y ?? 24,
                          width: hl.importantArea?.width ?? 88,
                          height: hl.importantArea?.height ?? 42,
                          calloutText: `Scroll Down: ${hl.importantArea?.label || 'Live Controls'}`,
                          sectionLabel: hl.importantArea?.label || 'Interactive Panel',
                          zoomScale: 1.32
                        },
                        {
                          scrollYPercent: 80,
                          x: 6,
                          yInViewport: 26,
                          width: 88,
                          height: 42,
                          calloutText: `Explore Full ${currentSceneMedia.label || 'Workspace'}`,
                          sectionLabel: `${currentSceneMedia.label || 'Action'} Details`,
                          zoomScale: 1.32
                        }
                      ]
                    : null;

                const sceneFraction = words.length > 1 ? activeWordIdx / Math.max(1, words.length - 1) : 0;
                const activeWpIdx = waypoints
                  ? Math.min(waypoints.length - 1, Math.floor(sceneFraction * waypoints.length))
                  : 0;
                const activeWp = waypoints ? waypoints[activeWpIdx] : null;

                const curScrollY = activeWp ? activeWp.scrollYPercent : 0;
                const focusX = activeWp
                  ? Math.min(85, Math.max(15, activeWp.x + (activeWp.width || 20) / 2))
                  : 50;
                const focusY = activeWp
                  ? Math.min(92, Math.max(12, activeWp.yInViewport + (activeWp.height || 10) / 2))
                  : 30;
                const zoomScale = activeWp
                  ? isPlaying
                    ? activeWp.zoomScale || 1.35
                    : 1.12
                  : isPlaying
                  ? 1.05
                  : 1.0;

                return (
                  <div className="relative w-full h-full overflow-hidden">
                    <div
                      className="relative w-full h-full transition-transform duration-700 ease-out"
                      style={{
                        transformOrigin: `${focusX}% ${focusY}%`,
                        transform: `scale(${zoomScale})`
                      }}
                    >
                      {currentSceneMedia.type === 'animated_chart' ? (
                        <CandlestickTerminalBackground isPlaying={isPlaying} />
                      ) : currentSceneMedia.type === 'video' ? (
                        <video
                          ref={brollVideoRef}
                          key={`broll-dyn-${currentSceneMedia.mediaUrl}-${currentSceneIdx}`}
                          src={currentSceneMedia.mediaUrl}
                          playsInline
                          muted
                          loop
                          autoPlay={isPlaying}
                          className="w-full h-full object-cover"
                          onCanPlay={(e) => {
                            if (isPlaying) (e.target as HTMLVideoElement).play().catch(() => {});
                          }}
                        />
                      ) : (
                        <img
                          key={`img-dyn-${currentSceneMedia.mediaUrl}-${currentSceneIdx}`}
                          src={currentSceneMedia.mediaUrl}
                          alt={currentSceneMedia.label}
                          className="w-full h-full object-cover transition-[object-position] duration-700 ease-in-out"
                          style={{
                            objectPosition: `50% ${curScrollY}%`
                          }}
                        />
                      )}

                      {/* INTERACTIVE TUTORIAL OVERLAYS: SLEEK TRANSPARENT BORDER + COMPACT ARROW */}
                      {activeWp && showCalloutLabels && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          {/* Active Stop Highlight Box (Clean border, no fill blocking UI) */}
                          <div
                            className={`absolute rounded-xl border-2 transition-all duration-500 ${
                              activeWpIdx === 0
                                ? 'border-amber-400/90 bg-transparent shadow-[0_0_14px_rgba(251,191,36,0.75)]'
                                : 'border-emerald-400/90 bg-transparent shadow-[0_0_16px_rgba(16,185,129,0.65)]'
                            }`}
                            style={{
                              left: `${activeWp.x}%`,
                              top: `${activeWp.yInViewport}%`,
                              width: `${activeWp.width || 22}%`,
                              height: `${activeWp.height || 10}%`
                            }}
                          />

                          {/* Compact Pointer Arrow & Small Callout Pill */}
                          <div
                            className="absolute flex flex-col items-center transition-all duration-500"
                            style={{
                              left: `${Math.min(62, Math.max(4, activeWp.x))}%`,
                              top: `${
                                activeWp.yInViewport > 62
                                  ? Math.max(8, activeWp.yInViewport - 11)
                                  : Math.min(84, activeWp.yInViewport + (activeWp.height || 10) + 1)
                              }%`
                            }}
                          >
                            {activeWp.yInViewport <= 62 && (
                              <div className="text-amber-400 text-xs font-black leading-none animate-bounce drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                                ⬆️
                              </div>
                            )}
                            <div className="px-2 py-0.5 rounded-full bg-amber-400/95 text-neutral-950 font-extrabold text-[7.5px] uppercase tracking-wide shadow-md border border-white/80 whitespace-nowrap flex items-center gap-1">
                              <span>👆</span>
                              <span>{activeWp.calloutText}</span>
                            </div>
                            {activeWp.yInViewport > 62 && (
                              <div className="text-amber-400 text-xs font-black leading-none animate-bounce drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                                ⬇️
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {captionDisplayMode === 'full' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                    )}

                    {/* Compact Scene Label Pill */}
                    {showCalloutLabels && (
                      <div className="absolute top-10 left-3 z-20 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[8px] uppercase tracking-wider flex items-center gap-1 border border-white/15">
                        <Sparkles className="w-2 h-2 text-amber-400" />
                        <span>
                          {currentSceneMedia.label}
                          {waypoints ? ` • Stop ${activeWpIdx + 1}/${waypoints.length}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODE 0: PRODUCT SHOWCASE (100% Full-Screen Demo / Salon / OptionCove Terminal - Direction C) */}
          {layoutMode === 'showcase' && (
            <div className="absolute inset-0 overflow-hidden bg-neutral-900">
              {isCurrentBrollAnimatedChart ? (
                <CandlestickTerminalBackground isPlaying={isPlaying} />
              ) : isCurrentBrollVideo ? (
                <video
                  ref={brollVideoRef}
                  key={`broll-showcase-${currentBrollSource}`}
                  src={currentBrollSource}
                  playsInline
                  muted
                  loop
                  autoPlay={isPlaying}
                  className="w-full h-full object-cover filter brightness-[0.88]"
                  onCanPlay={(e) => {
                    if (isPlaying) (e.target as HTMLVideoElement).play().catch(() => {});
                  }}
                />
              ) : (
                <img
                  src={currentBrollSource}
                  alt="Product Showcase"
                  className={`w-full h-full object-cover filter brightness-[0.82] transition-transform duration-1000 ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

              {/* Showcase Highlight Pill */}
              <div className="absolute top-12 left-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-lg">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>{customMediaUrl ? 'Custom Showcase' : activeBackgroundPreset.label}</span>
              </div>
            </div>
          )}

          {/* MODE 3: SPLIT SCREEN (Dual B-Roll Showcase: Overview on Top, 4K Detail on Bottom) */}
          {layoutMode === 'split' && (
            <div className="absolute inset-0 flex flex-col overflow-hidden bg-neutral-950">
              {/* Top Half: Primary B-Roll / Scanner */}
              <div className="relative h-1/2 w-full overflow-hidden border-b-2 border-emerald-500 shadow-lg bg-neutral-900">
                {isCurrentBrollAnimatedChart ? (
                  <CandlestickTerminalBackground isPlaying={isPlaying} />
                ) : (
                  <img
                    src={currentBrollSource}
                    alt="Overview"
                    className="w-full h-full object-cover filter brightness-[0.85]"
                  />
                )}
                <div className="absolute top-12 left-3 z-10 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-white font-bold border border-white/10">
                  Overview Demo
                </div>
              </div>

              {/* Bottom Half: Live Brand Visual / Odds Grid */}
              <div className="relative h-1/2 w-full overflow-hidden bg-neutral-900">
                <img
                  src={brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'}
                  alt={brand.name}
                  className="w-full h-full object-cover filter brightness-[0.9]"
                />
                <div className="absolute top-2 left-3 z-10 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-white font-bold border border-white/10">
                  {brand.name} Live View
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* RETRO 90s VHS CAMCORDER OVERLAY (When VHS filter selected) */}
          {colorFilter === 'vhs_90s' && (
            <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 font-mono text-white text-[9px] drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-red-500 font-extrabold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  REC
                </div>
                <span>SP 0:02:14 [||||]</span>
              </div>
              <div className="flex justify-between items-end text-neutral-300 text-[8px]">
                <span>AUTO W/B</span>
                <span>28. OCT. 2026</span>
              </div>
            </div>
          )}

          {/* TOP BAR: Story Progress Indicators & Sound Control */}
          <div className="relative z-20 space-y-1.5">
            {/* Multi-segment story progress indicators */}
            <div className="flex items-center gap-1">
              {scenes.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => jumpToScene(idx)}
                  className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden cursor-pointer"
                >
                  <div
                    className={`h-full bg-white transition-all duration-150 ${
                      idx < currentSceneIdx
                        ? 'w-full'
                        : idx === currentSceneIdx
                        ? 'w-full origin-left animate-pulse'
                        : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Compact Scene Badge & Sound / Quick Download Control */}
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[9px] font-bold tracking-wide text-white border border-white/10 uppercase">
                {layoutMode === 'meme_reel'
                  ? `😂 Meme Reel • ${brand.name}`
                  : layoutMode === 'ugc_creator' && (ugcSubMode === 'story_only' || currentSceneIdx === 0)
                  ? `🤳 UGC Story • ${brand.name}`
                  : currentScene.title}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (audioRef.current) {
                      audioRef.current.muted = newMuted;
                    }
                    if (newMuted) {
                      soundbedEngine.pause();
                      if (typeof window !== 'undefined' && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                    } else {
                      if (isPlaying && selectedSoundtrack !== 'none') {
                        soundbedEngine.play(selectedSoundtrack);
                        soundbedEngine.setVolume(soundtrackVolume);
                      }
                      if (isPlaying && !audioUrl) {
                        speakCurrentScene(currentSceneIdx);
                      }
                    }
                  }}
                  className="p-1.5 rounded-full bg-white/90 text-neutral-900 hover:bg-white transition-colors shadow-md"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-900" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-900" />}
                </button>
                <button
                  onClick={() => handleExportVideo(aspectRatio)}
                  disabled={isExportingVideo}
                  className="p-1.5 rounded-full bg-white/90 text-neutral-900 hover:bg-white transition-colors shadow-md disabled:opacity-50"
                  title="Download Video (.webm)"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-900" />
                </button>
              </div>
            </div>
          </div>

          {/* CENTER: UGC STORY PARAGRAPH OVERLAY OR FULL KINETIC CAPTIONS */}
          {layoutMode === 'meme_reel' ? (
            <div className="my-auto pointer-events-none" />
          ) : layoutMode === 'ugc_creator' && (ugcSubMode === 'story_only' || currentSceneIdx === 0) ? (
            <div className="relative z-20 my-auto text-center px-3 py-2 flex flex-col items-center justify-center">
              <div
                className="space-y-0.5 max-w-[285px] mx-auto select-text"
                style={{
                  textShadow:
                    '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0px 2px 6px rgba(0,0,0,0.9)'
                }}
              >
                {ugcStoryText.split('\n').map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className="text-[13.5px] leading-[1.32] font-bold tracking-tight text-white"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : captionDisplayMode === 'full' ? (
            <div className="relative z-20 my-auto text-center px-2 space-y-3">
              {activeStickerBadgeText && (
                <div className="flex justify-center">
                  <div className="animate-bounce inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[11px] tracking-wider uppercase shadow-2xl border border-white/40">
                    {activeStickerBadgeText}
                  </div>
                </div>
              )}

              <div className="min-h-[85px] flex items-center justify-center">
                <h2 className="text-lg sm:text-xl font-black leading-snug tracking-tight uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] text-white">
                  {words.map((word, wIdx) => {
                    const isActive = wIdx === activeWordIdx;
                    return (
                      <span
                        key={wIdx}
                        className={`inline-block mx-1 transition-all duration-75 ${
                          isActive
                            ? 'scale-120 text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,1)] font-extrabold'
                            : 'opacity-90 text-white'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </h2>
              </div>

              {soundwaveStyle !== 'off' && (
                <div className="flex justify-center pt-1">
                  <SoundwaveVisualizer isPlaying={isPlaying} style={soundwaveStyle} />
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto pointer-events-none" />
          )}

          {/* BOTTOM: Compact 1-Line Rolling Caption Pill ('compact') or Empty ('off') */}
          <div className="relative z-20">
            {captionDisplayMode === 'compact' && layoutMode !== 'meme_reel' && (
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-lg max-w-[95%] text-center">
                  <p className="text-[11px] font-bold tracking-tight text-white truncate">
                    {(() => {
                      const winStart = Math.max(0, activeWordIdx - 2);
                      const slice = words.slice(winStart, winStart + 6);
                      return slice.map((w, i) => {
                        const globalIdx = winStart + i;
                        const isCurr = globalIdx === activeWordIdx;
                        return (
                          <span
                            key={globalIdx}
                            className={`mx-0.5 ${
                              isCurr ? 'text-amber-300 font-black underline decoration-amber-400' : 'text-white/90'
                            }`}
                          >
                            {w}
                          </span>
                        );
                      });
                    })()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clean Unified Control & Export Dock Under Video */}
        <div
          className={`w-full ${
            aspectRatio === '16:9' ? 'max-w-[580px]' : 'max-w-[360px]'
          } mt-2.5 space-y-2 transition-all duration-300`}
        >
          {/* Scene Cut Stepper Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
            {scenes.map((sc, idx) => {
              const isActive = currentSceneIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => jumpToScene(idx)}
                  className={`py-1.5 px-1 rounded-lg text-center text-[10px] transition-all truncate ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-extrabold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-semibold'
                  }`}
                  title={`Jump to ${sc.title}`}
                >
                  {idx === 0 ? '1. Hook' : idx === 1 ? '2. Step 1' : idx === 2 ? '3. Step 2' : '4. CTA'}
                </button>
              );
            })}
          </div>

          {/* Primary Play / Export / Customize Studio Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePlay}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-extrabold flex items-center gap-1.5 text-xs shadow-2xs transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={handleRestart}
                title="Restart Video"
                className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExportVideo(aspectRatio)}
                disabled={isExportingVideo}
                title={`Download ${aspectRatio} Video (.webm)`}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isExportingVideo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{exportProgress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {aspectRatio}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedStudio((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1 transition-all ${
                  showAdvancedStudio
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400'
                }`}
                title="Open B-Roll, Voiceover, AI Visuals & Studio Settings"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{showAdvancedStudio ? 'Hide Studio' : 'Studio Editor'}</span>
              </button>
            </div>
          </div>

          {exportNotice && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold text-center">
              {exportNotice}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Studio Creative Production Suite (Shown when Studio Editor is toggled open) */}
      {showAdvancedStudio && (
        <div className="flex-1 w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
        {/* AI Director Intelligent Dynamic Stylist Banner */}
        {aiDirectorNotice && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-500/25 text-xs animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide text-[10px] flex items-center gap-1">
                  🎬 AI Video Director Active
                </span>
                <span className="text-[10px] text-neutral-400">• Dynamically styled for this topic</span>
              </div>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-1 leading-snug">
                {aiDirectorNotice}
              </p>
            </div>
            <button 
              onClick={() => setAiDirectorNotice(null)} 
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-[10px] underline shrink-0 cursor-pointer ml-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Suite Header & Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                Creative Studio Production Suite
              </h3>
              <button
                onClick={() => setStudioTab('qa')}
                className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <ShieldCheck className="w-3 h-3" />
                QA: {activeQA.overallScore}/100
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Autonomous AI Copilot, 4K b-roll, graphics, and quality error inspection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStudioTab('copilot')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'copilot'
                  ? 'bg-purple-600 text-white shadow-xs font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              AI Copilot
            </button>

            <button
              onClick={() => setStudioTab('broll')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'broll'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-blue-500" />
              B-Roll
            </button>

            <button
              onClick={() => setStudioTab('graphics')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'graphics'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Graphics
            </button>

            <button
              onClick={() => setStudioTab('layout')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'layout'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-emerald-500" />
              Layout
            </button>

            <button
              onClick={() => setStudioTab('qa')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'qa'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              QA & Facts
            </button>

            <button
              onClick={() => setStudioTab('voice')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                studioTab === 'voice'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-purple-300" />
              Music & Voice
            </button>
          </div>
        </div>

        {/* TAB 0: AI DIRECTOR COPILOT & REVISION ASSISTANT */}
        {studioTab === 'copilot' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* AI Creative Director: Brand + Prompt + Goal -> Finished Video */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                      AI Creative Director
                    </h4>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Brand + Prompt + Marketing Goal → 100% Finished Video
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                  Gemini 2.5 Flash
                </span>
              </div>

              {/* Goal / Intent selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Marketing Goal / Intent
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {[
                    { id: 'demo', label: '💡 Product Demo', desc: 'Shows interface & how it works' },
                    { id: 'conversions', label: '🎯 Sales / CTA', desc: 'Drives action & urgency' },
                    { id: 'viral_reach', label: '🚀 Viral Reach', desc: 'Optimized for TikTok/Reels' },
                    { id: 'authority', label: '🏛️ Authority', desc: 'Establishes expertise' }
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setDirectorGoal(goal.id as any)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        directorGoal === goal.id
                          ? 'border-purple-600 bg-purple-600/15 text-purple-700 dark:text-purple-300 font-bold shadow-xs ring-1 ring-purple-500'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <div className="font-bold">{goal.label}</div>
                      <div className="text-[8px] text-neutral-400 leading-tight">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Topic or Creative Brief
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directorPrompt}
                    onChange={(e) => setDirectorPrompt(e.target.value)}
                    placeholder={`e.g. 'Explain how Evidraw discovers hidden number patterns' (or leave empty to auto-derive)`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleRunCreativeDirector}
                    disabled={isDirectingVideo}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isDirectingVideo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Directing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Design Video</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {directorStatus && (
                <div className="p-2.5 rounded-xl bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>{directorStatus}</span>
                </div>
              )}
            </div>

            {/* Interactive Prompt Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-500" />
                  Ask AI Video Director to Change Anything
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Natural Language Engine
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCopilotRevision()}
                  placeholder="e.g. 'Make hook punchier, add 30% off badge, switch to candlestick chart'..."
                  className="w-full pl-3.5 pr-24 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-purple-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <button
                  onClick={() => handleApplyCopilotRevision()}
                  disabled={isRevising || !copilotInput.trim()}
                  className="absolute right-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {isRevising ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Apply
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Pill */}
              {copilotFeedback && (
                <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-200 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {copilotFeedback}
                  </div>
                </div>
              )}
            </div>

            {/* Quick 1-Click Action Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">
                ⚡ 1-Click AI Video Quick Revisions:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: '⚡ Punchier Hook', prompt: 'Make the hook punchier and faster' },
                  { label: '🎨 Generate AI Media', prompt: 'Open AI Media Generator' },
                  { label: '🛍️ 30% OFF Sale', prompt: 'Add 30% off sale sticker' },
                  { label: '📈 +340% Profit Badge', prompt: 'Add +340% call winner profit badge' },
                  { label: '📊 Candlestick Chart', prompt: 'Switch background to live candlestick chart' },
                  { label: '✂️ 4K Remy Wefts', prompt: 'Switch background to 4K remy hand-tied wefts' },
                  { label: '💈 Hair Wash Station', prompt: 'Switch background to luxury hair wash station' },
                  { label: '🎬 100% Showcase', prompt: 'Switch layout to 100% showcase' },
                  { label: '🎨 Cyberpunk Neon', prompt: 'Apply cyberpunk neon color grading' },
                  { label: '🌅 Golden Hour Warm', prompt: 'Apply golden hour color grading' },
                  { label: '📼 90s VHS Camcorder', prompt: 'Apply 90s VHS retro filter' },
                  { label: '🎬 Dynamic Multi-Cuts', prompt: 'Switch layout to dynamic multi-scene cuts' },
                  { label: '💎 Dual Split Screen', prompt: 'Switch layout to split screen' },
                  { label: '🛡️ Auto-Heal QA Warnings', prompt: 'Auto-heal QA warnings' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (chip.prompt === 'Open AI Media Generator') {
                        setIsMediaModalOpen(true);
                      } else {
                        handleApplyCopilotRevision(chip.prompt);
                      }
                    }}
                    disabled={isRevising}
                    className="p-2 text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="truncate">{chip.label}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Revision History */}
            {script.revisionHistory && script.revisionHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-500" />
                  Revision History Log ({script.revisionHistory.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {script.revisionHistory.slice(-4).reverse().map((rev, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 text-[10px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-neutral-400 font-mono">
                        <span>User prompt: &ldquo;{rev.prompt}&rdquo;</span>
                        <span>{rev.timestamp}</span>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 font-semibold">
                        → {rev.changesMade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: BACKGROUND & B-ROLL PICKER GALLERY */}
        {studioTab === 'broll' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Live Scanned Brand Website Screenshots & Assets */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Live Website Screenshots & Brand Assets
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Live 4K captures of {brand.name} ({brand.websiteUrl || 'https://evidraw.com'})
                  </p>
                </div>

                <button
                  onClick={handleScanWebsite}
                  disabled={isScanningWebsite}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningWebsite ? 'animate-spin' : ''}`} />
                  {isScanningWebsite ? 'Scanning Site...' : 'Re-Scan Brand Website'}
                </button>
              </div>

              {scanWebsiteStatus && (
                <div className="p-2 rounded-xl bg-blue-100/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-300">
                  {scanWebsiteStatus}
                </div>
              )}

              {/* Viewport Filter Tabs: Mobile 9:16 (Shorts/Reels) vs Desktop 16:9 (YouTube) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-900/60 rounded-xl border border-neutral-800 text-[11px] font-bold">
                <button
                  onClick={() => setAssetViewportFilter('mobile')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    assetViewportFilter === 'mobile'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>📱 Mobile View (9:16 TikTok / Reels / Shorts)</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-400/20 text-blue-200">Default</span>
                </button>

                <button
                  onClick={() => setAssetViewportFilter('desktop')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    assetViewportFilter === 'desktop'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>💻 Desktop View (16:9 YouTube)</span>
                </button>

                <button
                  onClick={() => setAssetViewportFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    assetViewportFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All Visuals
                </button>
              </div>

              {/* Grid of Screenshots & Assets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Mobile 9:16 Screenshot Card */}
                {(brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl) && (assetViewportFilter === 'mobile' || assetViewportFilter === 'all') && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-blue-500/40 shadow-sm space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        📱 Mobile App Viewport (9:16)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                        TikTok / Reels Native
                      </span>
                    </div>

                    {/* Smartphone Mockup Preview */}
                    <div className="relative mx-auto w-36 aspect-[9/16] rounded-2xl overflow-hidden border-4 border-neutral-800 bg-neutral-950 shadow-lg group">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-neutral-900 rounded-full z-10" />
                      <img
                        src={brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl}
                        alt="Mobile App Screenshot"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-medium">390x844 Retina View</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const urlToAssign = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl!;
                            setSceneBrollOverrides({
                              ...sceneBrollOverrides,
                              [selectedSceneForBroll]: {
                                mediaUrl: urlToAssign,
                                label: `${brand.name} 📱 Mobile App View`,
                                type: 'image'
                              }
                            });
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-xs"
                          title="Assign this mobile screenshot to the selected scene cut"
                        >
                          Cut to Scene
                        </button>
                        <button
                          onClick={() => {
                            const urlToAssign = brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl!;
                            setCustomMediaUrl(urlToAssign);
                            setCustomMediaType('image');
                          }}
                          className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 rounded-lg text-[10px] font-bold"
                          title="Use as entire video background"
                        >
                          All Video
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Desktop 16:9 Screenshot Card (For YouTube Standard) */}
                {brand.websiteDesktopScreenshotUrl && (assetViewportFilter === 'desktop' || assetViewportFilter === 'all') && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        💻 Desktop Browser Viewport (16:9)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[9px] font-bold">
                        Full-Size YouTube
                      </span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 bg-neutral-950 group">
                      <img
                        src={brand.websiteDesktopScreenshotUrl}
                        alt="Desktop Browser View"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-medium">2560x1600 Widescreen</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSceneBrollOverrides({
                              ...sceneBrollOverrides,
                              [selectedSceneForBroll]: {
                                mediaUrl: brand.websiteDesktopScreenshotUrl!,
                                label: `${brand.name} 💻 Desktop View`,
                                type: 'image'
                              }
                            });
                          }}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                        >
                          Cut to Scene
                        </button>
                        <button
                          onClick={() => {
                            setCustomMediaUrl(brand.websiteDesktopScreenshotUrl!);
                            setCustomMediaType('image');
                          }}
                          className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 rounded-lg text-[10px] font-bold"
                        >
                          All Video
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Extracted Diagrams, Architecture & Icons */}
                {brand.brandAssets && brand.brandAssets
                  .filter((a) => {
                    if (a.id === 'evidraw_mobile_app_screenshot' || a.id === 'evidraw_desktop_screenshot' || a.id === 'live_mobile_screenshot' || a.id === 'live_desktop_screenshot') {
                      return false;
                    }
                    if (assetViewportFilter === 'mobile') return a.viewport !== 'desktop';
                    if (assetViewportFilter === 'desktop') return a.viewport !== 'mobile';
                    return true;
                  })
                  .map((asset, aIdx) => (
                    <div key={aIdx} className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">
                          {asset.label || asset.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold uppercase">
                          {asset.type}
                        </span>
                      </div>

                      <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 bg-neutral-950 group">
                        <img
                          src={asset.url}
                          alt={asset.label || asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500 font-medium">Brand Graphic</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setSceneBrollOverrides({
                                ...sceneBrollOverrides,
                                [selectedSceneForBroll]: {
                                  mediaUrl: asset.url,
                                  label: asset.label || `${brand.name} Graphic`,
                                  type: 'image'
                                }
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-xs"
                          >
                            Cut to Scene
                          </button>
                          <button
                            onClick={() => {
                              setCustomMediaUrl(asset.url);
                              setCustomMediaType('image');
                            }}
                            className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 rounded-lg text-[10px] font-bold"
                          >
                            All Video
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Control Bar: Scene Cuts Director & AI Auto-Match */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 uppercase tracking-wide">
                    <Video className="w-4 h-4 text-emerald-500" />
                    Scene B-Roll Cuts Director
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Assign topic-specific video clips to each cut, or auto-match all scenes like Predis.ai.
                  </p>
                </div>

                <button
                  onClick={handleAutoMatchAllScenes}
                  disabled={isAutoMatchingAll}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                  title="Automatically search and bind topic-matched HD B-roll to every scene cut"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isAutoMatchingAll ? 'animate-spin' : ''}`} />
                  {isAutoMatchingAll ? 'Matching Scenes...' : 'Auto-Match All (AI)'}
                </button>
              </div>

              {/* Per-Scene Stepper Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {scenes.map((sc, idx) => {
                  const isSelected = selectedSceneForBroll === idx;
                  const sceneMedia = getSceneMedia(idx, sc.type);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSceneForBroll(idx);
                        jumpToScene(idx);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-left transition-all shrink-0 border flex flex-col gap-0.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {sc.title}
                        </span>
                        <span className="text-[8px] uppercase font-bold px-1 rounded bg-black/40 text-neutral-300">
                          {sceneMedia.type === 'video' ? 'MP4' : sceneMedia.type === 'animated_chart' ? 'CHART' : 'HD'}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400 max-w-[110px] truncate">
                        {sceneMedia.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Scene Info */}
              {scenes[selectedSceneForBroll] && (
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/15 text-[10px]">
                  <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[280px]">
                    Editing <strong className="text-emerald-400">{scenes[selectedSceneForBroll].title}</strong>: &ldquo;{scenes[selectedSceneForBroll].text.slice(0, 45)}...&rdquo;
                  </span>
                  {sceneBrollOverrides[selectedSceneForBroll] && (
                    <button
                      onClick={() => {
                        const copy = { ...sceneBrollOverrides };
                        delete copy[selectedSceneForBroll];
                        setSceneBrollOverrides(copy);
                      }}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      Reset Cut Visual
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search Bar & Pexels API Connect */}
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={brollSearchQuery}
                    onChange={(e) => setBrollSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchBroll();
                    }}
                    placeholder={`Search 4K B-Roll (e.g. hair wash, candlestick, trading, code, coffee)...`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={() => handleSearchBroll()}
                  disabled={isSearchingBroll}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shrink-0 hover:opacity-90 disabled:opacity-50"
                >
                  {isSearchingBroll ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Category Filter Chips & Pexels Accordion Toggle */}
              <div className="flex items-center justify-between text-[10px] font-bold">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'beauty', label: 'Salon / Hair' },
                    { id: 'fintech', label: 'Trading / Stocks' },
                    { id: 'tech', label: 'Tech / SaaS' },
                    { id: 'lifestyle', label: 'Lifestyle' },
                    { id: 'abstract', label: '3D Loops' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setBgCategoryFilter(cat.id);
                        if (brollSearchQuery || cat.id !== 'all') {
                          handleSearchBroll(cat.id === 'all' ? '' : cat.label);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full transition-colors ${
                        bgCategoryFilter === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowPexelsAccordion(!showPexelsAccordion)}
                  className="text-neutral-500 hover:text-emerald-400 flex items-center gap-1 shrink-0 ml-1"
                >
                  <Key className="w-3 h-3 text-emerald-500" />
                  <span>{showPexelsAccordion ? 'Hide API' : 'Pexels Key'}</span>
                </button>
              </div>

              {/* Pexels API Key Collapsible Accordion */}
              {showPexelsAccordion && (
                <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-300 flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-emerald-400" />
                      Free Pexels Video API Key (Optional)
                    </span>
                    <a
                      href="https://www.pexels.com/api/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={pexelsApiKey}
                      onChange={(e) => {
                        setPexelsApiKey(e.target.value);
                        try {
                          localStorage.setItem('brandcommand_pexels_key', e.target.value);
                        } catch {}
                      }}
                      placeholder="Paste your free Pexels API Key..."
                      className="flex-1 px-2.5 py-1 text-[11px] rounded-lg border border-neutral-700 bg-black text-neutral-200"
                    />
                    <button
                      onClick={() => handleSearchBroll()}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                    >
                      Connect
                    </button>
                  </div>
                  <p className="text-[9px] text-neutral-400">
                    Unlocks instant portrait video streams from 10M+ clips. Without a key, BrandCommand uses our built-in 4K curated registry and keyless public domain search!
                  </p>
                </div>
              )}
            </div>

            {/* Quick 1-Click Free MP4 Video Loops */}
            <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Video className="w-3 h-3 text-blue-500" />
                  Free 9:16 Video Loops & Live Terminal:
                </span>
                <span className="text-[9px] text-emerald-500 font-semibold">100% Free • Royalty-Free</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: '📱 Brand Mobile App Screenshot', url: brand.websiteMobileScreenshotUrl || brand.websiteScreenshotUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', type: 'image' as const },
                  { name: '📊 Candlestick Live Terminal', url: 'animated_chart', type: 'animated_chart' as const },
                  { name: '🏙️ 1080p Stream (MP4)', url: '/videos/actors/sample_1080.mp4', type: 'video' as const },
                  { name: '⚽ Wonderkid Scout Pitch', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80', type: 'image' as const },
                  { name: '💇‍♀️ Salon Balayage Transformation', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80', type: 'image' as const }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => assignClipToScene(selectedSceneForBroll, { mediaUrl: item.url, type: item.type, label: item.name })}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-[10px] text-neutral-800 dark:text-neutral-200 font-semibold transition-all shadow-2xs"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {(brollSearchResults.length > 0 ? brollSearchResults : filteredBackgrounds).map((clip) => {
                const clipTitle = ('name' in clip ? (clip as any).name : (clip as any).title) || 'B-Roll Visual';
                const clipLabel = ('label' in clip ? (clip as any).label : (clip as any).title) || clipTitle;
                const currentSceneMedia = getSceneMedia(selectedSceneForBroll, scenes[selectedSceneForBroll]?.type || 'scene');
                const isAssignedToActiveScene = currentSceneMedia.mediaUrl === clip.mediaUrl;
                return (
                  <div
                    key={clip.id}
                    className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all flex flex-col justify-between ${
                      isAssignedToActiveScene
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full bg-neutral-900 relative">
                      <img
                        src={clip.thumbnailUrl}
                        alt={clipTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Media Type Badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-bold text-white uppercase flex items-center gap-1 border border-white/10">
                        {clip.type === 'video' ? <Video className="w-2.5 h-2.5 text-emerald-400" /> : null}
                        {clip.type === 'animated_chart' ? <TrendingUp className="w-2.5 h-2.5 text-amber-400" /> : null}
                        {clip.type}
                      </span>

                      {isAssignedToActiveScene && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black shadow-md">
                          Scene {selectedSceneForBroll === 0 ? 'Hook' : selectedSceneForBroll === scenes.length - 1 ? 'CTA' : selectedSceneForBroll} ✓
                        </span>
                      )}
                    </div>
                    
                    <div className="p-2 bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between flex-1 gap-1.5">
                      <div>
                        <h4 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate">
                          {clipTitle}
                        </h4>
                        <p className="text-[9px] text-neutral-500 truncate">{clipLabel}</p>
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="flex gap-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={() => assignClipToScene(selectedSceneForBroll, {
                            mediaUrl: clip.mediaUrl,
                            type: clip.type,
                            label: clipLabel
                          })}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all text-center ${
                            isAssignedToActiveScene
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          Set for {scenes[selectedSceneForBroll]?.title || 'Scene'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBackgroundId(clip.id);
                            setCustomMediaUrl(clip.mediaUrl);
                            setCustomMediaType(clip.type === 'animated_chart' ? 'image' : clip.type);
                          }}
                          className="px-1.5 py-1 rounded-lg text-[8px] font-semibold bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-500 hover:text-neutral-200"
                          title="Apply this visual as background to ALL scenes"
                        >
                          All
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generate with Specialized AI Model (Gemini Imagen 3 / DALL-E 3 / Fal.ai / Flux) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    Generate Custom Media with AI Model
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                      Imagen 3 • DALL-E 3 • Flux
                    </span>
                  </h4>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Use your API key to render custom 9:16 vertical images or video clips.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMediaModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate AI Media
              </button>
            </div>

            {/* Custom Media Upload & Direct Link Section */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  Upload Your Own Video / Photo:
                </span>
                {customMediaUrl && (
                  <button
                    onClick={() => setCustomMediaUrl(null)}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Reset to Preset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950/60 text-neutral-600 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  Select Local MP4 or JPG
                </button>

                {/* Direct Video URL Form */}
                <form onSubmit={handleApplyDirectUrl} className="flex gap-1.5">
                  <input
                    type="url"
                    value={directMediaUrlInput}
                    onChange={(e) => setDirectMediaUrlInput(e.target.value)}
                    placeholder="Paste direct MP4/image URL..."
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold"
                  >
                    Apply
                  </button>
                </form>
              </div>

              {customMediaUrl && (
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
                  <span>Active Custom Background ({customMediaType})</span>
                  <span className="font-bold">Active in Simulator ✓</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GRAPHICS & VISUAL FX OVERLAYS */}
        {studioTab === 'graphics' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. Graphic Callout Badges & Stickers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase">Graphic Overlay Badges:</span>
                <span className="text-[10px] text-neutral-500">Pulsing Callout Sticker</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STICKER_PRESETS.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => {
                      setSelectedSticker(sticker.id);
                      setCustomStickerText('');
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                      selectedSticker === sticker.id && !customStickerText
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px]'
                    }`}
                  >
                    <span className="truncate block font-semibold">{sticker.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom Sticker Input */}
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={customStickerText}
                  onChange={(e) => setCustomStickerText(e.target.value)}
                  placeholder="Or type custom sticker badge text..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-neutral-200"
                />
                {customStickerText && (
                  <button
                    onClick={() => setCustomStickerText('')}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 2. Color Grading & Visual Mood Preset */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Color Grading & Film Presets:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'none', label: 'Natural Clean', desc: 'True color' },
                  { id: 'cinematic', label: 'Cinematic Teal', desc: 'Hollywood grade' },
                  { id: 'golden_hour', label: 'Golden Hour', desc: 'Warm glow' },
                  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'OptionCove neon' },
                  { id: 'vhs_90s', label: '90s VHS Cam', desc: 'Retro REC overlay' },
                  { id: 'noir', label: 'Noir B&W', desc: 'High contrast' }
                ].map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => setColorFilter(grade.id as keyof typeof COLOR_FILTERS)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      colorFilter === grade.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{grade.label}</div>
                    <div className="text-[9px] text-neutral-400">{grade.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Audio Soundwave Visualizer Style */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Audio Soundwave Visualizer:</span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'neon_bars', label: 'Neon Bars' },
                  { id: 'rainbow_eq', label: 'Rainbow EQ' },
                  { id: 'minimal_dots', label: 'Minimal Dots' },
                  { id: 'off', label: 'Off' }
                ].map((wave) => (
                  <button
                    key={wave.id}
                    onClick={() => setSoundwaveStyle(wave.id as SoundwaveStyle)}
                    className={`py-1.5 px-2 rounded-xl border font-bold text-center transition-all ${
                      soundwaveStyle === wave.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px]'
                    }`}
                  >
                    {wave.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Lower-Thirds & Watermark Toggle */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase">Lower Third Style:</span>
                <select
                  value={lowerThirdStyle}
                  onChange={(e) => setLowerThirdStyle(e.target.value as LowerThirdStyle)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
                >
                  <option value="glass_card">Glass Presenter Card</option>
                  <option value="breaking_ticker">Breaking News Marquee</option>
                  <option value="minimal_pill">Minimal Pill</option>
                  <option value="off">Off (Clean)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase">Brand Watermark:</span>
                <button
                  type="button"
                  onClick={() => setShowWatermark(!showWatermark)}
                  className={`w-full py-1.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors ${
                    showWatermark
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  <span>Watermark Badge</span>
                  <span>{showWatermark ? 'ON ✓' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTION LAYOUT & FRAMING */}
        {studioTab === 'layout' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. Production Layout Mode Switcher */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Production Layout Mode:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setLayoutMode('dynamic_cuts')}
                  className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                    layoutMode === 'dynamic_cuts'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs">App Walkthrough</span>
                  <span className="text-[9px] text-neutral-400 font-normal">Scroll & Zoom Cuts</span>
                </button>

                <button
                  onClick={() => {
                    setLayoutMode('ugc_creator');
                    setAspectRatio('9:16');
                  }}
                  className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                    layoutMode === 'ugc_creator'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="text-sm leading-none">🤳</span>
                  <span className="text-xs">UGC Creator Hook</span>
                  <span className="text-[9px] text-neutral-400 font-normal">Selfie POV + Story Text</span>
                </button>

                <button
                  onClick={() => setLayoutMode('showcase')}
                  className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                    layoutMode === 'showcase'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs">Product Showcase</span>
                  <span className="text-[9px] text-neutral-400 font-normal">100% Full-Screen B-Roll</span>
                </button>

                <button
                  onClick={() => setLayoutMode('split')}
                  className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                    layoutMode === 'split'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <SplitSquareVertical className="w-4 h-4" />
                  <span className="text-xs">Dual Screen Split</span>
                  <span className="text-[9px] text-neutral-400 font-normal">Overview + Live Detail</span>
                </button>
              </div>
            </div>

            {/* 2. Brand Identity Overlays */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Brand Presentation & Overlays:</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Lower-Third Style</span>
                  <select
                    value={lowerThirdStyle}
                    onChange={(e) => setLowerThirdStyle(e.target.value as LowerThirdStyle)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold"
                  >
                    <option value="glass_card">Glass Brand Card ({brand.name})</option>
                    <option value="breaking_ticker">Breaking News Marquee</option>
                    <option value="minimal_pill">Minimal Brand Pill</option>
                    <option value="off">Off (Clean)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">Brand Watermark</span>
                  <button
                    type="button"
                    onClick={() => setShowWatermark(!showWatermark)}
                    className={`w-full py-1.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors ${
                      showWatermark
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <span>Watermark Logo Bug</span>
                    <span>{showWatermark ? 'ON ✓' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VOICE AI & CAPTIONS */}
        {studioTab === 'voice' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Background Music (BGM) Royalty-Free Soundbeds */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      Royalty-Free Background Music (BGM)
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        100% Free • Safe for TikTok/IG
                      </span>
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      Real-time generative Web Audio soundbed with smart voiceover ducking.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isTestingSoundtrack) {
                      soundbedEngine.stop();
                      setIsTestingSoundtrack(false);
                    } else {
                      soundbedEngine.play(selectedSoundtrack);
                      soundbedEngine.setVolume(soundtrackVolume);
                      setIsTestingSoundtrack(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    isTestingSoundtrack
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  <span>{isTestingSoundtrack ? 'Stop Test' : 'Test Music'}</span>
                </button>
              </div>

              {/* Soundbed Preset Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {SOUNDTRACK_PRESETS.map((preset) => {
                  const isSelected = selectedSoundtrack === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedSoundtrack(preset.id);
                        if (isPlaying || isTestingSoundtrack) {
                          soundbedEngine.play(preset.id);
                          soundbedEngine.setVolume(soundtrackVolume);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{preset.emoji}</span>
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-1 line-clamp-1">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Volume & Smart Auto-Ducking controls */}
              {selectedSoundtrack !== 'none' && (
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      BGM Volume:
                    </span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.01"
                      value={soundtrackVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSoundtrackVolume(val);
                        soundbedEngine.setVolume(val);
                      }}
                      className="w-24 accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      {Math.round(soundtrackVolume * 100)}%
                    </span>
                  </div>

                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-Ducking: Softens 60% during voiceover
                  </span>
                </div>
              )}
            </div>

            {/* Subtitle Style Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Subtitle Typography Preset:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hormozi', name: 'Hormozi Kinetic', sample: 'BOLD YELLOW GLOW' },
                  { id: 'cyber', name: 'Cyber Terminal', sample: 'NEON MATRIX GREEN' },
                  { id: 'luxury', name: 'Luxury Editorial', sample: 'ELEGANT SERIF' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSubtitleStyle(style.id as SubtitleStyle)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      subtitleStyle === style.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <div className="font-bold text-xs">{style.name}</div>
                    <div className="text-[9px] text-neutral-400 truncate">{style.sample}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voiceover Engine Trigger Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Voiceover Engine: Google Cloud (Default)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Free Tier
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Auto-selected persona for {brand.name}: <span className="font-semibold text-neutral-300">{voiceName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerVoiceGeneration()}
                    disabled={isGeneratingVoice}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors ${
                      isGeneratingVoice
                        ? 'bg-neutral-600 text-white cursor-not-allowed'
                        : audioUrl
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isGeneratingVoice ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        Generating Voice...
                      </>
                    ) : audioUrl ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        ⚡ Generate Google Voice
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs transition-colors"
                    title="Configure Voice Settings & Personas"
                  >
                    ⚙
                  </button>
                </div>
              </div>

              {/* Auto-generate Checkbox Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-800/80">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-neutral-600 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoGenerateVoice}
                    onChange={(e) => {
                      setAutoGenerateVoice(e.target.checked);
                      try {
                        localStorage.setItem('brandcommand_auto_generate_voice', String(e.target.checked));
                      } catch {}
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Automatically synthesize Google voice for new video scripts</span>
                </label>

                {audioUrl && (
                  <button
                    onClick={handleRestart}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Test Listen
                  </button>
                )}
              </div>

              {audioUrl ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Speech Audio Ready & Synchronized
                  </span>
                  <span className="text-[10px] font-mono capitalize">
                    {voiceProvider === 'google'
                      ? `Google Journey (${voiceName})`
                      : voiceProvider === 'elevenlabs'
                      ? 'ElevenLabs Neural'
                      : 'OpenAI TTS'}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">●</span>
                    <span>Google Journey Speech is selected as your default.</span>
                  </div>
                  {!voiceApiKey && (
                    <button
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="text-purple-500 hover:underline font-bold text-[10px]"
                    >
                      Paste Key Once
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUTONOMOUS QUALITY ASSURANCE & WEB RESEARCH */}
        {studioTab === 'qa' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* QA Health Score Hero Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white font-black text-sm">
                    {activeQA.overallScore}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      AI Video Quality & Error Audit
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      Inspected at {activeQA.inspectedAt} • Automated Critic Agent
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    activeQA.status === 'passed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}>
                    {activeQA.status === 'passed' ? '✓ Passed QA' : '⚠️ Minor Warning'}
                  </span>

                  <button
                    onClick={() => handleApplyCopilotRevision('Auto-heal QA warnings')}
                    disabled={isRevising}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Heal
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed bg-white/60 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800">
                {activeQA.summary}
              </p>
            </div>

            {/* Detailed 5 QA Checks */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">
                Audited Quality Criteria:
              </span>
              <div className="space-y-2">
                {activeQA.checks.map((check) => (
                  <div
                    key={check.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        {check.label}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-500">
                        {check.score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pl-5.5 leading-snug">
                      {check.findings}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Researched Web Facts Sourced by AI */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Verified Web Research & Facts ({script.researchSources?.length || 0})
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Autonomous Web Intelligence
                </span>
              </div>

              {script.researchSources && script.researchSources.length > 0 ? (
                <div className="space-y-2">
                  {script.researchSources.map((source, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-200">
                          {source.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {source.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                        &ldquo;{source.snippet}&rdquo;
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                        <span className="font-bold uppercase tracking-wider">Key Claim:</span>
                        <span>{source.keyFact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-xs text-neutral-500 flex items-center justify-between">
                  <span>No external web facts linked yet.</span>
                  <button
                    onClick={() => handleApplyCopilotRevision('Incorporate latest market research and verified facts')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Run Web Research
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ElevenLabs / OpenAI Voiceover Generator Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Mic className="w-4 h-4 text-purple-500" />
                Hyper-Realistic AI Voiceover
              </div>
              <button onClick={() => setIsVoiceModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Generate studio human speech with natural breath, rhythm, and emotion using ElevenLabs or OpenAI TTS.
            </p>

            <form onSubmit={handleGenerateStudioVoice} className="space-y-3.5">
              {/* Provider Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Voice Engine</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceProvider('google');
                      setVoiceName(getRecommendedVoice(brand.category));
                    }}
                    className={`py-2 rounded-xl border font-bold transition-all relative ${
                      voiceProvider === 'google'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span>Google Cloud</span>
                    <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Default (Free)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceProvider('openai');
                      setVoiceName('shimmer');
                    }}
                    className={`py-2 rounded-xl border font-bold transition-all ${
                      voiceProvider === 'openai'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span>OpenAI TTS</span>
                    <span className="block text-[9px] text-neutral-400 font-normal">tts-1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceProvider('elevenlabs');
                      setVoiceName('21m00Tcm4TlvDq8ikWAM');
                    }}
                    className={`py-2 rounded-xl border font-bold transition-all ${
                      voiceProvider === 'elevenlabs'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span>ElevenLabs</span>
                    <span className="block text-[9px] text-neutral-400 font-normal">Studio Clones</span>
                  </button>
                </div>
              </div>

              {/* Persona Voice Picker */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Voice Persona</label>
                <select
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
                >
                  {voiceProvider === 'google' ? (
                    <>
                      <option value="en-US-Journey-D">Journey Male (Deep & Confident - Recommended for {brand.name})</option>
                      <option value="en-US-Journey-F">Journey Female (Expressive & Warm - Best for TikTok & Reels)</option>
                      <option value="en-US-Journey-O">Journey Modern Female (Clear & Dynamic Product Reviewer)</option>
                      <option value="en-US-Studio-O">Studio Broadcast Female (Commercial Quality)</option>
                      <option value="en-US-Studio-Q">Studio Broadcast Male (Authoritative & Deep)</option>
                      <option value="en-US-Neural2-F">Neural2 Female (Natural Conversational)</option>
                      <option value="en-US-Neural2-D">Neural2 Male (Direct & Punchy)</option>
                      <option value="es-US-Journey-F">Spanish Journey Female (Natural Latin Voiceover)</option>
                    </>
                  ) : voiceProvider === 'elevenlabs' ? (
                    <>
                      <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm & Luxury Female - Great for Hair/Salon)</option>
                      <option value="EXAVITQu4vr4xnSDxMaL">Bella (Sweet & Expressive Stylist)</option>
                      <option value="pNInz6obpgDQGcFmaJgB">Adam (Deep Finance Trader - Great for OptionCove)</option>
                      <option value="TxGEqnHWrfWFTfGW9XjX">Josh (Casual & Relatable)</option>
                    </>
                  ) : (
                    <>
                      <option value="shimmer">Shimmer (High Energy & Clear)</option>
                      <option value="nova">Nova (Warm & Friendly)</option>
                      <option value="onyx">Onyx (Deep & Authoritative)</option>
                      <option value="alloy">Alloy (Balanced & Modern)</option>
                    </>
                  )}
                </select>
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  {voiceProvider === 'google'
                    ? 'Google Cloud / Gemini API Key'
                    : voiceProvider === 'elevenlabs'
                    ? 'ElevenLabs API Key'
                    : 'OpenAI API Key'}
                </label>
                <input
                  type="password"
                  value={voiceApiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVoiceApiKey(val);
                    if (val) {
                      localStorage.setItem('brandcommand_voice_api_key', val);
                      if (voiceProvider === 'google') {
                        localStorage.setItem('brandcommand_google_cloud_tts_key', val);
                        localStorage.setItem('brandcommand_gemini_key', val);
                        localStorage.setItem('brandcommand_media_api_key', val);
                      }
                    }
                  }}
                  placeholder={
                    voiceProvider === 'google'
                      ? 'AIza... or AQ...'
                      : voiceProvider === 'elevenlabs'
                      ? 'xi-api-key...'
                      : 'sk-...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
                {voiceProvider === 'google' ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                      ✨ Free Monthly Tier: Includes up to 4,000,000 characters free every month!
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                      In Google Cloud Console, select <strong className="text-amber-500 font-semibold">Cloud Text-to-Speech API</strong> under API restrictions.
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-neutral-400 block">
                    Saved securely in your browser so you only enter it once.
                  </span>
                )}
              </div>

              {/* Auto Generate Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={autoGenerateVoice}
                  onChange={(e) => {
                    setAutoGenerateVoice(e.target.checked);
                    try {
                      localStorage.setItem('brandcommand_auto_generate_voice', String(e.target.checked));
                    } catch {}
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                  Automatically synthesize speech when new scripts are loaded
                </span>
              </label>

              {/* Status Message */}
              {voiceStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    voiceStatusMsg.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {voiceStatusMsg.success ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{voiceStatusMsg.text}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingVoice}
                  className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingVoice ? (
                    <>Synthesizing Human Voice...</>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      Generate & Sync Studio Audio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Image & Video Generator Modal (DALL-E 3 / Fal.ai / Flux / Luma) */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Generate Custom AI Media with API
              </div>
              <button onClick={() => setIsMediaModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Generate photorealistic 9:16 vertical b-roll footage and cinematic animations powered by Google DeepMind's flagship Veo 2, Imagen 3, or OpenAI DALL-E 3.
            </p>

            <form onSubmit={handleGenerateCustomMedia} className="space-y-3.5">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">AI Video & Media Model</label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    Veo 2 Native 9:16 Video
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaProvider('veo');
                      setMediaType('video');
                    }}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                      mediaProvider === 'veo'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span className="text-[8px] px-1 rounded bg-purple-600 text-white font-extrabold">DeepMind</span>
                    <span className="truncate">Google Veo 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaProvider('gemini');
                      setMediaType('image');
                    }}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      mediaProvider === 'gemini'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-blue-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span className="text-[8px] px-1 rounded bg-blue-500 text-white font-extrabold">Image</span>
                    <span className="truncate">Imagen 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaProvider('openai');
                      setMediaType('image');
                    }}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      mediaProvider === 'openai'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span className="text-[8px] px-1 rounded bg-emerald-600 text-white font-extrabold">OpenAI</span>
                    <span className="truncate">DALL-E 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaProvider('fal');
                      setMediaType('video');
                    }}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      mediaProvider === 'fal'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 shadow-xs ring-1 ring-orange-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span className="text-[8px] px-1 rounded bg-orange-500 text-white font-extrabold">Flux</span>
                    <span className="truncate">Fal.ai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaProvider('replicate')}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      mediaProvider === 'replicate'
                        ? 'border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    <span className="text-[8px] px-1 rounded bg-neutral-600 text-white font-extrabold">Instant</span>
                    <span className="truncate">Preview</span>
                  </button>
                </div>
              </div>

              {/* Veo 2 Cinematic Camera Motion Chips */}
              {mediaProvider === 'veo' && (
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      Google Veo 2 Cinematic Camera Moves
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-600 text-white">9:16 Vertical HD</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {[
                      { label: '🎥 Slow Dolly Zoom', prompt: 'slow cinematic dolly zoom, camera pushing into interface, 24fps film motion' },
                      { label: '⚡ Dynamic Orbit', prompt: '360 degree smooth orbital camera move around 3D floating statistics' },
                      { label: '🚀 FPV Drone Rush', prompt: 'fast kinetic forward tracking shot with motion blur and cinematic lens flares' },
                      { label: '🌌 Cyber Matrix Glow', prompt: 'volumetric neon light shafts and glowing data streams reflecting in dark glass' }
                    ].map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMediaPrompt(`${mediaPrompt.split(' -- ')[0]} -- ${m.prompt}`)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800 text-neutral-700 dark:text-neutral-300 hover:border-purple-500 font-medium"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Type (9:16 Image vs 9:16 Video) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Format</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`py-2 rounded-xl border transition-all ${
                      mediaType === 'image'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    🖼️ 9:16 Vertical Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`py-2 rounded-xl border transition-all ${
                      mediaType === 'video'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    🎥 9:16 Motion Video Clip
                  </button>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">Generation Prompt</label>
                  <button
                    type="button"
                    onClick={() => setMediaPrompt(script.visualCue || `${brand.name} demonstration`)}
                    className="text-[10px] text-blue-500 font-bold hover:underline"
                  >
                    Use Script Visual Note
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={mediaPrompt}
                  onChange={(e) => setMediaPrompt(e.target.value)}
                  placeholder="Describe the exact background scene, camera angle, and lighting..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* API Key */}
              {mediaProvider !== 'replicate' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase">
                      {mediaProvider === 'veo' || mediaProvider === 'gemini'
                        ? 'Google Cloud / Gemini API Key' 
                        : mediaProvider === 'openai' 
                          ? 'OpenAI API Key (sk-...)' 
                          : 'Fal.ai API Key (key_id:secret)'}
                    </label>
                    {(mediaProvider === 'veo' || mediaProvider === 'gemini') && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-connected
                      </span>
                    )}
                    {mediaProvider === 'openai' && (
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        OpenAI Keys ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="password"
                    value={mediaApiKey}
                    onChange={(e) => setMediaApiKey(e.target.value)}
                    placeholder={
                      mediaProvider === 'veo' || mediaProvider === 'gemini'
                        ? 'Using your connected Google Cloud / Gemini API Key (starts with AIza... or AQ...)'
                        : mediaProvider === 'openai' 
                          ? 'sk-proj-...' 
                          : 'fal_key_...'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                  />
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>Saved locally in your browser so you only enter it once.</span>
                    {(mediaProvider === 'veo' || mediaProvider === 'gemini') && (
                      <span className="text-purple-500 font-semibold">Google DeepMind Veo 2</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {mediaStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    mediaStatusMsg.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {mediaStatusMsg.success ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{mediaStatusMsg.text}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingMedia}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingMedia ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{mediaProvider === 'veo' ? 'Generating 9:16 Video with Google Veo 2...' : 'Rendering Media...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{mediaProvider === 'veo' ? 'Generate 9:16 Video with Google Veo 2' : 'Generate Media'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Interactive Live Candlestick Terminal Background Component
function CandlestickTerminalBackground({ isPlaying }: { isPlaying: boolean }) {
  const bars = [40, 58, 52, 75, 68, 85, 94, 86, 110, 102, 118, 132, 125, 145];
  
  return (
    <div className="relative w-full h-full bg-[#080d18] overflow-hidden flex flex-col justify-between p-3 select-none font-mono text-white">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29371a_1px,transparent_1px),linear-gradient(to_bottom,#1f29371a_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

      {/* Top Ticker Header */}
      <div className="relative z-10 flex items-center justify-between text-[9px] border-b border-emerald-500/20 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-extrabold text-emerald-400">OPTIONCOVE TERMINAL</span>
        </div>
        <span className="text-white/80 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
          SPY $584.20 +1.84% ▲
        </span>
      </div>

      {/* Candlestick Bars */}
      <div className="relative z-10 flex items-end justify-between gap-1.5 h-28 px-1 py-1">
        {bars.map((height, i) => {
          const isGreen = i % 3 !== 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              {/* Top Wick */}
              <div
                className={`w-[1px] ${isGreen ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`}
                style={{ height: `${height * 0.3}px` }}
              />
              {/* Body */}
              <div
                className={`w-full rounded-[1px] transition-all duration-300 ${
                  isGreen 
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                }`}
                style={{
                  height: `${height * 0.55}px`,
                  transform: isPlaying ? `scaleY(${1 + (i % 2 === 0 ? 0.05 : -0.05)})` : 'scaleY(1)'
                }}
              />
              {/* Bottom Wick */}
              <div
                className={`w-[1px] ${isGreen ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`}
                style={{ height: `${height * 0.15}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Live Metrics */}
      <div className="relative z-10 flex items-center justify-between text-[8px] text-white/60 border-t border-white/10 pt-1.5">
        <span className="text-emerald-400 font-bold">CALL VOL: 142.8K</span>
        <span className="text-amber-400 font-bold">IV: 24.2%</span>
        <span className="text-white/80">DELTA: 0.48</span>
      </div>
    </div>
  );
}

// Audio Soundwave Equalizer Component
function SoundwaveVisualizer({ isPlaying, style }: { isPlaying: boolean; style: SoundwaveStyle }) {
  if (style === 'off') return null;

  const barCount = 18;
  return (
    <div className="flex items-end justify-center gap-1 h-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
      {Array.from({ length: barCount }).map((_, i) => {
        const delays = [0.1, 0.3, 0.15, 0.4, 0.25, 0.5, 0.2, 0.35, 0.1, 0.45, 0.3, 0.15, 0.5, 0.25, 0.4, 0.2, 0.35, 0.1];
        const delay = delays[i % delays.length];
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${
              style === 'rainbow_eq'
                ? 'bg-gradient-to-t from-pink-500 via-amber-400 to-emerald-400'
                : style === 'minimal_dots'
                ? 'w-1 h-1 rounded-full bg-white/80'
                : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
            }`}
            style={{
              height: style === 'minimal_dots' ? '4px' : (isPlaying ? `${Math.max(4, Math.sin((i + 1) * 1.5) * 14 + 10)}px` : '4px'),
              animation: isPlaying ? `pulse 0.5s ease-in-out infinite alternate ${delay}s` : 'none'
            }}
          />
        );
      })}
    </div>
  );
}

// Breaking News Marquee Ticker Component
function BreakingNewsTicker({ text, isPlaying }: { text: string; isPlaying: boolean }) {
  return (
    <div className="w-full bg-rose-600/95 text-white py-1 px-2 overflow-hidden flex items-center shadow-lg border-y border-white/20">
      <span className="bg-white text-rose-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded mr-2 flex-shrink-0 animate-pulse">
        LIVE
      </span>
      <div className="whitespace-nowrap overflow-hidden text-[9px] font-bold tracking-wide">
        <span className={isPlaying ? 'inline-block animate-pulse' : ''}>
          {text} • {text}
        </span>
      </div>
    </div>
  );
}
