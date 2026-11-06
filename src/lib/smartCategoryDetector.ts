import { BrandCategory, CategoryDefinition } from '../types/brand';

export type { CategoryDefinition };

export const STANDARD_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'gaming',
    label: 'Fantasy Sports & Gaming (Football / P2E / Games)',
    emoji: '⚽',
    description: 'Fantasy football leagues, sports scouting, web3 games, multiplayer & esports',
    defaultHashtags: ['#FantasyFootball', '#GamingCommunity', '#TacticalScout', '#PlayToEarn', '#SquadGoals', '#Matchday'],
    suggestedColors: { primary: '#b9f566', secondary: '#0f172a' }
  },
  {
    id: 'fintech',
    label: 'Fintech & Trading (Options / Stocks / Crypto)',
    emoji: '📈',
    description: 'Options scanners, algorithmic trading, crypto assets, hedge funds & market data',
    defaultHashtags: ['#OptionsTrading', '#StockScanner', '#TradingAlpha', '#Fintech', '#MarketHedge', '#DayTrading'],
    suggestedColors: { primary: '#059669', secondary: '#0f172a' }
  },
  {
    id: 'extensions',
    label: 'Hair Extensions & Luxury Beauty Supply',
    emoji: '👑',
    description: 'Hand-tied wefts, Remy human hair, salon supply, clip-ins & professional hairpieces',
    defaultHashtags: ['#HairExtensions', '#RemyHair', '#HandTiedWefts', '#LuxuryHair', '#SalonQuality', '#HairGoals'],
    suggestedColors: { primary: '#b45309', secondary: '#18181b' }
  },
  {
    id: 'salon',
    label: 'Local Salon & Beauty Spa',
    emoji: '💇‍♀️',
    description: 'Hair stylists, balayage colorists, blowout bars, day spas & aesthetics clinics',
    defaultHashtags: ['#HairStylist', '#BalayageSpecialist', '#BlowoutBar', '#SalonVibes', '#HairTransformation', '#LocalSalon'],
    suggestedColors: { primary: '#7c3aed', secondary: '#18181b' }
  },
  {
    id: 'webapp',
    label: 'SaaS / Developer / Web App',
    emoji: '💻',
    description: 'Cloud software, developer platforms, AI tools, productivity suites & B2B SaaS',
    defaultHashtags: ['#SaaS', '#WebDev', '#TechStartup', '#CloudApp', '#ProductivityTool', '#AI'],
    suggestedColors: { primary: '#2563eb', secondary: '#0f172a' }
  },
  {
    id: 'community',
    label: 'Community / Regional Social Platform',
    emoji: '🧉',
    description: 'Regional cultural clubs, expat groups, local forums, creator hubs & membership networks',
    defaultHashtags: ['#CommunityFirst', '#LocalCulture', '#MembersClub', '#Networking', '#LatinVibes', '#Connect'],
    suggestedColors: { primary: '#0284c7', secondary: '#0f172a' }
  }
];

