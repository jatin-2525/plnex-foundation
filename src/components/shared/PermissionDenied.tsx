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
      className={`bg-white border border-[#D9DEE5] rounded-lg p-8 md:p-12 flex flex-col items-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-center text-[#D98B32] mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#172033] mb-1.5">
        Access Restricted — Project Controls Policy
      </h3>
      <p className="text-sm text-[#596579] max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="px-2.5 py-1 bg-[#F1F3F5] border border-[#D9DEE5] rounded text-xs font-mono text-[#172033]">
          Current Role: <strong className="uppercase">{role}</strong>
        </span>
        <span className="px-2.5 py-1 bg-[#FDF6ED] border border-[#F0D4A6] rounded text-xs font-mono text-[#D98B32]">
          Required: <code className="font-semibold">{requiredPermission}</code>
        </span>
      </div>

      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#596579]" />
          Return to Overview
        </button>
      )}
    </div>
  );
}
