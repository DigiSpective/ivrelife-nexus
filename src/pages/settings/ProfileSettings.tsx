import React from 'react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useSettings';
import { useUserFeatures } from '@/hooks/useSettings';
import { useUserNotifications } from '@/hooks/useSettings';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { FeatureToggleList } from '@/components/settings/FeatureToggleList';
import { NotificationSettingsForm } from '@/components/settings/NotificationSettingsForm';
import { SettingsAuthGuard } from '@/components/settings/SettingsAuthGuard';

export default function ProfileSettings() {
  const { data: currentUser } = useCurrentUser();
  const { data: userProfile } = useUserProfile(currentUser?.id || '');
  const { data: userFeatures } = useUserFeatures(currentUser?.id || '');
  const { data: userNotifications } = useUserNotifications(currentUser?.id || '');

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SettingsAuthGuard>
      <div className="space-y-6">
        <ProfileForm user={currentUser} />
        <FeatureToggleList 
          features={userFeatures?.data || []} 
          userId={currentUser.id} 
        />
        <NotificationSettingsForm 
          notifications={userNotifications?.data || []} 
          userId={currentUser.id} 
        />
      </div>
    </SettingsAuthGuard>
  );
}