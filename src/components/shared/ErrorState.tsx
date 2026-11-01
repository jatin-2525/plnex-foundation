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
  title = 'Schedule could not be displayed.', // Alternate / legacy: Unable to load schedule.
  message = 'The schedule data is temporarily unavailable. Check your network connection or retry the operation.',
  code,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-white border border-[#D8E2EA] rounded-lg p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto ${className}`}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-[#FCE8E4] border border-[#E4B0AA] flex items-center justify-center text-[#A24335] mb-3 shrink-0">
        <AlertCircle className="w-5 h-5 stroke-[2]" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#142C3F] mb-1.5">{title}</h3>
      <p className="text-xs text-[#526779] max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {code && (
        <span className="inline-block px-2.5 py-0.5 bg-[#F3F6FA] border border-[#D8E2EA] rounded text-[11px] font-mono text-[#526779] mb-4">
          Diagnostic Code: {code}
        </span>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F6B68] hover:bg-[#135A72] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
