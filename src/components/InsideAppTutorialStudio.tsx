'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brand, BrandAsset, Post, VideoScript, CarouselSlide } from '../types/brand';
import { VideoScriptRenderer } from './VideoScriptRenderer';
import { CarouselRenderer } from './CarouselRenderer';
import {
  Bot,
  Sparkles,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Upload,
  CheckCircle2,
  Video,
  Layers,
  Calendar,
  Trash2,
  Terminal,
  ShieldCheck,
  Mail,
  Cookie,
  RotateCcw,
  Play,
  Download,
  Crosshair
} from 'lucide-react';

interface InsideAppTutorialStudioProps {
  brand: Brand;
  onUpdateBrand: (updatedBrand: Brand) => void;
  onSavePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
}

export function InsideAppTutorialStudio({
  brand,
  onUpdateBrand,
  onSavePost
}: InsideAppTutorialStudioProps) {
  const baseSite = (brand.websiteUrl || `https://${brand.slug || 'evidraw'}.com`).replace(/\/$/, '');

  // Auth Method & Credentials State
  const [authMethod, setAuthMethod] = useState<'email_otp' | 'password' | 'cookie'>(
    brand.botAuth?.authMethod || 'email_otp'
  );
  const [loginUrl, setLoginUrl] = useState<string>(brand.botAuth?.loginUrl || `${baseSite}/login`);
  const [botEmail, setBotEmail] = useState<string>(brand.botAuth?.botEmail || '');
  const [botPassword, setBotPassword] = useState<string>(brand.botAuth?.botPassword || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Email OTP Interactive + Static Pin State
  const [otpStep, setOtpStep] = useState<'idle' | 'sending_code' | 'awaiting_code'>('idle');
  const [liveOtpCode, setLiveOtpCode] = useState<string>('');
  const [staticOtpPin, setStaticOtpPin] = useState<string>(brand.botAuth?.staticOtpPin || '');
  const [loginScreenPreview, setLoginScreenPreview] = useState<string | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(!!brand.botAuth?.hasSavedSession);

  // Cookie & Routes State
  const isVarbonaLike =
    (brand.name || '').toLowerCase().includes('varbona') ||
    (brand.websiteUrl || '').toLowerCase().includes('varbona');
  const defaultTargetsForBrand = isVarbonaLike
    ? ['Home', 'Market', 'Portfolio', 'Scouting', 'Fantasy']
    : ['/dashboard', '/portfolio', '/learning-lab'];

  const [sessionCookie, setSessionCookie] = useState<string>(brand.botAuth?.sessionCookie || '');
  const [routesInput, setRoutesInput] = useState<string>(
    (brand.botAuth?.internalRoutes || defaultTargetsForBrand).join(', ')
  );
  const [discoveredNavTargets, setDiscoveredNavTargets] = useState<string[]>(
    isVarbonaLike
      ? ['Home', 'Market', 'Portfolio', 'Scouting', 'Watchlist', 'Player IPOs', 'Fantasy', 'Matchday', 'Leaderboard', 'Scout club']
      : []
  );
  const [isDiscoveringNav, setIsDiscoveringNav] = useState<boolean>(false);

  // Crawl & Screen Vault State
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlLog, setCrawlLog] = useState<string | null>(null);
  const [discoveredTopics, setDiscoveredTopics] = useState<string[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [recordingClipId, setRecordingClipId] = useState<string | null>(null);
  const [activeWaypointByScreen, setActiveWaypointByScreen] = useState<Record<string, number>>({});
  const [customScrollByScreen, setCustomScrollByScreen] = useState<Record<string, number | undefined>>({});
  const [clipCaptionMode, setClipCaptionMode] = useState<'off' | 'compact'>('off');
  const [showScreenCallouts, setShowScreenCallouts] = useState<boolean>(true);
  const [videoFormat, setVideoFormat] = useState<'16:9' | '9:16'>('16:9');
  const clipTimersRef = useRef<NodeJS.Timeout[]>([]);
  const clipAudioRef = useRef<HTMLAudioElement | null>(null);
  const manualScreenInputRef = useRef<HTMLInputElement | null>(null);

  // Tutorial Synthesis State
  const [tutorialGoal, setTutorialGoal] = useState<string>('');
  const [isBuildingTutorial, setIsBuildingTutorial] = useState<boolean>(false);
  const [generatedTutorial, setGeneratedTutorial] = useState<{
    tutorialTitle: string;
    caption: string;
    videoScript: VideoScript;
    carouselSlides: CarouselSlide[];
  } | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'video' | 'carousel'>('video');
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);

  useEffect(() => {
    const site = (brand.websiteUrl || `https://${brand.slug || 'evidraw'}.com`).replace(/\/$/, '');
    setAuthMethod(brand.botAuth?.authMethod || 'email_otp');
    setLoginUrl(brand.botAuth?.loginUrl || `${site}/login`);
    setBotEmail(brand.botAuth?.botEmail || '');
    setBotPassword(brand.botAuth?.botPassword || '');
    setStaticOtpPin(brand.botAuth?.staticOtpPin || '');
    setSessionCookie(brand.botAuth?.sessionCookie || '');
    setHasSavedSession(!!brand.botAuth?.hasSavedSession);
    setOtpStep('idle');
    setLiveOtpCode('');
    setLoginScreenPreview(null);
    const isVarbonaBrand =
      (brand.name || '').toLowerCase().includes('varbona') ||
      site.toLowerCase().includes('varbona');
    const savedOrDefaultRoutes =
      brand.botAuth?.internalRoutes &&
      !(
        isVarbonaBrand &&
        brand.botAuth.internalRoutes.includes('/dashboard') &&
        brand.botAuth.internalRoutes.includes('/learning-lab')
      )
        ? brand.botAuth.internalRoutes
        : isVarbonaBrand
        ? ['Home', 'Market', 'Portfolio', 'Scouting', 'Fantasy']
        : ['/dashboard', '/portfolio', '/learning-lab'];

    setRoutesInput(savedOrDefaultRoutes.join(', '));
    setDiscoveredNavTargets(
      isVarbonaBrand
        ? ['Home', 'Market', 'Portfolio', 'Scouting', 'Watchlist', 'Player IPOs', 'Fantasy', 'Matchday', 'Leaderboard', 'Scout club']
        : []
    );
    setTutorialGoal(
      `How to use ${brand.name} step-by-step: ${brand.suggestedTopics?.[0] || brand.tagline}`
    );
    setGeneratedTutorial(null);
    setCrawlLog(null);
  }, [brand.id]);

  // All internal / screenshot assets available for tutorials
  const authenticatedScreens: BrandAsset[] = (brand.brandAssets || []).filter(
    (a) => a.type === 'screenshot' || a.type === 'hero' || a.isAuthenticated
  );

  const saveBotConfigToBrand = (
    newAssets?: BrandAsset[],
    newTopics?: string[],
    sessionSavedFlag?: boolean
  ) => {
    const parsedRoutes = routesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const existingAssets = brand.brandAssets || [];
    const mergedAssets = newAssets ? [...newAssets, ...existingAssets] : existingAssets;

    const existingTopics = brand.suggestedTopics || [];
    const mergedTopics =
      newTopics && newTopics.length > 0
        ? Array.from(new Set([...newTopics, ...existingTopics]))
        : existingTopics;

    const savedFlag = sessionSavedFlag !== undefined ? sessionSavedFlag : hasSavedSession;
    setHasSavedSession(savedFlag);

    onUpdateBrand({
      ...brand,
      brandAssets: mergedAssets,
      suggestedTopics: mergedTopics,
      botAuth: {
        authMethod,
        loginUrl,
        botEmail,
        botPassword,
        staticOtpPin,
        sessionCookie,
        internalRoutes: parsedRoutes,
        lastCrawledAt: new Date().toISOString(),
        crawlStatus: 'authenticated',
        hasSavedSession: savedFlag
      }
    });
  };

  // STEP 1 OF EMAIL OTP: Bot opens loginUrl, types email, and clicks "Send Code"
  const handleRequestEmailOtp = async () => {
    if (!botEmail.trim()) {
      setCrawlLog('⚠️ Please enter the email address where your site should send the login code.');
      return;
    }
    setOtpStep('sending_code');
    setCrawlLog(null);

    try {
      const res = await fetch('/api/crawl-authenticated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'request_email_otp',
          brandSlug: brand.slug || brand.id,
          brandName: brand.name,
          websiteUrl: brand.websiteUrl || baseSite,
          loginUrl,
          botEmail: botEmail.trim(),
          crawlViewport: videoFormat === '16:9' ? 'desktop' : 'mobile'
        })
      });

      const data = await res.json();
      if (data.success) {
        setOtpStep('awaiting_code');
        if (data.loginScreenPreview) setLoginScreenPreview(data.loginScreenPreview);
        setCrawlLog(`📨 ${data.message}`);
      } else {
        setOtpStep('idle');
        setCrawlLog(`⚠️ ${data.message || 'Could not trigger email code.'}`);
      }
    } catch (err: any) {
      setOtpStep('idle');
      setCrawlLog(`⚠️ Error requesting code: ${err?.message || 'Unknown error'}`);
    }
  };

  // STEP 2 OF EMAIL OTP (OR FULL CRAWL): Verify code, save persistent session & crawl routes
  const handleLaunchBotCrawler = async (e?: React.FormEvent, isVerifyingLiveOtp?: boolean) => {
    if (e) e.preventDefault();
    setIsCrawling(true);
    setCrawlLog(null);

    const parsedRoutes = routesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      const activeKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            ''
          : '';

      const res = await fetch('/api/crawl-authenticated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: isVerifyingLiveOtp ? 'verify_email_otp' : 'crawl_inside_app',
          brandSlug: brand.slug || brand.id,
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandCategory: brand.category,
          websiteUrl: brand.websiteUrl || baseSite,
          authMethod,
          loginUrl,
          botEmail,
          botPassword,
          staticOtpPin,
          otpCode: liveOtpCode,
          sessionCookie,
          internalRoutes: parsedRoutes,
          crawlViewport: videoFormat === '16:9' ? 'desktop' : 'mobile',
          apiKey: activeKey
        })
      });

      const data = await res.json();
      if (data.success) {
        const captured: BrandAsset[] = data.capturedAssets || [];
        const topics: string[] = data.discoveredTutorialTopics || [];
        if (Array.isArray(data.discoveredNavTargets) && data.discoveredNavTargets.length > 0) {
          setDiscoveredNavTargets(data.discoveredNavTargets);
          // If the input box still had the generic /dashboard, /learning-lab defaults and the bot discovered SPA tabs, update the input box automatically!
          if (routesInput.includes('/dashboard') && routesInput.includes('/learning-lab') && !data.discoveredNavTargets.includes('/dashboard')) {
            setRoutesInput(data.discoveredNavTargets.slice(0, 5).join(', '));
          }
        }
        setDiscoveredTopics(topics);
        if (topics.length > 0) setTutorialGoal(topics[0]);
        setOtpStep('idle');
        setLoginScreenPreview(null);
        saveBotConfigToBrand(captured, topics, !!data.hasSavedSession);
        setCrawlLog(
          `✅ ${data.loginLogMessage} Captured ${captured.length} internal screens (clicking in-page tabs & routes automatically) and analyzed UI workflows with Gemini 3.8 Vision!`
        );
      } else {
        setCrawlLog(`⚠️ ${data.message || 'Could not complete crawl.'}`);
      }
    } catch (err: any) {
      setCrawlLog(`⚠️ Crawl error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsCrawling(false);
    }
  };

  // Auto-discover in-page tabs & internal routes on the live app
  const handleDiscoverNavigation = async () => {
    setIsDiscoveringNav(true);
    setCrawlLog(null);
    try {
      const res = await fetch('/api/crawl-authenticated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'discover_navigation',
          brandSlug: brand.slug || brand.id,
          brandName: brand.name,
          websiteUrl: brand.websiteUrl || baseSite,
          loginUrl,
          authMethod,
          botEmail,
          botPassword,
          sessionCookie,
          crawlViewport: videoFormat === '16:9' ? 'desktop' : 'mobile'
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.discoveredTargets)) {
        setDiscoveredNavTargets(data.discoveredTargets);
        if (data.discoveredTargets.length > 0) {
          setRoutesInput(data.discoveredTargets.slice(0, 5).join(', '));
        }
        setCrawlLog(`🧭 ${data.message}`);
      } else {
        setCrawlLog(`⚠️ Could not auto-discover tabs: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setCrawlLog(`⚠️ Discovery error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDiscoveringNav(false);
    }
  };

  const toggleDiscoveredTarget = (target: string) => {
    const current = routesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((c) => c.toLowerCase() === target.toLowerCase());
    const next = exists
      ? current.filter((c) => c.toLowerCase() !== target.toLowerCase())
      : [...current, target];
    setRoutesInput(next.join(', '));
  };

  // Clear saved persistent browser session
  const handleClearSavedSession = async () => {
    try {
      await fetch('/api/crawl-authenticated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'clear_saved_session',
          brandSlug: brand.slug || brand.id,
          brandName: brand.name
        })
      });
      saveBotConfigToBrand(undefined, undefined, false);
      setOtpStep('idle');
      setCrawlLog(`🔄 Cleared saved login session for ${brand.name}. You can request a fresh code anytime.`);
    } catch {}
  };

  // Manual Upload of Logged-In Screenshot (for local / 2FA screens)
  const handleManualScreenUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const cleanLabel = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const newAsset: BrandAsset = {
          id: `manual-auth-${Date.now()}`,
          name: `🔐 ${cleanLabel}`,
          type: 'screenshot',
          viewport: 'mobile',
          url: reader.result,
          label: cleanLabel,
          isAuthenticated: true,
          routePath: '/authenticated-view',
          uiSummary: `Logged-in screen: ${cleanLabel}`,
          tutorialStepSuggestion: `Inside ${brand.name}, use the ${cleanLabel} view to configure and verify your results.`
        };
        saveBotConfigToBrand([newAsset]);
        setCrawlLog(`✅ Added logged-in screenshot "${cleanLabel}" to ${brand.name}'s Authenticated Vault!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAsset = (assetId: string) => {
    const filtered = (brand.brandAssets || []).filter((a) => a.id !== assetId);
    onUpdateBrand({
      ...brand,
      brandAssets: filtered
    });
  };

  const getWaypointsForScreen = (screen: BrandAsset) => {
    const hl = screen.uiHighlight;
    if (hl?.scrollWaypoints && hl.scrollWaypoints.length >= 2) {
      return hl.scrollWaypoints;
    }
    const label = screen.label || 'Tab';
    return [
      {
        scrollYPercent: 0,
        x: hl?.x ?? 24,
        yInViewport: hl?.y ?? 90,
        width: hl?.width ?? 22,
        height: hl?.height ?? 7,
        calloutText: hl?.calloutText || `Click "${label}"`,
        sectionLabel: hl?.importantArea?.label || `${label} Top Overview`,
        zoomScale: hl?.zoomScale || 1.42
      },
      {
        scrollYPercent: 42,
        x: hl?.importantArea?.x ?? 6,
        yInViewport: hl?.importantArea?.y ?? 24,
        width: hl?.importantArea?.width ?? 88,
        height: hl?.importantArea?.height ?? 42,
        calloutText: `Scroll Down: ${hl?.importantArea?.label || `${label} Live Controls`}`,
        sectionLabel: hl?.importantArea?.label || `${label} Interactive Panel`,
        zoomScale: 1.32
      },
      {
        scrollYPercent: 82,
        x: 6,
        yInViewport: 26,
        width: 88,
        height: 44,
        calloutText: `Explore Full ${label} Action Cards`,
        sectionLabel: `${label} Deep Action View`,
        zoomScale: 1.32
      }
    ];
  };

  // Play an interactive multi-stop vertical scroll + camera zoom + arrow + spoken coaching clip preview on a single card
  const handlePlayStepClip = async (screen: BrandAsset) => {
    clipTimersRef.current.forEach((t) => clearTimeout(t));
    clipTimersRef.current = [];

    if (clipAudioRef.current) {
      clipAudioRef.current.pause();
      clipAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (playingClipId === screen.id) {
      setPlayingClipId(null);
      return;
    }

    const waypoints = getWaypointsForScreen(screen);
    setPlayingClipId(screen.id);
    setCustomScrollByScreen((prev) => ({ ...prev, [screen.id]: undefined }));
    setActiveWaypointByScreen((prev) => ({ ...prev, [screen.id]: 0 }));

    // Step through each vertical scroll & zoom waypoint down the full page!
    const msPerStop = 2200;
    waypoints.forEach((_, wIdx) => {
      if (wIdx === 0) return;
      const tId = setTimeout(() => {
        setActiveWaypointByScreen((prev) => ({ ...prev, [screen.id]: wIdx }));
      }, wIdx * msPerStop);
      clipTimersRef.current.push(tId);
    });

    const text =
      screen.tutorialStepSuggestion ||
      `Click ${screen.label || 'here'} inside ${brand.name} and scroll down to explore every section.`;

    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: 'google',
          voice: 'google-cloud-standard'
        })
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        clipAudioRef.current = audio;
        audio.onended = () => setPlayingClipId((prev) => (prev === screen.id ? null : prev));
        audio.play().catch(() => {});
      }
    } catch {}

    const endTimer = setTimeout(() => {
      setPlayingClipId((prev) => (prev === screen.id ? null : prev));
    }, waypoints.length * msPerStop + 1200);
    clipTimersRef.current.push(endTimer);
  };

  // Record & download a standalone 6-second annotated video clip (.webm) that scrolls down the full page and zooms into each important section
  const handleDownloadStepClip = async (
    screen: BrandAsset,
    stepIndex: number,
    formatOverride?: '16:9' | '9:16'
  ) => {
    setRecordingClipId(screen.id);
    try {
      const targetFormat = formatOverride || videoFormat;
      const width = targetFormat === '16:9' ? 1280 : 720;
      const height = targetFormat === '16:9' ? 720 : 1280;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = await new Promise<HTMLImageElement | null>((resolve) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = () => resolve(null);
        el.src = screen.url;
      });

      const waypoints = getWaypointsForScreen(screen);

      const stream = (canvas as any).captureStream(30);
      let mimeType = 'video/webm;codecs=vp9';
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
      });

      recorder.start(100);
      const totalFrames = 150; // ~5 seconds smooth 30fps multi-stop scroll & zoom clip
      const words = (screen.tutorialStepSuggestion || `Click ${screen.label} and scroll down to explore`).split(/\s+/);

      for (let f = 0; f < totalFrames; f++) {
        const t = f / Math.max(1, totalFrames - 1);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Interpolate smoothly across waypoints (Stop 0 -> Stop 1 -> Stop 2)
        const numSegments = Math.max(1, waypoints.length - 1);
        const segFloat = t * numSegments;
        const segIdx = Math.min(numSegments - 1, Math.floor(segFloat));
        const rawLocalT = segFloat - segIdx;
        // Smooth hold-then-scroll easing so camera pauses to read each section, then scrolls smoothly to next
        const easeT =
          rawLocalT < 0.35
            ? 0
            : rawLocalT > 0.85
            ? 1
            : 0.5 - 0.5 * Math.cos(((rawLocalT - 0.35) / 0.5) * Math.PI);

        const wpA = waypoints[segIdx];
        const wpB = waypoints[Math.min(waypoints.length - 1, segIdx + 1)];

        const curScrollYPercent = wpA.scrollYPercent + (wpB.scrollYPercent - wpA.scrollYPercent) * easeT;
        const curX = wpA.x + (wpB.x - wpA.x) * easeT;
        const curY = wpA.yInViewport + (wpB.yInViewport - wpA.yInViewport) * easeT;
        const curW = wpA.width + (wpB.width - wpA.width) * easeT;
        const curH = wpA.height + (wpB.height - wpA.height) * easeT;
        const activeWp = easeT < 0.5 ? wpA : wpB;

        // Camera pulses zoom in when holding on a waypoint, and zooms out slightly while scrolling between waypoints
        const isScrollingTransition = rawLocalT >= 0.35 && rawLocalT <= 0.85;
        const targetZoom = isScrollingTransition ? 1.12 : activeWp.zoomScale || 1.32;

        const targetX = ((curX + curW / 2) / 100) * width;
        const targetY = ((curY + curH / 2) / 100) * height;

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.scale(targetZoom, targetZoom);
        ctx.translate(-targetX, -targetY);

        if (img) {
          const drawnHeight = Math.max(height, (img.naturalHeight / Math.max(1, img.naturalWidth)) * width);
          const maxScrollPx = Math.max(0, drawnHeight - height);
          const scrollOffsetY = (curScrollYPercent / 100) * maxScrollPx;
          ctx.drawImage(img, 0, -scrollOffsetY, width, drawnHeight);
        }

        // 1. Sleek Outline Highlight Box + Compact Bouncing Pointer Arrow (never blocks the screen)
        if (showScreenCallouts) {
          const bx = (curX / 100) * width;
          const by = (curY / 100) * height;
          const bw = (curW / 100) * width;
          const bh = (curH / 100) * height;

          ctx.strokeStyle = easeT < 0.5 && segIdx === 0 ? '#fbbf24' : '#10b981';
          ctx.lineWidth = 4;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 14);
          ctx.fill();
          ctx.stroke();

          // Sleek compact Bouncing Pointer Arrow + Callout Pill
          const bounce = Math.sin(f * 0.45) * 6;
          const calloutY = by > height * 0.62 ? by - 44 + bounce : by + bh + 12 + bounce;
          const calloutX = Math.max(20, Math.min(width - 280, bx));

          ctx.fillStyle = 'rgba(251, 191, 36, 0.92)';
          ctx.beginPath();
          ctx.roundRect(calloutX, calloutY, 265, 32, 16);
          ctx.fill();
          ctx.fillStyle = '#090d16';
          ctx.font = '800 13px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`👆 ${activeWp.calloutText}`.slice(0, 32), calloutX + 12, calloutY + 21);
        }

        ctx.restore();

        // Right-side vertical scroll depth indicator bar
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(width - 14, 140, 5, 220, 3);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(width - 15, 140 + (curScrollYPercent / 100) * 188, 7, 32, 4);
        ctx.fill();

        // Optional small 1-line bottom caption pill ONLY if clipCaptionMode === 'compact'
        if (clipCaptionMode === 'compact') {
          const activeW = Math.min(words.length - 1, Math.floor(t * words.length));
          const winStart = Math.max(0, activeW - 2);
          const winWords = words.slice(winStart, winStart + 6).join(' ');

          ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
          ctx.beginPath();
          ctx.roundRect(40, height - 62, width - 80, 42, 21);
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.font = '700 17px system-ui, sans-serif';
          ctx.fillStyle = '#fde68a';
          ctx.fillText(winWords.slice(0, 48), width / 2, height - 35);
        }

        await new Promise((r) => setTimeout(r, 18));
      }

      recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ratioTag = targetFormat === '16:9' ? '16x9-youtube' : '9x16-reel';
      a.download = `${brand.slug}-step-${stepIndex + 1}-${ratioTag}-${(screen.label || 'clip').toLowerCase().replace(/[^a-z0-9]/g, '-')}.webm`;
      a.click();
    } catch (err) {
      console.warn('Step clip export error:', err);
    } finally {
      setRecordingClipId(null);
    }
  };

  // Generate Step-by-Step Video Tutorial + How-To Carousel from Captured Screens
  const handleBuildTutorial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsBuildingTutorial(true);
    setQueuedNotice(null);

    try {
      const activeKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('brandcommand_google_cloud_tts_key') ||
            localStorage.getItem('brandcommand_gemini_key') ||
            ''
          : '';

      const res = await fetch('/api/crawl-authenticated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate_tutorial',
          brandName: brand.name,
          brandTagline: brand.tagline,
          brandCategory: brand.category,
          websiteUrl: brand.websiteUrl || baseSite,
          authenticatedAssets: authenticatedScreens,
          tutorialGoal,
          apiKey: activeKey
        })
      });

      const data = await res.json();
      if (data.success && data.tutorial) {
        setGeneratedTutorial(data.tutorial);
      }
    } catch (err: any) {
      setCrawlLog(err?.message || 'Failed to build tutorial.');
    } finally {
      setIsBuildingTutorial(false);
    }
  };

  const handleQueueTutorialAsset = (type: 'video' | 'carousel') => {
    if (!generatedTutorial) return;
    const cleanTags = (brand.commonHashtags || []).map((t) => t.replace(/^#/, ''));

    if (type === 'video') {
      onSavePost({
        brandId: brand.id,
        title: `[How-To Tutorial Video] ${generatedTutorial.tutorialTitle}`,
        content: generatedTutorial.caption,
        format: 'video_script',
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
        channels: ['instagram', 'tiktok', 'youtube'],
        videoScript: generatedTutorial.videoScript,
        tags: [...cleanTags, 'Tutorial', 'InsideLook']
      });
      setQueuedNotice('✅ Scheduled Step-by-Step Video Tutorial to Publishing Queue!');
    } else {
      onSavePost({
        brandId: brand.id,
        title: `[Step-by-Step Carousel] ${generatedTutorial.tutorialTitle}`,
        content: generatedTutorial.caption,
        format: 'carousel',
        status: 'scheduled',
        scheduledFor: new Date(Date.now() + 3600 * 1000 * 6).toISOString(),
        channels: ['instagram', 'linkedin'],
        carouselSlides: generatedTutorial.carouselSlides,
        tags: [...cleanTags, 'HowTo', 'ProductTour']
      });
      setQueuedNotice('✅ Scheduled Step-by-Step Carousel Guide to Publishing Queue!');
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: AI BOT DEMO ACCOUNT & HEADLESS CRAWLER VAULT */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                  🔐 AI Bot Login &amp; &ldquo;Inside-App&rdquo; Tutorial Studio
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Supports Email Code (OTP) • Password • Cookies
                </span>
                {hasSavedSession && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    🟢 Persistent Session Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Let the AI Bot sign into{' '}
                <strong className="text-neutral-800 dark:text-neutral-200">{brand.name}</strong> using your existing{' '}
                <strong>&ldquo;Send code to email&rdquo;</strong> login, save the authenticated session once, and automatically capture internal screens for tutorials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasSavedSession && (
              <button
                type="button"
                onClick={handleClearSavedSession}
                className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 transition-all"
                title="Clear saved session cookies/storage"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Session</span>
              </button>
            )}
            <input
              ref={manualScreenInputRef}
              type="file"
              accept="image/*"
              onChange={handleManualScreenUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => manualScreenInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>+ Upload Logged-In Screen</span>
            </button>
          </div>
        </div>

        {/* Auth Method Selector Tabs + Bot Configuration */}
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/90 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setAuthMethod('email_otp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  authMethod === 'email_otp'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>📨 Email Code (OTP Login)</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  authMethod === 'password'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>🔑 Email + Password</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('cookie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  authMethod === 'cookie'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Cookie className="w-3.5 h-3.5" />
                <span>🍪 Session Cookie</span>
              </button>
            </div>

            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Once logged in, session is saved automatically
            </span>
          </div>

          {/*Common Row: Login URL & Internal Routes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400">
                App Login URL
              </label>
              <div className="relative mt-1">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={loginUrl}
                  onChange={(e) => setLoginUrl(e.target.value)}
                  placeholder="https://evidraw.com/login"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] font-bold uppercase text-neutral-400">
                  In-Page Tabs or Routes to Click &amp; Capture (comma-separated)
                </label>
                <button
                  type="button"
                  onClick={handleDiscoverNavigation}
                  disabled={isDiscoveringNav}
                  className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {isDiscoveringNav ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Scanning App Nav...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>🧭 Smart Auto-Discover App Tabs</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={routesInput}
                onChange={(e) => setRoutesInput(e.target.value)}
                placeholder="Home, Market, Portfolio, Scouting, Fantasy (or /dashboard, /portfolio)"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              />
              {discoveredNavTargets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-neutral-400">
                    Click to toggle tabs/screens:
                  </span>
                  {discoveredNavTargets.map((target) => {
                    const isSelected = routesInput
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .includes(target.toLowerCase());
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => toggleDiscoveredTarget(target)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500'
                        }`}
                      >
                        {isSelected ? `✓ ${target}` : `+ ${target}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* MODE A: EMAIL CODE (OTP) LOGIN */}
          {authMethod === 'email_otp' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-500/30 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    1. Bot / Account Email Address
                  </label>
                  <input
                    type="email"
                    value={botEmail}
                    onChange={(e) => setBotEmail(e.target.value)}
                    placeholder={`your-email@${brand.slug || 'evidraw'}.com`}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleRequestEmailOtp}
                    disabled={otpStep === 'sending_code' || !botEmail.trim()}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    {otpStep === 'sending_code' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>📨 1. Send Login Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Optional: Static Bot PIN (For 1-Click Auto-OTP)
                  </label>
                  <input
                    type="text"
                    value={staticOtpPin}
                    onChange={(e) => setStaticOtpPin(e.target.value)}
                    placeholder="Optional fixed bot code (e.g. 999999)"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>

              {/* Step 2 Box when waiting for the user's emailed code */}
              {(otpStep === 'awaiting_code' || liveOtpCode) && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-in fade-in duration-200">
                  {loginScreenPreview && (
                    <div className="md:col-span-3">
                      <img
                        src={loginScreenPreview}
                        alt="Live Login Screen"
                        className="w-full max-h-32 object-cover object-top rounded-xl border border-emerald-500/30"
                      />
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block text-center mt-1">
                        Live Bot Browser View
                      </span>
                    </div>
                  )}
                  <div className={loginScreenPreview ? 'md:col-span-9 space-y-2' : 'md:col-span-12 space-y-2'}>
                    <label className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 block">
                      🔓 2. Enter the Code Sent to {botEmail}:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={liveOtpCode}
                        onChange={(e) => setLiveOtpCode(e.target.value)}
                        placeholder="Enter 6-digit code from email..."
                        className="flex-1 px-3.5 py-2 text-sm font-mono font-bold tracking-widest rounded-xl border border-emerald-500 bg-white dark:bg-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleLaunchBotCrawler(undefined, true)}
                        disabled={isCrawling || !liveOtpCode.trim()}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        {isCrawling ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying &amp; Crawling...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify Code, Save Session &amp; Crawl Inside Screens</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      ✨ Once verified, the bot saves your authenticated browser state (`cookies` + `localStorage`) so future crawls don&rsquo;t need another code!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE B: EMAIL + PASSWORD LOGIN */}
          {authMethod === 'password' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">
                  AI Bot Email / Username
                </label>
                <input
                  type="text"
                  value={botEmail}
                  onChange={(e) => setBotEmail(e.target.value)}
                  placeholder={`demo-bot@${brand.slug || 'evidraw'}.com`}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">
                  AI Bot Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={botPassword}
                    onChange={(e) => setBotPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE C: SESSION COOKIE BYPASS */}
          {authMethod === 'cookie' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">
                Paste Session Cookie or Auth Token (`F12 → Application → Cookies`)
              </label>
              <input
                type="text"
                value={sessionCookie}
                onChange={(e) => setSessionCookie(e.target.value)}
                placeholder="e.g. next-auth.session-token=... or sb-access-token=..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
              />
            </div>
          )}

          {/* Bottom Crawl Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px]">
                <span className="font-bold text-neutral-500 pl-1.5 pr-1">Video Size:</span>
                <button
                  type="button"
                  onClick={() => setVideoFormat('16:9')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                    videoFormat === '16:9'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Capture & render in 16:9 Full-Size Widescreen HD for YouTube"
                >
                  🖥️ 16:9 YouTube (Full-Size HD)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFormat('9:16')}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                    videoFormat === '9:16'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Capture & render in 9:16 Vertical for TikTok, Reels & YouTube Shorts"
                >
                  📱 9:16 Vertical (Reels / Shorts)
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                {hasSavedSession
                  ? `🟢 Persistent login session active.`
                  : `💡 Authenticate once with your email code or crawl now.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleLaunchBotCrawler(undefined, false)}
              disabled={isCrawling}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all"
            >
              {isCrawling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Bot Capturing {videoFormat} Screens...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>
                    {hasSavedSession
                      ? `🤖 Crawl ${videoFormat === '16:9' ? '16:9 YouTube' : '9:16'} Screens (Saved Session)`
                      : `🤖 Launch AI Bot & Capture ${videoFormat === '16:9' ? '16:9 YouTube' : '9:16'} Screens`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {crawlLog && (
          <div className="p-3.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
            <span>{crawlLog}</span>
            <button onClick={() => setCrawlLog(null)} className="text-[11px] opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* CAPTURED AUTHENTICATED SCREENS GALLERY */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              📸 Captured Full-Page Screens, Multi-Stop Scroll &amp; Zoom Clips ({authenticatedScreens.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[10px]">
                <span className="font-bold text-neutral-500">Size:</span>
                <button
                  type="button"
                  onClick={() => setVideoFormat('16:9')}
                  className={`px-2 py-0.5 rounded-lg font-extrabold transition-all ${
                    videoFormat === '16:9'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Preview & export full-size 16:9 YouTube Widescreen HD clips (1280x720)"
                >
                  🖥️ 16:9 YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFormat('9:16')}
                  className={`px-2 py-0.5 rounded-lg font-extrabold transition-all ${
                    videoFormat === '9:16'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Preview & export 9:16 Vertical Reels / TikTok / Shorts clips (720x1280)"
                >
                  📱 9:16 Vertical
                </button>
              </div>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[10px]">
                <span className="font-bold text-neutral-500">Clip Text:</span>
                <button
                  type="button"
                  onClick={() => setClipCaptionMode('off')}
                  className={`px-2 py-0.5 rounded-lg font-extrabold transition-all ${
                    clipCaptionMode === 'off'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Export clips with zero subtitle text so 100% of the scrolling screen is visible"
                >
                  🚫 No Text (Clean)
                </button>
                <button
                  type="button"
                  onClick={() => setClipCaptionMode('compact')}
                  className={`px-2 py-0.5 rounded-lg font-extrabold transition-all ${
                    clipCaptionMode === 'compact'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Show a small 1-line subtitle pill at the bottom edge of exported clips"
                >
                  💬 Small Bottom
                </button>
                <button
                  type="button"
                  onClick={() => setShowScreenCallouts((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-lg font-bold border transition-all ${
                    showScreenCallouts
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-400'
                  }`}
                  title="Toggle pointer arrow & highlight boxes on/off"
                >
                  {showScreenCallouts ? '👆 Arrows On' : '👆 Arrows Off'}
                </button>
              </div>
            </div>
          </div>

          {authenticatedScreens.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
              No internal screens captured yet. Use &ldquo;1. Send Login Code&rdquo; or &ldquo;Launch AI Bot&rdquo; above!
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-3.5 ${
                videoFormat === '16:9'
                  ? 'md:grid-cols-2'
                  : 'sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {authenticatedScreens.map((screen, idx) => {
                const hl = screen.uiHighlight || {
                  x: 24,
                  y: 90,
                  width: 22,
                  height: 7,
                  calloutText: `Click "${screen.label || 'Tab'}"`,
                  importantArea: {
                    x: 6,
                    y: 22,
                    width: 88,
                    height: 44,
                    label: `${screen.label || 'Feature'} Area`
                  },
                  zoomScale: 1.45
                };
                const waypoints = getWaypointsForScreen(screen);
                const activeWpIdx = Math.min(waypoints.length - 1, activeWaypointByScreen[screen.id] || 0);
                const activeWp = waypoints[activeWpIdx] || waypoints[0];
                const currentScrollYPercent =
                  customScrollByScreen[screen.id] !== undefined
                    ? customScrollByScreen[screen.id]!
                    : activeWp.scrollYPercent;

                const isClipPlaying = playingClipId === screen.id;
                const isClipRecording = recordingClipId === screen.id;
                const focusX = Math.min(85, Math.max(15, activeWp.x + (activeWp.width || 20) / 2));
                const focusY = Math.min(92, Math.max(12, activeWp.yInViewport + (activeWp.height || 7) / 2));

                return (
                  <div
                    key={screen.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-hidden flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = Math.max(4, Math.min(84, Math.round(((e.clientX - rect.left) / rect.width) * 100) - 10));
                          const clickY = Math.max(6, Math.min(92, Math.round(((e.clientY - rect.top) / rect.height) * 100) - 3));
                          const updatedWaypoints = waypoints.map((wp, wIdx) =>
                            wIdx === activeWpIdx
                              ? { ...wp, x: clickX, yInViewport: clickY, scrollYPercent: currentScrollYPercent }
                              : wp
                          );
                          const updated = (brand.brandAssets || []).map((a) =>
                            a.id === screen.id
                              ? {
                                  ...a,
                                  uiHighlight: {
                                    ...hl,
                                    x: activeWpIdx === 0 ? clickX : hl.x,
                                    y: activeWpIdx === 0 ? clickY : hl.y,
                                    scrollWaypoints: updatedWaypoints
                                  }
                                }
                              : a
                          );
                          onUpdateBrand({ ...brand, brandAssets: updated });
                        }}
                        title="Click anywhere on this view to move the Arrow & Camera Zoom target for this scroll stop"
                        className={`relative w-full bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800 cursor-crosshair group ${
                          videoFormat === '16:9' ? 'aspect-video max-h-72' : 'aspect-[9/15] max-h-64'
                        }`}
                      >
                        <div
                          className="relative w-full h-full transition-transform duration-700 ease-out"
                          style={{
                            transformOrigin: `${focusX}% ${focusY}%`,
                            transform: isClipPlaying ? `scale(${activeWp.zoomScale || 1.38})` : 'scale(1)'
                          }}
                        >
                          <img
                            src={screen.url}
                            alt={screen.label || screen.name}
                            className="w-full h-full object-cover transition-[object-position] duration-700 ease-in-out"
                            style={{
                              objectPosition: `50% ${currentScrollYPercent}%`
                            }}
                          />

                          {/* Sleek Transparent Highlight Border + Compact Pointer Arrow (when showScreenCallouts is on) */}
                          {showScreenCallouts && (
                            <>
                              <div
                                className={`absolute rounded-lg border-2 pointer-events-none transition-all duration-500 ${
                                  activeWpIdx === 0
                                    ? 'border-amber-400/90 bg-transparent shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                                    : 'border-emerald-400/90 bg-transparent shadow-[0_0_14px_rgba(16,185,129,0.65)]'
                                }`}
                                style={{
                                  left: `${activeWp.x}%`,
                                  top: `${activeWp.yInViewport}%`,
                                  width: `${activeWp.width || 22}%`,
                                  height: `${activeWp.height || 10}%`
                                }}
                              />

                              <div
                                className="absolute flex flex-col items-center pointer-events-none transition-all duration-500"
                                style={{
                                  left: `${Math.min(58, Math.max(4, activeWp.x))}%`,
                                  top: `${
                                    activeWp.yInViewport > 62
                                      ? Math.max(6, activeWp.yInViewport - 13)
                                      : Math.min(84, activeWp.yInViewport + (activeWp.height || 10) + 1)
                                  }%`
                                }}
                              >
                                {activeWp.yInViewport <= 62 && (
                                  <span className="text-amber-400 text-[10px] font-black leading-none animate-bounce">⬆️</span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-400/95 text-neutral-950 font-extrabold text-[7px] uppercase tracking-wide shadow-md border border-white/80 whitespace-nowrap">
                                  👆 {activeWp.calloutText}
                                </span>
                                {activeWp.yInViewport > 62 && (
                                  <span className="text-amber-400 text-[10px] font-black leading-none animate-bounce">⬇️</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Right-side vertical scroll depth indicator */}
                        <div className="absolute right-1.5 top-10 bottom-10 w-1.5 rounded-full bg-black/50 border border-white/15 pointer-events-none overflow-hidden">
                          <div
                            className="w-full h-5 rounded-full bg-emerald-400 transition-all duration-500"
                            style={{
                              marginTop: `${Math.min(82, Math.max(0, currentScrollYPercent * 0.82))}%`
                            }}
                          />
                        </div>

                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[8px] font-mono font-bold text-emerald-400 border border-white/10 pointer-events-none">
                          #{idx + 1} • {screen.label} ({currentScrollYPercent}%)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(screen.id);
                          }}
                          title="Remove screen"
                          className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-neutral-300 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 space-y-2 text-xs">
                        {/* Multi-Stop Scroll Waypoint Selector + Full-Page Scroll Scrubber */}
                        <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-extrabold uppercase text-neutral-400">
                              ↕️ Page Scroll Stops ({waypoints.length}):
                            </span>
                            <div className="flex items-center gap-1">
                              {waypoints.map((wp, wIdx) => (
                                <button
                                  key={wIdx}
                                  type="button"
                                  onClick={() => {
                                    setCustomScrollByScreen((prev) => ({ ...prev, [screen.id]: undefined }));
                                    setActiveWaypointByScreen((prev) => ({ ...prev, [screen.id]: wIdx }));
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition-all ${
                                    activeWpIdx === wIdx && customScrollByScreen[screen.id] === undefined
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-emerald-500/20'
                                  }`}
                                  title={`${wp.calloutText} (${wp.scrollYPercent}% down page)`}
                                >
                                  Stop {wIdx + 1} ({wp.scrollYPercent}%)
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-neutral-400">Top</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={currentScrollYPercent}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCustomScrollByScreen((prev) => ({ ...prev, [screen.id]: val }));
                              }}
                              className="flex-1 h-1.5 accent-emerald-500 cursor-pointer"
                              title="Scrub vertically from the top (0%) to the bottom (100%) of the captured full page"
                            />
                            <span className="text-[9px] font-mono text-neutral-400">Bottom</span>
                          </div>
                        </div>

                        {/* Action Clip Bar: Play Multi-Stop Scroll & Zoom Clip + Download WebM Clip */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePlayStepClip(screen)}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all ${
                              isClipPlaying
                                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                                : 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>
                              {isClipPlaying
                                ? `Scrolling Stop ${activeWpIdx + 1}/${waypoints.length}...`
                                : '🎥 Play Scroll & Zoom Clip'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadStepClip(screen, idx)}
                            disabled={isClipRecording}
                            title={`Download standalone 5-second ${videoFormat} video clip (.webm) that scrolls down the full page and zooms into each important section`}
                            className="py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] flex items-center gap-1"
                          >
                            {isClipRecording ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                            ) : (
                              <Download className="w-3 h-3 text-emerald-500" />
                            )}
                            <span>{videoFormat} Clip</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={screen.label || screen.name}
                          onChange={(e) => {
                            const updated = (brand.brandAssets || []).map((a) =>
                              a.id === screen.id ? { ...a, label: e.target.value } : a
                            );
                            onUpdateBrand({ ...brand, brandAssets: updated });
                          }}
                          className="w-full font-bold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none"
                        />

                        {/* Active Stop Callout Badge Editor */}
                        <div>
                          <label className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                            👆 Stop {activeWpIdx + 1} Arrow Callout ({currentScrollYPercent}% Scroll):
                          </label>
                          <input
                            type="text"
                            value={activeWp.calloutText}
                            onChange={(e) => {
                              const newText = e.target.value;
                              const updatedWaypoints = waypoints.map((wp, wIdx) =>
                                wIdx === activeWpIdx ? { ...wp, calloutText: newText } : wp
                              );
                              const updated = (brand.brandAssets || []).map((a) =>
                                a.id === screen.id
                                  ? {
                                      ...a,
                                      uiHighlight: {
                                        ...hl,
                                        calloutText: activeWpIdx === 0 ? newText : hl.calloutText,
                                        scrollWaypoints: updatedWaypoints
                                      }
                                    }
                                  : a
                              );
                              onUpdateBrand({ ...brand, brandAssets: updated });
                            }}
                            placeholder='e.g. Click "Market" to Buy & Sell'
                            className="w-full mt-0.5 px-2 py-1 text-[10px] font-semibold rounded-md border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-800 dark:text-neutral-200"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                            🎙️ Smart Action Voiceover Script:
                          </label>
                          <textarea
                            rows={3}
                            value={screen.tutorialStepSuggestion || ''}
                            onChange={(e) => {
                              const updated = (brand.brandAssets || []).map((a) =>
                                a.id === screen.id ? { ...a, tutorialStepSuggestion: e.target.value } : a
                              );
                              onUpdateBrand({ ...brand, brandAssets: updated });
                            }}
                            placeholder='e.g. Click Market to see all the available players to buy and sell...'
                            className="w-full mt-0.5 p-1.5 text-[11px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: STEP-BY-STEP "HOW-TO" VIDEO & CAROUSEL TUTORIAL GENERATOR */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-500" />
              2. Build &ldquo;How-To&rdquo; Video Tutorial &amp; Step-by-Step Carousel
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Automatically sequences your captured logged-in screens into a narrated tutorial video &amp; swipeable guide.
            </p>
          </div>
        </div>

        <form onSubmit={handleBuildTutorial} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={tutorialGoal}
              onChange={(e) => setTutorialGoal(e.target.value)}
              placeholder={`e.g. How to build a balanced portfolio inside ${brand.name} in 3 steps...`}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            />
            <button
              type="submit"
              disabled={isBuildingTutorial}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              {isBuildingTutorial ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sequencing Inside-App Tutorial...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🎬 Generate Step-by-Step Tutorial Now</span>
                </>
              )}
            </button>
          </div>

          {discoveredTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                Discovered Inside-App Tutorials:
              </span>
              {discoveredTopics.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTutorialGoal(t)}
                  className="text-[11px] px-2.5 py-1 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  &ldquo;{t}&rdquo;
                </button>
              ))}
            </div>
          )}
        </form>

        {queuedNotice && (
          <div className="p-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{queuedNotice}</span>
          </div>
        )}

        {/* GENERATED TUTORIAL OUTPUT (VIDEO + CAROUSEL) */}
        {generatedTutorial && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('video')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    activeOutputTab === 'video'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Narrated Video Tutorial (9:16 &amp; 16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('carousel')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    activeOutputTab === 'carousel'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Step-by-Step Carousel Guide</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQueueTutorialAsset('video')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Queue Tutorial Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQueueTutorialAsset('carousel')}
                  className="px-3.5 py-2 rounded-xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Queue Step-by-Step Carousel</span>
                </button>
              </div>
            </div>

            {activeOutputTab === 'video' ? (
              <VideoScriptRenderer
                brand={brand}
                script={generatedTutorial.videoScript}
                onUpdateBrand={onUpdateBrand}
                defaultAspectRatio={videoFormat}
              />
            ) : (
              <CarouselRenderer
                brand={brand}
                slides={generatedTutorial.carouselSlides}
                onUpdateSlides={(updatedSlides) =>
                  setGeneratedTutorial({
                    ...generatedTutorial,
                    carouselSlides: updatedSlides
                  })
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
