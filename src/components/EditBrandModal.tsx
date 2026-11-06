'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brand, BrandCategory, SocialChannel } from '../types/brand';
import { 
  ALL_PRESET_CATEGORIES, 
  CategoryDefinition, 
  detectBrandCategory, 
  createCustomCategory 
} from '../lib/smartCategoryDetector';
import { BrandAvatar } from './BrandAvatar';
import { 
  X, 
  Sparkles, 
  Upload, 
  Palette, 
  Type, 
  Hash, 
  Check, 
  Wand2, 
  Save, 
  Globe,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

interface EditBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
  onSaveBrand: (updatedBrand: Brand) => void;
}

const CHANNELS: SocialChannel[] = [
  'instagram',
  'tiktok',
  'twitter',
  'youtube',
  'linkedin',
  'pinterest',
  'facebook'
];

const PRESET_COLORS = [
  { name: 'Varbona Pitch Lime', hex: '#b9f566', sec: '#0f172a' },
  { name: 'OptionCove Emerald', hex: '#059669', sec: '#ecfdf5' },
  { name: 'Salon Violet', hex: '#7c3aed', sec: '#f5f3ff' },
  { name: 'Warm Bronze Gold', hex: '#b45309', sec: '#fffbeb' },
  { name: 'SaaS Indigo', hex: '#4f46e5', sec: '#eef2ff' },
  { name: 'Celeste Sky Blue', hex: '#0284c7', sec: '#f0f9ff' },
  { name: 'Cyberpunk Rose', hex: '#ec4899', sec: '#18181b' }
];

