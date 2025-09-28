import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User,
  Key,
  Bell,
  Database,
  Bug
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useSettings';
import { useUserFeatures } from '@/hooks/useSettings';
import { useUserNotifications } from '@/hooks/useSettings';
import { useSystemSettings } from '@/hooks/useSettings';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { FeatureToggleList } from '@/components/settings/FeatureToggleList';
import { NotificationSettingsForm } from '@/components/settings/NotificationSettingsForm';
import { SystemSettingsForm } from '@/components/settings/SystemSettingsForm';
import { SettingsAuthGuard } from '@/components/settings/SettingsAuthGuard';
import { PersistenceStatusPanel } from '@/components/debug/PersistenceStatusPanel';

export default function Settings() {
  const { data: currentUser } = useCurrentUser();
  const { data: userProfile } = useUserProfile(currentUser?.id || '');
  const { data: userFeatures } = useUserFeatures(currentUser?.id || '');
  const { data: userNotifications } = useUserNotifications(currentUser?.id || '');
  const { data: systemSettings } = useSystemSettings();
  
  const [activeTab, setActiveTab] = useState('profile');

  // Check if user has admin privileges
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'backoffice';

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'features', name: 'Features', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    ...(isAdmin ? [{ id: 'system', name: 'System', icon: Database }] : []),
    { id: 'debug', name: 'Debug Persistence', icon: Bug },
  ];

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SettingsAuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <ProfileForm user={currentUser} />
              </div>
            )}

            {/* Features */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <FeatureToggleList 
                  features={userFeatures?.data || []} 
                  userId={currentUser.id} 
                />
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <NotificationSettingsForm 
                  notifications={userNotifications?.data || []} 
                  userId={currentUser.id} 
                />
              </div>
            )}

            {/* System Settings (Admin only) */}
            {activeTab === 'system' && isAdmin && (
              <div className="space-y-6">
                <SystemSettingsForm settings={systemSettings?.data || []} />
              </div>
            )}

            {/* Debug Persistence */}
            {activeTab === 'debug' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Persistence Debug Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PersistenceStatusPanel />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsAuthGuard>
  );
}