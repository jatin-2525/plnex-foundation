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
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] rounded-md text-xs font-semibold transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#596579]" />
              Users & Roles
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
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
            <span className="text-[#2E7D5B] font-mono">STATUS: RBAC Enforced</span>
          </>
        }
      />

      {/* Explicit Role View Switching Section (Mandated by Objective) */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5] mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#176B87]" />
              Intentional Role View Switching
            </h2>
            <p className="text-xs text-[#596579] mt-0.5">
              Inspect application operations from the exact perspective of each authorized persona.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] px-2 py-0.5 rounded">
            Privileged Dual-View
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manager View Switcher */}
          <div className="border border-[#D9DEE5] rounded-lg p-4 bg-[#F7F8FA] hover:border-[#176B87] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold font-mono text-[#176B87] bg-white border border-[#B3CBE0] px-2 py-0.5 rounded">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  MANAGER WORKSPACE
                </span>
                <span className="text-[11px] text-[#596579]">14 Permitted Routes</span>
              </div>
              <h3 className="text-sm font-bold text-[#172033]">Project Controls Manager View</h3>
              <p className="text-xs text-[#596579] mt-1 leading-relaxed">
                Full control over Master Schedules, Schedule Twin, Review Queue approvals, S-Curves, What-if Simulations, Reports, and Schedule Health.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D9DEE5] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#596579]">Destination: /dashboard</span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                Launch Manager View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Engineer View Switcher */}
          <div className="border border-[#D9DEE5] rounded-lg p-4 bg-[#F7F8FA] hover:border-[#2E7D5B] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold font-mono text-[#2E7D5B] bg-white border border-[#B8DCC9] px-2 py-0.5 rounded">
                  <HardHat className="w-3.5 h-3.5" />
                  FIELD EXECUTION WORKSPACE
                </span>
                <span className="text-[11px] text-[#596579]">7 Permitted Routes</span>
              </div>
              <h3 className="text-sm font-bold text-[#172033]">Site Execution Engineer View</h3>
              <p className="text-xs text-[#596579] mt-1 leading-relaxed">
                Field-focused interface for site logging, DPR / Time Agent submission, voice transcripts, photo evidence upload, and offline field sync.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D9DEE5] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#596579]">Destination: /engineer</span>
              <Link
                href="/engineer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2E7D5B] hover:bg-[#25664A] text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                Launch Engineer View <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Metrics & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#596579]">Authorized Users</span>
            <Users className="w-4 h-4 text-[#176B87]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#172033] block">38</span>
          <span className="text-[11px] text-[#596579]">3 Roles: Mgr, Eng, Admin</span>
        </div>

        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#596579]">Organizations / JVs</span>
            <Building2 className="w-4 h-4 text-[#3B6EA8]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#172033] block">6</span>
          <span className="text-[11px] text-[#596579]">Oil India & Consortiums</span>
        </div>

        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#596579]">Schedule Baseline Locks</span>
            <Lock className="w-4 h-4 text-[#2E7D5B]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#2E7D5B] block">Active</span>
          <span className="text-[11px] text-[#596579]">Rev 3.2 (P6 XML)</span>
        </div>

        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#596579]">IAM Security Status</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#172033] block">Compliant</span>
          <span className="text-[11px] text-[#2E7D5B] font-medium">Session guard active</span>
        </div>
      </div>

      {/* Admin Audit & Diagnostics Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Administration Shortcuts */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#176B87]" />
            Administration Subsystems
          </h3>
          <div className="divide-y divide-[#D9DEE5]">
            <Link
              href="/admin/users"
              className="py-3 flex items-center justify-between hover:bg-[#F7F8FA] px-2 rounded transition-colors"
            >
              <div>
                <strong className="text-xs font-semibold text-[#172033] block">Users & Role Directory</strong>
                <span className="text-[11px] text-[#596579]">Manage credentials, RBAC permissions, and site engineers</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#7B8798]" />
            </Link>

            <Link
              href="/admin/organizations"
              className="py-3 flex items-center justify-between hover:bg-[#F7F8FA] px-2 rounded transition-colors"
            >
              <div>
                <strong className="text-xs font-semibold text-[#172033] block">Organizations & Joint Ventures</strong>
                <span className="text-[11px] text-[#596579]">Manage contracting consortia and field divisions</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#7B8798]" />
            </Link>

            <Link
              href="/admin/settings"
              className="py-3 flex items-center justify-between hover:bg-[#F7F8FA] px-2 rounded transition-colors"
            >
              <div>
                <strong className="text-xs font-semibold text-[#172033] block">Security & System Policies</strong>
                <span className="text-[11px] text-[#596579]">Token lifetime, baseline modification safeguards, audit logs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#7B8798]" />
            </Link>
          </div>
        </div>

        {/* Acceptance Test & Session Validator Sandbox */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D98B32]" />
              Session Expiration & Route Guard Testing
            </h3>
            <span className="text-[10px] font-mono text-[#8C5311] bg-[#FDF6ED] px-2 py-0.5 rounded border border-[#F0D4A6]">
              Testing Tool
            </span>
          </div>

          <p className="text-xs text-[#596579] leading-relaxed">
            Verify requirement §12: When session expires while the user is working, the route guard automatically intercepts navigation, terminates the session, and redirects to <code>/login</code> with the safe return destination preserved.
          </p>

          <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#596579]">Current Token:</span>
              <span className="font-mono text-[#172033]">{userSession?.role.toUpperCase()} (Active)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#596579]">Session Guard:</span>
              <span className="text-[#2E7D5B] font-semibold">Strict Route-Level Interceptor</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateExpiry}
            disabled={sessionExpirySimulated}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FBEFEE] hover:bg-[#F8DFDC] text-[#B5473C] border border-[#E4B0AA] rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Immediate Session Expiration & Test Redirect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
