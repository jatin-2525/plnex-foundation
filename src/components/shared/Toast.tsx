'use client';

import React from 'react';
import { useToast, ToastMessage } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#1F6B4E] dark:text-[#9AD5AF] flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#825700] dark:text-[#F3D27E] flex-shrink-0" />;
      case 'critical':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#A43B36] dark:text-[#FF9E94] flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#2C6475] dark:text-[#9CCBD4] flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-[#B7DAC3] dark:border-[#315442]';
      case 'warning':
        return 'border-[#E5C185] dark:border-[#5B4A2B]';
      case 'critical':
      case 'error':
        return 'border-[#DCABA7] dark:border-[#5B3734]';
      case 'info':
      default:
        return 'border-[#D9E2DA] dark:border-[#3A5146]';
    }
  };

  return (
    <div
      className={`pointer-events-auto bg-white dark:bg-[#17221D] border ${getBorderColor()} rounded-lg shadow-md p-4 flex items-start gap-3`}
    >
      {getIcon()}
      <div className="flex-1 text-xs">
        <p className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">{toast.title}</p>
        {toast.description && (
          <p className="text-[#52665D] dark:text-[#B5C1B5] mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] p-0.5 rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
