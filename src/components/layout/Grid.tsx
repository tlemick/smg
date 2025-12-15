import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 12 | 6 | 4 | 3 | 2 | 1;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Grid({ 
  children, 
  className = '', 
  columns = 12,
  gap = 'md'
}: GridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6', 
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const gridClass = columns === 12 ? 'grid-12' : `grid grid-cols-${columns}`;
  
  return (
    <div className={`${gridClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}