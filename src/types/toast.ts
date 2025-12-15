export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  createdAt: number;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const DEFAULT_TOAST_DURATION = 5000; // 5 seconds
export const MAX_TOASTS = 5; 