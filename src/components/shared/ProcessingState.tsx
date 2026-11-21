'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

export interface ProcessingStateProps {
  title: string;
  currentStep: string;
  progressPercent: number;
  totalSteps?: number;
  stepIndex?: number;
  notes?: string;
  onCancel?: () => void;
  className?: string;
}

export function ProcessingState({
  title,
  currentStep,
  progressPercent,
  totalSteps,
  stepIndex,
  notes,
  onCancel,
  className = '',
}: ProcessingStateProps) {
  return (
    <div
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-6 flex flex-col items-center text-center max-w-lg mx-auto ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 className="w-4 h-4 animate-spin text-[#006B61] dark:text-[#72C6AD] shrink-0" />
        <h3 className="text-sm font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">{title}</h3>
      </div>
      <p className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5] mb-4">
        {stepIndex && totalSteps ? `Step ${stepIndex} of ${totalSteps}: ` : ''}
        {currentStep}
      </p>

      <div className="w-full mb-3">
        <ProgressBar actual={progressPercent} size="md" showLabels={false} />
      </div>

      <div className="flex items-center justify-between w-full text-xs text-[#52665D] dark:text-[#B5C1B5] font-mono mb-4">
        <span>Processing pipeline...</span>
        <span>{Math.round(progressPercent)}%</span>
      </div>

      {notes && (
        <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] bg-[#F6F7F3] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] p-3 rounded w-full text-left font-mono mb-4 leading-relaxed">
          {notes}
        </p>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs font-medium text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] underline transition-colors"
        >
          Cancel Processing
        </button>
      )}
    </div>
  );
}
