import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUpdateFulfillment } from '@/hooks/useShipping';
import { 
  Loader2, 
  Save, 
  X, 
  Package, 
  MapPin, 
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  RefreshCw
} from 'lucide-react';

interface ShipmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: any | null;
  onUpdate?: () => void;
}

const SHIPMENT_STATUSES = [
  { value: 'label_created', label: 'Label Created', icon: Package, color: 'bg-gray-100 text-gray-800' },
  { value: 'picked_up', label: 'Picked Up', icon: Truck, color: 'bg-blue-100 text-blue-800' },
  { value: 'in_transit', label: 'In Transit', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'exception', label: 'Exception', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  { value: 'returned', label: 'Returned', icon: RefreshCw, color: 'bg-yellow-100 text-yellow-800' }
];

export function ShipmentManagementDialog({ open, onOpenChange, shipment, onUpdate }: ShipmentManagementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tracking_number: '',
    status: '',
    notes: ''
  });
  const { toast } = useToast();
  const updateFulfillmentMutation = useUpdateFulfillment();

  useEffect(() => {
    if (open && shipment) {
      setFormData({
        tracking_number: shipment.tracking_number || '',
        status: shipment.status || 'label_created',
        notes: shipment.metadata?.notes || ''
      });
    }
  }, [open, shipment]);

  const handleSubmit = async () => {
    if (!shipment) return;

    setIsSubmitting(true);

    try {
      const updateData = {
        tracking_number: formData.tracking_number.trim() || null,
        status: formData.status,
        metadata: {
          ...shipment.metadata,
          notes: formData.notes.trim() || null,
          last_updated: new Date().toISOString(),
          updated_by: 'system' // Would be actual user ID
        }
      };

      await updateFulfillmentMutation.mutateAsync({
        id: shipment.id,
        fulfillment: updateData
      });
      
      toast({
        title: "Success",
        description: "Shipment updated successfully"
      });
      
      onOpenChange(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return SHIPMENT_STATUSES.find(s => s.value === status) || SHIPMENT_STATUSES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShipmentSummary = () => {
    if (!shipment) return null;
    
    const metadata = shipment.metadata || {};
    const packages = metadata.packages || [];
    const totalWeight = packages.reduce((sum: number, pkg: any) => sum + (pkg.weight || 0), 0);
    const totalValue = packages.reduce((sum: number, pkg: any) => sum + (pkg.value || 0), 0);
    
    return {
      totalWeight,
      totalValue,
      packageCount: packages.length
    };
  };

  const summary = getShipmentSummary();

  if (!shipment) return null;

  const currentStatus = getStatusInfo(formData.status);
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Manage Shipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order ID</Label>
                  <p className="text-lg font-mono">{shipment.order_id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Shipment ID</Label>
                  <p className="text-lg font-mono">{shipment.id.substring(0, 8)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-lg">{formatDate(shipment.created_at)}</p>
                </div>
              </div>

              {summary && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Packages</Label>
                      <p className="text-lg">{summary.packageCount} package{summary.packageCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total Weight</Label>
                      <p className="text-lg">{summary.totalWeight.toFixed(1)} lbs</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total Value</Label>
                      <p className="text-lg">${summary.totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <StatusIcon className="w-6 h-6" />
                <div>
                  <Badge className={currentStatus.color}>
                    {currentStatus.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {formatDate(shipment.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tracking-number">Tracking Number</Label>
                  <Input
                    id="tracking-number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tracking_number: e.target.value 
                    }))}
                    placeholder="Enter tracking number"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      status: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPMENT_STATUSES.map((status) => {
                        const Icon = status.icon;
                        return (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {status.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Add notes about this shipment update"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {shipment.metadata?.destination_address && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{shipment.metadata.destination_address.name}</p>
                  {shipment.metadata.destination_address.company && (
                    <p className="text-muted-foreground">{shipment.metadata.destination_address.company}</p>
                  )}
                  <p>{shipment.metadata.destination_address.street1}</p>
                  {shipment.metadata.destination_address.street2 && (
                    <p>{shipment.metadata.destination_address.street2}</p>
                  )}
                  <p>
                    {shipment.metadata.destination_address.city}, {shipment.metadata.destination_address.state} {shipment.metadata.destination_address.postal_code}
                  </p>
                  <p>{shipment.metadata.destination_address.country}</p>
                  {shipment.metadata.destination_address.phone && (
                    <p className="text-muted-foreground">Phone: {shipment.metadata.destination_address.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Details */}
          {shipment.metadata?.packages && shipment.metadata.packages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shipment.metadata.packages.map((pkg: any, index: number) => (
                    <div key={pkg.id || index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pkg.name || `Package ${index + 1}`}</h4>
                        <Badge variant="outline">${pkg.value?.toFixed(2) || '0.00'}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <span>L: {pkg.length || 0}"</span>
                        <span>W: {pkg.width || 0}"</span>
                        <span>H: {pkg.height || 0}"</span>
                        <span>Weight: {pkg.weight || 0} lbs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Instructions */}
          {(shipment.metadata?.is_gift_shipment || shipment.metadata?.special_instructions) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipment.metadata?.is_gift_shipment && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">Gift Shipment</h4>
                    <p className="text-sm text-purple-700">
                      This shipment includes gift packaging and receipt.
                    </p>
                    {shipment.metadata?.gift_message && (
                      <p className="text-sm text-purple-700 mt-2">
                        <strong>Gift Message:</strong> {shipment.metadata.gift_message}
                      </p>
                    )}
                  </div>
                )}
                
                {shipment.metadata?.special_instructions && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Delivery Instructions</h4>
                    <p className="text-sm text-blue-700">
                      {shipment.metadata.special_instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Update Shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}