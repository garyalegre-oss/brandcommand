'use client';

import React, { useState, useEffect } from 'react';
import { Brand, Post, Contact, SocialChannel, PublishLogEntry } from '../types/brand';
import { DEFAULT_BRANDS, INITIAL_POSTS, INITIAL_CONTACTS } from '../data/defaultBrands';
import { BrandSwitcher } from '../components/BrandSwitcher';
import { BrandProfileCard } from '../components/BrandProfileCard';
import { ContentComposer } from '../components/ContentComposer';
import { CalendarQueue } from '../components/CalendarQueue';
import { ContactsManager } from '../components/ContactsManager';
import { NewBrandModal } from '../components/NewBrandModal';
import { SocialAccountsHub } from '../components/SocialAccountsHub';
import { AdImageStudio } from '../components/AdImageStudio';
import { CampaignMultiplier } from '../components/CampaignMultiplier';
import { InsideAppTutorialStudio } from '../components/InsideAppTutorialStudio';
import { BrandContentLibrary } from '../components/BrandContentLibrary';
import { ModelStudio } from '../components/ModelStudio';
import { BrandAvatar } from '../components/BrandAvatar';
import {
  Layers,
  Calendar,
  Sparkles,
  Plus,
  ShieldCheck,
  Users,
  Image as ImageIcon,
  Zap,
  Bot,
  Library,
  Share2,
  Clock,
  CheckCircle2,
  Radio,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Wand2,
  Send,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';

export default function Home() {
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [activeBrandId, setActiveBrandId] = useState<string>(DEFAULT_BRANDS[2].id); // Defaults to OptionCove or Salon
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeTab, setActiveTab] = useState<
    | 'model_studio'
    | 'library'
    | 'queue'
    | 'brand_accounts'
    | 'inside_bot'
    | 'composer'
    | 'ad_studio'
    | 'multiplier'
    | 'contacts'
  >('model_studio');
  const [isNewBrandModalOpen, setIsNewBrandModalOpen] = useState(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdIntelOpen, setIsAdIntelOpen] = useState(true);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [showHeaderBrandDna, setShowHeaderBrandDna] = useState(false);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const savedBrands = localStorage.getItem('brandcommand_brands');
      if (savedBrands) {
        let parsed: Brand[] = JSON.parse(savedBrands);
        // Seamless upgrade: if user has old cached placeholder for Evidraw with painter emoji 🎨 or missing live screenshot
        let upgraded = false;
        parsed = parsed.map((b) => {
          if (b.id === 'brand-evidraw' || b.websiteUrl?.includes('evidraw.com')) {
            if (b.logoEmoji === '🎨' || b.category === 'webapp' || b.tagline?.toLowerCase().includes('canvas') || !b.websiteMobileScreenshotUrl) {
              upgraded = true;
              const official = DEFAULT_BRANDS.find((d) => d.id === 'brand-evidraw');
              return official ? { ...b, ...official } : b;
            }
          }
          return b;
        });

        setBrands(parsed);
        if (upgraded) {
          try {
            localStorage.setItem('brandcommand_brands', JSON.stringify(parsed));
          } catch {}
        }
      }
      const savedPosts = localStorage.getItem('brandcommand_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
      const savedContacts = localStorage.getItem('brandcommand_contacts');
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
      const savedActiveBrand = localStorage.getItem('brandcommand_active_brand');
      if (savedActiveBrand) {
        setActiveBrandId(savedActiveBrand);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveBrands = (newBrands: Brand[]) => {
    setBrands(newBrands);
    try {
      localStorage.setItem('brandcommand_brands', JSON.stringify(newBrands));
    } catch {}
  };

  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    try {
      localStorage.setItem('brandcommand_posts', JSON.stringify(newPosts));
    } catch {}
  };

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    try {
      localStorage.setItem('brandcommand_contacts', JSON.stringify(newContacts));
    } catch {}
  };

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const handleSelectBrand = (brand: Brand) => {
    setActiveBrandId(brand.id);
    try {
      localStorage.setItem('brandcommand_active_brand', brand.id);
    } catch {}
  };

  const handleAddBrand = (newBrand: Brand) => {
    const updated = [...brands, newBrand];
    saveBrands(updated);
    setActiveBrandId(newBrand.id);
  };

  const handleUpdateBrand = (updatedBrand: Brand) => {
    const updated = brands.map((b) => (b.id === updatedBrand.id ? updatedBrand : b));
    saveBrands(updated);
  };

  const handleSavePost = (newPostData: Omit<Post, 'id' | 'createdAt'>) => {
    const newPost: Post = {
      ...newPostData,
      id: `post-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    savePosts([newPost, ...posts]);
  };

  const handleSaveBatchPosts = (newBatch: Omit<Post, 'id' | 'createdAt'>[]) => {
    const nowTs = Date.now();
    const createdPosts: Post[] = newBatch.map((item, idx) => ({
      ...item,
      id: `post-${nowTs}-${idx}`,
      createdAt: new Date().toISOString()
    }));
    savePosts([...createdPosts, ...posts]);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    savePosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleDeletePost = (postId: string) => {
    savePosts(posts.filter((p) => p.id !== postId));
  };

  const handleUpdateStatus = (postId: string, status: Post['status']) => {
    savePosts(
      posts.map((p) => (p.id === postId ? { ...p, status } : p))
    );
  };

  const handlePublishPost = (
    postId: string,
    publishedUrls: Partial<Record<SocialChannel, string>>,
    publishLogs: PublishLogEntry[]
  ) => {
    savePosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              status: 'published',
              publishedAt: new Date().toISOString(),
              publishedUrls,
              publishLogs
            }
          : p
      )
    );
  };

  const handleAddContact = (newContactData: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...newContactData,
      id: `contact-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    saveContacts([newContact, ...contacts]);
  };

  const handleImportBatch = (newBatch: Omit<Contact, 'id' | 'createdAt'>[]) => {
    const timestamp = Date.now();
    const formatted = newBatch.map((item, index) => ({
      ...item,
      id: `contact-${timestamp}-${index}`,
      createdAt: new Date().toISOString()
    }));
    saveContacts([...formatted, ...contacts]);
  };

  const handleDeleteContact = (contactId: string) => {
    saveContacts(contacts.filter((c) => c.id !== contactId));
  };

  const handleToggleContactStatus = (contactId: string) => {
    saveContacts(
      contacts.map((c) =>
        c.id === contactId
          ? { ...c, status: c.status === 'subscribed' ? 'unsubscribed' : 'subscribed' }
          : c
      )
    );
  };

  const activeBrandContactsCount = contacts.filter((c) => c.brandId === activeBrand.id).length;
  const activeBrandPosts = posts.filter((p) => p.brandId === activeBrand.id);
  const activeBrandLibraryCount = activeBrandPosts.length;
  const activeBrandPendingCount = activeBrandPosts.filter(
    (p) => p.status === 'draft' || p.approvalStatus === 'pending_approval'
  ).length;
  const activeBrandScheduledCount = activeBrandPosts.filter(
    (p) => p.status === 'scheduled'
  ).length;
  const activeBrandPublishedCount = activeBrandPosts.filter(
    (p) => p.status === 'published'
  ).length;
  const activeBrandScreensCount = (activeBrand.brandAssets || []).filter(
    (a) => a.type === 'screenshot' || a.type === 'hero' || a.isAuthenticated
  ).length;

  const isAutoPostingEnabled = activeBrand.autoPilot?.enabled ?? true;
  const weeklyTargetSlots = (activeBrand.autoPilot?.postsPerDay || 2) * 7;
  const weeklyReadySlots = Math.min(
    weeklyTargetSlots,
    activeBrandScheduledCount + activeBrandPendingCount
  );
  const weeklyCapacityPercent = Math.min(
    100,
    Math.round((weeklyReadySlots / Math.max(1, weeklyTargetSlots)) * 100)
  );

  const handleToggleAutoPostingQuick = () => {
    const current = activeBrand.autoPilot || {
      enabled: true,
      mode: 'review_first' as const,
      postsPerDay: 2 as const,
      preferredTimes: ['09:30', '17:30'],
      autoReplenishLibrary: true,
      minLibraryBuffer: 4,
      includeFormats: ['video_script', 'carousel', 'thread', 'single'] as const,
      targetChannels: activeBrand.defaultChannels
    };
    handleUpdateBrand({
      ...activeBrand,
      autoPilot: {
        ...current,
        includeFormats: [...current.includeFormats],
        enabled: !current.enabled
      }
    });
  };

  const navMetadata: Record<
    typeof activeTab,
    { section: string; title: string; subtitle: string }
  > = {
    model_studio: {
      section: 'Model Studio',
      title: 'Any model, any output',
      subtitle:
        'Describe what you want to make across Veo 2, UGC Creator Hook Engine, Inside-App Bot, Imagen 3, and Gemini 2.5.'
    },
    library: {
      section: 'Content Library',
      title: 'Autonomous Content Library & 7-Day Schedule',
      subtitle:
        'Review AI-generated posts, inspect your 7-day visual posting calendar, and toggle 1-click approval or fully automated hands-free posting.'
    },
    queue: {
      section: 'Content Calendar',
      title: 'Master Publishing Calendar & Queue',
      subtitle:
        'Unified 7-day visual posting schedule and direct publishing dispatch log across all your brands.'
    },
    brand_accounts: {
      section: 'Brand & Social Accounts',
      title: `${activeBrand.name} DNA, Connected Channels & Audience`,
      subtitle:
        'Manage brand identity, website assets, connected social accounts, and subscriber contacts in one place.'
    },
    inside_bot: {
      section: 'Ad Intelligence',
      title: 'AI Bot Login & Inside-App Tutorial Studio',
      subtitle:
        'Let the headless AI Bot sign in via Email OTP, click through in-page tabs, and record 16:9 YouTube & 9:16 Reels scroll-and-zoom tutorials.'
    },
    composer: {
      section: 'Ad Intelligence',
      title: 'Video & Post Studio',
      subtitle:
        'Create custom 16:9 YouTube HD videos, 9:16 Reels, UGC Creator Hooks, carousels, threads, and newsletters.'
    },
    ad_studio: {
      section: 'Ad Intelligence',
      title: 'Ad & Competitor Intelligence Studio',
      subtitle:
        'Spy on competitor ad angles and design high-converting ad graphics for Instagram, X, and LinkedIn.'
    },
    multiplier: {
      section: 'Ad Intelligence',
      title: '5-Day Campaign Multiplier',
      subtitle:
        'Turn a single topic or product update into a coordinated 5-day omnichannel campaign in one click.'
    },
    contacts: {
      section: 'Brand & Social Accounts',
      title: 'Audience & CRM Contacts',
      subtitle:
        'Manage subscribers, customer segments, and newsletter distribution lists for this brand.'
    }
  };

  // Global Background Autonomous Dispatcher: checks every 25s for due scheduled posts across all brands and auto-publishes them
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const duePosts = posts.filter(
        (p) => p.status === 'scheduled' && new Date(p.scheduledFor) <= now
      );
      if (duePosts.length === 0) return;

      const postToPublish = duePosts[0];
      const postBrand = brands.find((b) => b.id === postToPublish.brandId);
      if (!postBrand) return;

      try {
        const res = await fetch('/api/publish-social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: postBrand,
            post: postToPublish,
            channels: postToPublish.channels
          })
        });
        const data = await res.json();
        if (data.success) {
          handlePublishPost(
            postToPublish.id,
            data.publishedUrls || {},
            data.publishLogs || []
          );
        }
      } catch {
        // Retry on next cycle
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [posts, brands]);

  return (
    <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex font-sans">
      {/* LEFT SIDEBAR: CLEAN PREDIS-INSPIRED SAAS NAVIGATION */}
      <aside
        className={`hidden lg:flex ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } shrink-0 flex-col justify-between bg-[#f8f9fc] dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 sticky top-0 h-screen z-40 select-none transition-all duration-200 relative`}
      >
        {/* Collapse / Expand Edge Button (<) */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3.5 top-6 w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white z-50 transition-colors"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="p-3.5 space-y-4 overflow-y-auto">
          {/* App Logo Header */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
                BC
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="font-black text-base tracking-tight text-neutral-900 dark:text-white leading-none">
                    BrandCommand
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Autonomous Studio
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Active Brand Selector Pill */}
          {!isSidebarCollapsed ? (
            <div className="p-1.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
              <div className="flex items-center justify-between px-1.5 pt-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Active Brand
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewBrandModalOpen(true)}
                  className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add Brand
                </button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {brands.map((b) => {
                  const isSel = b.id === activeBrand.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBrand(b)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                        isSel
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                          : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <BrandAvatar brand={b} size="sm" />
                      <span className="truncate max-w-[78px]">{b.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBrand(b)}
                  className={`p-1 rounded-xl border transition-all ${
                    b.id === activeBrand.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={b.name}
                >
                  <BrandAvatar brand={b} size="sm" />
                </button>
              ))}
            </div>
          )}

          {/* TOP PRIMARY CTA: "+ Create New" + "✈️ Auto Posting [🟢]" */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(true)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
              title="Create a new Video, UGC Creator Reel, Carousel, or App Walkthrough"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {!isSidebarCollapsed && <span>Create New</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                handleToggleAutoPostingQuick();
                setActiveTab('library');
              }}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-neutral-950 border border-blue-200 dark:border-neutral-800 hover:border-blue-400 text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center justify-between shadow-2xs transition-all"
              title="Click to configure or toggle Auto Posting for this brand"
            >
              <span className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {!isSidebarCollapsed && <span>Auto Posting</span>}
              </span>
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  isAutoPostingEnabled
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            </button>
          </div>

          {/* 5 CLEAN TOP-LEVEL NAVIGATION DESTINATIONS */}
          <nav className="space-y-1 pt-1">
            {/* 1. Model Studio (• New) */}
            <button
              type="button"
              onClick={() => setActiveTab('model_studio')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                activeTab === 'model_studio'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-extrabold shadow-xs border border-neutral-200/60 dark:border-neutral-700'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/70 dark:hover:bg-neutral-800/60 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                {!isSidebarCollapsed && <span>Model Studio</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  New
                </span>
              )}
            </button>

            {/* 2. Content Library */}
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-extrabold shadow-xs border border-neutral-200/60 dark:border-neutral-700'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/70 dark:hover:bg-neutral-800/60 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Library className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Content Library</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold">
                  {activeBrandLibraryCount}
                </span>
              )}
            </button>

            {/* 3. Content Calendar */}
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                activeTab === 'queue'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-extrabold shadow-xs border border-neutral-200/60 dark:border-neutral-700'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/70 dark:hover:bg-neutral-800/60 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Content Calendar</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeBrandScheduledCount}
                </span>
              )}
            </button>

            {/* 4. Brand & Social Accounts */}
            <button
              type="button"
              onClick={() => setActiveTab('brand_accounts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                activeTab === 'brand_accounts' || activeTab === 'contacts'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-extrabold shadow-xs border border-neutral-200/60 dark:border-neutral-700'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/70 dark:hover:bg-neutral-800/60 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Brand &amp; Social Accounts</span>}
              </span>
            </button>

            {/* 5. Ad Intelligence ▾ (Expandable Group) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setIsSidebarCollapsed(false);
                    setIsAdIntelOpen(true);
                  } else {
                    setIsAdIntelOpen((prev) => !prev);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                  ['inside_bot', 'composer', 'ad_studio', 'multiplier'].includes(activeTab)
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-extrabold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/70 dark:hover:bg-neutral-800/60 font-semibold'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Ad Intelligence</span>}
                </span>
                {!isSidebarCollapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isAdIntelOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {!isSidebarCollapsed && isAdIntelOpen && (
                <div className="mt-1 ml-4 pl-2.5 border-l border-neutral-200 dark:border-neutral-800 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('inside_bot')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                      activeTab === 'inside_bot'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>🤖 Inside-App Bot Recorder</span>
                    {activeBrandScreensCount > 0 && (
                      <span className="text-[9px] opacity-80">{activeBrandScreensCount}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('composer')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                      activeTab === 'composer'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>🎬 Video &amp; UGC Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ad_studio')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                      activeTab === 'ad_studio'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>🕵️ Competitor &amp; Ad Spy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('multiplier')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                      activeTab === 'multiplier'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <span>⚡ 5-Day Campaign Multiplier</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* BOTTOM SIDEBAR: QUEUE CAPACITY BAR & QUICK FOOTER ICONS */}
        <div className="p-3.5 space-y-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40">
          {!isSidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-2 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                Queue Capacity
              </span>
              <div className="w-14 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(20, weeklyCapacityPercent)}%` }}
                />
              </div>
              <span className="text-[10px] font-extrabold text-neutral-900 dark:text-white">
                {weeklyReadySlots}/{weeklyTargetSlots}{' '}
                <span className="font-normal text-neutral-400">slots</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-around px-1 pt-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('brand_accounts')}
              className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs"
              title={`Active Brand: ${activeBrand.name}`}
            >
              {activeBrand.name.charAt(0).toUpperCase()}
            </button>
            {!isSidebarCollapsed && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('model_studio')}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  title="Model Studio Prompt Ideas"
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  title="Schedule & Publishing Analytics"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header Bar */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            {/* Breadcrumb & Active Tool Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                {navMetadata[activeTab].section}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline shrink-0" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate hidden sm:inline">
                {navMetadata[activeTab].title}
              </span>
            </div>

            {/* Mobile Brand Switcher & Global Quick Actions */}
            <div className="flex items-center gap-2.5">
              <div className="lg:hidden">
                <BrandSwitcher
                  brands={brands}
                  activeBrand={activeBrand}
                  onSelectBrand={handleSelectBrand}
                  onOpenNewBrandModal={() => setIsNewBrandModalOpen(true)}
                />
              </div>

              {/* Active Brand DNA Toggle & Status Pills */}
              <div className="hidden md:flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowHeaderBrandDna((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 transition-colors ${
                    showHeaderBrandDna
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                  }`}
                  title="Inspect or edit active Brand DNA, colors, voice & website assets"
                >
                  <BrandAvatar brand={activeBrand} size="sm" />
                  <span>{activeBrand.name} DNA</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      showHeaderBrandDna ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 font-bold flex items-center gap-1.5 hover:border-neutral-400 transition-colors"
                  title="Posts waiting for your 1-click approval in the Library"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{activeBrandPendingCount} Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 font-bold flex items-center gap-1.5 hover:border-neutral-400 transition-colors"
                  title="Approved posts scheduled on the calendar"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{activeBrandScheduledCount} Scheduled</span>
                </button>
              </div>

              <button
                onClick={() => setIsSocialHubOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:border-neutral-400 transition-colors"
              >
                <span>🔌 Socials</span>
              </button>
            </div>
          </div>

          {/* Mobile Horizontal Nav Bar (visible on screens < lg) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-neutral-200/70 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <button
              onClick={() => setActiveTab('model_studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap ${
                activeTab === 'model_studio'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              🪄 Model Studio
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              📚 Content Library ({activeBrandLibraryCount})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              📅 Content Calendar ({activeBrandScheduledCount})
            </button>
            <button
              onClick={() => setActiveTab('brand_accounts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeTab === 'brand_accounts'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              🛡️ Brand &amp; Socials
            </button>
            <button
              onClick={() => setActiveTab('inside_bot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeTab === 'inside_bot'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              🤖 Inside-App Bot
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Active Brand DNA Drawer (Shown when toggled in header or on Brand & Social Accounts tab) */}
          {(showHeaderBrandDna || activeTab === 'brand_accounts') && (
            <BrandProfileCard brand={activeBrand} onUpdateBrand={handleUpdateBrand} />
          )}

          {/* Tab 00: Predis-Inspired Model Studio ("Any model, any output") */}
          {activeTab === 'model_studio' && (
            <ModelStudio
              brand={activeBrand}
              posts={posts}
              onSaveBatchPosts={handleSaveBatchPosts}
              onUpdatePost={handleUpdatePost}
              onUpdateBrand={handleUpdateBrand}
              onOpenLibrary={() => setActiveTab('library')}
              onOpenInsideAppBot={() => setActiveTab('inside_bot')}
            />
          )}

          {/* Tab 0: Autonomous Brand Content Library & Auto-Pilot Engine */}
          {activeTab === 'library' && (
            <BrandContentLibrary
              brand={activeBrand}
              allBrands={brands}
              posts={posts}
              onSavePost={handleSavePost}
              onSaveBatchPosts={handleSaveBatchPosts}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onPublishPost={handlePublishPost}
              onUpdateBrand={handleUpdateBrand}
              onOpenSocialHub={() => setIsSocialHubOpen(true)}
            />
          )}

          {/* Tab: Brand & Social Accounts (Unified Brand DNA, Social Connections & Audience) */}
          {activeTab === 'brand_accounts' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    🔌 Connected Social Accounts &amp; Direct Publishing APIs
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Connect Instagram, TikTok, YouTube, X, and LinkedIn for{' '}
                    <strong>{activeBrand.name}</strong> so Auto-Posting can dispatch on schedule.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSocialHubOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shrink-0 shadow-sm"
                >
                  Open Social Accounts Hub →
                </button>
              </div>

              <ContactsManager
                brand={activeBrand}
                contacts={contacts}
                onAddContact={handleAddContact}
                onImportBatch={handleImportBatch}
                onDeleteContact={handleDeleteContact}
                onToggleStatus={handleToggleContactStatus}
              />
            </div>
          )}

          {/* Tab 1: AI Multi-Format Content Composer */}
          {activeTab === 'composer' && (
            <ContentComposer
              brand={activeBrand}
              onSavePost={handleSavePost}
              onUpdateBrand={handleUpdateBrand}
            />
          )}

          {/* Tab 2: Ad & Social Image Studio (Instagram, X, LinkedIn, Stories) */}
          {activeTab === 'ad_studio' && (
            <AdImageStudio
              brand={activeBrand}
              onSavePost={handleSavePost}
              onUpdateBrand={handleUpdateBrand}
              onOpenSocialHub={() => setIsSocialHubOpen(true)}
            />
          )}

          {/* Tab 2.5: 1-Click Omnichannel 5-Day Campaign Multiplier */}
          {activeTab === 'multiplier' && (
            <CampaignMultiplier
              brand={activeBrand}
              onSavePost={handleSavePost}
            />
          )}

          {/* Tab 2.8: AI Bot Login & Inside-App Tutorial Studio */}
          {activeTab === 'inside_bot' && (
            <InsideAppTutorialStudio
              brand={activeBrand}
              onUpdateBrand={handleUpdateBrand}
              onSavePost={handleSavePost}
            />
          )}

          {/* Tab 3: Publishing & Scheduled Calendar Queue */}
          {activeTab === 'queue' && (
            <CalendarQueue
              posts={posts}
              brands={brands}
              onDeletePost={handleDeletePost}
              onUpdateStatus={handleUpdateStatus}
              onPublishPost={handlePublishPost}
              onOpenSocialHub={() => setIsSocialHubOpen(true)}
            />
          )}

          {/* Tab 4: Audience & Contact Management */}
          {activeTab === 'contacts' && (
            <ContactsManager
              brand={activeBrand}
              contacts={contacts}
              onAddContact={handleAddContact}
              onImportBatch={handleImportBatch}
              onDeleteContact={handleDeleteContact}
              onToggleStatus={handleToggleContactStatus}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 dark:border-neutral-800 py-5 text-center text-xs text-neutral-400">
          <p>BrandCommand OS • Model Studio, Autonomous Content Library, 16:9 YouTube &amp; 9:16 UGC Video Engine.</p>
        </footer>
      </div>

      {/* Quick Create Launcher Modal ("+ Create New") */}
      {isQuickCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuickCreateOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandAvatar brand={activeBrand} size="sm" />
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    Create New for {activeBrand.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Choose a studio workflow to start creating
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-800 dark:hover:text-white px-2 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('model_studio');
                  setIsQuickCreateOpen(false);
                }}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🪄</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Prompt Studio
                  </span>
                </div>
                <div className="text-xs font-extrabold text-neutral-900 dark:text-white group-hover:text-blue-600">
                  Model Studio (Any Model)
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Describe what you want to make across Veo 2, UGC Creator, or Imagen 3.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('library');
                  setIsQuickCreateOpen(false);
                }}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 bg-neutral-50 dark:bg-neutral-950 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🤳</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    9:16 Selfie POV
                  </span>
                </div>
                <div className="text-xs font-extrabold text-neutral-900 dark:text-white group-hover:text-amber-500">
                  UGC Creator Hook Reel
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Creator holding phone in selfie POV with centered story text overlay.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('inside_bot');
                  setIsQuickCreateOpen(false);
                }}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-950 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🖥️</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    16:9 YouTube &amp; 9:16
                  </span>
                </div>
                <div className="text-xs font-extrabold text-neutral-900 dark:text-white group-hover:text-emerald-500">
                  Inside-App Bot Walkthrough
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Record real app screens with smooth vertical scrolling, zoom &amp; arrows.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('composer');
                  setIsQuickCreateOpen(false);
                }}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 bg-neutral-50 dark:bg-neutral-950 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">📑</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    Multi-Format
                  </span>
                </div>
                <div className="text-xs font-extrabold text-neutral-900 dark:text-white group-hover:text-indigo-500">
                  Carousel, Thread &amp; Script Studio
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Build 5-slide carousels, viral X threads, or custom voiceover scripts.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Brand Modal */}
      <NewBrandModal
        isOpen={isNewBrandModalOpen}
        onClose={() => setIsNewBrandModalOpen(false)}
        onAddBrand={handleAddBrand}
      />

      {/* Social Accounts & Direct Publishing Hub Modal */}
      {isSocialHubOpen && (
        <SocialAccountsHub
          brand={activeBrand}
          isOpen={isSocialHubOpen}
          onClose={() => setIsSocialHubOpen(false)}
          onUpdateBrand={handleUpdateBrand}
        />
      )}
    </div>
  );
}
