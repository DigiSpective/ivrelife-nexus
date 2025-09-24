import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard,
  Receipt,
  TrendingUp,
  Package,
  Settings
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';
import { SettingsAuthGuard } from '@/components/settings/SettingsAuthGuard';
import { PlansTab } from '@/components/subscription/PlansTab';
import { BillingTab } from '@/components/subscription/BillingTab';
import { PaymentTab } from '@/components/subscription/PaymentTab';
import { UsageTab } from '@/components/subscription/UsageTab';

export default function SubscriptionSettings() {
  const { data: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('plans');

  const tabs = [
    { id: 'plans', name: 'Plans', icon: Package, description: 'Choose your subscription plan' },
    { id: 'billing', name: 'Billing', icon: Receipt, description: 'View invoices and billing history' },
    { id: 'payment', name: 'Payment', icon: CreditCard, description: 'Manage payment methods' },
    { id: 'usage', name: 'Usage', icon: TrendingUp, description: 'Monitor your usage and analytics' },
  ];

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SettingsAuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription, billing, and payment settings
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Descriptions */}
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'plans' && <PlansTab user={currentUser} />}
          {activeTab === 'billing' && <BillingTab user={currentUser} />}
          {activeTab === 'payment' && <PaymentTab user={currentUser} />}
          {activeTab === 'usage' && <UsageTab user={currentUser} />}
        </div>
      </div>
    </SettingsAuthGuard>
  );
}