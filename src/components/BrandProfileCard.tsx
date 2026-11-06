'use client';

import React, { useState } from 'react';
import { Brand } from '../types/brand';
import { 
  Globe, 
  MessageSquareQuote, 
  Palette, 
  Type, 
  Hash, 
  RefreshCw, 
  Wand2, 
  Check, 
  ExternalLink,
  Edit3,
  Share2
} from 'lucide-react';
import { EditBrandModal } from './EditBrandModal';
import { SocialAccountsHub } from './SocialAccountsHub';
import { formatCategoryLabel } from '../lib/smartCategoryDetector';
import { BrandAvatar } from './BrandAvatar';

interface BrandProfileCardProps {
  brand: Brand;
  onUpdateBrand?: (updatedBrand: Brand) => void;
}

export function BrandProfileCard({ brand, onUpdateBrand }: BrandProfileCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanSuccess, setRescanSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState(false);
  const [showBrandDetails, setShowBrandDetails] = useState(false);

  const handleRescan = async () => {
    if (!brand.websiteUrl || !onUpdateBrand) return;
    setIsRescanning(true);
    setRescanSuccess(false);

    try {
      const res = await fetch('/api/scan-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brand.websiteUrl })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        const updated: Brand = {
          ...brand,
          name: p.name || brand.name,
          tagline: p.tagline || brand.tagline,
          category: p.category || brand.category,
          logoUrl: p.logoUrl || brand.logoUrl,
          logoEmoji: p.logoEmoji || brand.logoEmoji,
          primaryColor: p.primaryColor || brand.primaryColor,
          secondaryColor: p.secondaryColor || brand.secondaryColor,
          typography: p.typography || brand.typography,
          voicePersona: p.voicePersona || brand.voicePersona,
          targetAudience: p.targetAudience || brand.targetAudience,
          commonHashtags: p.commonHashtags?.length ? p.commonHashtags : brand.commonHashtags,
          defaultChannels: p.defaultChannels?.length ? p.defaultChannels : brand.defaultChannels
        };
        onUpdateBrand(updated);
        setImgError(false);
        setRescanSuccess(true);
        setTimeout(() => setRescanSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to rescan brand profile:', err);
    } finally {
      setIsRescanning(false);
    }
  };

  const connectedCount = Object.values(brand.socialConnections || {}).filter(
    (c) => c?.isConnected
  ).length;
  const capturedScreensCount = (brand.brandAssets || []).filter(
    (a) => a.type === 'screenshot' || a.type === 'hero' || a.isAuthenticated
  ).length;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
      {/* Subtle background color accent glow */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20 transition-colors duration-500"
        style={{ backgroundColor: brand.primaryColor }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Compact Brand Identity Header */}
        <div className="flex items-center gap-3.5 min-w-0">
          <BrandAvatar brand={brand} size="lg" className="shadow-sm shrink-0" />

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                {brand.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {formatCategoryLabel(brand.category)}
              </span>

              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  <span>{brand.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              )}

              {/* Color Swatches */}
              <div
                className="hidden sm:flex items-center gap-1 pl-1"
                title={`Brand Colors: Primary ${brand.primaryColor}, Accent ${brand.secondaryColor}`}
              >
                <div
                  className="w-3 h-3 rounded-full border border-white/40 shadow-2xs"
                  style={{ backgroundColor: brand.primaryColor }}
                />
                <div
                  className="w-3 h-3 rounded-full border border-white/40 shadow-2xs"
                  style={{ backgroundColor: brand.secondaryColor }}
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
              {brand.tagline}
            </p>
          </div>
        </div>

        {/* Right: Clean Quick-Action Pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {capturedScreensCount > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
              📸 {capturedScreensCount} App Screens
            </span>
          )}

          {onUpdateBrand && (
            <>
              <button
                onClick={() => setIsSocialHubOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-colors"
                title="Manage connected social channels and publishing credentials"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Social Accounts ({connectedCount})</span>
              </button>

              {brand.websiteUrl && (
                <button
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-600 dark:text-neutral-300 font-semibold transition-colors disabled:opacity-50"
                  title="Rescan website to refresh colors, typography and screenshots"
                >
                  {isRescanning ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                      <span>Scanning...</span>
                    </>
                  ) : rescanSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Updated</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 text-emerald-500" />
                      <span>Rescan Site</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold transition-colors"
                title="Edit brand profile, voice, colors, or hashtags"
              >
                <Edit3 className="w-3 h-3 text-emerald-500" />
                <span>Edit Brand</span>
              </button>

              <button
                onClick={() => setShowBrandDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-semibold"
              >
                <span>{showBrandDetails ? 'Hide Brand DNA ▲' : 'Brand DNA ▼'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Brand DNA Drawer (Voice Persona & Hashtags) */}
      {showBrandDetails && (
        <div className="relative z-10 mt-4 pt-3.5 border-t border-neutral-200/80 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <MessageSquareQuote className="w-3 h-3 text-emerald-500" />
              Brand Voice Persona &amp; Target Audience
            </span>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 italic">
              &ldquo;{brand.voicePersona}&rdquo;
            </p>
            <p className="text-[11px] text-neutral-400">
              Audience: {brand.targetAudience}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Hash className="w-3 h-3 text-emerald-500" />
              Default Brand Hashtags ({brand.commonHashtags.length})
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {brand.commonHashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Brand Profile Modal */}
      {isEditModalOpen && onUpdateBrand && (
        <EditBrandModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          brand={brand}
          onSaveBrand={(updated) => {
            onUpdateBrand(updated);
            setImgError(false);
          }}
        />
      )}

      {/* Social Accounts & Direct Publishing Hub Modal */}
      {isSocialHubOpen && onUpdateBrand && (
        <SocialAccountsHub
          brand={brand}
          isOpen={isSocialHubOpen}
          onClose={() => setIsSocialHubOpen(false)}
          onUpdateBrand={(updated) => {
            onUpdateBrand(updated);
          }}
        />
      )}
    </div>
  );
}
