export type StandardBrandCategory = 
  | 'salon' 
  | 'extensions' 
  | 'fintech' 
  | 'webapp' 
  | 'gaming' 
  | 'community';

export type BrandCategory = StandardBrandCategory | string;

export interface CategoryDefinition {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  defaultHashtags?: string[];
  suggestedColors?: { primary: string; secondary: string };
  isCustom?: boolean;
}

export type SocialChannel = 
  | 'instagram' 
  | 'tiktok' 
  | 'youtube' 
  | 'twitter' 
  | 'linkedin' 
  | 'pinterest' 
  | 'facebook';

export interface SocialAccountConnection {
  channel: SocialChannel;
  accountHandle: string; // e.g. '@varbona_game'
  accountName: string; // e.g. 'Varbona Official'
  isConnected: boolean;
  connectedAt?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  platformId?: string;
  isSandbox?: boolean;
}

export interface PublishLogEntry {
  channel: SocialChannel;
  status: 'success' | 'failed';
  timestamp: string;
  message: string;
  permalink?: string;
}

export interface BotAuthConfig {
  authMethod?: 'email_otp' | 'password' | 'cookie';
  loginUrl?: string;
  botEmail?: string;
  botPassword?: string;
  staticOtpPin?: string;
  sessionCookie?: string;
  internalRoutes?: string[];
  lastCrawledAt?: string;
  crawlStatus?: 'idle' | 'authenticated' | 'partial';
  hasSavedSession?: boolean;
}

export interface ScrollZoomWaypoint {
  /** 0..100% vertical scroll offset along the full-page screenshot (0 = top, 100 = bottom) */
  scrollYPercent: number;
  /** 0..100% X left of the target highlight box within the 9:16 viewport */
  x: number;
  /** 0..100% Y top of the target highlight box within the current scrolled 9:16 viewport */
  yInViewport: number;
  /** 0..100% width of the highlight box */
  width: number;
  /** 0..100% height of the highlight box */
  height: number;
  /** Callout pill text shown with the animated arrow at this scroll stop */
  calloutText: string;
  /** Section title for the neon highlight box */
  sectionLabel?: string;
  /** Camera zoom factor at this waypoint (e.g. 1.35) */
  zoomScale?: number;
}

export interface UIHighlightRegion {
  /** Normalized 0..100 X center or top-left percentage of viewport */
  x: number;
  /** Normalized 0..100 Y center or top-left percentage of viewport */
  y: number;
  /** Normalized 0..100 width percentage of viewport */
  width: number;
  /** Normalized 0..100 height percentage of viewport */
  height: number;
  /** Callout label shown next to the arrow (e.g. 'Click "Market"') */
  calloutText: string;
  /** Secondary highlight box for the important content area on the page */
  importantArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  };
  /** Target zoom level when focusing on the button/area (default ~1.55) */
  zoomScale?: number;
  /** Multi-stop vertical scroll & zoom waypoints across the full scrollable page */
  scrollWaypoints?: ScrollZoomWaypoint[];
  /** Total document scroll height in pixels captured in fullPage screenshot */
  pageHeightPx?: number;
}

export interface BrandAsset {
  id: string;
  name: string;
  type: 'screenshot' | 'image' | 'logo' | 'hero';
  viewport?: 'mobile' | 'desktop';
  url: string;
  label?: string;
  width?: number;
  height?: number;
  isAuthenticated?: boolean;
  routePath?: string;
  uiSummary?: string;
  tutorialStepSuggestion?: string;
  uiHighlight?: UIHighlightRegion;
  clipVideoUrl?: string;
}

export interface AutoPilotConfig {
  enabled: boolean;
  mode: 'review_first' | 'fully_automated';
  postsPerDay: 1 | 2 | 3;
  preferredTimes: string[]; // e.g. ['09:00', '14:00', '18:30']
  autoReplenishLibrary: boolean;
  minLibraryBuffer: number; // e.g. 5 ready items per brand
  includeFormats: PostFormat[];
  targetChannels: SocialChannel[];
  lastGeneratedAt?: string;
  lastAutoScheduledAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: BrandCategory;
  websiteUrl?: string;
  websiteScreenshotUrl?: string; // Default active screenshot (9:16 mobile view for TikTok / Reels)
  websiteMobileScreenshotUrl?: string; // 9:16 Smartphone viewport (390x844 Retina)
  websiteDesktopScreenshotUrl?: string; // 16:9 Desktop browser viewport (for full-size YouTube)
  brandAssets?: BrandAsset[];
  botAuth?: BotAuthConfig;
  autoPilot?: AutoPilotConfig;
  logoUrl?: string;
  typography?: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoEmoji: string;
  voicePersona: string;
  targetAudience: string;
  defaultChannels: SocialChannel[];
  commonHashtags: string[];
  suggestedTopics: string[];
  detectedSocials?: Partial<Record<SocialChannel, string>>;
  socialConnections?: Partial<Record<SocialChannel, SocialAccountConnection>>;
}

