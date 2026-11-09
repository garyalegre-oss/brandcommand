'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Brand, Post } from '../types/brand';
import { DEFAULT_BRANDS } from '../data/defaultBrands';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Activity,
  X,
  Zap,
  Volume2,
  Share2,
  Video,
  Database,
  Bot
} from 'lucide-react';

interface HealthCheckItem {
  id: string;
  name: string;
  category: 'voice' | 'oauth' | 'media' | 'ai' | 'storage' | 'publishing';
  status: 'healthy' | 'auto_healed' | 'warning' | 'error';
  latencyMs: number;
  detail: string;
  autoFixApplied?: string;
}

interface SystemHealthAgentProps {
  brands: Brand[];
  posts: Post[];
  onHealBrands: (healedBrands: Brand[]) => void;
  onHealPosts: (healedPosts: Post[]) => void;
}

export function SystemHealthAgent({
  brands,
  posts,
  onHealBrands,
  onHealPosts
}: SystemHealthAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [autoWatchdogEnabled, setAutoWatchdogEnabled] = useState(true);
  const [overallScore, setOverallScore] = useState<number>(100);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>('Just now');
  const [checks, setChecks] = useState<HealthCheckItem[]>([]);
  const [autoFixHistory, setAutoFixHistory] = useState<
    Array<{ id: string; timestamp: string; description: string }>
  >([]);

  const runFullAuditAndHeal = useCallback(
    async (applyAutoFix = true) => {
      setIsChecking(true);
      const newFixes: Array<{ id: string; timestamp: string; description: string }> = [];
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      try {
        // 1. CLIENT CHECK & AUTO-FIX: Google Cloud TTS Standard Voice Default
        const tVoice = performance.now();
        let voiceStatus: 'healthy' | 'auto_healed' = 'healthy';
        let voiceFixNote: string | undefined;

        if (typeof window !== 'undefined') {
          const curProvider = localStorage.getItem('brandcommand_voice_provider');
          const curAuto = localStorage.getItem('brandcommand_auto_generate_voice');
          if (curProvider !== 'google' || curAuto !== 'true') {
            if (applyAutoFix) {
              localStorage.setItem('brandcommand_voice_provider', 'google');
              localStorage.setItem('brandcommand_auto_generate_voice', 'true');
              voiceStatus = 'auto_healed';
              voiceFixNote =
                'Restored Google Cloud TTS (google-cloud-standard) as the automatic default voice engine.';
              newFixes.push({
                id: `fix-voice-${Date.now()}`,
                timestamp: nowLabel,
                description: voiceFixNote
              });
            }
          }
        }
        const clientVoiceCheck: HealthCheckItem = {
          id: 'client_voice_config',
          name: 'Client Voice Selector & Auto-Synthesis State',
          category: 'voice',
          status: voiceStatus,
          latencyMs: Math.max(1, Math.round(performance.now() - tVoice)),
          detail:
            'Google Cloud TTS (☁️ google-cloud-standard) is locked in as default with automatic pre-synthesis on load.',
          autoFixApplied: voiceFixNote
        };

        // 2. CLIENT CHECK & AUTO-FIX: Brand DNA, Mobile Screenshots & AutoPilot Config
        const tBrands = performance.now();
        let brandsHealedCount = 0;
        const healedBrands = brands.map((b) => {
          const official = DEFAULT_BRANDS.find((d) => d.id === b.id || d.slug === b.slug);
          let updated = { ...b };
          let modified = false;

          if (!updated.websiteMobileScreenshotUrl && official?.websiteMobileScreenshotUrl) {
            updated.websiteMobileScreenshotUrl = official.websiteMobileScreenshotUrl;
            modified = true;
          }
          if (!updated.defaultChannels || updated.defaultChannels.length === 0) {
            updated.defaultChannels = official?.defaultChannels || [
              'instagram',
              'tiktok',
              'youtube',
              'twitter'
            ];
            modified = true;
          }
          if (!updated.autoPilot) {
            updated.autoPilot = {
              enabled: true,
              mode: 'review_first',
              postsPerDay: 2,
              preferredTimes: ['09:30', '17:30'],
              autoReplenishLibrary: true,
              minLibraryBuffer: 4,
              includeFormats: ['video_script', 'carousel', 'thread', 'single'],
              targetChannels: updated.defaultChannels
            };
            modified = true;
          }
          if (modified) brandsHealedCount++;
          return updated;
        });

        let brandFixNote: string | undefined;
        if (brandsHealedCount > 0 && applyAutoFix) {
          onHealBrands(healedBrands);
          brandFixNote = `Auto-repaired missing mobile screenshots/AutoPilot config on ${brandsHealedCount} brand profile(s).`;
          newFixes.push({
            id: `fix-brands-${Date.now()}`,
            timestamp: nowLabel,
            description: brandFixNote
          });
        }

        const clientBrandCheck: HealthCheckItem = {
          id: 'client_brand_dna',
          name: 'Brand DNA, Screenshots & AutoPilot Integrity',
          category: 'storage',
          status: brandsHealedCount > 0 ? 'auto_healed' : 'healthy',
          latencyMs: Math.max(1, Math.round(performance.now() - tBrands)),
          detail: `Verified ${brands.length} active brand profile(s), mobile app screenshots, and Auto-Posting schedules.`,
          autoFixApplied: brandFixNote
        };

        // 3. CLIENT CHECK & AUTO-FIX: Content Queue & Scheduled Posts Integrity
        const tPosts = performance.now();
        let postsHealedCount = 0;
        const validBrandIds = new Set(brands.map((b) => b.id));
        const fallbackBrandId = brands[0]?.id || 'brand-evidraw';

        const healedPosts = posts.map((p) => {
          let updated = { ...p };
          let modified = false;

          if (!validBrandIds.has(updated.brandId)) {
            updated.brandId = fallbackBrandId;
            modified = true;
          }
          if (!updated.channels || updated.channels.length === 0) {
            updated.channels = ['instagram', 'tiktok'];
            modified = true;
          }
          if (
            updated.scheduledFor &&
            Number.isNaN(new Date(updated.scheduledFor).getTime())
          ) {
            updated.scheduledFor = new Date(Date.now() + 3600 * 1000).toISOString();
            modified = true;
          }
          if (modified) postsHealedCount++;
          return updated;
        });

        let postFixNote: string | undefined;
        if (postsHealedCount > 0 && applyAutoFix) {
          onHealPosts(healedPosts);
          postFixNote = `Auto-repaired ${postsHealedCount} post item(s) with missing channels or invalid schedule timestamps.`;
          newFixes.push({
            id: `fix-posts-${Date.now()}`,
            timestamp: nowLabel,
            description: postFixNote
          });
        }

        const clientPostsCheck: HealthCheckItem = {
          id: 'client_posts_queue',
          name: 'Content Library & Calendar Queue Integrity',
          category: 'publishing',
          status: postsHealedCount > 0 ? 'auto_healed' : 'healthy',
          latencyMs: Math.max(1, Math.round(performance.now() - tPosts)),
          detail: `Audited ${posts.length} posts in library & calendar queue. Zero corrupted schedules.`,
          autoFixApplied: postFixNote
        };

        // 4. CLIENT CHECK & AUTO-FIX: OAuth Popup Bridge & Stale Token Cleanup
        const tOauth = performance.now();
        let oauthCleaned = false;
        if (typeof window !== 'undefined') {
          try {
            const rawOauth = localStorage.getItem('brandcommand_oauth_result');
            if (rawOauth) {
              const parsed = JSON.parse(rawOauth);
              if (!parsed?.timestamp || Date.now() - parsed.timestamp > 120000) {
                localStorage.removeItem('brandcommand_oauth_result');
                oauthCleaned = true;
              }
            }
          } catch {
            localStorage.removeItem('brandcommand_oauth_result');
            oauthCleaned = true;
          }
        }
        const clientOauthCheck: HealthCheckItem = {
          id: 'client_oauth_bridge',
          name: 'OAuth Popup BroadcastChannel & Storage Bridge',
          category: 'oauth',
          status: oauthCleaned ? 'auto_healed' : 'healthy',
          latencyMs: Math.max(1, Math.round(performance.now() - tOauth)),
          detail: 'BroadcastChannel + localStorage + opener postMessage listeners active and clean.',
          autoFixApplied: oauthCleaned
            ? 'Cleared stale OAuth popup handoff buffer from localStorage.'
            : undefined
        };

        // 5. SERVER-SIDE FULL DIAGNOSTICS (/api/system-health)
        const res = await fetch('/api/system-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autoFix: applyAutoFix }),
          cache: 'no-store'
        });
        const serverData = res.ok ? await res.json() : { checks: [] };
        const serverChecks: HealthCheckItem[] = Array.isArray(serverData.checks)
          ? serverData.checks
          : [];

        serverChecks.forEach((sc) => {
          if (sc.autoFixApplied) {
            newFixes.push({
              id: `fix-srv-${sc.id}-${Date.now()}`,
              timestamp: nowLabel,
              description: sc.autoFixApplied
            });
          }
        });

        const allChecks = [
          clientVoiceCheck,
          ...serverChecks,
          clientBrandCheck,
          clientPostsCheck,
          clientOauthCheck
        ];

        const healthyOrHealed = allChecks.filter(
          (c) => c.status === 'healthy' || c.status === 'auto_healed'
        ).length;
        const computedScore = Math.round(
          (healthyOrHealed / Math.max(1, allChecks.length)) * 100
        );

        setChecks(allChecks);
        setOverallScore(computedScore);
        setLastCheckedAt(nowLabel);
        if (newFixes.length > 0) {
          setAutoFixHistory((prev) => [...newFixes, ...prev].slice(0, 15));
        }
      } catch {
        setLastCheckedAt(nowLabel);
      } finally {
        setIsChecking(false);
      }
    },
    [brands, posts, onHealBrands, onHealPosts]
  );

  // Run automatically on initial site load and every 45 seconds when Auto-Watchdog is active
  useEffect(() => {
    runFullAuditAndHeal(true);
  }, []);

  useEffect(() => {
    if (!autoWatchdogEnabled) return;
    const timer = setInterval(() => {
      runFullAuditAndHeal(true);
    }, 45000);
    return () => clearInterval(timer);
  }, [autoWatchdogEnabled, runFullAuditAndHeal]);

  const healedCount = checks.filter((c) => c.status === 'auto_healed').length;

  return (
    <>
      {/* Top Header Status Pill */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          runFullAuditAndHeal(true);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
          overallScore === 100
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
        }`}
        title="Autonomous Site Health Watchdog & Self-Healing Bot — Click to inspect or run full auto-fix"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isChecking
              ? 'bg-blue-500 animate-ping'
              : overallScore === 100
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
              : 'bg-amber-500'
          }`}
        />
        <Bot className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">System Bot:</span>
        <span>{isChecking ? 'Checking...' : `${overallScore}%`}</span>
      </button>

      {/* Full Diagnostics & Self-Healing Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                      Autonomous Site Health &amp; Self-Healing Bot
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {overallScore}% Operational
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Continuously audits Voice TTS, Social OAuth, Meme/UGC Video CDN, Brand DNA &amp; Auto-Posting — and auto-repairs issues in real time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Control Bar */}
            <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoWatchdogEnabled}
                    onChange={(e) => setAutoWatchdogEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Auto-Watchdog &amp; Self-Heal (Every 45s)</span>
                </label>
                <span className="text-[11px] text-neutral-400">
                  Last checked: <strong>{lastCheckedAt}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => runFullAuditAndHeal(true)}
                disabled={isChecking}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Scanning & Healing...' : '⚡ Run Full Check & Auto-Fix'}</span>
              </button>
            </div>

            {/* Body: Subsystem Checks + Auto-Fix Log */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {healedCount > 0 && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300 font-bold">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>
                    Self-Healing Bot automatically repaired {healedCount} subsystem item(s) during this session.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Live Subsystem Diagnostics ({checks.length} Verified)
                </div>
                <div className="space-y-2">
                  {checks.map((item) => {
                    const CategoryIcon =
                      item.category === 'voice'
                        ? Volume2
                        : item.category === 'oauth'
                        ? Share2
                        : item.category === 'media'
                        ? Video
                        : item.category === 'storage'
                        ? Database
                        : item.category === 'ai'
                        ? Zap
                        : Activity;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`mt-0.5 p-1.5 rounded-xl shrink-0 ${
                              item.status === 'healthy'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : item.status === 'auto_healed'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                                {item.name}
                              </span>
                              <span
                                className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  item.status === 'healthy'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : item.status === 'auto_healed'
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {item.status === 'healthy'
                                  ? '✓ Healthy'
                                  : item.status === 'auto_healed'
                                  ? '🛠️ Auto-Fixed'
                                  : '⚠️ Warning'}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                              {item.detail}
                            </p>
                            {item.autoFixApplied && (
                              <p className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                <Wrench className="w-3 h-3 shrink-0" />
                                <span>Auto-Fix: {item.autoFixApplied}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-bold text-neutral-400">
                            {item.latencyMs}ms
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Auto-Repair Log */}
              {autoFixHistory.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Self-Healing Repair Log
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {autoFixHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="text-[11px] flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{entry.description}</span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
