'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { PageHeader } from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { Settings, Shield, Lock, Clock, Database, Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const { addToast } = useToast();

  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('8');
  const [require2FA, setRequire2FA] = useState(true);
  const [allowManualBaselineOverride, setAllowManualBaselineOverride] = useState(false);
  const [immutableAuditLog, setImmutableAuditLog] = useState(true);

  const breadcrumbs = [
    { label: 'Administration', href: '/admin' },
    { label: 'System Settings', current: true },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Settings Saved',
      description: 'Security & system configuration policies updated successfully.',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="System Settings & Security Policies"
        description="Configure session expiration lifetime, Primavera P6 baseline locks, two-factor authentication, and immutable audit trails."
      />

      <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
        {/* Session Security */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]">
            <Clock className="w-4 h-4 text-[#176B87]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Authentication & Session Lifetime
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-[#172033] block mb-1">
                Standard Session Expiration
              </label>
              <select
                value={sessionTimeoutHours}
                onChange={(e) => setSessionTimeoutHours(e.target.value)}
                className="w-full p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md outline-none"
              >
                <option value="2">2 Hours (Strict High-Security)</option>
                <option value="8">8 Hours (Standard Single Shift)</option>
                <option value="24">24 Hours (Field Extended)</option>
                <option value="168">7 Days (Remembered Trusted Devices)</option>
              </select>
              <p className="text-[11px] text-[#596579] mt-1">
                Users will be automatically redirected to /login when their session expires.
              </p>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={require2FA}
                  onChange={(e) => setRequire2FA(e.target.checked)}
                  className="rounded border-[#D9DEE5] text-[#176B87] w-4 h-4"
                />
                <span className="font-semibold text-[#172033]">Enforce Corporate 2FA for Managers</span>
              </label>
              <p className="text-[11px] text-[#596579]">
                Requires OTP confirmation for baseline modifications or schedule overrides.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Baseline Protection */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#D9DEE5]">
            <Lock className="w-4 h-4 text-[#2E7D5B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Primavera P6 & Schedule Governance
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!allowManualBaselineOverride}
                onChange={(e) => setAllowManualBaselineOverride(!e.target.checked)}
                className="rounded border-[#D9DEE5] text-[#176B87] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-semibold text-[#172033] block">
                  Lock Baseline Planned Dates (Zero Implicit Overwrite)
                </span>
                <span className="text-[11px] text-[#596579]">
                  Site engineers and AI matching engines can record actuals, but cannot alter baseline planned start/finish without an approved schedule revision.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={immutableAuditLog}
                onChange={(e) => setImmutableAuditLog(e.target.checked)}
                className="rounded border-[#D9DEE5] text-[#176B87] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-semibold text-[#172033] block">
                  Immutable Cryptographic Audit Trail
                </span>
                <span className="text-[11px] text-[#596579]">
                  All schedule approvals, DPR matches, and manual overrides are signed and persisted in the unalterable audit log.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Security Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
