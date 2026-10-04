'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { ToastContainer } from '../shared/Toast';
import { ActivityDetailDrawer } from '../shared/ActivityDetailDrawer';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dedicated clean layout for authentication pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
        <ToastContainer />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
      {/* Top Header */}
      <TopHeader onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Global Search ⌘K Dialog */}
      <GlobalSearch />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Reusable Activity Detail Drawer */}
      <ActivityDetailDrawer />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#172033]/40 z-20 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Container */}
      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-200 p-4 md:p-6 max-w-[1440px] w-full mx-auto ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
