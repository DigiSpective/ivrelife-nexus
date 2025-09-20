import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getShippingProviders,
  getShippingMethods,
  getShippingQuotes,
  getFulfillments,
  createShippingProvider,
  updateShippingProvider,
  deleteShippingProvider,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  createShippingQuote,
  createFulfillment,
  updateFulfillment
} from '@/lib/supabase';
import { 
  ShippingProvider,
  ShippingMethod,
  ShippingQuote,
  Fulfillment
} from '@/types';

// Shipping providers hooks
export const useShippingProviders = () => {
  return useQuery({
    queryKey: ['shippingProviders'],
    queryFn: () => getShippingProviders(),
  });
};

export const useCreateShippingProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (provider: Partial<ShippingProvider>) => createShippingProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingProviders'] });
    },
  });
};

export const useUpdateShippingProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, provider }: { id: string; provider: Partial<ShippingProvider> }) => 
      updateShippingProvider(id, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingProviders'] });
    },
  });
};

export const useDeleteShippingProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteShippingProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingProviders'] });
    },
  });
};

// Shipping methods hooks
export const useShippingMethods = () => {
  return useQuery({
    queryKey: ['shippingMethods'],
    queryFn: () => getShippingMethods(),
  });
};

export const useCreateShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (method: Partial<ShippingMethod>) => createShippingMethod(method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
    },
  });
};

export const useUpdateShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, method }: { id: string; method: Partial<ShippingMethod> }) => 
      updateShippingMethod(id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
    },
  });
};

export const useDeleteShippingMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteShippingMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingMethods'] });
    },
  });
};

// Shipping quotes hooks
export const useShippingQuotes = (filters?: {
  order_id?: string;
  retailer_id?: string;
  location_id?: string;
}) => {
  return useQuery({
    queryKey: ['shippingQuotes', filters],
    queryFn: () => getShippingQuotes(),
  });
};

export const useCreateShippingQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (quote: Partial<ShippingQuote>) => createShippingQuote(quote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippingQuotes'] });
    },
  });
};

// Fulfillments hooks
export const useFulfillments = (filters?: {
  retailer_id?: string;
  location_id?: string;
}) => {
  return useQuery({
    queryKey: ['fulfillments', filters],
    queryFn: () => getFulfillments(),
  });
};

export const useCreateFulfillment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fulfillment: Partial<Fulfillment>) => createFulfillment(fulfillment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
    },
  });
};

export const useUpdateFulfillment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, fulfillment }: { id: string; fulfillment: Partial<Fulfillment> }) => 
      updateFulfillment(id, fulfillment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
    },
  });
};