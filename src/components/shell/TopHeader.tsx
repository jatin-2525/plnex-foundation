'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ProjectSelector } from './ProjectSelector';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';
import { ConnectionStatusControl } from './ConnectionStatusControl';
import { Logo } from '../shared/Logo';
import { Modal } from '../shared/Modal';
import { Search, PanelLeft, Database, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
}

export function TopHeader({ onToggleSidebar, onMobileToggle, onDesktopToggle }: TopHeaderProps) {
  const { setGlobalSearchOpen, userSession } = useApp();
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-white via-[#F5F8FA] to-[#EEF5F5] border-b border-[#D8E2EA] z-40 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs">
      {/* Left: [Sidebar Toggle] + PLnEX + Project Selector */}
      <div className="flex items-center gap-2 sm:gap-2 min-w-0">
        {/* [Sidebar Toggle] */}
        <button
          onClick={handleToggle}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#526779] hover:text-[#142C3F] hover:bg-[#EAF0F5] rounded-md transition-colors cursor-pointer flex-shrink-0"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4 text-[#526779]" />
        </button>

        {/* PLnEX Brand with Geometric Plan-to-Field Synchronization Mark */}
        <Link href="/" className="flex items-center flex-shrink-0 hover:opacity-90 transition-opacity" title="PLnEX Project Controls">
          <Logo size="md" />
        </Link>

        {/* Subtle vertical separator */}
        <div className="h-4 w-px bg-[#D8E2EA] hidden sm:block" />

        {/* Project Selector */}
        <div className="flex-shrink-0 min-w-0">
          <ProjectSelector />
        </div>

        {/* Visible Demo / Sample Data indicator across all screen sizes and roles */}
        <button
          type="button"
          onClick={() => setSandboxModalOpen(true)}
          className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-mono font-bold text-[#845006] bg-[#FFF1D3] hover:bg-[#FCE7BA] px-2 py-0.5 rounded border border-[#F8DDA2] shrink-0 transition-colors cursor-pointer"
          title="Click to inspect Sample Data Mode and Sandbox Isolation details"
        >
          <Database className="w-3 h-3 text-[#845006]" />
          <span>Snapshot: 18 Sep 2026 (Demo Scenario)</span>
        </button>
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Search */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="hidden sm:flex items-center justify-between px-3 py-1.5 bg-white hover:bg-[#EAF0F5] border border-[#D8E2EA] rounded-md text-xs text-[#526779] transition-colors cursor-pointer w-44 md:w-56 lg:w-64"
          aria-label="Search"
          title="Search activities, DPRs, evidence (Ctrl+K or ⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#526779] flex-shrink-0" />
            <span className="truncate text-xs text-[#526779]">Search...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#526779] bg-[#EAF0F5] border border-[#D8E2EA] rounded leading-none">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#526779] hover:text-[#142C3F] hover:bg-[#EAF0F5] rounded-md transition-colors cursor-pointer"
          aria-label="Search"
          title="Search activities (Ctrl+K or ⌘K)"
        >
          <Search className="w-4 h-4 text-[#526779]" />
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* Profile */}
        <UserMenu />

        {/* ConnectionStatusControl kept available for verification references and System -> Sync */}
        <span className="hidden" aria-hidden="true">
          <ConnectionStatusControl />
        </span>
      </div>

      {/* Feature 19: Clear Sample-Data Mode & Sandbox Isolation Modal */}
      <Modal
        isOpen={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        title="Sample Data Mode & Prototype Sandbox"
        subtitle="Operational parameters and state isolation for evaluation"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-[#142C3F]">
          <div className="bg-[#EAF0F5] border border-[#D8E2EA] rounded-md p-3">
            <div className="flex items-center gap-2 font-bold text-[#0F6B68] mb-1">
              <ShieldCheck className="w-4 h-4 text-[#0F6B68]" />
              <span>Simulated Evaluation Environment (No Live P6 Writes)</span>
            </div>
            <p className="text-[11px] text-[#526779] leading-relaxed">
              This deployment is running in high-fidelity sample data mode. User actions (including DPR submissions, match approvals, risk status updates, and what-if simulation saves) are held safely in browser memory and local cache.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-[#D8E2EA] rounded-md p-3 bg-[#F3F6FA]">
              <div className="font-semibold text-[#142C3F] mb-1">Baseline Schedule</div>
              <p className="text-[11px] text-[#526779]">
                <strong>Rev 3.2 (Approved 15 May 2026)</strong> comprising 184 physical schedule activities across Piping, Civil, Mechanical, and Electrical packages.
              </p>
            </div>
            <div className="border border-[#D8E2EA] rounded-md p-3 bg-[#F3F6FA]">
              <div className="font-semibold text-[#142C3F] mb-1">Cutoff Reporting Date</div>
              <p className="text-[11px] text-[#526779]">
                <strong>18 Sep 2026 (Week 38)</strong>. All actuals, DPR logs, and inspection sign-offs are dated on or before this boundary. Future dates are deterministic forecasts.
              </p>
            </div>
          </div>

          <div className="border border-[#D8E2EA] rounded-md p-3 space-y-2">
            <div className="font-semibold text-[#142C3F]">Verified Boundary Rules:</div>
            <ul className="space-y-1 text-[11px] text-[#526779]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#176B53] mt-0.5 shrink-0" />
                <span>Simulated field updates never commit directly to external Primavera P6 or SAP ERP backends.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#176B53] mt-0.5 shrink-0" />
                <span>Resetting browser cache clears all temporary what-if scenarios and restores original baseline values.</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#D8E2EA]">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.clear();
                  window.location.reload();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-[#A24335] bg-[#FCE8E4] hover:bg-[#F6DFDE] border border-[#E8B6BA] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Prototype Cache</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxModalOpen(false)}
              className="px-4 py-1.5 bg-[#0F6B68] hover:bg-[#0c505c] text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
