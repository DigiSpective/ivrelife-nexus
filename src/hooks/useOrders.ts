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
      console.log(`[${timestamp}] useOrders queryFn called`);
      return getOrders();
    },
    // Prevent automatic refetches that could overwrite our direct updates
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
      console.log('Directly updating React Query cache...');
      
      // Get current orders data from cache
      const currentData = queryClient.getQueryData(['orders', undefined]) as { data: Order[] | null } | undefined;
      console.log('Current cached orders data:', currentData);
      
      if (data.data) {
        // Handle the case where currentData.data might be null or undefined
        const existingOrders = currentData?.data || [];
        const updatedData = {
          data: [...existingOrders, data.data],
          error: null
        };
        
        // Set the new data directly
        queryClient.setQueryData(['orders', undefined], updatedData);
        console.log('Cache updated directly with new order:', updatedData);
      }
      
      // NOT using invalidateQueries to prevent race conditions like with customers
      console.log('Direct cache update complete - NOT running fallback invalidation');
    },
  });
};