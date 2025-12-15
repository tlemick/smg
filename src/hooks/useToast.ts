'use client';

import { useContext } from 'react';
import { ToastContext, createToastHelpers } from '@/context/ToastContext';
import { ToastOptions } from '@/types/toast';

export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // Create convenience methods for different toast types
  const helpers = createToastHelpers(context.addToast);

  return {
    // Core methods
    toasts: context.toasts,
    addToast: context.addToast,
    removeToast: context.removeToast,
    clearAllToasts: context.clearAllToasts,
    
    // Convenience methods
    success: helpers.success,
    error: helpers.error,
    warning: helpers.warning,
    info: helpers.info,
    
    // Additional utility methods
    isActive: (id: string) => context.toasts.some(toast => toast.id === id),
    getToast: (id: string) => context.toasts.find(toast => toast.id === id),
    count: context.toasts.length,
  };
} 