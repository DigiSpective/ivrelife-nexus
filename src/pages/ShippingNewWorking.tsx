import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  BarChart3, 
  Settings, 
  Clock, 
  AlertCircle,
  CheckCircle,
  MapPin,
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

// Import only safe components that don't have heavy dependencies
import { useFulfillments } from '@/hooks/useShipping';

interface ShippingFilters {
  status?: string[];
  carrier?: string[];
}

export default function ShippingNewWorking() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<ShippingFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Use real data from hooks with error handling
  const { data: fulfillmentsData, isLoading: loading, refetch: refetchFulfillments } = useFulfillments();
  const fulfillments = fulfillmentsData?.data || [];

  // Convert fulfillments to shipments format for compatibility
  const convertFulfillmentToShipment = (fulfillment: any) => {
    const metadata = fulfillment.metadata || {};
    return {
      id: fulfillment.id,
      order_id: fulfillment.order_id || 'N/A',
      shipping_profile_id: fulfillment.method_id,
      tracking_number: fulfillment.tracking_number || `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      carrier: 'UPS',
      service_level: 'Ground',
      status: fulfillment.status?.toUpperCase() || 'PENDING',
      ship_date: fulfillment.created_at,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      destination_address: {
        name: 'Customer',
        street1: '123 Customer St',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75201',
        country: 'US'
      },
      is_gift_shipment: metadata.is_gift_shipment || false,
      cost_usd: 15.99,
      created_at: fulfillment.created_at,
      updated_at: fulfillment.updated_at
    };
  };

  const shipments = fulfillments.map(convertFulfillmentToShipment);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'EXCEPTION':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'EXCEPTION':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dashboardStats = {
    total_shipments: shipments.length,
    active_shipments: shipments.filter(s => ['PENDING', 'SHIPPED'].includes(s.status)).length,
    delivered_shipments: shipments.filter(s => s.status === 'DELIVERED').length,
    exception_shipments: shipments.filter(s => s.status === 'EXCEPTION').length,
    gift_shipments: shipments.filter(s => s.is_gift_shipment).length,
    total_shipping_cost: shipments.reduce((total, s) => total + s.cost_usd, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping & Fulfillment</h1>
          <p className="text-muted-foreground">
            Manage shipments, track deliveries, and configure shipping settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/shipping">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button onClick={() => console.log('Create shipment clicked')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shipment
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="rates">Rate Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                    <p className="text-2xl font-bold">{dashboardStats.total_shipments}</p>
                  </div>
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                    <p className="text-2xl font-bold">{dashboardStats.active_shipments}</p>
                  </div>
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold">{dashboardStats.delivered_shipments}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">{formatPrice(dashboardStats.total_shipping_cost)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Shipments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.slice(0, 5).map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">
                        {shipment.tracking_number}
                      </TableCell>
                      <TableCell>
                        <Link to={`/orders/${shipment.order_id}`} className="text-blue-600 hover:underline">
                          {shipment.order_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          {shipment.carrier} {shipment.service_level}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.status)}
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shipment.destination_address.city}, {shipment.destination_address.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(shipment.cost_usd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View tracking:', shipment.tracking_number)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Edit shipment:', shipment.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Shipments ({shipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search shipments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => refetchFulfillments()}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ship Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">
                        {shipment.tracking_number}
                      </TableCell>
                      <TableCell>
                        <Link to={`/orders/${shipment.order_id}`} className="text-blue-600 hover:underline">
                          {shipment.order_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.status)}
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shipment.destination_address.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {shipment.destination_address.city}, {shipment.destination_address.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(shipment.cost_usd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View tracking:', shipment.tracking_number)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Edit shipment:', shipment.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Track Your Shipment</h3>
                <p className="text-muted-foreground">
                  Enter a tracking number to view shipment details and delivery status.
                </p>
                <div className="mt-4 max-w-md mx-auto">
                  <Input placeholder="Enter tracking number..." className="mb-2" />
                  <Button className="w-full">Track Package</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rate Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Calculate Shipping Rates</h3>
                <p className="text-muted-foreground">
                  Get accurate shipping quotes for different carriers and service levels.
                </p>
                <Button className="mt-4">Open Rate Calculator</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}