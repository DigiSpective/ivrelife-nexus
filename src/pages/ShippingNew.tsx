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
import { 
  Shipment, 
  ShippingDashboardData, 
  ShippingFilters 
} from '@/types/shipping';
import { shipmentManager } from '@/lib/shipment-manager';
import { useFulfillments } from '@/hooks/useShipping';
import { ShippingOptionsDisplay } from '@/components/shipping/ShippingOptionsDisplay';
import { GiftShippingInfo } from '@/components/shipping/GiftShippingInfo';
import { TrackingTab } from '@/components/shipping/TrackingTab';
import { RateCalculatorTab } from '@/components/shipping/RateCalculatorTab';
import { CreateShipmentDialog } from '@/components/shipping/CreateShipmentDialog';
import { ShipmentManagementDialog } from '@/components/shipping/ShipmentManagementDialog';
import { OrderCustomerLink } from '@/components/shared/OrderCustomerLink';

export default function ShippingNew() {
  console.log('[ShippingNew] Component rendering...');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<ShippingFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isCreateShipmentDialogOpen, setIsCreateShipmentDialogOpen] = useState(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);

  // Use real data from hooks
  const { data: fulfillmentsData, isLoading: loading, refetch: refetchFulfillments } = useFulfillments();
  // Ensure fulfillments is always an array
  const fulfillments = Array.isArray(fulfillmentsData?.data) ? fulfillmentsData.data : 
                      Array.isArray(fulfillmentsData) ? fulfillmentsData : [];

  console.log('Fulfillments data:', { fulfillmentsData, fulfillments });

  // Convert fulfillments to shipments format for compatibility
  const convertFulfillmentToShipment = (fulfillment: any): Shipment => {
    const metadata = fulfillment.metadata || {};
    return {
      id: fulfillment.id,
      order_id: fulfillment.order_id || 'N/A',
      shipping_profile_id: fulfillment.method_id,
      tracking_number: fulfillment.tracking_number || null,
      carrier: 'UPS', // Default - would come from provider/method lookup
      service_level: 'Ground', // Default - would come from method lookup
      status: fulfillment.status.toUpperCase(),
      ship_date: fulfillment.created_at,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      origin_address: metadata.origin_address || {
        name: 'IV RELIFE Warehouse',
        company: 'IV RELIFE',
        street1: '123 Warehouse Drive',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75201',
        country: 'US'
      },
      destination_address: metadata.destination_address || {
        name: 'Customer',
        street1: '123 Customer St',
        city: 'Unknown',
        state: 'Unknown',
        postal_code: '00000',
        country: 'US'
      },
      package_boxes: metadata.packages || [],
      is_gift_shipment: metadata.is_gift_shipment || false,
      metadata: metadata,
      cost_usd: 0, // Would be calculated or stored
      created_at: fulfillment.created_at,
      updated_at: fulfillment.updated_at
    };
  };

  const shipments = fulfillments.map(convertFulfillmentToShipment);

  useEffect(() => {
    // Refresh fulfillments when filters change
    refetchFulfillments();
  }, [filters, refetchFulfillments]);

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

  const filteredShipments = shipments.filter(shipment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        shipment.tracking_number?.toLowerCase().includes(query) ||
        shipment.order_id.toLowerCase().includes(query) ||
        shipment.carrier.toLowerCase().includes(query) ||
        shipment.destination_address.name.toLowerCase().includes(query)
      );
    }
    
    if (filters.status?.length) {
      return filters.status.includes(shipment.status);
    }
    
    if (filters.carrier?.length) {
      return filters.carrier.includes(shipment.carrier);
    }
    
    return true;
  });

  const dashboardStats = {
    total_shipments: shipments.length,
    active_shipments: shipments.filter(s => ['PENDING', 'SHIPPED'].includes(s.status)).length,
    delivered_shipments: shipments.filter(s => s.status === 'DELIVERED').length,
    exception_shipments: shipments.filter(s => s.status === 'EXCEPTION').length,
    gift_shipments: shipments.filter(s => s.is_gift_shipment).length,
    total_shipping_cost: shipments.reduce((total, s) => total + s.cost_usd, 0)
  };

  const handleViewTracking = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsTrackingDialogOpen(true);
  };

  const handleCreateShipment = () => {
    setIsCreateShipmentDialogOpen(true);
  };

  const handleManageShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsManagementDialogOpen(true);
  };

  const handleShipmentUpdate = () => {
    refetchFulfillments();
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
          <Button onClick={handleCreateShipment}>
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
                    <TableHead>Order & Customer</TableHead>
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
                        <OrderCustomerLink orderId={shipment.order_id} variant="inline" />
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
                        {shipment.cost_usd === 0 ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          formatPrice(shipment.cost_usd)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTracking(shipment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageShipment(shipment)}
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shipments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status?.[0] || 'all'}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      status: value === 'all' ? undefined : [value]
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="EXCEPTION">Exception</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Carrier</label>
                  <Select
                    value={filters.carrier?.[0] || 'all'}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      carrier: value === 'all' ? undefined : [value]
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
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
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Shipments ({filteredShipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Order & Customer</TableHead>
                    <TableHead>Carrier & Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ship Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">
                        {shipment.tracking_number}
                      </TableCell>
                      <TableCell>
                        <OrderCustomerLink orderId={shipment.order_id} variant="inline" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shipment.carrier}</div>
                          <div className="text-sm text-muted-foreground">{shipment.service_level}</div>
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
                        {shipment.is_gift_shipment ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            Gift
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.cost_usd === 0 ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          formatPrice(shipment.cost_usd)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTracking(shipment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageShipment(shipment)}
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
          <TrackingTab />
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <RateCalculatorTab />
        </TabsContent>
      </Tabs>

      {/* Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shipment Tracking Details</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                  <p className="font-mono">{selectedShipment.tracking_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedShipment.status)}
                    <Badge className={getStatusColor(selectedShipment.status)}>
                      {selectedShipment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Carrier</label>
                  <p>{selectedShipment.carrier} - {selectedShipment.service_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Delivery</label>
                  <p>
                    {selectedShipment.estimated_delivery_date 
                      ? new Date(selectedShipment.estimated_delivery_date).toLocaleDateString()
                      : 'Not available'
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Destination</label>
                <div className="mt-1">
                  <p>{selectedShipment.destination_address.name}</p>
                  <p>{selectedShipment.destination_address.street1}</p>
                  <p>
                    {selectedShipment.destination_address.city}, {selectedShipment.destination_address.state} {selectedShipment.destination_address.postal_code}
                  </p>
                </div>
              </div>

              {selectedShipment.is_gift_shipment && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Gift Shipment</h4>
                  <p className="text-sm text-purple-700">
                    This is a complimentary gift shipment with special packaging and gift receipt.
                  </p>
                </div>
              )}

              {selectedShipment.metadata?.white_glove_notes && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">White Glove Service</h4>
                  <p className="text-sm text-blue-700">
                    {selectedShipment.metadata.white_glove_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      <CreateShipmentDialog
        open={isCreateShipmentDialogOpen}
        onOpenChange={setIsCreateShipmentDialogOpen}
      />

      {/* Shipment Management Dialog */}
      <ShipmentManagementDialog
        open={isManagementDialogOpen}
        onOpenChange={setIsManagementDialogOpen}
        shipment={selectedShipment}
        onUpdate={handleShipmentUpdate}
      />
    </div>
  );
}