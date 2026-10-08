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
      className={`bg-white border border-[#D9DEE5] rounded-lg p-6 flex flex-col items-center text-center max-w-lg mx-auto ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Loader2 className="w-4 h-4 animate-spin text-[#176B87] shrink-0" />
        <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
      </div>
      <p className="text-xs font-medium text-[#596579] mb-4">
        {stepIndex && totalSteps ? `Step ${stepIndex} of ${totalSteps}: ` : ''}
        {currentStep}
      </p>

      <div className="w-full mb-3">
        <ProgressBar actual={progressPercent} size="md" showLabels={false} />
      </div>

      <div className="flex items-center justify-between w-full text-xs text-[#596579] font-mono mb-4">
        <span>Processing pipeline...</span>
        <span>{Math.round(progressPercent)}%</span>
      </div>

      {notes && (
        <p className="text-xs text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5] p-3 rounded w-full text-left font-mono mb-4 leading-relaxed">
          {notes}
        </p>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs font-medium text-[#596579] hover:text-[#172033] underline transition-colors"
        >
          Cancel Processing
        </button>
      )}
    </div>
  );
}
