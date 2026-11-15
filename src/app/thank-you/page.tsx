'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Home,
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck,
  Mail,
} from 'lucide-react';

export default function ThankYouPage() {
  useEffect(() => {
    // Dispatch GA4 conversion event if gtag is present
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      (window as unknown as { gtag: Function }).gtag('event', 'form_submission_success', {
        page_location: window.location.href,
        page_title: document.title,
        event_category: 'conversion',
        event_label: 'support_form',
      });
    }
  }, []);

  const steps = [
    {
      step: '1',
      title: 'Request Logged & Ticket Assigned',
      desc: 'Your submission has been cataloged in our secure project controls queue with an immutable reference ID.',
      icon: Clock,
    },
    {
      step: '2',
      title: 'Project Controls Specialist Review',
      desc: 'An authorized Oil India Limited planning and execution coordinator will review your inquiry within 24 business hours.',
      icon: ShieldCheck,
    },
    {
      step: '3',
      title: 'Direct Status Resolution',
      desc: 'Updates and formal responses will be dispatched to your registered corporate email address.',
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F6F7F3] dark:bg-[#101815] transition-colors">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Verification Checkmark */}
        <div className="w-16 h-16 rounded-2xl bg-[#E6F4EA] dark:bg-[#1A3A2A] border border-[#A8DAB5] dark:border-[#2D6A4F] flex items-center justify-center text-[#137333] dark:text-[#52B788] mb-5 shadow-xs">
          <CheckCircle2 className="w-8 h-8 stroke-[2]" />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F1F2] dark:bg-[#3D1A10] text-[#006B61] dark:text-[#72C6AD] border border-[#006B61]/20 dark:border-[#72C6AD]/30 mb-3">
          Submission Confirmed
        </span>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2B25] dark:text-[#F6ECE7] mb-3">
          Thank you for reaching out to PLnEX
        </h1>
        <p className="text-sm text-[#52665D] dark:text-[#B5C1B5] max-w-lg mb-8 leading-relaxed">
          Your request has been received. Our project controls and site coordination team will process your information promptly.
        </p>

        {/* What Happens Next Card */}
        <div className="w-full text-left bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-5 sm:p-6 mb-8 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] mb-4">
            What Happens Next
          </h2>
          <div className="space-y-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1A2B25] dark:text-[#F6ECE7]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006B61] hover:bg-[#00524A] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-[#1A2B25] dark:text-[#F6ECE7] border border-[#D9E2DA] dark:border-[#3A5146] text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Browse User Guides</span>
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-[#1A2B25] dark:text-[#F6ECE7] border border-[#D9E2DA] dark:border-[#3A5146] text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Submit Another Ticket</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
