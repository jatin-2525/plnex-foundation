'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { getDefaultRouteForRole } from '../../types/permissions';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Logo } from '../../components/shared/Logo';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Shield,
  FileQuestion,
  Loader2,
  Lock,
} from 'lucide-react';

function AccessDeniedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userSession, isAuthenticated } = useApp();

  const requestedResource = searchParams.get('resource') || 'Restricted Project Resource';

  const roleDisplayName = (role?: string) => {
    switch (role) {
      case 'manager':
        return 'Project Controls Manager';
      case 'engineer':
        return 'Site Engineer';
      case 'admin':
        return 'Administrator';
      default:
        return 'Unauthenticated User';
    }
  };

  const handleGoToDashboard = () => {
    if (!isAuthenticated || !userSession) {
      router.push('/login');
      return;
    }
    router.push(getDefaultRouteForRole(userSession.role));
  };

  const breadcrumbs = [
    { label: 'Security & Authorization' },
    { label: 'Access Denied', current: true },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Main Centered Permission Card */}
      <div className="bg-white border border-[#D9E2DA] rounded-lg shadow-sm overflow-hidden">
        {/* Top Header with Brand */}
        <div className="px-6 py-4 border-b border-[#D9E2DA] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <span className="text-xs font-mono text-[#A43B36] bg-[#F6E4E1] border border-[#DCABA7] px-3 py-0.5 rounded font-semibold">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header Warning Visual & Message */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F6E4E1] border border-[#DCABA7] flex items-center justify-center text-[#A43B36] flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A2B25] tracking-tight">
                Access Denied
              </h1>
              <p className="text-sm text-[#52665D] mt-1 leading-relaxed">
                You don't have permission to access this page.
              </p>
            </div>
          </div>

          {/* Current Role & Requested Resource Box */}
          <div className="bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg p-4 sm:p-6 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] gap-2">
              <span className="text-[#52665D] font-medium">Current Role:</span>
              <span className="font-semibold text-[#1A2B25] bg-white border border-[#D9E2DA] px-3 py-1 rounded font-mono text-xs">
                {roleDisplayName(userSession?.role)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] gap-2">
              <span className="text-[#52665D] font-medium">Requested Resource:</span>
              <span className="font-semibold text-[#A43B36] bg-white border border-[#DCABA7] px-3 py-1 rounded font-mono text-xs break-all">
                {requestedResource}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#52665D]">
              <span>Enforced Access Policy:</span>
              <span className="font-mono">Role-Based Access Control (Zero Implicit Overwrite)</span>
            </div>
          </div>

          {/* Context note */}
          <p className="text-xs text-[#52665D] leading-relaxed">
            The PLnEX platform strictly separates Manager, Site Engineer, and Administrator workspaces to preserve schedule governance, audit traceability, and field data integrity.
          </p>

          {/* Actions */}
          <div className="pt-4 border-t border-[#D9E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#EAF0E9] text-[#1A2B25] border border-[#D9E2DA] text-xs font-semibold rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#52665D]" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={handleGoToDashboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#006B61] hover:bg-[#00524A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to My Dashboard</span>
            </button>
          </div>
        </div>

        {/* Security & Organization Footer */}
        <div className="px-6 py-3 bg-[#F6F7F3] border-t border-[#D9E2DA] flex items-center justify-between text-[11px] text-[#52665D]">
          <span>Oil India Limited • Infrastructure PMIS</span>
          <span className="font-mono flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#006B61]" />
            Security Gateway Enforced
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#52665D]" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-[#006B61] shrink-0" />
          <span className="font-medium text-[#1A2B25]">Verifying access credentials...</span>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
