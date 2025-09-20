import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Save,
  User,
  Shield,
  Bell,
  Palette,
  Database
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  // Mock data - will be replaced with real data from Supabase
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'IV RELIFE',
    contactEmail: 'admin@ivrelife.com',
    timezone: 'America/Los_Angeles'
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailClaims: true,
    emailRepairs: false,
    pushNotifications: true
  });

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette }
  ];

  const handleSave = () => {
    // Save settings to Supabase
    console.log('Settings saved');
  };

  return (
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
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                    </select>
                  </div>
                </div>
                
                <Button onClick={handleSave} className="shadow-elegant">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Order Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive emails when new orders are created
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailOrders}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailOrders: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Claim Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive emails when new claims are submitted
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailClaims}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailClaims: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Repair Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive emails when new repairs are requested
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailRepairs}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailRepairs: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in the app
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSave} className="shadow-elegant">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Password</h3>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage devices that are currently signed in to your account
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">San Francisco, CA • Chrome • Active now</p>
                        </div>
                        <Button variant="outline" size="sm">Current</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div>
                          <p className="font-medium">Office Computer</p>
                          <p className="text-sm text-muted-foreground">New York, NY • Firefox • 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm">Revoke</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="flex flex-col items-center gap-2 p-4 border border-border rounded-md hover:bg-muted">
                        <div className="w-8 h-8 rounded-full bg-white border"></div>
                        <span className="text-sm">Light</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border border-border rounded-md hover:bg-muted">
                        <div className="w-8 h-8 rounded-full bg-gray-900 border"></div>
                        <span className="text-sm">Dark</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border-2 border-primary rounded-md">
                        <div className="w-8 h-8 rounded-full bg-gray-900 border"></div>
                        <span className="text-sm font-medium">System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}