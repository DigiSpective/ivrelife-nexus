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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateClaim } from '@/hooks/useClaims';
import { OrderCustomerLink } from '../shared/OrderCustomerLink';
import { useCustomers } from '@/hooks/useCustomers';
import { mockOrders } from '@/lib/mock-data';
import { sampleProducts } from '@/data/sampleProducts';
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
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { mutate: createClaim } = useCreateClaim();

  // Get dynamic customers instead of static mock data
  const { data: customersData } = useCustomers();
  const customers = customersData?.data || [];

  // Get available orders
  const availableOrders = mockOrders.map((order, index) => ({
    ...order,
    orderNumber: `ORD-${String(index + 1).padStart(4, '0')}`,
    customer: customers.find(c => c.id === order.customer_id)
  }));

  // Get available products from /products route
  const availableProducts = sampleProducts;
  const selectedProduct = selectedProductId ? sampleProducts.find(p => p.id === selectedProductId) : null;
  
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
                  <FormLabel>Select Order</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedOrderId(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an order for this claim" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNumber} - {order.customer?.name} - ${order.total_amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show order context when selected */}
            {selectedOrderId && (
              <div>
                <FormLabel>Selected Order Details</FormLabel>
                <div className="mt-2">
                  <OrderCustomerLink orderId={selectedOrderId} variant="compact" />
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Product</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedProductId(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product for this claim" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProducts.map((product) => {
                        const displayPrice = product.sale_price_usd || product.price_usd;
                        const isOnSale = product.sale_price_usd && product.msrp_usd && product.sale_price_usd < product.msrp_usd;
                        
                        return (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{product.name}</span>
                                <span className="text-muted-foreground ml-2">({product.sku})</span>
                              </div>
                              <div className="ml-4 text-right">
                                <span className="font-semibold">${displayPrice.toLocaleString()}</span>
                                {isOnSale && (
                                  <span className="text-xs text-muted-foreground line-through ml-1">
                                    ${product.msrp_usd?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show product details when selected */}
            {selectedProduct && (
              <div>
                <FormLabel>Selected Product Details</FormLabel>
                <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold">{selectedProduct.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedProduct.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {selectedProduct.category}
                        </span>
                        {!selectedProduct.available && (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                            Out of Stock
                          </span>
                        )}
                        {selectedProduct.white_glove_available && (
                          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                            White Glove Available
                          </span>
                        )}
                        {selectedProduct.gift_eligible && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            Gift Eligible
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        {(() => {
                          const displayPrice = selectedProduct.sale_price_usd || selectedProduct.price_usd;
                          const isOnSale = selectedProduct.sale_price_usd && selectedProduct.msrp_usd && selectedProduct.sale_price_usd < selectedProduct.msrp_usd;
                          
                          return (
                            <div>
                              <p className="text-lg font-bold">${displayPrice.toLocaleString()}</p>
                              {isOnSale && (
                                <p className="text-sm text-muted-foreground line-through">
                                  ${selectedProduct.msrp_usd?.toLocaleString()}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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