export const EXPANDED_PRESET_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'fitness',
    label: 'Fitness & Personal Training (Gym / CrossFit)',
    emoji: '🏋️‍♂️',
    description: 'Gyms, personal trainers, bodybuilding, yoga studios, HIIT & athletic coaching',
    defaultHashtags: ['#FitnessMotivation', '#GymLife', '#PersonalTrainer', '#WorkoutRoutine', '#HealthJourney', '#FitFam'],
    suggestedColors: { primary: '#f97316', secondary: '#18181b' }
  },
  {
    id: 'real-estate',
    label: 'Real Estate & Property Development',
    emoji: '🏡',
    description: 'Realtors, luxury home listings, architecture, residential & commercial property',
    defaultHashtags: ['#RealEstate', '#LuxuryHomes', '#RealtorLife', '#PropertyListing', '#DreamHome', '#HouseHunting'],
    suggestedColors: { primary: '#0d9488', secondary: '#0f172a' }
  },
  {
    id: 'food-beverage',
    label: 'Food, Beverage & Specialty Coffee',
    emoji: '☕',
    description: 'Artisan cafes, specialty coffee roasters, restaurants, bakeries & dining spots',
    defaultHashtags: ['#SpecialtyCoffee', '#FoodieLife', '#LocalEats', '#CoffeeRoaster', '#CulinaryArt', '#FoodLovers'],
    suggestedColors: { primary: '#92400e', secondary: '#18181b' }
  },
  {
    id: 'healthcare',
    label: 'Healthcare, Dental & Wellness Clinic',
    emoji: '🩺',
    description: 'Medical practices, dental clinics, physical therapy, holistic health & wellness',
    defaultHashtags: ['#Healthcare', '#DentalCare', '#WellnessJourney', '#PatientCare', '#HealthyLiving', '#Clinic'],
    suggestedColors: { primary: '#0891b2', secondary: '#0f172a' }
  },
  {
    id: 'pet-care',
    label: 'Pet Care, Grooming & Veterinary',
    emoji: '🐾',
    description: 'Dog grooming, veterinary clinics, pet boarding, canine training & accessories',
    defaultHashtags: ['#PetCare', '#DogGrooming', '#PetLovers', '#HappyPaws', '#VetClinic', '#DogsofInstagram'],
    suggestedColors: { primary: '#ea580c', secondary: '#18181b' }
  },
  {
    id: 'fashion',
    label: 'Fashion, Streetwear & Apparel',
    emoji: '👗',
    description: 'Clothing brands, designer streetwear, footwear, jewelry & sustainable apparel',
    defaultHashtags: ['#FashionBrand', '#Streetwear', '#OOTD', '#StyleInspiration', '#FashionDesign', '#CapsuleWardrobe'],
    suggestedColors: { primary: '#db2777', secondary: '#18181b' }
  },
  {
    id: 'travel',
    label: 'Travel, Hospitality & Tourism',
    emoji: '✈️',
    description: 'Boutique hotels, travel booking, tour guides, travel gear & luxury getaways',
    defaultHashtags: ['#TravelGram', '#Wanderlust', '#BoutiqueHotel', '#TravelGuide', '#VacationVibes', '#ExploreMore'],
    suggestedColors: { primary: '#0284c7', secondary: '#0f172a' }
  },
  {
    id: 'education',
    label: 'Education, E-Learning & Coaching',
    emoji: '🎓',
    description: 'Online academies, bootcamps, executive coaching, tutors & educational courses',
    defaultHashtags: ['#EdTech', '#OnlineLearning', '#SkillBuilding', '#Masterclass', '#CareerGrowth', '#LearnEveryday'],
    suggestedColors: { primary: '#4f46e5', secondary: '#0f172a' }
  },
  {
    id: 'legal',
    label: 'Legal Practice & Law Firm Services',
    emoji: '⚖️',
    description: 'Corporate law, injury attorneys, contract counsel, legal consultants & notaries',
    defaultHashtags: ['#LegalAdvice', '#LawFirm', '#AttorneyAtLaw', '#LegalCounsel', '#Justice', '#CorporateLaw'],
    suggestedColors: { primary: '#475569', secondary: '#0f172a' }
  },
  {
    id: 'creative-agency',
    label: 'Creative Agency & Design Studio',
    emoji: '🎨',
    description: 'Brand identity studios, marketing agencies, video production & visual design',
    defaultHashtags: ['#CreativeAgency', '#BrandIdentity', '#DesignStudio', '#VisualDesign', '#MarketingStrategy', '#ArtDirection'],
    suggestedColors: { primary: '#8b5cf6', secondary: '#0f172a' }
  },
  {
    id: 'automotive',
    label: 'Automotive & Car Detailing',
    emoji: '🏎️',
    description: 'Ceramic coating, car detailing, auto repair, performance tuning & dealership',
    defaultHashtags: ['#CarDetailing', '#AutoCare', '#CeramicCoating', '#CarCulture', '#Motorsport', '#CleanCars'],
    suggestedColors: { primary: '#dc2626', secondary: '#0f172a' }
  }
];

export const ALL_PRESET_CATEGORIES: CategoryDefinition[] = [
  ...STANDARD_CATEGORIES,
  ...EXPANDED_PRESET_CATEGORIES
];

