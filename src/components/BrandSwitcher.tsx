'use client';

import React from 'react';
import { Brand } from '../types/brand';
import { ChevronDown, Plus, Sparkles } from 'lucide-react';
import { BrandAvatar } from './BrandAvatar';

interface BrandSwitcherProps {
  brands: Brand[];
  activeBrand: Brand;
  onSelectBrand: (brand: Brand) => void;
  onOpenNewBrandModal: () => void;
}

export function BrandSwitcher({
  brands,
  activeBrand,
  onSelectBrand,
  onOpenNewBrandModal
}: BrandSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left"
        type="button"
      >
        <BrandAvatar brand={activeBrand} size="md" />
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Active Brand Workspace
          </span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            {activeBrand.name}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 ml-2 text-neutral-400" />
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 py-2 divide-y divide-neutral-100 dark:divide-neutral-800"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Switch Brand Workspace ({brands.length} active)
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  onSelectBrand(brand);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                  activeBrand.id === brand.id ? 'bg-neutral-100 dark:bg-neutral-800/60 font-semibold' : ''
                }`}
              >
                <BrandAvatar brand={brand} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {brand.name}
                  </div>
                  <div className="text-xs text-neutral-400 truncate capitalize">
                    {brand.category} • {brand.defaultChannels.length} channels
                  </div>
                </div>
                {activeBrand.id === brand.id && (
                  <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-2 px-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewBrandModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Brand / Website
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
