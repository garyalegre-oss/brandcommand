import { Brand, PostFormat, CarouselSlide, VideoScript, EmailCampaign, AIDirectorPlan, ResearchSourceItem } from '../types/brand';

export interface GenerationResult {
  title: string;
  content: string;
  format: PostFormat;
  tags: string[];
  carouselSlides?: CarouselSlide[];
  videoScript?: VideoScript;
  threadTweets?: string[];
  emailCampaign?: EmailCampaign;
}

export function generateBrandContent(
  brand: Brand, 
  topic: string, 
  format: PostFormat, 
  researchSources?: ResearchSourceItem[]
): GenerationResult {
  const cleanTopic = topic.trim() || brand.suggestedTopics[0];
  const tags = brand.commonHashtags.slice(0, 4);

  if (format === 'carousel') {
    return generateCarouselFormat(brand, cleanTopic, tags);
  } else if (format === 'video_script') {
    return generateVideoScriptFormat(brand, cleanTopic, tags, researchSources);
  } else if (format === 'thread') {
    return generateThreadFormat(brand, cleanTopic, tags);
  } else if (format === 'newsletter') {
    return generateEmailCampaignFormat(brand, cleanTopic, tags);
  } else {
    return generateSinglePostFormat(brand, cleanTopic, tags);
  }
}

function isLotteryBrand(brand: Brand): boolean {
  return (
    brand.category === 'lottery-gaming-tools' ||
    brand.name.toLowerCase().includes('evidraw') ||
    Boolean(brand.tagline && (brand.tagline.toLowerCase().includes('lottery') || brand.tagline.toLowerCase().includes('powerball') || brand.tagline.toLowerCase().includes('lotto')))
  );
}

function generateCarouselFormat(brand: Brand, topic: string, tags: string[]): GenerationResult {
  if (isLotteryBrand(brand)) {
    return {
      title: `Evidence-First Analysis: ${topic}`,
      format: 'carousel',
      tags: [...tags, '#LotteryStrategy', '#ProbabilityAnalysis', '#SmartPlay'],
      content: `Stop relying on superstition and random quick-pick guesses. Here is what real empirical probability data reveals about ${topic} 👇🎟️`,
      carouselSlides: [
        {
          title: topic,
          subtitle: `Evidence-First Portfolio Breakdown on ${brand.name}`,
          body: 'Most players pick birthdays or random quick picks. Real probability analysis shows why diversified portfolios and pre-draw tracking matter.',
          highlightText: 'Data > Superstition'
        },
        {
          title: '1. Diversified Portfolios vs. Random Picks',
          subtitle: 'Eliminating duplicate coverage patterns',
          body: 'Random tickets often bunch in identical number clusters. Building balanced line spreads maximizes your combinatorial coverage across draw sets.',
          highlightText: 'Balanced Spread'
        },
        {
          title: '2. The Reality of Independence',
          subtitle: 'Every draw starts with a clean slate',
          body: 'Past numbers have no memory, but probability distributions remain constant. We explore empirical draw frequencies inside the Learning Lab.',
          highlightText: 'Empirical Odds'
        },
        {
          title: '3. Lock Pre-Draws & Measure Performance',
          subtitle: 'Zero hindsight bias',
          body: `Lock your portfolio before the balls drop. Let ${brand.name} automatically check official results and measure performance against random benchmark lines.`,
          highlightText: 'Verified Tracking'
        },
        {
          title: 'Build Your Portfolio Today',
          subtitle: 'Canadian Games & U.S. Powerball',
          body: `Explore the Learning Lab, build your portfolio for Lotto Max, 6/49, and Powerball, and track results with complete transparency on ${brand.name}.`,
          highlightText: 'Link in Bio'
        }
      ]
    };
  }

  if (brand.category === 'fintech') {
    return {
      title: `Breakdown: ${topic}`,
      format: 'carousel',
      tags: [...tags, '#OptionCove', '#TradingEducation'],
      content: `Mastering this concept is the difference between bleeding capital and consistent portfolio cash flow. Here is a 5-step breakdown of ${topic} 👇`,
      carouselSlides: [
        {
          title: topic,
          subtitle: 'A Risk-Managed Breakdown for Cash-First Traders',
          body: 'Most retail traders focus entirely on directional bets. Real edge comes from positioning where time and volatility are on your side.',
          highlightText: 'Strategy > Hope'
        },
        {
          title: 'The Core Mechanism',
          subtitle: 'Why Most Get It Backwards',
          body: 'When implied volatility spikes, option sellers demand higher premiums. You are being paid to take on calculated probability, not guessing market tops.',
          highlightText: 'Volatility is your friend'
        },
        {
          title: 'Capital Allocation Rules',
          subtitle: 'Never Commit More Than 5-10% Per Ticker',
          body: 'If you have a $10,000 account, never write a put requiring $8,000 in collateral. Diversify across 3-5 uncorrelated sectors to prevent catastrophic drawdowns.',
          highlightText: 'Protect your principal first'
        },
        {
          title: 'Exit & Management Strategy',
          subtitle: 'Take Profits at 50% Max Profit',
          body: 'Holding until expiration for the last 10% of premium exposes you to unnecessary tail risk. Close at 50-65% gain and redeploy into fresh high-IV setups.',
          highlightText: 'Compound velocity of capital'
        },
        {
          title: 'Scan High-Probability Plays on OptionCove',
          subtitle: 'Built for Serious Options Income',
          body: 'Filter the entire market by your exact cash balance, delta tolerance, and earnings safety windows in seconds at OptionCove.com.',
          highlightText: 'Start Scanning on OptionCove'
        }
      ]
    };
  }

  if (brand.category === 'extensions' || brand.category === 'salon') {
    return {
      title: `Expert Guide: ${topic}`,
      format: 'carousel',
      tags: [...tags, '#HairTips', '#StylistSecret'],
      content: `Healthy hair doesn't happen by accident, it happens by routine. Swipe through for our master guide on ${topic.toLowerCase()} ✨`,
      carouselSlides: [
        {
          title: topic,
          subtitle: 'The Salon-Secret Care Blueprint',
          body: 'Whether you wear hand-tied wefts or just invested in fresh color, your home maintenance determines 80% of your hair longevity.',
          highlightText: 'Invest in your crown'
        },
        {
          title: '1. The Wash Day Protocol',
          subtitle: 'Sulfate-Free & Lukewarm Water Only',
          body: 'Hot water strips moisture and loosens bonds. Gently cleanse the scalp with finger pads—never scrub aggressively over extension tracks.',
          highlightText: 'Gentle pressure only'
        },
        {
          title: '2. Moisture & Thermal Defense',
          subtitle: 'Never Skip Heat Protection',
          body: 'Human hair extensions need external hydration. Apply lightweight leave-in conditioner to mid-shaft and ends before any heat tool touches your hair.',
          highlightText: 'Max heat: 350°F / 180°C'
        },
        {
          title: '3. The Bedtime Rule',
          subtitle: 'Never Go to Sleep with Wet Hair',
          body: 'Wet bonds swell and cause matting. Dry 100% at the roots, braid into a loose low plait, and sleep on pure silk or satin.',
          highlightText: 'Braid + Silk Scrunchie'
        },
        {
          title: 'Shop Salon-Grade Essentials',
          subtitle: 'Curated by Our Master Stylists',
          body: 'Get verified 100% Remy extensions and extension-safe care products shipped directly from our boutique store today.',
          highlightText: 'Link in Bio'
        }
      ]
    };
  }

  if (brand.category === 'community') {
    return {
      title: `Guía Rioplatense: ${topic}`,
      format: 'carousel',
      tags: [...tags, '#UruguayConecta', '#ComunidadUY'],
      content: `Para debatir en familia o con amigos en la rambla con un buen mate. Mirá las 5 verdades sobre ${topic.toLowerCase()} 👇🇺🇾`,
      carouselSlides: [
        {
          title: topic,
          subtitle: 'Cosas que solo entendemos los uruguayos',
          body: 'Desde el sonido del agua caliente cayendo en la yerba hasta el saludo cordial al vecino. Acá te dejamos los puntos clave.',
          highlightText: 'Orgullo Charrúa'
        },
        {
          title: '1. La Tradición No Se Negocia',
          subtitle: 'El ritual del termo y el mate',
          body: 'No importa si estás en el Chuy, en Colonia o viviendo en Australia: el termo bajo el brazo es tu pasaporte espiritual.',
          highlightText: 'Identidad pura'
        },
        {
          title: '2. Charlas de Verdad',
          subtitle: 'Menos postureo, más mateada',
          body: 'En nuestra comunidad conectamos sin filtros artificiales ni algoritmos que te muestran cualquier cosa. Historias reales entre paisanos.',
          highlightText: 'Sin caretas'
        },
        {
          title: '3. El Punto de Encuentro',
          subtitle: 'De la rambla a la pantalla',
          body: 'Descargá la app de Uruguay Conecta o sumate desde la web para debatir sobre fútbol, música, carnaval y actualidad.',
          highlightText: 'Sumate hoy'
        }
      ]
    };
  }

  if (brand.category === 'gaming') {
    return {
      title: `Tactical Playbook: ${topic}`,
      format: 'carousel',
      tags: [...tags, '#FantasyFootball', '#FootballTrading', '#ScoutSmart'],
      content: `Mastering player scouting and timing your transfer moves is how you dominate the leaderboard. Here is the tactical breakdown on ${topic} 👇⚽`,
      carouselSlides: [
        {
          title: topic,
          subtitle: `Tactical Scouting & Transfer Blueprint on ${brand.name}`,
          body: 'Most fantasy managers rely on pure luck or past points. Real champions scout underlying metrics and buy low before the breakout.',
          highlightText: 'Scout Before The Hype'
        },
        {
          title: '1. Spot The Underlying Form',
          subtitle: 'Expected goal involvement & chance creation',
          body: 'Look at progressive passes, touches in the opposition box, and fixture swing difficulty over the next 4 gameweeks.',
          highlightText: 'Look at the data'
        },
        {
          title: '2. Time Your Player Trades',
          subtitle: 'Buy low on out-of-form wonderkids',
          body: 'When elite talents have a quiet week, their player share prices dip. That is your window to accumulate before the price explodes.',
          highlightText: 'Market intelligence'
        },
        {
          title: '3. Lock In Your Fantasy XI',
          subtitle: 'Every owned share unlocks fantasy eligibility',
          body: `Turn your scouted portfolio directly into your starting matchday lineup on ${brand.name}. Compete for beta rewards and bragging rights.`,
          highlightText: 'Play the beta'
        }
      ]
    };
  }

  // Generic SaaS / Webapp
  return {
    title: `Behind the Build: ${topic}`,
    format: 'carousel',
    tags: [...tags, '#ProductUpdate', '#Innovation'],
    content: `Here is how we designed and engineered ${topic} to give users the fastest, most intuitive experience possible:`,
    carouselSlides: [
      {
        title: topic,
        subtitle: 'Product Deep-Dive & Architecture',
        body: 'We scrapped traditional bloated workflows and rebuilt this feature from scratch to prioritize speed, simplicity, and delight.',
        highlightText: 'Built for Performance'
      },
      {
        title: 'The Core Bottleneck We Solved',
        subtitle: 'Friction Kills Flow',
        body: 'Users were spending too many clicks navigating complex menus. We replaced that with instant keyboard shortcuts and zero-latency rendering.',
        highlightText: 'Sub-50ms Response'
      },
      {
        title: 'Try It Live Today',
        subtitle: 'Feedback Welcome',
        body: 'Head over to our platform to test it out. Drop a comment below with what we should build next!',
        highlightText: 'Link in Bio'
      }
    ]
  };
}

