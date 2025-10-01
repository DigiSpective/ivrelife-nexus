import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Truck,
  Package,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFulfillments } from '@/hooks/useShipping';
import { FulfillmentStatusBadge } from '@/components/shipping/FulfillmentStatusBadge';
import { QuoteRequestForm } from '@/components/shipping/QuoteRequestForm';
import { QuotesList } from '@/components/shipping/QuotesList';
import { FulfillmentModal } from '@/components/shipping/FulfillmentModal';
import { ProvidersTable } from '@/components/shipping/ProvidersTable';
import { ShipmentsTable } from '@/components/shipping/ShipmentsTable';

export default function Shipping() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
  const { data: fulfillments, refetch: refetchFulfillments } = useFulfillments();
  
  // Mock data for KPIs
  const kpis = {
    activeShipments: fulfillments?.data?.filter(f => f.status !== 'delivered' && f.status !== 'returned' && f.status !== 'cancelled').length || 0,
    delayedShipments: fulfillments?.data?.filter(f => f.status === 'exception').length || 0,
    pendingFulfillments: fulfillments?.data?.filter(f => f.status === 'label_created').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shipping</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage shipments
          </p>
        </div>
        <Button 
          className="shadow-elegant"
          onClick={() => setIsFulfillmentModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Shipment
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'quotes' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('quotes')}
        >
          Quotes
        </Button>
        <Button
          variant={activeTab === 'shipments' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('shipments')}
        >
          Shipments
        </Button>
        <Button
          variant={activeTab === 'providers' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('providers')}
        >
          Providers
        </Button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                    <h3 className="text-2xl font-bold">{kpis.activeShipments}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delayed Shipments</p>
                    <h3 className="text-2xl font-bold">{kpis.delayedShipments}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Fulfillments</p>
                    <h3 className="text-2xl font-bold">{kpis.pendingFulfillments}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quote Request Form */}
          <QuoteRequestForm />
          
          {/* Recent Shipments */}
          <ShipmentsTable />
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <QuoteRequestForm />
          <QuotesList />
        </div>
      )}

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <ShipmentsTable />
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <ProvidersTable />
        </div>
      )}

      {/* Fulfillment Modal */}
      <FulfillmentModal
        open={isFulfillmentModalOpen}
        onOpenChange={setIsFulfillmentModalOpen}
        onSuccess={() => {
          // Refresh fulfillments data
          refetchFulfillments();
        }}
      />
    </div>
  );
}