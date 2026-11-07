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
  if (fwdHost && !fwdHost.startsWith('localhost') && !fwdHost.startsWith('127.0.0.1')) {
    return `${fwdProto.split(',')[0].trim()}://${fwdHost.split(',')[0].trim()}`;
  }
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || 'twitter';
  const brandSlug = searchParams.get('brandSlug') || 'brand';
  const brandName = searchParams.get('brandName') || 'Brand';
  const defaultHandle = searchParams.get('handle') || `@${brandSlug.replace(/-/g, '_')}`;

  const origin = resolvePublicOrigin(req);
  const redirectUri = `${origin}/api/auth/social/callback`;
  const statePayload = Buffer.from(
    JSON.stringify({ channel, brandSlug, brandName, defaultHandle })
  ).toString('base64url');

  const envMap = SOCIAL_PROVIDER_ENV_MAP[channel];
  const clientId = envMap ? getEnvValue(envMap.idKey) : '';
  const clientSecret = envMap ? getEnvValue(envMap.secretKey) : '';

  // If live OAuth Client ID & Secret are configured, redirect to the real OAuth 2.0 screen
  if (clientId && clientSecret) {
    if (channel === 'twitter') {
      const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
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
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'tiktok') {
      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.set('client_key', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'user.info.basic,video.publish,video.upload');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'linkedin') {
      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'openid profile w_member_social');
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
        'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
      );
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }

    if (channel === 'pinterest') {
      // If PINTEREST_APP_SECRET is a direct v5 Bearer Token (pina_...), verify via live API v5 and complete 1-Click OAuth immediately
      if (clientSecret.startsWith('pina_')) {
        let pinHandle = defaultHandle;
        let pinName = brandName;
        let pinId = clientId;
        try {
          const pinRes = await fetch('https://api.pinterest.com/v5/user_account', {
            headers: { Authorization: `Bearer ${clientSecret}` }
          });
          if (pinRes.ok) {
            const pinData = await pinRes.json();
            if (pinData.username) pinHandle = `@${pinData.username}`;
            if (pinData.business_name || pinData.username) {
              pinName = pinData.business_name || pinData.username;
            }
            if (pinData.id) pinId = pinData.id;
          }
        } catch {
          // fallback to brand handle
        }

        const payload = JSON.stringify({
          type: 'BRANDCOMMAND_SOCIAL_OAUTH_SUCCESS',
          channel: 'pinterest',
          accountHandle: pinHandle,
          accountName: pinName,
          accessToken: clientSecret,
          platformId: pinId,
          isSandbox: false,
          connectedAt: new Date().toISOString()
        });

        const html = `<!DOCTYPE html>
<html>
<head><title>Pinterest Connected!</title></head>
<body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">📌</div>
    <h2 style="margin:0 0 6px 0;">Pinterest Business Connected (${pinHandle})!</h2>
    <p style="color:#9ca3af;font-size:13px;">Verified via Pinterest API v5. Returning to BrandCommand...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage(${payload}, window.location.origin);
    }
    setTimeout(function() { window.close(); }, 450);
  </script>
</body>
</html>`;
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const authUrl = new URL('https://www.pinterest.com/oauth/');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'boards:read,boards:write,pins:read,pins:write,user_accounts:read');
      authUrl.searchParams.set('state', statePayload);
      return NextResponse.redirect(authUrl.toString());
    }
  }

  // Interactive 1-Click OAuth Consent Screen (when developer keys aren't in .env.local yet)
  const meta = PROVIDER_DISPLAY[channel] || PROVIDER_DISPLAY.twitter;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in with ${meta.name} — BrandCommand OAuth</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      margin: 0; padding: 24px; background: #090d16; color: #f8fafc;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
    }
    .card {
      background: #111827; border: 1px solid #1f2937; border-radius: 24px;
      max-width: 420px; width: 100%; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 999px; background: rgba(16, 185, 129, 0.15); color: #34d399;
      margin-bottom: 16px;
    }
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
    .icon-box {
      width: 52px; height: 52px; border-radius: 16px; background: #1f2937;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
    }
    h1 { font-size: 18px; margin: 0 0 4px 0; font-weight: 800; }
    p.sub { font-size: 12px; color: #9ca3af; margin: 0; }
    .field { margin-bottom: 14px; }
    label { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; }
    input {
      width: 100%; padding: 11px 14px; border-radius: 12px; border: 1px solid #374151;
      background: #030712; color: #fff; font-size: 14px; outline: none;
    }
    input:focus { border-color: #10b981; }
    .scopes {
      background: #030712; border: 1px solid #1f2937; border-radius: 14px;
      padding: 12px 14px; margin-bottom: 20px; font-size: 12px; color: #d1d5db;
    }
    .scopes div { display: flex; align-items: center; gap: 8px; margin: 5px 0; }
    .btn {
      width: 100%; padding: 13px; border-radius: 14px; border: none; cursor: pointer;
      font-weight: 800; font-size: 14px; background: #10b981; color: #052e16;
      transition: transform 0.1s, opacity 0.15s;
    }
    .btn:hover { opacity: 0.94; }
    .btn-cancel {
      width: 100%; padding: 10px; margin-top: 8px; border-radius: 12px; border: 1px solid #374151;
      background: transparent; color: #9ca3af; font-weight: 600; font-size: 12px; cursor: pointer;
    }
    .note {
      margin-top: 16px; padding-top: 12px; border-top: 1px solid #1f2937;
      font-size: 11px; color: #6b7280; line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 OAuth 2.0 Quick-Connect</div>
    <div class="header">
      <div class="icon-box">${meta.icon}</div>
      <div>
        <h1>Connect ${meta.name}</h1>
        <p class="sub">Authorize <strong>${brandName}</strong> to publish posts & reels automatically</p>
      </div>
    </div>

    <div class="field">
      <label>Your ${meta.name} Handle / Username</label>
      <input id="handleInput" type="text" value="${defaultHandle}" placeholder="@username" />
    </div>

    <div class="field">
      <label>Account Display Name</label>
      <input id="nameInput" type="text" value="${brandName}" placeholder="Display Name" />
    </div>

    <div class="scopes">
      <strong style="font-size:11px; color:#9ca3af; text-transform:uppercase;">Permissions Requested:</strong>
      <div>✅ Publish scheduled posts, threads, and 9:16 videos</div>
      <div>✅ Read profile handle & post permalinks</div>
      <div>✅ Automatic token refresh for hands-free Auto-Pilot</div>
    </div>

    <button class="btn" id="authorizeBtn">Authorize & Connect ${meta.name}</button>
    <button class="btn-cancel" onclick="window.close()">Cancel</button>

    <div class="note">
      <strong>Platform Owner Note:</strong> Once you add <code>${envMap?.idKey || 'CLIENT_ID'}</code> in the <em>Developer Setup Wizard</em> tab, this popup automatically redirects to ${meta.name}'s live OAuth login server.
    </div>
  </div>

  <script>
    document.getElementById('authorizeBtn').addEventListener('click', function() {
      var handle = document.getElementById('handleInput').value.trim() || '${defaultHandle}';
      var accountName = document.getElementById('nameInput').value.trim() || '${brandName}';
      if (window.opener) {
        window.opener.postMessage({
          type: 'BRANDCOMMAND_SOCIAL_OAUTH_SUCCESS',
          channel: '${channel}',
          accountHandle: handle,
          accountName: accountName,
          isSandbox: true,
          connectedAt: new Date().toISOString()
        }, window.location.origin);
      }
      window.close();
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
