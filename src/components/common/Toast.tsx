import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, useToast as useToastHook, type Toast, type ToastType } from '@/hooks/useToast';

export const useToast = useToastHook;

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-success-500" />,
  error: <XCircle size={20} className="text-danger-500" />,
  warning: <AlertTriangle size={20} className="text-warning-500" />,
  info: <Info size={20} className="text-primary-500" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-200',
  error: 'bg-danger-50 border-danger-200',
  warning: 'bg-warning-50 border-warning-200',
  info: 'bg-primary-50 border-primary-200',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in-right min-w-[300px]',
              bgColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-neutral-800">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              <X size={16} className="text-neutral-500" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
