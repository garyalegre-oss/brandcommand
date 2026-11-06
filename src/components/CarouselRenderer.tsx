'use client';

import React, { useState, useEffect } from 'react';
import { Brand, CarouselSlide } from '../types/brand';
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Layers, 
  Download, 
  Sparkles,
  Palette,
  Edit3,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Wand2,
  X,
  Type,
  Maximize2,
  Share2
} from 'lucide-react';

interface CarouselRendererProps {
  brand: Brand;
  slides: CarouselSlide[];
  onUpdateSlides?: (updatedSlides: CarouselSlide[]) => void;
}

export type CarouselTheme = 'brand' | 'midnight' | 'clean' | 'terracotta' | 'neon' | 'dusk';
export type CarouselAspectRatio = '4/5' | '1/1';
export type CarouselFont = 'sans' | 'serif' | 'mono';

export function CarouselRenderer({ brand, slides, onUpdateSlides }: CarouselRendererProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Active Slides & History for Undo
  const [currentSlides, setCurrentSlides] = useState<CarouselSlide[]>(slides);
  const [historyStack, setHistoryStack] = useState<CarouselSlide[][]>([]);

  // Visual Customizer State
  const [selectedTheme, setSelectedTheme] = useState<CarouselTheme>('brand');
  const [aspectRatio, setAspectRatio] = useState<CarouselAspectRatio>('4/5');
  const [fontFamily, setFontFamily] = useState<CarouselFont>('sans');
  const [slideBg, setSlideBg] = useState(brand.primaryColor);
  const [slideTextColor, setSlideTextColor] = useState(brand.textColor || '#ffffff');
  const [slideAccentColor, setSlideAccentColor] = useState('rgba(255, 255, 255, 0.2)');

  // Modals
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Smart AI Optimizer State
  const [aiInstruction, setAiInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync when prop changes
  useEffect(() => {
    setCurrentSlides(slides);
    setCurrentSlideIndex(0);
  }, [slides]);

  // Sync theme when brand changes
  useEffect(() => {
    if (selectedTheme === 'brand') {
      setSlideBg(brand.primaryColor);
      setSlideTextColor(brand.textColor || '#ffffff');
    }
  }, [brand.id, brand.primaryColor, brand.textColor, selectedTheme]);

  if (!currentSlides || currentSlides.length === 0) return null;

  const currentSlide = currentSlides[currentSlideIndex] || currentSlides[0];

  const updateSlidesState = (newSlides: CarouselSlide[]) => {
    setHistoryStack((prev) => [...prev.slice(-4), currentSlides]);
    setCurrentSlides(newSlides);
    if (onUpdateSlides) {
      onUpdateSlides(newSlides);
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((s) => s.slice(0, -1));
    setCurrentSlides(prev);
    if (onUpdateSlides) {
      onUpdateSlides(prev);
    }
    setAiNotice({ message: 'Reverted to previous version.', type: 'success' });
    setTimeout(() => setAiNotice(null), 3000);
  };

  // Apply Theme presets
  const applyTheme = (theme: CarouselTheme) => {
    setSelectedTheme(theme);
    if (theme === 'brand') {
      setSlideBg(brand.primaryColor);
      setSlideTextColor(brand.textColor || '#ffffff');
      setSlideAccentColor('rgba(255, 255, 255, 0.2)');
    } else if (theme === 'midnight') {
      setSlideBg('#0a0f1d');
      setSlideTextColor('#f8fafc');
      setSlideAccentColor('rgba(56, 189, 248, 0.25)'); // Cyan
    } else if (theme === 'clean') {
      setSlideBg('#ffffff');
      setSlideTextColor('#0f172a');
      setSlideAccentColor('rgba(15, 23, 42, 0.08)');
    } else if (theme === 'terracotta') {
      setSlideBg('#78350f');
      setSlideTextColor('#fffbeb');
      setSlideAccentColor('rgba(245, 158, 11, 0.25)');
    } else if (theme === 'neon') {
      setSlideBg('#09090b');
      setSlideTextColor('#ffffff');
      setSlideAccentColor('rgba(185, 245, 102, 0.25)'); // Lime
    } else if (theme === 'dusk') {
      setSlideBg('#311042');
      setSlideTextColor('#ffffff');
      setSlideAccentColor('rgba(236, 72, 153, 0.25)'); // Pink
    }
  };

  // AI Content Optimization Dispatcher
  const handleAIOptimize = async (customInstruction?: string) => {
    const promptToUse = customInstruction || aiInstruction;
    if (!promptToUse.trim()) return;

    setIsOptimizing(true);
    setAiNotice(null);

    try {
      const savedGeminiKey = typeof window !== 'undefined' 
        ? (localStorage.getItem('brandcommand_voice_api_key') || localStorage.getItem('brandcommand_media_api_key') || '') 
        : '';

      const res = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          format: 'carousel',
          currentData: currentSlides,
          instruction: promptToUse,
          apiKey: savedGeminiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiNotice({ message: data.message || 'Optimization request failed.', type: 'error' });
      } else {
        const optimized = Array.isArray(data.data) ? data.data : data.data?.slides || currentSlides;
        updateSlidesState(optimized);
        setAiNotice({ message: data.explanation || 'Slides successfully optimized!', type: 'success' });
        setAiInstruction('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotice({ message: error.message || 'Network error occurred.', type: 'error' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyAll = () => {
    const text = currentSlides
      .map(
        (s, i) =>
          `[Slide ${i + 1}/${currentSlides.length}]\nTitle: ${s.title}\n${s.subtitle ? `Subtitle: ${s.subtitle}\n` : ''}${s.body}\n${s.highlightText ? `Key Takeaway: ${s.highlightText}\n` : ''}`
      )
      .join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // High-Resolution Canvas Renderer with Custom Aspect Ratio & Styling
  const renderSlideToCanvas = (slide: CarouselSlide, index: number): HTMLCanvasElement => {
    const width = 1080;
    const height = aspectRatio === '4/5' ? 1350 : 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background Fill
    ctx.fillStyle = slideBg;
    ctx.fillRect(0, 0, width, height);

    // Font Family resolution
    const fontName =
      fontFamily === 'serif'
        ? 'Georgia, "Playfair Display", serif'
        : fontFamily === 'mono'
        ? 'ui-monospace, "SFMono-Regular", Menlo, monospace'
        : 'system-ui, -apple-system, sans-serif';

    // Gradient overlay for depth
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.12)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Header: Logo & Brand Name
    ctx.fillStyle = slideTextColor;
    ctx.font = `bold 36px ${fontName}`;
    ctx.textAlign = 'left';
    const headerPrefix = brand.logoEmoji ? `${brand.logoEmoji}  ` : '';
    ctx.fillText(`${headerPrefix}${brand.name.toUpperCase()}`, 70, 110);

    // Slide Counter Pill
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.roundRect(width - 230, 70, 160, 56, 28);
    ctx.fill();

    ctx.fillStyle = slideTextColor;
    ctx.font = `bold 26px ${fontName}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${index + 1} / ${currentSlides.length}`, width - 150, 107);

    // Subtitle
    let cursorY = aspectRatio === '4/5' ? 320 : 250;
    if (slide.subtitle) {
      ctx.textAlign = 'left';
      ctx.fillStyle = slideTextColor;
      ctx.globalAlpha = 0.8;
      ctx.font = `bold 28px ${fontName}`;
      ctx.fillText(slide.subtitle.toUpperCase(), 70, cursorY);
      ctx.globalAlpha = 1.0;
      cursorY += 58;
    }

    // Title (wrapped)
    ctx.textAlign = 'left';
    ctx.fillStyle = slideTextColor;
    ctx.font = `900 ${aspectRatio === '4/5' ? '56px' : '50px'} ${fontName}`;
    const titleWords = slide.title.split(' ');
    let currentLine = '';
    for (let i = 0; i < titleWords.length; i++) {
      const testLine = currentLine ? `${currentLine} ${titleWords[i]}` : titleWords[i];
      if (ctx.measureText(testLine).width > width - 140 && i > 0) {
        ctx.fillText(currentLine, 70, cursorY);
        currentLine = titleWords[i];
        cursorY += aspectRatio === '4/5' ? 70 : 62;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, 70, cursorY);
    cursorY += aspectRatio === '4/5' ? 84 : 70;

    // Body text (wrapped)
    ctx.fillStyle = slideTextColor;
    ctx.globalAlpha = 0.92;
    ctx.font = `500 ${aspectRatio === '4/5' ? '34px' : '30px'} ${fontName}`;
    const bodyWords = slide.body.split(/\s+/);
    currentLine = '';
    for (let i = 0; i < bodyWords.length; i++) {
      const testLine = currentLine ? `${currentLine} ${bodyWords[i]}` : bodyWords[i];
      if (ctx.measureText(testLine).width > width - 140 && i > 0) {
        ctx.fillText(currentLine, 70, cursorY);
        currentLine = bodyWords[i];
        cursorY += aspectRatio === '4/5' ? 52 : 46;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, 70, cursorY);
    ctx.globalAlpha = 1.0;
    cursorY += 60;

    // Highlight Pill Box
    if (slide.highlightText) {
      cursorY += 15;
      ctx.font = `bold 28px ${fontName}`;
      const textWidth = ctx.measureText(`💡 ${slide.highlightText}`).width;
      ctx.fillStyle = slideAccentColor || 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(70, cursorY, textWidth + 60, 64, 16);
      ctx.fill();

      ctx.fillStyle = slideTextColor;
      ctx.fillText(`💡 ${slide.highlightText}`, 100, cursorY + 44);
    }

    // Footer Bar
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, height - 110);
    ctx.lineTo(width - 70, height - 110);
    ctx.stroke();

    ctx.fillStyle = slideTextColor;
    ctx.globalAlpha = 0.75;
    ctx.font = `500 24px ${fontName}`;
    ctx.textAlign = 'left';
    ctx.fillText(brand.websiteUrl ? brand.websiteUrl.replace(/^https?:\/\//, '') : brand.slug, 70, height - 60);

    ctx.textAlign = 'right';
    ctx.fillText('Swipe Next 👉', width - 70, height - 60);
    ctx.globalAlpha = 1.0;

    return canvas;
  };

  const downloadCurrentSlide = () => {
    const canvas = renderSlideToCanvas(currentSlide, currentSlideIndex);
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${brand.slug}-slide-${currentSlideIndex + 1}.png`;
    a.click();
    setExportNotice(`Downloaded Slide ${currentSlideIndex + 1} (${aspectRatio === '4/5' ? '1080x1350' : '1080x1080'}) PNG`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const downloadAllSlides = async () => {
    setIsExporting(true);
    for (let i = 0; i < currentSlides.length; i++) {
      const canvas = renderSlideToCanvas(currentSlides[i], i);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${brand.slug}-slide-${i + 1}-of-${currentSlides.length}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    setIsExporting(false);
    setExportNotice(`Exported all ${currentSlides.length} slides for Instagram & LinkedIn!`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Slide CRUD Actions
  const handleAddNewSlide = () => {
    const newSlide: CarouselSlide = {
      title: 'Key Insight / Strategy',
      subtitle: 'Next Step',
      body: 'Add your strategic insight or action item here to guide the audience.',
      highlightText: 'Actionable takeaway'
    };
    const updated = [...currentSlides];
    updated.splice(currentSlideIndex + 1, 0, newSlide);
    updateSlidesState(updated);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (currentSlides.length <= 2) {
      alert('Carousels require at least 2 slides.');
      return;
    }
    const updated = currentSlides.filter((_, i) => i !== indexToDelete);
    updateSlidesState(updated);
    if (currentSlideIndex >= updated.length) {
      setCurrentSlideIndex(updated.length - 1);
    }
  };

  const handleMoveSlide = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentSlides.length) return;
    const updated = [...currentSlides];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updateSlidesState(updated);
    setCurrentSlideIndex(toIndex);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Interactive Carousel Deck
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            {currentSlides.length} Slides
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {aspectRatio === '4/5' ? '4:5 Portrait' : '1:1 Square'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-950 text-xs">
            <button
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'single' ? 'bg-white dark:bg-neutral-800 font-semibold shadow-sm' : 'text-neutral-500'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 font-semibold shadow-sm' : 'text-neutral-500'
              }`}
            >
              Grid ({currentSlides.length})
            </button>
          </div>

          {/* Theme & Styling Modal Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Customize visual theme, aspect ratio, fonts, and colors"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>Theme & Style</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20"
              style={{ backgroundColor: slideBg }}
            />
          </button>

          {/* Edit Slide Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Edit slide text, headlines, and key takeaways"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Edit Slide</span>
          </button>

          {/* Download Buttons */}
          <button
            onClick={downloadCurrentSlide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Download active slide as high-res PNG"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>PNG</span>
          </button>

          <button
            onClick={downloadAllSlides}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
            title="Download entire carousel deck as separate PNG images"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export All'}</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Copy full slide text script to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SMART AI OPTIMIZER BAR */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Smart AI Carousel Optimizer</span>
          </div>

          {historyStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo AI Revision
            </button>
          )}
        </div>

        {/* 1-Click Quick Optimization Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => handleAIOptimize('Make cover slide 1 punchier with a high-urgency friction hook')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ⚡ Punchier Hook
          </button>
          <button
            onClick={() => handleAIOptimize('Add concrete statistics and measurable data points to the slides')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            📊 Add Stats & Proof
          </button>
          <button
            onClick={() => handleAIOptimize('Condense all slides into crisp bullet points for mobile skimmability')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ✂️ Condense for Mobile
          </button>
          <button
            onClick={() => handleAIOptimize('Strengthen closing CTA slide to maximize clicks and bio link visits')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            🎯 High-Conversion CTA
          </button>
          <button
            onClick={() => handleAIOptimize('Rewrite for maximum LinkedIn saves and educational bookmarking')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            💬 Boost LinkedIn Saves
          </button>
        </div>

        {/* Custom AI Prompt Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAIOptimize();
            }}
            placeholder="Tell AI how to improve this carousel (e.g. 'Explain slide 2 in simpler terms' or 'Add a real-world case study')..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleAIOptimize()}
            disabled={isOptimizing || !aiInstruction.trim()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isOptimizing ? (
              <>
                <Wand2 className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Optimize</span>
              </>
            )}
          </button>
        </div>

        {/* AI Notice Banner */}
        {aiNotice && (
          <div
            className={`p-2 rounded-xl text-xs flex items-center justify-between ${
              aiNotice.type === 'success'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-100/70 dark:bg-red-950/60 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{aiNotice.message}</span>
            </div>
            <button onClick={() => setAiNotice(null)} className="opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Export notification banner */}
      {exportNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-neutral-400 hover:text-neutral-600">
            ✕
          </button>
        </div>
      )}

      {/* Carousel Display (Single View or Grid View) */}
      {viewMode === 'single' ? (
        <div className="flex flex-col items-center">
          {/* Main Visual Slide Card */}
          <div
            className={`w-full max-w-md ${
              aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-square'
            } rounded-3xl p-7 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 border border-white/10 group`}
            style={{
              backgroundColor: slideBg,
              color: slideTextColor,
              fontFamily:
                fontFamily === 'serif'
                  ? 'Georgia, serif'
                  : fontFamily === 'mono'
                  ? 'ui-monospace, monospace'
                  : 'inherit'
            }}
          >
            {/* Background subtle watermark/pattern */}
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none select-none overflow-hidden">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="w-48 h-48 object-contain filter grayscale" />
              ) : (
                <span className="text-9xl font-black">{brand.logoEmoji || brand.name.charAt(0)}</span>
              )}
            </div>

            {/* Slide Top Bar */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-7 h-7 object-contain rounded-md bg-white/20 p-0.5 backdrop-blur-xs"
                  />
                ) : brand.logoEmoji ? (
                  <span className="text-xl">{brand.logoEmoji}</span>
                ) : (
                  <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center font-bold text-xs">
                    {brand.name.charAt(0)}
                  </span>
                )}
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {brand.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm">
                  {currentSlideIndex + 1} / {currentSlides.length}
                </span>
              </div>
            </div>

            {/* Slide Core Content */}
            <div className="my-auto space-y-3.5 relative z-10">
              {currentSlide.subtitle && (
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {currentSlide.subtitle}
                </div>
              )}
              <h3 className="text-2xl font-extrabold leading-tight tracking-tight">
                {currentSlide.title}
              </h3>
              <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line font-medium">
                {currentSlide.body}
              </p>

              {currentSlide.highlightText && (
                <div
                  className="inline-block mt-2 px-3.5 py-1.5 rounded-xl backdrop-blur-md text-xs font-bold tracking-wide shadow-xs"
                  style={{ backgroundColor: slideAccentColor }}
                >
                  💡 {currentSlide.highlightText}
                </div>
              )}
            </div>

            {/* Slide Bottom Bar */}
            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs opacity-75 relative z-10">
              <span>{brand.websiteUrl ? new URL(brand.websiteUrl).hostname : brand.slug}</span>
              <span className="flex items-center gap-1 font-semibold">Swipe Next 👉</span>
            </div>
          </div>

          {/* Slide Navigation & Quick Actions Bar */}
          <div className="flex items-center justify-between w-full max-w-md mt-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                title="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleMoveSlide(currentSlideIndex, 'left')}
                disabled={currentSlideIndex === 0}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-20 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                title="Move Slide Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {currentSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlideIndex === i ? 'w-6 bg-neutral-900 dark:bg-white' : 'w-2 bg-neutral-300 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleMoveSlide(currentSlideIndex, 'right')}
                disabled={currentSlideIndex === currentSlides.length - 1}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-20 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                title="Move Slide Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentSlideIndex(Math.min(currentSlides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === currentSlides.length - 1}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                title="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid Overview */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {currentSlides.map((slide, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setViewMode('single');
              }}
              className={`${
                aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-square'
              } rounded-2xl p-4 flex flex-col justify-between shadow-sm cursor-pointer hover:scale-[1.02] transition-transform border border-white/10 relative group`}
              style={{
                backgroundColor: slideBg,
                color: slideTextColor
              }}
            >
              <div className="flex justify-between items-center text-[10px] font-bold opacity-80">
                <span>{slide.subtitle || brand.name}</span>
                <span>#{idx + 1}</span>
              </div>
              <div className="my-auto">
                <h4 className="text-xs font-bold leading-snug line-clamp-2">{slide.title}</h4>
                <p className="text-[10px] opacity-80 line-clamp-3 mt-1">{slide.body}</p>
              </div>
              <div className="text-[9px] opacity-70 truncate font-semibold">
                {slide.highlightText || brand.slug}
              </div>
            </div>
          ))}

          {/* Add Slide Tile */}
          <button
            onClick={handleAddNewSlide}
            className={`${
              aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-square'
            } rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 p-4 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-emerald-500 transition-colors`}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-bold">Add Slide</span>
          </button>
        </div>
      )}

      {/* MODAL 1: Theme, Colors & Aspect Ratio Customizer */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Palette className="w-4 h-4 text-indigo-500" />
                Carousel Theme & Layout Customizer
              </div>
              <button onClick={() => setIsThemeModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* 1-Click Curated Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Visual Themes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyTheme('brand')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'brand' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Brand Style</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Official Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme('midnight')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'midnight' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Midnight</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Dark Obsidian</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme('clean')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'clean' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Clean Minimal</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Crisp Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme('terracotta')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'terracotta' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-800" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Terracotta</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Warm Bronze</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme('neon')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'neon' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-lime-400" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Cyber Lime</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">High Voltage</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme('dusk')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTheme === 'dusk' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-pink-600" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Sunset Dusk</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Rich Violet</span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio & Typography Selection */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('4/5')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      aspectRatio === '4/5' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    4:5 Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1/1')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      aspectRatio === '1/1' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    1:1 Square
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Typography Style
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFontFamily('sans')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      fontFamily === 'sans' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('serif')}
                    className={`flex-1 py-2 text-xs font-serif font-bold rounded-xl border transition-colors ${
                      fontFamily === 'serif' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('mono')}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition-colors ${
                      fontFamily === 'mono' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    Mono
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Color Overrides */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Custom Color Adjustments
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-neutral-500">Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slideBg.startsWith('#') && slideBg.length === 7 ? slideBg : '#059669'}
                      onChange={(e) => setSlideBg(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5"
                    />
                    <input
                      type="text"
                      value={slideBg}
                      onChange={(e) => setSlideBg(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[11px] text-neutral-500">Text Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slideTextColor.startsWith('#') && slideTextColor.length === 7 ? slideTextColor : '#ffffff'}
                      onChange={(e) => setSlideTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5"
                    />
                    <input
                      type="text"
                      value={slideTextColor}
                      onChange={(e) => setSlideTextColor(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Apply Style
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Slide Content Editor */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Slide #{currentSlideIndex + 1} of {currentSlides.length}
              </div>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Slide Editor Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Slide Subtitle / Category Tag
                </label>
                <input
                  type="text"
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => {
                    const updated = [...currentSlides];
                    updated[currentSlideIndex].subtitle = e.target.value;
                    updateSlidesState(updated);
                  }}
                  placeholder="e.g. The Proven Strategy, Step 1, Core Rule"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Main Headline / Title
                </label>
                <input
                  type="text"
                  value={currentSlide.title}
                  onChange={(e) => {
                    const updated = [...currentSlides];
                    updated[currentSlideIndex].title = e.target.value;
                    updateSlidesState(updated);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Body Text / Detailed Points
                </label>
                <textarea
                  rows={4}
                  value={currentSlide.body}
                  onChange={(e) => {
                    const updated = [...currentSlides];
                    updated[currentSlideIndex].body = e.target.value;
                    updateSlidesState(updated);
                  }}
                  className="w-full px-3 py-2 text-xs leading-relaxed rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Key Takeaway / Highlight Pill (Optional)
                </label>
                <input
                  type="text"
                  value={currentSlide.highlightText || ''}
                  onChange={(e) => {
                    const updated = [...currentSlides];
                    updated[currentSlideIndex].highlightText = e.target.value;
                    updateSlidesState(updated);
                  }}
                  placeholder="e.g. Protect your capital first"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Slide Actions */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleDeleteSlide(currentSlideIndex);
                  setIsEditModalOpen(false);
                }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Slide
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNewSlide}
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slide After
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Done Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
