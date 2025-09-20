import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-url.supabase.co' && supabaseAnonKey !== 'your-anon-key';

// Create Supabase client only if we have valid credentials
export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock client for development without Supabase credentials
      from: (table: string) => {
        // Return mock data based on table
        switch(table) {
          case 'products':
            return {
              select: function() { return this; },
              eq: function() { return this; },
              single: function() { 
                // This will be handled by the individual functions
                return Promise.resolve({ data: null, error: null });
              }
            };
          case 'product_variants':
            return {
              select: function() { return this; },
              eq: function() { return this; },
              single: function() { 
                // This will be handled by the individual functions
                return Promise.resolve({ data: null, error: null });
              }
            };
          default:
            return {
              select: function() { return this; },
              insert: function() { return this; },
              update: function() { return this; },
              delete: function() { return this; },
              eq: function() { return this; },
              single: function() { return this; }
            };
        }
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null })
      }
    };

// Auth functions
export const signIn = async (email: string, password: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Authentication will not work.');
    return { data: { user: null, session: null }, error: new Error('Supabase not configured') };
  }
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Sign out will not work.');
    return { error: new Error('Supabase not configured') };
  }
  return await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock user.');
    return null;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get user role from user_roles table
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('user_roles')
    .select('role, retailer_id, location_id')
    .eq('user_id', user.id)
    .single();
  
  if (userRoleError) {
    console.error('Error fetching user role:', userRoleError);
    return null;
  }
  
  return {
    id: user.id,
    email: user.email || '',
    role: userRoleData?.role || 'location',
    retailer_id: userRoleData?.retailer_id,
    location_id: userRoleData?.location_id,
    name: user.user_metadata?.name || user.email || '',
    avatar: user.user_metadata?.avatar_url
  };
};

// Retailer functions
export const getRetailers = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('retailers').select('*');
};

export const getRetailerById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('retailers').select('*').eq('id', id).single();
};

// Location functions
export const getLocations = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('locations').select('*');
};

export const getLocationsByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('locations').select('*').eq('retailer_id', retailerId);
};

// Customer functions
export const getCustomers = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customers').select('*');
};

export const getCustomerById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('customers').select('*').eq('id', id).single();
};

export const getCustomersByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customers').select('*').eq('retailer_id', retailerId);
};

// Add new customer-related functions after the existing customer functions
export const createCustomer = async (customer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customers').insert(customer).select().single();
};

export const updateCustomer = async (id: string, customer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customers').update(customer).eq('id', id).select().single();
};

export const deleteCustomer = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('customers').delete().eq('id', id);
};

// Customer contacts functions
export const getCustomerContacts = async (customerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customer_contacts').select('*').eq('customer_id', customerId);
};

export const createCustomerContact = async (contact: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_contacts').insert(contact).select().single();
};

export const updateCustomerContact = async (id: string, contact: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_contacts').update(contact).eq('id', id).select().single();
};

export const deleteCustomerContact = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_contacts').delete().eq('id', id);
};

// Customer addresses functions
export const getCustomerAddresses = async (customerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customer_addresses').select('*').eq('customer_id', customerId);
};

export const createCustomerAddress = async (address: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_addresses').insert(address).select().single();
};

export const updateCustomerAddress = async (id: string, address: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_addresses').update(address).eq('id', id).select().single();
};

export const deleteCustomerAddress = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_addresses').delete().eq('id', id);
};

// Customer documents functions
export const getCustomerDocuments = async (customerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customer_documents').select('*').eq('customer_id', customerId);
};

export const createCustomerDocument = async (document: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_documents').insert(document).select().single();
};

export const deleteCustomerDocument = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_documents').delete().eq('id', id);
};

// Customer activity functions
export const getCustomerActivity = async (customerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customer_activity').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
};

export const createCustomerActivity = async (activity: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_activity').insert(activity).select().single();
};

// Customer merge requests functions
export const getCustomerMergeRequests = async (customerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('customer_merge_requests').select('*').eq('primary_customer_id', customerId);
};

export const createCustomerMergeRequest = async (mergeRequest: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_merge_requests').insert(mergeRequest).select().single();
};