// Keyword vectors for scoring
const KEYWORD_VECTORS: Record<string, string[]> = {
  gaming: [
    'football', 'fantasy', 'soccer', 'scout', 'squad', 'lineup', 'xi', 
    'striker', 'forward', 'pitch', 'roster', 'premier league', 'fifa', 
    'gameweek', 'match', 'play-money', 'futbol', 'wonderkid', 'game', 
    'gaming', 'p2e', 'guild', 'arcade', 'quest', 'rpg', 'esports', 'steam',
    'player shares', 'player market', 'fantasy game', 'fpl'
  ],
  fintech: [
    'options', 'strike', 'puts', 'calls', 'scanner', 'candlestick', 'broker', 
    'hedging', 'alpha', 'cove', 'equity', 'bank', 'investing', 'portfolio', 
    'algorithmic', 'crypto', 'bitcoin', 'ethereum', 'defi', 'stocks', 'wall street'
  ],
  extensions: [
    'extensions', 'wefts', 'remy', 'hand-tied', 'hand tied', 'cuticle', 
    'clip-in', 'tape-in', 'bundles', 'virgin hair', 'wigs', 'hairpiece', 'halo'
  ],
  salon: [
    'salon', 'hairdresser', 'stylist', 'blowout', 'balayage', 'haircut', 
    'spa', 'shampoo', 'scalp', 'keratin', 'colorist', 'beauty bar', 
    'hairstyles', 'drybar', 'hair', 'barber', 'lashes', 'cosmetics', 
    'glow', 'skin', 'wellness', 'facial', 'nails', 'manicure'
  ],
  fitness: [
    'fitness', 'gym', 'workout', 'crossfit', 'personal trainer', 'lifting', 
    'bodybuilding', 'hiit', 'pilates', 'yoga', 'athletics', 'strength', 
    'calisthenics', 'coach', 'nutrition', 'supplements', 'physique'
  ],
  'real-estate': [
    'real estate', 'realtor', 'property', 'properties', 'homes', 'housing', 
    'mortgage', 'brokerage', 'condo', 'penthouse', 'architecture', 'landlord', 
    'listings', 'realty', 'estate agent', 'open house'
  ],
  'food-beverage': [
    'coffee', 'cafe', 'roaster', 'espresso', 'bakery', 'restaurant', 'eats', 
    'bistro', 'brew', 'dining', 'culinary', 'chef', 'latte', 'pastry', 
    'organic food', 'wine', 'bar', 'cocktail', 'kitchen'
  ],
  healthcare: [
    'health', 'healthcare', 'clinic', 'dental', 'dentist', 'doctor', 'medical', 
    'physio', 'therapy', 'patient', 'wellness', 'hospital', 'orthodontics', 
    'teeth', 'medicine', 'pharma', 'pediatric'
  ],
  'pet-care': [
    'pet', 'dog', 'cat', 'puppy', 'veterinary', 'vet', 'grooming', 'canine', 
    'feline', 'doggy', 'paws', 'bark', 'boarding', 'animal shelter'
  ],
  fashion: [
    'fashion', 'clothing', 'apparel', 'streetwear', 'wear', 'outfit', 
    'boutique', 'designer', 'footwear', 'shoes', 'sneakers', 'hoodie', 
    'jewelry', 'couture', 'dresses', 'accessories'
  ],
  travel: [
    'travel', 'hotel', 'resort', 'flight', 'hospitality', 'vacation', 
    'tour', 'tourism', 'backpacking', 'wanderlust', 'destination', 
    'booking', 'hostel', 'getaway'
  ],
  education: [
    'course', 'academy', 'education', 'school', 'tutor', 'learning', 
    'bootcamp', 'university', 'curriculum', 'study', 'teaching', 'edtech', 
    'masterclass', 'instructor'
  ],
  legal: [
    'legal', 'lawyer', 'attorney', 'law firm', 'litigation', 'counsel', 
    'court', 'justice', 'contracts', 'paralegal', 'notary', 'trademark'
  ],
  'creative-agency': [
    'agency', 'creative studio', 'marketing', 'branding', 'design studio', 
    'advertising', 'digital agency', 'content creation', 'art direction', 'public relations'
  ],
  automotive: [
    'automotive', 'auto repair', 'car detailing', 'ceramic coating', 'cars', 
    'mechanic', 'motorsport', 'dealership', 'vehicles', 'engine', 'tinting', 'ppf'
  ],
  community: [
    'community', 'uruguay', 'montevideo', 'mate', 'rambla', 'latino', 
    'meetup', 'members', 'forum', 'club', 'local group', 'association', 
    'social network', 'alumni', 'gathering'
  ],
  webapp: [
    'saas', 'software', 'platform', 'api', 'cloud', 'dashboard', 'ai tool', 
    'workflow', 'automation', 'developer', 'b2b', 'analytics', 'vector', 
    'database', 'crm', 'sdk', 'bot', 'code', 'chrome extension'
  ]
};

