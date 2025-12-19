import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function Sidebar({ children, className = '', position = 'right' }: SidebarProps) {
  const positionClasses = position === 'left' ? 'order-first lg:order-none' : '';
  
  return (
    <aside className={cn('col-span-12 lg:col-span-4', positionClasses, className)}>
      {children}
    </aside>
  );
}