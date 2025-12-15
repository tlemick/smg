import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  background?: 'default' | 'surface' | 'muted';
}

export function Section({ 
  children, 
  className = '', 
  spacing = 'md',
  background = 'default'
}: SectionProps) {
  const spacingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-4',
    lg: 'py-4',
    xl: 'py-4'
  };

  const backgroundClasses = {
    default: '',
    surface: 'bg-surface',
    muted: 'bg-neutral-100 dark:bg-neutral-800'
  };
  
  return (
    <section className={`${spacingClasses[spacing]} ${backgroundClasses[background]} ${className}`}>
      {children}
    </section>
  );
}