function planAIDirector(brand: Brand, topic: string): AIDirectorPlan {
  const t = topic.toLowerCase();

  // 1. Determine Background & B-Roll
  let backgroundId = 'lottery_data_matrix';
  let reasoning = '';

  if (brand.category === 'fintech' || t.includes('option') || t.includes('call') || t.includes('put') || t.includes('trade') || t.includes('stock') || t.includes('market') || t.includes('scanner')) {
    if (t.includes('matrix') || t.includes('wall street') || t.includes('macro') || t.includes('fed') || t.includes('nasdaq')) {
      backgroundId = 'trading_matrix';
      reasoning = 'Wall Street Nasdaq screen wall selected for macro market breakdown';
    } else {
      backgroundId = 'live_candlesticks';
      reasoning = 'OptionCove live candlestick terminal selected for price action scan';
    }
  } else if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw') || t.includes('lottery') || t.includes('lotto') || t.includes('odds') || t.includes('powerball') || t.includes('jackpot')) {
    backgroundId = 'lottery_data_matrix';
    reasoning = 'Evidraw lottery analytics and probability distribution matrix selected for data-backed strategy breakdown';
  } else if (brand.category === 'extensions' || (brand.category === 'beauty' && (t.includes('weft') || t.includes('remy') || t.includes('hand-tied')))) {
    backgroundId = 'remy_wefts';
    reasoning = '4K Remy extensions macro b-roll selected to highlight cuticle integrity and seamless blending';
  } else if ((brand.category === 'salon' || brand.category === 'beauty') && (t.includes('wash') || t.includes('treatment') || t.includes('scalp') || t.includes('spa') || t.includes('mask') || t.includes('repair'))) {
    backgroundId = 'luxury_salon_wash';
    reasoning = 'Luxury hair spa wash station selected for restorative care and scalp wellness';
  } else if (brand.category === 'salon' || (brand.category === 'beauty' && (t.includes('blowout') || t.includes('balayage') || t.includes('stylist') || t.includes('color')))) {
    backgroundId = 'salon_blowout';
    reasoning = 'Salon blowout transformation studio selected for vibrant before-and-after results';
  } else if (brand.id.includes('varbona') || t.includes('code') || t.includes('cloud') || t.includes('api') || t.includes('terminal') || t.includes('dev') || t.includes('server')) {
    backgroundId = 'tech_dark_terminal';
    reasoning = 'Dark code IDE terminal selected for backend engineering and cloud performance';
  } else if (brand.category === 'community' || t.includes('uruguay') || t.includes('mate') || t.includes('rambla') || t.includes('montevideo')) {
    backgroundId = 'uruguay_rambla';
    reasoning = 'Rambla coastal gathering selected for warm, authentic Rioplatense community vibe';
  } else if (t.includes('coffee') || t.includes('morning') || t.includes('routine') || t.includes('work') || t.includes('desk') || t.includes('vlog')) {
    backgroundId = 'cozy_workspace';
    reasoning = 'Aesthetic coffee creator desk selected for lifestyle pacing';
  } else {
    backgroundId = 'evidraw_canvas';
    reasoning = 'Clean interactive digital workspace selected for clear messaging';
  }

  // 2. Determine Graphic Callout Sticker Badge (Related only, or 'none')
  let stickerId = 'none';
  if (brand.category === 'lottery-gaming-tools' || brand.id.includes('evidraw')) {
    if (t.includes('odd') || t.includes('number') || t.includes('scan') || t.includes('matrix')) {
      stickerId = 'odds_matrix';
      reasoning += ', paired with LOTTO ODDS MATRIX badge';
    } else if (t.includes('prob') || t.includes('math') || t.includes('stat') || t.includes('ev') || t.includes('strategy')) {
      stickerId = 'probability_engine';
      reasoning += ', paired with EV PROBABILITY ENGINE badge';
    } else if (t.includes('jackpot') || t.includes('draw') || t.includes('powerball') || t.includes('mega')) {
      stickerId = 'jackpot_scanner';
      reasoning += ', paired with LIVE DRAW SCANNER badge';
    } else {
      stickerId = 'none'; // Uncluttered, clean graphic presentation
      reasoning += ', with clean visual presentation without sticker overlay';
    }
  } else if (t.includes('sale') || t.includes('discount') || t.includes('20%') || t.includes('promo') || t.includes('black friday')) {
    stickerId = 'sale_20';
    reasoning += ', paired with 20% OFF sale badge';
  } else if (brand.category === 'fintech' || t.includes('gain') || t.includes('profit') || t.includes('call winner')) {
    stickerId = 'options_gain';
    reasoning += ', paired with +340% CALL WINNER profit badge';
  } else if (brand.category === 'extensions') {
    stickerId = 'remy_hair';
    reasoning += ', paired with 100% Remy Wefts badge';
  } else if (brand.category === 'salon' && (t.includes('review') || t.includes('client') || t.includes('rated') || t.includes('5 star'))) {
    stickerId = 'verified_salon';
    reasoning += ', paired with 5.0 Rated Salon badge for social proof';
  } else if (brand.category === 'community' || t.includes('uruguay')) {
    stickerId = 'uruguay';
    reasoning += ', paired with Uruguay Conecta badge';
  } else if (t.includes('drop') || t.includes('launch') || t.includes('exclusive')) {
    stickerId = 'exclusive_drop';
    reasoning += ', paired with Exclusive Drop badge for launch urgency';
  } else if (t.includes('bio') || t.includes('link')) {
    stickerId = 'link_in_bio';
    reasoning += ', paired with Link In Bio sticker';
  } else {
    stickerId = 'none'; // Unrelated topics show NO sticker
  }

  // 3. Determine Filter Color Grade
  let filter: 'none' | 'cinematic' | 'golden_hour' | 'cyberpunk' | 'vhs_90s' | 'noir' = 'none';
  if (brand.category === 'fintech' || t.includes('matrix') || t.includes('cyber') || t.includes('scanner')) {
    filter = 'cyberpunk';
  } else if (brand.category === 'salon' || brand.category === 'extensions' || t.includes('summer') || t.includes('golden') || t.includes('warm')) {
    filter = 'golden_hour';
  } else if (brand.category === 'community' || t.includes('vintage') || t.includes('retro')) {
    filter = 'cinematic';
  } else {
    filter = 'cinematic';
  }

  // 4. Determine Production Layout (Default: dynamic multi-scene cuts)
  let layout: 'dynamic_cuts' | 'showcase' | 'split' | 'pip' | 'full_actor' = 'dynamic_cuts';
  if (t.includes('only demo') || t.includes('pure chart')) {
    layout = 'showcase';
  } else if (t.includes('split') || t.includes('split screen')) {
    layout = 'split';
  } else {
    layout = 'dynamic_cuts';
  }

  // 5. Subtitles & Soundwave
  const subtitleStyle: 'hormozi' | 'cyber' | 'luxury' = 
    brand.category === 'fintech' ? 'cyber' : (brand.category === 'salon' || brand.category === 'extensions') ? 'luxury' : 'hormozi';
  const soundwaveStyle: 'off' | 'neon_bars' | 'rainbow_eq' | 'minimal_dots' = 
    brand.category === 'fintech' ? 'neon_bars' : 'rainbow_eq';

  return {
    layout,
    backgroundId,
    stickerId,
    filter,
    subtitleStyle,
    soundwaveStyle,
    directorNotes: `${reasoning}. Configured ${layout.toUpperCase()} layout with ${filter} color grade.`
  };
}

