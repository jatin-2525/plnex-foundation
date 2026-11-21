'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'critical' | 'warning';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'critical':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#F6E4E1] dark:bg-[#3B2422] border border-[#DCABA7] dark:border-[#5B3734] flex items-center justify-center text-[#A43B36] dark:text-[#FF9E94] flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#F8EFDA] dark:bg-[#3A3120] border border-[#E5C185] dark:border-[#5B4A2B] flex items-center justify-center text-[#825700] dark:text-[#F3D27E] flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#EAF0E9] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD] flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'critical':
        return 'bg-[#92372F] hover:bg-[#973930] dark:bg-[#A43B36] dark:hover:bg-[#8F332E] text-white';
      case 'warning':
        return 'bg-[#81500B] hover:bg-[#B77226] dark:bg-[#E5C185] dark:hover:bg-[#D4AF74] text-white dark:text-[#17221D]';
      case 'primary':
      default:
        return 'bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822]';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] rounded-md transition-colors border border-[#D9E2DA] dark:border-[#3A5146]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-xs transition-colors ${getConfirmButtonClasses()}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        {getIcon()}
        <div className="text-sm text-[#52665D] dark:text-[#B5C1B5] leading-relaxed">
          {message}
        </div>
      </div>
    </Modal>
  );
}
