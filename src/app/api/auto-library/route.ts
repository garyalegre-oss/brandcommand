import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { BrandAsset, PostFormat, SocialChannel } from '../../../types/brand';

function cleanJsonString(str: string): string {
  return str
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandId = 'brand-default',
      brandName = 'Brand',
      brandTagline = '',
      brandVoice = '',
      brandCategory = '',
      brandWebsiteUrl = '',
      brandHashtags = [],
      suggestedTopics = [],
      defaultChannels = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin'],
      brandAssets = [],
      websiteScreenshotUrl = '',
      count = 4,
      pillarFilter = 'all',
      apiKey: clientApiKey = ''
    } = body;

    const cleanUrl =
      brandWebsiteUrl || `https://${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const cleanTags: string[] =
      Array.isArray(brandHashtags) && brandHashtags.length > 0
        ? brandHashtags.map((t: string) => t.replace(/^#/, ''))
        : [brandName.replace(/\s+/g, ''), 'Growth', 'InsideLook'];
    const tagStr = cleanTags.map((t) => `#${t}`).join(' ');
    const defaultKeyword =
      brandName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'ACCESS';

    const assets: BrandAsset[] = Array.isArray(brandAssets) ? brandAssets : [];
    const primaryAsset = assets[0];
    const secondaryAsset = assets[1] || assets[0];
    const fallbackPreviewUrl =
      primaryAsset?.url ||
      websiteScreenshotUrl ||
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80';

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const assetSummary = assets
          .slice(0, 5)
          .map(
            (a, i) =>
              `Screen #${i + 1}: "${a.label || a.name}" (${a.routePath || '/app'}) — ${a.uiSummary || ''} | Coaching: "${a.tutorialStepSuggestion || ''}"`
          )
          .join('\n');

        const prompt = `You are an Autonomous AI Content Engine for "${brandName}" (${brandTagline}).
Generate ${count} fresh, high-converting, ready-to-publish social media content items for ${brandName}'s Content Library.

Brand Profile:
- Name: ${brandName}
- Tagline: ${brandTagline}
- Category: ${brandCategory}
- Voice Persona: ${brandVoice}
- Website: ${cleanUrl}
- Suggested Topics: ${(suggestedTopics || []).join(' | ')}
- Captured App Screens:
${assetSummary || 'Main Live Product Workspace'}
${pillarFilter !== 'all' ? `- Focus Content Pillar: ${pillarFilter}` : ''}

Create a diverse mix of formats across the ${count} items:
1. "video_script": A narrated 16:9 YouTube & 9:16 Reels tutorial/inside-look video script that references real tabs/screens of ${brandName}.
2. "carousel": A 4-to-5 slide educational or product walkthrough carousel.
3. "thread": A 4-tweet viral X / LinkedIn authority thread.
4. "single": A high-converting visual single post / ad hook with a DM trigger keyword.

Return ONLY a valid raw JSON object (no markdown fences) matching this exact schema:
{
  "items": [
    {
      "title": "Punchy internal library title",
      "contentPillar": "Inside-App Tutorial | Feature Spotlight | Growth Authority | Educational Carousel | Viral Hook",
      "format": "video_script",
      "content": "Full social caption ready to publish, ending with a clear CTA and ${tagStr}",
      "channels": ["youtube", "instagram", "tiktok"],
      "firstCommentPlug": "Direct link comment reply with ${cleanUrl}",
      "dmTriggerKeyword": "${defaultKeyword}",
      "dmAutoReplyScript": "Automated DM reply sending ${cleanUrl}",
      "videoScript": {
        "hook": "Spoken 3-second hook (NO emojis)",
        "visualCue": "Camera zooms into ${brandName} workspace with animated pointer arrow",
        "scenes": [
          {
            "timestamp": "0:03 - 0:09",
            "visual": "Camera scrolls and zooms into the first key feature section",
            "audio": "Clear spoken coaching voiceover explaining what button to click and what happens (NO emojis)"
          },
          {
            "timestamp": "0:09 - 0:16",
            "visual": "Camera scrolls down to the live analytics and action cards",
            "audio": "Spoken voiceover explaining the second step (NO emojis)"
          },
          {
            "timestamp": "0:16 - 0:23",
            "visual": "Full widescreen and mobile payoff view",
            "audio": "Spoken voiceover showing the final result (NO emojis)"
          }
        ],
        "cta": "Spoken call to action to try ${brandName} at ${cleanUrl} (NO emojis)"
      },
      "carouselSlides": [
        { "title": "Slide 1 Headline", "subtitle": "STEP 1 →", "body": "Slide 1 body", "highlightText": "${brandName}" }
      ],
      "threadTweets": [
        "1/4 Hook tweet...",
        "2/4 Insight tweet...",
        "3/4 How ${brandName} works...",
        "4/4 CTA tweet with ${cleanUrl}"
      ]
    }
  ]
}`;

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: prompt
        } as any);

        const rawText =
          (interaction as any)?.outputs
            ?.filter((o: any) => o.type === 'text')
            ?.map((o: any) => o.text)
            ?.join('') || '';

        if (rawText) {
          const parsed = JSON.parse(cleanJsonString(rawText));
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            const generatedPosts = parsed.items.map((item: any, idx: number) => {
              const chosenAsset = assets[idx % Math.max(1, assets.length)] || primaryAsset;
              const format: PostFormat = [
                'video_script',
                'carousel',
                'thread',
                'single',
                'newsletter'
              ].includes(item.format)
                ? item.format
                : idx % 2 === 0
                ? 'video_script'
                : 'carousel';

              let enrichedVideoScript = item.videoScript;
              if (format === 'video_script' && enrichedVideoScript) {
                enrichedVideoScript = {
                  ...enrichedVideoScript,
                  hookBrollMediaUrl: chosenAsset?.url || fallbackPreviewUrl,
                  hookBrollMediaType: 'image',
                  hookBrollLabel: chosenAsset?.label || `${brandName} Workspace`,
                  hookUiHighlight: chosenAsset?.uiHighlight,
                  scenes: (enrichedVideoScript.scenes || []).map((sc: any, sIdx: number) => {
                    const scAsset = assets[sIdx % Math.max(1, assets.length)] || chosenAsset;
                    return {
                      ...sc,
                      brollMediaUrl: scAsset?.url || fallbackPreviewUrl,
                      brollMediaType: 'image',
                      brollLabel: scAsset?.label || `Step ${sIdx + 1}`,
                      uiHighlight: scAsset?.uiHighlight
                    };
                  }),
                  ctaBrollMediaUrl: secondaryAsset?.url || fallbackPreviewUrl,
                  ctaBrollMediaType: 'image',
                  ctaBrollLabel: secondaryAsset?.label || `${brandName} Live View`,
                  ctaUiHighlight: secondaryAsset?.uiHighlight
                };
              }

              return {
                brandId,
                title: item.title || `${brandName} Auto-Generated ${format.toUpperCase()} #${idx + 1}`,
                content: item.content || `${brandTagline}\n\nExplore live at ${cleanUrl} ${tagStr}`,
                format,
                status: 'draft' as const,
                approvalStatus: 'pending_approval' as const,
                isAutoGenerated: true,
                contentPillar: item.contentPillar || 'Inside-App Spotlight',
                mediaPreviewUrl: chosenAsset?.url || fallbackPreviewUrl,
                scheduledFor: new Date(Date.now() + (idx + 1) * 6 * 3600 * 1000).toISOString(),
                channels: (Array.isArray(item.channels) && item.channels.length > 0
                  ? item.channels
                  : defaultChannels) as SocialChannel[],
                videoScript: format === 'video_script' ? enrichedVideoScript : undefined,
                carouselSlides:
                  format === 'carousel' && Array.isArray(item.carouselSlides)
                    ? item.carouselSlides
                    : undefined,
                threadTweets:
                  format === 'thread' && Array.isArray(item.threadTweets)
                    ? item.threadTweets
                    : undefined,
                firstCommentPlug: item.firstCommentPlug || `⚡ Try ${brandName} live 👉 ${cleanUrl}`,
                dmTriggerKeyword: item.dmTriggerKeyword || defaultKeyword,
                dmAutoReplyScript:
                  item.dmAutoReplyScript ||
                  `Hey! Here is your direct access link to ${brandName}: ${cleanUrl}`,
                tags: cleanTags
              };
            });

            return NextResponse.json({
              success: true,
              posts: generatedPosts
            });
          }
        }
      } catch (err) {
        console.warn('Gemini Auto-Library generation fallback triggered:', err);
      }
    }

    // Smart deterministic fallback using the brand's real captured screens, topics, and voice
    const topic0 =
      suggestedTopics[0] || `How to use ${brandName} step-by-step to get an unfair edge`;
    const topic1 =
      suggestedTopics[1] || `Inside ${brandName}: 3 features most users miss on Day 1`;
    const topic2 =
      suggestedTopics[2] || `Why we built ${brandName} (${brandTagline})`;

    const s0 = assets[0];
    const s1 = assets[1] || s0;
    const s2 = assets[2] || s1 || s0;

    const fallbackPosts = [
      {
        brandId,
        title: `[16:9 YouTube & 9:16 Video] Inside ${brandName}: ${s0?.label || 'Full Walkthrough'}`,
        content: `Want to see how ${brandName} actually works on the inside? Here is a full walkthrough of ${s0?.label || 'our live workspace'} and ${s1?.label || 'interactive controls'}.\n\n💬 Comment "${defaultKeyword}" for direct access!\n\n${tagStr}`,
        format: 'video_script' as PostFormat,
        status: 'draft' as const,
        approvalStatus: 'pending_approval' as const,
        isAutoGenerated: true,
        contentPillar: 'Inside-App Video Tutorial',
        mediaPreviewUrl: s0?.url || fallbackPreviewUrl,
        scheduledFor: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        channels: ['youtube', 'instagram', 'tiktok'] as SocialChannel[],
        videoScript: {
          hook: `Want to see how ${brandName} works on the inside? Follow the arrow as we walk through every tab step by step.`,
          visualCue: `Camera zooms into ${s0?.label || brandName} with animated arrow and scrolls down the full page`,
          hookBrollMediaUrl: s0?.url || fallbackPreviewUrl,
          hookBrollMediaType: 'image' as const,
          hookBrollLabel: s0?.label || `${brandName} Overview`,
          hookUiHighlight: s0?.uiHighlight,
          scenes: [
            {
              timestamp: '0:03 - 0:09',
              visual: `Camera highlights "${s0?.label || 'Main Tab'}" and scrolls down through the key metrics.`,
              audio:
                s0?.tutorialStepSuggestion ||
                `First, click ${s0?.label || 'the main dashboard tab'} to see your live overview and top opportunities.`,
              brollMediaUrl: s0?.url || fallbackPreviewUrl,
              brollMediaType: 'image' as const,
              brollLabel: `STEP 1 • ${s0?.label || 'Overview'}`,
              uiHighlight: s0?.uiHighlight
            },
            {
              timestamp: '0:09 - 0:16',
              visual: `Camera switches to "${s1?.label || 'Action View'}" and zooms into the interactive controls.`,
              audio:
                s1?.tutorialStepSuggestion ||
                `Next, open ${s1?.label || 'the market view'} and scroll down to compare live stats before making your move.`,
              brollMediaUrl: s1?.url || fallbackPreviewUrl,
              brollMediaType: 'image' as const,
              brollLabel: `STEP 2 • ${s1?.label || 'Interactive Controls'}`,
              uiHighlight: s1?.uiHighlight
            },
            {
              timestamp: '0:16 - 0:23',
              visual: `Camera scrolls through "${s2?.label || 'Portfolio View'}" showing real-time performance.`,
              audio:
                s2?.tutorialStepSuggestion ||
                `Finally, check ${s2?.label || 'your live tracker'} to monitor your performance in real time.`,
              brollMediaUrl: s2?.url || fallbackPreviewUrl,
              brollMediaType: 'image' as const,
              brollLabel: `STEP 3 • ${s2?.label || 'Results'}`,
              uiHighlight: s2?.uiHighlight
            }
          ],
          cta: `Try this workflow yourself right now at ${brandName} dot com.`,
          ctaBrollMediaUrl: s2?.url || fallbackPreviewUrl,
          ctaBrollMediaType: 'image' as const,
          ctaBrollLabel: `${brandName} Live App`,
          ctaUiHighlight: s2?.uiHighlight
        },
        firstCommentPlug: `⚡ Start using ${brandName} right here 👉 ${cleanUrl}`,
        dmTriggerKeyword: defaultKeyword,
        dmAutoReplyScript: `Hey! 👋 Here is your direct link to ${brandName}: ${cleanUrl}`,
        tags: cleanTags
      },
      {
        brandId,
        title: `[🤳 UGC Creator Story Reel] Why I Switched to ${brandName}`,
        content: `Why manual notes and guesswork don't hold up when it actually matters — here is how I use ${brandName} to lock in a verifiable workflow before every session.\n\n💬 Comment "${defaultKeyword}" for the link!\n\n${tagStr}`,
        format: 'video_script' as PostFormat,
        status: 'draft' as const,
        approvalStatus: 'pending_approval' as const,
        isAutoGenerated: true,
        contentPillar: 'UGC Creator Story Reel',
        mediaPreviewUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=85',
        scheduledFor: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
        channels: ['tiktok', 'instagram', 'youtube'] as SocialChannel[],
        videoScript: {
          hook: `Most people rely on memory or messy notes until they realize their brain quietly rewrites history.`,
          visualCue: `Creator holding smartphone in apartment selfie POV with centered white-with-black-stroke story paragraph overlay`,
          ugcStoryText: brandName.toLowerCase().includes('evidraw')
            ? `paper notes aren't evidence\nif you can edit the picks\nafter Lotto Max or 6/49 hits,\nyour brain will quietly rewrite\nhistory\nI started using Evidraw to lock\nmultiple portfolios with\ntimestamps\nbefore every draw\nthen I leave the record alone\nand let the results judge it`
            : `manual notes aren't a system\nif you're piecing together\nfive different tabs by hand,\nyour brain will quietly excuse\nall the missed opportunities\nI started using ${brandName}\nto lock my workflow in\none verified workspace\nbefore every session\nthen I step back and let\nthe live results judge it`,
          ugcCreatorId: 'ugc_yellow_apartment',
          aiDirector: {
            layout: 'ugc_creator' as const,
            backgroundId: 'none',
            stickerId: 'none',
            filter: 'none' as const,
            subtitleStyle: 'hormozi' as const,
            soundwaveStyle: 'off' as const,
            directorNotes: 'UGC Creator Selfie Hook + Centered Story Text Overlay'
          },
          hookBrollMediaUrl: s0?.url || fallbackPreviewUrl,
          hookBrollMediaType: 'image' as const,
          hookBrollLabel: `${brandName} UGC Story`,
          hookUiHighlight: s0?.uiHighlight,
          scenes: [
            {
              timestamp: '0:03 - 0:10',
              visual: `Creator holding phone in casual selfie POV with full story text overlay, then cutting to ${s0?.label || brandName}.`,
              audio: `I started using ${brandName} to lock everything in with verifiable clarity before the action starts, and let the results speak for themselves.`,
              brollMediaUrl: s0?.url || fallbackPreviewUrl,
              brollMediaType: 'image' as const,
              brollLabel: `STEP 1 • ${s0?.label || 'Live App'}`,
              uiHighlight: s0?.uiHighlight
            }
          ],
          cta: `Try ${brandName} yourself right now at ${brandName} dot com.`,
          ctaBrollMediaUrl: s1?.url || fallbackPreviewUrl,
          ctaBrollMediaType: 'image' as const,
          ctaBrollLabel: `${brandName} Live View`,
          ctaUiHighlight: s1?.uiHighlight
        },
        firstCommentPlug: `⚡ Lock in your workflow with ${brandName} 👉 ${cleanUrl}`,
        dmTriggerKeyword: defaultKeyword,
        dmAutoReplyScript: `Hey! Here is your direct link to ${brandName}: ${cleanUrl}`,
        tags: cleanTags
      },
      {
        brandId,
        title: `[5-Slide Carousel] ${topic0}`,
        content: `${topic0} — Swipe through to see the exact 4-step system inside ${brandName} 👉\n\nSave this post for your next session! ${tagStr}`,
        format: 'carousel' as PostFormat,
        status: 'draft' as const,
        approvalStatus: 'pending_approval' as const,
        isAutoGenerated: true,
        contentPillar: 'Educational Carousel',
        mediaPreviewUrl: s1?.url || fallbackPreviewUrl,
        scheduledFor: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        channels: ['instagram', 'linkedin'] as SocialChannel[],
        carouselSlides: [
          {
            title: topic0,
            subtitle: 'SWIPE FOR THE PLAYBOOK →',
            body: `Most people rely on guesswork. Here is how ${brandName} turns data into clear action.`,
            highlightText: brandName
          },
          {
            title: `Step 1: Open ${s0?.label || 'Your Workspace'}`,
            subtitle: '01 / THE FOUNDATION',
            body:
              s0?.tutorialStepSuggestion ||
              `Start inside ${brandName}'s main view to spot high-conviction opportunities in seconds.`,
            highlightText: s0?.label || 'Step 1'
          },
          {
            title: `Step 2: Filter in ${s1?.label || 'Live Market'}`,
            subtitle: '02 / SMART EXECUTION',
            body:
              s1?.tutorialStepSuggestion ||
              `Use real-time filters and live telemetry instead of emotional hunches.`,
            highlightText: s1?.label || 'Step 2'
          },
          {
            title: `Step 3: Track & Optimize`,
            subtitle: '03 / COMPOUND RESULTS',
            body: `Try it live today at ${cleanUrl} or comment "${defaultKeyword}" below!`,
            highlightText: 'Try It Live'
          }
        ],
        firstCommentPlug: `Full playbook + live access at ${cleanUrl}`,
        dmTriggerKeyword: defaultKeyword,
        dmAutoReplyScript: `Here is your direct access to ${brandName}: ${cleanUrl}`,
        tags: cleanTags
      },
      {
        brandId,
        title: `[X / LinkedIn Thread] ${topic1}`,
        content: `1/4 ${topic1} 🧵👇\n\n2/4 Most platforms overwhelm you with noise instead of actionable signal. ${brandName} was engineered to fix that.\n\n3/4 Inside ${s0?.label || 'the dashboard'}, you can move from discovery to execution in under 60 seconds.\n\n4/4 Try ${brandName} live at ${cleanUrl} ${tagStr}`,
        format: 'thread' as PostFormat,
        status: 'draft' as const,
        approvalStatus: 'pending_approval' as const,
        isAutoGenerated: true,
        contentPillar: 'Growth Authority Thread',
        mediaPreviewUrl: s2?.url || fallbackPreviewUrl,
        scheduledFor: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        channels: ['twitter', 'linkedin'] as SocialChannel[],
        threadTweets: [
          `1/4 ${topic1} 🧵👇`,
          `2/4 Most platforms overwhelm you with noise instead of actionable signal. ${brandName} (${brandTagline}) was engineered to fix that.`,
          `3/4 Inside ${s0?.label || 'our workspace'} and ${s1?.label || 'live analytics'}, you can go from research to action in under 60 seconds.`,
          `4/4 Reply "${defaultKeyword}" and I'll send you direct access, or explore live at ${cleanUrl} ${tagStr}`
        ],
        firstCommentPlug: `Explore ${brandName} here: ${cleanUrl}`,
        dmTriggerKeyword: defaultKeyword,
        dmAutoReplyScript: `Thanks for replying! Here is your link to ${brandName}: ${cleanUrl}`,
        tags: cleanTags
      },
      {
        brandId,
        title: `[Feature Spotlight] ${topic2}`,
        content: `${brandTagline} 🚀\n\nWhether you're exploring ${s0?.label || 'our core workspace'} or managing ${s1?.label || 'your live positions'}, ${brandName} gives you institutional-grade clarity in one place.\n\n👉 Tap the link in bio or visit ${cleanUrl}\n\n${tagStr}`,
        format: 'single' as PostFormat,
        status: 'draft' as const,
        approvalStatus: 'pending_approval' as const,
        isAutoGenerated: true,
        contentPillar: 'Feature Spotlight',
        mediaPreviewUrl: s0?.url || fallbackPreviewUrl,
        scheduledFor: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        channels: ['instagram', 'twitter', 'linkedin', 'facebook'] as SocialChannel[],
        firstCommentPlug: `⚡ Direct access to ${brandName}: ${cleanUrl}`,
        dmTriggerKeyword: defaultKeyword,
        dmAutoReplyScript: `Here is your direct link to ${brandName}: ${cleanUrl}`,
        tags: cleanTags
      }
    ];

    return NextResponse.json({
      success: true,
      posts: fallbackPosts.slice(0, count)
    });
  } catch (error: any) {
    console.error('Auto-Library Generator Error:', error);
    return NextResponse.json(
      { error: 'AUTO_LIBRARY_FAILED', message: error.message || 'Failed to generate library items.' },
      { status: 500 }
    );
  }
}
