'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Undo2 } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'critical' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 4500, undoAction, undoLabel }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration, undoAction, undoLabel }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Fixed bottom-right toast notification stack */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
        aria-live="assertive"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isCritical = toast.type === 'critical' || toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto rounded-lg border p-3 shadow-lg transition-all duration-200 flex items-start gap-3 bg-white ${
                isSuccess
                  ? 'border-[#B1DBD2] text-[#142C3F]'
                  : isWarning
                  ? 'border-[#F0D4A6] text-[#142C3F]'
                  : isCritical
                  ? 'border-[#E8B6BA] text-[#142C3F]'
                  : 'border-[#D8E2EA] text-[#142C3F]'
              }`}
            >
              {/* Type Icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#176B53]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-[#845006]" />}
                {isCritical && <AlertCircle className="w-4 h-4 text-[#A24335]" />}
                {isInfo && <Info className="w-4 h-4 text-[#0F6B68]" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight text-[#142C3F]">
                  {toast.title}
                </div>
                {toast.description && (
                  <div className="text-[11px] text-[#526779] mt-0.5 leading-normal">
                    {toast.description}
                  </div>
                )}

                {/* Optional Undo Button (Feature 23) */}
                {toast.undoAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.undoAction?.();
                      removeToast(toast.id);
                    }}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#0F6B68] hover:text-[#0a444e] underline cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>{toast.undoLabel || 'Undo action'}</span>
                  </button>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[#7B8798] hover:text-[#142C3F] shrink-0 p-0.5 rounded transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