export type PostFormat = 'single' | 'carousel' | 'video_script' | 'thread' | 'newsletter';
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface CarouselSlide {
  title: string;
  subtitle?: string;
  body: string;
  highlightText?: string;
}

export interface AIDirectorPlan {
  layout: 'dynamic_cuts' | 'ugc_creator' | 'meme_reel' | 'showcase' | 'split';
  backgroundId: string;
  stickerId: string;
  customStickerText?: string;
  filter: 'none' | 'cinematic' | 'golden_hour' | 'cyberpunk' | 'vhs_90s' | 'noir';
  actorId?: string;
  subtitleStyle: 'hormozi' | 'cyber' | 'luxury';
  soundwaveStyle: 'off' | 'neon_bars' | 'rainbow_eq' | 'minimal_dots';
  directorNotes: string;
}

export interface VideoQACheck {
  id: string;
  category: 'hook_strength' | 'pacing_duration' | 'audio_visual_sync' | 'subtitle_safe_zones' | 'media_resolution';
  label: string;
  score: number;
  passed: boolean;
  findings: string;
  autoHealed?: boolean;
}

export interface VideoQAInspection {
  overallScore: number;
  status: 'passed' | 'warning' | 'needs_revision';
  checks: VideoQACheck[];
  inspectedAt: string;
  summary: string;
}

export interface ResearchSourceItem {
  title: string;
  source: string;
  url?: string;
  snippet: string;
  keyFact: string;
  mediaTags: string[];
}

export interface VideoScriptScene {
  timestamp: string;
  visual: string;
  audio: string;
  brollPresetId?: string;
  brollMediaUrl?: string;
  brollMediaType?: 'video' | 'image' | 'animated_chart';
  brollLabel?: string;
  uiHighlight?: UIHighlightRegion;
}

export interface VideoScript {
  hook: string;
  visualCue: string;
  hookBrollMediaUrl?: string;
  hookBrollMediaType?: 'video' | 'image' | 'animated_chart';
  hookBrollLabel?: string;
  hookUiHighlight?: UIHighlightRegion;
  scenes: VideoScriptScene[];
  cta: string;
  ctaBrollMediaUrl?: string;
  ctaBrollMediaType?: 'video' | 'image' | 'animated_chart';
  ctaBrollLabel?: string;
  ctaUiHighlight?: UIHighlightRegion;
  ugcStoryText?: string;
  ugcCreatorId?: string;
  aiDirector?: AIDirectorPlan;
  researchSources?: ResearchSourceItem[];
  qaInspection?: VideoQAInspection;
  revisionHistory?: Array<{ timestamp: string; prompt: string; changesMade: string }>;
}

export interface EmailCampaign {
  subjectLines: { type: 'curiosity' | 'direct' | 'benefit'; text: string }[];
  previewText: string;
  headline: string;
  greeting: string;
  intro: string;
  keyPoints: { title: string; description: string }[];
  ctaButton: { text: string; url: string };
  signOff: string;
  psNote?: string;
}

export interface AdConversionScore {
  overall: number;
  thumbStop: number;
  contrast: number;
  ctaClarity: number;
  brandAlignment: number;
  reasoning: string;
}

export interface AdVariantOption {
  id: string;
  angleName: string;
  angleBadge: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  caption: string;
  visualPrompt: string;
  firstCommentPlug: string;
  dmTriggerKeyword: string;
  dmAutoReplyScript: string;
  conversionScore: AdConversionScore;
  bgImageUrl?: string;
}

export interface CompetitorAdAnalysis {
  competitorHookFormula: string;
  visualHierarchyBreakdown: string;
  psychologicalTrigger: string;
  competitorWeaknessToExploit: string;
  remixedVariant: AdVariantOption;
}

export interface Post {
  id: string;
  brandId: string;
  title: string;
  content: string;
  format: PostFormat;
  status: PostStatus;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  isAutoGenerated?: boolean;
  contentPillar?: string;
  mediaPreviewUrl?: string;
  scheduledFor: string;
  channels: SocialChannel[];
  carouselSlides?: CarouselSlide[];
  videoScript?: VideoScript;
  threadTweets?: string[];
  emailCampaign?: EmailCampaign;
  firstCommentPlug?: string;
  dmTriggerKeyword?: string;
  dmAutoReplyScript?: string;
  adConversionScore?: AdConversionScore;
  tags: string[];
  createdAt: string;
  publishedUrls?: Partial<Record<SocialChannel, string>>;
  publishedAt?: string;
  publishLogs?: PublishLogEntry[];
}

export type ContactSource = 'shopify' | 'csv' | 'manual' | 'webhook';

export interface Contact {
  id: string;
  brandId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  source: ContactSource;
  status: 'subscribed' | 'unsubscribed';
  ordersCount?: number;
  totalSpent?: string;
  createdAt: string;
}
