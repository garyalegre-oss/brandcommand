'use client';

import React, { useState } from 'react';
import { Brand } from '../types/brand';

interface BrandAvatarProps {
  brand?: Partial<Brand> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackEmoji?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs rounded-md',
  sm: 'w-7 h-7 text-xs rounded-lg',
  md: 'w-8 h-8 text-sm rounded-lg',
  lg: 'w-10 h-10 text-base rounded-xl',
  xl: 'w-14 h-14 text-2xl rounded-2xl'
};

export function BrandAvatar({
  brand,
  size = 'md',
  className = '',
  showFallbackEmoji = false
}: BrandAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (!brand) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-bold shrink-0 shadow-2xs ${className}`}
      >
        ✦
      </div>
    );
  }

  const hasLogoUrl = Boolean(brand.logoUrl && brand.logoUrl.trim() && !imgError);

  if (hasLogoUrl) {
    return (
      <div
        className={`${sizeClasses[size]} shrink-0 flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs ${className}`}
      >
        <img
          src={brand.logoUrl}
          alt={brand.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: If showFallbackEmoji is true and logoEmoji exists, show emoji;
  // otherwise render clean brand lettermark monogram
  const initial = brand.name ? brand.name.trim().charAt(0).toUpperCase() : '✦';
  const content = showFallbackEmoji && brand.logoEmoji ? brand.logoEmoji : initial;

  return (
    <div
      className={`${sizeClasses[size]} shrink-0 flex items-center justify-center font-black shadow-2xs select-none ${className}`}
      style={{
        backgroundColor: brand.primaryColor || '#0b1930',
        color: brand.textColor || '#ffffff'
      }}
      title={brand.name}
    >
      <span>{content}</span>
    </div>
  );
}
