import { Brand, Post, Contact } from '../types/brand';

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'brand-salon',
    name: 'Artisan Hair Salon & Spa',
    slug: 'artisan-salon',
    tagline: 'High-end styling, dimensional color, and transformative hair care',
    category: 'salon',
    websiteUrl: 'https://mysalonstore.com',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="%237c3aed"/><text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="46" fill="%23ffffff" text-anchor="middle">A</text></svg>',
    typography: 'Playfair Display',
    primaryColor: '#7c3aed', // Purple/Violet
    secondaryColor: '#f5f3ff',
    textColor: '#ffffff',
    logoEmoji: '💇‍♀️',
    voicePersona: 'Warm, welcoming, expert, and trend-conscious. Sounds like your favorite master stylist giving friendly, confident advice on hair health and modern trends.',
    targetAudience: 'Local salon clients, women 22-55 seeking luxury color, balayage, cuts, and premium hair treatments.',
    defaultChannels: ['instagram', 'facebook', 'tiktok', 'pinterest'],
    commonHashtags: ['#SalonVibes', '#BalayageSpecialist', '#HealthyHairJourney', '#HairTransformation', '#StylistLife'],
    socialConnections: {
      instagram: {
        channel: 'instagram',
        accountHandle: '@artisanhairspa',
        accountName: 'Artisan Hair Salon & Spa',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-25T10:00:00Z'
      },
      facebook: {
        channel: 'facebook',
        accountHandle: 'ArtisanHairSpa',
        accountName: 'Artisan Hair Studio',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-25T10:00:00Z'
      },
      pinterest: {
        channel: 'pinterest',
        accountHandle: '@artisansalonlooks',
        accountName: 'Artisan Hair Inspo',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-25T10:00:00Z'
      }
    },
    suggestedTopics: [
      '3 signs your toner is fading and how to refresh it at home',
      'Before & After: 4-hour dimensional blonde transformation',
      'Why sulfate-free shampoo is non-negotiable after a salon gloss',
      'Behind the chair: What to ask for during your next consultation'
    ]
  },
  {
    id: 'brand-extensions',
    name: 'Crown & Weft Hair Extensions',
    slug: 'crown-weft',
    tagline: '100% Remy human hair extensions, seamless wefts & tape-ins',
    category: 'extensions',
    websiteUrl: 'https://crownandweft.com',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="%23b45309"/><text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="%23ffffff" text-anchor="middle">CW</text></svg>',
    typography: 'Cinzel',
    primaryColor: '#b45309', // Warm bronze/gold
    secondaryColor: '#fffbeb',
    textColor: '#ffffff',
    logoEmoji: '✨',
    voicePersona: 'Ultra-luxurious, aspirational, authoritative, and empowering. Focuses on density, length, invisible blends, and confidence.',
    targetAudience: 'Women wanting instant volume/length, brides, extension lovers, and professional stylists looking for wholesale wefts.',
    defaultChannels: ['instagram', 'tiktok', 'pinterest', 'youtube'],
    commonHashtags: ['#HairExtensions', '#HandTiedWefts', '#InvisibleBeadExtensions', '#TapeInExtensions', '#LuxuryHair'],
    socialConnections: {
      instagram: {
        channel: 'instagram',
        accountHandle: '@crownandweft',
        accountName: 'Crown & Weft Luxury Hair',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-26T12:00:00Z'
      },
      tiktok: {
        channel: 'tiktok',
        accountHandle: '@crownwefthair',
        accountName: 'Crown & Weft Extensions',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-26T12:00:00Z'
      },
      pinterest: {
        channel: 'pinterest',
        accountHandle: '@crownandweftpins',
        accountName: 'Crown & Weft Hair Styles',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-26T12:00:00Z'
      }
    },
    suggestedTopics: [
      'How to tell if your hair extensions are 100% Remy human hair',
      'The 5-minute night routine that keeps extension bonds silky for months',
      'Hand-tied wefts vs. Tape-ins: Which method fits your natural hair type?',
      'Watch this color blend: Matching 22-inch honey blonde wefts live'
    ]
  },
  {
    id: 'brand-optioncove',
    name: 'OptionCove.com',
    slug: 'optioncove',
    tagline: 'Capital-first options scanner & income strategy visualizer',
    category: 'fintech',
    websiteUrl: 'https://optioncove.com',
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="%23059669"/><text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="%23ffffff" text-anchor="middle">OC</text></svg>',
    typography: 'Plus Jakarta Sans',
    primaryColor: '#059669', // Emerald/Finance Green
    secondaryColor: '#ecfdf5',
    textColor: '#ffffff',
    logoEmoji: '📈',
    voicePersona: 'Data-driven, sharp, disciplined, and educational. Emphasizes risk management, probability of profit, cash-secured puts, and the Wheel strategy over reckless gambling.',
    targetAudience: 'Retail options traders, dividend and income investors, crypto/stock traders selling premium with \$1k–\$50k accounts.',
    defaultChannels: ['twitter', 'linkedin', 'youtube', 'instagram'],
    commonHashtags: ['#OptionsTrading', '#CashSecuredPuts', '#TheWheelStrategy', '#ThetaGang', '#PassiveIncome'],
    socialConnections: {
      twitter: {
        channel: 'twitter',
        accountHandle: '@optioncove',
        accountName: 'OptionCove Options Scanner',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-27T08:30:00Z'
      },
      linkedin: {
        channel: 'linkedin',
        accountHandle: 'optioncove',
        accountName: 'OptionCove Technologies',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-27T08:30:00Z'
      },
      youtube: {
        channel: 'youtube',
        accountHandle: '@OptionCoveIncome',
        accountName: 'OptionCove Capital Strategies',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-27T08:30:00Z'
      }
    },
    suggestedTopics: [
      'Stop buying OTM lotto calls: Why 85% of options expire worthless',
      'How to sell Cash-Secured Puts on \$3,000 capital without getting wrecked',
      'The 3 rules for picking strikes that beat 20% annualized yields safely',
      'Why Implied Volatility Rank (IVR) matters more than the stock price'
    ]
  },
  {
    id: 'brand-evidraw',
    name: 'Evidraw',
    slug: 'evidraw',
    tagline: 'Build lottery portfolios for Canadian games and U.S. Powerball, explore strategies in the Learning Lab, and track results against random.',
    category: 'lottery-gaming-tools',
    websiteUrl: 'https://evidraw.com',
    websiteScreenshotUrl: 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png', // 9:16 Mobile View for TikTok / Reels / Shorts
    websiteMobileScreenshotUrl: 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png', // 780x1688 Mobile Retina
    websiteDesktopScreenshotUrl: 'https://iad.microlink.io/nfv2YSyw2IdqIuytn42cgY4Lp1MEr9Uel-bHgspkTGU3HzZclPJvIcxZto1OLKM2n1BkonoirBEhouy3qN-zaw.png', // 2560x1600 Desktop Widescreen
    brandAssets: [
      {
        id: 'evidraw_mobile_app_screenshot',
        name: '📱 Mobile App View (9:16 TikTok / Reels)',
        type: 'screenshot',
        viewport: 'mobile',
        url: 'https://iad.microlink.io/8cqABHIJQGemINk0-PISCSUTl2kEAw63vIjNXYJ6Kq0E8PYe94S1nj1VBftlbcGYfll3GD7WWGEnwaT90WNz-g.png',
        label: '📱 Evidraw Mobile View (9:16)'
      },
      {
        id: 'evidraw_desktop_screenshot',
        name: '💻 Desktop Browser View (16:9 YouTube)',
        type: 'screenshot',
        viewport: 'desktop',
        url: 'https://iad.microlink.io/nfv2YSyw2IdqIuytn42cgY4Lp1MEr9Uel-bHgspkTGU3HzZclPJvIcxZto1OLKM2n1BkonoirBEhouy3qN-zaw.png',
        label: '💻 Evidraw Desktop View (16:9)'
      },
      {
        id: 'evidraw_og_hero',
        name: 'Evidraw Portfolio & Learning Lab Diagram',
        type: 'hero',
        viewport: 'desktop',
        url: 'https://evidraw.com/og.png',
        label: 'Portfolio Architecture Diagram'
      },
      {
        id: 'evidraw_app_icon',
        name: 'Evidraw Official Vector Icon',
        type: 'logo',
        url: 'https://evidraw.com/brand/evidraw-app-icon.svg',
        label: 'Evidraw Vector Icon'
      }
    ],
    logoUrl: 'https://evidraw.com/brand/evidraw-app-icon.svg',
    primaryColor: '#0b1930', // Evidraw Navy
    secondaryColor: '#0f172a',
    textColor: '#ffffff',
    typography: 'Geist',
    logoEmoji: '🎟️',
    voicePersona: 'Analytical, evidence-first, disciplined, and objective. Breaks down probability, portfolio strategies, and real draw tracking without deceptive get-rich-quick hype. Educational and transparent.',
    targetAudience: 'Lottery players, probability enthusiasts, syndicates, and data-minded individuals looking to build disciplined number portfolios and measure outcomes honestly against random odds.',
    defaultChannels: ['twitter', 'instagram', 'linkedin'],
    commonHashtags: [
      '#Evidraw',
      '#Lottery',
      '#Powerball',
      '#LottoStrategies',
      '#LotteryTools',
      '#SmartPlay',
      '#LottoMax',
      '#Lotto649',
      '#Probability',
      '#LotteryAnalytics'
    ],
    socialConnections: {
      twitter: {
        channel: 'twitter',
        accountHandle: '@Evidrawofficial',
        accountName: 'Evidraw Official',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-27T14:00:00Z'
      },
      instagram: {
        channel: 'instagram',
        accountHandle: '@evidraw_official',
        accountName: 'Evidraw Official',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-27T14:00:00Z'
      }
    },
    suggestedTopics: [
      'How building a diversified lottery portfolio compares against quick-pick random tickets',
      'The mathematics of Powerball & Lotto Max: What the Learning Lab reveals about odds',
      '3 common lottery number selection myths debunked by historical draw data',
      'How Evidraw tracks your pre-draw numbers against official results with zero bias'
    ]
  },
  {
    id: 'brand-varbona',
    name: 'Varbona',
    slug: 'varbona',
    tagline: 'Scout real football players, trade player shares with play-money credits, and build your fantasy XI.',
    category: 'gaming',
    websiteUrl: 'https://varbona.com',
    websiteScreenshotUrl: 'https://iad.microlink.io/AaPvcvMN7HITD6LobOa-aF_FN7_7WC5X-34vXizM5VfTQxfnBhzwnaLmH9brUdizQIy0lqs7U_7m7iCVNiq-Lw.png',
    websiteMobileScreenshotUrl: 'https://iad.microlink.io/AaPvcvMN7HITD6LobOa-aF_FN7_7WC5X-34vXizM5VfTQxfnBhzwnaLmH9brUdizQIy0lqs7U_7m7iCVNiq-Lw.png',
    websiteDesktopScreenshotUrl: 'https://iad.microlink.io/ACYs_juUhBXUJ9l5A9catynz8EitEHRayqN4IZOuUK_wLQUGKoh_hLCLE0dbzw-h3nC4xF1IVUWYbYSuXCj7Jg.png',
    brandAssets: [
      {
        id: 'varbona_mobile_app_screenshot',
        name: '📱 Varbona Mobile App View (9:16 Pitch & Player Market)',
        type: 'screenshot',
        viewport: 'mobile',
        url: 'https://iad.microlink.io/AaPvcvMN7HITD6LobOa-aF_FN7_7WC5X-34vXizM5VfTQxfnBhzwnaLmH9brUdizQIy0lqs7U_7m7iCVNiq-Lw.png',
        label: '📱 Varbona Mobile Pitch & Market (9:16)',
        routePath: '/',
        uiSummary: 'Varbona Football Portfolio & Lamine Yamal 125.00 CR (+4.2%) Player Market Card',
        tutorialStepSuggestion: 'First, open the Varbona Player Market to scout breakout stars like Lamine Yamal at 125 credits per share and track their live 1-month price movement.'
      },
      {
        id: 'varbona_desktop_screenshot',
        name: '💻 Varbona Desktop View (16:9 Football Portfolio & Pitch)',
        type: 'screenshot',
        viewport: 'desktop',
        url: 'https://iad.microlink.io/ACYs_juUhBXUJ9l5A9catynz8EitEHRayqN4IZOuUK_wLQUGKoh_hLCLE0dbzw-h3nC4xF1IVUWYbYSuXCj7Jg.png',
        label: '💻 Varbona Football Portfolio (16:9)',
        routePath: '/',
        uiSummary: 'Build your football portfolio: 01 Scout, 02 Build XI, 03 Compete + Free Play-Money Beta signup',
        tutorialStepSuggestion: 'Next, buy at least one share of any player to unlock them for your owned Fantasy XI pitch lineup.'
      },
      {
        id: 'varbona_players_market_screenshot',
        name: '⚽ Varbona Player Market & Wonderkid Scouting (/players)',
        type: 'screenshot',
        viewport: 'desktop',
        url: 'https://iad.microlink.io/bRkUPVWQyVPJJwGvlkZlpasMcW-r7YNaGlIJsdyB8_HHbz9fnRweBDa2ykbfWTqu5Xe8tf3VyeghO2ES-OcWPQ.png',
        label: '⚽ Player Market Board (/players)',
        routePath: '/players',
        uiSummary: 'Live football player market catalog with position filters, share prices in CR, and form trends',
        tutorialStepSuggestion: 'Filter the Player Market by forwards, midfielders, and defenders to spot undervalued wonderkids before matchday.'
      },
      {
        id: 'varbona_how_it_works_screenshot',
        name: '📊 How Varbona Works: Scout • Build XI • Compete (/how-it-works)',
        type: 'screenshot',
        viewport: 'desktop',
        url: 'https://iad.microlink.io/tOSwxMxH3CGWW-cs4kVyybqE8cpSg-XrmZ3FOWYlT9EMiEE3LnyNDPxPBziO8i2Nwt2EW_U_2zvZRkNwipTvUA.png',
        label: '📊 How Varbona Works (/how-it-works)',
        routePath: '/how-it-works',
        uiSummary: 'Step-by-step breakdown of Varbona play-money credits, player share trading, and fantasy XI scoring',
        tutorialStepSuggestion: 'Finally, lock in your 11 owned players before kickoff and compete on the leaderboard while your play-money portfolio carries over after beta.'
      }
    ],
    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="26" fill="%230f172a"/><text x="50" y="67" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="%23b9f566" text-anchor="middle">V</text></svg>',
    typography: 'Plus Jakarta Sans',
    primaryColor: '#b9f566', // Pitch Lime
    secondaryColor: '#0f172a', // Stadium Navy
    textColor: '#000000',
    logoEmoji: '⚽',
    voicePersona: 'High-energy, football-obsessed, tactical, and competitive. Combines deep scouting knowledge with the excitement of fantasy player trading. Speaks directly to passionate fans building their ultimate fantasy XI squad.',
    targetAudience: 'Passionate football fans, fantasy managers, football card collectors, and tactical gamers who want to scout players, trade player shares, and compete with their fantasy XI.',
    defaultChannels: ['twitter', 'instagram', 'tiktok', 'youtube'],
    commonHashtags: ['#Varbona', '#FantasyFootball', '#FootballTrading', '#FantasySports', '#ScoutPlayers', '#FantasyXI', '#FootballManager', '#MatchDay', '#FutbolFantasy', '#WonderkidScout'],
    socialConnections: {
      twitter: {
        channel: 'twitter',
        accountHandle: '@varbona_game',
        accountName: 'Varbona Fantasy Football',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:00:00Z'
      },
      instagram: {
        channel: 'instagram',
        accountHandle: '@varbona.fc',
        accountName: 'Varbona FC Official',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:00:00Z'
      },
      tiktok: {
        channel: 'tiktok',
        accountHandle: '@varbonasports',
        accountName: 'Varbona Wonderkid Scouting',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:00:00Z'
      },
      youtube: {
        channel: 'youtube',
        accountHandle: '@VarbonaOfficial',
        accountName: 'Varbona Fantasy & Player Trading',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:00:00Z'
      }
    },
    suggestedTopics: [
      'Top 3 breakout wonderkids to scout and trade before Gameweek 15',
      'Why trading player shares based on real-life match form beats traditional fantasy leagues',
      'Watch this transfer scout: How one breakout game doubled this winger\'s market value',
      'How to build an elite Fantasy XI on Varbona without burning your transfer budget'
    ]
  },
  {
    id: 'brand-uruguay-social',
    name: 'Uruguay Conecta',
    slug: 'uruguay-conecta',
    tagline: 'La red social y comunidad digital hecha por y para Uruguayos',
    category: 'community',
    websiteUrl: 'https://uruguayconecta.uy',
    primaryColor: '#0284c7', // Sky Blue / Celeste Uruguaya
    secondaryColor: '#f0f9ff',
    textColor: '#ffffff',
    logoEmoji: '🇺🇾',
    voicePersona: 'Cercano, bien uruguayo, simpático y espontáneo. Usa voseo rioplatense auténtico ("bo", "che", "mirá", "ta bárbaro"), referencias al mate, la rambla, el fútbol y la vida cotidiana.',
    targetAudience: 'Uruguayos en el país y en el exterior (diáspora), jóvenes y adultos buscando conectarse, compartir anécdotas, debates y cultura charrúa.',
    defaultChannels: ['twitter', 'instagram', 'tiktok', 'facebook'],
    commonHashtags: ['#Uruguay', '#CulturaCharrúa', '#Montevideo', '#UruguayosPorElMundo', '#RedSocialUY'],
    socialConnections: {
      twitter: {
        channel: 'twitter',
        accountHandle: '@uruguayconecta',
        accountName: 'Uruguay Conecta',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:30:00Z'
      },
      instagram: {
        channel: 'instagram',
        accountHandle: '@uruguayconecta.uy',
        accountName: 'Uruguay Conecta Red Social',
        isConnected: true,
        isSandbox: true,
        connectedAt: '2026-10-28T09:30:00Z'
      }
    },
    suggestedTopics: [
      '¿Termo bajo el brazo o mate en la mesa? El debate definitivo uruguayo',
      'Historias de uruguayos viviendo afuera: Lo que más se extraña además del dulce de leche',
      'Nueva función en la plataforma: Salas de debate por departamentos',
      'Unite a la comunidad: Sin algoritmos raros, charlas de verdad'
    ]
  },
  {
    id: 'brand-games',
    name: 'Arcade & Play-to-Earn Games',
    slug: 'arcade-games',
    tagline: 'Fast-paced arcade games with real tangible rewards & leaderboards',
    category: 'gaming',
    websiteUrl: 'https://arcadegames.gg',
    primaryColor: '#db2777', // Cyberpunk Pink
    secondaryColor: '#fdf2f8',
    textColor: '#ffffff',
    logoEmoji: '🕹️',
    voicePersona: 'Hype, gamer-fluent, playful, competitive, and transparent. High energy, loves memes, boss battles, high scores, and community tournaments.',
    targetAudience: 'Casual gamers, arcade enthusiasts, crypto gamers, competitive leaderboard climbers.',
    defaultChannels: ['tiktok', 'youtube', 'twitter', 'facebook'],
    commonHashtags: ['#GamingCommunity', '#IndieGameDev', '#ArcadeGames', '#PlayToEarn', '#Speedrun'],
    suggestedTopics: [
      'Only 0.4% of players beat Level 9: Can you dodge the neon laser grid?',
      'Weekly Tournament Leaderboard: Who is taking home the top prize on Sunday?',
      'Behind the code: How we designed the physics engine for our new arcade release',
      'Gameplay teaser: 15 seconds of pure adrenaline gameplay'
    ]
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    brandId: 'brand-optioncove',
    title: 'The Real Truth About Selling Cash-Secured Puts',
    format: 'carousel',
    status: 'scheduled',
    scheduledFor: '2026-10-29T14:00:00Z',
    channels: ['linkedin', 'twitter', 'instagram'],
    tags: ['#OptionsTrading', '#TheWheelStrategy', '#IncomeInvesting'],
    content: 'Stop treating the stock market like a casino. When you buy calls, time is your enemy. When you sell cash-secured puts, time works for you every single day.',
    carouselSlides: [
      {
        title: 'How to Collect Income by Selling Puts',
        subtitle: 'The Strategy Wall Street Doesn\'t Teach Beginners',
        body: 'Instead of buying a stock at full price, what if someone paid YOU cash today just for agreeing to buy it at a discount later?',
        highlightText: 'Time Decay = Your Profit'
      },
      {
        title: 'Step 1: Pick a Stock You Actually Want',
        subtitle: 'Never sell puts on garbage tickers',
        body: 'Rule #1: Only write contracts on companies you would happily hold for the next 2 years if assigned.',
        highlightText: 'Strong balance sheets only'
      },
      {
        title: 'Step 2: Choose Your Strike & Expiration',
        subtitle: 'The 30-45 DTE Sweet Spot',
        body: 'Target a delta between 0.15 and 0.25. This gives you a statistical 75% to 85% probability of keeping 100% of the premium.',
        highlightText: 'Theta decay accelerates under 45 days'
      },
      {
        title: 'Step 3: The 2 Possible Outcomes',
        subtitle: 'Win / Win Scenario',
        body: 'Outcome A: Stock stays above strike -> You keep 100% of the cash.\nOutcome B: Stock drops -> You buy the shares at your chosen discount price.',
        highlightText: 'You dictate your entry price'
      },
      {
        title: 'Scan Capital-Efficient Puts on OptionCove',
        subtitle: 'No more guessing math',
        body: 'Input your cash balance on OptionCove.com and instantly scan contracts filtered by IV rank, delta, and annualized yield.',
        highlightText: 'Try OptionCove Free'
      }
    ],
    createdAt: '2026-10-28T09:00:00Z'
  },
  {
    id: 'post-2',
    brandId: 'brand-extensions',
    title: 'How to Prevent Hair Extension Matting at Night',
    format: 'video_script',
    status: 'scheduled',
    scheduledFor: '2026-10-29T18:30:00Z',
    channels: ['tiktok', 'instagram', 'youtube'],
    tags: ['#HairExtensions', '#ExtensionCare', '#LuxuryHair'],
    content: 'The 2-minute nightly routine every extension wearer must do before bed to prevent tangles and make wefts last 9+ months.',
    videoScript: {
      hook: 'If you go to sleep like this with hair extensions, you are ruining $500 of hair right now.',
      visualCue: 'Close-up of messy, loose wet hair vs. perfectly silk-wrapped braid.',
      scenes: [
        {
          timestamp: '0:00 - 0:03',
          visual: 'Shocking clip of tangled bonds vs silky hair.',
          audio: 'Stop sleeping with your extensions loose! Here is the 2-minute routine that saves your investment.'
        },
        {
          timestamp: '0:04 - 0:12',
          visual: 'Stylist brushing hair from ends upward with an extension loop brush.',
          audio: 'Step 1: Always brush thoroughly starting from the bottom up. Never tug directly on the weft seam.'
        },
        {
          timestamp: '0:13 - 0:22',
          visual: 'Applying 1 drop of lightweight silicone-free serum to the mid-lengths and ends.',
          audio: 'Step 2: Hydrate the ends with a clean serum. Remember, extension hair doesn\'t get natural scalp oils!'
        },
        {
          timestamp: '0:23 - 0:30',
          visual: 'Quick loose French braid secured with a silk scrunchie on a silk pillowcase.',
          audio: 'Step 3: A loose low braid + silk scrunchie. Zero friction, zero matting. Wake up with smooth waves.'
        }
      ],
      cta: 'Save this video and shop our 100% Remy hand-tied wefts at the link in bio!'
    },
    createdAt: '2026-10-28T10:15:00Z'
  },
  {
    id: 'post-3',
    brandId: 'brand-uruguay-social',
    title: 'El Debate Definitivo del Mate Uruguayo',
    format: 'single',
    status: 'draft',
    scheduledFor: '2026-10-30T12:00:00Z',
    channels: ['twitter', 'instagram'],
    tags: ['#Uruguay', '#Mate', '#CostumbresUruguayas'],
    content: 'Pregunta seria para la comunidad de Uruguay Conecta:\n\n¿Sos de los que no pueden salir a la esquina sin el termo abajo del brazo aunque hagan 35 grados a la sombra, o solo tomás en casa tranqui?\n\nDejanos tu foto cebando el mejor mate del día en los comentarios de la app. 🧉🇺🇾',
    createdAt: '2026-10-28T10:20:00Z'
  },
  {
    id: 'post-4',
    brandId: 'brand-optioncove',
    title: 'The Weekly Theta Brief: Volatility Spikes & Safe Put Strikes',
    format: 'newsletter',
    status: 'scheduled',
    scheduledFor: '2026-11-01T13:00:00Z',
    channels: ['twitter', 'linkedin'],
    tags: ['#EmailNewsletter', '#OptionCoveDigest', '#ThetaGang'],
    content: 'The Weekly Theta Brief: How to navigate recent earnings volatility using Cash-Secured Puts on high-quality tickers without risking assignment.',
    emailCampaign: {
      subjectLines: [
        { type: 'curiosity', text: 'Why 85% of options expire worthless (and how to profit) 📈' },
        { type: 'direct', text: 'OptionCove Weekly: Safe Put Strikes for November' },
        { type: 'benefit', text: 'How we target 20%+ annualized yields on cash reserves' }
      ],
      previewText: 'Stop gambling on out-of-the-money calls. Here is our risk-managed playbook.',
      headline: 'The Weekly Theta Brief: Cash-First Options Strategy',
      greeting: 'Hey Trader,',
      intro: 'Most retail investors look at stock market pullbacks with panic. As options sellers, elevated volatility rank means one thing: option buyers are overpaying for downside insurance, handing you larger upfront cash premiums.\n\nHere is how we are structuring cash-secured put trades this week:',
      keyPoints: [
        {
          title: '1. Delta 0.15–0.20 Margin of Safety',
          description: 'Never sell at-the-money puts unless you actively want assignment today. An 0.15 delta gives an 85% statistical cushion.'
        },
        {
          title: '2. Check Earnings Dates First',
          description: 'Selling puts into binary earnings reports is gambling. Always scan for expiration cycles that land after earnings or maintain 30+ DTE.'
        },
        {
          title: '3. Take Profits at 50% Max Return',
          description: 'Do not wait for the last 5% of theta decay. Close early, eliminate tail risk, and redeploy collateral.'
        }
      ],
      ctaButton: {
        text: 'Scan Filtered Put Contracts on OptionCove ➔',
        url: 'https://optioncove.com'
      },
      signOff: 'Trade with discipline,\nThe OptionCove Research Desk',
      psNote: 'P.S. We just added real-time earnings calendar guards to the scanner. Filter out high-risk earnings dates in 1 click.'
    },
    createdAt: '2026-10-28T10:30:00Z'
  },
  {
    id: 'post-varbona-1',
    brandId: 'brand-varbona',
    title: '3 Wonderkid Midfielders Breaking Out in Gameweek 15',
    format: 'thread',
    status: 'published',
    scheduledFor: '2026-10-29T11:00:00Z',
    publishedAt: '2026-10-29T11:00:00Z',
    channels: ['twitter', 'instagram'],
    tags: ['#Varbona', '#FantasyFootball', '#WonderkidScout', '#ScoutPlayers'],
    content: 'Scouting report: 3 low-cap midfielders primed for massive value increases on Varbona before Sunday kickoff.',
    threadTweets: [
      'Scouting report: 3 low-cap midfielders primed for massive share value spikes on @varbona_game before Sunday kickoff ⚽📈 🧵👇',
      '1/ Lucas Beraldo (20yo). Progressive passing in the 94th percentile. At 450 credits/share, his risk/reward ratio is criminal.',
      '2/ Mateo Gomez (19yo). Starting 3 straight matches as an inverted #8. Expected goal contributions up 40% over the last 3 weeks.',
      '3/ Ready to scout and trade player shares with zero financial deposit? Build your XI on Varbona.com today.'
    ],
    publishedUrls: {
      twitter: 'https://x.com/varbona_game/status/1982736450123984',
      instagram: 'https://instagram.com/p/DB7x910Varbona'
    },
    publishLogs: [
      {
        channel: 'twitter',
        status: 'success',
        timestamp: '2026-10-29T11:00:02Z',
        message: 'Published directly to X/Twitter (@varbona_game)',
        permalink: 'https://x.com/varbona_game/status/1982736450123984'
      },
      {
        channel: 'instagram',
        status: 'success',
        timestamp: '2026-10-29T11:00:05Z',
        message: 'Published carousel slide preview to Instagram (@varbona.fc)',
        permalink: 'https://instagram.com/p/DB7x910Varbona'
      }
    ],
    createdAt: '2026-10-28T12:00:00Z'
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  // OptionCove Contacts
  {
    id: 'contact-oc-1',
    brandId: 'brand-optioncove',
    email: 'marcus.v@fintechtraders.com',
    firstName: 'Marcus',
    lastName: 'Vance',
    tags: ['#ActiveTrader', '#CashSecuredPuts', '#ProTier'],
    source: 'webhook',
    status: 'subscribed',
    createdAt: '2026-10-25T11:20:00Z'
  },
  {
    id: 'contact-oc-2',
    brandId: 'brand-optioncove',
    email: 'david.kim92@gmail.com',
    firstName: 'David',
    lastName: 'Kim',
    tags: ['#WheelStrategy', '#IncomeInvestor'],
    source: 'csv',
    status: 'subscribed',
    createdAt: '2026-10-26T14:15:00Z'
  },
  {
    id: 'contact-oc-3',
    brandId: 'brand-optioncove',
    email: 'elena.rostova@traderdesk.io',
    firstName: 'Elena',
    lastName: 'Rostova',
    tags: ['#HighIVScanner', '#ThetaDecay'],
    source: 'manual',
    status: 'subscribed',
    createdAt: '2026-10-27T09:40:00Z'
  },

  // Crown & Weft Hair Extensions (Shopify)
  {
    id: 'contact-cw-1',
    brandId: 'brand-extensions',
    email: 'amanda.miller@icloud.com',
    firstName: 'Amanda',
    lastName: 'Miller',
    tags: ['#ShopifyBuyer', '#HandTiedWefts', '#22InchBlonde', '#VIPBuyer'],
    source: 'shopify',
    status: 'subscribed',
    ordersCount: 3,
    totalSpent: '$1,250.00',
    createdAt: '2026-10-20T16:30:00Z'
  },
  {
    id: 'contact-cw-2',
    brandId: 'brand-extensions',
    email: 'chloe.wright@luxurybeauty.co',
    firstName: 'Chloe',
    lastName: 'Wright',
    tags: ['#TapeIns', '#StylistWholesale', '#BrunetteBlend'],
    source: 'shopify',
    status: 'subscribed',
    ordersCount: 5,
    totalSpent: '$2,890.00',
    createdAt: '2026-10-22T10:12:00Z'
  },
  {
    id: 'contact-cw-3',
    brandId: 'brand-extensions',
    email: 'taylor.h@glamlook.net',
    firstName: 'Taylor',
    lastName: 'Hayes',
    tags: ['#NewsletterSignup', '#ColorMatchLead'],
    source: 'webhook',
    status: 'subscribed',
    createdAt: '2026-10-28T08:05:00Z'
  },

  // Artisan Hair Salon Contacts
  {
    id: 'contact-salon-1',
    brandId: 'brand-salon',
    email: 'sarah.jenkins@gmail.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    tags: ['#VIPClient', '#Balayage', '#GlossTreatment'],
    source: 'manual',
    status: 'subscribed',
    ordersCount: 8,
    totalSpent: '$1,920.00',
    createdAt: '2026-10-15T15:00:00Z'
  },
  {
    id: 'contact-salon-2',
    brandId: 'brand-salon',
    email: 'emily.davis@salonregular.com',
    firstName: 'Emily',
    lastName: 'Davis',
    tags: ['#ExtensionMoveUp', '#PurpleShampooBuyer'],
    source: 'csv',
    status: 'subscribed',
    ordersCount: 4,
    totalSpent: '$840.00',
    createdAt: '2026-10-18T12:45:00Z'
  },

  // Uruguay Conecta Contacts
  {
    id: 'contact-uy-1',
    brandId: 'brand-uruguay-social',
    email: 'gonzalo.silva@montevideo.com.uy',
    firstName: 'Gonzalo',
    lastName: 'Silva',
    tags: ['#Montevideo', '#ComunidadUY', '#MateLover'],
    source: 'webhook',
    status: 'subscribed',
    createdAt: '2026-10-24T18:20:00Z'
  },
  {
    id: 'contact-uy-2',
    brandId: 'brand-uruguay-social',
    email: 'lucia.cabrera@diaspora.org',
    firstName: 'Lucía',
    lastName: 'Cabrera',
    tags: ['#UruguayosEnElExterior', '#DebatesUY'],
    source: 'manual',
    status: 'subscribed',
    createdAt: '2026-10-27T21:10:00Z'
  }
];
