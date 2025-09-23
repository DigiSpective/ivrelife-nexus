import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { Customer } from '@/types';
import { Loader2, Save, X } from 'lucide-react';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'create' | 'edit';
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  default_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

const initialFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  default_address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  }
};

export function CustomerDialog({ open, onOpenChange, customer, mode }: CustomerDialogProps) {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          notes: customer.notes || '',
          default_address: customer.default_address || initialFormData.default_address
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, customer, mode]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: keyof CustomerFormData['default_address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      default_address: {
        ...prev.default_address,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
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
      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
        default_address: 
          formData.default_address.street.trim() || 
          formData.default_address.city.trim() || 
          formData.default_address.state.trim() || 
          formData.default_address.zip.trim()
            ? formData.default_address
            : null
      };

      if (mode === 'create') {
        await createCustomerMutation.mutateAsync(customerData);
        toast({
          title: "Success",
          description: "Customer created successfully"
        });
      } else if (mode === 'edit' && customer) {
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          customer: customerData
        });
        toast({
          title: "Success",
          description: "Customer updated successfully"
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: mode === 'create' 
          ? "Failed to create customer. Please try again."
          : "Failed to update customer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Default Address</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.default_address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.default_address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.default_address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.default_address.zip}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about this customer"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
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
              {mode === 'create' ? 'Create Customer' : 'Update Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}