'use client';

import React, { useState, useEffect } from 'react';
import { Post, Brand, SocialChannel, PublishLogEntry } from '../types/brand';
import { BrandAvatar } from './BrandAvatar';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Send, 
  ExternalLink, 
  Share2, 
  RefreshCw, 
  Radio, 
  Check, 
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Hash
} from 'lucide-react';

interface CalendarQueueProps {
  posts: Post[];
  brands: Brand[];
  onDeletePost: (postId: string) => void;
  onUpdateStatus: (postId: string, status: Post['status']) => void;
  onPublishPost?: (
    postId: string, 
    publishedUrls: Partial<Record<SocialChannel, string>>, 
    publishLogs: PublishLogEntry[]
  ) => void;
  onOpenSocialHub?: (brandId?: string) => void;
}

export function CalendarQueue({ 
  posts, 
  brands, 
  onDeletePost, 
  onUpdateStatus, 
  onPublishPost,
  onOpenSocialHub 
}: CalendarQueueProps) {
  const [filterBrandId, setFilterBrandId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [schedulerActive, setSchedulerActive] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoDispatchStatus, setAutoDispatchStatus] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const handleCopyPost = (post: Post) => {
    const tagStr = (post.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    const fullText = tagStr ? `${post.content}\n\n${tagStr}` : post.content;
    navigator.clipboard.writeText(fullText);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  const filteredPosts = posts.filter((p) => {
    if (filterBrandId !== 'all' && p.brandId !== filterBrandId) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const getBrand = (brandId: string) => brands.find((b) => b.id === brandId);

  // Direct 1-Click Publishing through Native Social Dispatch Engine
  const handlePublishNow = async (post: Post) => {
    const postBrand = getBrand(post.brandId);
    if (!postBrand) return;

    setPublishingId(post.id);
    setAutoDispatchStatus(null);

    try {
      const res = await fetch('/api/publish-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: postBrand,
          post,
          channels: post.channels
        })
      });

      const data = await res.json();
      if (data.success) {
        if (onPublishPost) {
          onPublishPost(post.id, data.publishedUrls, data.publishLogs);
        } else {
          onUpdateStatus(post.id, 'published');
        }
      } else {
        alert(`Direct Publishing Error: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Publishing dispatch failed: ${err.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  // Autonomous background scheduler simulation: checks for posts due for dispatch
  useEffect(() => {
    if (!schedulerActive) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const duePosts = posts.filter(
        (p) => p.status === 'scheduled' && new Date(p.scheduledFor) <= now
      );

      if (duePosts.length > 0) {
        const postToPublish = duePosts[0];
        const postBrand = getBrand(postToPublish.brandId);
        if (postBrand) {
          try {
            setAutoDispatchStatus(`Auto-dispatching due post "${postToPublish.title}"...`);
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
            if (data.success && onPublishPost) {
              onPublishPost(postToPublish.id, data.publishedUrls, data.publishLogs);
              setAutoDispatchStatus(`Dispatched: ${postToPublish.title}`);
              setTimeout(() => setAutoDispatchStatus(null), 4000);
            }
          } catch {
            // Silently continue next cycle
          }
        }
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [schedulerActive, posts, brands, onPublishPost]);

  const channelIcons: Record<SocialChannel, string> = {
    twitter: '𝕏',
    instagram: '📸',
    tiktok: '🎵',
    linkedin: '💼',
    youtube: '▶️',
    facebook: '👥',
    pinterest: '📌'
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Native Direct Scheduler Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-neutral-100 dark:via-neutral-950 to-emerald-500/10 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                Native Direct Publishing & Autonomous Scheduler
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Posts publish directly to X, Instagram, TikTok, LinkedIn & YouTube without Buffer or third-party webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {autoDispatchStatus && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
              {autoDispatchStatus}
            </span>
          )}

          {onOpenSocialHub && (
            <button
              onClick={() => onOpenSocialHub()}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              Manage Social Accounts
            </button>
          )}

          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={schedulerActive}
              onChange={(e) => setSchedulerActive(e.target.checked)}
              className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Auto-Release When Due</span>
          </label>
        </div>
      </div>

      {/* Queue Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Unified Publishing Queue
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {posts.length} total posts across all your ventures
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterBrandId}
            onChange={(e) => setFilterBrandId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-medium"
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* 7-DAY OMNICHANNEL VISUAL SCHEDULE BOARD ACROSS ALL BRANDS */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-500" />
            🗓️ 7-Day Visual Posting Schedule (Exact Time &amp; Content Lineup)
          </span>
          <span className="text-[11px] text-neutral-400">
            Showing {filteredPosts.filter((p) => p.status === 'scheduled').length} scheduled posts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {Array.from({ length: 7 }, (_, dayIdx) => {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() + dayIdx);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);

            const dayPosts = filteredPosts
              .filter((p) => {
                const d = new Date(p.scheduledFor);
                return d >= dayStart && d < dayEnd;
              })
              .sort(
                (a, b) =>
                  new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
              );

            const isToday = dayIdx === 0;

            return (
              <div
                key={dayIdx}
                className={`p-2.5 rounded-xl border min-h-[135px] flex flex-col justify-between ${
                  isToday
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800 pb-1">
                    <span className="text-[10px] font-extrabold uppercase text-neutral-900 dark:text-neutral-100">
                      {isToday
                        ? 'Today'
                        : dayIdx === 1
                        ? 'Tomorrow'
                        : dayStart.toLocaleDateString([], { weekday: 'short' })}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {dayStart.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {dayPosts.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-neutral-400 italic">
                      No posts scheduled
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {dayPosts.map((dp) => {
                        const b = getBrand(dp.brandId);
                        return (
                          <div
                            key={dp.id}
                            className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-[10px] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono font-extrabold text-[9px]">
                                ⏰{' '}
                                {new Date(dp.scheduledFor).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="font-bold text-[9px] truncate max-w-[75px] text-neutral-600 dark:text-neutral-300">
                                {b?.name}
                              </span>
                            </div>
                            <p className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight">
                              {dp.title}
                            </p>
                            <div className="flex items-center gap-1 pt-0.5">
                              {dp.channels.slice(0, 4).map((ch) => (
                                <span key={ch} className="text-[9px]">
                                  {channelIcons[ch] || ch}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-3.5">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-xs">
            No posts found matching the selected filter. Generate content above to queue posts!
          </div>
        ) : (
          filteredPosts.map((post) => {
            const postBrand = getBrand(post.brandId);
            const isCurrentlyPublishing = publishingId === post.id;
            const isPublished = post.status === 'published';
            const hasPermalinks = post.publishedUrls && Object.keys(post.publishedUrls).length > 0;
            const hasLogs = post.publishLogs && post.publishLogs.length > 0;
            const isLogOpen = expandedLogId === post.id;

            return (
              <div
                key={post.id}
                className="p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-white dark:hover:bg-neutral-900 transition-colors space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Brand & Content Snapshot */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <BrandAvatar brand={postBrand} size="lg" />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {postBrand?.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {post.format}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isPublished
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : post.status === 'scheduled'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600'
                          }`}
                        >
                          {isPublished && <CheckCircle2 className="w-3 h-3" />}
                          {post.status.toUpperCase()}
                        </span>
                        {post.adConversionScore && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            🧪 Score: {post.adConversionScore.overall}/100
                          </span>
                        )}
                        {post.dmTriggerKeyword && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            💬 DM Trigger: &ldquo;{post.dmTriggerKeyword}&rdquo;
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {post.title}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {post.content}
                      </p>
                      {post.firstCommentPlug && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                          🔗 Auto-Plug 1st Comment: {post.firstCommentPlug}
                        </p>
                      )}

                      {/* Hashtags Pill List */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {post.tags.slice(0, 6).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium"
                            >
                              {t.startsWith('#') ? t : `#${t}`}
                            </span>
                          ))}
                          {post.tags.length > 6 && (
                            <span className="text-[10px] text-neutral-400 font-medium">
                              +{post.tags.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Channels Pill List */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {post.channels.map((ch) => (
                          <span
                            key={ch}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium uppercase flex items-center gap-1"
                          >
                            <span>{channelIcons[ch] || '🌐'}</span>
                            <span>{ch}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Date & Direct Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200 dark:border-neutral-800">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(post.scheduledFor).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {post.publishedAt && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Released {new Date(post.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPublished ? (
                        <button
                          onClick={() => handlePublishNow(post)}
                          disabled={isCurrentlyPublishing}
                          title="Direct 1-Click Publish to all selected channels"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isCurrentlyPublishing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Publish Now</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5" /> Live
                        </span>
                      )}

                      <button
                        onClick={() => handleCopyPost(post)}
                        title="Copy Caption & Hashtags to clipboard"
                        className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copiedPostId === post.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeletePost(post.id)}
                        title="Delete post"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Published Direct Permalinks Chips */}
                {isPublished && hasPermalinks && (
                  <div className="pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                        Direct Post Links:
                      </span>
                      {Object.entries(post.publishedUrls!).map(([ch, url]) => (
                        <a
                          key={ch}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs"
                        >
                          <span>{channelIcons[ch as SocialChannel] || '🔗'}</span>
                          <span className="capitalize">{ch}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>

                    {hasLogs && (
                      <button
                        onClick={() => setExpandedLogId(isLogOpen ? null : post.id)}
                        className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Audit Receipts ({post.publishLogs!.length})</span>
                        {isLogOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                )}

                {/* Audit Logs Accordion */}
                {isLogOpen && hasLogs && (
                  <div className="mt-2 p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Platform Dispatch Receipts
                    </div>
                    {post.publishLogs!.map((log, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            [{log.channel}]
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {log.message}
                          </span>
                        </div>
                        <span className="text-neutral-400 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
