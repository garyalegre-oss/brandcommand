import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ProviderEnvMapping {
  channel: string;
  idKey: string;
  secretKey: string;
}

export const SOCIAL_PROVIDER_ENV_MAP: Record<string, { idKey: string; secretKey: string }> = {
  twitter: { idKey: 'X_CLIENT_ID', secretKey: 'X_CLIENT_SECRET' },
  instagram: { idKey: 'META_APP_ID', secretKey: 'META_APP_SECRET' },
  facebook: { idKey: 'META_APP_ID', secretKey: 'META_APP_SECRET' },
  tiktok: { idKey: 'TIKTOK_CLIENT_KEY', secretKey: 'TIKTOK_CLIENT_SECRET' },
  linkedin: { idKey: 'LINKEDIN_CLIENT_ID', secretKey: 'LINKEDIN_CLIENT_SECRET' },
  youtube: { idKey: 'GOOGLE_CLIENT_ID', secretKey: 'GOOGLE_CLIENT_SECRET' },
  pinterest: { idKey: 'PINTEREST_APP_ID', secretKey: 'PINTEREST_APP_SECRET' },
  ayrshare: { idKey: 'AYRSHARE_API_KEY', secretKey: 'AYRSHARE_PROFILE_KEY' }
};

function readEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const values: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        values[key] = val;
      }
    }
  }
  return values;
}

export async function GET() {
  const fileEnv = readEnvFile();
  const status: Record<
    string,
    { configured: boolean; clientIdPreview: string; idKey: string; secretKey: string }
  > = {};

  for (const [provider, keys] of Object.entries(SOCIAL_PROVIDER_ENV_MAP)) {
    const idVal = fileEnv[keys.idKey] || process.env[keys.idKey] || '';
    const secretVal = fileEnv[keys.secretKey] || process.env[keys.secretKey] || '';
    const isConfigured =
      provider === 'ayrshare' ? Boolean(idVal) : Boolean(idVal && secretVal);

    status[provider] = {
      configured: isConfigured,
      clientIdPreview: idVal ? `${idVal.slice(0, 6)}...${idVal.slice(-4)}` : '',
      idKey: keys.idKey,
      secretKey: keys.secretKey
    };
  }

  return NextResponse.json({ providers: status });
}

export async function POST(req: NextRequest) {
  try {
    const { provider, clientId, clientSecret } = await req.json();
    const mapping = SOCIAL_PROVIDER_ENV_MAP[provider];
    if (!mapping) {
      return NextResponse.json({ error: 'Unknown social provider' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const existing = readEnvFile();

    if (clientId !== undefined) {
      existing[mapping.idKey] = clientId.trim();
      process.env[mapping.idKey] = clientId.trim();
    }
    if (clientSecret !== undefined) {
      existing[mapping.secretKey] = clientSecret.trim();
      process.env[mapping.secretKey] = clientSecret.trim();
    }

    const lines = Object.entries(existing).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      provider,
      configured:
        provider === 'ayrshare'
          ? Boolean(existing[mapping.idKey])
          : Boolean(existing[mapping.idKey] && existing[mapping.secretKey])
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save developer credentials to .env.local' },
      { status: 500 }
    );
  }
}
