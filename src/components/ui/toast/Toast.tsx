'use client';

import React, { useState, useEffect } from 'react';
import { Toast as ToastType } from '@/types/toast';


import { Icon, CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon, XCircleIcon } from '../Icon';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

// Get icon for toast type
function getToastIcon(type: ToastType['type']) {
  switch (type) {
    case 'success':
      return <Icon icon={CheckCircleIcon} size="md" />;
    case 'error':
      return <Icon icon={XCircleIcon} size="md" />;
    case 'warning':
      return <Icon icon={WarningCircleIcon} size="md" />;
    case 'info':
    default:
      return <Icon icon={InfoIcon} size="md" />;
  }
}

// Get styling classes for toast type
function getToastStyles(type: ToastType['type']) {
  switch (type) {
    case 'success':
      return {
        container: 'bg-popover text-popover-foreground border border-border border-l-4 border-l-chart-positive',
        icon: 'text-chart-positive',
        title: 'text-foreground',
        message: 'text-muted-foreground',
        button: 'text-muted-foreground hover:text-foreground',
        action: 'text-primary hover:underline',
      };
    case 'error':
      return {
        container: 'bg-popover text-popover-foreground border border-border border-l-4 border-l-destructive',
        icon: 'text-destructive',
        title: 'text-foreground',
        message: 'text-muted-foreground',
        button: 'text-muted-foreground hover:text-foreground',
        action: 'text-primary hover:underline',
      };
    case 'warning':
      return {
        container: 'bg-popover text-popover-foreground border border-border border-l-4 border-l-chart-4',
        icon: 'text-chart-4',
        title: 'text-foreground',
        message: 'text-muted-foreground',
        button: 'text-muted-foreground hover:text-foreground',
        action: 'text-primary hover:underline',
      };
    case 'info':
    default:
      return {
        container: 'bg-popover text-popover-foreground border border-border border-l-4 border-l-primary',
        icon: 'text-primary',
        title: 'text-foreground',
        message: 'text-muted-foreground',
        button: 'text-muted-foreground hover:text-foreground',
        action: 'text-primary hover:underline',
      };
  }
}

export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const styles = getToastStyles(toast.type);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle removal with animation
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(toast.id), 300); // Match animation duration
  };

  // Handle action click
  const handleActionClick = () => {
    if (toast.action) {
      toast.action.onClick();
      handleRemove();
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden
        transition-all duration-300 ease-in-out transform
        ${styles.container}
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getToastIcon(toast.type)}
          </div>

          {/* Content */}
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className={`text-sm font-medium ${styles.title}`}>
                {toast.title}
              </p>
            )}
            <p className={`text-sm ${toast.title ? 'mt-1' : ''} ${styles.message}`}>
              {toast.message}
            </p>

            {/* Action button */}
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`text-sm font-medium underline ${styles.action}`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              onClick={handleRemove}
              className={`inline-flex ${styles.button} rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
            >
              <span className="sr-only">Close</span>
              <Icon icon={XIcon} size="md" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 