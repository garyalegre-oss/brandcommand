import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — BrandCommand (getbrandcommand.com)',
  description: 'Privacy Policy and Social OAuth Data Deletion Policy for BrandCommand (getbrandcommand.com).'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:underline"
        >
          ← Back to BrandCommand Studio
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-neutral-400">
          Effective Date: November 5, 2026 • Domain: <strong>getbrandcommand.com</strong>
        </p>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Overview</h2>
          <p>
            BrandCommand (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), accessible at{' '}
            <strong>https://getbrandcommand.com</strong>, provides an AI-powered social media content
            creation, scheduling, and direct-publishing platform.
          </p>
        </section>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">
            2. Social Media OAuth Permissions &amp; Data Usage
          </h2>
          <p>
            When you connect your social accounts (Instagram, Facebook, TikTok, X / Twitter, YouTube,
            or Pinterest) via OAuth 2.0:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              We only request permissions needed to display your connected handle and publish or
              schedule content that you explicitly approve or configure via Auto-Pilot.
            </li>
            <li>
              We never sell, rent, or share your OAuth access tokens or profile data with third
              parties.
            </li>
            <li>
              You may disconnect any social account at any time in 1 click inside the{' '}
              <strong>Social Connections</strong> hub.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">3. User Data Deletion Instructions</h2>
          <p>
            To revoke access and delete all stored OAuth tokens and social account metadata associated
            with your account:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Open BrandCommand at <strong>https://getbrandcommand.com</strong> and click{' '}
              <strong>🔌 Socials</strong> in the top bar.
            </li>
            <li>
              Click <strong>Disconnect</strong> next to any connected platform to immediately purge its
              OAuth token, or email <strong>gary@alegretechnologies.com</strong> for full account
              deletion within 24 hours.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
