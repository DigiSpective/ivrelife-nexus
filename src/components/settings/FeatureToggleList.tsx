import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserFeature } from '@/types';
import { useUpdateUserFeature, useCreateUserFeature } from '@/hooks/useSettings';
import { FeatureToggleForm } from '@/components/settings/FeatureToggleForm';

interface FeatureToggleListProps {
  features: UserFeature[];
  userId: string;
}

export function FeatureToggleList({ features, userId }: FeatureToggleListProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<UserFeature | null>(null);
  
  const { mutate: updateFeature } = useUpdateUserFeature();
  const { mutate: createFeature } = useCreateUserFeature();
  
  // Define available features
  const availableFeatures = [
    { key: 'dark_mode', name: 'Dark Mode', description: 'Enable dark theme for the application' },
    { key: 'notifications', name: 'Push Notifications', description: 'Receive push notifications for important updates' },
    { key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Access to advanced reporting and analytics' },
    { key: 'beta_features', name: 'Beta Features', description: 'Try out new features before they are released' },
  ];
  
  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    const existingFeature = features.find(f => f.feature_key === featureKey);
    
    if (existingFeature) {
      // Update existing feature
      updateFeature(
        { featureId: existingFeature.id, enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Feature updated',
              description: `${existingFeature.feature_key} has been ${enabled ? 'enabled' : 'disabled'}.`,
            });
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
        { user_id: userId, feature_key: featureKey, enabled },
        {
          onSuccess: (response) => {
            toast({
              title: 'Feature added',
              description: `${featureKey} has been ${enabled ? 'enabled' : 'disabled'}.`,
            });
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to add feature. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };
  
  const handleEditFeature = (feature: UserFeature) => {
    setEditingFeature(feature);
    setShowForm(true);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingFeature(null);
  };
  
  if (showForm) {
    return (
      <FeatureToggleForm 
        feature={editingFeature || undefined} 
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
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>
              Enable or disable specific features for your account.
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>Add Feature</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableFeatures.map((feature) => {
          const userFeature = features.find(f => f.feature_key === feature.key);
          const isEnabled = userFeature ? userFeature.enabled : false;
          
          return (
            <div key={feature.key} className="flex items-center justify-between">
              <div>
                <Label className="text-base">{feature.name}</Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}