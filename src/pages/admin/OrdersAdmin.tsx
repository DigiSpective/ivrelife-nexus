import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Package,
  Truck,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { mockOrders, mockCustomers } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface OrderExtended {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_method: string;
  shipping_cost: number;
  tracking_number?: string;
  order_date: string;
  shipped_date?: string;
  delivered_date?: string;
  items_count: number;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'website' | 'phone' | 'admin' | 'mobile_app';
  discount_amount?: number;
  tax_amount: number;
  shipping_address: string;
  billing_address: string;
  created_by: string;
  last_updated: string;
}

const extendedOrders: OrderExtended[] = mockOrders.map((order, index) => {
  const customer = mockCustomers.find(c => c.id === order.customer_id);
  const orderNumber = `ORD-${String(index + 1).padStart(4, '0')}`;
  return {
    ...order,
    order_number: orderNumber,
    customer_name: customer?.name || 'Unknown Customer',
    customer_email: customer?.email || 'no-email@example.com',
    customer_phone: customer?.phone || '(555) 000-0000',
    items_count: Math.floor(Math.random() * 5) + 1,
    priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
    source: ['website', 'phone', 'admin', 'mobile_app'][Math.floor(Math.random() * 4)] as any,
    discount_amount: Math.random() > 0.7 ? Math.floor(Math.random() * 100) : undefined,
    tax_amount: order.total_amount * 0.08,
    shipping_address: typeof customer?.default_address === 'object' && customer.default_address ? 
      `${customer.default_address.street}, ${customer.default_address.city}, ${customer.default_address.state} ${customer.default_address.zip}` :
      '123 Main St, City, State 12345',
    billing_address: typeof customer?.default_address === 'object' && customer.default_address ? 
      `${customer.default_address.street}, ${customer.default_address.city}, ${customer.default_address.state} ${customer.default_address.zip}` :
      '123 Main St, City, State 12345',
    created_by: 'System',
    last_updated: new Date().toISOString(),
    shipping_cost: Math.floor(Math.random() * 30) + 10
  };
});

export default function OrdersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingOrder, setEditingOrder] = useState<OrderExtended | null>(null);
  const { toast } = useToast();

  const filteredOrders = extendedOrders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to update",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Orders updated",
      description: `${selectedOrders.length} orders updated to ${newStatus}`,
    });
    setSelectedOrders([]);
  };

  const handleOrderUpdate = (orderId: string, updates: Partial<OrderExtended>) => {
    toast({
      title: "Order updated",
      description: `Order ${orderId} has been updated successfully`,
    });
    setEditingOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    
    return (
      <Badge variant="outline" className={priorityColors[priority as keyof typeof priorityColors]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const orderStats = {
    totalOrders: extendedOrders.length,
    pendingOrders: extendedOrders.filter(o => o.status === 'pending').length,
    processingOrders: extendedOrders.filter(o => o.status === 'processing').length,
    shippedOrders: extendedOrders.filter(o => o.status === 'shipped').length,
    totalRevenue: extendedOrders.reduce((sum, order) => sum + order.total_amount, 0),
    urgentOrders: extendedOrders.filter(o => o.priority === 'urgent').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            Complete order administration and fulfillment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Orders
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Orders
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pendingOrders}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processingOrders}</p>
              </div>
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">{orderStats.shippedOrders}</p>
              </div>
              <Truck className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{orderStats.urgentOrders}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold text-green-600">${orderStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search orders, customers, or order numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedOrders.length} orders selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('processing')}>
                  Mark Processing
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('shipped')}>
                  Mark Shipped
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('delivered')}>
                  Mark Delivered
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkStatusUpdate('cancelled')}>
                  Cancel Orders
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.source}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${order.total_amount.toLocaleString()}</p>
                        {order.discount_amount && (
                          <p className="text-xs text-green-600">-${order.discount_amount}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.items_count} items</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{new Date(order.order_date).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingOrder(order)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Order {order.order_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Status</Label>
                                  <Select defaultValue={order.status}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                      <SelectItem value="refunded">Refunded</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Priority</Label>
                                  <Select defaultValue={order.priority}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="normal">Normal</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label>Tracking Number</Label>
                                <Input defaultValue={order.tracking_number || ''} placeholder="Enter tracking number" />
                              </div>
                              <div>
                                <Label>Internal Notes</Label>
                                <Textarea defaultValue={order.notes || ''} placeholder="Add internal notes about this order..." rows={3} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Shipping Method</Label>
                                  <Input defaultValue={order.shipping_method} />
                                </div>
                                <div>
                                  <Label>Shipping Cost</Label>
                                  <Input type="number" defaultValue={order.shipping_cost} step="0.01" />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setEditingOrder(null)}>Cancel</Button>
                              <Button onClick={() => handleOrderUpdate(order.id, {})}>Save Changes</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}