// Common industry indicators for synthesizing a custom category
const INDUSTRY_PATTERNS: { regex: RegExp; name: string; emoji: string; primaryColor: string; tags: string[] }[] = [
  { 
    regex: /\b(lottery|lotto|powerball|mega\s*millions|lotto\s*max|lotto\s*649|jackpot|draw\s*tools?|lottery\s*portfolio|random\s*draws?|evidraw)\b/i, 
    name: 'Lottery & Gaming Tools', 
    emoji: '🎟️', 
    primaryColor: '#0b1930', 
    tags: ['#Evidraw', '#Lottery', '#Powerball', '#LottoStrategies', '#LotteryTools', '#SmartPlay', '#LottoMax', '#Lotto649', '#Probability', '#LotteryAnalytics'] 
  },
  { regex: /\b(solar|clean\s*energy|photovoltaic|renewable)\b/i, name: 'Solar & Renewable Energy', emoji: '☀️', primaryColor: '#eab308', tags: ['#SolarEnergy', '#CleanTech', '#Renewables', '#GreenEnergy'] },
  { regex: /\b(crypto|web3|blockchain|nft|defi|token)\b/i, name: 'Web3 & Crypto Ecosystem', emoji: '⚡', primaryColor: '#6366f1', tags: ['#Web3', '#CryptoCommunity', '#Blockchain', '#DeFi'] },
  { regex: /\b(interior\s*design|home\s*decor|furniture|architecture)\b/i, name: 'Interior Design & Architecture', emoji: '🛋️', primaryColor: '#78716c', tags: ['#InteriorDesign', '#HomeDecor', '#Architecture', '#ModernLiving'] },
  { regex: /\b(podcast|audio\s*production|sound\s*design|broadcast)\b/i, name: 'Podcast & Audio Network', emoji: '🎙️', primaryColor: '#a855f7', tags: ['#Podcasting', '#AudioProduction', '#CreatorEconomy', '#ListenNow'] },
  { regex: /\b(jewelry|jewels?|diamond|diamonds|watches?|luxury\s*goods)\b/i, name: 'Fine Jewelry & Luxury Timepieces', emoji: '💎', primaryColor: '#0ea5e9', tags: ['#FineJewelry', '#Diamonds', '#LuxuryWatches', '#HighJewelry'] },
  { regex: /\b(bakery|pastry|bread|cake|cakes|confectionery|doughnut|cookie)\b/i, name: 'Artisan Bakery & Pastry', emoji: '🥐', primaryColor: '#d97706', tags: ['#ArtisanBakery', '#FreshBakes', '#Sourdough', '#PastryChef'] },
  { regex: /\b(robotics|ai\s*agent|autonomous|machine\s*learning)\b/i, name: 'Robotics & Autonomous Systems', emoji: '🤖', primaryColor: '#06b6d4', tags: ['#Robotics', '#ArtificialIntelligence', '#Automation', '#TechInnovation'] },
  { regex: /\b(biotech|bio\s*tech|genomics|laboratory|life\s*sciences)\b/i, name: 'Biotech & Life Sciences', emoji: '🧬', primaryColor: '#10b981', tags: ['#Biotech', '#LifeSciences', '#Genomics', '#Innovation'] },
  { regex: /\b(security|cybersecurity|infosec|pentest|zero\s*trust)\b/i, name: 'Cybersecurity & Data Defense', emoji: '🛡️', primaryColor: '#ef4444', tags: ['#CyberSecurity', '#InfoSec', '#ZeroTrust', '#DataProtection'] },
  { regex: /\b(sustainability|eco-friendly|ecofriendly|recycle|recycling|green\s*living|zero\s*waste)\b/i, name: 'Sustainability & Eco-Products', emoji: '🌱', primaryColor: '#22c55e', tags: ['#Sustainability', '#EcoFriendly', '#ZeroWaste', '#GreenLiving'] },
  { regex: /\b(recruitment|staffing|talent|headhunter|hiring)\b/i, name: 'Talent Recruitment & HR Tech', emoji: '🤝', primaryColor: '#3b82f6', tags: ['#Recruitment', '#HiringNow', '#TalentAcquisition', '#HRTech'] },
  { regex: /\b(accounting|taxes?|cpa|bookkeeping|auditing)\b/i, name: 'Accounting & Tax Advisory', emoji: '📊', primaryColor: '#059669', tags: ['#CPA', '#TaxAdvisory', '#Accounting', '#FinancialPlanning'] },
  { regex: /\b(music\s*production|record\s*label|beats?|music\s*producer)\b/i, name: 'Music Production & Record Label', emoji: '🎵', primaryColor: '#ec4899', tags: ['#MusicProduction', '#NewMusic', '#RecordLabel', '#ProducerLife'] },
  { regex: /\b(photography|videography|cinematography|filmmaker)\b/i, name: 'Photography & Cinematography Studio', emoji: '📷', primaryColor: '#64748b', tags: ['#Photography', '#Cinematography', '#VisualArts', '#BehindTheLens'] }
];

