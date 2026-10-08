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
  title = 'Unable to load schedule.',
  message = 'Failed to synchronize with schedule database. Check network connection or retry the operation.',
  code,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-white border border-[#E4B0AA] rounded-lg p-6 md:p-8 flex flex-col items-center text-center shadow-xs ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] flex items-center justify-center text-[#B5473C] mb-4 flex-shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-[#172033] mb-2 tracking-tight">{title}</h3>
      <p className="text-sm sm:text-base text-[#596579] max-w-md mb-3 leading-relaxed">
        {message}
      </p>
      {code && (
        <span className="inline-block px-3 py-0.5 bg-[#F1F3F5] border border-[#D9DEE5] rounded text-xs font-mono text-[#596579] mb-6">
          Diagnostic Code: {code}
        </span>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer mt-2"
        >
          <RotateCcw className="w-4 h-4 text-white" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
