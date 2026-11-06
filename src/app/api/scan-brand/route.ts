import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { BrandCategory, SocialChannel, CategoryDefinition } from '@/types/brand';
import { detectBrandCategory } from '@/lib/smartCategoryDetector';

export interface ScannedBrandProfile {
  name: string;
  tagline: string;
  category: BrandCategory;
  websiteUrl: string;
  websiteScreenshotUrl?: string;
  websiteMobileScreenshotUrl?: string;
  websiteDesktopScreenshotUrl?: string;
  brandAssets?: Array<{
    id: string;
    name: string;
    type: 'screenshot' | 'image' | 'logo' | 'hero';
    viewport?: 'mobile' | 'desktop';
    url: string;
    label?: string;
  }>;
  logoUrl?: string;
  logoEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  typography: string;
  voicePersona: string;
  targetAudience: string;
  defaultChannels: SocialChannel[];
  commonHashtags: string[];
  suggestedTopics: string[];
  detectedSocials: Partial<Record<SocialChannel, string>>;
  source: 'live_scrape' | 'heuristic_fallback';
  metaDescription?: string;
  customCategoryDef?: CategoryDefinition;
}

// Helpers for color analysis
function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  return hex.toLowerCase();
}

function isBoringColor(hex: string): boolean {
  const norm = normalizeHex(hex);
  const boring = [
    '#ffffff', '#fff', '#000000', '#000', '#111111', '#1f2937', 
    '#18181b', '#0a0a0a', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8',
    '#64748b', '#334155', '#475569', '#27272a', '#3f3f46', '#52525b',
    '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5', '#181818',
    '#1f1f1f', '#222222', '#333333', '#444444', '#555555', '#666666'
  ];
  if (boring.includes(norm)) return true;

  // Check saturation: if R, G, B are very close, it's grayscale
  if (norm.length === 7) {
    const r = parseInt(norm.slice(1, 3), 16);
    const g = parseInt(norm.slice(3, 5), 16);
    const b = parseInt(norm.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 30) return true; // Grayscale or near-neutral
    if (max < 35) return true; // Pitch dark
    if (min > 235) return true; // Blown-out white
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_URL', message: 'A valid website URL is required.' },
        { status: 400 }
      );
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: 'INVALID_URL_FORMAT', message: 'Invalid URL structure provided.' },
        { status: 400 }
      );
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const domainParts = hostname.split('.');
    const brandBaseName = domainParts[0]
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    let html = '';
    let isLiveScrapeSuccess = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 BrandCommandScanner/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        html = await response.text();
        isLiveScrapeSuccess = true;
      }
    } catch (fetchErr) {
      console.warn(`Direct scrape failed for ${normalizedUrl}, utilizing intelligent domain synthesis:`, fetchErr);
    }

    // --- ENRICH WITH LIVE MOBILE 9:16 & DESKTOP 16:9 SCREENSHOTS & ASSETS VIA MICROLINK ---
    let websiteScreenshotUrl: string | undefined = undefined;
    let websiteMobileScreenshotUrl: string | undefined = undefined;
    let websiteDesktopScreenshotUrl: string | undefined = undefined;
    let heroImageUrl: string | undefined = undefined;
    let extractedLogoUrl: string | undefined = undefined;
    const brandAssets: Array<{
      id: string;
      name: string;
      type: 'screenshot' | 'image' | 'logo' | 'hero';
      viewport?: 'mobile' | 'desktop';
      url: string;
      label?: string;
    }> = [];

    try {
      const mlController = new AbortController();
      const mlTimeout = setTimeout(() => mlController.abort(), 7000);

      // Parallel fetch: 1) 9:16 Mobile Viewport (TikTok/Reels/Shorts), 2) 16:9 Desktop Viewport (YouTube standard)
      const mobileFetch = fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&viewport.isMobile=true&viewport.width=390&viewport.height=844&viewport.deviceScaleFactor=2`,
        { signal: mlController.signal }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      const desktopFetch = fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&palette=true`,
        { signal: mlController.signal }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      const [mobileRes, desktopRes] = await Promise.all([mobileFetch, desktopFetch]);
      clearTimeout(mlTimeout);

      if (mobileRes?.status === 'success' && mobileRes.data?.screenshot?.url) {
        websiteMobileScreenshotUrl = mobileRes.data.screenshot.url;
        brandAssets.push({
          id: 'live_mobile_screenshot',
          name: '📱 Mobile App View (9:16 TikTok / Reels)',
          type: 'screenshot',
          viewport: 'mobile',
          url: mobileRes.data.screenshot.url,
          label: '📱 Mobile App View (9:16)'
        });
      }

      if (desktopRes?.status === 'success' && desktopRes.data) {
        if (desktopRes.data.screenshot?.url) {
          websiteDesktopScreenshotUrl = desktopRes.data.screenshot.url;
          brandAssets.push({
            id: 'live_desktop_screenshot',
            name: '💻 Desktop Browser View (16:9 YouTube)',
            type: 'screenshot',
            viewport: 'desktop',
            url: desktopRes.data.screenshot.url,
            label: '💻 Desktop View (16:9)'
          });
        }
        if (desktopRes.data.image?.url) {
          heroImageUrl = desktopRes.data.image.url;
          brandAssets.push({
            id: 'website_hero_graphic',
            name: 'Website Hero Graphic & Diagrams',
            type: 'hero',
            viewport: 'desktop',
            url: desktopRes.data.image.url,
            label: 'Product Architecture Visual'
          });
        }
        if (desktopRes.data.logo?.url && !extractedLogoUrl) {
          extractedLogoUrl = desktopRes.data.logo.url;
        }
      }

      // Default websiteScreenshotUrl to Mobile 9:16 for Reels/Shorts/TikTok
      websiteScreenshotUrl = websiteMobileScreenshotUrl || websiteDesktopScreenshotUrl;
    } catch (mlErr) {
      console.warn('Microlink live screenshot fetch timed out or failed:', mlErr);
    }

    // --- 1. EXTRACT TITLE & BRAND NAME ---
    let extractedName = brandBaseName;
    if (html) {
      const ogSiteName = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
      const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      if (ogSiteName && ogSiteName[1].trim()) {
        extractedName = ogSiteName[1].trim();
      } else if (ogTitle && ogTitle[1].trim()) {
        extractedName = ogTitle[1].split(/[|\-–—:]/)[0].trim();
      } else if (titleTag && titleTag[1].trim()) {
        extractedName = titleTag[1].split(/[|\-–—:]/)[0].trim();
      }
    }

    // Clean up generic words from name
    extractedName = extractedName.replace(/\b(Home|Official Site|Welcome|The|App|Software)\b$/gi, '').trim() || brandBaseName;

    // --- 2. EXTRACT TAGLINE / META DESCRIPTION ---
    let extractedTagline = '';
    if (html) {
      const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      const h1Tag = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

      if (metaDesc && metaDesc[1].trim()) {
        extractedTagline = metaDesc[1].trim();
      } else if (ogDesc && ogDesc[1].trim()) {
        extractedTagline = ogDesc[1].trim();
      } else if (h1Tag) {
        extractedTagline = h1Tag[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // --- 3. EXTRACT LOGO & FAVICON ---
    if (html && !extractedLogoUrl) {
      // 1. High-priority dedicated brand mark / app icon from <img>
      const appIcon = html.match(/<img\s+[^>]*?src=["']([^"']*(?:app-icon|brand-icon)[^"']*)["']/i);
      const brandLockup = html.match(/<img\s+[^>]*?src=["']([^"']*(?:brand-lockup|horizontal|logo)[^"']*)["']/i);
      const imgLogo = html.match(/<img\s+[^>]*?src=["']([^"']+)["'][^>]*(?:alt|class|id)=["'][^"']*(?:logo|brand|lockup)[^"']*["']/i);
      const appleTouch = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      const favIcon = html.match(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

      const candidate = (appIcon && appIcon[1]) || (brandLockup && brandLockup[1]) || (imgLogo && imgLogo[1]) || (appleTouch && appleTouch[1]) || (favIcon && favIcon[1]) || (ogImage && ogImage[1]);

      if (candidate) {
        try {
          extractedLogoUrl = new URL(candidate, normalizedUrl).href;
        } catch {
          extractedLogoUrl = candidate.startsWith('http') ? candidate : undefined;
        }
      }
    }

    // If still no logo, use standard google favicon service
    if (!extractedLogoUrl) {
      extractedLogoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    }

    // --- 4. EXTRACT COLOR PALETTE ---
    let detectedPrimary = '';
    let detectedSecondary = '#0f172a';

    if (html) {
      // Check theme-color meta tag
      const themeColor = html.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i);
      if (themeColor && isValidHex(themeColor[1]) && !isBoringColor(themeColor[1])) {
        detectedPrimary = normalizeHex(themeColor[1]);
      }

      // Check CSS custom properties: --primary, --brand, --color-primary
      if (!detectedPrimary) {
        const cssPrimaryMatch = html.match(/--(?:primary|brand|color-primary|accent):\s*(#[0-9a-fA-F]{3,6})/i);
        if (cssPrimaryMatch && isValidHex(cssPrimaryMatch[1]) && !isBoringColor(cssPrimaryMatch[1])) {
          detectedPrimary = normalizeHex(cssPrimaryMatch[1]);
        }
      }

      // Scan all hex colors in styles and count frequency of vibrant colors
      if (!detectedPrimary) {
        const hexMatches = html.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
        const colorCounts: Record<string, number> = {};

        for (const h of hexMatches) {
          const norm = normalizeHex(h);
          if (!isBoringColor(norm)) {
            colorCounts[norm] = (colorCounts[norm] || 0) + 1;
          }
        }

        const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        if (sortedColors.length > 0) {
          detectedPrimary = sortedColors[0][0];
          if (sortedColors.length > 1) {
            detectedSecondary = sortedColors[1][0];
          }
        }
      }
    }

    // --- 5. DETECT TYPOGRAPHY / FONT FAMILY ---
    let detectedTypography = 'Inter';
    if (html) {
      const googleFontMatch = html.match(/fonts\.googleapis\.com\/css2\?family=([A-Za-z+]+)/i);
      if (googleFontMatch && googleFontMatch[1]) {
        detectedTypography = decodeURIComponent(googleFontMatch[1].replace(/\+/g, ' ').split(':')[0]);
      } else {
        const commonFonts = [
          'Plus Jakarta Sans', 'Playfair Display', 'Montserrat', 'Poppins', 
          'Roboto', 'Geist', 'Outfit', 'Sora', 'Fira Code', 'Lato', 'Open Sans', 'Cinzel'
        ];
        for (const f of commonFonts) {
          if (new RegExp(`font-family:[^;]*['"]?${f}['"]?`, 'i').test(html)) {
            detectedTypography = f;
            break;
          }
        }
      }
    }

    // --- 6. CATEGORY CLASSIFICATION WITH SMART DETECTION & AUTO-CUSTOM CATEGORIES ---
    // Clean HTML to extract visible text only, stripping script, style, svg and code tags
    const cleanVisibleText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 4000);

    const corpus = `${hostname} ${extractedName} ${extractedTagline} ${cleanVisibleText}`.toLowerCase();
    const smartDetection = detectBrandCategory(
      extractedName,
      extractedTagline,
      hostname,
      cleanVisibleText
    );

    let detectedCategory = smartDetection.category;
    const detectedCategoryDef = smartDetection.categoryDef;
    const isFantasySports = detectedCategory === 'gaming' && (
      corpus.includes('football') || corpus.includes('fantasy') || corpus.includes('soccer') || corpus.includes('scout')
    );
    const isLotteryTool = 
      detectedCategory === 'lottery-gaming-tools' ||
      corpus.includes('lottery') || 
      corpus.includes('lotto') || 
      corpus.includes('powerball') || 
      corpus.includes('evidraw');

    // Fallback colors if none found from stylesheet
    if (!detectedPrimary) {
      if (detectedCategoryDef?.suggestedColors?.primary) {
        detectedPrimary = detectedCategoryDef.suggestedColors.primary;
        if (detectedCategoryDef.suggestedColors.secondary && !detectedSecondary) {
          detectedSecondary = detectedCategoryDef.suggestedColors.secondary;
        }
      } else if (isLotteryTool) {
        detectedPrimary = '#0b1930'; // Navy Dark
      } else if (isFantasySports) {
        detectedPrimary = '#b9f566'; // Neon Pitch Green
      } else {
        detectedPrimary = '#3b82f6'; // Tech Blue
      }
    }

    // Default logo emoji per category & keywords
    let detectedEmoji = detectedCategoryDef?.emoji || (isLotteryTool ? '🎟️' : isFantasySports ? '⚽' : '🚀');

    // SVG Lettermark generation for brands without external image logo (like Varbona)
    const initialChar = (extractedName.trim().charAt(0) || 'V').toUpperCase();
    const brandSvgMark = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="${encodeURIComponent(detectedSecondary || '#0b100d')}"/><text x="50" y="67" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="${encodeURIComponent(detectedPrimary || '#b9f566')}" text-anchor="middle">${initialChar}</text></svg>`;

    if (!extractedLogoUrl || extractedLogoUrl.includes('google.com/s2/favicons')) {
      extractedLogoUrl = brandSvgMark;
    }

    // --- 7. DETECT SOCIAL CHANNELS ---
    const detectedSocials: Partial<Record<SocialChannel, string>> = {};
    const defaultChannels: SocialChannel[] = [];

    if (html) {
      const igMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.-]+)\/?["']/i);
      if (igMatch) {
        detectedSocials.instagram = igMatch[1];
        defaultChannels.push('instagram');
      }

      const twMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+)\/?["']/i);
      if (twMatch) {
        detectedSocials.twitter = twMatch[1];
        defaultChannels.push('twitter');
      }

      const ttMatch = html.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.-]+)\/?["']/i);
      if (ttMatch) {
        detectedSocials.tiktok = ttMatch[1];
        defaultChannels.push('tiktok');
      }

      const ytMatch = html.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:@[a-zA-Z0-9_.-]+|c\/[a-zA-Z0-9_.-]+))\/?["']/i);
      if (ytMatch) {
        detectedSocials.youtube = ytMatch[1];
        defaultChannels.push('youtube');
      }

      const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_.-]+)\/?["']/i);
      if (liMatch) {
        detectedSocials.linkedin = liMatch[1];
        defaultChannels.push('linkedin');
      }
    }

    // Default channels if none scraped
    if (defaultChannels.length === 0) {
      if (detectedCategory === 'salon' || detectedCategory === 'extensions') {
        defaultChannels.push('instagram', 'tiktok', 'pinterest');
      } else if (detectedCategory === 'fintech') {
        defaultChannels.push('twitter', 'youtube', 'linkedin');
      } else {
        defaultChannels.push('twitter', 'instagram', 'linkedin');
      }
    }

    // --- 8. SYNTHESIZE AI VOICE PERSONA & TARGET AUDIENCE ---
    let voicePersona = '';
    let targetAudience = '';
    const cleanBrandTag = extractedName.replace(/\s+/g, '');

    if (isLotteryTool) {
      voicePersona = 'Analytical, evidence-first, disciplined, and objective. Breaks down probability, portfolio strategies, and real draw tracking without deceptive get-rich-quick hype. Educational and transparent.';
      targetAudience = 'Lottery players, probability enthusiasts, syndicates, and data-minded individuals looking to build disciplined number portfolios and measure outcomes honestly against random odds.';
    } else if (isFantasySports) {
      voicePersona = 'High-energy, football-obsessed, tactical, and competitive. Combines deep scouting knowledge with the excitement of fantasy player trading. Speaks directly to passionate fans building their ultimate fantasy XI squad.';
      targetAudience = 'Passionate football fans, fantasy sports managers, tactical gamers, and scouting enthusiasts who want to scout players, trade player shares, and compete with their fantasy XI.';
    } else if (detectedCategory === 'fintech') {
      voicePersona = 'Analytical, high-conviction, and data-driven with sharp quantitative insights. Zero fluff, 100% actionable risk/reward trade setups.';
      targetAudience = 'Active retail options traders, swing investors, and quantitative stock market participants seeking systematic edge.';
    } else if (detectedCategory === 'salon') {
      voicePersona = 'Warm, luxurious, educational, and aesthetic. Obsessive focus on hair health, transformation confidence, and master stylist craft.';
      targetAudience = 'Clients desiring premium salon transformations, balayage perfection, and luxury scalp and haircare rituals.';
    } else if (detectedCategory === 'extensions') {
      voicePersona = 'Elevated luxury, insider hair stylist secrets, and seamless blending mastery. Confident, chic, and trend-setting.';
      targetAudience = 'High-end clients, hair professionals, and women looking for seamless, undetectable 100% Remy hair volume and length.';
    } else if (detectedCategory === 'community') {
      voicePersona = 'Auténtico, cálido, rioplatense y cercano. Pasión por la cultura, el encuentro entre amigos, el mate y el sentido de pertenencia.';
      targetAudience = 'Uruguayos y amantes de la cultura rioplatense en su país y viviendo en el exterior que buscan conectarse.';
    } else if (detectedCategory === 'gaming') {
      voicePersona = 'High-energy, gamer-centric, tactical, and community-driven. Passionate about leaderboards, rewards, and epic mechanics.';
      targetAudience = 'Enthusiastic gamers, esports fans, and competitive web3 / mobile players.';
    } else {
      voicePersona = 'Modern, crisp, developer-friendly, and forward-thinking. Focused on sub-second speed, intuitive workflow design, and productivity.';
      targetAudience = 'Founders, builders, product designers, and power users looking for high-performance software solutions.';
    }

    // Ensure fallback tagline
    if (!extractedTagline) {
      if (isLotteryTool) extractedTagline = 'Evidence-first lottery portfolio tools and probability analytics for Canadian games and U.S. Powerball.';
      else if (isFantasySports) extractedTagline = 'Scout real football players, trade player shares, and build your fantasy XI.';
      else if (detectedCategory === 'fintech') extractedTagline = 'High-probability stock scanner & real-time option volatility analysis.';
      else if (detectedCategory === 'salon') extractedTagline = 'Luxury hair transformations, master balayage & bespoke hair care.';
      else if (detectedCategory === 'extensions') extractedTagline = '100% Pure Remy human hair extensions & seamless hand-tied wefts.';
      else if (detectedCategory === 'community') extractedTagline = 'La red social y punto de encuentro para todos los uruguayos en el mundo.';
      else extractedTagline = 'Next-generation intelligent platform designed to elevate your workflow.';
    }

    // --- 9. AUTO-GENERATE HASHTAG VAULT ---
    const commonHashtags = [
      `#${cleanBrandTag}`,
      ...(isLotteryTool
        ? ['#Lottery', '#Powerball', '#LottoStrategies', '#LotteryTools', '#SmartPlay', '#LottoMax', '#Lotto649', '#Probability', '#LotteryAnalytics']
        : isFantasySports
        ? ['#FantasyFootball', '#FootballTrading', '#FantasySports', '#ScoutPlayers', '#FantasyXI', '#FootballManager', '#MatchDay', '#FutbolFantasy', '#WonderkidScout', '#PlayMoneyBeta', '#FootballMarket']
        : detectedCategoryDef?.defaultHashtags && detectedCategoryDef.defaultHashtags.length > 0
        ? detectedCategoryDef.defaultHashtags
        : ['#BuildInPublic', '#ProductivityHacks', '#SaaSSolutions', '#TechInnovation', '#ModernWorkflow', '#CreatorEconomy']
      )
    ];

    // --- 10. SUGGESTED TOPICS / INSPIRATIONS ---
    let suggestedTopics = isLotteryTool
      ? [
          `How building a diversified lottery portfolio compares against quick-pick random tickets`,
          `The mathematics of Powerball & Lotto Max: What the Learning Lab reveals about odds`,
          `3 common lottery number selection myths debunked by historical draw data`,
          `How Evidraw tracks your pre-draw numbers against official results with zero bias`
        ]
      : isFantasySports
      ? [
          `Top 3 breakout wonderkids to scout and add to your squad before Gameweek 15`,
          `Why trading player shares based on real-life match form beats traditional fantasy leagues`,
          `Watch this transfer scout: How one breakout game doubled this winger's market value`,
          `How to build an elite Fantasy XI on ${extractedName} without burning your transfer budget`
        ]
      : [
          `3 reasons why ${extractedName} outperforms standard industry alternatives`,
          `How to avoid the #1 costly mistake in ${detectedCategoryDef?.label || detectedCategory}`,
          `Behind the scenes: the technical design decisions behind ${extractedName}`,
          `Quick walkthrough: achieving maximum payoff in less than 60 seconds`
        ];

    // --- 11. LIVE GEMINI 3.8 FLASH BRAND DNA DEEP EXTRACTION ---
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && cleanVisibleText.length > 40) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const dnaPrompt = `Analyze this website for "${extractedName}" (${normalizedUrl}).
Scraped Tagline: "${extractedTagline}"
Visible Website Text Excerpt: "${cleanVisibleText.slice(0, 1800)}"

Return a JSON object with:
- "tagline": Punchy 1-sentence value proposition (max 110 chars)
- "voicePersona": 2-sentence description of the brand's exact tone, personality, and authority style
- "targetAudience": 1-2 sentence description of the exact ideal customer/user persona
- "suggestedTopics": Array of 5 specific, high-converting social media content/ad hooks tailored to this exact product
- "hashtags": Array of 6 relevant hashtags starting with #`;

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: dnaPrompt
        } as any);

        const rawText = (interaction as any)?.outputs
          ?.filter((o: any) => o.type === 'text')
          ?.map((o: any) => o.text)
          ?.join('') || '';

        if (rawText) {
          const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
          const parsedDna = JSON.parse(cleaned);
          if (parsedDna.tagline) extractedTagline = parsedDna.tagline;
          if (parsedDna.voicePersona) voicePersona = parsedDna.voicePersona;
          if (parsedDna.targetAudience) targetAudience = parsedDna.targetAudience;
          if (Array.isArray(parsedDna.suggestedTopics) && parsedDna.suggestedTopics.length > 0) {
            suggestedTopics = parsedDna.suggestedTopics;
          }
          if (Array.isArray(parsedDna.hashtags) && parsedDna.hashtags.length > 0) {
            for (const tag of parsedDna.hashtags) {
              const formatted = String(tag).startsWith('#') ? String(tag) : `#${tag}`;
              if (!commonHashtags.includes(formatted)) commonHashtags.push(formatted);
            }
          }
        }
      } catch (dnaErr) {
        console.warn('Gemini 3.8 Flash Brand DNA enrichment skipped:', dnaErr);
      }
    }

    const result: ScannedBrandProfile = {
      name: extractedName,
      tagline: extractedTagline,
      category: detectedCategory,
      websiteUrl: normalizedUrl,
      websiteScreenshotUrl,
      websiteMobileScreenshotUrl,
      websiteDesktopScreenshotUrl,
      brandAssets,
      logoUrl: extractedLogoUrl,
      logoEmoji: detectedEmoji,
      primaryColor: detectedPrimary,
      secondaryColor: detectedSecondary,
      textColor: '#ffffff',
      typography: detectedTypography,
      voicePersona,
      targetAudience,
      defaultChannels,
      commonHashtags,
      suggestedTopics,
      detectedSocials,
      source: isLiveScrapeSuccess ? 'live_scrape' : 'heuristic_fallback',
      metaDescription: extractedTagline,
      customCategoryDef: detectedCategoryDef
    };

    return NextResponse.json({
      success: true,
      profile: result
    });
  } catch (error: any) {
    console.error('Brand Scan API Error:', error);
    return NextResponse.json(
      { error: 'SCAN_FAILED', message: error.message || 'Failed to scan website.' },
      { status: 500 }
    );
  }
}
