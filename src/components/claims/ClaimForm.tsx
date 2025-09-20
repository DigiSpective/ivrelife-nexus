import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateClaim } from '@/hooks/useClaims';
import { Claim } from '@/types';

const claimFormSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  resolution_notes: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimFormProps {
  retailer_id: string;
  location_id?: string;
  created_by: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClaimForm({ retailer_id, location_id, created_by, onSuccess, onCancel }: ClaimFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: createClaim } = useCreateClaim();
  
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      order_id: '',
      product_id: '',
      reason: '',
      resolution_notes: '',
    },
  });

  const onSubmit = (data: ClaimFormValues) => {
    setIsLoading(true);
    
    const claimData: Partial<Claim> = {
      ...data,
      retailer_id,
      location_id,
      created_by,
      status: 'submitted',
    };
    
    createClaim(claimData, {
      onSuccess: () => {
        setIsLoading(false);
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        setIsLoading(false);
        console.error('Error creating claim:', error);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Claim</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter order ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Claim</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the reason for this claim..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resolution_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any initial notes about resolution..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}