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
        className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-[#D9DEE5] rounded-lg ${className}`}
      >
        <Loader2 className="w-7 h-7 text-[#176B87] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#172033]">{message}</p>
        <span className="text-xs text-[#596579] mt-1 font-mono">Synchronizing with L1–L6 WBS database...</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0]">
        <div className="h-5 bg-[#F0F2F5] rounded w-1/4"></div>
        <div className="h-4 bg-[#F0F2F5] rounded w-24"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="h-4 bg-[#F0F2F5] rounded w-20 flex-shrink-0"></div>
            <div className="h-4 bg-[#F0F2F5] rounded flex-1"></div>
            <div className="h-4 bg-[#F0F2F5] rounded w-28 flex-shrink-0"></div>
            <div className="h-4 bg-[#F0F2F5] rounded w-16 flex-shrink-0"></div>
          </div>
        ))}
      </div>
      <div className="pt-2 flex justify-end">
        <span className="text-xs text-[#8A94A6] font-mono">{message}</span>
      </div>
    </div>
  );
}
