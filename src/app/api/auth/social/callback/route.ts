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
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state') || '';
  const errorParam = searchParams.get('error');

  let state = {
    channel: 'twitter',
    brandSlug: 'brand',
    brandName: 'Brand',
    defaultHandle: '@brand'
  };

  try {
    if (stateParam) {
      state = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
    }
  } catch {
    // fallback to defaults
  }

  const channel = state.channel;
  const origin = resolvePublicOrigin(req);
  const redirectUri = `${origin}/api/auth/social/callback`;
  const envMap = SOCIAL_PROVIDER_ENV_MAP[channel];
  const clientId = envMap ? getEnvValue(envMap.idKey) : '';
  const clientSecret = envMap ? getEnvValue(envMap.secretKey) : '';

  let accessToken = '';
  let refreshToken = '';
  let accountHandle = state.defaultHandle;
  let accountName = state.brandName;
  let platformId = '';
  let isSandbox = true;

  if (code && clientId && clientSecret && !errorParam) {
    try {
      if (channel === 'twitter') {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code_verifier: 'brandcommand_pkce_challenge'
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token || '';
          isSandbox = false;

          const meRes = await fetch('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const meData = await meRes.json();
          if (meData.data) {
            accountHandle = `@${meData.data.username}`;
            accountName = meData.data.name || accountName;
            platformId = meData.data.id || '';
          }
        }
      } else if (channel === 'instagram' || channel === 'facebook') {
        const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
        tokenUrl.searchParams.set('client_id', clientId);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('client_secret', clientSecret);
        tokenUrl.searchParams.set('code', code);

        const tokenRes = await fetch(tokenUrl.toString());
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          isSandbox = false;

          const pagesRes = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${accessToken}`
          );
          const pagesData = await pagesRes.json();
          const firstPage = pagesData.data?.[0];
          if (firstPage) {
            if (channel === 'instagram' && firstPage.instagram_business_account) {
              platformId = firstPage.instagram_business_account.id;
              accountHandle = `@${firstPage.instagram_business_account.username || state.brandSlug}`;
              accountName = firstPage.instagram_business_account.name || firstPage.name;
              accessToken = firstPage.access_token || accessToken;
            } else {
              platformId = firstPage.id;
              accountName = firstPage.name || accountName;
              accountHandle = firstPage.name || accountHandle;
              accessToken = firstPage.access_token || accessToken;
            }
          }
        }
      } else if (channel === 'tiktok') {
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token || '';
          platformId = tokenData.open_id || '';
          isSandbox = false;
        }
      } else if (channel === 'linkedin') {
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          isSandbox = false;
          const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const meData = await meRes.json();
          if (meData.sub) {
            platformId = meData.sub;
            accountName = meData.name || accountName;
            accountHandle = meData.name || accountHandle;
          }
        }
      } else if (channel === 'youtube') {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token || '';
          isSandbox = false;
          const ytRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const ytData = await ytRes.json();
          const ch = ytData.items?.[0];
          if (ch) {
            platformId = ch.id;
            accountName = ch.snippet?.title || accountName;
            accountHandle = ch.snippet?.customUrl || `@${state.brandSlug}`;
          }
        }
      } else if (channel === 'pinterest') {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token || '';
          isSandbox = false;
          const pinUserRes = await fetch('https://api.pinterest.com/v5/user_account', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const pinUser = await pinUserRes.json();
          if (pinUser.username) {
            accountHandle = `@${pinUser.username}`;
            accountName = pinUser.business_name || pinUser.username || accountName;
            platformId = pinUser.id || '';
          }
        }
      }
    } catch (err) {
      console.warn(`OAuth token exchange error for ${channel}:`, err);
    }
  }

  const payload = JSON.stringify({
    type: 'BRANDCOMMAND_SOCIAL_OAUTH_SUCCESS',
    channel,
    accountHandle,
    accountName,
    accessToken,
    refreshToken,
    platformId,
    isSandbox,
    connectedAt: new Date().toISOString()
  });

  const html = `<!DOCTYPE html>
<html>
<head><title>Connected!</title></head>
<body style="background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">✅</div>
    <h2 style="margin:0 0 6px 0;">Account Connected!</h2>
    <p style="color:#9ca3af;font-size:13px;">Returning to BrandCommand...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage(${payload}, window.location.origin);
    }
    setTimeout(function() { window.close(); }, 350);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
