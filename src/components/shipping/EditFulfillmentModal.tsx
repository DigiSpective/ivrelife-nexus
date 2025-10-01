import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateFulfillment, useShippingProviders, useShippingMethods } from '@/hooks/useShipping';
import { useOrders } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import type { Fulfillment } from '@/types';

interface EditFulfillmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fulfillment: Fulfillment | null;
  onSuccess?: () => void;
}

export function EditFulfillmentModal({ open, onOpenChange, fulfillment, onSuccess }: EditFulfillmentModalProps) {
  const [formData, setFormData] = useState({
    orderId: '',
    providerId: '',
    methodId: '',
    trackingNumber: '',
    status: 'label_created' as 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled',
    notes: '',
  });

  const { toast } = useToast();
  const { mutate: updateFulfillment, isPending: isUpdating } = useUpdateFulfillment();
  const { data: providersData } = useShippingProviders();
  const { data: methodsData } = useShippingMethods();
  const { data: ordersData } = useOrders();
  const { data: customersData } = useCustomers();

  const providers = providersData?.data || [];
  const methods = methodsData?.data || [];
  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  const availableMethods = methods.filter(m => m.provider_id === formData.providerId);

  // Get selected order and customer info
  const selectedOrder = orders.find(o => o.id === formData.orderId);
  const selectedCustomer = selectedOrder ? customers.find(c => c.id === selectedOrder.customer_id) : null;

  // Populate form when fulfillment changes
  useEffect(() => {
    if (fulfillment && open) {
      setFormData({
        orderId: fulfillment.order_id || '',
        providerId: fulfillment.provider_id || '',
        methodId: fulfillment.method_id || '',
        trackingNumber: fulfillment.tracking_number || '',
        status: fulfillment.status || 'label_created',
        notes: (fulfillment.metadata as any)?.notes || '',
      });
    }
  }, [fulfillment, open]);

  const handleChange = (field: string, value: string) => {
    if (field === 'providerId') {
      // Reset method when provider changes
      setFormData(prev => ({ ...prev, [field]: value, methodId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!fulfillment?.id) return;

    if (!formData.orderId) {
      toast({
        title: 'Validation Error',
        description: 'Please select an order for this shipment.',
        variant: 'destructive',
      });
      return;
    }

    const updatedData = {
      order_id: formData.orderId,
      provider_id: formData.providerId,
      method_id: formData.methodId,
      tracking_number: formData.trackingNumber || null,
      status: formData.status,
      metadata: {
        ...(fulfillment.metadata as any || {}),
        notes: formData.notes,
        customer_id: selectedOrder?.customer_id,
        customer_name: selectedCustomer?.name,
        order_total: selectedOrder?.total_amount,
      }
    };

    console.log('Updating fulfillment:', updatedData);

    updateFulfillment(
      { id: fulfillment.id, fulfillment: updatedData },
      {
        onSuccess: (data) => {
          console.log('Fulfillment updated successfully:', data);
          toast({
            title: 'Fulfillment Updated',
            description: 'Shipping fulfillment has been successfully updated.',
          });

          onOpenChange(false);

          setTimeout(() => {
            onSuccess?.();
          }, 100);
        },
        onError: (error) => {
          console.error('Error updating fulfillment:', error);
          toast({
            title: 'Error',
            description: 'Failed to update shipping fulfillment. Please try again.',
            variant: 'destructive',
          });
        }
      }
    );
  };

  if (!fulfillment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fulfillment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Order Selection */}
          <div>
            <Label htmlFor="order">Order *</Label>
            <Select
              value={formData.orderId}
              onValueChange={(value) => handleChange('orderId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => {
                  const customer = customers.find(c => c.id === order.customer_id);
                  return (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.order_number || `Order ${order.id.slice(0, 8)}`}</span>
                        {customer && <span className="text-muted-foreground">- {customer.name}</span>}
                        <span className="text-muted-foreground">- ${order.total_amount?.toLocaleString() || 0}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Show selected order/customer info */}
          {selectedOrder && selectedCustomer && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{selectedCustomer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Order Total:</span>
                <span className="text-sm font-semibold">${selectedOrder.total_amount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline">{selectedOrder.status}</Badge>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="provider">Shipping Provider *</Label>
            <Select value={formData.providerId} onValueChange={(value) => handleChange('providerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="method">Shipping Method *</Label>
            <Select
              value={formData.methodId}
              onValueChange={(value) => handleChange('methodId', value)}
              disabled={!formData.providerId || availableMethods.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.providerId ? "Select provider first" : "Select method"} />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name} - ${method.base_cost || 0}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber}
              onChange={(e) => handleChange('trackingNumber', e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="label_created">Label Created</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !formData.providerId || !formData.methodId || !formData.orderId}
          >
            {isUpdating ? 'Updating...' : 'Update Fulfillment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
