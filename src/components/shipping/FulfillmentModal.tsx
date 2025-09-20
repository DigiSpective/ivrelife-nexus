import React, { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { useCreateFulfillment } from '@/hooks/useShipping';

interface FulfillmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  retailerId?: string;
  locationId?: string;
  onSuccess?: () => void;
}

export function FulfillmentModal({ open, onOpenChange, orderId, retailerId, locationId, onSuccess }: FulfillmentModalProps) {
  const [formData, setFormData] = useState({
    providerId: '',
    methodId: '',
    trackingNumber: '',
    status: 'label_created' as 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled',
    notes: '',
  });
  
  const { toast } = useToast();
  const { mutate: createFulfillment, isPending: isCreating } = useCreateFulfillment();
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    const fulfillmentData = {
      order_id: orderId,
      provider_id: formData.providerId,
      method_id: formData.methodId,
      tracking_number: formData.trackingNumber,
      status: formData.status,
      assigned_to: '', // This would be set to the current user in a real implementation
      retailer_id: retailerId,
      location_id: locationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    createFulfillment(fulfillmentData, {
      onSuccess: () => {
        toast({
          title: 'Fulfillment Created',
          description: 'Shipping fulfillment has been successfully created.',
        });
        onSuccess?.();
        onOpenChange(false);
        // Reset form
        setFormData({
          providerId: '',
          methodId: '',
          trackingNumber: '',
          status: 'label_created',
          notes: '',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: 'Failed to create shipping fulfillment. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Fulfillment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="provider">Shipping Provider</Label>
            <Select value={formData.providerId} onValueChange={(value) => handleChange('providerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {/* In a real implementation, this would be populated with actual providers */}
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ltl">Generic LTL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="method">Shipping Method</Label>
            <Select value={formData.methodId} onValueChange={(value) => handleChange('methodId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {/* In a real implementation, this would be populated with actual methods */}
                <SelectItem value="ground">Ground</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
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
            <Label htmlFor="status">Status</Label>
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating || !formData.providerId || !formData.methodId}
          >
            {isCreating ? 'Creating...' : 'Create Fulfillment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}