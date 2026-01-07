import { Sidebar } from '@/components/navigation/Sidebar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { MobileNav } from '@/components/navigation/MobileNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

/**
 * Asset Page Layout
 * 
 * Reuses the dashboard layout (sidebar + header) for consistency.
 * Asset pages show market data and trading functionality, so they need
 * the full dashboard chrome for navigation and context.
 */
export default function AssetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Command Palette (keyboard shortcut Cmd/Ctrl+K) */}
        <CommandPalette />
        
        {/* Dashboard Header - Desktop only */}
        <DashboardHeader className="hidden lg:flex" />
        
        {/* Scrollable Content - padding follows 4px baseline (p-4=16px, p-6=24px, p-8=32px) */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8 pb-20 lg:pb-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
