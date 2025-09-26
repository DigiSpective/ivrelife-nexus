import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getUsersByRetailer,
  getOrders,
  getOrdersByRetailer,
  getCustomers,
  getCustomersByRetailer,
  createOrder,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '@/lib/supabase';
import { User, Order, Customer } from '@/types';

// User Management Hooks
export const useAdminUsers = (retailerId?: string) => {
  return useQuery({
    queryKey: ['admin-users', retailerId],
    queryFn: () => retailerId ? getUsersByRetailer(retailerId) : getUsers(),
  });
};

export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) => 
      updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// Order Management Hooks for Admin
export const useAdminOrders = (retailerId?: string) => {
  return useQuery({
    queryKey: ['admin-orders', retailerId],
    queryFn: () => retailerId ? getOrdersByRetailer(retailerId) : getOrders(),
  });
};

export const useAdminCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: Partial<Order>) => createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Customer Management Hooks for Admin
export const useAdminCustomers = (retailerId?: string) => {
  return useQuery({
    queryKey: ['admin-customers', retailerId],
    queryFn: () => retailerId ? getCustomersByRetailer(retailerId) : getCustomers(),
  });
};

export const useAdminCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerData: Partial<Customer>) => createCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useAdminUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, customerData }: { id: string; customerData: Partial<Customer> }) => 
      updateCustomer(id, customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useAdminDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Product Management Hooks for Admin
export const useAdminProducts = () => {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getProducts(),
  });
};

export const useAdminCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: any) => createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useAdminUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, productData }: { id: string; productData: any }) => 
      updateProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useAdminDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};