import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserNotification } from '@/types';
import { useUpdateUserNotification, useCreateUserNotification } from '@/hooks/useSettings';
import { NotificationForm } from '@/components/settings/NotificationForm';

interface NotificationSettingsFormProps {
  notifications: UserNotification[];
  userId: string;
}

export function NotificationSettingsForm({ notifications, userId }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<UserNotification | null>(null);
  
  const { mutate: updateNotification } = useUpdateUserNotification();
  const { mutate: createNotification } = useCreateUserNotification();
  
  // Define notification types
  const notificationTypes = [
    { type: 'email', name: 'Email Notifications', description: 'Receive email notifications for important updates' },
    { type: 'sms', name: 'SMS Notifications', description: 'Receive SMS notifications for urgent alerts' },
    { type: 'push', name: 'Push Notifications', description: 'Receive push notifications in the app' },
  ];
  
  const handleNotificationToggle = (type: 'email' | 'sms' | 'push', enabled: boolean) => {
    const existingNotification = notifications.find(n => n.type === type);
    
    if (existingNotification) {
      // Update existing notification
      updateNotification(
        { notificationId: existingNotification.id, enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Notification preference updated',
              description: `${type} notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
            });
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to update notification preference. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Create new notification preference
      createNotification(
        { user_id: userId, type, enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Notification preference added',
              description: `${type} notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
            });
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to add notification preference. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };
  
  const handleEditNotification = (notification: UserNotification) => {
    setEditingNotification(notification);
    setShowForm(true);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNotification(null);
  };
  
  if (showForm) {
    return (
      <NotificationForm 
        notification={editingNotification || undefined} 
        userId={userId} 
        onSuccess={handleFormSuccess} 
      />
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to be notified about important events.
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>Add Notification</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map((notification) => {
          const userNotification = notifications.find(n => n.type === notification.type);
          const isEnabled = userNotification ? userNotification.enabled : true; // Default to enabled
          
          return (
            <div key={notification.type} className="flex items-center justify-between">
              <div>
                <Label className="text-base">{notification.name}</Label>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleNotificationToggle(notification.type as any, checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}