function generateVideoScriptFormat(
  brand: Brand, 
  topic: string, 
  tags: string[], 
  researchSources?: ResearchSourceItem[]
): GenerationResult {
  const directorPlan = planAIDirector(brand, topic);

  // Extract real researched facts & statistics to weave into the voiceover and scenes
  const primaryFact = researchSources && researchSources.length > 0 ? researchSources[0].keyFact : null;
  const secondaryFact = researchSources && researchSources.length > 1 ? researchSources[1].keyFact : null;
  const sourceName = researchSources && researchSources.length > 0 ? researchSources[0].source : null;

  if (isLotteryBrand(brand)) {
    return {
      title: `Lottery Analytics Reel: ${topic}`,
      format: 'video_script',
      tags: [...tags, '#LotteryTools', '#Powerball', '#LottoStrategies', '#SmartPlay'],
      content: `Stop burning money on random quick picks until you see what evidence-first portfolio testing actually proves!`,
      videoScript: {
        hook: `Stop buying random quick-pick lottery tickets until you see what the math actually proves!`,
        visualCue: `Split screen: crumpled paper ticket on the left vs sleek, organized Evidraw portfolio grid on the right.`,
        hookBrollMediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        hookBrollMediaType: 'image',
        hookBrollLabel: 'Evidraw Split-Screen Portfolio & Live Odds Matrix',
        scenes: [
          {
            timestamp: '0:00 - 0:03',
            visual: 'Close-up of quick-pick numbers highlighting clumped numbers and overlapping duplicates.',
            audio: `95% of people pick tickets that overlap in the worst possible way.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Combinatorial Probability & Overlap Matrix'
          },
          {
            timestamp: '0:04 - 0:11',
            visual: 'Interactive Learning Lab screen cycling through Canadian games and US Powerball combinatorial spreads.',
            audio: `Inside the Evidraw Learning Lab, we test diversified portfolios against true historical random distribution.`,
            brollMediaUrl: 'https://evidraw.com/og.png',
            brollMediaType: 'image',
            brollLabel: 'Evidraw Learning Lab & Portfolio Engine'
          },
          {
            timestamp: '0:12 - 0:21',
            visual: 'Pre-draw lock timestamp button followed by official draw result matching checkmarks.',
            audio: `You lock your runs before the draw, and Evidraw automatically pulls official results and measures outcomes with zero hindsight bias.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Real-Time Verification & Audit'
          },
          {
            timestamp: '0:22 - 0:30',
            visual: 'Evidraw app homepage with Link in Bio banner.',
            audio: `Tap the link in our bio to build your portfolio and test your numbers today at Evidraw.com!`,
            brollMediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
            brollMediaType: 'image',
            brollLabel: 'Evidraw 9:16 Mobile App Final CTA'
          }
        ],
        ctaBrollMediaUrl: brand.websiteMobileScreenshotUrl || 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        ctaBrollMediaType: 'image',
        ctaBrollLabel: 'Evidraw App Final CTA',
        cta: `Tap the link in our bio to build your portfolio and test your numbers today at Evidraw.com!`,
        aiDirector: {
          layout: 'dynamic_cuts',
          backgroundId: 'lottery_data_matrix',
          stickerId: 'odds_matrix',
          filter: 'none',
          subtitleStyle: 'cyber',
          soundwaveStyle: 'neon_bars',
          directorNotes: 'Configured by AI Director for Evidraw.'
        }
      }
    };
  }

  if (brand.category === 'fintech') {
    const customHook = primaryFact && primaryFact.includes('0DTE')
      ? `🚨 STOP trading 0DTE options until you check this one level!`
      : `Watch this candlestick chart before you execute another ${topic.toLowerCase()} trade.`;

    const scene2Audio = primaryFact
      ? `Instead of gambling on momentum, look at the verified data: ${primaryFact}.`
      : `Instead of gambling on momentum after the move is over, here is the exact scan filter we use on OptionCove.`;

    const scene3Audio = secondaryFact
      ? `Notice the difference? ${secondaryFact}. OptionCove scans for this in real-time.`
      : `Notice how theta decay works in your favor instead of chewing up your portfolio every 60 seconds.`;

    return {
      title: `OptionCove Reel Script: ${topic}`,
      format: 'video_script',
      tags: [...tags, '#OptionCove', '#OptionsTrading', '#StockScanner', '#TradingTips'],
      content: `High-retention 9:16 script breaking down "${topic}" for active options traders with live candlestick terminals.`,
      videoScript: {
        hook: customHook,
        visualCue: `Rapid zoom-in on the real-time fluctuating OptionCove terminal with pulsing green volatility band.`,
        hookBrollMediaUrl: 'animated_chart',
        hookBrollMediaType: 'animated_chart',
        hookBrollLabel: 'OptionCove Live Candlestick Scanner',
        scenes: [
          {
            timestamp: '0:00 - 0:03',
            visual: 'Close-up on live candlestick orderbook showing sudden aggressive buying volume.',
            audio: `Wall Street market makers love when retail traders blindly buy out-of-the-money calls here.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Wall Street Multi-Screen Matrix'
          },
          {
            timestamp: '0:04 - 0:11',
            visual: sourceName 
              ? `Scanner dashboard reveals implied volatility crush calibrated to ${sourceName} benchmarks.`
              : 'Scanner dashboard reveals implied volatility crush versus delta probability threshold.',
            audio: scene2Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Implied Volatility & Orderbook Heatmap'
          },
          {
            timestamp: '0:12 - 0:22',
            visual: 'Animated trade trigger highlights risk-defined cash-secured put setup with 82% historical win-rate.',
            audio: scene3Audio,
            brollMediaUrl: 'animated_chart',
            brollMediaType: 'animated_chart',
            brollLabel: 'Live Candlestick Trade Trigger'
          },
          {
            timestamp: '0:23 - 0:30',
            visual: 'OptionCove terminal logo overlay with arrow pointing to bio link.',
            audio: `Stop guessing your strike prices. Tap the link in our bio to scan high-probability setups right now!`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'OptionCove Pro Terminal Bio Link'
          }
        ],
        ctaBrollMediaUrl: 'animated_chart',
        ctaBrollMediaType: 'animated_chart',
        ctaBrollLabel: 'OptionCove VIP Scanner Access',
        cta: `Tap the link in bio to scan live setups on OptionCove.com today!`,
        aiDirector: directorPlan
      }
    };
  }

  if (brand.category === 'salon' || brand.category === 'extensions') {
    const customHook = primaryFact && primaryFact.includes('degrade')
      ? `🚨 STOP washing your hair extensions in hot water! You are ruining them.`
      : `If your hair extensions feel heavy or start matting, you made this one wash mistake!`;

    const scene2Audio = primaryFact
      ? `Clinical trichology research proved this: ${primaryFact}.`
      : `Never scrub circular pressure over the seams. Always press sulfate-free lather downward with your palms.`;

    const scene3Audio = secondaryFact
      ? `Look at the payoff when you follow this protocol: ${secondaryFact}. Pure 100% Remy hair that flows naturally.`
      : `Look at this seamless blend. Pure 100% Remy human hair that moves with your natural texture.`;

    return {
      title: `Salon & Extensions Reel: ${topic}`,
      format: 'video_script',
      tags: [...tags, '#HairTransformation', '#HandTiedExtensions', '#SalonBehindTheScenes', '#HealthyHair'],
      content: `Visual salon transformation script for "${topic}" highlighting hair health, cuticle alignment, and gloss finish.`,
      videoScript: {
        hook: customHook,
        visualCue: `Crisp 4K macro shot of hand-tied weft track showing flawless stitch tension without scalp redness.`,
        hookBrollMediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        hookBrollMediaType: 'image',
        hookBrollLabel: 'Salon Blowout & High-Gloss Reveal',
        scenes: [
          {
            timestamp: '0:00 - 0:03',
            visual: 'Stylist gently lifting sectioned hair to reveal invisible, flat track placement.',
            audio: `Most clients think shedding is normal, but it almost always comes down to how you wash the tracks.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: '100% Remy Extensions Weft Placement'
          },
          {
            timestamp: '0:04 - 0:12',
            visual: 'Wash station routine: lukewarm water application and sulfate-free foam pressed gently down the cuticle.',
            audio: scene2Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Hair Spa Wash Station Routine'
          },
          {
            timestamp: '0:13 - 0:24',
            visual: 'Blow dry blowout reveal: bouncy silk press with mirror-like shine and seamless natural blend.',
            audio: scene3Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Balayage & Mirror Shine Blowout'
          },
          {
            timestamp: '0:25 - 0:30',
            visual: 'Boutique consultation card and booking link badge.',
            audio: `Ready for your dream hair? Tap the link in our bio to book your consultation with our master stylists!`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Consultation & Booking Offer'
          }
        ],
        ctaBrollMediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        ctaBrollMediaType: 'image',
        ctaBrollLabel: 'Master Stylist Booking Endscreen',
        cta: `Book your salon transformation or order 100% Remy extensions from the link in bio!`,
        aiDirector: directorPlan
      }
    };
  }

  if (brand.category === 'community') {
    const scene2Audio = primaryFact
      ? `Las investigaciones culturales lo confirman: ${primaryFact}.`
      : `Nuestra forma de hablar, de juntarnos y de bancar al vecino es algo único que se extraña todos los días.`;

    return {
      title: `Reel Rioplatense: ${topic}`,
      format: 'video_script',
      tags: [...tags, '#UruguayConecta', '#CostumbresUruguayas', '#RamblaMontevideo', '#Mate'],
      content: `Video auténtico y cercano sobre "${topic}" para conectar a los uruguayos en todo el mundo.`,
      videoScript: {
        hook: `Hay 3 cosas que no le podés discutir a un uruguayo sobre ${topic.toLowerCase()}...`,
        visualCue: `Primer plano de termo y mate con la rambla de fondo al atardecer.`,
        hookBrollMediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
        hookBrollMediaType: 'image',
        hookBrollLabel: 'Rambla Coastal Sunset & Mate',
        scenes: [
          {
            timestamp: '0:00 - 0:03',
            visual: 'Mate amargo servido con agua caliente y yerba bien armada con montañita.',
            audio: `No importa si estás en Pocitos, en Tacuarembó o viviendo en Miami: esto no se negocia.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Mate Amargo & Rambla Vista'
          },
          {
            timestamp: '0:04 - 0:11',
            visual: 'Grupo de amigos charlando distendidos con el sonido del mar de fondo.',
            audio: scene2Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Comunidad & Amigos'
          },
          {
            timestamp: '0:12 - 0:22',
            visual: 'Pantalla de la app Uruguay Conecta mostrando debates y fotos de la comunidad.',
            audio: `Por eso armamos Uruguay Conecta: para que estés donde estés, sientas el calor de tu tierra a un toque de distancia.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Uruguay Conecta App Pantalla'
          },
          {
            timestamp: '0:23 - 0:30',
            visual: 'Bandera uruguaya con logo de la app y botón de descarga.',
            audio: `Sumate gratis hoy desde el link del perfil y saludá a la barra en los comentarios!`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Descargá la App'
          }
        ],
        ctaBrollMediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
        ctaBrollMediaType: 'image',
        ctaBrollLabel: 'Uruguay Conecta Bio Link',
        cta: `¡Descargá la app de Uruguay Conecta en el link de la bio y unite a la comunidad!`,
        aiDirector: directorPlan
      }
    };
  }

  if (brand.category === 'gaming') {
    const customHook = primaryFact
      ? `🚨 STOP trading players blindly in your fantasy league! Look at what this data proves: ${primaryFact}.`
      : `If your fantasy football squad is losing rank every week, you made this one trade mistake!`;

    const scene2Audio = primaryFact
      ? `Recent scouting performance benchmarks show this: ${primaryFact}.`
      : `Most managers buy players AFTER they score a hat-trick when the price is at an all-time high. Real pros scout under-the-radar metrics before the breakout.`;

    const scene3Audio = secondaryFact
      ? `Look at the payoff when you back your instinct: ${secondaryFact}. One breakout game doubles your team value.`
      : `Look at this lineup synergy. One share unlocks fantasy eligibility, and your squad rockets up the leaderboard.`;

    return {
      title: `Fantasy Football Reel: ${topic}`,
      format: 'video_script',
      tags: [...tags, '#FantasyFootball', '#FootballTrading', '#WonderkidScout', '#MatchDay'],
      content: `High-retention fantasy football scouting and player trading script for "${topic}".`,
      videoScript: {
        hook: customHook,
        visualCue: `Rapid zoom-in on dynamic football pitch tactical lineup with pulsing neon player cards.`,
        hookBrollMediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        hookBrollMediaType: 'image',
        hookBrollLabel: 'Stadium Floodlights & Tactical Lineup',
        scenes: [
          {
            timestamp: '0:00 - 0:03',
            visual: 'Close-up of player valuation chart showing sudden aggressive upward price spike.',
            audio: `Everyone in your league is sleeping on this transfer move right now.`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Stadium Floodlights & Matchday Pitch'
          },
          {
            timestamp: '0:04 - 0:11',
            visual: 'Scouting dashboard reveals underlying xG and progressive passes before market price adjustment.',
            audio: scene2Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Tactical Pitch & Scout Matrix'
          },
          {
            timestamp: '0:12 - 0:22',
            visual: 'Interactive squad builder locks in fantasy XI with dynamic bonus multipliers.',
            audio: scene3Audio,
            brollMediaUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: '3D Tactical Motion Flow'
          },
          {
            timestamp: '0:23 - 0:30',
            visual: `${brand.name} mobile preview with play-money credits badge and tap-in-bio arrow.`,
            audio: `Back your football instincts. Tap the link in our bio to join the free ${brand.name} beta today!`,
            brollMediaUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&auto=format&fit=crop&q=80',
            brollMediaType: 'image',
            brollLabel: 'Football Stadium & Goal Celebration'
          }
        ],
        ctaBrollMediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        ctaBrollMediaType: 'image',
        ctaBrollLabel: `${brand.name} Beta Access Endscreen`,
        cta: `Tap the link in bio to scout players & join the ${brand.name} beta!`,
        aiDirector: directorPlan
      }
    };
  }

  // Tech / WebApp / Generic Fallback
  const scene2Audio = primaryFact
    ? `Recent tech performance benchmarks reveal: ${primaryFact}.`
    : `Instead of doing what everyone else does, look at what happens when you switch to this method.`;

  const scene3Audio = secondaryFact
    ? `Notice the difference? ${secondaryFact}. It saves you hours of frustration.`
    : `Notice the immediate difference? It takes less than 2 minutes and saves you hours of frustration.`;

  return {
    title: `Reel / TikTok Script: ${topic}`,
    format: 'video_script',
    tags: [...tags, '#ViralVideo', '#LearnOnTikTok', '#TechInnovation'],
    content: `Short-form vertical video script optimized for high watch time and immediate engagement.`,
    videoScript: {
      hook: `Stop doing this immediately if you care about ${topic.toLowerCase()}!`,
      visualCue: `High-energy opening hook clip (0-2s) with bold on-screen subtitles and sound effect.`,
      hookBrollMediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      hookBrollMediaType: 'image',
      hookBrollLabel: 'Visual Demonstration Hook',
      scenes: [
        {
          timestamp: '0:00 - 0:03',
          visual: 'Fast zoom-in on the problem with red warning graphic or expressive reaction.',
          audio: `Most people are completely ruining their results with ${topic.toLowerCase()} because of this one mistake.`,
          brollMediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
          brollMediaType: 'image',
          brollLabel: 'Dark Code IDE Terminal'
        },
        {
          timestamp: '0:04 - 0:12',
          visual: 'Screen capture or hands-on demonstration showing the wrong way vs the right way.',
          audio: scene2Audio,
          brollMediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
          brollMediaType: 'image',
          brollLabel: 'Interactive Vector UI Demo'
        },
        {
          timestamp: '0:13 - 0:25',
          visual: 'Close-up evidence of the payoff with sub-second feedback and clean visual output.',
          audio: scene3Audio,
          brollMediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
          brollMediaType: 'image',
          brollLabel: 'High-Speed Cloud Architecture'
        },
        {
          timestamp: '0:26 - 0:32',
          visual: 'Direct to camera or logo animation with follow-and-save graphic arrow.',
          audio: `Hit save on this video so you remember this later, and tap the link in our bio to check out ${brand.name}!`,
          brollMediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
          brollMediaType: 'image',
          brollLabel: 'Cloud Platform CTA'
        }
      ],
      ctaBrollMediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
      ctaBrollMediaType: 'image',
      ctaBrollLabel: 'Product Demo Endscreen',
      cta: `Tap the link in bio for full details and follow for more daily tips!`,
      aiDirector: directorPlan
    }
  };
}

