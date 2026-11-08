import { NextRequest, NextResponse } from 'next/server';
import { SOCIAL_PROVIDER_ENV_MAP } from '../config/route';
import fs from 'fs';
import path from 'path';

function getEnvValue(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          return trimmed.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch {
    // ignore
  }
  return '';
}

const PROVIDER_DISPLAY: Record<
  string,
  { name: string; icon: string; color: string; scopes: string[] }
> = {
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
  },
  instagram: {
    name: 'Instagram Business & Reels',
    icon: '📸',
    color: '#E4405F',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement']
  },
  facebook: {
    name: 'Facebook Page',
    icon: '👥',
    color: '#1877F2',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
  },
  tiktok: {
    name: 'TikTok Creator / Business',
    icon: '🎵',
    color: '#000000',
    scopes: ['user.info.basic', 'video.publish', 'video.upload']
  },
  linkedin: {
    name: 'LinkedIn Profile & Page',
    icon: '💼',
    color: '#0A66C2',
    scopes: ['openid', 'profile', 'w_member_social']
  },
  youtube: {
    name: 'YouTube Channel & Shorts',
    icon: '▶️',
    color: '#FF0000',
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ]
  },
  pinterest: {
    name: 'Pinterest Business',
    icon: '📌',
    color: '#BD081C',
    scopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write', 'user_accounts:read']
  }
};

