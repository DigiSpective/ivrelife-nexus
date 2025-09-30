import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
// import { SessionWarning } from '@/components/auth/SessionWarning';
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleBasedRedirect>
      <div className="min-h-screen bg-background">
        {/* Temporary fix: Disable SessionWarning to prevent automatic logout after 1-2 minutes */}
        {/* <SessionWarning warningThresholdMinutes={5} /> */}
        <div className="flex h-screen">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RoleBasedRedirect>
  );
}