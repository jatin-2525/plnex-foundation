'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  type?: 'skeleton' | 'spinner';
  rows?: number;
  className?: string;
}

export function LoadingState({
  message = 'Loading project data...',
  type = 'skeleton',
  rows = 4,
  className = '',
}: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div
        className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-[#D9DEE5] rounded-lg shadow-xs ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 text-[#176B87] animate-spin mb-3" />
        <p className="text-sm sm:text-base font-semibold text-[#172033]">{message}</p>
        <span className="text-xs text-[#7B8798] mt-1 font-mono">Synchronizing with L1–L6 WBS database...</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-4 animate-pulse shadow-xs ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]">
        <div className="h-5 bg-[#F1F3F5] rounded w-1/4"></div>
        <div className="h-4 bg-[#F1F3F5] rounded w-24"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="h-4 bg-[#F1F3F5] rounded w-20 flex-shrink-0"></div>
            <div className="h-4 bg-[#F1F3F5] rounded flex-1"></div>
            <div className="h-4 bg-[#F1F3F5] rounded w-28 flex-shrink-0"></div>
            <div className="h-4 bg-[#F1F3F5] rounded w-16 flex-shrink-0"></div>
          </div>
        ))}
      </div>
      <div className="pt-2 flex items-center justify-between text-xs text-[#7B8798] font-mono">
        <span className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#176B87]" />
          <span>Active schedule processing</span>
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
