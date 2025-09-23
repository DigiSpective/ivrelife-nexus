import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useShippingProviders, useShippingMethods, useCreateFulfillment } from '@/hooks/useShipping';
import { 
  Loader2, 
  Save, 
  X, 
  Package, 
  MapPin, 
  User, 
  Plus, 
  Minus,
  Truck,
  AlertCircle
} from 'lucide-react';

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

interface PackageInfo {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  value: number;
}

interface AddressInfo {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface ShipmentFormData {
  order_id: string;
  provider_id: string;
  method_id: string;
  origin_address: AddressInfo;
  destination_address: AddressInfo;
  packages: PackageInfo[];
  is_gift_shipment: boolean;
  gift_message?: string;
  special_instructions?: string;
  signature_required: boolean;
  saturday_delivery: boolean;
}

const initialAddressData: AddressInfo = {
  name: '',
  company: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  phone: ''
};

const initialPackageData: PackageInfo = {
  id: '1',
  name: '',
  length: 12,
  width: 12,
  height: 8,
  weight: 5,
  value: 100
};

const initialFormData: ShipmentFormData = {
  order_id: '',
  provider_id: '',
  method_id: '',
  origin_address: {
    name: 'IV RELIFE Warehouse',
    company: 'IV RELIFE',
    street1: '123 Warehouse Drive',
    city: 'Dallas',
    state: 'TX',
    postal_code: '75201',
    country: 'US',
    phone: '(214) 555-0100'
  },
  destination_address: initialAddressData,
  packages: [initialPackageData],
  is_gift_shipment: false,
  gift_message: '',
  special_instructions: '',
  signature_required: false,
  saturday_delivery: false
};

export function CreateShipmentDialog({ open, onOpenChange, orderId }: CreateShipmentDialogProps) {
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const { data: providersData } = useShippingProviders();
  const { data: methodsData } = useShippingMethods();
  const createFulfillmentMutation = useCreateFulfillment();

  const providers = providersData?.data || [];
  const methods = methodsData?.data || [];
  const availableMethods = methods.filter(method => method.provider_id === formData.provider_id);

  useEffect(() => {
    if (open && orderId) {
      setFormData(prev => ({ ...prev, order_id: orderId }));
    }
  }, [open, orderId]);

  const addPackage = () => {
    const newId = (formData.packages.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { ...initialPackageData, id: newId }]
    }));
  };

  const removePackage = (id: string) => {
    if (formData.packages.length > 1) {
      setFormData(prev => ({
        ...prev,
        packages: prev.packages.filter(pkg => pkg.id !== id)
      }));
    }
  };

  const updatePackage = (id: string, field: keyof PackageInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const updateAddress = (type: 'origin' | 'destination', field: keyof AddressInfo, value: string) => {
    const addressField = type === 'origin' ? 'origin_address' : 'destination_address';
    setFormData(prev => ({
      ...prev,
      [addressField]: {
        ...prev[addressField],
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.order_id.trim()) {
          toast({
            title: "Validation Error",
            description: "Order ID is required",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 2:
        const dest = formData.destination_address;
        if (!dest.name.trim() || !dest.street1.trim() || !dest.city.trim() || 
            !dest.state.trim() || !dest.postal_code.trim()) {
          toast({
            title: "Validation Error",
            description: "All destination address fields are required",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 3:
        if (formData.packages.some(pkg => !pkg.name.trim() || pkg.weight <= 0)) {
          toast({
            title: "Validation Error",
            description: "All packages must have a name and valid weight",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 4:
        if (!formData.provider_id || !formData.method_id) {
          toast({
            title: "Validation Error",
            description: "Please select a shipping provider and method",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      const fulfillmentData = {
        order_id: formData.order_id,
        provider_id: formData.provider_id,
        method_id: formData.method_id,
        tracking_number: null, // Will be generated by the carrier
        status: 'label_created',
        metadata: {
          origin_address: formData.origin_address,
          destination_address: formData.destination_address,
          packages: formData.packages,
          is_gift_shipment: formData.is_gift_shipment,
          gift_message: formData.gift_message,
          special_instructions: formData.special_instructions,
          signature_required: formData.signature_required,
          saturday_delivery: formData.saturday_delivery
        }
      };

      await createFulfillmentMutation.mutateAsync(fulfillmentData);
      
      toast({
        title: "Success",
        description: "Shipment created successfully"
      });
      
      onOpenChange(false);
      setCurrentStep(1);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Information</h3>
            <div className="space-y-2">
              <Label htmlFor="order-id">Order ID *</Label>
              <Input
                id="order-id"
                value={formData.order_id}
                onChange={(e) => setFormData(prev => ({ ...prev, order_id: e.target.value }))}
                placeholder="Enter order ID"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Addresses</h3>
            
            {/* Origin Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  From (Origin)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={formData.origin_address.name}
                      onChange={(e) => updateAddress('origin', 'name', e.target.value)}
                      placeholder="Sender name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Company</Label>
                    <Input
                      value={formData.origin_address.company}
                      onChange={(e) => updateAddress('origin', 'company', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Street Address</Label>
                  <Input
                    value={formData.origin_address.street1}
                    onChange={(e) => updateAddress('origin', 'street1', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">City</Label>
                    <Input
                      value={formData.origin_address.city}
                      onChange={(e) => updateAddress('origin', 'city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">State</Label>
                    <Input
                      value={formData.origin_address.state}
                      onChange={(e) => updateAddress('origin', 'state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">ZIP</Label>
                    <Input
                      value={formData.origin_address.postal_code}
                      onChange={(e) => updateAddress('origin', 'postal_code', e.target.value)}
                      placeholder="ZIP code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destination Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  To (Destination) *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Name *</Label>
                    <Input
                      value={formData.destination_address.name}
                      onChange={(e) => updateAddress('destination', 'name', e.target.value)}
                      placeholder="Recipient name"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Company</Label>
                    <Input
                      value={formData.destination_address.company}
                      onChange={(e) => updateAddress('destination', 'company', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Street Address *</Label>
                  <Input
                    value={formData.destination_address.street1}
                    onChange={(e) => updateAddress('destination', 'street1', e.target.value)}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">City *</Label>
                    <Input
                      value={formData.destination_address.city}
                      onChange={(e) => updateAddress('destination', 'city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">State *</Label>
                    <Input
                      value={formData.destination_address.state}
                      onChange={(e) => updateAddress('destination', 'state', e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">ZIP *</Label>
                    <Input
                      value={formData.destination_address.postal_code}
                      onChange={(e) => updateAddress('destination', 'postal_code', e.target.value)}
                      placeholder="ZIP code"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Phone</Label>
                  <Input
                    value={formData.destination_address.phone}
                    onChange={(e) => updateAddress('destination', 'phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Package Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addPackage}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Package
              </Button>
            </div>

            {formData.packages.map((pkg, index) => (
              <Card key={pkg.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Package {index + 1}
                    </CardTitle>
                    {formData.packages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(pkg.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Package Name *</Label>
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                      placeholder="Package description"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Length (in)</Label>
                      <Input
                        type="number"
                        value={pkg.length}
                        onChange={(e) => updatePackage(pkg.id, 'length', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Width (in)</Label>
                      <Input
                        type="number"
                        value={pkg.width}
                        onChange={(e) => updatePackage(pkg.id, 'width', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Height (in)</Label>
                      <Input
                        type="number"
                        value={pkg.height}
                        onChange={(e) => updatePackage(pkg.id, 'height', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Weight (lbs) *</Label>
                      <Input
                        type="number"
                        value={pkg.weight}
                        onChange={(e) => updatePackage(pkg.id, 'weight', parseFloat(e.target.value) || 0)}
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Value ($)</Label>
                      <Input
                        type="number"
                        value={pkg.value}
                        onChange={(e) => updatePackage(pkg.id, 'value', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Options</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shipping Provider *</Label>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    provider_id: value,
                    method_id: '' // Reset method when provider changes
                  }))}
                >
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
                <Label>Shipping Method *</Label>
                <Select
                  value={formData.method_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, method_id: value }))}
                  disabled={!formData.provider_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gift-shipment"
                  checked={formData.is_gift_shipment}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    is_gift_shipment: !!checked 
                  }))}
                />
                <Label htmlFor="gift-shipment">This is a gift shipment</Label>
              </div>

              {formData.is_gift_shipment && (
                <div>
                  <Label className="text-sm">Gift Message</Label>
                  <Textarea
                    value={formData.gift_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, gift_message: e.target.value }))}
                    placeholder="Enter gift message"
                    rows={2}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="signature-required"
                  checked={formData.signature_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    signature_required: !!checked 
                  }))}
                />
                <Label htmlFor="signature-required">Signature required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saturday-delivery"
                  checked={formData.saturday_delivery}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    saturday_delivery: !!checked 
                  }))}
                />
                <Label htmlFor="saturday-delivery">Saturday delivery</Label>
              </div>

              <div>
                <Label className="text-sm">Special Instructions</Label>
                <Textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                  placeholder="Enter any special delivery instructions"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Create New Shipment
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
              <div className="ml-2 text-sm">
                {step === 1 && 'Order'}
                {step === 2 && 'Addresses'}
                {step === 3 && 'Packages'}
                {step === 4 && 'Options'}
              </div>
              {step < 4 && <div className="w-8 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Shipment
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}