import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SystemSetting } from '@/types';
import { SystemSettingForm } from '@/components/settings/SystemSettingForm';

interface SystemSettingsFormProps {
  settings: SystemSetting[];
}

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  
  // Define system settings keys
  const systemSettingKeys = [
    { key: 'company_name', name: 'Company Name', description: 'The name of your company' },
    { key: 'contact_email', name: 'Contact Email', description: 'Email for customer support inquiries' },
    { key: 'timezone', name: 'Timezone', description: 'Default timezone for the application' },
    { key: 'maintenance_mode', name: 'Maintenance Mode', description: 'Enable or disable maintenance mode' },
  ];
  
  // Get current values for settings
  const getCurrentValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting ? JSON.stringify(setting.value, null, 2) : '';
  };
  
  const handleEditSetting = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setShowForm(true);
  };
  
  const handleAddSetting = () => {
    setEditingSetting(null);
    setShowForm(true);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSetting(null);
  };
  
  if (showForm) {
    return (
      <SystemSettingForm 
        setting={editingSetting || undefined} 
        onSuccess={handleFormSuccess} 
      />
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure system-wide settings for the application.
            </CardDescription>
          </div>
          <Button onClick={handleAddSetting}>Add Setting</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {systemSettingKeys.map((setting) => {
          const currentSetting = settings.find(s => s.key === setting.key);
          
          return (
            <div key={setting.key} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{setting.name}</h3>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                  {currentSetting && (
                    <pre className="mt-2 text-sm bg-muted p-2 rounded overflow-x-auto">
                      {getCurrentValue(setting.key)}
                    </pre>
                  )}
                </div>
                {currentSetting && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditSetting(currentSetting)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}