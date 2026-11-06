import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — BrandCommand (brandcommand.salongain.com)',
  description: 'Terms of Service for BrandCommand (brandcommand.salongain.com).'
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:underline"
        >
          ← Back to BrandCommand Studio
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-xs text-neutral-400">
          Effective Date: November 5, 2026 • Domain: <strong>brandcommand.salongain.com</strong>
        </p>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using BrandCommand at <strong>https://brandcommand.salongain.com</strong>, you
            agree to these Terms of Service and all applicable rules of the connected social networks
            (Instagram/Meta, TikTok, X, YouTube/Google, and Pinterest).
          </p>
        </section>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">2. Authorized Social Publishing</h2>
          <p>
            You retain full ownership of all content, videos, carousels, and captions generated or
            published through BrandCommand. You are solely responsible for ensuring that content
            published to your connected social accounts complies with each platform&apos;s community
            guidelines and terms.
          </p>
        </section>

        <section className="space-y-2 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white">3. Contact</h2>
          <p>
            For support or inquiries regarding BrandCommand, contact{' '}
            <strong>gary@alegretechnologies.com</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
