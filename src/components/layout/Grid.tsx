import React from 'react';
import { cn } from '@/lib/utils';

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

  const columnClasses: Record<GridProps['columns'], string> = {
    12: 'grid-cols-12',
    6: 'grid-cols-6',
    4: 'grid-cols-4',
    3: 'grid-cols-3',
    2: 'grid-cols-2',
    1: 'grid-cols-1',
  };
  
  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}