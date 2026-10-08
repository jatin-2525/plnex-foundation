'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  rows?: number;
  type?: 'inline' | 'centered';
  className?: string;
}

export function LoadingState({
  message = 'Loading schedule...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 p-8 bg-white border border-[#D9DEE5] rounded-lg text-sm text-[#596579] ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 animate-spin text-[#176B87] flex-shrink-0" />
      <span className="font-medium text-[#172033]">{message}</span>
    </div>
  );
}

