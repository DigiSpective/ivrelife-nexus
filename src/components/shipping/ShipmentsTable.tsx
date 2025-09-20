import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFulfillments } from '@/hooks/useShipping';
import { FulfillmentStatusBadge } from './FulfillmentStatusBadge';

interface ShipmentsTableProps {
  retailerId?: string;
  locationId?: string;
}

export function ShipmentsTable({ retailerId, locationId }: ShipmentsTableProps) {
  const { data: fulfillments, isLoading } = useFulfillments({ retailer_id: retailerId, location_id: locationId });
  
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
                <TableHead>Order ID</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillments?.data?.map((fulfillment) => (
                <TableRow key={fulfillment.id}>
                  <TableCell className="font-medium">
                    {fulfillment.order_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {fulfillment.tracking_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {fulfillment.provider_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {fulfillment.method_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <FulfillmentStatusBadge status={fulfillment.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(fulfillment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}