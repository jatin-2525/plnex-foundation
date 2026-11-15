'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Check, X } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user has already made a consent choice
    const savedConsent = localStorage.getItem('plnex_cookie_consent');
    if (savedConsent) return;

    // Detect if user timezone corresponds to European Union, UK, or Switzerland
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isEuropeanRegion =
      timeZone.startsWith('Europe/') ||
      timeZone === 'GMT' ||
      timeZone === 'UTC' ||
      timeZone.includes('London') ||
      timeZone.includes('Paris') ||
      timeZone.includes('Berlin') ||
      timeZone.includes('Zurich') ||
      timeZone.includes('Madrid') ||
      timeZone.includes('Rome');

    // Show banner for EU/UK/Swiss visitors or default to giving visitors transparency
    if (isEuropeanRegion) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('plnex_cookie_consent', 'granted');
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      (window as unknown as { gtag: Function }).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('plnex_cookie_consent', 'denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-md bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-4 sm:p-5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#006B61]/10 dark:bg-[#72C6AD]/20 flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] shrink-0 mt-0.5">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-[#1A2B25] dark:text-[#F6ECE7]">
            Privacy &amp; Cookie Preferences
          </h3>
          <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1 leading-relaxed">
            We use essential cookies for user sessions and optional Google Analytics 4 to understand system usage. For visitors in the EU, UK, and Switzerland, analytics cookies load only upon your consent.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 bg-[#006B61] hover:bg-[#00524A] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              Accept Analytics
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#E5DEC9] dark:hover:bg-[#5E2715] text-[#1A2B25] dark:text-[#F6ECE7] text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              Essential Only
            </button>
            <Link
              href="/privacy"
              className="text-[11px] text-[#006B61] dark:text-[#72C6AD] hover:underline ml-auto"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
