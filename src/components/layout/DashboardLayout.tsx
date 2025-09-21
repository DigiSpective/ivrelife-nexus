import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SessionWarning } from '@/components/auth/SessionWarning';
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect';

export function DashboardLayout() {
  return (
    <RoleBasedRedirect>
      <div className="min-h-screen bg-background">
        <SessionWarning warningThresholdMinutes={5} />
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </RoleBasedRedirect>
  );
}