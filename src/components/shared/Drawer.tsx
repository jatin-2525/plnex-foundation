'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172033]/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container: Fullscreen sheet on mobile, slide-over drawer on tablet/desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex sm:pl-10 z-10">
        <div
          className={`w-full sm:w-screen ${widthClass} h-full bg-white sm:border-l border-[#D9DEE5] shadow-lg flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#D9DEE5] bg-white flex-shrink-0">
            <div className="min-w-0 pr-2">
              <h2 className="text-base sm:text-lg font-semibold text-[#172033] truncate">{title}</h2>
              {subtitle && <p className="text-xs text-[#596579] mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-md transition-colors -mr-1 flex-shrink-0 cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 px-4 sm:px-6 py-4 sm:py-4 overflow-y-auto text-[#172033] text-xs sm:text-sm">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-t border-[#D9DEE5] bg-[#F7F8FA] flex-shrink-0 flex-wrap">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
