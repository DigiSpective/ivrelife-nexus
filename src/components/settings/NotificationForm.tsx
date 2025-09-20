import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserNotification } from '@/types';
import { useUpdateUserNotification, useCreateUserNotification } from '@/hooks/useSettings';
import { notificationSchema, NotificationFormValues } from '@/lib/schemas/settings';

interface NotificationFormProps {
  notification?: UserNotification;
  userId: string;
  onSuccess?: () => void;
}

export function NotificationForm({ notification, userId, onSuccess }: NotificationFormProps) {
  const { toast } = useToast();
  
  const { mutate: updateNotification, isPending: isUpdating } = useUpdateUserNotification();
  const { mutate: createNotification, isPending: isCreating } = useCreateUserNotification();
  
  const isPending = isUpdating || isCreating;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: notification?.type || 'email',
      enabled: notification?.enabled ?? true,
    },
  });
  
  const onSubmit = (data: NotificationFormValues) => {
    if (notification) {
      // Update existing notification
      updateNotification(
        { notificationId: notification.id, enabled: data.enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Notification updated',
              description: `${data.type} notification has been updated successfully.`,
            });
            
            reset(data);
            onSuccess?.();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to update notification. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Create new notification
      createNotification(
        { user_id: userId, type: data.type, enabled: data.enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Notification created',
              description: `${data.type} notification has been created successfully.`,
            });
            
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to create notification. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{notification ? 'Edit Notification' : 'Add Notification'}</CardTitle>
        <CardDescription>
          {notification ? 'Update an existing notification preference' : 'Create a new notification preference'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <select
              id="type"
              {...register('type')}
              className={`w-full p-2 border rounded ${errors.type ? 'border-red-500' : 'border-input'}`}
              disabled={!!notification}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="enabled">Enabled</Label>
            <Input
              id="enabled"
              type="checkbox"
              {...register('enabled')}
              className="w-4 h-4"
            />
            {errors.enabled && (
              <p className="text-sm text-red-500">{errors.enabled.message}</p>
            )}
          </div>
          
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : (notification ? 'Update Notification' : 'Add Notification')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}