import React from 'react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSettings';
import { SystemSettingsForm } from '@/components/settings/SystemSettingsForm';
import { SettingsAuthGuard } from '@/components/settings/SettingsAuthGuard';

export default function SystemSettingsPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: systemSettings } = useSystemSettings();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SettingsAuthGuard requiredRole="backoffice">
      <div className="space-y-6">
        <SystemSettingsForm settings={systemSettings?.data || []} />
      </div>
    </SettingsAuthGuard>
  );
}