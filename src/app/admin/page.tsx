'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../lib/api/authService';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import {
  Shield,
  Users,
  Building2,
  Settings,
  HardHat,
  LayoutDashboard,
  ArrowRight,
  Database,
  Lock,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCheck,
  Server,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userSession, setUserRole } = useApp();
  const { addToast } = useToast();

  const [sessionExpirySimulated, setSessionExpirySimulated] = useState(false);

  const breadcrumbs = [
    { label: 'Administration' },
    { label: 'Admin Dashboard & Governance Hub', current: true },
  ];

  const handleSimulateExpiry = () => {
    authService.expireSessionNow();
    setSessionExpirySimulated(true);
    addToast({
      type: 'warning',
      title: 'Session Expired Simulated',
      description: 'Your PLnEX token has been invalidated. Next protected navigation will trigger redirect.',
    });
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Admin Governance & System Hub"
        description="Privileged administrative console for tenant management, role-based access control, master schedule baseline lock, and intentional role view switching."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md text-xs font-semibold transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5]" />
              Users &amp; Roles
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              System Settings
            </Link>
          </div>
        }
        metadata={
          <>
            <span className="font-mono">TENANT: Oil India Limited (Central PMIS)</span>
            <span>•</span>
            <span>ROLE: System Administrator</span>
            <span>•</span>
            <span className="text-[#1F6B4E] dark:text-[#34D399] font-mono">STATUS: RBAC Enforced</span>
          </>
        }
      />

      {/* Explicit Role View Switching Section (Mandated by Objective) */}
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] mb-4">
          <div>
            <h2 className="text-sm font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
              Intentional Role View Switching
            </h2>
            <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
              Inspect application operations from the exact perspective of each authorized persona.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] px-2 py-0.5 rounded">
            Privileged Dual-View
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manager View Switcher */}
          <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-5 bg-[#F6F7F3] dark:bg-[#243832] hover:border-[#006B61] dark:hover:border-[#72C6AD] transition-colors flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold font-mono text-[#006B61] dark:text-[#72C6AD] bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] px-2.5 py-1 rounded">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  MANAGER WORKSPACE
                </span>
                <span className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD]">Executive Controls</span>
              </div>
              <h3 className="text-base font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">Project Controls Manager View</h3>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1 leading-relaxed">
                Full authority over Master Schedules, Schedule Twin, Review Queue approvals, S-Curves, What-if Simulations, Reports, and Schedule Health.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-end">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:text-[#0B2822] dark:hover:bg-[#5CB69C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Launch Manager View <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Engineer View Switcher */}
          <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-5 bg-[#F6F7F3] dark:bg-[#243832] hover:border-[#2E7D5B] dark:hover:border-[#34D399] transition-colors flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold font-mono text-[#1F6B4E] dark:text-[#34D399] bg-white dark:bg-[#17221D] border border-[#B7DAC3] dark:border-[#1E5C3E] px-2.5 py-1 rounded">
                  <HardHat className="w-3.5 h-3.5" />
                  FIELD EXECUTION WORKSPACE
                </span>
                <span className="text-xs font-semibold text-[#1F6B4E] dark:text-[#34D399]">Site Execution</span>
              </div>
              <h3 className="text-base font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9]">Site Execution Engineer View</h3>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1 leading-relaxed">
                Field-focused interface for site logging, DPR / Time Agent submission, voice transcripts, photo evidence upload, and offline field sync.
              </p>
            </div>
            <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-end">
              <Link
                href="/engineer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D5B] hover:bg-[#25664A] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Launch Engineer View <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Metrics & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5]">Authorized Users</span>
            <Users className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9] block">38</span>
          <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">3 Roles: Mgr, Eng, Admin</span>
        </div>

        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5]">Organizations &amp; JVs</span>
            <Building2 className="w-4 h-4 text-[#2C6475] dark:text-[#E5C185]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9] block">6</span>
          <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">Oil India &amp; Consortiums</span>
        </div>

        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5]">Schedule Baseline Locks</span>
            <Lock className="w-4 h-4 text-[#1F6B4E] dark:text-[#34D399]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#1F6B4E] dark:text-[#34D399] block">Active</span>
          <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">Rev 3.2 (P6 XML Locked)</span>
        </div>

        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5]">IAM Security Status</span>
            <CheckCircle2 className="w-4 h-4 text-[#1F6B4E] dark:text-[#34D399]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9] block">Compliant</span>
          <span className="text-xs text-[#1F6B4E] dark:text-[#34D399] font-medium">Session guard active</span>
        </div>
      </div>

      {/* Primary Administration Subsystems */}
      <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold font-heading uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-2">
          <Server className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
          Administration Subsystems &amp; Access Directory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="p-4 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg transition-colors flex flex-col justify-between group space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <ArrowRight className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] group-hover:text-[#006B61] dark:group-hover:text-[#72C6AD] group-hover:translate-x-0.5 transition-all" />
              </div>
              <strong className="text-sm font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] block">Users &amp; Role Directory</strong>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">Manage credentials, RBAC permissions, and site engineers.</p>
            </div>
            <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold">Manage 38 Users &rarr;</span>
          </Link>

          <Link
            href="/admin/organizations"
            className="p-4 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg transition-colors flex flex-col justify-between group space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-5 h-5 text-[#2C6475] dark:text-[#E5C185]" />
                <ArrowRight className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] group-hover:text-[#2C6475] dark:group-hover:text-[#E5C185] group-hover:translate-x-0.5 transition-all" />
              </div>
              <strong className="text-sm font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] block">Organizations &amp; Joint Ventures</strong>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">Manage contracting consortia and field engineering divisions.</p>
            </div>
            <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold">Manage 6 Entities &rarr;</span>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg transition-colors flex flex-col justify-between group space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Settings className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <ArrowRight className="w-4 h-4 text-[#738A80] dark:text-[#B5C1B5] group-hover:text-[#006B61] dark:group-hover:text-[#72C6AD] group-hover:translate-x-0.5 transition-all" />
              </div>
              <strong className="text-sm font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] block">Security &amp; System Policies</strong>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">Token lifetime, baseline modification safeguards, audit logs.</p>
            </div>
            <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold">Configure Policies &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Collapsible Secondary Diagnostics & Testing Sandbox */}
      <details className="group bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-5 shadow-xs">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#825700] dark:text-[#FBBF24]" />
            <h3 className="text-xs sm:text-sm font-bold font-heading text-[#52665D] dark:text-[#B5C1B5] uppercase tracking-wider">
              Diagnostic &amp; Route Guard Testing Tools
            </h3>
            <span className="text-[10px] font-mono text-[#825700] dark:text-[#FBBF24] bg-[#F8EFDA] dark:bg-[#38260D] px-2 py-0.5 rounded border border-[#E5C185] dark:border-[#6B4916]">
              Testing Tool
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold group-open:hidden">Show Diagnostics &darr;</span>
            <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold hidden group-open:inline">Hide Diagnostics &uarr;</span>
          </div>
        </summary>

        <div className="pt-4 mt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-3">
          <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
            Verify requirement §12: When session expires while the user is working, the route guard automatically intercepts navigation, terminates the session, and redirects to <code>/login</code> with the safe return destination preserved.
          </p>

          <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#52665D] dark:text-[#B5C1B5]">Current Token:</span>
              <span className="font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{userSession?.role.toUpperCase()} (Active)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#52665D] dark:text-[#B5C1B5]">Session Guard:</span>
              <span className="text-[#1F6B4E] dark:text-[#34D399] font-semibold">Strict Route-Level Interceptor</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateExpiry}
            disabled={sessionExpirySimulated}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#F6E4E1] dark:bg-[#3D1418] hover:bg-[#F9DCD7] dark:hover:bg-[#4D181D] text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#6B2027] rounded text-xs font-bold transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Immediate Session Expiration &amp; Test Redirect</span>
          </button>
        </div>
      </details>
    </div>
  );
}
