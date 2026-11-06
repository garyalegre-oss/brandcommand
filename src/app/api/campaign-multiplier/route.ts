import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idea = '',
      brandName = 'Brand',
      brandTagline = '',
      brandVoice = '',
      brandCategory = '',
      brandWebsiteUrl = '',
      brandHashtags = []
    } = body;

    const cleanIdea = idea.trim() || brandTagline || `How ${brandName} transforms your workflow`;
    const cleanUrl = brandWebsiteUrl || `https://${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const tagStr = Array.isArray(brandHashtags) && brandHashtags.length > 0
      ? brandHashtags.slice(0, 4).join(' ')
      : `#${brandName.replace(/\s+/g, '')}`;
    const defaultKeyword = brandName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'ACCESS';

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const multiplierPrompt = `You are an elite Omnichannel Growth Architect.
Turn this single campaign seed idea into a coordinated 5-Day Omnichannel Campaign for "${brandName}":
Campaign Seed Idea: "${cleanIdea}"

Brand Profile:
- Name: ${brandName}
- Tagline: ${brandTagline}
- Category: ${brandCategory}
- Voice Persona: ${brandVoice}
- Website: ${cleanUrl}
- Hashtags: ${tagStr}

Return a valid JSON object matching this exact structure:
{
  "campaignName": "Short punchy campaign title",
  "strategySummary": "1-2 sentences explaining how these 5 assets work together across the week",
  "dmTriggerKeyword": "${defaultKeyword}",
  "dmAutoReplyScript": "Automated DM reply script sent when a follower comments '${defaultKeyword}', linking to ${cleanUrl}",
  "firstCommentPlug": "Auto-plug first comment reply containing ${cleanUrl} to avoid algorithm link suppression",
  "day1VideoReel": {
    "title": "Day 1: Viral 9:16 Vertical Reel / TikTok",
    "caption": "Short caption ending with: Comment '${defaultKeyword}' for the link! ${tagStr}",
    "hook": "Spoken 3-second hook (NO emojis)",
    "visualCue": "Specific photographic camera description for the opening scene",
    "scenes": [
      {
        "timestamp": "0:03 - 0:08",
        "visual": "Specific concrete visual scene description",
        "audio": "Spoken voiceover line (NO emojis)"
      },
      {
        "timestamp": "0:08 - 0:15",
        "visual": "Specific concrete visual scene description showing ${brandName} in action",
        "audio": "Spoken voiceover line (NO emojis)"
      },
      {
        "timestamp": "0:15 - 0:22",
        "visual": "Specific concrete visual payoff scene description",
        "audio": "Spoken voiceover line (NO emojis)"
      }
    ],
    "cta": "Spoken call to action (NO emojis)"
  },
  "day2Carousel": {
    "title": "Day 2: 5-Slide Educational Carousel (IG / LinkedIn)",
    "caption": "Deep-dive caption with ${tagStr}",
    "slides": [
      { "title": "Slide 1 Hook Headline", "subtitle": "SWIPE →", "body": "1-2 sentence hook", "highlightText": "${brandName}" },
      { "title": "Slide 2 The Old Problem", "subtitle": "THE BOTTLENECK", "body": "1-2 sentence breakdown", "highlightText": "Mistake #1" },
      { "title": "Slide 3 The Shift", "subtitle": "THE FRAMEWORK", "body": "1-2 sentence insight", "highlightText": "Data > Hype" },
      { "title": "Slide 4 How ${brandName} Solves It", "subtitle": "THE SOLUTION", "body": "1-2 sentence proof", "highlightText": "10x Clarity" },
      { "title": "Slide 5 Action Step", "subtitle": "START NOW", "body": "Comment '${defaultKeyword}' or visit ${cleanUrl}", "highlightText": "Link in Bio" }
    ]
  },
  "day3AdCreative": {
    "title": "Day 3: High-Converting Ad Graphic (IG / X / Meta)",
    "badgeText": "2-4 word uppercase badge",
    "headline": "4-8 word ad headline (NO emojis)",
    "subheadline": "1-2 sentence value proposition",
    "ctaText": "2-4 word button CTA",
    "caption": "Ad post caption with ${tagStr}",
    "visualPrompt": "Detailed commercial photography prompt for Nano Banana 2.1 background (no text)"
  },
  "day4Thread": {
    "title": "Day 4: Viral X Thread & LinkedIn Authority Post",
    "tweets": [
      "1/5 Hook tweet about ${cleanIdea} (no external links in tweet 1) 🧵👇",
      "2/5 The core problem most people overlook...",
      "3/5 The exact mental model / framework behind ${brandName}...",
      "4/5 Real-world takeaway you can apply today...",
      "5/5 Reply '${defaultKeyword}' and I'll DM you direct access, or check the first reply below! ${tagStr}"
    ]
  },
  "day5Newsletter": {
    "title": "Day 5: VIP Audience Email / Newsletter Blast",
    "subjectLine": "High-open-rate email subject line",
    "previewText": "1-sentence email preview text",
    "headline": "Newsletter header title",
    "intro": "2-3 sentence engaging email introduction",
    "keyTakeaways": [
      { "title": "Takeaway 1", "description": "1-2 sentence explanation" },
      { "title": "Takeaway 2", "description": "1-2 sentence explanation" },
      { "title": "Takeaway 3", "description": "1-2 sentence explanation" }
    ],
    "ctaText": "Explore ${brandName} Now →",
    "ctaUrl": "${cleanUrl}"
  }
}`;

        const interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: multiplierPrompt
        } as any);

        const rawText = (interaction as any)?.outputs
          ?.filter((o: any) => o.type === 'text')
          ?.map((o: any) => o.text)
          ?.join('') || '';

        if (rawText) {
          const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return NextResponse.json({
            success: true,
            campaign: parsed
          });
        }
      } catch (err) {
        console.warn('Gemini 3.8 Flash Campaign Multiplier fallback triggered:', err);
      }
    }

    // Deterministic Fallback Campaign
    const fallbackCampaign = {
      campaignName: `${brandName}: ${cleanIdea.slice(0, 42)}`,
      strategySummary: `A 5-day omnichannel sequence that hooks cold audiences with a 9:16 vertical video on Day 1, educates via a 5-slide carousel on Day 2, retargets with a high-contrast ad on Day 3, builds authority on X on Day 4, and converts warm leads via email on Day 5.`,
      dmTriggerKeyword: defaultKeyword,
      dmAutoReplyScript: `Hey! 👋 Thanks for commenting "${defaultKeyword}". Here is your direct link to ${brandName}: ${cleanUrl}`,
      firstCommentPlug: `⚡ Full access to ${brandName} right here 👉 ${cleanUrl}`,
      day1VideoReel: {
        title: `Day 1: ${brandName} 9:16 Vertical Reel — ${cleanIdea.slice(0, 35)}`,
        caption: `${cleanIdea}\n\n💬 Comment "${defaultKeyword}" and we'll DM you the direct link!\n\n${tagStr}`,
        hook: `Stop relying on guesswork when it comes to ${cleanIdea.toLowerCase()}.`,
        visualCue: `Split screen contrasting messy old manual workflow on the left with sleek, glowing ${brandName} interface on the right.`,
        scenes: [
          {
            timestamp: '0:03 - 0:08',
            visual: `Close-up shot of a frustrated user dealing with scattered notes and guesswork.`,
            audio: `Most people waste time and money because they have zero structured system.`
          },
          {
            timestamp: '0:08 - 0:15',
            visual: `Dynamic macro pan across the ${brandName} dashboard showing crisp data analytics and clean organization.`,
            audio: `With ${brandName}, ${brandTagline.toLowerCase()} in seconds.`
          },
          {
            timestamp: '0:15 - 0:22',
            visual: `Confident user reviewing verified results on a sleek smartphone screen.`,
            audio: `Everything is tracked transparently so you always know where you stand.`
          }
        ],
        cta: `Comment ${defaultKeyword} below or visit ${brandName} dot com to start today.`
      },
      day2Carousel: {
        title: `Day 2: 5-Slide Carousel — ${cleanIdea.slice(0, 35)}`,
        caption: `Swipe through to see how ${brandName} changes the game around ${cleanIdea.toLowerCase()}. 👉\n\n💬 Comment "${defaultKeyword}" for instant access!\n\n${tagStr}`,
        slides: [
          { title: cleanIdea, subtitle: 'SWIPE FOR THE BREAKDOWN →', body: brandTagline, highlightText: brandName },
          { title: 'The Old Way Is Broken', subtitle: '01 / THE BOTTLENECK', body: 'Relying on random guesswork and scattered tools leads to blind spots and wasted effort.', highlightText: 'Zero Visibility' },
          { title: 'The Evidence-First Shift', subtitle: '02 / THE SYSTEM', body: `When you organize your strategy inside ${brandName}, every decision is backed by clean structure.`, highlightText: 'Data > Hype' },
          { title: `Why Builders Choose ${brandName}`, subtitle: '03 / THE ADVANTAGE', body: `${brandTagline} — built for speed, clarity, and discipline.`, highlightText: '100% Transparent' },
          { title: `Try ${brandName} Today`, subtitle: '04 / NEXT STEP', body: `Comment "${defaultKeyword}" below and we'll send the link straight to your DMs!`, highlightText: cleanUrl }
        ]
      },
      day3AdCreative: {
        title: `Day 3: High-Converting Ad Graphic — ${brandName}`,
        badgeText: `${brandName.toUpperCase()} SPOTLIGHT`,
        headline: cleanIdea.length <= 58 ? cleanIdea : `Upgrade Your Workflow With ${brandName}`,
        subheadline: brandTagline,
        ctaText: `Try ${brandName} Now →`,
        caption: `${cleanIdea}\n\n✅ ${brandTagline}\n💬 Comment "${defaultKeyword}" for the direct link!\n\n${tagStr}`,
        visualPrompt: `Luxury commercial product photography for ${brandName} (${cleanIdea}), dramatic studio rim lighting, sleek dark glass aesthetic, 8k resolution, no text.`
      },
      day4Thread: {
        title: `Day 4: X Thread — ${cleanIdea.slice(0, 35)}`,
        tweets: [
          `1/5 ${cleanIdea}\n\nMost people approach this completely backwards. Here is the exact framework we built into ${brandName} 🧵👇`,
          `2/5 The #1 mistake: relying on impulse and scattered notes instead of a repeatable, structured system.`,
          `3/5 That's why we built ${brandName}: ${brandTagline}`,
          `4/5 When you track every move with discipline and clarity, you eliminate emotional mistakes and see the real picture.`,
          `5/5 Want to try ${brandName} for yourself?\n\nReply "${defaultKeyword}" below and I'll DM you direct access (or grab the link in the first reply below)! ${tagStr}`
        ]
      },
      day5Newsletter: {
        title: `Day 5: VIP Newsletter — ${cleanIdea.slice(0, 35)}`,
        subjectLine: `[Inside ${brandName}] ${cleanIdea}`,
        previewText: brandTagline,
        headline: cleanIdea,
        intro: `This week we are diving deep into one of the most important upgrades you can make: ${cleanIdea}. Here is how ${brandName} makes it effortless.`,
        keyTakeaways: [
          { title: '1. Eliminate Guesswork', description: 'Replace scattered manual tracking with a single source of truth.' },
          { title: '2. Built for Clarity', description: brandTagline },
          { title: '3. Ready in 60 Seconds', description: `Jump into ${brandName} and see your dashboard live immediately.` }
        ],
        ctaText: `Launch ${brandName} →`,
        ctaUrl: cleanUrl
      }
    };

    return NextResponse.json({
      success: true,
      campaign: fallbackCampaign
    });
  } catch (error: any) {
    console.error('Campaign Multiplier API Error:', error);
    return NextResponse.json(
      { error: 'MULTIPLIER_FAILED', message: error.message || 'Failed to multiply campaign.' },
      { status: 500 }
    );
  }
}
