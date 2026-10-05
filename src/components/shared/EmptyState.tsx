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
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-[#D9DEE5] rounded-xl shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#F0F2F5] border border-[#D9DEE5] flex items-center justify-center text-[#176B87] mb-4 flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-[#172033] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm sm:text-base text-[#596579] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              <span>{action.label}</span>
            </button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
