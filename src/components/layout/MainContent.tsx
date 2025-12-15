import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main className={`main-content ${className}`}>
      {children}
    </main>
  );
}