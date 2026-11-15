'use client';

import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: ReactNode;
  showBlueprintIllustration?: boolean;
  className?: string;
}

/**
 * Functional Empty State with optional flat blueprint-style engineering illustration
 * Supports both light and dark themes with WCAG 2.2 contrast.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  showBlueprintIllustration = true,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl shadow-xs transition-colors ${className}`}
    >
      {/* Flat Blueprint-Style Schematic Illustration */}
      {showBlueprintIllustration ? (
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
          <svg
            viewBox="0 0 96 96"
            className="w-full h-full text-[#006B61]/20 dark:text-[#72C6AD]/25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Blueprint Grid Lines */}
            <rect x="8" y="8" width="80" height="80" rx="8" className="stroke-current" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="8" y1="48" x2="88" y2="48" className="stroke-current" strokeWidth="0.8" strokeDasharray="2,2" />
            <line x1="48" y1="8" x2="48" y2="88" className="stroke-current" strokeWidth="0.8" strokeDasharray="2,2" />
            
            {/* Structural Milestone Node Box */}
            <rect x="28" y="28" width="40" height="40" rx="6" className="fill-[#EAF0E9] dark:fill-[#243832] stroke-[#006B61] dark:stroke-[#72C6AD]" strokeWidth="1.5" />
            
            {/* Engineering Schematic Dimension Callouts */}
            <line x1="20" y1="28" x2="20" y2="68" className="stroke-[#52665D] dark:stroke-[#B5C1B5]" strokeWidth="1" />
            <line x1="17" y1="28" x2="23" y2="28" className="stroke-[#52665D] dark:stroke-[#B5C1B5]" strokeWidth="1" />
            <line x1="17" y1="68" x2="23" y2="68" className="stroke-[#52665D] dark:stroke-[#B5C1B5]" strokeWidth="1" />
            
            {/* Center Center Icon */}
            <circle cx="48" cy="48" r="8" className="fill-[#006B61]/15 dark:fill-[#72C6AD]/20 stroke-[#006B61] dark:stroke-[#72C6AD]" strokeWidth="1.2" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#006B61] dark:text-[#72C6AD]" />
          </div>
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] mb-4 flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#52665D] dark:text-[#B5C1B5] max-w-md mb-5 leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              <span>{action.label}</span>
            </button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
