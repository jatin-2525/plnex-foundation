'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { ToastContainer } from '../shared/Toast';
import { ActivityDetailDrawer } from '../shared/ActivityDetailDrawer';
import { WhyExplanationModal } from '../shared/WhyExplanationModal';
import { canAccessRoute, getResourceName } from '../../types/permissions';
import { Loader2 } from 'lucide-react';

export interface AppShellProps {
  children: ReactNode;
}
export function AppShell({ children }: AppShellProps) {
  const rawPathname = usePathname();
  const pathname = (rawPathname && rawPathname.length > 1 && rawPathname.endsWith('/'))
    ? rawPathname.slice(0, -1)
    : (rawPathname || '/');
  const router = useRouter();
  const {
    isAuthenticated,
    isAuthReady,
    userSession,
    whyModalData,
    closeWhyExplanation,
    openActivityDrawer,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Is this a public auth route?
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const isAccessDeniedRoute = pathname === '/access-denied';
  const isRootRoute = pathname === '/';

  // Route-Level Protection Guard
  useEffect(() => {
    if (!isAuthReady) return;

    // Public auth pages and root route don't need guard redirection here
    if (isAuthRoute || isRootRoute) return;

    // 1. Unauthenticated users cannot access any protected routes
    if (!isAuthenticated || !userSession) {
      if (!isAccessDeniedRoute) {
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // 2. Authenticated users: Check role permissions for the route
    if (!canAccessRoute(userSession.role, pathname)) {
      const resourceName = getResourceName(pathname);
      router.replace(`/access-denied?resource=${encodeURIComponent(resourceName)}`);
    }
  }, [
    isAuthReady,
    isAuthenticated,
    userSession,
    pathname,
    isAuthRoute,
    isRootRoute,
    isAccessDeniedRoute,
    router,
  ]);

  // While initializing authentication from storage, show clean minimal loader
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-[#176B87] text-white flex items-center justify-center font-bold text-sm">
            PX
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#596579]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#176B87]" />
            <span>Initializing PLnEX security gateway...</span>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated clean layout for authentication pages
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
        <ToastContainer />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {children}
        </main>
      </div>
    );
  }

  // Root route renders its own role redirection logic cleanly
  if (isRootRoute) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
        <ToastContainer />
        {children}
      </div>
    );
  }

  // Access denied page layout
  if (isAccessDeniedRoute) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
        {isAuthenticated && (
          <TopHeader onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        )}
        <ToastContainer />
        <main className={`flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full ${isAuthenticated ? 'pt-20' : 'pt-8'}`}>
          {children}
        </main>
      </div>
    );
  }

  // If not authenticated on a protected route, hold rendering while redirecting to /login
  if (!isAuthenticated || !userSession) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-xs font-mono text-[#596579]">
          <Loader2 className="w-4 h-4 animate-spin text-[#176B87]" />
          <span>Restricted resource: redirecting to sign in...</span>
        </div>
      </div>
    );
  }

  // If user role is not allowed on this route, hold rendering while redirecting to /access-denied
  if (!canAccessRoute(userSession.role, pathname)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-xs font-mono text-[#B5473C]">
          <Loader2 className="w-4 h-4 animate-spin text-[#B5473C]" />
          <span>Access verification: redirecting to security gateway...</span>
        </div>
      </div>
    );
  }

  // Fully authenticated and authorized workspace shell
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172033] flex flex-col font-sans">
      {/* Top Header */}
      <TopHeader
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setMobileMenuOpen(!mobileMenuOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        onDesktopToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Global Search ⌘K Dialog */}
      <GlobalSearch />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Reusable Activity Detail Drawer */}
      <ActivityDetailDrawer />

      {/* Global "Why?" Transparent Explanation Panel */}
      <WhyExplanationModal
        isOpen={!!whyModalData}
        onClose={closeWhyExplanation}
        data={whyModalData}
        onOpenActivityDrawer={(actId) => openActivityDrawer(actId)}
      />

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
        {/* Role-Specific Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main
          className={`flex-1 transition-all duration-200 p-4 md:p-6 max-w-[1440px] w-full mx-auto ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-[248px]'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
