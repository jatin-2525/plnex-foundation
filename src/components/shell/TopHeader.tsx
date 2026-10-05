'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ProjectSelector } from './ProjectSelector';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';
import { ConnectionStatusControl } from './ConnectionStatusControl';
import { Search, Menu, Wifi } from 'lucide-react';

export interface TopHeaderProps {
  onMobileToggle: () => void;
}

export function TopHeader({ onMobileToggle }: TopHeaderProps) {
  const { setGlobalSearchOpen, activeProject, userSession } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#D9DEE5] z-40 px-3 sm:px-4 flex items-center justify-between gap-3">
      {/* Left: Mobile hamburger + Brand logo + Project Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="md:hidden p-1.5 text-[#596579] hover:text-[#172033] hover:bg-[#F0F2F5] rounded-md"
          aria-label="Toggle mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#176B87] text-white flex items-center justify-center font-black text-sm tracking-tighter">
            PX
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#172033] leading-none">
              PL<span className="text-[#176B87]">n</span>EX
            </span>
            <span className="text-[10px] text-[#596579] font-mono tracking-tight leading-none mt-0.5 hidden sm:inline">
              PLANNING-TO-EXECUTION BRIDGE
            </span>
          </div>
        </Link>

        <div className="h-5 w-px bg-[#D9DEE5] hidden sm:block mx-1" />

        <div className="hidden sm:block">
          <ProjectSelector />
        </div>
      </div>

      {/* Middle: Global Search shortcut */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-lg text-xs text-[#596579] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#8A94A6]" />
            <span>Search schedule activities, field DPRs, spools...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#596579] bg-white border border-[#D9DEE5] rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Sample Indicator + Cutoff Status + Notifications + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sample Project Indicator (Visible only to Admin to keep normal user navigation clean) */}
        {userSession?.role === 'admin' && (
          <span
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-mono font-bold uppercase tracking-wider"
            title="This application is displaying sample project data for the Oil India Duliajan asset."
          >
            Sample Project Data
          </span>
        )}

        {/* Global Connection Control (Priority 2 Requirement 2) */}
        <ConnectionStatusControl />

        {/* Notifications Center */}
        <NotificationCenter />

        <div className="h-5 w-px bg-[#D9DEE5]" />

        {/* User Info & Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
