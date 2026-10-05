'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { getDefaultRouteForRole } from '../../types/permissions';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
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
      <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-sm overflow-hidden">
        {/* Top Header with Brand */}
        <div className="px-6 py-4 border-b border-[#D9DEE5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#176B87] text-white flex items-center justify-center font-bold text-xs font-mono">
              PX
            </div>
            <div>
              <span className="text-sm font-bold text-[#172033] leading-none block">
                PL<span className="text-[#176B87]">n</span>EX
              </span>
              <span className="text-[10px] text-[#596579] font-mono leading-none mt-0.5 block">
                Planning-to-Execution Bridge
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-2.5 py-0.5 rounded font-semibold">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header Warning Visual & Message */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] flex items-center justify-center text-[#B5473C] flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                Access Denied
              </h1>
              <p className="text-sm text-[#596579] mt-1 leading-relaxed">
                You don't have permission to access this page.
              </p>
            </div>
          </div>

          {/* Current Role & Requested Resource Box */}
          <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-5 space-y-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-1.5">
              <span className="text-[#596579] font-medium">Current Role:</span>
              <span className="font-semibold text-[#172033] bg-white border border-[#D9DEE5] px-2.5 py-1 rounded font-mono text-xs">
                {roleDisplayName(userSession?.role)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-1.5">
              <span className="text-[#596579] font-medium">Requested Resource:</span>
              <span className="font-semibold text-[#B5473C] bg-white border border-[#E4B0AA] px-2.5 py-1 rounded font-mono text-xs break-all">
                {requestedResource}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[#596579]">
              <span>Enforced Access Policy:</span>
              <span className="font-mono">Role-Based Access Control (Zero Implicit Overwrite)</span>
            </div>
          </div>

          {/* Context note */}
          <p className="text-xs text-[#596579] leading-relaxed">
            The PLnEX platform strictly separates Manager, Site Engineer, and Administrator workspaces to preserve schedule governance, audit traceability, and field data integrity.
          </p>

          {/* Actions */}
          <div className="pt-4 border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-xs font-semibold rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#596579]" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={handleGoToDashboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to My Dashboard</span>
            </button>
          </div>
        </div>

        {/* Security & Organization Footer */}
        <div className="px-6 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-[11px] text-[#596579]">
          <span>Oil India Limited • Infrastructure PMIS</span>
          <span className="font-mono flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#176B87]" />
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
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#176B87]" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
