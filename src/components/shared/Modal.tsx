'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}: ModalProps) {
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

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className={`relative w-full ${maxWidthClass} bg-white dark:bg-[#17221D] rounded-xl border border-[#D9E2DA] dark:border-[#3A5146] shadow-xl overflow-hidden transition-colors`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D]">
            <div className="min-w-0 pr-2">
              <h2 className="text-base font-bold font-heading text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">{title}</h2>
              {subtitle && <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#52665D] hover:text-[#1A2B25] dark:text-[#B5C1B5] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] rounded-lg transition-colors -mr-1 flex-shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 max-h-[75vh] overflow-y-auto text-[#1A2B25] dark:text-[#F2F4E9] text-sm">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
