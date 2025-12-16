import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  background?: 'default' | 'card' | 'muted';
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
    card: 'bg-card text-card-foreground',
    muted: 'bg-muted text-foreground'
  };
  
  return (
    <section className={`${spacingClasses[spacing]} ${backgroundClasses[background]} ${className}`}>
      {children}
    </section>
  );
}