import { useMemo } from 'react';
import { sampleProducts } from '@/data/sampleProducts';
import { mockOrderItems } from '@/lib/mock-data';

// Hook to get order items with their corresponding product details
export function useOrderProducts(orderId: string) {
  const orderItems = useMemo(() => {
    // Get order items for this order
    const items = mockOrderItems.filter(item => item.order_id === orderId);
    
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
  }, [orderId]);

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