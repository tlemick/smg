import React from 'react';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main className={cn('col-span-12 lg:col-span-8', className)}>
      {children}
    </main>
  );
}