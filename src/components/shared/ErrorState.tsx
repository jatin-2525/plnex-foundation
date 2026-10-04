'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Data Synchronization Error',
  message = 'An unexpected error occurred while communicating with the schedule linking service.',
  code = 'ERR_PLNEX_SYNC_TIMEOUT',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-white border border-[#E4B0AA] rounded-lg p-6 md:p-8 flex flex-col items-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] flex items-center justify-center text-[#B5473C] mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#172033] mb-1.5">{title}</h3>
      <p className="text-sm text-[#596579] max-w-md mb-3 leading-relaxed">
        {message}
      </p>
      {code && (
        <span className="inline-block px-2 py-0.5 bg-[#F0F2F5] border border-[#D9DEE5] rounded text-xs font-mono text-[#596579] mb-6">
          Code: {code}
        </span>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] text-sm font-medium rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-[#596579]" />
          Retry Operation
        </button>
      )}
    </div>
  );
}
