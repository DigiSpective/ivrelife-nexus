import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Send, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
// Removed heavy server-actions import to prevent module loading issues
// import { createInviteAction } from '@/lib/server-actions';
import { InviteToken } from '@/types';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location_user']),
  retailerId: z.string().optional(),
  locationId: z.string().optional()
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteManagerProps {
  onInviteCreated?: (invite: InviteToken) => void;
}

export const InviteManager: React.FC<InviteManagerProps> = ({ onInviteCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<InviteToken | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useNotification();

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset,
    setError 
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema)
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: InviteFormData) => {
    if (!user) {
      showErrorToast('Authentication Error', 'You must be logged in to create invites');
      return;
    }

    setIsLoading(true);
    
    try {
      const { success, inviteToken, error } = await createInviteAction(
        data.email,
        data.role,
        user.id,
        data.retailerId,
        data.locationId
      );

      if (success && inviteToken) {
        setCreatedInvite(inviteToken);
        onInviteCreated?.(inviteToken);
        showSuccessToast(
          'Invite Created',
          `Invitation sent to ${data.email} for ${data.role} role`
        );
        reset();
      } else {
        setError('root', { message: error || 'Failed to create invite' });
        showErrorToast('Invite Failed', error || 'Failed to create invite');
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError('root', { message: errorMessage });
      showErrorToast('Invite Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteUrl = (inviteToken: InviteToken) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/register?token=${inviteToken.id}&email=${encodeURIComponent(inviteToken.email)}`;
  };

  const copyInviteUrl = async (inviteToken: InviteToken) => {
    try {
      const inviteUrl = generateInviteUrl(inviteToken);
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToClipboard(true);
      showSuccessToast('Copied!', 'Invite URL copied to clipboard');
      
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      showErrorToast('Copy Failed', 'Failed to copy invite URL');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'backoffice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'retailer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'location_user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create User Invite
          </CardTitle>
          <CardDescription>
            Send an invitation to a new user to join the system with a specific role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  onValueChange={(value) => setValue('role', value as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location_user">Location User</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="backoffice">Back Office</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>
            </div>

            {(watchedRole === 'retailer' || watchedRole === 'location_user') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchedRole === 'retailer' && (
                  <div className="space-y-2">
                    <Label htmlFor="retailerId">Retailer ID (Optional)</Label>
                    <Input
                      id="retailerId"
                      placeholder="ret-123456"
                      {...register('retailerId')}
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                {watchedRole === 'location_user' && (
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location ID (Optional)</Label>
                    <Input
                      id="locationId"
                      placeholder="loc-123456"
                      {...register('locationId')}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Invite...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Invite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {createdInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Invite Created Successfully
            </CardTitle>
            <CardDescription>
              Share this link with the invited user to complete their registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{createdInvite.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadgeColor(createdInvite.role)}>
                    {createdInvite.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Expires: {new Date(createdInvite.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invite URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generateInviteUrl(createdInvite)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInviteUrl(createdInvite)}
                  className="shrink-0"
                >
                  {copiedToClipboard ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                The invite link has been sent via email and will expire in 7 days. 
                The user can use this link to register with the assigned role and permissions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};