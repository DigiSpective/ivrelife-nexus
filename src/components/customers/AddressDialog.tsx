import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateCustomerAddress, useUpdateCustomerAddress } from '@/hooks/useCustomers';
import { CustomerAddress } from '@/types';
import { Loader2, Save, X } from 'lucide-react';

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  address?: CustomerAddress | null;
  mode: 'create' | 'edit';
}

interface AddressFormData {
  label: string;
  primary: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

const initialFormData: AddressFormData = {
  label: '',
  primary: false,
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  }
};

export function AddressDialog({ open, onOpenChange, customerId, address, mode }: AddressDialogProps) {
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createAddressMutation = useCreateCustomerAddress();
  const updateAddressMutation = useUpdateCustomerAddress();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && address) {
        setFormData({
          label: address.label || '',
          primary: address.primary,
          address: address.address || initialFormData.address
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, address, mode]);

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: keyof AddressFormData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.address.street.trim()) {
      toast({
        title: "Validation Error",
        description: "Street address is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.address.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.address.state.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.address.zip.trim()) {
      toast({
        title: "Validation Error",
        description: "ZIP code is required",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const addressData = {
        customer_id: customerId,
        label: formData.label.trim() || null,
        primary: formData.primary,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zip: formData.address.zip.trim(),
          country: formData.address.country.trim()
        }
      };

      if (mode === 'create') {
        await createAddressMutation.mutateAsync(addressData);
        toast({
          title: "Success",
          description: "Address added successfully"
        });
      } else if (mode === 'edit' && address) {
        await updateAddressMutation.mutateAsync({
          id: address.id,
          address: addressData
        });
        toast({
          title: "Success",
          description: "Address updated successfully"
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Error",
        description: mode === 'create' 
          ? "Failed to add address. Please try again."
          : "Failed to update address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Address' : 'Edit Address'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="e.g., Home, Work, Billing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="Enter street address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                value={formData.address.zip}
                onChange={(e) => handleAddressChange('zip', e.target.value)}
                placeholder="Enter ZIP code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="primary"
              checked={formData.primary}
              onCheckedChange={(checked) => handleInputChange('primary', checked)}
            />
            <Label htmlFor="primary">Set as primary address</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {mode === 'create' ? 'Add Address' : 'Update Address'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}