'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Database,
  FileCheck,
  Eye,
  AlertCircle,
  ArrowLeft,
  Cookie,
  Server,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#101815] p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Legal Counsel Template Notice */}
        <div className="bg-[#FFF8E1] dark:bg-[#3D2C0D] border border-[#FFE082] dark:border-[#6B4E1B] rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-[#B78103] dark:text-[#FDD835] shrink-0 mt-0.5" />
          <div className="text-xs text-[#5D4037] dark:text-[#FFE082] leading-relaxed">
            <strong className="font-semibold block mb-0.5">
              [TEMPLATE — PLEASE REVIEW WITH YOUR LEGAL COUNSEL BEFORE LAUNCH]
            </strong>
            This privacy policy has been drafted specifically to reflect only the actual forms, local browser storage keys, and analytics services present in this application codebase. Before public launch, review and customize this policy to align with your organization’s specific legal and regulatory requirements.
          </div>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F1F2] dark:bg-[#3D1A10] text-[#006B61] dark:text-[#72C6AD] border border-[#006B61]/20 dark:border-[#72C6AD]/30 mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Data Protection &amp; Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2B25] dark:text-[#F6ECE7]">
            Privacy &amp; Data Collection Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#52665D] dark:text-[#B5C1B5] mt-2">
            Last Updated: November 2026 • Oil India Limited Enterprise Project Controls Platform (PLnEX)
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-[#1A2B25] dark:text-[#F6ECE7] leading-relaxed shadow-xs">
          {/* Section 1 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>1. Information We Collect Through Forms</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5] mb-3">
              We collect information strictly necessary to operate enterprise capital infrastructure project controls:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#52665D] dark:text-[#B5C1B5]">
              <li>
                <strong>Support Desk Inquiries:</strong> When submitting an operational ticket or inquiry via <Link href="/support" className="text-[#006B61] dark:text-[#72C6AD] underline">/support</Link>, we collect your full name, corporate email address, project code, activity ID, inquiry urgency, message description, and optional uploaded attachments.
              </li>
              <li>
                <strong>User Account Access:</strong> When registering or authenticating via <Link href="/login" className="text-[#006B61] dark:text-[#72C6AD] underline">/login</Link> or <Link href="/register" className="text-[#006B61] dark:text-[#72C6AD] underline">/register</Link>, we process your enterprise email, hashed credentials, tenant organization, and role permissions.
              </li>
              <li>
                <strong>Field Capture &amp; DPR Records:</strong> Site execution teams record physical quantities installed, equipment operating hours, weather delay remarks, and inspection photos with GPS coordinates for project audit trails.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <Cookie className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>2. Local Storage &amp; Cookies</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5] mb-3">
              This site uses minimal browser storage strictly to maintain operational reliability. We store the following local keys:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#E2E8F0] dark:border-[#3A5146] rounded-lg">
                <thead className="bg-[#F6F7F3] dark:bg-[#101815] border-b border-[#E2E8F0] dark:border-[#3A5146]">
                  <tr>
                    <th className="p-2.5 font-semibold">Storage Key</th>
                    <th className="p-2.5 font-semibold">Type</th>
                    <th className="p-2.5 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#3A5146]">
                  <tr>
                    <td className="p-2.5 font-mono text-[#006B61] dark:text-[#72C6AD]">plnex_theme</td>
                    <td className="p-2.5">Essential</td>
                    <td className="p-2.5">Saves light/dark mode preference</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[#006B61] dark:text-[#72C6AD]">plnex_user_session</td>
                    <td className="p-2.5">Essential</td>
                    <td className="p-2.5">Maintains active role and user identity state</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[#006B61] dark:text-[#72C6AD]">plnex_preferences</td>
                    <td className="p-2.5">Essential</td>
                    <td className="p-2.5">Stores UI density and field glove mode settings</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[#006B61] dark:text-[#72C6AD]">plnex_cookie_consent</td>
                    <td className="p-2.5">Essential</td>
                    <td className="p-2.5">Records user consent choice for analytics</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[#006B61] dark:text-[#72C6AD]">plnex_offline_queue</td>
                    <td className="p-2.5">Functional</td>
                    <td className="p-2.5">Caches offline field measurements pending cloud sync</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>3. Google Analytics 4 (GA4)</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5] mb-3">
              We utilize Google Analytics 4 (Measurement ID: <code className="font-mono text-xs px-1 py-0.5 rounded bg-[#F6F7F3] dark:bg-[#101815]">G-XXXXXXXXXX</code>) to analyze aggregate platform usage patterns:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#52665D] dark:text-[#B5C1B5]">
              <li>IP addresses are anonymized automatically.</li>
              <li>For visitors located in the European Union, United Kingdom, and Switzerland, GA4 scripts load in strict consent mode and will not store cookies until explicit user consent is granted.</li>
              <li>You may decline non-essential analytics cookies at any time via our Cookie Preferences banner.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>4. Third-Party Trackers &amp; Advertising</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5]">
              <strong>PLnEX contains zero third-party advertising trackers, data brokers, or behavioral retargeting pixels.</strong> We do not sell, rent, or monetize personal data or project controls records.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>5. Data Security &amp; Cryptographic Proof</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5]">
              All communication is encrypted using TLS 1.3 over HTTPS. Uploaded site photographs and material verification sheets are registered with SHA-256 cryptographic digests to ensure bit-level integrity against unauthorized modification.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F6ECE7] flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              <span>6. Contact Information</span>
            </h2>
            <p className="text-[#52665D] dark:text-[#B5C1B5]">
              For inquiries regarding project data privacy or to exercise data access and deletion rights, contact the Project Controls Office at{' '}
              <a href="mailto:privacy@oilindia.in" className="text-[#006B61] dark:text-[#72C6AD] font-semibold underline">
                privacy@oilindia.in
              </a>{' '}
              or visit the <Link href="/support" className="text-[#006B61] dark:text-[#72C6AD] underline">Support Desk</Link>.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-semibold text-[#1A2B25] dark:text-[#F6ECE7] rounded-lg shadow-2xs hover:bg-[#F6F7F3] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/support"
            className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold hover:underline"
          >
            Go to Help &amp; Support Desk &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