export const approveCustomerMergeRequest = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('customer_merge_requests')
    .update({ approved: true, processed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
};

// Product functions
export const getProducts = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock product data.');
    // Return mock product data
    const mockProducts = [
      {
        id: 'prod-1',
        retailer_id: 'ret-1',
        category_id: 'cat-1',
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with A17 Pro chip',
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'prod-2',
        retailer_id: 'ret-1',
        category_id: 'cat-2',
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals',
        created_at: '2024-01-12T00:00:00Z'
      },
      {
        id: 'prod-3',
        retailer_id: 'ret-1',
        category_id: 'cat-3',
        name: 'Samsung 65" QLED TV',
        description: 'High-quality 4K television',
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
    return Promise.resolve({ data: mockProducts, error: null });
  }
  return supabase.from('products').select('*');
};

export const getProductById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Mock data for specific product
    const mockProducts = [
      {
        id: 'prod-1',
        retailer_id: 'ret-1',
        category_id: 'cat-1',
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with A17 Pro chip',
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'prod-2',
        retailer_id: 'ret-1',
        category_id: 'cat-2',
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals',
        created_at: '2024-01-12T00:00:00Z'
      },
      {
        id: 'prod-3',
        retailer_id: 'ret-1',
        category_id: 'cat-3',
        name: 'Samsung 65" QLED TV',
        description: 'High-quality 4K television',
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
    
    const product = mockProducts.find(p => p.id === id) || null;
    return Promise.resolve({ data: product, error: null });
  }
  return supabase.from('products').select('*').eq('id', id).single();
};

export const getProductsByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Return mock product data filtered by retailer
    const mockProducts = [
      {
        id: 'prod-1',
        retailer_id: 'ret-1',
        category_id: 'cat-1',
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with A17 Pro chip',
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'prod-2',
        retailer_id: 'ret-1',
        category_id: 'cat-2',
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals',
        created_at: '2024-01-12T00:00:00Z'
      },
      {
        id: 'prod-3',
        retailer_id: 'ret-1',
        category_id: 'cat-3',
        name: 'Samsung 65" QLED TV',
        description: 'High-quality 4K television',
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
    
    const filteredProducts = mockProducts.filter(p => p.retailer_id === retailerId);
    return Promise.resolve({ data: filteredProducts, error: null });
  }
  return supabase.from('products').select('*').eq('retailer_id', retailerId);
};

// Product variant functions
export const getProductVariants = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock product variant data.');
    // Return mock product variant data
    const mockVariants = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        sku: 'IPH15P-128-TIT',
        price: 999.99,
        weight_kg: 0.25,
        height_cm: 15.0,
        width_cm: 7.5,
        depth_cm: 0.8,
        color: 'Titanium',
        ltl_flag: false,
        inventory_qty: 25,
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'var-2',
        product_id: 'prod-2',
        sku: 'MBP16-512-SG',
        price: 2499.99,
        weight_kg: 2.2,
        height_cm: 35.5,
        width_cm: 22.0,
        depth_cm: 1.7,
        color: 'Space Gray',
        ltl_flag: false,
        inventory_qty: 10,
        created_at: '2024-01-12T00:00:00Z'
      },
      {
        id: 'var-3',
        product_id: 'prod-3',
        sku: 'SAM65QLED',
        price: 1299.99,
        weight_kg: 25.0,
        height_cm: 95.0,
        width_cm: 145.0,
        depth_cm: 10.0,
        color: 'Black',
        ltl_flag: true,
        inventory_qty: 5,
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
    return Promise.resolve({ data: mockVariants, error: null });
  }
  return supabase.from('product_variants').select('*');
};

