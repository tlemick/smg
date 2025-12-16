import { Sidebar } from '@/components/navigation/Sidebar';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { MobileNav } from '@/components/navigation/MobileNav';

export default function DashboardLayout({
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
        {/* Command Palette (global) */}
        <CommandPalette />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
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
