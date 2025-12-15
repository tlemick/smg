import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function Sidebar({ children, className = '', position = 'right' }: SidebarProps) {
  const positionClasses = position === 'left' ? 'order-first lg:order-none' : '';
  
  return (
    <aside className={`sidebar ${positionClasses} ${className}`}>
      {children}
    </aside>
  );
}