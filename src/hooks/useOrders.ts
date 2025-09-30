import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrderById, createOrder } from '@/lib/supabase';
import { Order } from '@/types';

// Orders hooks
export const useOrders = (filters?: {
  retailer_id?: string;
  location_id?: string;
  customer_id?: string;
}) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] useOrders queryFn called - loading from persistence`);
      return getOrders();
    },
    // Allow refetch on mount to load persisted data
    staleTime: 1 * 60 * 1000, // 1 minute - shorter to ensure fresh data
    refetchOnMount: true, // CRITICAL: Allow refetch on page load to get persisted data
    refetchOnWindowFocus: false, // Keep this false to avoid too many requests
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: Partial<Order>) => {
      console.log('useCreateOrder mutationFn called with:', order);
      return createOrder(order);
    },
    onSuccess: async (data) => {
      console.log('Order created successfully:', data);
      
      if (data.data) {
        console.log('Invalidating orders queries to refresh from persistence...');
        try {
          // Invalidate and refetch ALL orders queries (with any filters)
          await queryClient.invalidateQueries({ 
            predicate: (query) => query.queryKey[0] === 'orders'
          });
          
          // Force immediate refetch of all orders queries
          await queryClient.refetchQueries({ 
            predicate: (query) => query.queryKey[0] === 'orders'
          });
          console.log('✅ All orders queries invalidated and refetched - UI should update immediately');
        } catch (error) {
          console.error('❌ Failed to refresh orders list:', error);
          // Still consider the mutation successful since order was created
        }
      }
    },
    onError: (error) => {
      console.error('❌ Order creation failed:', error);
      // Error will be handled by the UI component using the mutation error state
    },
  });
};