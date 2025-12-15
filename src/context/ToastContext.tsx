'use client';

import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { Toast, ToastOptions, ToastContextType, DEFAULT_TOAST_DURATION, MAX_TOASTS, ToastType } from '@/types/toast';

// Action types for the reducer
type ToastAction = 
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' };

// Reducer function for managing toast state
function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      // Remove oldest toasts if we exceed the maximum
      const newState = [...state, action.payload];
      return newState.length > MAX_TOASTS 
        ? newState.slice(-MAX_TOASTS) 
        : newState;
        
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
      
    case 'CLEAR_ALL_TOASTS':
      return [];
      
    default:
      return state;
  }
}

// Generate unique ID for toasts
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create the context
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ToastProvider component
interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  // Function to add a new toast
  const addToast = useCallback((message: string, options?: ToastOptions): string => {
    const id = generateToastId();
    const toast: Toast = {
      id,
      type: options?.type || 'info',
      title: options?.title,
      message,
      duration: options?.duration || DEFAULT_TOAST_DURATION,
      action: options?.action,
      createdAt: Date.now(),
    };

    dispatch({ type: 'ADD_TOAST', payload: toast });
    return id;
  }, []);

  // Function to remove a toast
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  // Function to clear all toasts
  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  }, []);

  // Auto-remove toasts after their duration
  useEffect(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();

    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0 && !timeouts.has(toast.id)) {
        const timeout = setTimeout(() => {
          removeToast(toast.id);
          timeouts.delete(toast.id);
        }, toast.duration);
        timeouts.set(toast.id, timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, [toasts, removeToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

// Convenience functions for different toast types
export function createToastHelpers(addToast: (message: string, options?: ToastOptions) => string) {
  return {
    success: (message: string, options?: Omit<ToastOptions, 'type'>) => 
      addToast(message, { ...options, type: 'success' }),
    error: (message: string, options?: Omit<ToastOptions, 'type'>) => 
      addToast(message, { ...options, type: 'error' }),
    warning: (message: string, options?: Omit<ToastOptions, 'type'>) => 
      addToast(message, { ...options, type: 'warning' }),
    info: (message: string, options?: Omit<ToastOptions, 'type'>) => 
      addToast(message, { ...options, type: 'info' }),
  };
} 