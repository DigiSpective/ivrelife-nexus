import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, ShoppingCart, Eye, ExternalLink } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';

interface OrderCustomerLinkProps {
  orderId?: string;
  customerId?: string;
  showFullDetails?: boolean;
  variant?: 'compact' | 'full' | 'inline';
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export function OrderCustomerLink({
  orderId,
  customerId,
  showFullDetails = false,
  variant = 'compact'
}: OrderCustomerLinkProps) {
  // Use real data from hooks
  const { data: ordersData } = useOrders();
  const { data: customersData } = useCustomers();

  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  // Get order and customer information
  const order = orderId ? orders.find(o => o.id === orderId) : null;
  const customer = customerId
    ? customers.find(c => c.id === customerId)
    : order
    ? customers.find(c => c.id === order.customer_id)
    : null;

  if (!order && !customer) {
    return (
      <div className="text-sm text-muted-foreground">
        {variant === 'inline' ? '—' : 'No order or customer'}
      </div>
    );
  }

  const orderInfo: OrderInfo | null = order ? {
    id: order.id,
    orderNumber: order.order_number || `Order ${order.id.slice(0, 8)}`,
    status: order.status,
    totalAmount: order.total_amount || 0,
    orderDate: order.created_at,
    customer: {
      id: customer?.id || 'unknown',
      name: customer?.name || 'Unknown Customer',
      email: customer?.email || 'No email',
      phone: customer?.phone
    }
  } : null;

  const customerInfo = customer ? {
    id: customer.id,
    name: customer.name,
    email: customer.email || 'No email',
    phone: customer.phone
  } : null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm">
        {orderInfo && (
          <Link to={`/orders/${orderInfo.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
            <ShoppingCart className="w-3 h-3" />
            <span>{orderInfo.orderNumber}</span>
          </Link>
        )}
        {orderInfo && customerInfo && <span className="text-muted-foreground">•</span>}
        {customerInfo && (
          <Link to={`/customers/${customerInfo.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
            <User className="w-3 h-3" />
            <span>{customerInfo.name}</span>
          </Link>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {orderInfo && (
          <div className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm">{orderInfo.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(orderInfo.orderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{orderInfo.status}</Badge>
              <Link to={`/orders/${orderInfo.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
        {customerInfo && (
          <div className="flex items-center justify-between p-2 border rounded-md bg-green-50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-sm">{customerInfo.name}</p>
                <p className="text-xs text-muted-foreground">{customerInfo.email}</p>
              </div>
            </div>
            <Link to={`/customers/${customerInfo.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="space-y-4">
        {orderInfo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Order Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Number</p>
                      <p className="font-medium">{orderInfo.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="outline">{orderInfo.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-medium">${orderInfo.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">{new Date(orderInfo.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/orders/${orderInfo.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Order
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {customerInfo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Customer Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{customerInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customerInfo.email}</p>
                    </div>
                    {customerInfo.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{customerInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/customers/${customerInfo.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Customer
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}