'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  FolderKanban,
  Layers,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  Home,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const quickLinks = [
    {
      title: 'Executive Dashboard',
      description: 'Portfolio overview, milestone health, and critical metrics',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Main',
    },
    {
      title: 'Capital Projects',
      description: 'Explore the full directory of active infrastructure projects',
      href: '/projects',
      icon: FolderKanban,
      badge: 'Portfolio',
    },
    {
      title: '4D Schedule Twin',
      description: 'Interactive CPM network and real-time field variance twin',
      href: '/schedule-twin',
      icon: Layers,
      badge: 'Interactive',
    },
    {
      title: 'Field Evidence Vault',
      description: 'Inspect verified site photographs, tests, and lift tickets',
      href: '/evidence',
      icon: ShieldCheck,
      badge: 'Audit',
    },
    {
      title: 'Project Controls Reports',
      description: 'Executive summaries, monthly variance, and historical lessons',
      href: '/reports',
      icon: BookOpen,
      badge: 'Exports',
    },
    {
      title: 'Help & Support Desk',
      description: 'System documentation, operational FAQs, and user assistance',
      href: '/support',
      icon: HelpCircle,
      badge: 'Guidance',
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F6F7F3] dark:bg-[#101815] transition-colors">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* 404 Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#006B61]/10 dark:bg-[#72C6AD]/20 border border-[#006B61]/20 dark:border-[#72C6AD]/30 flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] mb-5 shadow-xs">
          <Compass className="w-8 h-8 stroke-[1.75] animate-pulse" />
        </div>

        {/* 404 Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#E8F1F2] dark:bg-[#3D1A10] text-[#006B61] dark:text-[#E07A5F] border border-[#006B61]/20 dark:border-[#E07A5F]/30 mb-3">
          Error 404 • Page Not Found
        </span>

        {/* Heading & Explanation */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1A2B25] dark:text-[#F6ECE7] mb-3">
          We couldn't find the page you're looking for
        </h1>
        <p className="text-sm sm:text-base text-[#52665D] dark:text-[#B5C1B5] max-w-xl mb-8 leading-relaxed">
          The requested project URL or route may have been relocated, renamed, or is currently restricted.
          You can return to the main dashboard or navigate directly to one of our core project controls sections below.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006B61] hover:bg-[#00524A] text-white text-sm font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                router.push('/dashboard');
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-[#1A2B25] dark:text-[#F6ECE7] border border-[#D9E2DA] dark:border-[#3A5146] text-sm font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Main Hubs Navigation Grid */}
        <div className="w-full text-left bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] mb-4">
            Popular Project Controls Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col p-3.5 rounded-lg border border-[#E2E8F0] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] bg-[#F6F7F3] dark:bg-[#101815] hover:bg-white dark:hover:bg-[#3D1A10] transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#006B61]/10 dark:bg-[#72C6AD]/20 flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-[#1A2B25] dark:text-[#F6ECE7] group-hover:text-[#006B61] dark:group-hover:text-[#72C6AD] transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E8F1F2] dark:bg-[#243832] text-[#006B61] dark:text-[#B5C1B5]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Support Prompt */}
        <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-6">
          Need technical assistance? Visit the{' '}
          <Link
            href="/support"
            className="font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline"
          >
            PLnEX Support Desk
          </Link>{' '}
          or contact your system administrator.
        </p>
      </div>
    </div>
  );
}
