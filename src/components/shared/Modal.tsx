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
        className="fixed inset-0 bg-[#172033]/40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidthClass} bg-white rounded-lg border border-[#D9DEE5] shadow-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#D9DEE5] bg-white">
            <div>
              <h2 className="text-base font-semibold text-[#172033] leading-snug">{title}</h2>
              {subtitle && <p className="text-xs text-[#596579] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-[#596579] hover:text-[#172033] p-1 rounded-md hover:bg-[#F1F3F5] transition-colors -mr-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-[#172033] text-sm">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#D9DEE5] bg-[#F7F8FA]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