function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.length <= 4) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }
  return text.includes(keyword);
}

export interface SmartDetectionResult {
  category: BrandCategory;
  categoryDef: CategoryDefinition;
  confidence: number;
  reason: string;
  isCustom: boolean;
  isAutoCreated: boolean;
}

/**
 * Detects the category of a brand from its text signals (name, tagline, website, description).
 * If the industry does not match existing presets, it automatically creates a new CategoryDefinition!
 */
export function detectBrandCategory(
  name: string,
  tagline: string = '',
  websiteUrl: string = '',
  extraContext: string = ''
): SmartDetectionResult {
  const corpus = `${name} ${tagline} ${websiteUrl} ${extraContext}`.toLowerCase();

  // 1. Check for Lottery & Draw Tools first (Evidraw, Powerball, lottery portfolios)
  const lotteryKeywords = [
    'lottery', 'lotto', 'powerball', 'mega millions', 'lotto max', 'lotto 649', 
    'jackpot', 'lottery portfolio', 'evidraw'
  ];
  let lotteryCount = 0;
  for (const w of lotteryKeywords) {
    if (matchesKeyword(corpus, w)) lotteryCount++;
  }

  if (lotteryCount >= 1 || name.toLowerCase().includes('evidraw') || corpus.includes('lottery') || corpus.includes('powerball')) {
    const lotteryDef: CategoryDefinition = {
      id: 'lottery-gaming-tools',
      label: 'Lottery & Gaming Tools',
      emoji: '🎟️',
      description: 'Lottery portfolio tools, draw analytics, probability strategies & number generators',
      defaultHashtags: [
        '#Evidraw', '#Lottery', '#Powerball', '#LottoStrategies', '#LotteryTools', 
        '#SmartPlay', '#LottoMax', '#Lotto649', '#Probability', '#LotteryAnalytics'
      ],
      suggestedColors: { primary: '#0b1930', secondary: '#0f172a' },
      isCustom: true
    };
    return {
      category: 'lottery-gaming-tools',
      categoryDef: lotteryDef,
      confidence: 0.99,
      reason: 'Detected evidence-first Lottery, Powerball, and Draw analytics tools',
      isCustom: true,
      isAutoCreated: true
    };
  }

  // 2. Check for Sports & Football / Gaming (Varbona & sports games)
  const sportsFootballKeywords = [
    'football', 'fantasy', 'soccer', 'scout', 'squad', 'lineup', 'xi', 
    'striker', 'forward', 'pitch', 'roster', 'premier league', 'fifa', 
    'gameweek', 'match', 'play-money', 'futbol', 'wonderkid', 'fpl'
  ];

  let sportsCount = 0;
  for (const w of sportsFootballKeywords) {
    if (matchesKeyword(corpus, w)) sportsCount++;
  }

  if (sportsCount >= 2 || (name.toLowerCase().includes('varbona') && corpus.includes('football'))) {
    const gamingDef = ALL_PRESET_CATEGORIES.find((c) => c.id === 'gaming')!;
    return {
      category: 'gaming',
      categoryDef: gamingDef,
      confidence: 0.98,
      reason: 'Detected Fantasy Sports / Football gaming keywords',
      isCustom: false,
      isAutoCreated: false
    };
  }

  // 2. Score text against all known presets
  let bestCategoryId = 'webapp';
  let bestScore = 0;

  for (const [catId, words] of Object.entries(KEYWORD_VECTORS)) {
    let score = 0;
    for (const w of words) {
      if (matchesKeyword(corpus, w)) {
        // Boost if present in brand name or tagline
        const nameMatch = matchesKeyword(name.toLowerCase(), w);
        score += nameMatch ? 5 : 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategoryId = catId;
    }
  }

  // If a preset scored confidently (at least 3 points)
  if (bestScore >= 3) {
    const matchedDef = ALL_PRESET_CATEGORIES.find((c) => c.id === bestCategoryId) || STANDARD_CATEGORIES[4];
    return {
      category: matchedDef.id,
      categoryDef: matchedDef,
      confidence: Math.min(0.95, 0.65 + bestScore * 0.05),
      reason: `Matched industry signals for "${matchedDef.label}"`,
      isCustom: matchedDef.isCustom || false,
      isAutoCreated: false
    };
  }

  // 3. Check for specific industry synthesis patterns (e.g. Solar, Jewelry, Podcast, Robotics, etc.)
  for (const pat of INDUSTRY_PATTERNS) {
    if (pat.regex.test(corpus)) {
      const customSlug = pat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const synthesizedDef: CategoryDefinition = {
        id: customSlug,
        label: pat.name,
        emoji: pat.emoji,
        description: `Custom generated category for ${pat.name}`,
        defaultHashtags: pat.tags,
        suggestedColors: { primary: pat.primaryColor, secondary: '#0f172a' },
        isCustom: true
      };

      return {
        category: customSlug,
        categoryDef: synthesizedDef,
        confidence: 0.88,
        reason: `Auto-created custom category: "${pat.name}"`,
        isCustom: true,
        isAutoCreated: true
      };
    }
  }

  // 4. If tagline or name has specific domain indicator, synthesize a custom category on the fly!
  // e.g. "Specialty Honey Producer" or "Custom Keyboard Studio"
  const industrySuffixMatch = tagline.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:company|brand|studio|shop|agency|collective|hub|services|solutions|network|platform|app|lab)\b/i);
  if (industrySuffixMatch && industrySuffixMatch[1] && industrySuffixMatch[1].length > 3) {
    const rawIndustry = industrySuffixMatch[1].trim();
    const titleCased = rawIndustry
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const customSlug = titleCased.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanTag = titleCased.replace(/\s+/g, '');

    const synthesizedDef: CategoryDefinition = {
      id: customSlug,
      label: `${titleCased} (Custom)`,
      emoji: '✨',
      description: `Auto-detected category for ${titleCased}`,
      defaultHashtags: [`#${cleanTag}`, `#${name.replace(/\s+/g, '')}`, '#Business', '#Innovation'],
      suggestedColors: { primary: '#6366f1', secondary: '#0f172a' },
      isCustom: true
    };

    return {
      category: customSlug,
      categoryDef: synthesizedDef,
      confidence: 0.82,
      reason: `Synthesized custom category from description: "${titleCased}"`,
      isCustom: true,
      isAutoCreated: true
    };
  }

  // 5. Default fallback to webapp/tech
  const fallbackDef = STANDARD_CATEGORIES.find((c) => c.id === 'webapp')!;
  return {
    category: 'webapp',
    categoryDef: fallbackDef,
    confidence: 0.5,
    reason: 'Standard tech / modern venture default',
    isCustom: false,
    isAutoCreated: false
  };
}

/**
 * Creates a custom category definition on the fly from user input.
 */
export function createCustomCategory(rawName: string, emoji: string = '✨'): CategoryDefinition {
  const cleanLabel = rawName.trim();
  const slug = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const tag = cleanLabel.replace(/[^a-zA-Z0-9]/g, '');

  return {
    id: slug,
    label: cleanLabel,
    emoji,
    description: `Custom user-created category: ${cleanLabel}`,
    defaultHashtags: [`#${tag}`, `#${tag}Life`, '#BrandCommand', '#NewLaunch'],
    suggestedColors: { primary: '#6366f1', secondary: '#0f172a' },
    isCustom: true
  };
}

/**
 * Formats any category ID into a friendly label using standard + expanded presets or capitalized slug.
 */
export function formatCategoryLabel(categoryId: string, customCategories: CategoryDefinition[] = []): string {
  const found = [...ALL_PRESET_CATEGORIES, ...customCategories].find((c) => c.id === categoryId);
  if (found) return found.label;

  return categoryId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
