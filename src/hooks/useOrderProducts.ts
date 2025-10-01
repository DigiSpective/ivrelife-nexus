import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sampleProducts } from '@/data/sampleProducts';
import { mockOrderItems } from '@/lib/mock-data';
import { getOrderItemsByOrder } from '@/lib/supabase';

// Hook to get order items with their corresponding product details
export function useOrderProducts(orderId: string) {
  // Try to fetch order items from Supabase
  const { data: supabaseOrderItemsResult } = useQuery({
    queryKey: ['orderItems', orderId],
    queryFn: () => getOrderItemsByOrder(orderId),
    enabled: !!orderId,
  });

  const orderItems = useMemo(() => {
    console.log('🔍 useOrderProducts - orderId:', orderId);
    console.log('🔍 useOrderProducts - supabaseOrderItemsResult:', supabaseOrderItemsResult);

    // First check if we have Supabase order items
    const supabaseItems = supabaseOrderItemsResult?.data || [];
    console.log('🔍 useOrderProducts - supabaseItems count:', supabaseItems.length);

    // If no Supabase items, fall back to mock data
    const items = supabaseItems.length > 0
      ? supabaseItems
      : mockOrderItems.filter(item => item.order_id === orderId);

    console.log('🔍 useOrderProducts - items to process:', items.length);

    // If still no items, return demo products for any order
    if (items.length === 0 && orderId) {
      console.log('⚠️ No order items found, returning demo products');
      // Return sample products as demo order items
      return sampleProducts.slice(0, 2).map((product, index) => ({
        id: `demo-${index}`,
        order_id: orderId,
        product_variant_id: `demo-var-${index}`,
        qty: 1,
        unit_price: product.price || 0,
        created_at: new Date().toISOString(),
        product: product,
        line_total: product.price || 0
      }));
    }

    // Map order items to include product details
    return items.map(item => {
      // For now, we'll map product_variant_id to product IDs
      // In a real implementation, this would be handled by a proper API
      let product = null;

      // Try to find matching product by attempting to map variant ID to product
      if (item.product_variant_id === 'var-1') {
        product = sampleProducts.find(p => p.sku.includes('ARYA') || p.name.includes('iPhone'));
      } else if (item.product_variant_id === 'var-2') {
        product = sampleProducts.find(p => p.sku.includes('BOSS') || p.name.includes('MacBook'));
      } else if (item.product_variant_id === 'var-3') {
        product = sampleProducts.find(p => p.sku.includes('PRINCE') || p.name.includes('Samsung'));
      }

      // Fallback to first available product if no match found
      if (!product) {
        product = sampleProducts.find(p => p.available) || sampleProducts[0];
      }

      return {
        ...item,
        product,
        line_total: item.unit_price * item.qty
      };
    });
  }, [orderId, supabaseOrderItemsResult]);

  const orderTotal = useMemo(() => {
    return orderItems.reduce((total, item) => total + item.line_total, 0);
  }, [orderItems]);

  return {
    orderItems,
    orderTotal,
    itemCount: orderItems.length
  };
}

// Hook to get all products for orders (including unavailable ones)
export function useAvailableProducts() {
  return useMemo(() => {
    // Return all products, we'll handle availability in the UI
    return sampleProducts;
  }, []);
}

// Hook to get product by ID
export function useProduct(productId: string) {
  return useMemo(() => {
    return sampleProducts.find(product => product.id === productId);
  }, [productId]);
}