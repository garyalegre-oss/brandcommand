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
  Globe, 
  Search, 
  Wand2, 
  Check, 
  AlertCircle, 
  Type, 
  Palette, 
  Hash, 
  ArrowRight,
  RefreshCw,
  Upload,
  Plus,
  Lock,
  Unlock,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NewBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBrand: (brand: Brand) => void;
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

export function NewBrandModal({ isOpen, onClose, onAddBrand }: NewBrandModalProps) {
  // Website Scanner State
  const [scanUrlInput, setScanUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ success: boolean; text: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<BrandCategory>('webapp');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [typography, setTypography] = useState('Inter');
  const [logoEmoji, setLogoEmoji] = useState('🚀');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [voicePersona, setVoicePersona] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<SocialChannel[]>(['twitter', 'instagram']);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['#NewBrand', '#Launch']);
  const [suggestedTopic, setSuggestedTopic] = useState('');
  const [scannedTopics, setScannedTopics] = useState<string[]>([]);
  const [scannedAssets, setScannedAssets] = useState<any[]>([]);
  const [showBotAuthSection, setShowBotAuthSection] = useState(false);
  const [botLoginUrl, setBotLoginUrl] = useState('');
  const [botEmail, setBotEmail] = useState('');
  const [botPassword, setBotPassword] = useState('');
  const [botRoutes, setBotRoutes] = useState('/dashboard, /portfolio');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic & Smart Category Detection State
  const [availableCategories, setAvailableCategories] = useState<CategoryDefinition[]>(ALL_PRESET_CATEGORIES);
  const [isUserLockedCategory, setIsUserLockedCategory] = useState(false);
  const [smartDetected, setSmartDetected] = useState<{
    categoryId: string;
    label: string;
    emoji: string;
    confidence: number;
    isCustom: boolean;
    isAutoCreated: boolean;
    reason: string;
  } | null>(null);

  // Custom Category Creation Form
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatEmoji, setCustomCatEmoji] = useState('✨');

  // Real-Time Smart Category Detection as user types Name, Tagline, or URL
  useEffect(() => {
    if (isUserLockedCategory) return;

    const trimmedName = name.trim();
    const trimmedTag = tagline.trim();
    const trimmedUrl = websiteUrl.trim();

    // Trigger classification when reasonable input is present
    if (trimmedName.length >= 2 || trimmedTag.length >= 4 || trimmedUrl.length >= 4) {
      const result = detectBrandCategory(trimmedName, trimmedTag, trimmedUrl);

      // If the detected category was synthesized as a custom category not in available list:
      if (result.isCustom && !availableCategories.some((c) => c.id === result.category)) {
        setAvailableCategories((prev) => [...prev, result.categoryDef]);
      }

      setCategory(result.category);
      setSmartDetected({
        categoryId: result.category,
        label: result.categoryDef.label,
        emoji: result.categoryDef.emoji,
        confidence: Math.round(result.confidence * 100),
        isCustom: result.isCustom,
        isAutoCreated: result.isAutoCreated,
        reason: result.reason
      });

      // Auto-populate contextual emoji if current emoji is default
      if (result.categoryDef.emoji && (!logoEmoji || logoEmoji === '🚀')) {
        setLogoEmoji(result.categoryDef.emoji);
      }

      // Auto-populate hashtags if user hasn't customized them yet
      if (result.categoryDef.defaultHashtags && result.categoryDef.defaultHashtags.length > 0) {
        if (hashtags.length <= 2 && (hashtags.includes('#NewBrand') || hashtags.includes('#Launch'))) {
          const brandSlug = trimmedName.replace(/[^a-zA-Z0-9]/g, '');
          setHashtags([
            ...(brandSlug ? [`#${brandSlug}`] : []),
            ...result.categoryDef.defaultHashtags
          ]);
        }
      }

      // Auto-suggest palette if still at default blue
      if (primaryColor === '#2563eb' && result.categoryDef.suggestedColors?.primary) {
        setPrimaryColor(result.categoryDef.suggestedColors.primary);
        if (result.categoryDef.suggestedColors.secondary) {
          setSecondaryColor(result.categoryDef.suggestedColors.secondary);
        }
      }
    }
  }, [name, tagline, websiteUrl, isUserLockedCategory]);

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

  // Create a Custom Category explicitly
  const handleCreateCustomCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCatName.trim()) return;

    const newDef = createCustomCategory(customCatName.trim(), customCatEmoji || '✨');
    if (!availableCategories.some((c) => c.id === newDef.id)) {
      setAvailableCategories((prev) => [...prev, newDef]);
    }

    setCategory(newDef.id);
    setIsUserLockedCategory(true);
    setIsCreatingCustom(false);
    setCustomCatName('');
    setLogoEmoji(newDef.emoji);
    
    if (newDef.defaultHashtags) {
      setHashtags([...new Set([...hashtags, ...newDef.defaultHashtags])]);
    }

    setSmartDetected({
      categoryId: newDef.id,
      label: newDef.label,
      emoji: newDef.emoji,
      confidence: 100,
      isCustom: true,
      isAutoCreated: false,
      reason: 'Created manually by user'
    });
  };

  // Re-detect Category from input text
  const handleForceRedetect = () => {
    setIsUserLockedCategory(false);
    const trimmedName = name.trim();
    const trimmedTag = tagline.trim();
    const trimmedUrl = websiteUrl.trim();

    const result = detectBrandCategory(trimmedName, trimmedTag, trimmedUrl);
    if (result.isCustom && !availableCategories.some((c) => c.id === result.category)) {
      setAvailableCategories((prev) => [...prev, result.categoryDef]);
    }

    setCategory(result.category);
    setSmartDetected({
      categoryId: result.category,
      label: result.categoryDef.label,
      emoji: result.categoryDef.emoji,
      confidence: Math.round(result.confidence * 100),
      isCustom: result.isCustom,
      isAutoCreated: result.isAutoCreated,
      reason: result.reason
    });
    setLogoEmoji(result.categoryDef.emoji);
  };

  // Live Auto-Scan from Website URL
  const handleScanWebsite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanUrlInput.trim()) return;

    setIsScanning(true);
    setScanStatus(null);

    try {
      const res = await fetch('/api/scan-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrlInput.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to scan website.');
      }

      const p = data.profile;
      setName(p.name);
      setTagline(p.tagline);
      setWebsiteUrl(p.websiteUrl);

      // Handle custom or detected category from scanner
      if (p.customCategoryDef) {
        if (!availableCategories.some((c) => c.id === p.customCategoryDef.id)) {
          setAvailableCategories((prev) => [...prev, p.customCategoryDef]);
        }
      }

      setCategory(p.category);
      setIsUserLockedCategory(true);
      setSmartDetected({
        categoryId: p.category,
        label: p.customCategoryDef?.label || p.category,
        emoji: p.logoEmoji || '✨',
        confidence: 96,
        isCustom: !!p.customCategoryDef?.isCustom,
        isAutoCreated: !!p.customCategoryDef?.isCustom,
        reason: 'Extracted directly from website scan'
      });

      setPrimaryColor(p.primaryColor);
      if (p.secondaryColor) setSecondaryColor(p.secondaryColor);
      if (p.typography) setTypography(p.typography);
      if (p.logoUrl) setLogoUrl(p.logoUrl);
      if (p.logoEmoji) setLogoEmoji(p.logoEmoji);
      if (p.voicePersona) setVoicePersona(p.voicePersona);
      if (p.targetAudience) setTargetAudience(p.targetAudience);
      if (p.defaultChannels && p.defaultChannels.length > 0) {
        setSelectedChannels(p.defaultChannels);
      }
      if (p.commonHashtags && p.commonHashtags.length > 0) {
        setHashtags(p.commonHashtags);
      }
      if (p.suggestedTopics && p.suggestedTopics.length > 0) {
        setSuggestedTopic(p.suggestedTopics[0]);
        setScannedTopics(p.suggestedTopics);
      }
      if (p.brandAssets && p.brandAssets.length > 0) {
        setScannedAssets(p.brandAssets);
      }

      setScanStatus({
        success: true,
        text: `Extracted Brand DNA for "${p.name}"! Auto-classified as ${p.customCategoryDef?.label || p.category}, extracted official logo, ${p.primaryColor} palette, voice persona & ${p.suggestedTopics?.length || 4} campaign hooks.`
      });
    } catch (err: any) {
      setScanStatus({
        success: false,
        text: err.message || 'Could not fetch website. You can still fill fields manually.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      name,
      slug,
      tagline: tagline || 'New venture project',
      category,
      websiteUrl: websiteUrl ? (websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`) : undefined,
      logoUrl: logoUrl || undefined,
      typography: typography || 'Inter',
      primaryColor,
      secondaryColor: secondaryColor || '#0f172a',
      textColor: '#ffffff',
      logoEmoji: logoEmoji || '🚀',
      voicePersona: voicePersona || 'Professional, modern, and engaging.',
      targetAudience: targetAudience || 'Modern users and customers.',
      defaultChannels: selectedChannels.length > 0 ? selectedChannels : ['instagram', 'twitter'],
      commonHashtags: hashtags.length > 0 ? hashtags : [`#${name.replace(/\s+/g, '')}`, '#NewProject'],
      brandAssets: scannedAssets.length > 0 ? scannedAssets : undefined,
      botAuth:
        botEmail || botLoginUrl
          ? {
              loginUrl: botLoginUrl || (websiteUrl ? `${websiteUrl.replace(/\/$/, '')}/login` : undefined),
              botEmail,
              botPassword,
              internalRoutes: botRoutes
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean)
            }
          : undefined,
      suggestedTopics: scannedTopics.length > 0
        ? [suggestedTopic || scannedTopics[0], ...scannedTopics.slice(1)]
        : suggestedTopic
        ? [suggestedTopic, 'Product update & feature spotlight']
        : ['Product launch overview', 'Why we built this solution']
    };

    onAddBrand(newBrand);
    onClose();
  };

  // Group categories for dropdown
  const standardCats = availableCategories.filter((c) => !c.isCustom && ['gaming', 'fintech', 'extensions', 'salon', 'webapp', 'community'].includes(c.id));
  const expandedCats = availableCategories.filter((c) => !c.isCustom && !['gaming', 'fintech', 'extensions', 'salon', 'webapp', 'community'].includes(c.id));
  const customCats = availableCategories.filter((c) => c.isCustom);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Connect New Brand / Website
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* ⚡ AUTO-SCANNER HERO CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                AI Website Auto-Profiler
              </span>
              <span className="text-[10px] font-semibold text-neutral-500">
                Auto-Category • Logo • Colors • Tags
              </span>
            </div>

            <form onSubmit={handleScanWebsite} className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={scanUrlInput}
                  onChange={(e) => setScanUrlInput(e.target.value)}
                  placeholder="e.g. optioncove.com, drybar.com, stripe.com..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isScanning || !scanUrlInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    <span>Scan Site</span>
                  </>
                )}
              </button>
            </form>

            {scanStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  scanStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}
              >
                {scanStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span className="text-[11px] font-medium leading-relaxed">{scanStatus.text}</span>
              </div>
            )}

            {/* 🔐 OPTIONAL AI BOT LOGIN CREDENTIALS FOR INSIDE-APP TUTORIALS */}
            <div className="pt-1 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => setShowBotAuthSection(!showBotAuthSection)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 hover:underline"
              >
                <Lock className="w-3 h-3" />
                <span>
                  {showBotAuthSection
                    ? '▾ Hide AI Bot Demo Login'
                    : '🔐 + Add AI Bot Demo Login (Capture Logged-In Screens & Build Tutorials)'}
                </span>
              </button>

              {showBotAuthSection && (
                <div className="mt-2.5 p-3 rounded-xl bg-white/90 dark:bg-neutral-950/90 border border-emerald-500/30 space-y-2.5 text-xs">
                  <p className="text-[11px] text-neutral-500">
                    Provide a dedicated demo/sandbox account so our Playwright AI Bot can log in and capture real internal dashboard screens for &ldquo;How-To&rdquo; tutorials.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={botEmail}
                      onChange={(e) => setBotEmail(e.target.value)}
                      placeholder="Bot Email (e.g. demo-bot@app.com)"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    />
                    <input
                      type="password"
                      value={botPassword}
                      onChange={(e) => setBotPassword(e.target.value)}
                      placeholder="Bot Password"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={botLoginUrl}
                      onChange={(e) => setBotLoginUrl(e.target.value)}
                      placeholder="Login URL (e.g. https://evidraw.com/login)"
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    />
                    <input
                      type="text"
                      value={botRoutes}
                      onChange={(e) => setBotRoutes(e.target.value)}
                      placeholder="Routes: /dashboard, /portfolio"
                      className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FORM FIELDS */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Live Brand Identity Preview Pill */}
            {name && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandAvatar brand={{ id: 'preview', name, logoUrl, logoEmoji, primaryColor, secondaryColor, textColor: '#fff', tagline, category, websiteUrl, defaultChannels: [], commonHashtags: [], voicePersona: '', targetAudience: '', slug: '' }} size="lg" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      {name}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {availableCategories.find((c) => c.id === category)?.emoji || '✨'} {availableCategories.find((c) => c.id === category)?.label.split('(')[0].trim() || category}
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate max-w-sm">{tagline || 'New venture project'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                    title={`Primary: ${primaryColor}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: secondaryColor }}
                    title={`Secondary: ${secondaryColor}`}
                  />
                  <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-sans font-semibold">
                    {typography}
                  </span>
                </div>
              </div>
            )}

            {/* Brand Name & Fallback Icon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Brand / Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Evidraw, OptionCove, Varbona"
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center justify-between">
                  <span>Fallback Icon</span>
                  <span className="text-[9px] lowercase text-neutral-500 font-normal">(if no logo)</span>
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

            {/* Tagline / Value Proposition */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">Tagline / Value Proposition</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Fantasy football player trading game, or Rooftop solar installer"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
              />
            </div>

            {/* Website URL & Logo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">Website URL</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-500" />
                  Logo / Favicon (Upload or URL)
                </label>
                <div className="flex gap-2">
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setLogoUrl(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-600 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Upload className="w-3 h-3 text-emerald-500" />
                    Upload
                  </button>
                  <input
                    type="text"
                    value={logoUrl || ''}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>
            </div>

            {/* 🌟 SMART CATEGORY DETECTION CARD */}
            <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Smart Category Detection
                  </span>
                  {smartDetected && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      smartDetected.isAutoCreated
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {smartDetected.isAutoCreated ? '✨ Auto-Created Custom Category' : `${smartDetected.confidence}% Match`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isUserLockedCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsUserLockedCategory(false)}
                      className="text-[10px] font-semibold text-neutral-500 hover:text-emerald-500 flex items-center gap-1 transition-colors"
                      title="Manual override is active. Click to allow real-time AI auto-detection."
                    >
                      <Lock className="w-3 h-3 text-amber-500" />
                      Locked (Manual)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsUserLockedCategory(true)}
                      className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                      title="Lock current category to prevent auto-switching."
                    >
                      <Unlock className="w-3 h-3 text-emerald-500" />
                      AI Live Mode
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleForceRedetect}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Re-scan Text
                  </button>
                </div>
              </div>

              {smartDetected && (
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-base">{smartDetected.emoji}</span>
                  <div className="flex-1 truncate">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{smartDetected.label}</span>
                    <span className="text-neutral-400 text-[10px] ml-1.5">({smartDetected.reason})</span>
                  </div>
                </div>
              )}

              {/* Category Dropdown & Custom Category Trigger */}
              <div className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__CREATE_CUSTOM__') {
                        setIsCreatingCustom(true);
                        return;
                      }
                      setCategory(val);
                      setIsUserLockedCategory(true);
                      const def = availableCategories.find((c) => c.id === val);
                      if (def) {
                        setSmartDetected({
                          categoryId: def.id,
                          label: def.label,
                          emoji: def.emoji,
                          confidence: 100,
                          isCustom: !!def.isCustom,
                          isAutoCreated: false,
                          reason: 'Selected manually from menu'
                        });
                        setLogoEmoji(def.emoji);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-medium"
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
                      <optgroup label="✨ Custom / Auto-Created Categories">
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
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                  className="px-3 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Custom Category</span>
                </button>
              </div>

              {/* INLINE CUSTOM CATEGORY CREATOR */}
              {isCreatingCustom && (
                <div className="p-3 bg-white dark:bg-neutral-950 rounded-xl border border-emerald-500/30 space-y-2 mt-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Create New Custom Category
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
                      title="Category Icon / Emoji"
                    />
                    <input
                      type="text"
                      value={customCatName}
                      onChange={(e) => setCustomCatName(e.target.value)}
                      placeholder="e.g. Specialty Honey Roaster, Solar Panels, Luxury Watches"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomCategory}
                      disabled={!customCatName.trim()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0"
                    >
                      Save Category
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    This new category will be instantly registered with tailored AI prompts, custom tags, and color cues.
                  </p>
                </div>
              )}
            </div>

            {/* Typography */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                <Type className="w-3 h-3 text-neutral-400" />
                Typography / Font
              </label>
              <input
                type="text"
                value={typography}
                onChange={(e) => setTypography(e.target.value)}
                placeholder="e.g. Inter, Playfair Display, Montserrat"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
              />
            </div>

            {/* Colors: Primary & Secondary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                  <Palette className="w-3 h-3 text-emerald-500" />
                  Primary Brand Color
                </label>
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
                <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                  <Palette className="w-3 h-3 text-neutral-400" />
                  Accent / Secondary
                </label>
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

            {/* Persona Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">
                AI Persona Voice & Tone
              </label>
              <textarea
                rows={2}
                value={voicePersona}
                onChange={(e) => setVoicePersona(e.target.value)}
                placeholder="e.g. High energy, tactical, speaks directly to fantasy managers, scouting insights..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">
                Target Audience Demographics
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Fantasy sports fans, tactical gamers, and scouting enthusiasts"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
              />
            </div>

            {/* Hashtag Vault */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                <Hash className="w-3 h-3 text-emerald-500" />
                Auto-Generated Hashtag Vault ({hashtags.length})
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 max-h-24 overflow-y-auto">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold"
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
                  placeholder="Type tag & hit Enter..."
                  className="flex-1 min-w-[120px] bg-transparent text-xs outline-none px-1 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Social Channels Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase">
                Target Publishing Channels
              </label>
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

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
              >
                <span>Save & Activate Brand Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
