'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { ProjectSelector } from './ProjectSelector';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';
import { ConnectionStatusControl } from './ConnectionStatusControl';
import { Logo } from '../shared/Logo';
import { Modal } from '../shared/Modal';
import {
  Search,
  PanelLeft,
  Database,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sun,
  Moon,
  Sliders,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
}

export function TopHeader({ onToggleSidebar, onMobileToggle, onDesktopToggle }: TopHeaderProps) {
  const { setGlobalSearchOpen, userSession } = useApp();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { openSettings } = usePreferences();
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)) {
      setIsMac(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (typeof window !== 'undefined' && window.innerWidth < 768 && onMobileToggle) {
      onMobileToggle();
    } else if (onDesktopToggle) {
      onDesktopToggle();
    } else if (onMobileToggle) {
      onMobileToggle();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#17221D] border-b border-[#D9E2DA] dark:border-[#3A5146] z-40 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs transition-colors duration-150">
      {/* Left: [Sidebar Toggle] + PLnEX Logo + Project Selector */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Sidebar Toggle */}
        <button
          onClick={handleToggle}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer flex-shrink-0"
          aria-label="Toggle sidebar navigation"
          title="Toggle sidebar navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Structural Ownable PLnEX Brand Mark */}
        <Link href="/" className="flex items-center flex-shrink-0 hover:opacity-90 transition-opacity" title="PLnEX Project Controls">
          <Logo size="md" />
        </Link>

        {/* Subtle vertical divider */}
        <div className="h-4 w-px bg-[#D9E2DA] dark:bg-[#3A5146] hidden sm:block" />

        {/* Project Selector */}
        <div className="flex-shrink-0 min-w-0">
          <ProjectSelector />
        </div>

        {/* Demo / Sandbox Snapshot Indicator */}
        <button
          type="button"
          onClick={() => setSandboxModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#825700] dark:text-[#F3D27E] bg-[#F8EFDA] dark:bg-[#3A3120] hover:bg-[#F1E5C8] dark:hover:bg-[#4A3F29] px-2.5 py-1 rounded-md border border-[#E5C185] dark:border-[#5B4A2B] shrink-0 transition-colors cursor-pointer"
          title="Demo Dataset: Data date is 18 Sep 2026. Click to inspect sandbox parameters."
        >
          <Database className="w-3 h-3 text-[#825700] dark:text-[#F3D27E]" />
          <span className="hidden lg:inline">Data Date: 18 Sep 2026 (Demo Dataset)</span>
          <span className="lg:hidden">18 Sep (Demo)</span>
        </button>
      </div>

      {/* Right: Search + Theme + Settings + Notifications + Profile */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Global Search */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="hidden sm:flex items-center justify-between px-3 py-1.5 bg-[#F6F7F3] dark:bg-[#101815] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#52665D] dark:text-[#B5C1B5] transition-colors cursor-pointer w-36 md:w-44 lg:w-52 shrink-0"
          aria-label="Search"
          title="Search activities, DPRs, evidence (Ctrl+K or ⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5] flex-shrink-0" />
            <span className="truncate text-xs">Search project...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5] bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded leading-none shrink-0">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="sm:hidden min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer"
          aria-label="Search"
          title="Search activities (Ctrl+K or ⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* One-Click Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer"
          aria-label={`Toggle color theme. Current: ${theme}`}
          title={`Toggle theme (Current: ${theme} - ${resolvedTheme})`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#E9C46A]" />
          ) : (
            <Moon className="w-4 h-4 text-[#006B61]" />
          )}
        </button>

        {/* Display Preferences Modal Trigger */}
        <button
          type="button"
          onClick={() => openSettings(userSession?.role === 'engineer' ? 'engineer' : 'manager')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer"
          aria-label="Open display and workflow settings"
          title="Display and workflow settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Messages Quick Link */}
        <Link
          href="/messages"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer relative"
          aria-label="Messages & Field Conversations"
          title={`Messages (${userSession?.role === 'engineer' ? 1 : 2} unread)`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#AC4B31] dark:bg-[#E58567] border-2 border-white dark:border-[#17221D]" />
        </Link>

        {/* Help & Support Quick Link */}
        <Link
          href="/support"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors cursor-pointer"
          aria-label="Help and Support"
          title="Help & Support"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile Menu */}
        <UserMenu />

        {/* Hidden telemetry control */}
        <span className="hidden" aria-hidden="true">
          <ConnectionStatusControl />
        </span>
      </div>

      {/* Sample-Data Mode & Sandbox Isolation Modal */}
      <Modal
        isOpen={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        title="Sample Data Mode & Prototype Sandbox"
        subtitle="Operational parameters and state isolation for evaluation"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
          <div className="bg-[#E4F1E9] dark:bg-[#20382C] border border-[#B7DAC3] dark:border-[#315442] rounded-xl p-3.5">
            <div className="flex items-center gap-2 font-bold text-[#1F6B4E] dark:text-[#9AD5AF] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Simulated Evaluation Environment (No Live P6 Writes)</span>
            </div>
            <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
              This deployment is running in high-fidelity sample data mode. User actions (including DPR submissions, match approvals, risk status updates, and what-if simulation saves) are held safely in browser memory and local cache.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-3 bg-[#F6F7F3] dark:bg-[#101815]">
              <div className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] mb-1 font-heading">Baseline Schedule</div>
              <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                <strong>Rev 3.2 (Approved 15 May 2026)</strong> comprising 184 physical schedule activities across Piping, Civil, Mechanical, and Electrical packages.
              </p>
            </div>
            <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-3 bg-[#F6F7F3] dark:bg-[#101815]">
              <div className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] mb-1 font-heading">Cutoff Reporting Date</div>
              <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                <strong>18 Sep 2026 (Week 38)</strong>. All actuals, DPR logs, and inspection sign-offs are dated on or before this boundary. Future dates are deterministic forecasts.
              </p>
            </div>
          </div>

          <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-3 space-y-2 bg-white dark:bg-[#17221D]">
            <div className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] font-heading">Verified Boundary Rules:</div>
            <ul className="space-y-1.5 text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD] mt-0.5 shrink-0" />
                <span>Simulated field updates never commit directly to external Primavera P6 or SAP ERP backends.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD] mt-0.5 shrink-0" />
                <span>Resetting browser cache clears all temporary what-if scenarios and restores original baseline values.</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146]">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.clear();
                  window.location.reload();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A43B36] dark:text-[#FF9E94] bg-[#F6E4E1] dark:bg-[#3B2422] hover:bg-[#F0CECA] dark:hover:bg-[#4D2C2A] border border-[#DCABA7] dark:border-[#5B3734] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Prototype Cache</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxModalOpen(false)}
              className="px-4 py-1.5 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
