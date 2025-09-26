import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminCreateCustomer, useAdminUpdateCustomer } from '@/hooks/useAdmin';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  company: z.string().optional(),
  retailer_id: z.string().min(1, 'Retailer ID is required'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'create' | 'edit';
}

export function CustomerFormDialog({ open, onOpenChange, customer, mode }: CustomerFormDialogProps) {
  const { toast } = useToast();
  const createCustomer = useAdminCreateCustomer();
  const updateCustomer = useAdminUpdateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      company: customer?.company || '',
      retailer_id: customer?.retailer_id || 'ret-1',
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    if (mode === 'create') {
      createCustomer.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'Customer created successfully',
            description: `Customer ${data.name} has been created.`,
          });
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: 'Error creating customer',
            description: error.message || 'An error occurred while creating the customer.',
            variant: 'destructive',
          });
        },
      });
    } else {
      updateCustomer.mutate({ 
        id: customer!.id, 
        customerData: data 
      }, {
        onSuccess: () => {
          toast({
            title: 'Customer updated successfully',
            description: `Customer ${data.name} has been updated.`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Error updating customer',
            description: error.message || 'An error occurred while updating the customer.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Customer' : 'Edit Customer'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
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
                    <Input type="email" placeholder="Enter email address" {...field} />
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
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retailer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retailer ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter retailer ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCustomer.isPending || updateCustomer.isPending}
              >
                {createCustomer.isPending || updateCustomer.isPending
                  ? (mode === 'create' ? 'Creating...' : 'Updating...')
                  : (mode === 'create' ? 'Create Customer' : 'Update Customer')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}