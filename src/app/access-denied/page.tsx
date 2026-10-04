'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  FileQuestion,
  Lock,
  User,
  SlidersHorizontal,
  Info,
  Loader2,
} from 'lucide-react';

function AccessDeniedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userSession } = useApp();

  const urlResource = searchParams.get('resource') || '/schedule/baseline-override';
  const urlType = searchParams.get('type') || '403'; // '403' or '404'

  const [activeTab, setActiveTab] = useState<'403' | '404'>((urlType === '404' ? '404' : '403'));
  const [requestedResource, setRequestedResource] = useState(urlResource);

  useEffect(() => {
    if (urlType === '404') {
      setActiveTab('404');
    }
    if (searchParams.get('resource')) {
      setRequestedResource(searchParams.get('resource')!);
    }
  }, [urlType, searchParams]);

  const breadcrumbs = [
    { label: 'Security & Authorization' },
    { label: activeTab === '403' ? 'Access Denied' : 'Resource Unavailable', current: true },
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager':
        return 'Project Controls Manager';
      case 'engineer':
        return 'Site Execution Engineer';
      case 'admin':
        return 'System Administrator';
      case 'viewer':
      default:
        return 'Viewer / Audit Observer';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <Breadcrumbs items={breadcrumbs} />

      {/* Main Centered Permission Card */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden">
        {/* Top Header with Brand */}
        <div className="px-6 py-4 border-b border-[#E8EBF0] bg-white flex items-center justify-between">
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
          <span className="text-xs font-mono text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5] px-2 py-0.5 rounded">
            {activeTab === '403' ? 'HTTP 403 FORBIDDEN' : 'HTTP 404 NOT FOUND'}
          </span>
        </div>

        {/* 403 vs 404 Mode Selector (Distinction Support) */}
        <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] px-6 text-xs">
          <button
            onClick={() => setActiveTab('403')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === '403'
                ? 'border-[#D98B32] text-[#172033] bg-white'
                : 'border-transparent text-[#596579] hover:text-[#172033]'
            }`}
          >
            403 — Permission Denied
          </button>
          <button
            onClick={() => setActiveTab('404')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === '404'
                ? 'border-[#176B87] text-[#172033] bg-white'
                : 'border-transparent text-[#596579] hover:text-[#172033]'
            }`}
          >
            404 — Resource Unavailable
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {activeTab === '403' ? (
            /* 403 Permission Denied State */
            <div className="space-y-6">
              {/* Restrained Warning Visual & Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-center text-[#D98B32] flex-shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#172033] leading-snug">
                    Access Denied
                  </h1>
                  <p className="text-xs text-[#596579] mt-1 leading-relaxed max-w-xl">
                    Your current authenticated user account does not possess the required project controls permissions to view or execute modifications on this resource.
                  </p>
                </div>
              </div>

              {/* Contextual Authorization Attributes */}
              <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-md p-4 space-y-2.5 text-xs font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-1">
                  <span className="text-[#596579] font-sans">Current Authenticated Role:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#172033] bg-white border border-[#D9DEE5] px-2 py-0.5 rounded">
                      {getRoleDisplayName(userSession.role)} ({userSession.role.toUpperCase()})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-1">
                  <span className="text-[#596579] font-sans">Active User Session:</span>
                  <span className="text-[#172033] font-medium font-sans">
                    {userSession.name} ({userSession.email})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-1">
                  <span className="text-[#596579] font-sans">Requested Resource Target:</span>
                  <span className="text-[#176B87] font-bold break-all">
                    {requestedResource}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[#596579] font-sans">Enforced Security Policy:</span>
                  <span className="text-[#596579]">OIL-INFRA-RBAC §4.2 (Zero Implicit Overwrite)</span>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3 bg-[#EDF2F8] border border-[#B3CBE0] rounded-md text-xs text-[#176B87] flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  To approve schedule changes, override candidate matches, or modify critical baselines, elevated authorization from the <strong>Chief Project Controls Manager</strong> is required.
                </p>
              </div>
            </div>
          ) : (
            /* 404 Resource Unavailable State */
            <div className="space-y-6">
              {/* Restrained 404 Visual & Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#F0F2F5] border border-[#D9DEE5] flex items-center justify-center text-[#596579] flex-shrink-0">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#172033] leading-snug">
                    Resource Unavailable
                  </h1>
                  <p className="text-xs text-[#596579] mt-1 leading-relaxed max-w-xl">
                    The requested activity, DPR artifact, or schedule node could not be located within the active project work breakdown structure.
                  </p>
                </div>
              </div>

              {/* Contextual Not Found Attributes */}
              <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-md p-4 space-y-2.5 text-xs font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-1">
                  <span className="text-[#596579] font-sans">Resource Identifier:</span>
                  <span className="font-semibold text-[#B5473C] bg-white border border-[#D9DEE5] px-2 py-0.5 rounded break-all">
                    {requestedResource}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-1">
                  <span className="text-[#596579] font-sans">Diagnosis:</span>
                  <span className="text-[#172033] font-medium font-sans">
                    Unassigned WBS node or archived baseline package
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[#596579] font-sans">Recommended Step:</span>
                  <span className="text-[#596579] font-sans">
                    Verify activity ID in Master Schedule or re-import Primavera P6 baseline
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F0F2F5] border border-[#D9DEE5] rounded-md text-xs text-[#596579] flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This item may have been superseded during schedule revisions or filtered out under your current active project selection.
                </p>
              </div>
            </div>
          )}

          {/* Primary & Secondary Actions */}
          <div className="pt-4 border-t border-[#E8EBF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] text-xs font-medium rounded-md transition-colors order-2 sm:order-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#596579]" />
              <span>Go Back</span>
            </button>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex-1 sm:flex-initial"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Organization Footer */}
        <div className="px-6 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-[11px] text-[#596579]">
          <span>Oil India Limited • Infrastructure PMIS</span>
          <span className="font-mono">Security Enforcement Gateway</span>
        </div>
      </div>

      {/* Evaluation Sandbox Bar */}
      <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#596579]">
          <span className="font-semibold uppercase tracking-wider text-[#172033]">
            Evaluation Presets (State Testing)
          </span>
          <span className="font-mono">403 vs 404 Distinction</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('403');
              setRequestedResource('/schedule/override-baseline');
            }}
            className="px-2 py-1 bg-[#FDF6ED] hover:bg-[#FDF6ED]/80 text-[#D98B32] border border-[#F0D4A6] rounded text-[11px] font-mono transition-colors"
          >
            403: Baseline Override (Restricted)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('403');
              setRequestedResource('/matching/approve-all-unreviewed');
            }}
            className="px-2 py-1 bg-[#FDF6ED] hover:bg-[#FDF6ED]/80 text-[#D98B32] border border-[#F0D4A6] rounded text-[11px] font-mono transition-colors"
          >
            403: Batch Match Approval (Manager Only)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('404');
              setRequestedResource('PIP-99-999 (Missing Spool Node)');
            }}
            className="px-2 py-1 bg-[#F0F2F5] hover:bg-[#E8EBF0] text-[#172033] border border-[#D9DEE5] rounded text-[11px] font-mono transition-colors"
          >
            404: Missing WBS Activity
          </button>
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
