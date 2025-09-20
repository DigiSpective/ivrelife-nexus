import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { useUpdateUserProfile, useUpdatePassword } from '@/hooks/useSettings';
import { profileSchema, passwordSchema, ProfileFormValues, PasswordFormValues } from '@/lib/schemas/settings';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  
  const { mutate: updateProfile, isPending: isProfileUpdating } = useUpdateUserProfile();
  const { mutate: updatePassword, isPending: isPasswordUpdating } = useUpdatePassword();
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
    },
  });
  
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const watchedPasswordFields = watch();
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile(
      { userId: user.id, userData: { name: data.name, email: data.email } },
      {
        onSuccess: (response) => {
          toast({
            title: 'Profile updated',
            description: 'Your profile has been successfully updated.',
          });
          
          resetProfile(data);
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'Failed to update profile. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    // In a real implementation, we would verify the current password
    // and hash the new password before storing it
    const newPasswordHash = btoa(data.newPassword); // Simple base64 encoding for demo
    
    updatePassword(
      { userId: user.id, newPasswordHash },
      {
        onSuccess: (response) => {
          toast({
            title: 'Password updated',
            description: 'Your password has been successfully updated.',
          });
          
          resetPassword();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'Failed to update password. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...registerProfile('name')}
                className={profileErrors.name ? 'border-red-500' : ''}
              />
              {profileErrors.name && (
                <p className="text-sm text-red-500">{profileErrors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...registerProfile('email')}
                className={profileErrors.email ? 'border-red-500' : ''}
              />
              {profileErrors.email && (
                <p className="text-sm text-red-500">{profileErrors.email.message}</p>
              )}
            </div>
            
            <Button type="submit" disabled={isProfileUpdating}>
              {isProfileUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Update your password here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword')}
                  className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  className={passwordErrors.newPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
                )}
                {watchedPasswordFields.newPassword && watchedPasswordFields.confirmPassword && 
                 watchedPasswordFields.newPassword !== watchedPasswordFields.confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isPasswordUpdating}>
                  {isPasswordUpdating ? 'Updating...' : 'Update Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPassword();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}