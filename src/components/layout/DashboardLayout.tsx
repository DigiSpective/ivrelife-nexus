import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SessionWarning } from '@/components/auth/SessionWarning';
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RoleBasedRedirect>
      <div className="min-h-screen bg-background">
        <SessionWarning warningThresholdMinutes={5} />
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RoleBasedRedirect>
  );
}