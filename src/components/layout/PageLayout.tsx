import React from 'react';
import { Container } from './Container';
import { Grid } from './Grid';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  className?: string;
  containerFluid?: boolean;
}

export function PageLayout({ 
  children, 
  sidebar, 
  sidebarPosition = 'right',
  className = '',
  containerFluid = false 
}: PageLayoutProps) {
  return (
    <Container fluid={containerFluid} className={className}>
      {sidebar ? (
        <Grid>
          {sidebarPosition === 'left' && sidebar && (
            <Sidebar position="left">{sidebar}</Sidebar>
          )}
          <MainContent>{children}</MainContent>
          {sidebarPosition === 'right' && sidebar && (
            <Sidebar position="right">{sidebar}</Sidebar>
          )}
        </Grid>
      ) : (
        <div className="w-full">
          {children}
        </div>
      )}
    </Container>
  );
}