import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFulfillments, useShippingProviders, useShippingMethods } from '@/hooks/useShipping';
import { useOrders } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { FulfillmentStatusBadge } from './FulfillmentStatusBadge';
import { EditFulfillmentModal } from './EditFulfillmentModal';
import { Edit, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Fulfillment } from '@/types';

interface ShipmentsTableProps {
  retailerId?: string;
  locationId?: string;
}

export function ShipmentsTable({ retailerId, locationId }: ShipmentsTableProps) {
  const [editingFulfillment, setEditingFulfillment] = useState<Fulfillment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: fulfillments, isLoading, refetch } = useFulfillments({ retailer_id: retailerId, location_id: locationId });
  const { data: providersData } = useShippingProviders();
  const { data: methodsData } = useShippingMethods();
  const { data: ordersData } = useOrders();
  const { data: customersData } = useCustomers();

  const providers = providersData?.data || [];
  const methods = methodsData?.data || [];
  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  // Debug logging
  React.useEffect(() => {
    console.log('ShipmentsTable - Fulfillments count:', fulfillments?.data?.length || 0);
    console.log('ShipmentsTable - Fulfillments data:', fulfillments?.data);
  }, [fulfillments]);

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || providerId;
  };

  const getMethodName = (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    return method?.name || methodId;
  };

  const getOrderInfo = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    return order;
  };

  const getCustomerInfo = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer;
  };

  const handleEdit = (fulfillment: Fulfillment) => {
    setEditingFulfillment(fulfillment);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
  };
  
  if (isLoading) {
    return <div>Loading shipments...</div>;
  }
  
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {fulfillments?.data?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shipments found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order / Customer</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillments?.data?.map((fulfillment) => {
                const order = fulfillment.order_id ? getOrderInfo(fulfillment.order_id) : null;
                const customer = order?.customer_id ? getCustomerInfo(order.customer_id) : null;

                return (
                  <TableRow key={fulfillment.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order ? (
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {order.order_number || `Order ${order.id.slice(0, 8)}`}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">No order linked</span>
                        )}
                        {customer && (
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
                          >
                            {customer.name}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fulfillment.tracking_number ? (
                        <span className="font-mono text-sm">{fulfillment.tracking_number}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {fulfillment.provider_id ? getProviderName(fulfillment.provider_id) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {fulfillment.method_id ? getMethodName(fulfillment.method_id) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <FulfillmentStatusBadge status={fulfillment.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(fulfillment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fulfillment)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Modal */}
      <EditFulfillmentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        fulfillment={editingFulfillment}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
}