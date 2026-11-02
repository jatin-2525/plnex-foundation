'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export interface PermissionDeniedProps {
  requiredPermission?: string;
  role?: string;
  message?: string;
  onGoBack?: () => void;
  className?: string;
}

export function PermissionDenied({
  requiredPermission = 'plan:write',
  role = 'viewer',
  message = 'Your current authorization role does not have permission to execute this project action.',
  onGoBack,
  className = '',
}: PermissionDeniedProps) {
  return (
    <div
      className={`bg-white border border-[#D6E1E9] rounded-lg p-8 md:p-12 flex flex-col items-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-[#FEF4E6] border border-[#F0D4A6] flex items-center justify-center text-[#8C5311] mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#1A2E42] mb-2">
        Access Restricted — Project Controls Policy
      </h3>
      <p className="text-sm text-[#52687B] max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="px-3 py-1 bg-[#EAF1F5] border border-[#D6E1E9] rounded text-xs font-mono text-[#1A2E42]">
          Current Role: <strong className="uppercase">{role}</strong>
        </span>
        <span className="px-3 py-1 bg-[#FEF4E6] border border-[#F0D4A6] rounded text-xs font-mono text-[#8C5311]">
          Required: <code className="font-semibold">{requiredPermission}</code>
        </span>
      </div>

      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#EAF1F5] text-[#1A2E42] border border-[#D6E1E9] text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#52687B]" />
          Return to Overview
        </button>
      )}
    </div>
  );
}
