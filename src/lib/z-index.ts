/**
 * Centralized Z-Index Management System
 * 
 * This system provides semantic z-index values to prevent conflicts
 * and ensure predictable layering across the application.
 */

export const zIndex = {
  // Base layer - normal document flow
  base: 0,
  content: 1,

  // Interactive elements that appear above content
  dropdown: 100,
  tooltip: 200,
  popover: 300,

  // Overlays and sticky elements
  sticky: 400,
  overlay: 500,

  // Modal system - each level is 10 apart to allow for sub-layers
  modalBackdrop: 1000,
  modalContent: 1010,
  modalNested: 1020,

  // System-level elements that should always be on top
  toast: 2000,
  debug: 9999,
} as const;

/**
 * Get Tailwind CSS class for z-index value
 */
export const getZIndexClass = (layer: keyof typeof zIndex): string => {
  const value = zIndex[layer];
  return `z-[${value}]`;
};

/**
 * Validate that a z-index value is from our approved scale
 */
export const isValidZIndex = (value: number): boolean => {
  return Object.values(zIndex).includes(value);
};

/**
 * Get the next available z-index in a layer range
 */
export const getNextZIndex = (baseLayer: keyof typeof zIndex, offset: number = 1): number => {
  return zIndex[baseLayer] + offset;
};
