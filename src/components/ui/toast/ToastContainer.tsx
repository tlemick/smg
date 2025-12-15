'use client';

import React from 'react';
import { Toast } from './Toast';
import { useToast } from '@/hooks/useToast';
import { Toast as ToastType } from '@/types/toast';
import { getZIndexClass } from '@/lib/z-index';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className={`fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:items-start sm:justify-end sm:p-6 ${getZIndexClass('toast')}`}
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast: ToastType) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
} 