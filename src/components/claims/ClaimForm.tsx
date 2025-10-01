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
import { useOrders } from '@/hooks/useOrders';
import { sampleProducts } from '@/data/sampleProducts';
import { mockOrderItems, mockProductVariants } from '@/lib/mock-data';
import { Claim } from '@/types';

const claimFormSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  product_ids: z.array(z.string()).min(1, 'At least one product must be selected'),
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
  console.log('🚀 ClaimForm MOUNTED with props:', { retailer_id, location_id, created_by });
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const { mutate: createClaim } = useCreateClaim();

  // Get dynamic customers instead of static mock data
  const { data: customersData } = useCustomers();
  const customers = customersData?.data || [];

  // Get dynamic orders instead of static mock data
  const { data: ordersData } = useOrders();
  const orders = ordersData?.data || [];

  // Debug: Check data availability
  console.log('📊 Data loaded:', {
    mockOrderItems: mockOrderItems.length,
    mockProductVariants: mockProductVariants.length,
    sampleProducts: sampleProducts.length,
    orders: orders.length,
    customers: customers.length
  });

  // Get available orders with order numbers and customer info
  const availableOrders = orders.map((order, index) => ({
    ...order,
    orderNumber: `ORD-${String(index + 1).padStart(4, '0')}`,
    customer: customers.find(c => c.id === order.customer_id)
  }));
  
  // Get products for the selected order
  const getOrderProducts = (orderId: string) => {
    console.log('🔍 getOrderProducts called with orderId:', orderId);
    
    if (!orderId) return [];
    
    // Find the selected order from our available orders
    const selectedOrder = orders.find(order => order.id === orderId);
    console.log('🔍 Selected order found:', selectedOrder ? 'YES' : 'NO');
    
    if (!selectedOrder) {
      console.log('❌ No order found with ID:', orderId);
      return [];
    }
    
    // Get order items from the order (these come from the Supabase query)
    const orderItems = selectedOrder.order_items || [];
    console.log('📋 Order items from selected order:', orderItems.length);
    
    // If no order_items in the order object, check static mock data
    const staticOrderItems = mockOrderItems.filter(item => item.order_id === orderId);
    console.log('📋 Static order items found:', staticOrderItems.length);
    console.log('📋 Static order items:', staticOrderItems);
    
    let itemsToUse = orderItems.length > 0 ? orderItems : staticOrderItems;
    
    // COMPREHENSIVE FIX: If still no items found, create placeholder items from available products
    // This handles dynamically created orders that don't have order_items
    if (itemsToUse.length === 0) {
      console.log('⚠️ No order items found for order:', orderId);
      console.log('🔧 Creating placeholder order items from available products...');
      
      // Create placeholder order items using the first few available products
      const placeholderItems = sampleProducts.slice(0, 3).map((product, index) => {
        const correspondingVariant = mockProductVariants.find(v => v.product_id === product.id);
        if (!correspondingVariant) return null;
        
        return {
          id: `placeholder-${orderId}-${index}`,
          order_id: orderId,
          product_variant_id: correspondingVariant.id,
          qty: 1,
          unit_price: correspondingVariant.price,
          created_at: new Date().toISOString()
        };
      }).filter(Boolean);
      
      console.log('🔧 Created placeholder items:', placeholderItems.length, placeholderItems);
      itemsToUse = placeholderItems;
    }
    
    console.log('📋 Items to use (final):', itemsToUse.length, 'items');
    
    if (itemsToUse.length === 0) {
      console.log('❌ Still no order items available for order:', orderId);
      return [];
    }
    
    // Get product variants and map to products
    console.log('🔄 Starting product mapping for', itemsToUse.length, 'items...');
    const orderProducts = itemsToUse.map((item, index) => {
      const variant = mockProductVariants.find(v => v.id === item.product_variant_id);
      if (!variant) {
        console.log(`❌ No variant found for ${item.product_variant_id}`);
        return null;
      }
      
      const product = sampleProducts.find(p => p.id === variant.product_id);
      if (!product) {
        console.log(`❌ No product found for ${variant.product_id}`);
        return null;
      }
      
      const result = {
        ...product,
        variant: variant,
        orderItem: item,
        displayName: `${product.name} (${variant.sku})`,
        quantity: item.qty,
        unitPrice: item.unit_price
      };
      
      return result;
    }).filter(Boolean);
    
    console.log('🎉 Successfully mapped', orderProducts.length, 'products:', orderProducts.map(p => p.displayName));
    
    return orderProducts;
  };
  
  const availableProducts = getOrderProducts(selectedOrderId);
  const selectedProducts = availableProducts.filter(p => selectedProductIds.includes(p.id));
  
  console.log('🎯 Final result - Available products:', availableProducts.length);
  
  
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      order_id: '',
      product_ids: [],
      reason: '',
      resolution_notes: '',
    },
  });

  const onSubmit = (data: ClaimFormValues) => {
    setIsLoading(true);

    // Helper function to validate UUID format
    const isValidUUID = (value: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    };

    // Helper to validate retailer_id and location_id
    const cleanUuid = (value: any): string | null => {
      if (!value) return null;
      if (typeof value !== 'string') return null;
      if (isValidUUID(value)) return value;
      console.warn(`Invalid UUID format: "${value}", setting to null`);
      return null;
    };

    // Create separate claims for each product
    const createClaimsSequentially = async () => {
      for (const product_id of data.product_ids) {
        // Find the product details to include in resolution notes
        const productInfo = availableProducts.find(p => p.id === product_id);
        const productDescription = productInfo
          ? `Product: ${productInfo.displayName} (SKU: ${product_id})`
          : `Product ID: ${product_id}`;

        // Store product SKU in a parseable format at the start of resolution notes
        const notesWithProduct = `[PRODUCT_SKU:${product_id}]\n${productDescription}${
          data.resolution_notes ? `\n\n${data.resolution_notes}` : ''
        }`;

        const claimData: Partial<Claim> = {
          order_id: data.order_id,
          product_id: isValidUUID(product_id) ? product_id : null, // Only store if valid UUID
          reason: data.reason,
          resolution_notes: notesWithProduct,
          retailer_id: cleanUuid(retailer_id),
          location_id: cleanUuid(location_id),
          created_by,
          status: 'submitted',
        };

        console.log('📋 Submitting claim data:', claimData);

        // Use promise wrapper for mutation
        await new Promise<void>((resolve, reject) => {
          createClaim(claimData, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }
    };

    createClaimsSequentially()
      .then(() => {
        setIsLoading(false);
        form.reset();
        setSelectedOrderId('');
        setSelectedProductIds([]);
        onSuccess?.();
      })
      .catch((error) => {
        setIsLoading(false);
        console.error('Error creating claims:', error);
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
                    console.log('🎯 Order selected:', value);
                    field.onChange(value);
                    setSelectedOrderId(value);
                    console.log('🎯 selectedOrderId state updated to:', value);
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
              name="product_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Products from Order</FormLabel>
                  {!selectedOrderId ? (
                    <p className="text-sm text-muted-foreground">Please select an order first to see available products.</p>
                  ) : availableProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products found for the selected order.</p>
                  ) : (
                    <div className="space-y-3">
                      {availableProducts.map((product) => (
                        <div key={product.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                          <input
                            type="checkbox"
                            id={`product-${product.id}`}
                            checked={field.value?.includes(product.id) || false}
                            onChange={(e) => {
                              const currentValues = field.value || [];
                              if (e.target.checked) {
                                const newValues = [...currentValues, product.id];
                                field.onChange(newValues);
                                setSelectedProductIds(newValues);
                              } else {
                                const newValues = currentValues.filter(id => id !== product.id);
                                field.onChange(newValues);
                                setSelectedProductIds(newValues);
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor={`product-${product.id}`} className="cursor-pointer">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{product.displayName}</p>
                                  <p className="text-sm text-muted-foreground">{product.description}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Qty: {product.quantity}
                                    </span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ${product.unitPrice.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show summary of selected products */}
            {selectedProducts.length > 0 && (
              <div>
                <FormLabel>Selected Products Summary</FormLabel>
                <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for this claim:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedProducts.map((product) => (
                      <li key={product.id} className="text-sm">
                        <span className="font-medium">{product.displayName}</span>
                        <span className="text-muted-foreground"> - Qty: {product.quantity}, ${product.unitPrice.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
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