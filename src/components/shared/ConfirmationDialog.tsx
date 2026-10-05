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
          <div className="w-10 h-10 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] flex items-center justify-center text-[#B5473C] flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-center text-[#D98B32] flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87] flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'critical':
        return 'bg-[#B5473C] hover:bg-[#973930] text-white';
      case 'warning':
        return 'bg-[#D98B32] hover:bg-[#B77226] text-white';
      case 'primary':
      default:
        return 'bg-[#176B87] hover:bg-[#135A72] text-white';
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
            className="px-4 py-2 text-sm font-medium text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-md transition-colors border border-[#D9DEE5]"
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
        <div className="text-sm text-[#596579] leading-relaxed">
          {message}
        </div>
      </div>
    </Modal>
  );
}
