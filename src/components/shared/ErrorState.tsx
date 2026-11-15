'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Schedule data could not be displayed',
  message = 'The schedule records are temporarily unavailable. Check your connection or retry the operation.',
  code,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto shadow-xs ${className}`}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-[#F6E4E1] dark:bg-[#3B2422] border border-[#DCABA7] dark:border-[#5B3734] flex items-center justify-center text-[#A43B36] dark:text-[#FF9E94] mb-3 shrink-0">
        <AlertCircle className="w-5 h-5 stroke-[2]" />
      </div>
      <h3 className="text-sm sm:text-base font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] mb-1.5">{title}</h3>
      <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {code && (
        <span className="inline-block px-2.5 py-0.5 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5] mb-4">
          Diagnostic Code: {code}
        </span>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
