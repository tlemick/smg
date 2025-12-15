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
        container: 'bg-green-50 border border-green-200',
        icon: 'text-green-400',
        title: 'text-green-800',
        message: 'text-green-700',
        button: 'text-green-400 hover:text-green-600',
        action: 'text-green-600 hover:text-green-700',
      };
    case 'error':
      return {
        container: 'bg-red-50 border border-red-200',
        icon: 'text-red-400',
        title: 'text-red-800',
        message: 'text-red-700',
        button: 'text-red-400 hover:text-red-600',
        action: 'text-red-600 hover:text-red-700',
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border border-yellow-200',
        icon: 'text-yellow-400',
        title: 'text-yellow-800',
        message: 'text-yellow-700',
        button: 'text-yellow-400 hover:text-yellow-600',
        action: 'text-yellow-600 hover:text-yellow-700',
      };
    case 'info':
    default:
      return {
        container: 'bg-blue-50 border border-blue-200',
        icon: 'text-blue-400',
        title: 'text-blue-800',
        message: 'text-blue-700',
        button: 'text-blue-400 hover:text-blue-600',
        action: 'text-blue-600 hover:text-blue-700',
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
              className={`inline-flex ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400`}
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