export const getProductVariantsByProduct = (productId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Filter mock data by product ID
    const mockVariants = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        sku: 'IPH15P-128-TIT',
        price: 999.99,
        weight_kg: 0.25,
        height_cm: 15.0,
        width_cm: 7.5,
        depth_cm: 0.8,
        color: 'Titanium',
        ltl_flag: false,
        inventory_qty: 25,
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: 'var-2',
        product_id: 'prod-2',
        sku: 'MBP16-512-SG',
        price: 2499.99,
        weight_kg: 2.2,
        height_cm: 35.5,
        width_cm: 22.0,
        depth_cm: 1.7,
        color: 'Space Gray',
        ltl_flag: false,
        inventory_qty: 10,
        created_at: '2024-01-12T00:00:00Z'
      },
      {
        id: 'var-3',
        product_id: 'prod-3',
        sku: 'SAM65QLED',
        price: 1299.99,
        weight_kg: 25.0,
        height_cm: 95.0,
        width_cm: 145.0,
        depth_cm: 10.0,
        color: 'Black',
        ltl_flag: true,
        inventory_qty: 5,
        created_at: '2024-01-15T00:00:00Z'
      }
    ];
    
    const filteredVariants = mockVariants.filter(variant => variant.product_id === productId);
    return Promise.resolve({ data: filteredVariants, error: null });
  }
  return supabase.from('product_variants').select('*').eq('product_id', productId);
};

// Order functions
export const getOrders = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('orders').select(`
    *,
    customers(name),
    order_items(*)
  `);
};

export const getOrderById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('orders').select(`
    *,
    customers(name),
    order_items(*)
  `).eq('id', id).single();
};

export const getOrdersByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('orders').select(`
    *,
    customers(name),
    order_items(*)
  `).eq('retailer_id', retailerId);
};

export const getOrdersByLocation = (locationId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('orders').select(`
    *,
    customers(name),
    order_items(*)
  `).eq('location_id', locationId);
};

// Order item functions
export const getOrderItems = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('order_items').select('*');
};

export const getOrderItemsByOrder = (orderId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('order_items').select('*').eq('order_id', orderId);
};

// Shipping functions
export const getShippingProviders = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('shipping_providers').select('*');
};

export const createShippingProvider = async (provider: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_providers').insert(provider).select().single();
};

export const updateShippingProvider = async (id: string, provider: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_providers').update(provider).eq('id', id).select().single();
};

export const deleteShippingProvider = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_providers').delete().eq('id', id);
};

export const getShippingMethods = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('shipping_methods').select('*');
};

export const createShippingMethod = async (method: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_methods').insert(method).select().single();
};

export const updateShippingMethod = async (id: string, method: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_methods').update(method).eq('id', id).select().single();
};

export const deleteShippingMethod = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_methods').delete().eq('id', id);
};

export const getShippingQuotes = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('shipping_quotes').select('*');
};

export const createShippingQuote = async (quote: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('shipping_quotes').insert(quote).select().single();
};

export const getFulfillments = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('fulfillments').select('*');
};

export const createFulfillment = async (fulfillment: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('fulfillments').insert(fulfillment).select().single();
};

export const updateFulfillment = async (id: string, fulfillment: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('fulfillments').update(fulfillment).eq('id', id).select().single();
};

// Claims functions
export const getClaims = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('claims').select(`
    *,
    orders(id, status),
    products(name, sku)
  `);
};

export const getClaimById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('claims').select(`
    *,
    orders(id, status),
    products(name, sku),
    shipments(tracking_number, carrier, status)
  `).eq('id', id).single();
};

export const getClaimsByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('claims').select(`
    *,
    orders(id, status),
    products(name, sku)
  `).eq('retailer_id', retailerId);
};

export const createClaim = async (claim: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('claims').insert(claim).select().single();
};

export const updateClaim = async (id: string, claim: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('claims').update(claim).eq('id', id).select().single();
};

export const deleteClaim = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('claims').delete().eq('id', id);
};

// Audit log functions
export const getAuditLogs = (entity: string, entityId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('audit_logs').select(`
    *,
    users(email, role)
  `)
  .eq('entity', entity)
  .eq('entity_id', entityId)
  .order('created_at', { ascending: false });
};

export const createAuditLog = async (log: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('audit_logs').insert(log).select().single();
};

// Outbox functions
export const createOutboxEvent = async (event: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('outbox').insert(event).select().single();
};

// Repairs functions
export const getRepairs = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('repairs').select('*');
};

// Tasks functions
export const getTasks = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('tasks').select('*');
};

// File metadata functions
export const getFileMetadata = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('files_metadata').select('*');
};