function generateThreadFormat(brand: Brand, topic: string, tags: string[]): GenerationResult {
  if (isLotteryBrand(brand)) {
    return {
      title: `The Truth About Lottery Math: ${topic}`,
      format: 'thread',
      tags: [...tags, '#LotteryMath', '#Powerball', '#EvidenceFirst'],
      content: `A 6-part evidence-first breakdown on lottery probability and portfolio design for X/Twitter.`,
      threadTweets: [
        `1/6 🧵 The truth about lottery numbers that 99% of players never realize:\n\nThere is no such thing as a "due" number or a lucky quick pick. Here is what empirical probability actually teaches us about ${topic.toLowerCase()} 👇🎟️`,
        `2/6 Rule #1: Independence of Trials.\n\nThe lottery machine has no memory. Ball #17 coming out last week has zero mathematical influence on whether it drops tonight. Believing otherwise is the classic Gambler's Fallacy.`,
        `3/6 Rule #2: Avoid Cluster Overlap.\n\nQuick-pick tickets often bunch numbers together into overlapping sets. Building a diversified portfolio spreads your coverage cleanly across the combinatorial matrix.`,
        `4/6 Rule #3: Lock Pre-Draws.\n\nHindsight makes everyone look smart after the draw. Real testing requires locking your numbers before the official draw and recording performance honestly against random benchmarks.`,
        `5/6 That is why we built ${brand.name}.\n\nWe provide evidence-first portfolio tools for Canadian games (Lotto Max, 6/49) and U.S. Powerball, with a Learning Lab to explore real mathematical distributions without get-rich-quick hype.`,
        `6/6 Want to test your own portfolio strategies? Explore the Learning Lab at ${brand.websiteUrl || 'evidraw.com'} and tell me your thoughts in the replies!`
      ]
    };
  }

  return {
    title: `Thread / X Post Series: ${topic}`,
    format: 'thread',
    tags: [...tags, '#Thread', '#BuildInPublic'],
    content: `A multi-part breakdown structured for maximum virality and bookmarks on X (Twitter).`,
    threadTweets: [
      `1/7 🧵 Most people overcomplicate ${topic.toLowerCase()}.\n\nAfter testing this across dozens of scenarios, here is the exact framework that generates results without the usual headaches 👇`,
      `2/7 The biggest misconception is thinking you need massive capital or years of experience. In reality, the winners simply master the fundamentals and repeat them ruthlessly.`,
      `3/7 Here is Step 1: Establish clear constraints before you begin. Define your maximum downside, set your target metric, and stick to your rules without emotion.`,
      `4/7 Step 2: Use the right tools. Relying on outdated methods slows you down. That's why we built ${brand.name}—to cut out the busywork and show you what matters in seconds.`,
      `5/7 Step 3: Consistency over intensity. Small, disciplined wins compounded weekly beat one lucky shot every single time.`,
      `6/7 Bookmark this thread 🔖 if you found it useful.\n\nRetweet the first tweet to share with fellow builders:`,
      `7/7 Want to explore more? Check out ${brand.websiteUrl || brand.name} and let me know your thoughts in the replies!`
    ]
  };
}

