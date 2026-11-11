import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { BrandAsset } from '@/types/brand';
import fs from 'fs';
import path from 'path';

interface ActiveOtpSession {
  browser: any;
  context: any;
  page: any;
  email: string;
  createdAt: number;
}

const globalForOtp = globalThis as unknown as {
  __activeOtpSessions?: Record<string, ActiveOtpSession>;
};
if (!globalForOtp.__activeOtpSessions) {
  globalForOtp.__activeOtpSessions = {};
}

function cleanJsonString(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function getSessionFilePath(brandKey: string): string {
  const safeSlug = (brandKey || 'default').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const dir = path.join(process.cwd(), '.bot-sessions');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${safeSlug}.json`);
}

function findLocalBrowserExecutable(): string | undefined {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
    } catch {}
  }
  return undefined;
}

// Helper to submit the form belonging to an input (never clicking Google/ChatGPT/OAuth buttons)
async function clickFormSubmitForInput(page: any, inputEl: any): Promise<void> {
  // Wait a short beat for React controlled state to enable the submit button
  await page.waitForTimeout(350);

  const clickedInForm = await inputEl
    .evaluate((el: HTMLElement) => {
      const form = el.closest('form');
      if (form) {
        const submitBtn = form.querySelector(
          'button[type="submit"], input[type="submit"]'
        ) as HTMLButtonElement | null;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('disabled');
          submitBtn.click();
          return true;
        }
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
          return true;
        }
      }
      return false;
    })
    .catch(() => false);

  if (clickedInForm) return;

  // Fallback: only consider visible non-OAuth buttons with a short timeout
  const buttons = await page.$$('button[type="submit"]:visible, input[type="submit"]:visible, button:visible');
  for (const btn of buttons) {
    const txt = ((await btn.innerText().catch(() => '')) || '').toLowerCase();
    const cls = ((await btn.getAttribute('class').catch(() => '')) || '').toLowerCase();
    const isOAuth =
      txt.includes('google') ||
      txt.includes('chatgpt') ||
      txt.includes('apple') ||
      txt.includes('github') ||
      txt.includes('facebook') ||
      cls.includes('google');

    if (
      !isOAuth &&
      (txt.includes('email') ||
        txt.includes('code') ||
        txt.includes('send') ||
        txt.includes('continue securely') ||
        txt.includes('verify') ||
        txt.includes('sign in'))
    ) {
      await btn.click({ timeout: 4000 }).catch(() => null);
      return;
    }
  }

  await inputEl.press('Enter').catch(() => null);
}

// Helper to enter an OTP code on a page and verify it reliably
async function verifyOtpOnPage(
  page: any,
  email: string,
  code: string,
  baseSite: string
): Promise<{ verified: boolean; errorMsg?: string }> {
  const cleanCode = code.trim().replace(/\D/g, '') || code.trim();
  if (!cleanCode) return { verified: false, errorMsg: 'Empty verification code.' };

  // 1. First, if #login-code or an OTP input is visible on the page, fill it and submit the form
  const otpSelector =
    '#login-code, input.login-code-input, input[autocomplete="one-time-code"]:visible, input[name*="code" i]:visible, input[name*="otp" i]:visible, input[name*="token" i]:visible';
  const otpInput = await page.$(otpSelector);

  if (otpInput) {
    await otpInput.click().catch(() => null);
    await otpInput.fill(cleanCode);
    await page.waitForTimeout(350);
    await clickFormSubmitForInput(page, otpInput);

    // Wait up to 5 seconds for either redirect away from /login or a status message
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        return { verified: true };
      }
    }
  } else {
    // Check for 4-8 individual 1-digit OTP boxes
    const digitBoxes = await page.$$('input[maxlength="1"]:visible, input[data-input-otp]:visible');
    if (digitBoxes && digitBoxes.length >= 4 && digitBoxes.length <= 8) {
      for (let i = 0; i < Math.min(cleanCode.length, digitBoxes.length); i++) {
        await digitBoxes[i].fill(cleanCode[i]);
      }
      await page.waitForTimeout(2500);
      if (!page.url().includes('/login')) {
        return { verified: true };
      }
    }
  }

  // 2. Direct /auth/verify-code POST inside the browser context (used by Evidraw & Supabase SSR apps)
  if (email) {
    const apiVerifyResult = await page
      .evaluate(
        async ({ userEmail, token }: { userEmail: string; token: string }) => {
          try {
            const res = await fetch('/auth/verify-code', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userEmail.trim().toLowerCase(),
                token
              })
            });
            const data = await res.json().catch(() => ({}));
            return {
              ok: res.ok,
              status: res.status,
              error: data?.error || data?.message || ''
            };
          } catch (e: any) {
            return { ok: false, status: 0, error: e?.message || '' };
          }
        },
        { userEmail: email, token: cleanCode }
      )
      .catch(() => ({ ok: false, status: 0, error: '' }));

    if (apiVerifyResult.ok) {
      await page
        .goto(baseSite, { waitUntil: 'domcontentloaded', timeout: 12000 })
        .catch(() => null);
      await page.waitForTimeout(1500);
      return { verified: true };
    }

    if (apiVerifyResult.error) {
      return { verified: false, errorMsg: apiVerifyResult.error };
    }
  }

  // 3. Check if the page displays an error message in .login-message
  const pageError = await page
    .$eval('.login-message, [role="status"], [role="alert"]', (el: any) => (el.textContent || '').trim())
    .catch(() => '');

  return {
    verified: !page.url().includes('/login'),
    errorMsg: pageError || 'Code could not be verified. Please request a fresh code and enter the newest 6-digit code from your email.'
  };
}

// Clean a tab or route label for fuzzy matching (e.g. "/market" -> "market", "FantasyNEW" -> "fantasy", "Player IPOs36" -> "player ipos")
function normalizeNavLabel(raw: string): string {
  return (raw || '')
    .replace(/^tab:/i, '')
    .replace(/^\//, '')
    .replace(/(?:new|beta|coming soon|\d+)$/gi, '')
    .replace(/\b(new|beta|coming soon|\d+)\b/gi, '')
    .replace(/[\/\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Discover both in-page SPA navigation buttons/tabs (e.g. Market, Portfolio, Scouting, Fantasy) and valid internal URL links
async function discoverAppNavigation(page: any): Promise<{
  inPageTabs: string[];
  urlRoutes: string[];
  allSuggestedTargets: string[];
}> {
  const result = await page
    .evaluate(() => {
      const cleanLabel = (txt: string) =>
        (txt || '')
          .replace(/(?:NEW|BETA|Coming soon|\d+)$/g, '')
          .replace(/\b(NEW|BETA|Coming soon|\d+)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

      const ignoreWords = [
        'log in',
        'login',
        'sign in',
        'sign up',
        'logout',
        'log out',
        'report an issue',
        'feedback',
        'install',
        'founding scout',
        'privacy',
        'terms',
        'more',
        'close',
        'menu',
        'play money',
        'vbn'
      ];

      const tabSet = new Set<string>();
      const navButtons = Array.from(
        document.querySelectorAll(
          'nav button, .nav-item, .phone-tabs button, [role="tab"], aside button, [class*="sidebar" i] button'
        )
      );

      for (const btn of navButtons) {
        const raw = cleanLabel((btn as HTMLElement).innerText || btn.textContent || '');
        const lower = raw.toLowerCase();
        if (
          raw.length >= 3 &&
          raw.length <= 28 &&
          !ignoreWords.some((w) => lower === w || lower.includes(w))
        ) {
          tabSet.add(raw);
        }
      }

      const routeSet = new Set<string>();
      const anchors = Array.from(document.querySelectorAll('nav a[href], header a[href], a[href]'));
      for (const a of anchors) {
        const href = (a.getAttribute('href') || '').trim();
        if (
          href.startsWith('/') &&
          href.length > 1 &&
          !href.startsWith('//') &&
          !href.includes('login') &&
          !href.includes('logout') &&
          !href.includes('privacy') &&
          !href.includes('terms') &&
          !href.includes('vbn')
        ) {
          routeSet.add(href);
        }
      }

      return {
        inPageTabs: Array.from(tabSet),
        urlRoutes: Array.from(routeSet)
      };
    })
    .catch(() => ({ inPageTabs: [], urlRoutes: [] }));

  const allSuggestedTargets =
    result.inPageTabs.length > 0
      ? result.inPageTabs
      : result.urlRoutes.length > 0
      ? result.urlRoutes
      : ['Home', 'Market', 'Portfolio', 'Dashboard'];

  return {
    inPageTabs: result.inPageTabs,
    urlRoutes: result.urlRoutes,
    allSuggestedTargets
  };
}

// Detect whether the current page is a 404 Not Found error page
async function isPage404Error(page: any, httpStatus?: number): Promise<boolean> {
  if (httpStatus === 404 || httpStatus === 410) return true;
  return await page
    .evaluate(() => {
      const title = (document.title || '').toLowerCase();
      const bodyText = (document.body?.innerText || '').slice(0, 1200).toLowerCase();
      if (title.includes('404') || title.includes('not found')) return true;
      if (
        (bodyText.includes('404') &&
          (bodyText.includes('not found') ||
            bodyText.includes('could not be found') ||
            bodyText.includes('page doesn\'t exist') ||
            bodyText.includes('does not exist'))) ||
        bodyText.includes('this page could not be found')
      ) {
        return true;
      }
      return false;
    })
    .catch(() => false);
}

// Try clicking an in-page navigation button/tab matching targetName AND return its viewport bounding box (0..100%)
async function tryClickInPageNavTab(
  page: any,
  targetName: string
): Promise<{
  clicked: boolean;
  matchedLabel?: string;
  buttonBox?: { x: number; y: number; width: number; height: number };
}> {
  const want = normalizeNavLabel(targetName);
  if (!want) return { clicked: false };

  const res = await page
    .evaluate((targetNorm: string) => {
      const norm = (s: string) =>
        (s || '')
          .replace(/(?:new|beta|coming soon|\d+)$/gi, '')
          .replace(/\b(new|beta|coming soon|\d+)\b/gi, '')
          .replace(/[\/\-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

      // Dedicated navigation selectors first (before generic page buttons!) so tabs like "Scouting" or "Player IPOs" never match random body buttons
      const navSelectors = [
        '.phone-tabs button',
        '.nav-item',
        'nav button',
        '[role="tab"]',
        'nav a',
        'aside button',
        'header button'
      ];

      const navCandidates: HTMLElement[] = [];
      for (const sel of navSelectors) {
        const found = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
        for (const el of found) {
          if (!navCandidates.includes(el)) navCandidates.push(el);
        }
      }

      const fallbackButtons = Array.from(document.querySelectorAll('button')) as HTMLElement[];

      const isVisibleInViewport = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 8 &&
          r.height > 8 &&
          r.top >= 0 &&
          r.bottom <= window.innerHeight + 20 &&
          r.left >= 0 &&
          r.right <= window.innerWidth + 20
        );
      };

      // 1. Exact normalized match on dedicated nav candidates (visible first, then off-canvas drawer nav items)
      let match =
        navCandidates.find(
          (el) => isVisibleInViewport(el) && norm(el.innerText || el.textContent || '') === targetNorm
        ) ||
        navCandidates.find((el) => norm(el.innerText || el.textContent || '') === targetNorm);

      // 2. Partial match on dedicated nav candidates
      if (!match) {
        match =
          navCandidates.find((el) => {
            const t = norm(el.innerText || el.textContent || '');
            return (
              isVisibleInViewport(el) &&
              t.length > 1 &&
              t.length <= 32 &&
              (t.includes(targetNorm) || targetNorm.includes(t))
            );
          }) ||
          navCandidates.find((el) => {
            const t = norm(el.innerText || el.textContent || '');
            return t.length > 1 && t.length <= 32 && (t.includes(targetNorm) || targetNorm.includes(t));
          });
      }

      // 3. Fallback to generic buttons only if no nav item matched
      if (!match) {
        match =
          fallbackButtons.find(
            (el) => isVisibleInViewport(el) && norm(el.innerText || el.textContent || '') === targetNorm
          ) ||
          fallbackButtons.find((el) => {
            const t = norm(el.innerText || el.textContent || '');
            return (
              isVisibleInViewport(el) &&
              t.length > 2 &&
              t.length <= 26 &&
              (t.includes(targetNorm) || targetNorm.includes(t))
            );
          });
      }

      if (match) {
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const rect = match.getBoundingClientRect();
        let buttonBox: { x: number; y: number; width: number; height: number } | undefined = undefined;

        if (rect.width > 5 && rect.height > 5 && rect.top >= 0 && rect.top <= vh && rect.left >= 0 && rect.left <= vw) {
          buttonBox = {
            x: Math.max(2, Math.min(90, Math.round((rect.left / vw) * 100))),
            y: Math.max(2, Math.min(94, Math.round((rect.top / vh) * 100))),
            width: Math.max(10, Math.min(60, Math.round((rect.width / vw) * 100))),
            height: Math.max(5, Math.min(20, Math.round((rect.height / vh) * 100)))
          };
        }

        match.click();
        // Close mobile drawer if a close button is open so it doesn't cover the screenshot
        const closeDrawerBtn = document.querySelector(
          'button.navigation-close, .drawer-open button.navigation-close'
        ) as HTMLElement | null;
        if (closeDrawerBtn && closeDrawerBtn.offsetParent !== null) {
          closeDrawerBtn.click();
        }
        const cleanLabel = (match.innerText || match.textContent || '')
          .replace(/(?:NEW|BETA|\d+)$/gi, '')
          .replace(/\b(NEW|BETA|\d+)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        return { clicked: true, matchedLabel: cleanLabel || targetNorm, buttonBox };
      }

      return { clicked: false };
    }, want)
    .catch(() => ({ clicked: false }));

  if (res.clicked) {
    await page.waitForTimeout(1100);
    // Warm up lazy-loaded sections down the full page, then return to top
    await page.evaluate(() => window.scrollTo(0, 950)).catch(() => null);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 1950)).catch(() => null);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => null);
    await page.waitForTimeout(350);
  }
  return res;
}

// Inspect the full scrollable page to extract multi-stop vertical scroll & zoom waypoints, bounding boxes, and a smart coaching script
async function extractScreenUIHighlightAndSmartScript(
  page: any,
  screenLabel: string,
  brandName: string,
  clickedButtonBox?: { x: number; y: number; width: number; height: number }
) {
  return await page
    .evaluate(
      ({
        label,
        bName,
        navBox
      }: {
        label: string;
        bName: string;
        navBox?: { x: number; y: number; width: number; height: number };
      }) => {
        window.scrollTo(0, 0);
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const docHeight = Math.max(
          vh,
          document.documentElement?.scrollHeight || vh,
          document.body?.scrollHeight || vh
        );
        const maxScroll = Math.max(1, docHeight - vh);

        const isRenderedOnPage = (el: HTMLElement) => {
          if (!el || el.offsetParent === null) return false;
          const r = el.getBoundingClientRect();
          const absTop = r.top + window.scrollY;
          return r.width > 16 && r.height > 14 && absTop >= 0 && absTop < docHeight - 60;
        };

        // 1. All Headings across the full scrollable page
        const headings = Array.from(document.querySelectorAll('main h1, main h2, main h3, h1, h2, h3'))
          .filter((el) => isRenderedOnPage(el as HTMLElement))
          .map((el) => ((el as HTMLElement).innerText || '').trim().replace(/\s+/g, ' '))
          .filter(
            (t) =>
              t.length > 2 &&
              t.length < 70 &&
              !t.includes('Take Varbona with you') &&
              !t.includes('iPhone & iPad') &&
              !t.includes('On a computer?')
          )
          .slice(0, 8);

        // 2. Action Buttons across the page
        const actionButtons = Array.from(
          document.querySelectorAll('main button, main a.button, section button, .card button, button.primary, button.secondary')
        )
          .filter((el) => isRenderedOnPage(el as HTMLElement))
          .map((el) => ({
            el: el as HTMLElement,
            text: ((el as HTMLElement).innerText || '').trim().replace(/\s+/g, ' ')
          }))
          .filter((item) => item.text.length >= 3 && item.text.length <= 42);

        // 3. Primary target button at the top of the page (Waypoint 1)
        let primaryBox = navBox;
        let calloutText = `Click "${label}"`;

        if (!primaryBox) {
          const phoneTabBtn = Array.from(document.querySelectorAll('.phone-tabs button, nav button')).find(
            (b) => {
              const r = (b as HTMLElement).getBoundingClientRect();
              return (
                r.width > 10 &&
                r.top >= 0 &&
                r.bottom <= vh + 10 &&
                ((b as HTMLElement).innerText || '').toLowerCase().includes(label.toLowerCase())
              );
            }
          ) as HTMLElement | undefined;

          if (phoneTabBtn) {
            const r = phoneTabBtn.getBoundingClientRect();
            primaryBox = {
              x: Math.max(2, Math.min(88, Math.round((r.left / vw) * 100))),
              y: Math.max(4, Math.min(93, Math.round((r.top / vh) * 100))),
              width: Math.max(12, Math.min(35, Math.round((r.width / vw) * 100))),
              height: Math.max(5, Math.min(12, Math.round((r.height / vh) * 100)))
            };
          } else {
            const topActionBtn = actionButtons.find((b) => {
              const r = b.el.getBoundingClientRect();
              return r.top >= 40 && r.top <= vh * 0.75;
            });
            if (topActionBtn) {
              const r = topActionBtn.el.getBoundingClientRect();
              primaryBox = {
                x: Math.max(4, Math.min(82, Math.round((r.left / vw) * 100))),
                y: Math.max(10, Math.min(88, Math.round((r.top / vh) * 100))),
                width: Math.max(18, Math.min(75, Math.round((r.width / vw) * 100))),
                height: Math.max(6, Math.min(14, Math.round((r.height / vh) * 100)))
              };
              calloutText = `Click "${label}" → Tap "${topActionBtn.text.slice(0, 22)}"`;
            } else {
              primaryBox = { x: 24, y: 91, width: 22, height: 7 };
            }
          }
        }

        // 4. Scan the ENTIRE vertical page (from 0px to docHeight) for distinct major sections to scroll & zoom into!
        const rawSectionEls = Array.from(
          document.querySelectorAll(
            'main section, main article, .market-player-cards, .pitch-card, .lineup-pool, .portfolio-performance, .holdings-panel, .order-management, .home-portfolio, .home-competitions, .home-ipos, [class*="card" i], [class*="panel" i], [class*="table" i]'
          )
        ) as HTMLElement[];

        interface CandidateSection {
          absTop: number;
          height: number;
          left: number;
          width: number;
          headingText: string;
          buttonText: string;
        }

        const sectionsDownPage: CandidateSection[] = [];
        for (const el of rawSectionEls) {
          if (!el || el.offsetParent === null) continue;
          const r = el.getBoundingClientRect();
          const absTop = r.top + window.scrollY;
          if (r.width < vw * 0.55 || r.height < 85 || r.height > 1250) continue;
          if (absTop < 140 || absTop > docHeight - 220) continue;

          const txt = (el.innerText || '').trim().replace(/\s+/g, ' ');
          if (
            txt.includes('Take Varbona with you') ||
            txt.includes('On a computer?') ||
            txt.length < 15
          ) {
            continue;
          }

          // Skip if we already picked a section within 260px of this absTop
          if (sectionsDownPage.some((s) => Math.abs(s.absTop - absTop) < 260)) {
            continue;
          }

          const innerH = el.querySelector('h1, h2, h3, h4, .eyebrow, strong') as HTMLElement | null;
          const headingSnippet = (innerH?.innerText || txt.slice(0, 42))
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 38);

          const innerBtn = el.querySelector('button, a.button') as HTMLElement | null;
          const btnSnippet = (innerBtn?.innerText || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 24);

          sectionsDownPage.push({
            absTop,
            height: Math.min(r.height, vh * 0.54),
            left: r.left,
            width: r.width,
            headingText: headingSnippet,
            buttonText: btnSnippet
          });
        }

        sectionsDownPage.sort((a, b) => a.absTop - b.absTop);

        // Top viewport card for initial importantArea
        const topCard = sectionsDownPage.find((s) => s.absTop <= vh * 0.65) || sectionsDownPage[0];
        const importantArea = topCard
          ? {
              x: Math.max(4, Math.min(35, Math.round((topCard.left / vw) * 100))),
              y: Math.max(14, Math.min(64, Math.round((Math.min(topCard.absTop, vh * 0.55) / vh) * 100))),
              width: Math.max(50, Math.min(92, Math.round((topCard.width / vw) * 100))),
              height: Math.max(18, Math.min(48, Math.round((topCard.height / vh) * 100))),
              label: topCard.headingText || `${label} Overview`
            }
          : {
              x: 6,
              y: 22,
              width: 88,
              height: 44,
              label: `${label} Live Controls`
            };

        // 5. Craft smart instructional voiceover & custom callout labels
        const lowerLabel = label.toLowerCase();
        const btnNames = actionButtons
          .map((b) => b.text)
          .slice(0, 5)
          .join(', ');

        let smartVoiceover = '';
        if (lowerLabel.includes('market')) {
          smartVoiceover = `Click Market to open the live transfer exchange, scroll down through 24-hour market movers, and tap Buy or Sell on available player cards.`;
          importantArea.label = 'Available Players to Buy & Sell';
          calloutText = 'Click "Market" to Buy & Sell Players';
        } else if (lowerLabel.includes('portfolio')) {
          smartVoiceover = `Click Portfolio to inspect your total equity, scroll down to analyze your trading performance chart, and manage your active player positions and limit orders.`;
          importantArea.label = 'Live Player Holdings & Squad Equity';
          calloutText = 'Click "Portfolio" to Track Holdings';
        } else if (lowerLabel.includes('scout')) {
          smartVoiceover = `Click Scouting to filter undervalued wonderkids, scroll through breakout scouting reports, and back rising talent early.`;
          importantArea.label = 'Scout Breakout Talent & Wonderkids';
          calloutText = 'Click "Scouting" to Find Wonderkids';
        } else if (lowerLabel.includes('fantasy') || lowerLabel.includes('xi')) {
          smartVoiceover = `Click Fantasy to pick a live matchday competition, scroll down to the 4-3-3 pitch builder, and select your starting eleven from your player pool.`;
          importantArea.label = 'Build Your 4-3-3 Fantasy XI Lineup';
          calloutText = 'Click "Fantasy" → Build Your XI';
        } else if (lowerLabel.includes('ipo')) {
          smartVoiceover = `Click Player IPOs to browse new player releases, scroll through upcoming initial offerings, and lock in early shares.`;
          importantArea.label = 'Live Player IPO Launches';
          calloutText = 'Click "Player IPOs" to Join Early';
        } else if (lowerLabel.includes('home') || lowerLabel.includes('dashboard')) {
          smartVoiceover = `Start on the ${bName} Home dashboard to check your portfolio snapshot, scroll down through upcoming Weekend XI competitions, and spot new Player IPO releases.`;
          importantArea.label = `${bName} Command Dashboard`;
          calloutText = `Start Here: ${bName} Home`;
        } else if (lowerLabel.includes('learn') || lowerLabel.includes('lab')) {
          smartVoiceover = `Click the Learning Lab to test number probability models, scroll down through simulation charts, and compare structured portfolios.`;
          importantArea.label = 'Probability & Strategy Lab';
          calloutText = 'Click "Learning Lab"';
        } else {
          smartVoiceover = `Click ${label} inside ${bName}, then scroll down through ${headings.slice(0, 3).join(', ') || 'the workspace'} to use ${btnNames || 'the live controls'}.`;
        }

        // 6. Build Multi-Stop Vertical Scroll & Zoom Waypoints (Stop 1 at Top -> Stop 2 Mid-Page -> Stop 3 Deep-Page)
        const scrollWaypoints: Array<{
          scrollYPercent: number;
          x: number;
          yInViewport: number;
          width: number;
          height: number;
          calloutText: string;
          sectionLabel?: string;
          zoomScale?: number;
        }> = [
          {
            scrollYPercent: 0,
            x: primaryBox.x,
            yInViewport: primaryBox.y,
            width: primaryBox.width,
            height: primaryBox.height,
            calloutText,
            sectionLabel: importantArea.label,
            zoomScale: 1.42
          }
        ];

        // Pick up to 3 additional sections further down the page (absTop >= 320px)
        const deeperSections = sectionsDownPage.filter((s) => s.absTop >= 320).slice(0, 3);
        for (let idx = 0; idx < deeperSections.length; idx++) {
          const sec = deeperSections[idx];
          // Scroll so the section appears comfortably at ~22% from the top of the 9:16 viewport
          const desiredViewportTopPx = vh * 0.22;
          const targetScrollPx = Math.max(0, Math.min(maxScroll, sec.absTop - desiredViewportTopPx));
          const scrollYPercent = Math.max(8, Math.min(95, Math.round((targetScrollPx / maxScroll) * 100)));
          const actualTopInViewportPx = Math.max(55, sec.absTop - targetScrollPx);
          const yInViewport = Math.max(10, Math.min(72, Math.round((actualTopInViewportPx / vh) * 100)));

          const actionCallout = sec.buttonText
            ? `Scroll & Tap "${sec.buttonText}"`
            : `Inspect: ${sec.headingText.slice(0, 26)}`;

          scrollWaypoints.push({
            scrollYPercent,
            x: Math.max(4, Math.min(30, Math.round((sec.left / vw) * 100))),
            yInViewport,
            width: Math.max(55, Math.min(92, Math.round((sec.width / vw) * 100))),
            height: Math.max(18, Math.min(48, Math.round((sec.height / vh) * 100))),
            calloutText: actionCallout,
            sectionLabel: sec.headingText,
            zoomScale: 1.3
          });
        }

        // If the page is tall (> 1400px) and fewer than 3 waypoints were found, add synthetic mid/bottom scroll stops so clips always scroll the full page!
        if (docHeight > 1400 && scrollWaypoints.length < 3) {
          scrollWaypoints.push({
            scrollYPercent: 38,
            x: 6,
            yInViewport: 24,
            width: 88,
            height: 42,
            calloutText: `Scroll Down: ${headings[1] || `${label} Details`}`,
            sectionLabel: headings[1] || `${label} Mid-Page View`,
            zoomScale: 1.28
          });
          scrollWaypoints.push({
            scrollYPercent: 76,
            x: 6,
            yInViewport: 26,
            width: 88,
            height: 42,
            calloutText: `Explore: ${headings[2] || `${label} Action Panel`}`,
            sectionLabel: headings[2] || `${label} Full View`,
            zoomScale: 1.28
          });
        }

        const uiSummary = [
          headings.length > 0 ? `Headings: ${headings.join(' • ')}` : '',
          btnNames ? `Interactive Actions: ${btnNames}` : '',
          `Full Scroll Height: ${docHeight}px (${scrollWaypoints.length} scroll & zoom stops)`
        ]
          .filter(Boolean)
          .join(' | ');

        return {
          uiSummary: uiSummary || `Authenticated full-page view of ${label}`,
          smartVoiceover,
          pageHeightPx: docHeight,
          uiHighlight: {
            x: primaryBox.x,
            y: primaryBox.y,
            width: primaryBox.width,
            height: primaryBox.height,
            calloutText,
            importantArea,
            zoomScale: 1.45,
            scrollWaypoints,
            pageHeightPx: docHeight
          }
        };
      },
      { label: screenLabel, bName: brandName, navBox: clickedButtonBox }
    )
    .catch(() => ({
      uiSummary: `Authenticated view of ${screenLabel}`,
      smartVoiceover: `Click ${screenLabel} inside ${brandName} and scroll down to explore every feature step by step.`,
      pageHeightPx: 2400,
      uiHighlight: {
        x: 25,
        y: 91,
        width: 22,
        height: 7,
        calloutText: `Click "${screenLabel}"`,
        importantArea: {
          x: 6,
          y: 22,
          width: 88,
          height: 44,
          label: `${screenLabel} Highlighted Area`
        },
        zoomScale: 1.45,
        scrollWaypoints: [
          {
            scrollYPercent: 0,
            x: 25,
            yInViewport: 91,
            width: 22,
            height: 7,
            calloutText: `Click "${screenLabel}"`,
            sectionLabel: `${screenLabel} Overview`,
            zoomScale: 1.42
          },
          {
            scrollYPercent: 42,
            x: 6,
            yInViewport: 24,
            width: 88,
            height: 42,
            calloutText: `Scroll to ${screenLabel} Controls`,
            sectionLabel: `${screenLabel} Live Panel`,
            zoomScale: 1.3
          },
          {
            scrollYPercent: 78,
            x: 6,
            yInViewport: 26,
            width: 88,
            height: 42,
            calloutText: `Explore Full ${screenLabel} View`,
            sectionLabel: `${screenLabel} Action Cards`,
            zoomScale: 1.3
          }
        ],
        pageHeightPx: 2400
      }
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'crawl_inside_app',
      brandSlug = 'default',
      brandName = 'Brand',
      brandTagline = '',
      brandCategory = '',
      websiteUrl = '',
      authMethod = 'email_otp',
      loginUrl = '',
      botEmail = '',
      botPassword = '',
      staticOtpPin = '',
      otpCode = '',
      sessionCookie = '',
      internalRoutes = [],
      authenticatedAssets = [],
      tutorialGoal = '',
      crawlViewport = 'desktop',
      apiKey: clientApiKey = ''
    } = body;

    const isDesktopViewport = crawlViewport === 'desktop' || crawlViewport === '16:9';
    const targetViewportSize = isDesktopViewport
      ? { width: 1440, height: 810 }
      : { width: 430, height: 880 };
    const targetUserAgent = isDesktopViewport
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 BrandCommandBot/2.0'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 BrandCommandBot/2.0';

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();
    const sessionKey = (brandSlug || brandName || 'default').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const sessionFilePath = getSessionFilePath(sessionKey);

    // ============================================================================
    // MODE 0: CLEAR SAVED PERSISTENT SESSION
    // ============================================================================
    if (mode === 'clear_saved_session') {
      try {
        if (fs.existsSync(sessionFilePath)) {
          fs.unlinkSync(sessionFilePath);
        }
        const existingOtp = globalForOtp.__activeOtpSessions?.[sessionKey];
        if (existingOtp?.browser) {
          await existingOtp.browser.close().catch(() => null);
          delete globalForOtp.__activeOtpSessions![sessionKey];
        }
      } catch {}
      return NextResponse.json({
        success: true,
        hasSavedSession: false,
        message: `Cleared saved browser session for ${brandName}.`
      });
    }

    // ============================================================================
    // MODE 1A: STEP 1 OF EMAIL OTP — ENTER EMAIL & CLICK "SEND CODE"
    // ============================================================================
    if (mode === 'request_email_otp') {
      const executablePath = findLocalBrowserExecutable();
      if (!executablePath) {
        return NextResponse.json(
          { error: 'NO_BROWSER', message: 'Local Chrome/Edge executable not found.' },
          { status: 500 }
        );
      }

      const prev = globalForOtp.__activeOtpSessions?.[sessionKey];
      if (prev?.browser) {
        await prev.browser.close().catch(() => null);
        delete globalForOtp.__activeOtpSessions![sessionKey];
      }

      const baseSite = (websiteUrl || loginUrl || 'https://evidraw.com').replace(/\/$/, '');
      const targetLoginUrl = loginUrl.trim() || `${baseSite}/login`;

      const pw = await import('playwright-core');
      const browser = await pw.chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const context = await browser.newContext({
        viewport: targetViewportSize,
        deviceScaleFactor: 1.5,
        userAgent: targetUserAgent
      });

      const page = await context.newPage();
      await page.goto(targetLoginUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(800);

      let statusNote = `Opened ${targetLoginUrl}`;
      if (botEmail) {
        const emailSelector =
          '#login-email, form.email-login-form input[type="email"], input[type="email"], input[name*="email" i], input[id*="email" i], input[placeholder*="email" i]';
        const emailEl = await page.$(emailSelector);
        if (emailEl) {
          await emailEl.click().catch(() => null);
          await emailEl.fill(botEmail.trim());
          await clickFormSubmitForInput(page, emailEl);

          await page
            .waitForSelector('#login-code, input[autocomplete="one-time-code"], .login-message', {
              timeout: 7000
            })
            .catch(() => null);
          await page.waitForTimeout(600);

          const pageStatusMsg = await page
            .$eval('.login-message, [role="status"]', (el: any) => (el.textContent || '').trim())
            .catch(() => '');

          statusNote = pageStatusMsg
            ? `Email form submitted for ${botEmail}! Site response: "${pageStatusMsg}"`
            : `Entered ${botEmail} into the Email sign-in form and clicked "Email me a sign-in code"! Check your email for the code.`;
        } else {
          statusNote = `Opened ${targetLoginUrl}, but could not locate an email input field on that URL.`;
        }
      }

      const previewBuf = await page.screenshot({ type: 'jpeg', quality: 78 }).catch(() => null);
      const previewDataUrl = previewBuf ? `data:image/jpeg;base64,${previewBuf.toString('base64')}` : undefined;

      globalForOtp.__activeOtpSessions![sessionKey] = {
        browser,
        context,
        page,
        email: botEmail.trim(),
        createdAt: Date.now()
      };

      setTimeout(async () => {
        const current = globalForOtp.__activeOtpSessions?.[sessionKey];
        if (current && Date.now() - current.createdAt >= 295000) {
          await current.browser.close().catch(() => null);
          delete globalForOtp.__activeOtpSessions![sessionKey];
        }
      }, 300000);

      return NextResponse.json({
        success: true,
        otpStep: 'awaiting_code',
        message: statusNote,
        loginScreenPreview: previewDataUrl
      });
    }

    // ============================================================================
    // MODE 2: GENERATE STEP-BY-STEP TUTORIAL (VIDEO + CAROUSEL) FROM LOGGED-IN SCREENS
    // ============================================================================
    if (mode === 'generate_tutorial') {
      const assets: BrandAsset[] = Array.isArray(authenticatedAssets) ? authenticatedAssets : [];
      const goal = tutorialGoal.trim() || `Step-by-step inside tour: How to use ${brandName} like a pro`;

      const screenDescriptions = assets
        .map(
          (a, idx) =>
            `Screen #${idx + 1} [screenIndex=${idx}, tab="${a.label || a.name}", route="${a.routePath || '/app'}"]: Arrow Callout="${a.uiHighlight?.calloutText || `Click ${a.label}`}" | Highlighted Area="${a.uiHighlight?.importantArea?.label || ''}" | Visible UI="${a.uiSummary || 'Logged-in product workspace'}" | Coaching Script="${a.tutorialStepSuggestion || ''}"`
        )
        .join('\n');

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are an elite Interactive Product Coach & Viral Tutorial Director.
Create a Step-by-Step "How-To / Inside View" Tutorial for "${brandName}" (${brandTagline}) using the real logged-in screens captured by our AI Bot.

Tutorial Topic / Goal: "${goal}"

Available Logged-In Screens (with exact button callouts & highlighted UI areas):
${screenDescriptions || 'Screen #1: Main Logged-In Dashboard'}

CRITICAL COACHING SCRIPT RULES:
1. Every scene's "audio" voiceover MUST sound like a smart, hands-on interactive coach guiding the user on screen: explicitly tell them which button or tab to click and what happens in the highlighted area (for example: "Click Market in the navigation bar to see all the available players to buy and sell, with live share prices and 24-hour market moves" or "Next, click Portfolio to track every player share you own in real time").
2. Reference the real tabs, buttons, and features from the Available Logged-In Screens above.
3. Create 1 scene per available screen (up to ${Math.min(5, Math.max(3, assets.length))} scenes).
4. Never use emojis inside spoken "hook", "audio", or "cta" fields.

Return ONLY a valid raw JSON object (no markdown fences) matching this exact structure:
{
  "tutorialTitle": "Punchy tutorial title",
  "caption": "Engaging social caption introducing this step-by-step walkthrough",
  "videoScript": {
    "hook": "Spoken 3-second hook calling out the exact result viewers will learn (NO emojis)",
    "visualCue": "Camera zooms into the navigation button with animated pointer arrow and neon highlight box",
    "hookScreenIndex": 0,
    "scenes": [
      {
        "timestamp": "0:03 - 0:09",
        "screenIndex": 0,
        "stepBadge": "STEP 1: CLICK & EXPLORE",
        "calloutOverride": "Optional short 2-5 word arrow callout (e.g. Click 'Market' Tab)",
        "visual": "Camera zooms into the button with an arrow, then highlights the main interactive area",
        "audio": "Clear, action-driven spoken voiceover telling the viewer which button to click and what the highlighted area shows (NO emojis)"
      }
    ],
    "cta": "Spoken call to action to try it yourself (NO emojis)"
  },
  "carouselSlides": [
    {
      "title": "How to Master ${brandName} (Inside Look)",
      "subtitle": "STEP-BY-STEP WALKTHROUGH →",
      "body": "Swipe through to see the exact buttons to click inside the live app.",
      "highlightText": "Inside View"
    }
  ]
}`;

          const interaction = await ai.interactions.create({
            model: 'gemini-3.8-flash',
            input: prompt
          } as any);

          const rawText = (interaction as any)?.outputs
            ?.filter((o: any) => o.type === 'text')
            ?.map((o: any) => o.text)
            ?.join('') || '';

          if (rawText) {
            const parsed = JSON.parse(cleanJsonString(rawText));
            const pickAsset = (idx: number) =>
              assets[idx % Math.max(1, assets.length)] || assets[0];

            const hookAsset = pickAsset(parsed.videoScript?.hookScreenIndex || 0);
            const ctaAsset = pickAsset(assets.length - 1);

            const enrichedVideoScript = {
              hook: parsed.videoScript.hook,
              visualCue: parsed.videoScript.visualCue,
              hookBrollMediaUrl: hookAsset?.url,
              hookBrollMediaType: 'image' as const,
              hookBrollLabel: hookAsset?.label || 'Inside App: Step 1',
              hookUiHighlight: hookAsset?.uiHighlight,
              scenes: (parsed.videoScript.scenes || []).map((sc: any, i: number) => {
                const chosen = pickAsset(typeof sc.screenIndex === 'number' ? sc.screenIndex : i);
                const baseHighlight = chosen?.uiHighlight;
                const mergedHighlight = baseHighlight
                  ? {
                      ...baseHighlight,
                      calloutText: sc.calloutOverride || baseHighlight.calloutText
                    }
                  : undefined;

                return {
                  timestamp: sc.timestamp || `0:0${(i + 1) * 5}`,
                  visual: sc.visual,
                  audio: sc.audio,
                  brollMediaUrl: chosen?.url,
                  brollMediaType: 'image' as const,
                  brollLabel: sc.stepBadge || `STEP ${i + 1} • ${chosen?.label || 'Inside View'}`,
                  uiHighlight: mergedHighlight
                };
              }),
              cta: parsed.videoScript.cta,
              ctaBrollMediaUrl: ctaAsset?.url,
              ctaBrollMediaType: 'image' as const,
              ctaBrollLabel: ctaAsset?.label || `${brandName} Live Dashboard`,
              ctaUiHighlight: ctaAsset?.uiHighlight
            };

            return NextResponse.json({
              success: true,
              tutorial: {
                tutorialTitle: parsed.tutorialTitle || goal,
                caption: parsed.caption,
                videoScript: enrichedVideoScript,
                carouselSlides: parsed.carouselSlides || []
              }
            });
          }
        } catch (err) {
          console.warn('Gemini tutorial synthesis fallback triggered:', err);
        }
      }

      const stepsToUse = assets.length > 0 ? assets.slice(0, 5) : [];
      const s0 = stepsToUse[0];
      const sLast = stepsToUse[stepsToUse.length - 1] || s0;

      return NextResponse.json({
        success: true,
        tutorial: {
          tutorialTitle: `Inside ${brandName}: ${goal}`,
          caption: `Here is a real look inside ${brandName} showing the exact buttons to click and how to ${goal.toLowerCase()} step by step. 👇`,
          videoScript: {
            hook: `Want to see how ${brandName} actually works on the inside? Follow the arrow as I walk you through every button step by step.`,
            visualCue: `Live screen zoom and animated arrow on ${s0?.label || `${brandName} workspace`}`,
            hookBrollMediaUrl: s0?.url,
            hookBrollMediaType: 'image',
            hookBrollLabel: s0?.label || 'Step 1: Live Workspace',
            hookUiHighlight: s0?.uiHighlight,
            scenes: (stepsToUse.length > 0 ? stepsToUse : [undefined, undefined, undefined]).map((scAsset, idx) => ({
              timestamp: `0:0${3 + idx * 6} - 0:${String(9 + idx * 6).padStart(2, '0')}`,
              visual:
                scAsset?.uiSummary ||
                `Camera zooms into "${scAsset?.label || `Step ${idx + 1}`}" button with animated pointer arrow and highlights the main interactive panel.`,
              audio:
                scAsset?.tutorialStepSuggestion ||
                `Step ${idx + 1}: Click ${scAsset?.label || 'the navigation tab'} to open the highlighted workspace and manage your live positions.`,
              brollMediaUrl: scAsset?.url,
              brollMediaType: 'image' as const,
              brollLabel: `STEP ${idx + 1} • ${scAsset?.label || 'Action'}`,
              uiHighlight: scAsset?.uiHighlight
            })),
            cta: `Try this exact workflow yourself right now at ${brandName} dot com.`,
            ctaBrollMediaUrl: sLast?.url,
            ctaBrollMediaType: 'image',
            ctaBrollLabel: `${brandName} Authenticated View`,
            ctaUiHighlight: sLast?.uiHighlight
          },
          carouselSlides: [
            {
              title: `Inside ${brandName}: Step-by-Step`,
              subtitle: 'INTERACTIVE BUTTON TOUR →',
              body: goal,
              highlightText: 'Inside View'
            },
            ...(stepsToUse.length > 0 ? stepsToUse : []).map((scAsset, idx) => ({
              title: `Step ${idx + 1}: Click "${scAsset.label || 'Tab'}"`,
              subtitle: `0${idx + 1} / ${scAsset.uiHighlight?.calloutText || 'ACTION'}`,
              body:
                scAsset.tutorialStepSuggestion ||
                `Click ${scAsset.label} inside ${brandName} to access ${scAsset.uiHighlight?.importantArea?.label || 'this feature'}.`,
              highlightText: scAsset.label || `Step ${idx + 1}`
            }))
          ]
        }
      });
    }

    // ============================================================================
    // MODE 1B: DISCOVER NAVIGATION OR VERIFY OTP / FULL HEADLESS BOT CRAWLER
    // ============================================================================
    const baseSite = (websiteUrl || loginUrl || 'https://evidraw.com').replace(/\/$/, '');
    const targetLoginUrl = loginUrl.trim() || `${baseSite}/login`;
    const requestedTargets: string[] =
      Array.isArray(internalRoutes) && internalRoutes.length > 0
        ? internalRoutes
        : ['Home', 'Market', 'Portfolio', 'Scouting', 'Fantasy'];

    const capturedScreens: BrandAsset[] = [];
    let authStatus: 'authenticated' | 'partial' = 'partial';
    let loginLogMessage = '';
    let hasSavedSession = fs.existsSync(sessionFilePath);
    let discoveredNavTargets: string[] = [];

    const executablePath = findLocalBrowserExecutable();

    if (executablePath) {
      let browser: any = null;
      let context: any = null;
      let page: any = null;

      try {
        const pw = await import('playwright-core');

        // CASE A: User is verifying an email OTP code they just received
        if (mode === 'verify_email_otp') {
          const codeToEnter = (otpCode || staticOtpPin || '').trim();
          const activeOtpSession = globalForOtp.__activeOtpSessions?.[sessionKey];

          if (activeOtpSession && activeOtpSession.page) {
            browser = activeOtpSession.browser;
            context = activeOtpSession.context;
            page = activeOtpSession.page;
            delete globalForOtp.__activeOtpSessions![sessionKey];
          } else {
            browser = await pw.chromium.launch({
              executablePath,
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            context = await browser.newContext({
              viewport: targetViewportSize,
              deviceScaleFactor: 1.5,
              userAgent: targetUserAgent
            });
            page = await context.newPage();
            await page.goto(targetLoginUrl, { waitUntil: 'networkidle', timeout: 14000 }).catch(() => null);
          }

          // IMPORTANT: Never re-send a new email code during verify_email_otp! Only verify the code entered.
          const verifyOutcome = await verifyOtpOnPage(
            page,
            botEmail || activeOtpSession?.email || '',
            codeToEnter,
            baseSite
          );

          if (!verifyOutcome.verified) {
            await browser.close().catch(() => null);
            return NextResponse.json(
              {
                success: false,
                error: 'OTP_VERIFICATION_FAILED',
                message:
                  verifyOutcome.errorMsg ||
                  'Could not verify that code. Click "1. Send Login Code" once and enter the newest code from your email.'
              },
              { status: 400 }
            );
          }

          // Save persistent authenticated session (cookies + localStorage) to disk!
          await context.storageState({ path: sessionFilePath }).catch(() => null);
          hasSavedSession = fs.existsSync(sessionFilePath);
          authStatus = 'authenticated';
          loginLogMessage = `Verified email code (${codeToEnter}) and logged into ${brandName}! Persistent session saved.`;
        } else {
          // CASE B: Standard Crawl or Auto-Discover Navigation (using saved session, static OTP pin, password, or cookie)
          browser = await pw.chromium.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          });

          const contextOptions: any = {
            viewport: targetViewportSize,
            deviceScaleFactor: 1.5,
            userAgent: targetUserAgent
          };

          if (hasSavedSession) {
            contextOptions.storageState = sessionFilePath;
            authStatus = 'authenticated';
            loginLogMessage = `Loaded saved authenticated session for ${brandName}.`;
          }

          context = await browser.newContext(contextOptions);

          if (sessionCookie && sessionCookie.trim()) {
            try {
              const parsedBase = new URL(baseSite);
              const cookiePairs = sessionCookie.split(';').map((c: string) => c.trim()).filter(Boolean);
              const cookiesToSet = cookiePairs.map((pair: string) => {
                const eqIdx = pair.indexOf('=');
                if (eqIdx === -1) {
                  return {
                    name: 'session',
                    value: pair,
                    domain: parsedBase.hostname,
                    path: '/'
                  };
                }
                return {
                  name: pair.slice(0, eqIdx).trim(),
                  value: pair.slice(eqIdx + 1).trim(),
                  domain: parsedBase.hostname,
                  path: '/'
                };
              });
              if (cookiesToSet.length > 0) {
                await context.addCookies(cookiesToSet);
                await context.storageState({ path: sessionFilePath }).catch(() => null);
                hasSavedSession = fs.existsSync(sessionFilePath);
                authStatus = 'authenticated';
                loginLogMessage = 'Injected authenticated session cookies and saved session.';
              }
            } catch (cookieErr) {
              console.warn('Cookie injection warning:', cookieErr);
            }
          }

          page = await context.newPage();

          // Automated Email OTP + Static Bot Pin (when user configured a static pin for 1-click login)
          if (!hasSavedSession && authMethod === 'email_otp' && botEmail && staticOtpPin) {
            await page.goto(targetLoginUrl, { waitUntil: 'networkidle', timeout: 14000 }).catch(() => null);
            const emailEl = await page.$(
              '#login-email, form.email-login-form input[type="email"], input[type="email"]'
            );
            if (emailEl) {
              await emailEl.fill(botEmail.trim());
              await clickFormSubmitForInput(page, emailEl);
              await page
                .waitForSelector('#login-code, input[autocomplete="one-time-code"]', { timeout: 7000 })
                .catch(() => null);
              const outcome = await verifyOtpOnPage(page, botEmail, staticOtpPin, baseSite);
              if (outcome.verified) {
                await context.storageState({ path: sessionFilePath }).catch(() => null);
                hasSavedSession = fs.existsSync(sessionFilePath);
                authStatus = 'authenticated';
                loginLogMessage = `Logged in automatically via Static OTP Pin and saved session!`;
              }
            }
          } else if (!hasSavedSession && authMethod === 'password' && botEmail && botPassword) {
            await page.goto(targetLoginUrl, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => null);
            await page.waitForTimeout(1000);
            const emailEl = await page.$(
              'input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="email" i]'
            );
            const passEl = await page.$('input[type="password"], input[name*="pass" i]');
            if (emailEl && passEl) {
              await emailEl.fill(botEmail);
              await passEl.fill(botPassword);
              await clickFormSubmitForInput(page, passEl);
              await page.waitForNavigation({ timeout: 8000 }).catch(() => null);
              await page.waitForTimeout(2000);
              await context.storageState({ path: sessionFilePath }).catch(() => null);
              hasSavedSession = fs.existsSync(sessionFilePath);
              authStatus = 'authenticated';
              loginLogMessage = `AI Bot logged in via password as ${botEmail} and saved session.`;
            }
          }
        }

        // Always open the root home / app shell first so we never hit a 404 on Single-Page Apps (like Varbona)
        await page.goto(baseSite, { waitUntil: 'networkidle', timeout: 14000 }).catch(() => null);
        await page.waitForTimeout(1400);

        // 3. Smart Auto-Discovery: Scan the live DOM for both in-page SPA tabs/buttons AND valid URL links
        const navDiscovery = await discoverAppNavigation(page);
        discoveredNavTargets =
          navDiscovery.inPageTabs.length > 0
            ? navDiscovery.inPageTabs
            : navDiscovery.urlRoutes.length > 0
            ? navDiscovery.urlRoutes
            : navDiscovery.allSuggestedTargets;

        // If user clicked "🧭 Auto-Discover App Tabs & Screens", return the discovered list immediately
        if (mode === 'discover_navigation') {
          await browser.close().catch(() => null);
          return NextResponse.json({
            success: true,
            inPageTabs: navDiscovery.inPageTabs,
            urlRoutes: navDiscovery.urlRoutes,
            discoveredTargets: discoveredNavTargets,
            message:
              navDiscovery.inPageTabs.length > 0
                ? `Discovered ${navDiscovery.inPageTabs.length} interactive in-page tabs on ${brandName}: ${navDiscovery.inPageTabs.join(', ')}`
                : `Discovered ${discoveredNavTargets.length} internal routes on ${brandName}: ${discoveredNavTargets.join(', ')}`
          });
        }

        // Build the smart target list:
        // If this site is an SPA with in-page tabs (e.g. Home, Market, Portfolio, Scouting, Fantasy)
        // and the user still has the generic default routes (/dashboard, /portfolio, /learning-lab),
        // automatically map/replace missing routes with the real discovered in-page tabs!
        const isGenericDefaultList =
          requestedTargets.length === 3 &&
          requestedTargets.includes('/dashboard') &&
          requestedTargets.includes('/learning-lab');

        let effectiveTargets: string[] = [];
        if (isGenericDefaultList && navDiscovery.inPageTabs.length > 0) {
          effectiveTargets = navDiscovery.inPageTabs.slice(0, 5);
        } else {
          effectiveTargets = requestedTargets.slice(0, 5);
        }

        if (effectiveTargets.length === 0) {
          effectiveTargets = discoveredNavTargets.slice(0, 5);
        }

        const usedInPageTabs = new Set<string>();

        // 4. Visit each target (either by clicking the in-page tab button OR navigating to the URL route, with 404 self-healing!)
        for (let i = 0; i < effectiveTargets.length; i++) {
          const rawTarget = effectiveTargets[i];

          try {
            let finalDisplayLabel = rawTarget.replace(/^\//, '');
            let finalRouteBadge = rawTarget;
            let navigatedSuccessfully = false;
            let clickedButtonBox: { x: number; y: number; width: number; height: number } | undefined = undefined;

            // STEP A: Check if we're on baseSite (if not, go to baseSite first) and try clicking a matching in-page tab/button!
            if (!page.url().startsWith(baseSite) || page.url().includes('/login')) {
              await page.goto(baseSite, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
              await page.waitForTimeout(1000);
            }

            const tabClick = await tryClickInPageNavTab(page, rawTarget);
            if (tabClick.clicked && tabClick.matchedLabel) {
              navigatedSuccessfully = true;
              finalDisplayLabel = tabClick.matchedLabel;
              finalRouteBadge = `Tab: ${tabClick.matchedLabel}`;
              clickedButtonBox = tabClick.buttonBox;
              usedInPageTabs.add(normalizeNavLabel(tabClick.matchedLabel));
            }

            // STEP B: If no in-page button matched, try navigating to it as a URL path
            if (!navigatedSuccessfully) {
              const fullUrl = rawTarget.startsWith('http')
                ? rawTarget
                : `${baseSite}${rawTarget.startsWith('/') ? '' : '/'}${rawTarget}`;

              const resp = await page
                .goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 10000 })
                .catch(() => null);
              await page.waitForTimeout(1300);

              const hit404 = await isPage404Error(page, resp?.status());

              if (!hit404) {
                navigatedSuccessfully = true;
                finalDisplayLabel =
                  rawTarget === '/'
                    ? 'Main Workspace'
                    : rawTarget
                        .replace(/^\//, '')
                        .split(/[\/\-_]/)
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                finalRouteBadge = rawTarget.startsWith('/') ? rawTarget : `/${rawTarget}`;
              } else {
                // STEP C: 404 SELF-HEALING!
                await page.goto(baseSite, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
                await page.waitForTimeout(1000);

                const fallbackTab = navDiscovery.inPageTabs.find(
                  (t) => !usedInPageTabs.has(normalizeNavLabel(t))
                );

                if (fallbackTab) {
                  const fbClick = await tryClickInPageNavTab(page, fallbackTab);
                  if (fbClick.clicked) {
                    navigatedSuccessfully = true;
                    finalDisplayLabel = fbClick.matchedLabel || fallbackTab;
                    finalRouteBadge = `Tab: ${finalDisplayLabel}`;
                    clickedButtonBox = fbClick.buttonBox;
                    usedInPageTabs.add(normalizeNavLabel(finalDisplayLabel));
                  }
                } else if (i === 0) {
                  navigatedSuccessfully = true;
                  finalDisplayLabel = 'Home Workspace';
                  finalRouteBadge = '/';
                }
              }
            }

            if (!navigatedSuccessfully) continue;

            const finalUrl = page.url();
            const redirectedToLogin = finalUrl.includes('/login') && !rawTarget.toLowerCase().includes('login');

            // Extract deep UI intelligence: button coordinates, important area highlight box, and smart coaching voiceover
            const screenIntel = await extractScreenUIHighlightAndSmartScript(
              page,
              finalDisplayLabel,
              brandName,
              clickedButtonBox
            );

            const buffer = await page.screenshot({
              type: 'jpeg',
              quality: 80,
              fullPage: true
            });
            const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

            capturedScreens.push({
              id: `auth-screen-${Date.now()}-${i}`,
              name: redirectedToLogin
                ? `🔒 Login Gate (${finalDisplayLabel})`
                : `🔐 ${finalDisplayLabel} (${finalRouteBadge})`,
              type: 'screenshot',
              viewport: isDesktopViewport ? 'desktop' : 'mobile',
              url: dataUrl,
              width: targetViewportSize.width,
              height: screenIntel.pageHeightPx || 2400,
              label: redirectedToLogin ? `${finalDisplayLabel} (Sign-In Required)` : finalDisplayLabel,
              isAuthenticated: !redirectedToLogin,
              routePath: finalRouteBadge,
              uiSummary: screenIntel.uiSummary,
              tutorialStepSuggestion: screenIntel.smartVoiceover,
              uiHighlight: screenIntel.uiHighlight
            });
          } catch (routeErr) {
            console.warn(`Target capture skipped for ${rawTarget}:`, routeErr);
          }
        }

        await browser.close();
      } catch (pwErr) {
        console.warn('Playwright headless crawl error:', pwErr);
        if (browser) {
          try {
            await browser.close();
          } catch {}
        }
      }
    }

    // 5. Enrich captured screens with Gemini 3.8 Flash Vision UI Analysis
    let aiDiscoveredTopics: string[] = [];
    if (apiKey && capturedScreens.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const firstScreen = capturedScreens[0];
        const cleanB64 = firstScreen.url.replace(/^data:image\/[^;]+;base64,/, '');

        const visionPrompt = `You are inspecting internal screens of "${brandName}" (${brandTagline}) captured by our authenticated AI Bot.
Screens captured: ${capturedScreens.map((s) => `${s.label} [${s.routePath}] (${s.uiSummary})`).join(' | ')}

Analyze the attached screenshot and screen metadata, then return ONLY a raw JSON object (no markdown fences) with:
{
  "screens": [
    {
      "label": "Short feature title for Screen 1",
      "uiSummary": "1 sentence describing the exact UI elements, charts, or controls visible",
      "tutorialStepSuggestion": "1 natural spoken sentence for a 'How-To' video voiceover explaining this screen"
    }
  ],
  "tutorialTopics": [
    "3 specific 'How-To' or 'Inside View' video tutorial ideas based on these internal screens"
  ]
}`;

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: [
            {
              type: 'image',
              data: cleanB64,
              mime_type: 'image/jpeg'
            },
            {
              type: 'text',
              text: visionPrompt
            }
          ]
        } as any);

        const rawText = (interaction as any)?.outputs
          ?.filter((o: any) => o.type === 'text')
          ?.map((o: any) => o.text)
          ?.join('') || '';

        if (rawText) {
          const parsed = JSON.parse(cleanJsonString(rawText));
          if (Array.isArray(parsed.screens)) {
            parsed.screens.forEach((s: any, idx: number) => {
              if (capturedScreens[idx]) {
                if (s.label) capturedScreens[idx].label = s.label;
                if (s.uiSummary) capturedScreens[idx].uiSummary = s.uiSummary;
                if (s.tutorialStepSuggestion) {
                  capturedScreens[idx].tutorialStepSuggestion = s.tutorialStepSuggestion;
                }
              }
            });
          }
          if (Array.isArray(parsed.tutorialTopics)) {
            aiDiscoveredTopics = parsed.tutorialTopics;
          }
        }
      } catch (vErr) {
        console.warn('Gemini Vision screen enrichment skipped:', vErr);
      }
    }

    return NextResponse.json({
      success: true,
      crawlStatus: authStatus,
      hasSavedSession,
      discoveredNavTargets,
      loginLogMessage:
        loginLogMessage ||
        `Captured ${capturedScreens.length} internal product views from ${baseSite}.`,
      capturedAssets: capturedScreens,
      discoveredTutorialTopics:
        aiDiscoveredTopics.length > 0
          ? aiDiscoveredTopics
          : [
              `Inside ${brandName}: Step-by-step walkthrough of ${capturedScreens[0]?.label || 'the main dashboard'}`,
              `How to set up your first workflow inside ${brandName} in under 60 seconds`,
              `3 hidden features inside ${brandName} that save you hours every week`
            ]
    });
  } catch (error: any) {
    console.error('Authenticated Crawl API Error:', error);
    return NextResponse.json(
      { error: 'CRAWL_FAILED', message: error.message || 'Failed to crawl authenticated routes.' },
      { status: 500 }
    );
  }
}
