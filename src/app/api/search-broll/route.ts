import { NextRequest, NextResponse } from 'next/server';

export interface BrollClipResult {
  id: string;
  title: string;
  category: 'beauty' | 'fintech' | 'tech' | 'lifestyle' | 'abstract' | 'gaming';
  type: 'video' | 'animated_chart' | 'image';
  mediaUrl: string;
  thumbnailUrl: string;
  source: 'pexels' | 'pixabay' | 'unsplash' | 'local_library' | 'curated_hd';
  tags: string[];
  duration?: number;
}

// Comprehensive Curated HD/4K Video & B-Roll Registry
const CURATED_BROLL_LIBRARY: BrollClipResult[] = [
  // 1. BEAUTY, SALON & HAIR EXTENSIONS
  {
    id: 'broll_salon_wash_vid',
    title: 'Luxury Hair Spa Wash Station Demonstration',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['hair wash', 'shampoo', 'salon spa', 'scalp treatment', 'salon sink', 'hair care', 'wash']
  },
  {
    id: 'broll_salon_blowout_reveal',
    title: 'Salon Blowout & High-Gloss Transformation',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['blowout', 'styling', 'transformation', 'hair salon', 'shiny hair', 'reveal', 'curls']
  },
  {
    id: 'broll_remy_wefts_macro',
    title: '100% Remy Extensions • Invisible Hand-Tied Wefts',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['extensions', 'wefts', 'remy hair', 'hand tied', 'cuticle', 'seam', 'blonde']
  },
  {
    id: 'broll_salon_shears_cut',
    title: 'Precision Shears Cutting & Texture Blend',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['haircut', 'shears', 'scissors', 'stylist', 'precision cut', 'trim', 'salon']
  },
  {
    id: 'broll_hair_color_balayage',
    title: 'Balayage Foil Highlighting & Dimension Application',
    category: 'beauty',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['balayage', 'color', 'blonde foils', 'hair dye', 'highlights', 'colorist']
  },

  // 2. FINTECH, STOCKS & OPTIONS TRADING
  {
    id: 'broll_live_candlesticks',
    title: 'OptionCove Live Candlestick Scanner Terminal',
    category: 'fintech',
    type: 'animated_chart',
    mediaUrl: 'animated_chart',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['candlestick', 'trading', 'scanner', 'stocks', 'terminal', 'optioncove', 'options', 'chart', 'spy']
  },
  {
    id: 'broll_trading_matrix_wall',
    title: 'Nasdaq Multi-Screen Wall Street Matrix',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['matrix', 'wall street', 'macro', 'screens', 'stock market', 'nasdaq', 'charts', 'finance']
  },
  {
    id: 'broll_trader_desk_setup',
    title: 'Professional Trader Dual-Monitor Setup',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['trader desk', 'setup', 'monitors', 'charts', 'investing', 'market analysis']
  },
  {
    id: 'broll_crypto_depth_chart',
    title: 'Market Orderbook & Liquidity Heatmap',
    category: 'fintech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['orderbook', 'crypto', 'depth chart', 'volume', 'gamma', 'volatility', 'bitcoin']
  },

  // 3. TECH, SAAS & PRODUCT DEMOS
  {
    id: 'broll_3d_action_reel',
    title: '3D Action Motion Reel (1080p MP4)',
    category: 'abstract',
    type: 'video',
    mediaUrl: '/videos/broll/animated_demo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    source: 'local_library',
    tags: ['3d motion', 'action', 'animation', 'render', 'product demo', 'tech reel', 'motion flow']
  },
  {
    id: 'broll_evidraw_canvas_ui',
    title: 'EviDraw Interactive Vector Canvas UI',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['canvas', 'ui', 'app', 'design', 'vector', 'evidraw', 'drawing', 'browser tool']
  },
  {
    id: 'broll_dark_code_ide',
    title: 'Dark Code IDE Terminal & Backend Cloud Engine',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['code', 'developer', 'terminal', 'ide', 'backend', 'cloud', 'varbona', 'programming']
  },
  {
    id: 'broll_server_datacenter',
    title: 'High-Speed Cloud Datacenter Server Rack',
    category: 'tech',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['server', 'cloud', 'datacenter', 'infrastructure', 'network', 'speed', 'hosting']
  },

  // 4. LIFESTYLE, COMMUNITY & WORKSPACE
  {
    id: 'broll_cozy_coffee_desk',
    title: 'Aesthetic Morning Coffee Desk & MacBook',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['coffee', 'desk', 'workspace', 'laptop', 'morning', 'routine', 'aesthetic', 'vlog']
  },
  {
    id: 'broll_uruguay_rambla_sunset',
    title: 'Rambla Coastal Sunset & Mate Gathering',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['rambla', 'uruguay', 'community', 'montevideo', 'mate', 'beach', 'friends', 'coastal']
  },
  {
    id: 'broll_city_creator_walk',
    title: 'Urban Modern City Walking & Creator Lifestyle',
    category: 'lifestyle',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    source: 'curated_hd',
    tags: ['city', 'walking', 'creator', 'lifestyle', 'urban', 'modern', 'mobile']
  }
];

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      category, 
      pexelsApiKey, 
      pixabayApiKey, 
      unsplashApiKey,
      mediaType = 'all' // 'all' | 'video' | 'image'
    } = await req.json();

    const rawQuery = (query || '').trim();
    let searchTerm = rawQuery.toLowerCase();
    const effectiveCategory = (category || 'all').toLowerCase();

    // AI Semantic Keyword Expansion
    if (searchTerm.includes('varbona') || searchTerm.includes('wonderkid') || effectiveCategory === 'gaming') {
      searchTerm = searchTerm.replace(/varbona/g, '').trim() || 'soccer football stadium player';
    } else if (searchTerm.includes('optioncove') || searchTerm.includes('wheel strategy')) {
      searchTerm = searchTerm.replace(/optioncove/g, '').trim() || 'stock market trading candlestick';
    }

    const aggregatedClips: BrollClipResult[] = [];

    // 1. Try Live Pexels API (Videos & Photos)
    const pexelsKey = pexelsApiKey || process.env.PEXELS_API_KEY;
    if (pexelsKey && searchTerm) {
      try {
        // Pexels Video Search
        if (mediaType === 'all' || mediaType === 'video') {
          const pexelsRes = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerm)}&orientation=portrait&per_page=12`,
            { headers: { Authorization: pexelsKey } }
          );

          if (pexelsRes.ok) {
            const pexelsData = await pexelsRes.json();
            if (pexelsData.videos && pexelsData.videos.length > 0) {
              pexelsData.videos.forEach((vid: any) => {
                const files = vid.video_files || [];
                const portraitFile = files.find((f: any) => f.height > f.width && f.quality === 'hd') ||
                                     files.find((f: any) => f.height > f.width) ||
                                     files[0];
                if (portraitFile?.link) {
                  aggregatedClips.push({
                    id: `pexels_vid_${vid.id}`,
                    title: `Pexels • ${searchTerm.toUpperCase()} (${vid.duration}s HD)`,
                    category: (effectiveCategory !== 'all' ? effectiveCategory : 'lifestyle') as any,
                    type: 'video',
                    mediaUrl: portraitFile.link,
                    thumbnailUrl: vid.image || vid.video_pictures?.[0]?.picture || '',
                    source: 'pexels',
                    tags: [searchTerm, 'pexels', 'video'],
                    duration: vid.duration
                  });
                }
              });
            }
          }
        }

        // Pexels Photo Search
        if (mediaType === 'all' || mediaType === 'image') {
          const pexelsPhotoRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&orientation=portrait&per_page=12`,
            { headers: { Authorization: pexelsKey } }
          );

          if (pexelsPhotoRes.ok) {
            const photoData = await pexelsPhotoRes.json();
            if (photoData.photos && photoData.photos.length > 0) {
              photoData.photos.forEach((p: any) => {
                aggregatedClips.push({
                  id: `pexels_photo_${p.id}`,
                  title: `Pexels Photo • ${p.alt || searchTerm.toUpperCase()}`,
                  category: (effectiveCategory !== 'all' ? effectiveCategory : 'lifestyle') as any,
                  type: 'image',
                  mediaUrl: p.src?.large2x || p.src?.large || p.src?.portrait,
                  thumbnailUrl: p.src?.tiny || p.src?.small,
                  source: 'pexels',
                  tags: [searchTerm, 'pexels', 'photo']
                });
              });
            }
          }
        }
      } catch (err) {
        console.warn('Pexels API fetch failed:', err);
      }
    }

    // 2. Try Live Pixabay API (Videos & Photos)
    const pixabayKey = pixabayApiKey || process.env.PIXABAY_API_KEY;
    if (pixabayKey && searchTerm) {
      try {
        const pixRes = await fetch(
          `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(searchTerm)}&per_page=10`
        );
        if (pixRes.ok) {
          const pixData = await pixRes.json();
          if (pixData.hits && pixData.hits.length > 0) {
            pixData.hits.forEach((hit: any) => {
              const videoUrl = hit.videos?.medium?.url || hit.videos?.small?.url;
              if (videoUrl) {
                aggregatedClips.push({
                  id: `pixabay_${hit.id}`,
                  title: `Pixabay • ${hit.tags || searchTerm.toUpperCase()} (${hit.duration}s)`,
                  category: (effectiveCategory !== 'all' ? effectiveCategory : 'abstract') as any,
                  type: 'video',
                  mediaUrl: videoUrl,
                  thumbnailUrl: hit.userImageURL || `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg`,
                  source: 'pixabay',
                  tags: (hit.tags || '').split(',').map((s: string) => s.trim()),
                  duration: hit.duration
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Pixabay API fetch failed:', err);
      }
    }

    // 3. Try Unsplash Search if Key supplied
    const unsplashKey = unsplashApiKey || process.env.UNSPLASH_API_KEY;
    if (unsplashKey && searchTerm) {
      try {
        const unRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&orientation=portrait&per_page=12`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        );
        if (unRes.ok) {
          const unData = await unRes.json();
          if (unData.results && unData.results.length > 0) {
            unData.results.forEach((item: any) => {
              aggregatedClips.push({
                id: `unsplash_${item.id}`,
                title: `Unsplash • ${item.description || item.alt_description || searchTerm.toUpperCase()}`,
                category: (effectiveCategory !== 'all' ? effectiveCategory : 'lifestyle') as any,
                type: 'image',
                mediaUrl: item.urls?.regular || item.urls?.full,
                thumbnailUrl: item.urls?.thumb || item.urls?.small,
                source: 'unsplash',
                tags: [searchTerm, 'unsplash']
              });
            });
          }
        }
      } catch (err) {
        console.warn('Unsplash API fetch failed:', err);
      }
    }

    // 4. Keyless Public Media Search (Wikimedia Commons Open Public Domain API)
    if (aggregatedClips.length === 0 && searchTerm) {
      try {
        const wikiRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=8&prop=imageinfo&iiprop=url|mime`,
          { headers: { 'User-Agent': 'BrandCommand-OS/1.0' } }
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const pages = wikiData.query?.pages ? Object.values(wikiData.query.pages) : [];
          pages.forEach((p: any) => {
            const info = p.imageinfo?.[0];
            const url = info?.url;
            const mime = info?.mime || '';
            if (url && (mime.startsWith('image/') || mime.startsWith('video/'))) {
              aggregatedClips.push({
                id: `wiki_${p.pageid}`,
                title: p.title?.replace('File:', '').replace(/\.[^/.]+$/, '').slice(0, 45) || searchTerm.toUpperCase(),
                category: (effectiveCategory !== 'all' ? effectiveCategory : 'lifestyle') as any,
                type: mime.startsWith('video/') ? 'video' : 'image',
                mediaUrl: url,
                thumbnailUrl: url,
                source: 'local_library',
                tags: [searchTerm, 'open_media', 'public_stock']
              });
            }
          });
        }
      } catch (wikiErr) {
        // Continue to curated library fallback
      }
    }

    // 5. Intelligent Semantic Match from Curated HD Registry (Fallback)
    const queryWords = searchTerm.split(/\s+/).filter(Boolean);

    const scoredClips = CURATED_BROLL_LIBRARY.map((clip) => {
      let score = 0;

      if (effectiveCategory !== 'all' && clip.category === effectiveCategory) {
        score += 6;
      }

      const allText = `${clip.title.toLowerCase()} ${clip.tags.join(' ')}`;
      for (const word of queryWords) {
        if (word.length <= 2) continue;
        if (allText.includes(word)) {
          score += 4;
        }
      }

      return { clip, score };
    });

    scoredClips.sort((a, b) => b.score - a.score);
    const matchedCurated = scoredClips.map((item) => item.clip);

    const combinedResults = [...aggregatedClips, ...matchedCurated];

    return NextResponse.json({
      success: true,
      source: aggregatedClips.length > 0 ? 'keyless_public_stock' : 'curated_library',
      query: searchTerm,
      count: combinedResults.length,
      clips: combinedResults,
      results: combinedResults
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'BROLL_SEARCH_ERROR', message: error.message || 'Failed to search B-Roll library' },
      { status: 500 }
    );
  }
}
