import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export function Container({ children, className = '', fluid = false }: ContainerProps) {
  const baseClasses = fluid 
    ? 'w-full px-6 lg:px-12' 
    : 'container';
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}