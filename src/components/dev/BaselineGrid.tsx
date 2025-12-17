'use client';

import { useState, useEffect } from 'react';

/**
 * BaselineGrid - Development tool for visualizing the 4px baseline grid
 * 
 * Usage: Add to your root layout and toggle with Ctrl+Shift+G (or Cmd+Shift+G on Mac)
 */
export function BaselineGrid() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only available in development
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Ctrl+Shift+G (Cmd+Shift+G on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development' || !visible) {
    return null;
  }

  return (
    <>
      {/* Baseline grid overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[9999]"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255, 0, 0, 0.15) 0, rgba(255, 0, 0, 0.15) 1px, transparent 1px, transparent 4px)',
          backgroundSize: '100% 4px',
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Info label */}
      <div className="fixed bottom-4 right-4 z-[10000] bg-red-500 text-white text-xs font-mono px-3 py-2 rounded shadow-lg pointer-events-none">
        4px Baseline Grid Active (Ctrl+Shift+G to toggle)
      </div>
    </>
  );
}

