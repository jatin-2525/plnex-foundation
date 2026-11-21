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
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-8 md:p-12 flex flex-col items-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-[#F8EFDA] dark:bg-[#3A3120] border border-[#E5C185] dark:border-[#5B4A2B] flex items-center justify-center text-[#825700] dark:text-[#F3D27E] mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#1A2B25] dark:text-[#F2F4E9] mb-2">
        Access Restricted — Project Controls Policy
      </h3>
      <p className="text-sm text-[#52665D] dark:text-[#B5C1B5] max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="px-3 py-1 bg-[#EAF0E9] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-xs font-mono text-[#1A2B25] dark:text-[#F2F4E9]">
          Current Role: <strong className="uppercase">{role}</strong>
        </span>
        <span className="px-3 py-1 bg-[#F8EFDA] dark:bg-[#3A3120] border border-[#E5C185] dark:border-[#5B4A2B] rounded text-xs font-mono text-[#825700] dark:text-[#F3D27E]">
          Required: <code className="font-semibold">{requiredPermission}</code>
        </span>
      </div>

      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] text-sm font-medium rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#52665D] dark:text-[#B5C1B5]" />
          Return to Overview
        </button>
      )}
    </div>
  );
}