export function EditBrandModal({ isOpen, onClose, brand, onSaveBrand }: EditBrandModalProps) {
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline);
  const [websiteUrl, setWebsiteUrl] = useState(brand.websiteUrl || '');
  const [category, setCategory] = useState<BrandCategory>(brand.category);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor || '#0f172a');
  const [typography, setTypography] = useState(brand.typography || 'Inter');
  const [logoEmoji, setLogoEmoji] = useState(brand.logoEmoji || '🚀');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(brand.logoUrl);
  const [voicePersona, setVoicePersona] = useState(brand.voicePersona);
  const [targetAudience, setTargetAudience] = useState(brand.targetAudience);
  const [selectedChannels, setSelectedChannels] = useState<SocialChannel[]>(brand.defaultChannels);
  const [hashtags, setHashtags] = useState<string[]>(brand.commonHashtags || []);
  const [hashtagInput, setHashtagInput] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(brand.suggestedTopics || []);
  const [newTopicInput, setNewTopicInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic & Custom Category Management
  const [availableCategories, setAvailableCategories] = useState<CategoryDefinition[]>(() => {
    const list = [...ALL_PRESET_CATEGORIES];
    if (brand.category && !list.some((c) => c.id === brand.category)) {
      list.push({
        id: brand.category,
        label: brand.category.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' (Custom)',
        emoji: brand.logoEmoji || '✨',
        isCustom: true
      });
    }
    return list;
  });

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatEmoji, setCustomCatEmoji] = useState('✨');
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  // Synchronize state when brand prop changes or modal opens
  useEffect(() => {
    if (brand && isOpen) {
      setName(brand.name);
      setTagline(brand.tagline);
      setWebsiteUrl(brand.websiteUrl || '');
      setCategory(brand.category);
      setPrimaryColor(brand.primaryColor);
      setSecondaryColor(brand.secondaryColor || '#0f172a');
      setTypography(brand.typography || 'Inter');
      setLogoEmoji(brand.logoEmoji || '🚀');
      setLogoUrl(brand.logoUrl);
      setVoicePersona(brand.voicePersona);
      setTargetAudience(brand.targetAudience);
      setSelectedChannels(brand.defaultChannels);
      setHashtags(brand.commonHashtags || []);
      setSuggestedTopics(brand.suggestedTopics || []);

      // Ensure brand category exists in list
      if (brand.category && !availableCategories.some((c) => c.id === brand.category)) {
        setAvailableCategories((prev) => [
          ...prev,
          {
            id: brand.category,
            label: brand.category.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' (Custom)',
            emoji: brand.logoEmoji || '✨',
            isCustom: true
          }
        ]);
      }
    }
  }, [brand, isOpen]);

  if (!isOpen) return null;

  const toggleChannel = (channel: SocialChannel) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#*/, '');
      if (tag && !hashtags.includes(`#${tag}`)) {
        setHashtags([...hashtags, `#${tag}`]);
      }
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  };

  // Upload local logo file
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create a Custom Category explicitly
  const handleCreateCustomCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCatName.trim()) return;

    const newDef = createCustomCategory(customCatName.trim(), customCatEmoji || '✨');
    if (!availableCategories.some((c) => c.id === newDef.id)) {
      setAvailableCategories((prev) => [...prev, newDef]);
    }

    setCategory(newDef.id);
    setIsCreatingCustom(false);
    setCustomCatName('');
    setLogoEmoji(newDef.emoji);
    
    if (newDef.defaultHashtags) {
      setHashtags([...new Set([...hashtags, ...newDef.defaultHashtags])]);
    }

    setDetectionNotice(`Created and applied custom category: "${newDef.label}"`);
    setTimeout(() => setDetectionNotice(null), 4000);
  };

  // Smart Auto-Detect from Brand Bio / Name / Website
  const handleSmartAutoDetect = () => {
    const result = detectBrandCategory(name, tagline, websiteUrl);

    // If auto-synthesized a custom category not yet in list:
    if (result.isCustom && !availableCategories.some((c) => c.id === result.category)) {
      setAvailableCategories((prev) => [...prev, result.categoryDef]);
    }

    setCategory(result.category);
    if (result.categoryDef.emoji) {
      setLogoEmoji(result.categoryDef.emoji);
    }
    if (result.categoryDef.defaultHashtags && result.categoryDef.defaultHashtags.length > 0) {
      const cleanBrand = name.replace(/[^a-zA-Z0-9]/g, '');
      setHashtags([
        `#${cleanBrand}`,
        ...result.categoryDef.defaultHashtags
      ]);
    }

    setDetectionNotice(`✨ Smart Detected: "${result.categoryDef.label}" (${Math.round(result.confidence * 100)}% match)`);
    setTimeout(() => setDetectionNotice(null), 4000);
  };

  // Intelligent auto-tuner for current category
  const handleAutoTuneToCategory = () => {
    const cleanBrand = name.replace(/[^a-zA-Z0-9]/g, '') || 'Brand';
    const currentDef = availableCategories.find((c) => c.id === category);

    if (category === 'gaming') {
      setLogoEmoji('⚽');
      setHashtags([
        `#${cleanBrand}`,
        '#FantasyFootball',
        '#FootballTrading',
        '#ScoutPlayers',
        '#FantasyXI',
        '#FootballManager',
        '#MatchDay',
        '#FutbolFantasy',
        '#WonderkidScout'
      ]);
      setVoicePersona('High-energy, football-obsessed, tactical, and competitive. Combines deep scouting knowledge with the excitement of fantasy player trading. Speaks directly to passionate fans building their ultimate fantasy XI squad.');
      setTargetAudience('Passionate football fans, fantasy sports managers, tactical gamers, and scouting enthusiasts who want to scout players, trade player shares, and compete with their fantasy XI.');
      setSuggestedTopics([
        `Top 3 breakout wonderkids to scout and add to your squad before Gameweek 15`,
        `Why trading player shares based on real-life match form beats traditional fantasy leagues`,
        `Watch this transfer scout: How one breakout game doubled this winger's market value`,
        `How to build an elite Fantasy XI on ${name} without burning your transfer budget`
      ]);
    } else if (category === 'fintech') {
      setLogoEmoji('📈');
      setHashtags([
        `#${cleanBrand}`,
        '#OptionsTrading',
        '#StockScanner',
        '#TradingTips',
        '#WallStreet',
        '#OptionVol',
        '#StockMarket',
        '#DayTrading',
        '#Investing'
      ]);
      setVoicePersona('Analytical, high-conviction, and data-driven with sharp quantitative insights. Zero fluff, 100% actionable risk/reward trade setups.');
      setTargetAudience('Active retail options traders, swing investors, and quantitative stock market participants seeking systematic edge.');
      setSuggestedTopics([
        `Stop buying OTM lotto calls: Why 85% of options expire worthless`,
        `How to sell Cash-Secured Puts on capital without getting wrecked`,
        `The 3 rules for picking strikes that beat 20% annualized yields safely`,
        `Why Implied Volatility Rank (IVR) matters more than the stock price`
      ]);
    } else if (category === 'salon') {
      setLogoEmoji('💇‍♀️');
      setHashtags([
        `#${cleanBrand}`,
        '#SalonTransformation',
        '#BalayageHighlights',
        '#BlowoutReveal',
        '#HairGoals',
        '#BehindTheChair',
        '#HealthyHair',
        '#HairSpa'
      ]);
      setVoicePersona('Warm, luxurious, educational, and aesthetic. Obsessive focus on hair health, transformation confidence, and master stylist craft.');
      setTargetAudience('Clients desiring premium salon transformations, balayage perfection, and luxury scalp and haircare rituals.');
      setSuggestedTopics([
        '3 signs your toner is fading and how to refresh it at home',
        'Before & After: 4-hour dimensional blonde transformation',
        'Why sulfate-free shampoo is non-negotiable after a salon gloss',
        'Behind the chair: What to ask for during your next consultation'
      ]);
    } else if (category === 'extensions') {
      setLogoEmoji('✂️');
      setHashtags([
        `#${cleanBrand}`,
        '#HandTiedExtensions',
        '#RemyHair',
        '#SeamlessBlend',
        '#HairExtensionsSpecialist',
        '#LuxuryHair',
        '#WeftExtensions'
      ]);
      setVoicePersona('Elevated luxury, insider hair stylist secrets, and seamless blending mastery. Confident, chic, and trend-setting.');
      setTargetAudience('High-end clients, hair professionals, and women looking for seamless, undetectable 100% Remy hair volume and length.');
      setSuggestedTopics([
        'How to tell if your hair extensions are 100% Remy human hair',
        'The 5-minute night routine that keeps extension bonds silky for months',
        'Hand-tied wefts vs. Tape-ins: Which method fits your natural hair type?',
        'Watch this color blend: Matching 22-inch honey blonde wefts live'
      ]);
    } else if (category === 'community') {
      setLogoEmoji('🧉');
      setHashtags([
        `#${cleanBrand}`,
        '#UruguayConecta',
        '#CostumbresUruguayas',
        '#RamblaMontevideo',
        '#UruguayosEnElMundo',
        '#MateRioplatense'
      ]);
      setVoicePersona('Auténtico, cálido, rioplatense y cercano. Pasión por la cultura, el encuentro entre amigos, el mate y el sentido de pertenencia.');
      setTargetAudience('Uruguayos y amantes de la cultura rioplatense en su país y viviendo en el exterior que buscan conectarse.');
    } else if (currentDef && currentDef.defaultHashtags) {
      // Expanded preset or custom category
      setLogoEmoji(currentDef.emoji || '✨');
      setHashtags([`#${cleanBrand}`, ...currentDef.defaultHashtags]);
      setVoicePersona(`Specialized, engaging, and authoritative voice crafted for ${currentDef.label}.`);
      setTargetAudience(`Discerning clients and community interested in ${currentDef.label}.`);
      setSuggestedTopics([
        `3 reasons why ${name} stands out in ${currentDef.label}`,
        `Behind the scenes: How we deliver excellence every day`,
        `Common mistakes people make in this industry and how to avoid them`
      ]);
    } else {
      setLogoEmoji('⚡');
      setHashtags([
        `#${cleanBrand}`,
        '#BuildInPublic',
        '#ProductivityHacks',
        '#SaaSSolutions',
        '#TechInnovation',
        '#ModernWorkflow',
        '#CreatorEconomy'
      ]);
      setVoicePersona('Modern, crisp, developer-friendly, and forward-thinking. Focused on sub-second speed, intuitive workflow design, and productivity.');
      setTargetAudience('Founders, builders, product designers, and power users looking for high-performance software solutions.');
    }

    setDetectionNotice(`Tuned hashtags, voice persona and inspirations for ${currentDef?.label || category}!`);
    setTimeout(() => setDetectionNotice(null), 3500);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicInput.trim()) return;
    setSuggestedTopics([...suggestedTopics, newTopicInput.trim()]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (idx: number) => {
    setSuggestedTopics(suggestedTopics.filter((_, i) => i !== idx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Brand = {
      ...brand,
      name: name.trim(),
      tagline: tagline.trim(),
      websiteUrl: websiteUrl ? (websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`) : undefined,
      category,
      primaryColor,
      secondaryColor,
      typography: typography || 'Inter',
      logoEmoji: logoEmoji || '🚀',
      logoUrl: logoUrl || undefined,
      voicePersona,
      targetAudience,
      defaultChannels: selectedChannels.length > 0 ? selectedChannels : ['instagram', 'twitter'],
      commonHashtags: hashtags,
      suggestedTopics
    };

    onSaveBrand(updated);
    onClose();
  };

  // Group categories for dropdown
  const standardCats = availableCategories.filter((c) => !c.isCustom && ['gaming', 'fintech', 'extensions', 'salon', 'webapp', 'community'].includes(c.id));
  const expandedCats = availableCategories.filter((c) => !c.isCustom && !['gaming', 'fintech', 'extensions', 'salon', 'webapp', 'community'].includes(c.id));
  const customCats = availableCategories.filter((c) => c.isCustom);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Edit Brand Profile: <span className="text-emerald-500">{brand.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-5">
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandAvatar brand={{ ...brand, logoUrl, logoEmoji, primaryColor, name }} size="lg" />
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  {name || 'Brand Name'}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {availableCategories.find((c) => c.id === category)?.emoji || '✨'} {availableCategories.find((c) => c.id === category)?.label.split('(')[0].trim() || category}
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm truncate">{tagline || 'Tagline description'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <div
                className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: primaryColor }}
                title={`Primary: ${primaryColor}`}
              />
              <div
                className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: secondaryColor }}
                title={`Secondary: ${secondaryColor}`}
              />
              <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-[10px] font-sans font-bold">
                {typography}
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {detectionNotice && (
            <div className="p-2.5 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium">{detectionNotice}</span>
            </div>
          )}

          {/* Brand Name & Website Logo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">Brand Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="sm:col-span-1 space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center justify-between">
                <span>Fallback Icon</span>
                <span className="text-[9px] lowercase text-neutral-500 font-normal">(only if no logo)</span>
              </label>
              <input
                type="text"
                value={logoEmoji}
                onChange={(e) => setLogoEmoji(e.target.value)}
                maxLength={2}
                placeholder="Optional"
                className="w-full text-center text-lg py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-emoji"
              />
            </div>
          </div>

          {/* Website & Official Logo */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                Website & Official Logo (SVG / PNG)
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {logoUrl ? '✓ Official logo active' : 'No image set (using monogram)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase">Website URL</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase flex items-center justify-between">
                  <span>Logo URL or File</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(undefined)}
                      className="text-[10px] text-neutral-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-white dark:bg-neutral-900"
                  >
                    <Upload className="w-3 h-3 text-emerald-500" />
                    Upload
                  </button>
                  <input
                    type="text"
                    value={logoUrl || ''}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.svg"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              When set, BrandCommand uses your real website logo across all carousels, headers, queue cards, and social exports instead of any emoji.
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase">Tagline / Mission</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>

          {/* Category & Smart Category Controls */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Industry Category & Smart Detection
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSmartAutoDetect}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-1 shadow-xs"
                  title="Detects category automatically from name and bio, creating custom category if not in preset"
                >
                  <Wand2 className="w-3 h-3" />
                  Auto-Detect from Bio
                </button>

                <button
                  type="button"
                  onClick={handleAutoTuneToCategory}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all flex items-center gap-1 shadow-xs"
                  title="Tune hashtags and voice persona to current category"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-Tune Tags
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__CREATE_CUSTOM__') {
                    setIsCreatingCustom(true);
                    return;
                  }
                  setCategory(val);
                  const def = availableCategories.find((c) => c.id === val);
                  if (def && def.emoji) {
                    setLogoEmoji(def.emoji);
                  }
                }}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
              >
                <optgroup label="Standard Presets">
                  {standardCats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Extended Industries">
                  {expandedCats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </optgroup>

                {customCats.length > 0 && (
                  <optgroup label="✨ Custom / User Categories">
                    {customCats.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label} (Custom)
                      </option>
                    ))}
                  </optgroup>
                )}

                <option value="__CREATE_CUSTOM__" className="font-bold text-emerald-600">
                  ➕ + Create Custom Category...
                </option>
              </select>

              <button
                type="button"
                onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Custom</span>
              </button>
            </div>

            {/* INLINE CUSTOM CATEGORY CREATOR */}
            {isCreatingCustom && (
              <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-emerald-500/30 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Create Custom Category
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCatEmoji}
                    onChange={(e) => setCustomCatEmoji(e.target.value)}
                    maxLength={2}
                    placeholder="✨"
                    className="w-10 text-center py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-emoji"
                  />
                  <input
                    type="text"
                    value={customCatName}
                    onChange={(e) => setCustomCatName(e.target.value)}
                    placeholder="e.g. Vintage Watches, Specialty Honey, Solar Power"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    disabled={!customCatName.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
              <Type className="w-3 h-3 text-neutral-400" />
              Typography / Primary Font
            </label>
            <input
              type="text"
              value={typography}
              onChange={(e) => setTypography(e.target.value)}
              placeholder="e.g. Plus Jakarta Sans, Playfair Display, Montserrat"
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                <Palette className="w-3 h-3 text-emerald-500" />
                Brand Color Palette
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 mr-1">Presets:</span>
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() => {
                      setPrimaryColor(preset.hex);
                      setSecondaryColor(preset.sec);
                    }}
                    className="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125"
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 font-medium">Primary Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 font-medium">Secondary / Dark Contrast</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Voice Persona */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase">AI Persona Voice & Tone</label>
            <textarea
              rows={2}
              value={voicePersona}
              onChange={(e) => setVoicePersona(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 resize-none"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase">Target Audience Demographics</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>

          {/* Hashtag Vault */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-500" />
                Hashtag Vault ({hashtags.length})
              </label>
              <span className="text-[10px] text-neutral-400">Click × to remove, type & Enter to add</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 max-h-32 overflow-y-auto">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                    className="text-neutral-400 hover:text-red-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleAddHashtag}
                placeholder="Add tag & hit Enter..."
                className="flex-1 min-w-[140px] bg-transparent text-xs outline-none px-1 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Quick Inspirations & Angle Hooks */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase">
              Brand Inspirations & Content Angles ({suggestedTopics.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {suggestedTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-700 dark:text-neutral-300"
                >
                  <span className="truncate pr-2">{topic}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(idx)}
                    className="text-neutral-400 hover:text-red-500 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="Add new custom angle or inspiration..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                disabled={!newTopicInput.trim()}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl disabled:opacity-40"
              >
                Add Angle
              </button>
            </div>
          </div>

          {/* Publishing Channels */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 uppercase">Active Channels</label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((ch) => {
                const isSelected = selectedChannels.includes(ch);
                return (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Save Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
