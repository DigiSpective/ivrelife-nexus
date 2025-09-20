import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Customer } from '@/types';

// Define form-specific types that don't require all fields
interface ContactForm {
  type: 'email' | 'phone' | 'other';
  value: string;
  label?: string;
}

interface AddressForm {
  address: any;
  label?: string;
  primary?: boolean;
}

const customerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  contacts: z.array(z.object({
    type: z.enum(['email', 'phone', 'other']),
    value: z.string().min(1, 'Value is required'),
    label: z.string().optional(),
  })).optional(),
  addresses: z.array(z.object({
    address: z.any(),
    label: z.string().optional(),
    primary: z.boolean().optional(),
  })).optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const [contacts, setContacts] = useState<ContactForm[]>(customer?.id ? [] : [{ type: 'email', value: '', label: '' }]);
  const [addresses, setAddresses] = useState<AddressForm[]>(customer?.id ? [] : [{ address: {}, label: '', primary: true }]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      notes: customer?.notes || '',
      contacts: contacts,
      addresses: addresses,
    },
  });

  const handleAddContact = () => {
    setContacts([...contacts, { type: 'email', value: '', label: '' }]);
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    setContacts(newContacts);
  };

  const handleAddAddress = () => {
    setAddresses([...addresses, { address: {}, label: '', primary: false }]);
  };

  const handleRemoveAddress = (index: number) => {
    const newAddresses = [...addresses];
    newAddresses.splice(index, 1);
    setAddresses(newAddresses);
  };

  const handleSubmit = (data: CustomerFormValues) => {
    onSubmit({ ...data, contacts, addresses });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{customer ? 'Edit Customer' : 'Create New Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Contacts</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              
              {contacts.map((contact, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={contact.type}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].type = e.target.value as 'email' | 'phone' | 'other';
                      setContacts(newContacts);
                    }}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="other">Other</option>
                  </select>
                  <Input
                    placeholder="Contact value"
                    value={contact.value}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].value = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                  <Input
                    placeholder="Label (optional)"
                    value={contact.label || ''}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index].label = e.target.value;
                      setContacts(newContacts);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveContact(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Addresses</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAddress}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </div>
              
              {addresses.map((address, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <Input
                    placeholder="Address label"
                    value={address.label || ''}
                    onChange={(e) => {
                      const newAddresses = [...addresses];
                      newAddresses[index].label = e.target.value;
                      setAddresses(newAddresses);
                    }}
                  />
                  <Input
                    placeholder="Street address"
                    value={address.address?.street || ''}
                    onChange={(e) => {
                      const newAddresses = [...addresses];
                      newAddresses[index].address = {
                        ...newAddresses[index].address,
                        street: e.target.value
                      };
                      setAddresses(newAddresses);
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="City"
                      value={address.address?.city || ''}
                      onChange={(e) => {
                        const newAddresses = [...addresses];
                        newAddresses[index].address = {
                          ...newAddresses[index].address,
                          city: e.target.value
                        };
                        setAddresses(newAddresses);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveAddress(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this customer"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}