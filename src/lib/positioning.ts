/**
 * Positioning Utilities for Consistent Modal and Popover Patterns
 */

import { zIndex, getZIndexClass } from './z-index';

/**
 * Standard modal positioning pattern
 */
export const createModalClasses = () => ({
  backdrop: `fixed inset-0 bg-black/60 ${getZIndexClass('modalBackdrop')}`,
  container: `fixed inset-0 flex items-center justify-center p-4 ${getZIndexClass('modalContent')}`,
  content: 'bg-white rounded-lg shadow-xl max-w-md w-full',
});

/**
 * Standard modal positioning pattern with custom backdrop opacity
 */
export const createModalClassesWithOpacity = (backdropOpacity: number = 0.6) => ({
  backdrop: `fixed inset-0 bg-black/${Math.round(backdropOpacity * 100)} ${getZIndexClass('modalBackdrop')}`,
  container: `fixed inset-0 flex items-center justify-center p-4 ${getZIndexClass('modalContent')}`,
  content: 'bg-white rounded-lg shadow-xl max-w-md w-full',
});

/**
 * Standard popover positioning pattern
 */
export const createPopoverClasses = () => ({
  container: 'relative',
  content: `absolute bg-white border border-gray-200 rounded-lg shadow-xl ${getZIndexClass('popover')}`,
});

/**
 * Standard dropdown positioning pattern
 */
export const createDropdownClasses = () => ({
  container: 'relative',
  content: `absolute bg-white border border-gray-200 rounded-md shadow-lg ${getZIndexClass('dropdown')}`,
});

/**
 * Standard tooltip positioning pattern
 */
export const createTooltipClasses = () => ({
  container: 'relative',
  content: `absolute bg-gray-900 text-white text-sm rounded px-2 py-1 ${getZIndexClass('tooltip')}`,
});

/**
 * Standard overlay positioning pattern
 */
export const createOverlayClasses = () => ({
  container: `absolute inset-0 ${getZIndexClass('overlay')}`,
  content: 'relative w-full h-full',
});

/**
 * Event handlers for modals
 */
export const createModalHandlers = (onClose: () => void) => ({
  backdropClick: onClose,
  contentClick: (e: React.MouseEvent) => e.stopPropagation(),
  escapeKey: (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  },
});

/**
 * Common modal props type
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * Common popover props type
 */
export interface PopoverProps {
  isOpen: boolean;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}
