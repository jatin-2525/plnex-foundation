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
      className={`flex items-center justify-center gap-2 p-8 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-sm text-[#52665D] dark:text-[#B5C1B5] ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 animate-spin text-[#006B61] dark:text-[#72C6AD] flex-shrink-0" />
      <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">{message}</span>
    </div>
  );
}

