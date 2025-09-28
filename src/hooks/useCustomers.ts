import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerDocuments,
  createCustomerDocument,
  deleteCustomerDocument,
  getCustomerActivity,
  createCustomerActivity,
  getCustomerMergeRequests,
  createCustomerMergeRequest,
  approveCustomerMergeRequest
} from '@/lib/supabase';
import { 
  Customer, 
  CustomerContact, 
  CustomerAddress, 
  CustomerDocument, 
  CustomerActivity, 
  CustomerMergeRequest 
} from '@/types';

// Customers hooks
export const useCustomers = (filters?: {
  search?: string;
  retailer_id?: string;
  location_id?: string;
}) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => getCustomers(),
    // Allow initial data fetch but prevent excessive refetches
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced for better data freshness)
    refetchOnMount: true, // Allow refetch on mount to get fresh data after refresh
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: true, // Refetch when coming back online
    // Enable retries for better reliability
    retry: (failureCount, error) => {
      // Don't retry if it's a known persistent storage issue
      if (error?.message?.includes('user_storage')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: Partial<Customer>) => createCustomer(customer),
    onSuccess: async (data) => {
      console.log('Customer created successfully:', data);
      console.log('Directly updating React Query cache...');
      
      // Get current customers data from cache
      const currentData = queryClient.getQueryData(['customers', undefined]) as { data: Customer[] } | undefined;
      console.log('Current cached data:', currentData);
      
      if (currentData && data.data) {
        // Directly update the cache with new customer data
        const updatedData = {
          ...currentData,
          data: [...currentData.data, data.data]
        };
        
        // Set the new data directly
        queryClient.setQueryData(['customers', undefined], updatedData);
        console.log('Cache updated directly with new customer:', updatedData);
      }
      
      // REMOVING FALLBACK - this was overwriting our direct update!
      // await queryClient.invalidateQueries({ queryKey: ['customers'] });
      console.log('Direct cache update complete - NOT running fallback invalidation');
      
      console.log('Direct cache update completed');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: Partial<Customer> }) => 
      updateCustomer(id, customer),
    onSuccess: (data) => {
      console.log('Customer updated successfully:', data);
      
      // Direct cache update for customers list
      const currentData = queryClient.getQueryData(['customers', undefined]) as { data: Customer[] } | undefined;
      if (currentData && data.data) {
        const updatedData = {
          ...currentData,
          data: currentData.data.map(customer => 
            customer.id === data.data!.id ? data.data! : customer
          )
        };
        queryClient.setQueryData(['customers', undefined], updatedData);
        console.log('Customers cache updated with modified customer');
      }
      
      // Update individual customer cache
      queryClient.setQueryData(['customer', data.data?.id], data);
      
      // Removed fallback invalidation to prevent overwriting direct updates
      console.log('Customer update cache manipulation complete');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (data, variables) => {
      console.log('Customer deleted successfully:', variables);
      
      // Direct cache update for customers list
      const currentData = queryClient.getQueryData(['customers', undefined]) as { data: Customer[] } | undefined;
      if (currentData) {
        const updatedData = {
          ...currentData,
          data: currentData.data.filter(customer => customer.id !== variables)
        };
        queryClient.setQueryData(['customers', undefined], updatedData);
        console.log('Customers cache updated - customer removed');
      }
      
      // Remove individual customer from cache
      queryClient.removeQueries({ queryKey: ['customer', variables] });
      
      // Removed fallback invalidation to prevent overwriting direct updates
      console.log('Customer delete cache manipulation complete');
    },
  });
};

// Customer contacts hooks
export const useCustomerContacts = (customerId: string) => {
  return useQuery({
    queryKey: ['customerContacts', customerId],
    queryFn: () => getCustomerContacts(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contact: Partial<CustomerContact>) => createCustomerContact(contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerContacts', data.data?.customer_id] });
    },
  });
};

export const useUpdateCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, contact }: { id: string; contact: Partial<CustomerContact> }) => 
      updateCustomerContact(id, contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerContacts', data.data?.customer_id] });
    },
  });
};

export const useDeleteCustomerContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomerContact(id),
    onSuccess: (_, variables) => {
      // We don't have the customer ID here, so we invalidate all customer contacts
      queryClient.invalidateQueries({ queryKey: ['customerContacts'] });
    },
  });
};

// Customer addresses hooks
export const useCustomerAddresses = (customerId: string) => {
  return useQuery({
    queryKey: ['customerAddresses', customerId],
    queryFn: () => getCustomerAddresses(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (address: Partial<CustomerAddress>) => createCustomerAddress(address),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses', data.data?.customer_id] });
    },
  });
};

export const useUpdateCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, address }: { id: string; address: Partial<CustomerAddress> }) => 
      updateCustomerAddress(id, address),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses', data.data?.customer_id] });
    },
  });
};

export const useDeleteCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomerAddress(id),
    onSuccess: (_, variables) => {
      // We don't have the customer ID here, so we invalidate all customer addresses
      queryClient.invalidateQueries({ queryKey: ['customerAddresses'] });
    },
  });
};

// Customer documents hooks
export const useCustomerDocuments = (customerId: string) => {
  return useQuery({
    queryKey: ['customerDocuments', customerId],
    queryFn: () => getCustomerDocuments(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (document: Partial<CustomerDocument>) => createCustomerDocument(document),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerDocuments', data.data?.customer_id] });
    },
  });
};

export const useDeleteCustomerDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomerDocument(id),
    onSuccess: (_, variables) => {
      // We don't have the customer ID here, so we invalidate all customer documents
      queryClient.invalidateQueries({ queryKey: ['customerDocuments'] });
    },
  });
};

// Customer activity hooks
export const useCustomerActivity = (customerId: string) => {
  return useQuery({
    queryKey: ['customerActivity', customerId],
    queryFn: () => getCustomerActivity(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (activity: Partial<CustomerActivity>) => createCustomerActivity(activity),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customerActivity', data.data?.customer_id] });
    },
  });
};

// Customer merge requests hooks
export const useCustomerMergeRequests = (customerId: string) => {
  return useQuery({
    queryKey: ['customerMergeRequests', customerId],
    queryFn: () => getCustomerMergeRequests(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerMergeRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mergeRequest: Partial<CustomerMergeRequest>) => createCustomerMergeRequest(mergeRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMergeRequests'] });
    },
  });
};

export const useApproveCustomerMergeRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => approveCustomerMergeRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMergeRequests'] });
    },
  });
};