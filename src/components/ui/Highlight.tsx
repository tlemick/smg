import React from 'react';

/**
 * Highlight component for emphasizing text with an underline
 * Matches the design system used throughout the portfolio section
 */
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span 
      className="font-bold underline decoration-black dark:decoration-white decoration-2 underline-offset-2"
    >
      {children}
    </span>
  );
}

export default Highlight;

