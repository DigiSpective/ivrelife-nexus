import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserFeature } from '@/types';
import { useUpdateUserFeature, useCreateUserFeature } from '@/hooks/useSettings';
import { featureToggleSchema, FeatureToggleFormValues } from '@/lib/schemas/settings';

interface FeatureToggleFormProps {
  feature?: UserFeature;
  userId: string;
  onSuccess?: () => void;
}

export function FeatureToggleForm({ feature, userId, onSuccess }: FeatureToggleFormProps) {
  const { toast } = useToast();
  
  const { mutate: updateFeature, isPending: isUpdating } = useUpdateUserFeature();
  const { mutate: createFeature, isPending: isCreating } = useCreateUserFeature();
  
  const isPending = isUpdating || isCreating;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeatureToggleFormValues>({
    resolver: zodResolver(featureToggleSchema),
    defaultValues: {
      feature_key: feature?.feature_key || '',
      enabled: feature?.enabled || false,
    },
  });
  
  const onSubmit = (data: FeatureToggleFormValues) => {
    if (feature) {
      // Update existing feature
      updateFeature(
        { featureId: feature.id, enabled: data.enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Feature updated',
              description: `${data.feature_key} has been updated successfully.`,
            });
            
            reset(data);
            onSuccess?.();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to update feature. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Create new feature
      createFeature(
        { user_id: userId, feature_key: data.feature_key, enabled: data.enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Feature created',
              description: `${data.feature_key} has been created successfully.`,
            });
            
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to create feature. Please try again.',
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
        <CardTitle>{feature ? 'Edit Feature' : 'Add Feature'}</CardTitle>
        <CardDescription>
          {feature ? 'Update an existing feature toggle' : 'Create a new feature toggle'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature_key">Feature Key</Label>
            <Input
              id="feature_key"
              {...register('feature_key')}
              className={errors.feature_key ? 'border-red-500' : ''}
              disabled={!!feature}
            />
            {errors.feature_key && (
              <p className="text-sm text-red-500">{errors.feature_key.message}</p>
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
            {isPending ? 'Saving...' : (feature ? 'Update Feature' : 'Add Feature')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}