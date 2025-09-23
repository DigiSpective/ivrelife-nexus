import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateCustomerContact, useUpdateCustomerContact } from '@/hooks/useCustomers';
import { CustomerContact } from '@/types';
import { Loader2, Save, X } from 'lucide-react';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  contact?: CustomerContact | null;
  mode: 'create' | 'edit';
}

interface ContactFormData {
  type: 'email' | 'phone' | 'other';
  value: string;
  label: string;
  verified: boolean;
}

const initialFormData: ContactFormData = {
  type: 'email',
  value: '',
  label: '',
  verified: false
};

export function ContactDialog({ open, onOpenChange, customerId, contact, mode }: ContactDialogProps) {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createContactMutation = useCreateCustomerContact();
  const updateContactMutation = useUpdateCustomerContact();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && contact) {
        setFormData({
          type: contact.type,
          value: contact.value,
          label: contact.label || '',
          verified: contact.verified
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, contact, mode]);

  const handleInputChange = (field: keyof ContactFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Contact value is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value)) {
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
      const contactData = {
        customer_id: customerId,
        type: formData.type,
        value: formData.value.trim(),
        label: formData.label.trim() || null,
        verified: formData.verified
      };

      if (mode === 'create') {
        await createContactMutation.mutateAsync(contactData);
        toast({
          title: "Success",
          description: "Contact added successfully"
        });
      } else if (mode === 'edit' && contact) {
        await updateContactMutation.mutateAsync({
          id: contact.id,
          contact: contactData
        });
        toast({
          title: "Success",
          description: "Contact updated successfully"
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: mode === 'create' 
          ? "Failed to add contact. Please try again."
          : "Failed to update contact. Please try again.",
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
            {mode === 'create' ? 'Add Contact' : 'Edit Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value as 'email' | 'phone' | 'other')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">
              {formData.type === 'email' ? 'Email Address' : 
               formData.type === 'phone' ? 'Phone Number' : 'Contact Value'} *
            </Label>
            <Input
              id="value"
              type={formData.type === 'email' ? 'email' : 'text'}
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder={
                formData.type === 'email' ? 'Enter email address' : 
                formData.type === 'phone' ? 'Enter phone number' : 'Enter contact value'
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="e.g., Work, Home, Personal"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="verified"
              checked={formData.verified}
              onCheckedChange={(checked) => handleInputChange('verified', checked)}
            />
            <Label htmlFor="verified">Verified</Label>
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
              {mode === 'create' ? 'Add Contact' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}