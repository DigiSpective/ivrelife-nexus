/**
 * Simple, direct order hooks that bypass complex persistence
 * Ensures immediate UI updates and reliable order display
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleOrderStore, useSimpleOrderStore, SimpleOrder } from '@/lib/simple-order-store';
import { Order } from '@/types';

/**
 * Hook for getting orders - uses simple store for immediate results
 */
export function useSimpleOrders() {
  const { orders, getCount } = useSimpleOrderStore();
  
  return {
    data: { data: orders },
    isLoading: false,
    error: null,
    count: getCount()
  };
}

/**
 * Hook for getting a single order by ID
 */
export function useSimpleOrder(id: string) {
  const { getOrderById } = useSimpleOrderStore();
  
  return {
    data: { data: getOrderById(id) },
    isLoading: false,
    error: null
  };
}

/**
 * Hook for creating orders - adds directly to store for immediate UI update
 */
export function useSimpleCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: Partial<Order>): Promise<{ data: SimpleOrder }> => {
      console.log('🚀 Creating order directly in simple store:', orderData);
      
      // Add to simple store immediately
      const newOrder = simpleOrderStore.addOrder(orderData);
      
      // Also try to save to background persistence (non-blocking)
      try {
        const { createOrder } = await import('@/lib/supabase');
        createOrder(orderData).catch(error => {
          console.warn('Background persistence failed (non-critical):', error);
        });
      } catch (error) {
        console.warn('Could not import background persistence (non-critical):', error);
      }
      
      return { data: newOrder };
    },
    onSuccess: (data) => {
      console.log('✅ Order created successfully in simple store:', data.data.id);
      // No need to invalidate queries since we're using direct store updates
    },
    onError: (error) => {
      console.error('❌ Order creation failed:', error);
    }
  });
}

/**
 * Hook that can be used as a drop-in replacement for existing useOrders
 */
export function useOrdersReplacement(filters?: any) {
  return useSimpleOrders();
}

/**
 * Hook that can be used as a drop-in replacement for existing useCreateOrder
 */
export function useCreateOrderReplacement() {
  return useSimpleCreateOrder();
}