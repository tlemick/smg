import { Sidebar } from '@/components/navigation/Sidebar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { MobileNav } from '@/components/navigation/MobileNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function LeaderboardLayout({
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
        
        {/* Scrollable Content - full bleed so leaderboard bg goes to menu edges */}
        <main className="flex-1 overflow-y-auto bg-background pb-20 lg:pb-4">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