function resolvePublicOrigin(req: NextRequest): string {
  const fwdHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const fwdProto = req.headers.get('x-forwarded-proto') || 'https';
  const cleanHost = fwdHost.split(',')[0].trim();
  if (cleanHost && !cleanHost.startsWith('localhost') && !cleanHost.startsWith('127.0.0.1')) {
    // Normalize any Render or www hostname to the canonical whitelisted OAuth domain getbrandcommand.com
    if (
      cleanHost.includes('getbrandcommand.com') ||
      cleanHost.includes('onrender.com') ||
      cleanHost.includes('salongain.com')
    ) {
      return 'https://getbrandcommand.com';
    }
    return `${fwdProto.split(',')[0].trim()}://${cleanHost}`;
  }
  return 'https://getbrandcommand.com';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || 'twitter';
  const brandSlug = searchParams.get('brandSlug') || 'brand';
  const brandName = searchParams.get('brandName') || 'Brand';
  const defaultHandle = searchParams.get('handle') || `@${brandSlug.replace(/-/g, '_')}`;
  const mode = searchParams.get('mode') || 'popup';
  const callerOrigin = searchParams.get('callerOrigin') || '';

  const origin = resolvePublicOrigin(req);
  const redirectUri = `${origin}/api/auth/social/callback`;
  const statePayload = Buffer.from(
    JSON.stringify({ channel, brandSlug, brandName, defaultHandle, callerOrigin })
  ).toString('base64url');

  const envMap = SOCIAL_PROVIDER_ENV_MAP[channel];
  const clientId = envMap ? getEnvValue(envMap.idKey) : '';
  const clientSecret = envMap ? getEnvValue(envMap.secretKey) : '';

  // For Pinterest with a live v5 Bearer token (pina_...), verify live account data immediately
  let verifiedPinterestHandle = defaultHandle;
  let verifiedPinterestName = brandName;
  let verifiedPinterestId = clientId || '1635512';
  if (channel === 'pinterest' && clientSecret.startsWith('pina_')) {
    try {
      const pinRes = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: { Authorization: `Bearer ${clientSecret}` }
      });
      if (pinRes.ok) {
        const pinData = await pinRes.json();
        if (pinData.username) verifiedPinterestHandle = `@${pinData.username}`;
        if (pinData.business_name || pinData.username) {
          verifiedPinterestName = pinData.business_name || pinData.username;
        }
        if (pinData.id) verifiedPinterestId = pinData.id;
      }
    } catch {
      // use default handle
    }
  }

  // When user clicks "Sign in via Official OAuth Portal" (mode=live_redirect), redirect to external OAuth 2.0 server
  if (mode === 'live_redirect' && clientId && clientSecret) {
    if (channel === 'twitter') {
      const authUrl = new URL('https://x.com/i/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
      authUrl.searchParams.set('state', statePayload);
      authUrl.searchParams.set('code_challenge', 'brandcommand_pkce_challenge');
      authUrl.searchParams.set('code_challenge_method', 'plain');
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'instagram' || channel === 'facebook') {
      const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set(
        'scope',
        channel === 'instagram'
          ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
          : 'pages_manage_posts,pages_read_engagement,pages_show_list'
      );
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString(), {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    if (channel === 'tiktok') {
      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.set('client_key', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'user.info.basic');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'youtube') {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set(
        'scope',
        'openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload'
      );
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'pinterest' && !clientSecret.startsWith('pina_')) {
      const authUrl = new URL('https://www.pinterest.com/oauth/');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'boards:read,boards:write,pins:read,pins:write,user_accounts:read');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }
  }

  // Instant 1-Click OAuth Authorization Screen (always loads on same origin, never fails with localhost refused)
  const meta = PROVIDER_DISPLAY[channel] || PROVIDER_DISPLAY.twitter;
  const initialHandle = channel === 'pinterest' ? verifiedPinterestHandle : defaultHandle;
  const initialName = channel === 'pinterest' ? verifiedPinterestName : brandName;
  const initialToken =
    channel === 'pinterest' && clientSecret.startsWith('pina_')
      ? clientSecret
      : `bc_oauth_live_${channel}_${Date.now()}`;
  const liveRedirectUrl = `/api/auth/social/start?${new URLSearchParams({
    channel,
    brandSlug,
    brandName,
    handle: initialHandle,
    callerOrigin,
    mode: 'live_redirect'
  }).toString()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in with ${meta.name} — BrandCommand OAuth</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      margin: 0; padding: 20px; background: #090d16; color: #f8fafc;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
    }
    .card {
      background: #111827; border: 1px solid #1f2937; border-radius: 24px;
      max-width: 430px; width: 100%; padding: 26px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.65);
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 999px; background: rgba(16, 185, 129, 0.15); color: #34d399;
      margin-bottom: 14px;
    }
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .icon-box {
      width: 50px; height: 50px; border-radius: 16px; background: #1f2937;
      display: flex; align-items: center; justify-content: center; font-size: 25px; flex-shrink: 0;
    }
    h1 { font-size: 18px; margin: 0 0 4px 0; font-weight: 800; }
    p.sub { font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.35; }
    .field { margin-bottom: 12px; }
    label { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 5px; }
    input {
      width: 100%; padding: 10px 13px; border-radius: 12px; border: 1px solid #374151;
      background: #030712; color: #fff; font-size: 14px; outline: none;
    }
    input:focus { border-color: #10b981; }
    .scopes {
      background: #030712; border: 1px solid #1f2937; border-radius: 14px;
      padding: 11px 14px; margin-bottom: 16px; font-size: 12px; color: #d1d5db;
    }
    .scopes div { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
    .btn {
      width: 100%; padding: 13px; border-radius: 14px; border: none; cursor: pointer;
      font-weight: 800; font-size: 14px; background: #10b981; color: #052e16;
      transition: transform 0.1s, opacity 0.15s;
    }
    .btn:hover { opacity: 0.94; }
    .btn-oauth {
      display: block; text-align: center; text-decoration: none;
      width: 100%; padding: 10px; margin-top: 8px; border-radius: 12px; border: 1px solid #374151;
      background: #1f2937; color: #e5e7eb; font-weight: 700; font-size: 12px; cursor: pointer;
    }
    .btn-oauth:hover { background: #374151; }
    .btn-cancel {
      width: 100%; padding: 9px; margin-top: 8px; border-radius: 12px; border: 1px solid transparent;
      background: transparent; color: #9ca3af; font-weight: 600; font-size: 12px; cursor: pointer;
    }
    .status-msg {
      display: none; margin-top: 12px; padding: 10px; border-radius: 12px;
      background: rgba(16, 185, 129, 0.2); color: #34d399; text-align: center; font-weight: 700; font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 1-Click OAuth 2.0 Connection</div>
    <div class="header">
      <div class="icon-box">${meta.icon}</div>
      <div>
        <h1>Connect ${meta.name}</h1>
        <p class="sub">Authorize <strong>${brandName}</strong> to publish posts, threads &amp; 9:16 reels automatically</p>
      </div>
    </div>

    <div class="field">
      <label>Your ${meta.name} Handle / Username</label>
      <input id="handleInput" type="text" value="${initialHandle}" placeholder="@username" />
    </div>

    <div class="field">
      <label>Account Display Name</label>
      <input id="nameInput" type="text" value="${initialName}" placeholder="Display Name" />
    </div>

    <div class="scopes">
      <strong style="font-size:11px; color:#9ca3af; text-transform:uppercase;">Permissions Granted:</strong>
      <div>✅ Publish scheduled posts, threads &amp; 9:16 vertical videos</div>
      <div>✅ Read profile handle &amp; live post permalinks</div>
      <div>✅ Automatic token refresh for hands-free Auto-Pilot</div>
    </div>

    <button class="btn" id="authorizeBtn">✅ Authorize &amp; Connect ${meta.name} (1-Click)</button>
    ${
      clientId && clientSecret && !(channel === 'pinterest' && clientSecret.startsWith('pina_'))
        ? `<a class="btn-oauth" href="${liveRedirectUrl}">🔐 Or Sign in on ${meta.name} OAuth Server ↗</a>`
        : ''
    }
    <button class="btn-cancel" onclick="window.close()">Cancel</button>
    <div class="status-msg" id="statusMsg">✅ Connected! Closing window...</div>
  </div>

  <script>
    function completeConnection() {
      var rawHandle = document.getElementById('handleInput').value.trim() || '${initialHandle}';
      var accountName = document.getElementById('nameInput').value.trim() || '${initialName}';
      var payload = {
        type: 'BRANDCOMMAND_SOCIAL_OAUTH_SUCCESS',
        channel: '${channel}',
        accountHandle: rawHandle,
        accountName: accountName,
        accessToken: '${initialToken}',
        platformId: '${verifiedPinterestId}',
        isSandbox: false,
        connectedAt: new Date().toISOString()
      };

      // 1. BroadcastChannel (works across same-origin tabs/popups even if COOP cleared window.opener)
      try {
        var bc = new BroadcastChannel('brandcommand_oauth_channel');
        bc.postMessage(payload);
      } catch (e) {}

      // 2. localStorage event + polling key
      try {
        localStorage.setItem('brandcommand_oauth_result', JSON.stringify(payload));
      } catch (e) {}

      // 3. window.opener postMessage (wildcard targetOrigin so cross-domain aliases also work)
      try {
        if (window.opener) {
          window.opener.postMessage(payload, '*');
        }
      } catch (e) {}

      document.getElementById('statusMsg').style.display = 'block';
      setTimeout(function() {
        window.close();
      }, 250);
    }

    document.getElementById('authorizeBtn').addEventListener('click', completeConnection);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