function generateSinglePostFormat(brand: Brand, topic: string, tags: string[]): GenerationResult {
  if (isLotteryBrand(brand)) {
    return {
      title: `Probability Insight: ${topic}`,
      format: 'single',
      tags: [...tags, '#Lottery', '#Powerball', '#LottoMax', '#Probability'],
      content: `🎟️ EVIDENCE-FIRST LOTTERY ANALYSIS: ${topic}\n\nMost players rely on lucky dates or random quick picks that group numbers into inefficient clusters. But probability treats every combination equally.\n\nBuilding balanced portfolios across Canadian games (Lotto Max, 6/49) and U.S. Powerball lets you structure your lines intelligently and track performance against true random benchmarks—with zero hindsight bias.\n\nExplore the Learning Lab and build your pre-draw portfolio today at ${brand.websiteUrl || 'evidraw.com'}! 👇`
    };
  }

  if (brand.category === 'gaming') {
    return {
      title: `Matchday Trade Alert: ${topic}`,
      format: 'single',
      tags: [...tags, '#FantasyFootball', '#FootballTrading', '#ScoutSmart'],
      content: `⚽ SCOUTING ALERT: ${topic}\n\nMost fantasy managers buy the hype AFTER a player scores a brace and prices spike. But real champions scout underlying metrics and fixture difficulty before the breakout.\n\nWho is on your radar for the upcoming gameweek? Drop your fantasy XI predictions below and scout live on ${brand.websiteUrl || brand.name}! 👇`
    };
  }

  if (brand.category === 'community') {
    return {
      title: `Publicación para Uruguay: ${topic}`,
      format: 'single',
      tags: [...tags, '#Uruguay', '#Comunidad'],
      content: `Bo, una pregunta rápida para toda la barra de ${brand.name} 🇺🇾:\n\nCon respecto a "${topic}", ¿cuál es tu opinión sincera?\n\nDejanos tu comentario acá abajo y unite a las charlas que se arman en nuestra plataforma. ¡Que no se pierda la linda costumbre de charlar entre nosotros! 🧉👇`
    };
  }

  if (brand.category === 'fintech') {
    return {
      title: `Option Strategy Note: ${topic}`,
      format: 'single',
      tags: [...tags, '#ThetaDecay', '#CashSecuredPuts'],
      content: `Quick trading reminder for options sellers regarding ${topic.toLowerCase()}:\n\nNever chase high IV on companies you wouldn't feel comfortable owning for the next 24 months. The premium might look sweet today, but capital preservation is the only game in town.\n\nScan high-probability setups calibrated to your exact cash account right now on OptionCove.com 📊`
    };
  }

  return {
    title: `Spotlight: ${topic}`,
    format: 'single',
    tags: tags,
    content: `Everything you need to know about ${topic.toLowerCase()} ✨\n\nAt ${brand.name}, we believe in premium quality and zero shortcuts. Whether you are looking for transformative results or daily tips, we've got you covered.\n\n👉 Discover more at ${brand.websiteUrl || 'the link in bio'} and tell us what you think in the comments!`
  };
}

