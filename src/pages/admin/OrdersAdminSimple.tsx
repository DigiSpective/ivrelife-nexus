import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Edit, Eye, Loader2 } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdmin';
import { useAdminCustomers } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function OrdersAdminSimple() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useAdminOrders();
  const { data: customersData, isLoading: customersLoading } = useAdminCustomers();

  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  const ordersWithCustomers = orders.map((order, index) => {
    const customer = customers.find(c => c.id === order.customer_id);
    return {
      ...order,
      orderNumber: `ORD-${String(index + 1).padStart(4, '0')}`,
      customerName: customer?.name || 'Unknown Customer',
      customerEmail: customer?.email || 'No email'
    };
  });

  const filteredOrders = ordersWithCustomers.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewOrder = () => {
    navigate('/orders/new');
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    toast({
      title: 'Edit Order',
      description: 'Order editing functionality would be implemented here.',
    });
  };

  const isLoading = ordersLoading || customersLoading;

  if (ordersError) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <p className="text-destructive">Error loading orders: {ordersError.message}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Complete order administration and fulfillment
          </p>
        </div>
        <Button onClick={handleNewOrder}>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin inline" />
            ) : (
              `(${filteredOrders.length})`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <ShoppingCart className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border-0`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <div className="text-right">
                      <p className="font-semibold">${order.total_amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}