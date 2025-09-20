import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SystemSetting } from '@/types';
import { useUpdateSystemSetting, useCreateSystemSetting } from '@/hooks/useSettings';
import { systemSettingSchema, SystemSettingFormValues } from '@/lib/schemas/settings';

interface SystemSettingFormProps {
  setting?: SystemSetting;
  onSuccess?: () => void;
}

export function SystemSettingForm({ setting, onSuccess }: SystemSettingFormProps) {
  const { toast } = useToast();
  
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSystemSetting();
  const { mutate: createSetting, isPending: isCreating } = useCreateSystemSetting();
  
  const isPending = isUpdating || isCreating;
  
  const [valueInput, setValueInput] = useState(
    setting ? JSON.stringify(setting.value, null, 2) : ''
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SystemSettingFormValues>({
    resolver: zodResolver(systemSettingSchema),
    defaultValues: {
      key: setting?.key || '',
      value: setting?.value || '',
    },
  });
  
  const onSubmit = (data: SystemSettingFormValues) => {
    try {
      // Parse the JSON value
      const parsedValue = JSON.parse(valueInput);
      
      if (setting) {
        // Update existing setting
        updateSetting(
          { key: setting.key, value: parsedValue },
          {
            onSuccess: (response) => {
              toast({
                title: 'Setting updated',
                description: `${setting.key} has been updated successfully.`,
              });
              
              reset({ key: setting.key, value: parsedValue });
              onSuccess?.();
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: 'Failed to update setting. Please try again.',
                variant: 'destructive',
              });
            },
          }
        );
      } else {
        // Create new setting
        createSetting(
          { key: data.key, value: parsedValue },
          {
            onSuccess: (response) => {
              toast({
                title: 'Setting created',
                description: `${data.key} has been created successfully.`,
              });
              
              reset();
              setValueInput('');
              onSuccess?.();
            },
            onError: (error) => {
              toast({
                title: 'Error',
                description: 'Failed to create setting. Please try again.',
                variant: 'destructive',
              });
            },
          }
        );
      }
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please enter valid JSON for the setting value.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{setting ? 'Edit Setting' : 'Add Setting'}</CardTitle>
        <CardDescription>
          {setting ? 'Update an existing system setting' : 'Create a new system setting'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Setting Key</Label>
            <Input
              id="key"
              {...register('key')}
              className={errors.key ? 'border-red-500' : ''}
              disabled={!!setting}
            />
            {errors.key && (
              <p className="text-sm text-red-500">{errors.key.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value (JSON)</Label>
            <Textarea
              id="value"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              className={`min-h-[150px] font-mono text-sm ${errors.value ? 'border-red-500' : ''}`}
              placeholder="Enter JSON value"
            />
            {errors.value && (
              <p className="text-sm text-red-500">{errors.value.message}</p>
            )}
          </div>
          
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : (setting ? 'Update Setting' : 'Add Setting')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}