function generateEmailCampaignFormat(brand: Brand, topic: string, tags: string[]): GenerationResult {
  if (isLotteryBrand(brand)) {
    const emailCampaign: EmailCampaign = {
      subjectLines: [
        { type: 'curiosity', text: `What empirical data reveals about Powerball & Lotto Max odds 🎟️` },
        { type: 'direct', text: `${brand.name} Lab Report: ${topic}` },
        { type: 'benefit', text: `How to build a diversified lottery portfolio without duplicate clustering` }
      ],
      previewText: `Evidence-first lottery analysis for Canadian games and U.S. Powerball.`,
      headline: `Evidence-First Analysis: ${topic}`,
      greeting: 'Hey Player,',
      intro: `Most players select numbers based on intuition or take quick picks with duplicate cluster overlap. In this edition of the ${brand.name} Learning Lab, we break down what combinatorial probability actually reveals about line distribution:`,
      keyPoints: [
        {
          title: '1. Diversified Portfolios vs. Random Guesses',
          description: 'When you build an intentional portfolio, you eliminate redundant number combinations and spread your coverage evenly across draw sets.'
        },
        {
          title: '2. Zero Hindsight Bias (Lock Pre-Draws)',
          description: 'We track official results automatically so you can see your performance against random benchmark lines without rose-tinted revisionism.'
        },
        {
          title: '3. Explore the Learning Lab',
          description: 'Whether you follow Canadian national games (Lotto Max, 6/49) or U.S. Powerball, test your portfolios with real data today.'
        }
      ],
      ctaButton: {
        text: `Open ${brand.name} Learning Lab`,
        url: brand.websiteUrl || 'https://evidraw.com'
      },
      signOff: `Play disciplined,\nThe ${brand.name} Team`,
      psNote: `P.S. Lock your portfolio pre-draw and let our automated engine verify official results transparently.`
    };

    return {
      title: `Newsletter: ${topic}`,
      content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
      format: 'newsletter',
      tags: [...tags, '#LotteryInsights', '#SmartPlay', '#Evidraw'],
      emailCampaign
    };
  }

  if (brand.category === 'gaming') {
    const emailCampaign: EmailCampaign = {
      subjectLines: [
        { type: 'curiosity', text: `3 breakout wonderkids you need in your squad before Gameweek 15 ⚽` },
        { type: 'direct', text: `${brand.name} Scouting Report: ${topic}` },
        { type: 'benefit', text: `How to build an elite Fantasy XI on ${brand.name} with free play-money credits` }
      ],
      previewText: 'Stop guessing your matchday squad. Here is the data-backed transfer strategy.',
      headline: `The Tactical Scouting Playbook: ${topic}`,
      greeting: 'Hey Manager,',
      intro: `Most fantasy managers buy the hype AFTER a player scores a brace and prices spike. But the real edge is accumulating player shares before the fixture swing.\n\nToday, we are breaking down our tactical framework on ${topic.toLowerCase()} so you can scout undervalued talent and climb the leaderboard:`,
      keyPoints: [
        {
          title: '1. Spot Under-the-Radar xG',
          description: 'Look at chance creation and progressive box touches over the last 3 matches before mainstream commentators notice.'
        },
        {
          title: '2. Time the Transfer Dip',
          description: 'When elite wingers have a blank gameweek, casual players dump shares. That is your window to accumulate at a bargain.'
        },
        {
          title: '3. Lock in Matchday Synergy',
          description: `Every share you own on ${brand.name} unlocks fantasy eligibility. Pick your owned XI and let live pitch performance reward you.`
        }
      ],
      ctaButton: {
        text: `Join the Free ${brand.name} Beta ➔`,
        url: brand.websiteUrl || 'https://varbona.com'
      },
      signOff: `Best of luck on matchday,\nThe ${brand.name} Scouting Desk`,
      psNote: 'P.S. Play-money beta credits are 100% free with no purchase required. Build your first squad in under 60 seconds.'
    };

    return {
      title: `Newsletter: ${topic}`,
      content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
      format: 'newsletter',
      tags: [...tags, '#FantasyFootball', '#FootballTrading', '#ScoutSmart'],
      emailCampaign
    };
  }

  if (brand.category === 'fintech') {
    const emailCampaign: EmailCampaign = {
      subjectLines: [
        { type: 'curiosity', text: `Why 85% of options expire worthless (and how to profit) 📈` },
        { type: 'direct', text: `OptionCove Brief: What you need to know about ${topic}` },
        { type: 'benefit', text: `How we generate weekly cash flow on a $5k account with ${topic}` }
      ],
      previewText: 'Stop gambling on out-of-the-money calls. Here is the exact risk-managed playbook.',
      headline: `The Capital-First Guide: ${topic}`,
      greeting: 'Hey Trader,',
      intro: `Most retail traders treat the options market like a casino lottery ticket. They buy short-dated out-of-the-money calls, cross their fingers, and watch time decay (theta) bleed their account down to zero.\n\nIf you want to survive and compound capital long-term, you have to flip the script and become the house. Here is our breakdown of ${topic.toLowerCase()}:`,
      keyPoints: [
        {
          title: '1. The Math of Cash-Secured Puts',
          description: 'When you sell a put, someone pays you cash upfront. You are merely agreeing to buy a stock you already like at an agreed discount.'
        },
        {
          title: '2. The 30–45 DTE Window',
          description: 'Selling contracts with 30 to 45 days until expiration maximizes theta decay velocity while giving you ample runway to manage assignment risk.'
        },
        {
          title: '3. Never Over-Leverage Collateral',
          description: 'Keep 25% of your portfolio in cash reserves so you never get forced into an emergency margin call when volatility spikes.'
        }
      ],
      ctaButton: {
        text: 'Scan High-Probability Plays on OptionCove ➔',
        url: brand.websiteUrl || 'https://optioncove.com'
      },
      signOff: 'Trade with discipline,\nThe OptionCove Research Desk',
      psNote: 'P.S. We just added real-time earnings calendar guards to the scanner. Filter out high-risk earnings dates in 1 click.'
    };

    return {
      title: `Newsletter: ${topic}`,
      content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
      format: 'newsletter',
      tags: [...tags, '#EmailNewsletter', '#OptionCoveDigest'],
      emailCampaign
    };
  }

  if (brand.category === 'extensions' || brand.category === 'salon') {
    const emailCampaign: EmailCampaign = {
      subjectLines: [
        { type: 'curiosity', text: `Are you making this mistake with your hair at night? 🌙` },
        { type: 'direct', text: `Your Master Stylist Guide: ${topic}` },
        { type: 'benefit', text: `Keep your hair extensions silky for 9+ months with this routine ✨` }
      ],
      previewText: 'The salon-secret care protocol our master stylists recommend to every VIP client.',
      headline: `Stylist Secrets: The Truth About ${topic}`,
      greeting: 'Hello Beautiful,',
      intro: `Whether you wear hand-tied wefts or just invested in fresh dimensional color, the truth is that 80% of your hair longevity happens after you leave the salon chair.\n\nToday, we are sharing our master stylist protocol on ${topic.toLowerCase()} so you can protect your investment and look flawless every single day:`,
      keyPoints: [
        {
          title: 'The Sulfate-Free Rule',
          description: 'Standard drugstore shampoos contain harsh sulfates that strip hair cuticle bonds and cause premature shedding. Always stick to salon-grade, silicone-free cleansers.'
        },
        {
          title: 'Nightly Friction Defense',
          description: 'Cotton pillowcases create micro-friction that leads to tangling and matting at the roots. A loose low braid and silk scrunchie will preserve your hair texture.'
        },
        {
          title: 'Hydration Where It Counts',
          description: 'Extension hair does not receive natural sebum from your scalp. Apply 1–2 drops of serum to mid-shaft and ends daily before styling.'
        }
      ],
      ctaButton: {
        text: 'Shop Salon-Approved Care & Wefts ➔',
        url: brand.websiteUrl || 'https://mysalonstore.com'
      },
      signOff: 'With love and gorgeous hair,\nYour Master Stylist Team',
      psNote: 'P.S. Need a color match or have questions? Simply reply directly to this email and our stylists will help you choose your exact shade!'
    };

    return {
      title: `VIP Newsletter: ${topic}`,
      content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
      format: 'newsletter',
      tags: [...tags, '#SalonCare', '#ExtensionVIP'],
      emailCampaign
    };
  }

  if (brand.category === 'community') {
    const emailCampaign: EmailCampaign = {
      subjectLines: [
        { type: 'curiosity', text: `Bo, ¿te enteraste de esto que se está hablando? 🧉` },
        { type: 'direct', text: `El boletín de la semana en Uruguay Conecta 🇺🇾` },
        { type: 'benefit', text: `Las mejores historias y debates charrúas de estos días` }
      ],
      previewText: 'Poné la caldera, aprontá el mate y mirá lo que pasó esta semana.',
      headline: `La Ronda Semanal: ${topic}`,
      greeting: '¡Buenas y santas, paisano!',
      intro: `Esperamos que andes bien y con el mate a mano. En la comunidad de Uruguay Conecta se armaron charlas increíbles esta semana sobre ${topic.toLowerCase()}.\n\nAcá te dejamos el resumen de lo más destacado para leer tranquilo:`,
      keyPoints: [
        {
          title: 'El Gran Debate De La Semana',
          description: 'Historias de uruguayos que viven en el exterior y los rincones de nuestro país que más extrañan.'
        },
        {
          title: 'Comunidad en Crecimiento',
          description: 'Nuevas salas de charla abiertas por departamento: desde Colonia y Maldonado hasta Salto y Rivera.'
        }
      ],
      ctaButton: {
        text: 'Entrá a Uruguay Conecta y Sumate al Debate ➔',
        url: brand.websiteUrl || 'https://uruguayconecta.uy'
      },
      signOff: '¡Un abrazo grande y nos vemos en la plataforma!\nEl equipo de Uruguay Conecta',
      psNote: 'P.D. ¿Tenés una anécdota o foto para compartir? Entrá a la app y subila hoy.'
    };

    return {
      title: `Boletín: ${topic}`,
      content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
      format: 'newsletter',
      tags: [...tags, '#ComunidadUY', '#UruguayConecta'],
      emailCampaign
    };
  }

  // Default SaaS / WebApp / Games
  const emailCampaign: EmailCampaign = {
    subjectLines: [
      { type: 'curiosity', text: `How we solved this bottleneck in ${brand.name} 🚀` },
      { type: 'direct', text: `Product Update: Deep dive into ${topic}` },
      { type: 'benefit', text: `Speed up your workflow today with ${topic}` }
    ],
    previewText: 'A quick look at our latest engineering updates and practical tips.',
    headline: `Inside ${brand.name}: ${topic}`,
    greeting: 'Hi there,',
    intro: `We have been busy shipping new improvements across ${brand.name}. Today, we want to dive into ${topic.toLowerCase()} and show you how to get the most out of your experience:`,
    keyPoints: [
      {
        title: 'Built For Maximum Speed',
        description: 'We refactored our core engine to deliver instant response times without bloated navigation.'
      },
      {
        title: 'Seamless Collaboration & Utility',
        description: 'Everything is designed to keep you in flow state so you spend less time configuring and more time building.'
      }
    ],
    ctaButton: {
      text: `Launch ${brand.name} Now ➔`,
      url: brand.websiteUrl || 'https://example.com'
    },
    signOff: `Keep building,\nThe ${brand.name} Team`,
    psNote: 'Have feedback or a feature request? Reply directly to this email—we read every response.'
  };

  return {
    title: `Product Newsletter: ${topic}`,
    content: `${emailCampaign.headline}\n\n${emailCampaign.intro}`,
    format: 'newsletter',
    tags: [...tags, '#ProductUpdate', '#Changelog'],
    emailCampaign
  };
}
