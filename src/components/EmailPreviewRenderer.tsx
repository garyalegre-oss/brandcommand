'use client';

import React, { useState, useEffect } from 'react';
import { Brand, EmailCampaign } from '../types/brand';
import { Mail, Copy, Check, Smartphone, Monitor, Sparkles, ExternalLink, Code, Send, X, AlertCircle, CheckCircle2, Upload, Image as ImageIcon, Palette, RotateCcw, Wand2 } from 'lucide-react';

interface EmailPreviewRendererProps {
  brand: Brand;
  campaign: EmailCampaign;
  onUpdateBrand?: (updatedBrand: Brand) => void;
  onUpdateCampaign?: (updatedCampaign: EmailCampaign) => void;
}

export function EmailPreviewRenderer({ brand, campaign, onUpdateBrand, onUpdateCampaign }: EmailPreviewRendererProps) {
  const [currentCampaign, setCurrentCampaign] = useState<EmailCampaign>(campaign);
  const [historyStack, setHistoryStack] = useState<EmailCampaign[]>([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [viewDevice, setViewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState(brand.logoUrl || '');
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  // AI Optimizer State
  const [aiInstruction, setAiInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setCurrentCampaign(campaign);
  }, [campaign]);

  const updateCampaign = (newCampaign: EmailCampaign) => {
    setHistoryStack((prev) => [...prev.slice(-4), currentCampaign]);
    setCurrentCampaign(newCampaign);
    if (onUpdateCampaign) {
      onUpdateCampaign(newCampaign);
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((s) => s.slice(0, -1));
    setCurrentCampaign(prev);
    if (onUpdateCampaign) {
      onUpdateCampaign(prev);
    }
    setAiNotice({ message: 'Reverted to previous email version.', type: 'success' });
    setTimeout(() => setAiNotice(null), 3000);
  };

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
          format: 'newsletter',
          currentData: currentCampaign,
          instruction: promptToUse,
          apiKey: savedGeminiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiNotice({ message: data.message || 'Optimization failed.', type: 'error' });
      } else {
        const optimized = (data.data?.emailCampaign || data.data) as EmailCampaign;
        updateCampaign(optimized);
        setAiNotice({ message: data.explanation || 'Email campaign successfully optimized!', type: 'success' });
        setAiInstruction('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotice({ message: error.message || 'Network error occurred.', type: 'error' });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Email Custom Colors State
  const [isColorsModalOpen, setIsColorsModalOpen] = useState(false);
  const [headerBg, setHeaderBg] = useState(brand.primaryColor);
  const [headerTextColor, setHeaderTextColor] = useState(brand.textColor || '#ffffff');
  const [ctaBg, setCtaBg] = useState(brand.primaryColor);
  const [ctaTextColor, setCtaTextColor] = useState(brand.textColor || '#ffffff');
  const [cardBg, setCardBg] = useState('#ffffff');
  const [outerBg, setOuterBg] = useState('#f8fafc');

  // Keep colors in sync with brand switching
  useEffect(() => {
    setHeaderBg(brand.primaryColor);
    setHeaderTextColor(brand.textColor || '#ffffff');
    setCtaBg(brand.primaryColor);
    setCtaTextColor(brand.textColor || '#ffffff');
  }, [brand.id, brand.primaryColor, brand.textColor]);

  useEffect(() => {
    setImgError(false);
    setCustomLogoInput(brand.logoUrl || '');
  }, [brand.logoUrl]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setCustomLogoInput(dataUrl);
        setImgError(false);
        if (onUpdateBrand) {
          onUpdateBrand({
            ...brand,
            logoUrl: dataUrl
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = (url: string) => {
    setCustomLogoInput(url);
    setImgError(false);
    if (onUpdateBrand) {
      onUpdateBrand({
        ...brand,
        logoUrl: url.trim() ? url.trim() : undefined
      });
    }
  };

  // Send Test Email State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('brandcommand_resend_api_key');
      if (savedKey) setResendApiKey(savedKey);
      const savedEmail = localStorage.getItem('brandcommand_test_email');
      if (savedEmail) setTestEmail(savedEmail);
    } catch {}
  }, []);

  if (!currentCampaign) return null;

  const activeSubject = currentCampaign.subjectLines[selectedSubjectIndex] || currentCampaign.subjectLines[0];
  const brandDomain = brand.websiteUrl ? new URL(brand.websiteUrl).hostname : `${brand.slug}.com`;
  const senderEmail = `hello@${brandDomain}`;

  const generateRawHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeSubject.text}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${outerBg}; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${cardBg}; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: ${headerBg}; color: ${headerTextColor}; padding: 28px 24px; text-align: center;">
      ${brand.logoUrl
        ? `<div style="margin-bottom: 12px;"><img src="${brand.logoUrl}" alt="${brand.name}" style="max-height: 52px; max-width: 200px; object-fit: contain; vertical-align: middle; background-color: rgba(255,255,255,0.95); padding: 6px 12px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" /></div>`
        : `<div style="font-size: 36px; margin-bottom: 8px;">${brand.logoEmoji || '✨'}</div>`
      }
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${brand.name}</h1>
      <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85;">${brand.tagline}</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 22px; font-weight: 800; margin-top: 0; color: #0f172a; line-height: 1.3;">${currentCampaign.headline}</h2>
      <p style="font-size: 15px; font-weight: 600; color: #334155;">${currentCampaign.greeting}</p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569; white-space: pre-line;">${currentCampaign.intro}</p>
      
      <div style="margin: 28px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 16px 0;">
        ${currentCampaign.keyPoints
          .map(
            (kp) => `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #0f172a;">${kp.title}</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">${kp.description}</p>
        </div>`
          )
          .join('')}
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${currentCampaign.ctaButton.url}" style="background-color: ${ctaBg}; color: ${ctaTextColor}; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block;">
          ${currentCampaign.ctaButton.text}
        </a>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #64748b; white-space: pre-line; margin-top: 28px;">
        ${currentCampaign.signOff}
      </p>

      ${
        currentCampaign.psNote
          ? `<p style="font-size: 13px; line-height: 1.5; color: #475569; background-color: #f8fafc; border-left: 3px solid ${ctaBg}; padding: 12px; border-radius: 6px; margin-top: 24px;">
              <strong>P.S.</strong> ${currentCampaign.psNote.replace(/^P\.S\.\s*/i, '')}
            </p>`
          : ''
      }
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px;">You received this email because you subscribed to updates from ${brand.name}.</p>
      <p style="margin: 0;"><a href="#" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> • <a href="${currentCampaign.ctaButton.url}" style="color: #64748b; text-decoration: underline;">Visit Website</a></p>
    </div>
  </div>
 </body>
 </html>`;
  };

  const handleCopyText = () => {
    const text = `SUBJECT: ${activeSubject.text}\nPREVIEW: ${currentCampaign.previewText}\n\n${currentCampaign.greeting}\n\n${currentCampaign.intro}\n\n` +
      currentCampaign.keyPoints.map(kp => `* ${kp.title}: ${kp.description}`).join('\n\n') +
      `\n\n[CTA: ${currentCampaign.ctaButton.text} -> ${currentCampaign.ctaButton.url}]\n\n` +
      `${currentCampaign.signOff}\n\n${currentCampaign.psNote || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generateRawHtml());
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleSendLiveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setSendResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      if (resendApiKey) {
        localStorage.setItem('brandcommand_resend_api_key', resendApiKey);
      }
      localStorage.setItem('brandcommand_test_email', testEmail);

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          apiKey: resendApiKey,
          brandName: brand.name,
          brandPrimaryColor: headerBg,
          brandTextColor: headerTextColor,
          emailHeaderBg: headerBg,
          emailHeaderTextColor: headerTextColor,
          emailCtaBg: ctaBg,
          emailCtaTextColor: ctaTextColor,
          emailCardBg: cardBg,
          emailBodyBg: outerBg,
          brandLogoEmoji: brand.logoEmoji,
          brandLogoUrl: brand.logoUrl,
          brandTagline: brand.tagline,
          subject: activeSubject.text,
          headline: currentCampaign.headline,
          greeting: currentCampaign.greeting,
          intro: currentCampaign.intro,
          keyPoints: currentCampaign.keyPoints,
          ctaButton: currentCampaign.ctaButton,
          signOff: currentCampaign.signOff,
          psNote: currentCampaign.psNote
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSendResult({ success: false, message: data.message || 'Failed to send email.' });
      } else {
        setSendResult({ success: true, message: `Delivered! Check ${testEmail} (check inbox or spam folder).` });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSendResult({ success: false, message: error.message || 'Network error occurred.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Email Newsletter & Campaign
          </span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            High Conversion
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-950 text-xs">
            <button
              onClick={() => setViewDevice('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                viewDevice === 'desktop' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-400'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewDevice('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                viewDevice === 'mobile' ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'text-neutral-400'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Logo Customizer button */}
          <button
            onClick={() => {
              setCustomLogoInput(brand.logoUrl || '');
              setIsLogoModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Update Brand Logo used in Email Header"
          >
            <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span>Brand Logo</span>
            {brand.logoUrl && !imgError ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Image Logo Active" />
            ) : (
              <span className="text-[11px]">{brand.logoEmoji}</span>
            )}
          </button>

          {/* Email Colors Customizer button */}
          <button
            onClick={() => setIsColorsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Customize Email Header, CTA & Palette Colors"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>Colors</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/30 shadow-2xs"
              style={{ backgroundColor: headerBg }}
            />
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedText ? 'Copied Text' : 'Copy Text'}
          </button>

          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />}
            {copiedHtml ? 'Copied HTML!' : 'Copy HTML'}
          </button>

          <button
            onClick={() => {
              setSendResult(null);
              setIsSendModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test Email
          </button>
        </div>
      </div>

      {/* SMART AI EMAIL OPTIMIZER BAR */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-pink-500/10 border border-emerald-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Smart AI Email Optimizer</span>
          </div>

          {historyStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo Revision
            </button>
          )}
        </div>

        {/* 1-Click Quick Optimization Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => handleAIOptimize('Generate 3 higher open-rate subject lines with curiosity gaps')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ⚡ High-Open Subject Lines
          </button>
          <button
            onClick={() => handleAIOptimize('Add a high-urgency 48-hour deadline with bonus P.S. note offer')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ⏰ Add 48h Urgency
          </button>
          <button
            onClick={() => handleAIOptimize('Condense intro and key points for faster reading and higher click-throughs')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            ✂️ Streamline for Higher CTR
          </button>
          <button
            onClick={() => handleAIOptimize('Make the greeting and intro more conversational and relatable')}
            disabled={isOptimizing}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-medium transition-colors text-[11px]"
          >
            💬 Personalize Tone
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
            placeholder="Tell AI how to improve this email (e.g. 'Add a free shipping announcement' or 'Make intro sound more VIP')..."
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
                <span>Optimize Email</span>
              </>
            )}
          </button>
        </div>

        {/* AI Notice */}
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

      {/* Subject Line Selector (Curiosity, Direct, Benefit) */}
      <div className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
            ⚡ Tested Subject Line Variations (Pick Your Angle)
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Optimized Open Rates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {currentCampaign.subjectLines.map((sl, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSubjectIndex(idx)}
              className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                selectedSubjectIndex === idx
                  ? 'border-emerald-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-900'
              }`}
            >
              <span className="block text-[10px] uppercase font-bold text-neutral-400 mb-0.5">
                {sl.type} angle
              </span>
              <span className="line-clamp-2">{sl.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email Inbox Preview Client */}
      <div className="flex justify-center p-4 sm:p-6 rounded-3xl transition-colors duration-300 border border-neutral-200/60 dark:border-neutral-800" style={{ backgroundColor: outerBg }}>
        <div
          className={`w-full border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${
            viewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}
          style={{ backgroundColor: cardBg }}
        >
          {/* Email Client Header Bar */}
          <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
            <div className="flex justify-between items-center text-neutral-500">
              <span className="truncate">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">From: </span>
                {brand.name} &lt;{senderEmail}&gt;
              </span>
              <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                Inbox
              </span>
            </div>

            <div className="truncate text-neutral-800 dark:text-neutral-200 font-bold text-sm pt-0.5">
              {activeSubject.text}
            </div>

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              <span className="font-semibold">Preview: </span>
              {currentCampaign.previewText}
            </div>
          </div>

          {/* Email Body Canvas */}
          <div className="p-6 space-y-6 text-neutral-800 dark:text-neutral-200" style={{ backgroundColor: cardBg }}>
            {/* Branded Header Banner */}
            <div
              className="p-5 rounded-xl text-center space-y-1.5 shadow-sm relative group"
              style={{ backgroundColor: headerBg, color: headerTextColor }}
            >
              {/* Quick actions on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsColorsModalOpen(true)}
                  className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs shadow-xs"
                  title="Customize email colors"
                >
                  <Palette className="w-3 h-3 text-amber-400" />
                  Colors
                </button>
                {onUpdateBrand && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLogoInput(brand.logoUrl || '');
                      setIsLogoModalOpen(true);
                    }}
                    className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs shadow-xs"
                    title="Upload or change logo"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    Logo
                  </button>
                )}
              </div>

              {brand.logoUrl && !imgError ? (
                <div className="flex justify-center mb-1">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    onError={() => setImgError(true)}
                    className="max-h-12 max-w-[200px] object-contain bg-white/95 dark:bg-neutral-900/90 px-3.5 py-1.5 rounded-xl shadow-xs border border-white/20"
                  />
                </div>
              ) : (
                <div className="text-3xl font-extrabold mb-1">{brand.logoEmoji || '✨'}</div>
              )}
              <h3 className="text-base font-extrabold tracking-tight">{brand.name}</h3>
              <p className="text-[11px] opacity-85">{brand.tagline}</p>
            </div>

            {/* Email Greeting & Intro */}
            <div className="space-y-3 text-xs leading-relaxed">
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
                {currentCampaign.headline}
              </h2>
              <p className="font-semibold">{currentCampaign.greeting}</p>
              <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">
                {currentCampaign.intro}
              </p>
            </div>

            {/* Key Value Points */}
            <div className="space-y-3 py-2 border-y border-neutral-100 dark:border-neutral-800">
              {currentCampaign.keyPoints.map((kp, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100">
                    {kp.title}
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {kp.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Prominent CTA Button */}
            <div className="text-center pt-2">
              <a
                href={currentCampaign.ctaButton.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
                style={{ backgroundColor: ctaBg, color: ctaTextColor }}
              >
                {currentCampaign.ctaButton.text}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Sign-off & P.S. Note */}
            <div className="space-y-3 text-xs pt-2">
              <p className="text-neutral-500 whitespace-pre-line">{currentCampaign.signOff}</p>

              {currentCampaign.psNote && (
                <div
                  className="p-3 rounded-lg text-[11px] leading-relaxed border-l-2 bg-neutral-50 dark:bg-neutral-900"
                  style={{ borderLeftColor: ctaBg }}
                >
                  <span className="font-bold">P.S. </span>
                  {currentCampaign.psNote.replace(/^P\.S\.\s*/i, '')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-[10px] text-neutral-400 text-center border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-1">
              <p>© 2026 {brand.name}. All rights reserved.</p>
              <p className="underline cursor-pointer">Unsubscribe from this newsletter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Test Email Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Send className="w-4 h-4 text-emerald-500" />
                Send Real Test to Your Inbox
              </div>
              <button onClick={() => setIsSendModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Deliver this exact branded email for <strong className="text-neutral-700 dark:text-neutral-200">{brand.name}</strong> to your own inbox right now.
            </p>

            <form onSubmit={handleSendLiveEmail} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Your Destination Email *
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase">
                    Resend API Key
                  </label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-neutral-400 block">
                  Saved securely in your local browser so you only enter it once.
                </span>
              </div>

              {/* Status Alert Banner */}
              {sendResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    sendResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{sendResult.message}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <>Sending to your inbox...</>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Live Test Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Logo & Header Settings Modal */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Email Header Brand Logo
              </div>
              <button onClick={() => setIsLogoModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Set or upload the official logo for <strong className="text-neutral-700 dark:text-neutral-200">{brand.name}</strong>. It will be embedded in the newsletter preview, raw HTML exports, and live email broadcasts.
            </p>

            {/* Current Active Preview */}
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
              {customLogoInput ? (
                <img
                  src={customLogoInput}
                  alt={brand.name}
                  className="w-14 h-14 rounded-xl object-contain bg-white dark:bg-neutral-900 p-2 border border-neutral-200 dark:border-neutral-800 shadow-xs"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-xs"
                  style={{ backgroundColor: brand.primaryColor, color: brand.textColor }}
                >
                  {brand.logoEmoji || '✨'}
                </div>
              )}
              <div className="flex-1 text-xs">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {customLogoInput ? 'Custom Image Logo Active' : 'Fallback Emoji Active'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {customLogoInput ? 'Will render in email headers and HTML exports' : `Displays "${brand.logoEmoji || '✨'}" when no image logo is set`}
                </div>
              </div>
            </div>

            {/* Upload or Link Logo */}
            <div className="space-y-3">
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl border border-dashed border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  Upload Local File (PNG / SVG / JPG)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase">
                  Or Paste Public Image / SVG URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLogoInput}
                    onChange={(e) => setCustomLogoInput(e.target.value)}
                    placeholder="https://yourbrand.com/logo.png or SVG data:..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyLogoUrl(customLogoInput)}
                    className="px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {customLogoInput && (
                <button
                  type="button"
                  onClick={() => handleApplyLogoUrl('')}
                  className="text-[11px] text-red-500 hover:text-red-600 underline font-medium block"
                >
                  Remove custom logo and revert to emoji
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Color Customizer Modal */}
      {isColorsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                <Palette className="w-4 h-4 text-indigo-500" />
                Customize Email Colors & Theme
              </div>
              <button
                type="button"
                onClick={() => setIsColorsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Customize the color palette for this email newsletter. Changes update live in the preview, raw HTML exports, and live email sends.
            </p>

            {/* Quick 1-Click Curated Color Themes */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                ⚡ 1-Click Curated Palettes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Brand Signature */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg(brand.primaryColor);
                    setHeaderTextColor(brand.textColor || '#ffffff');
                    setCtaBg(brand.primaryColor);
                    setCtaTextColor(brand.textColor || '#ffffff');
                    setCardBg('#ffffff');
                    setOuterBg('#f8fafc');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: brand.primaryColor }} />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Brand Signature</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Official Brand Colors</span>
                </button>

                {/* Midnight Luxury */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg('#0f172a');
                    setHeaderTextColor('#ffffff');
                    setCtaBg(brand.primaryColor);
                    setCtaTextColor(brand.textColor || '#ffffff');
                    setCardBg('#ffffff');
                    setOuterBg('#090d16');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Midnight Luxury</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Deep Slate + Dark Backdrop</span>
                </button>

                {/* Clean Editorial */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg('#ffffff');
                    setHeaderTextColor('#0f172a');
                    setCtaBg(brand.primaryColor);
                    setCtaTextColor(brand.textColor || '#ffffff');
                    setCardBg('#ffffff');
                    setOuterBg('#f1f5f9');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Clean Editorial</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Crisp Minimal White</span>
                </button>

                {/* Warm Terracotta */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg('#78350f');
                    setHeaderTextColor('#ffffff');
                    setCtaBg('#b45309');
                    setCtaTextColor('#ffffff');
                    setCardBg('#fffdfa');
                    setOuterBg('#f7f4ee');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-800" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Warm Terracotta</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Bronze + Ivory Cream</span>
                </button>

                {/* Emerald High-Growth */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg('#064e3b');
                    setHeaderTextColor('#ffffff');
                    setCtaBg('#059669');
                    setCtaTextColor('#ffffff');
                    setCardBg('#ffffff');
                    setOuterBg('#ecfdf5');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-700" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">High-Conversion</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Emerald Finance Green</span>
                </button>

                {/* Royal Violet */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderBg('#4c1d95');
                    setHeaderTextColor('#ffffff');
                    setCtaBg('#7c3aed');
                    setCtaTextColor('#ffffff');
                    setCardBg('#ffffff');
                    setOuterBg('#f5f3ff');
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 text-left transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-violet-700" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Royal Violet</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Luxury Velvet & Lavender</span>
                </button>
              </div>
            </div>

            {/* Granular Color Controls */}
            <div className="space-y-4 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              {/* Header Banner Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                    Header Banner Background
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-mono">{headerBg}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={headerBg.startsWith('#') && headerBg.length === 7 ? headerBg : '#059669'}
                    onChange={(e) => setHeaderBg(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5 bg-white dark:bg-neutral-800 shrink-0"
                  />
                  <input
                    type="text"
                    value={headerBg}
                    onChange={(e) => setHeaderBg(e.target.value)}
                    placeholder="#hex code"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick Color Swatches */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[brand.primaryColor, '#0f172a', '#7c3aed', '#059669', '#2563eb', '#b45309', '#b9f566', '#ffffff'].map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setHeaderBg(c);
                          if (c === '#ffffff' || c === '#b9f566') {
                            setHeaderTextColor('#0f172a');
                          } else {
                            setHeaderTextColor('#ffffff');
                          }
                        }}
                        className="w-6 h-6 rounded-lg border border-black/15 dark:border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Header Text Color */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase block">
                  Header Text & Tagline Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeaderTextColor('#ffffff')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        headerTextColor.toLowerCase() === '#ffffff'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Light / White (#fff)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTextColor('#0f172a')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        headerTextColor.toLowerCase() === '#0f172a'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Dark / Slate (#0f172a)
                    </button>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={headerTextColor.startsWith('#') && headerTextColor.length === 7 ? headerTextColor : '#ffffff'}
                      onChange={(e) => setHeaderTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={headerTextColor}
                      onChange={(e) => setHeaderTextColor(e.target.value)}
                      className="w-24 px-2 py-1.5 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                    Call-to-Action (CTA) Button Color
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCtaBg(headerBg);
                      setCtaTextColor(headerTextColor);
                    }}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Match Header Color
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={ctaBg.startsWith('#') && ctaBg.length === 7 ? ctaBg : '#059669'}
                    onChange={(e) => setCtaBg(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5 bg-white dark:bg-neutral-800 shrink-0"
                  />
                  <input
                    type="text"
                    value={ctaBg}
                    onChange={(e) => setCtaBg(e.target.value)}
                    placeholder="#hex code"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* CTA Text button toggle */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCtaTextColor('#ffffff')}
                      className={`px-2.5 py-2 rounded-lg text-xs font-bold border ${
                        ctaTextColor.toLowerCase() === '#ffffff' ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950' : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                      title="White button text"
                    >
                      White Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setCtaTextColor('#0f172a')}
                      className={`px-2.5 py-2 rounded-lg text-xs font-bold border ${
                        ctaTextColor.toLowerCase() === '#0f172a' ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950' : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                      title="Dark button text"
                    >
                      Dark Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Canvas Style */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase block">
                  Email Canvas Backdrop & Card Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCardBg('#ffffff');
                      setOuterBg('#f8fafc');
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 ${
                      outerBg === '#f8fafc' ? 'border-indigo-500 bg-white dark:bg-neutral-900 text-indigo-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-100 border border-neutral-300" />
                    Clean Slate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCardBg('#fffdfa');
                      setOuterBg('#f7f4ee');
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 ${
                      outerBg === '#f7f4ee' ? 'border-indigo-500 bg-white dark:bg-neutral-900 text-indigo-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-50 border border-amber-200" />
                    Warm Ivory
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCardBg('#ffffff');
                      setOuterBg('#090d16');
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 ${
                      outerBg === '#090d16' ? 'border-indigo-500 bg-white dark:bg-neutral-900 text-indigo-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700" />
                    Night Canvas
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setHeaderBg(brand.primaryColor);
                  setHeaderTextColor(brand.textColor || '#ffffff');
                  setCtaBg(brand.primaryColor);
                  setCtaTextColor(brand.textColor || '#ffffff');
                  setCardBg('#ffffff');
                  setOuterBg('#f8fafc');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Brand Defaults
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onUpdateBrand && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateBrand({
                        ...brand,
                        primaryColor: headerBg,
                        textColor: headerTextColor
                      });
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    title="Permanently set this as the primary brand color for this venture"
                  >
                    Sync to Brand Profile
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsColorsModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Done & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
