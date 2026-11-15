'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Layers,
  Camera,
  Cpu,
  TrendingUp,
  Activity,
  ShieldCheck,
  Sliders,
  HelpCircle,
  FileText,
  Search,
} from 'lucide-react';

export default function HelpPage() {
  const guideSections = [
    {
      title: 'Platform Overview & Fundamentals',
      description:
        'Core architecture of PLnEX: connecting field actuals with Primavera P6 baselines and automated variance detection.',
      href: '/dashboard',
      actionText: 'Explore Dashboard Overview',
      icon: Layers,
      topics: ['Planning-to-Execution bridge', 'Role permissions', 'Offline-first architecture'],
    },
    {
      title: 'Field Capture & DPR Procedures',
      description:
        'Step-by-step instructions for field engineers to record daily workfront quantities, upload GPS evidence, and submit shift DPRs.',
      href: '/field/capture',
      actionText: 'Open Daily Field Capture',
      icon: Camera,
      topics: ['Quantity measurement', 'Surveyor photo proof', 'End-of-shift DPR sign-off'],
    },
    {
      title: 'AI Schedule Linking & Mapping',
      description:
        'How unstructured WhatsApp logs, site diaries, and contractor claims are matched against official WBS activity codes.',
      href: '/matching',
      actionText: 'View Schedule Linking Engine',
      icon: Cpu,
      topics: ['Semantic matching algorithm', 'Discipline alignment', 'Confidence scoring'],
    },
    {
      title: 'Earned Value Management (EVM)',
      description:
        'Interpreting S-Curves, Planned Value (PV), Earned Value (EV), Actual Cost (AC), and Schedule Performance Index (SPI).',
      href: '/progress',
      actionText: 'Inspect S-Curve Analytics',
      icon: TrendingUp,
      topics: ['Cumulative progress tracking', 'Critical path slippage', 'COD forecasting'],
    },
    {
      title: 'Risk & Delay Impact Modeling',
      description:
        'Managing delay events, tracking float consumption, evaluating weather downtime, and calculating downstream impacts.',
      href: '/risks',
      actionText: 'Review Delay Matrix',
      icon: Activity,
      topics: ['Zero float alerts', 'Delay root causes', 'Mitigation pathway tracking'],
    },
    {
      title: 'Interactive Support & Knowledge Base',
      description:
        'Have a specific question? Browse our searchable FAQ repository, operational playbooks, or contact technical support.',
      href: '/support',
      actionText: 'Visit Help & Support Desk',
      icon: HelpCircle,
      topics: ['Searchable FAQs', 'Ticket drafting', 'Direct specialist assistance'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#101815] p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F1F2] dark:bg-[#3D1A10] text-[#006B61] dark:text-[#72C6AD] border border-[#006B61]/20 dark:border-[#72C6AD]/30 mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>PLnEX Documentation Library</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2B25] dark:text-[#F6ECE7]">
                User Guides & System Documentation
              </h1>
              <p className="text-sm text-[#52665D] dark:text-[#B5C1B5] max-w-2xl mt-2 leading-relaxed">
                Comprehensive operational guides, standard operating procedures, and best practices for Oil India Limited capital infrastructure project controls.
              </p>
            </div>

            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006B61] hover:bg-[#00524A] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Contact Support Desk</span>
            </Link>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {guideSections.map((guide) => {
            const Icon = guide.icon;
            return (
              <div
                key={guide.title}
                className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:border-[#006B61] dark:hover:border-[#72C6AD] transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#006B61]/10 dark:bg-[#72C6AD]/20 flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-semibold text-[#1A2B25] dark:text-[#F6ECE7] mb-2">
                    {guide.title}
                  </h2>
                  <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] leading-relaxed mb-4">
                    {guide.description}
                  </p>

                  <div className="space-y-1 mb-6">
                    {guide.topics.map((t) => (
                      <div
                        key={t}
                        className="flex items-center gap-1.5 text-[11px] text-[#52665D] dark:text-[#B5C1B5]"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#006B61] dark:bg-[#72C6AD]" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={guide.href}
                  className="inline-flex items-center justify-between pt-3 border-t border-[#E2E8F0] dark:border-[#3A5146] text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:text-[#00524A] dark:hover:text-[#94D2BD] transition-colors"
                >
                  <span>{guide.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer Cross-Links */}
        <div className="bg-[#F6F7F3] dark:bg-[#2A120A] border border-[#E2E8F0] dark:border-[#3A5146] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-semibold text-[#1A2B25] dark:text-[#F6ECE7]">
              Need direct technical assistance?
            </h3>
            <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">
              Search our 14+ interactive FAQ playbooks or submit an operational inquiry ticket.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/support"
              className="px-4 py-2 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F6ECE7] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-xs font-medium rounded-lg shadow-2xs transition-colors"
            >
              Browse FAQs &amp; Help Desk
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-[#006B61] hover:bg-[#00524A] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
