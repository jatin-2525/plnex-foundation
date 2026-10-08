'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ProjectSelector } from './ProjectSelector';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';
import { ConnectionStatusControl } from './ConnectionStatusControl';
import { Search, PanelLeft } from 'lucide-react';

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
  onMobileToggle?: () => void;
  onDesktopToggle?: () => void;
}

export function TopHeader({ onToggleSidebar, onMobileToggle, onDesktopToggle }: TopHeaderProps) {
  const { setGlobalSearchOpen } = useApp();

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
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#D9DEE5] z-40 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
      {/* Left: [Sidebar Toggle] + PLnEX + Project Selector */}
      <div className="flex items-center gap-2 sm:gap-2 min-w-0">
        {/* [Sidebar Toggle] */}
        <button
          onClick={handleToggle}
          className="p-2 text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-md transition-colors cursor-pointer flex-shrink-0"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4 text-[#596579]" />
        </button>

        {/* PLnEX Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2 flex-shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded bg-[#176B87] text-white flex items-center justify-center font-bold text-xs tracking-tight">
            PX
          </div>
          <span className="text-sm font-bold tracking-tight text-[#172033] leading-none">
            PL<span className="text-[#176B87]">n</span>EX
          </span>
        </Link>

        {/* Subtle vertical separator */}
        <div className="h-4 w-px bg-[#D9DEE5] hidden sm:block" />

        {/* Project Selector */}
        <div className="flex-shrink-0 min-w-0">
          <ProjectSelector />
        </div>

        {/* Sample Project Data indicator */}
        <span className="hidden xl:inline-flex items-center text-[10px] font-mono text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded border border-[#D9DEE5]">
          Sample Project Data
        </span>
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Search */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="hidden sm:flex items-center justify-between px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-md text-xs text-[#596579] transition-colors cursor-pointer w-44 md:w-56 lg:w-64"
          aria-label="Search"
          title="Search activities, DPRs, evidence (⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#7B8798] flex-shrink-0" />
            <span className="truncate text-xs text-[#7B8798]">Search...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#7B8798] bg-white border border-[#D9DEE5] rounded leading-none">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="sm:hidden p-2 text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-md transition-colors cursor-pointer"
          aria-label="Search"
          title="Search activities (⌘K)"
        >
          <Search className="w-4 h-4 text-[#596579]" />
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
    </header>
  );
}
