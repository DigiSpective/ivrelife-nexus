import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { User } from '@/types';
import { 
  mockUser,
  getMockCustomers, 
  getMockCustomerById, 
  createMockCustomer, 
  updateMockCustomer, 
  deleteMockCustomer,
  getMockOrders,
  createMockOrder
} from '@/lib/mock-data';
import { sampleProducts } from '@/data/sampleProducts';
import { dataManager } from '@/lib/data-manager';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are valid
const hasValidCredentials = supabaseUrl && supabaseAnonKey && supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

console.log('🔥 Supabase config:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
  hasValidCredentials
});

// Create simple, direct Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Mock client fallback (only used when Supabase operations fail)
const mockSupabaseClient = {
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
          case 'claims':
            return {
              select: function() { 
                // Return mock claims data
                const mockClaims = [
                  {
                    id: 'cl-1',
                    order_id: 'ord-1',
                    created_by: 'usr-1',
                    retailer_id: 'ret-1',
                    status: 'submitted',
                    reason: 'Customer reported damaged packaging',
                    created_at: '2024-03-16T10:00:00Z',
                    updated_at: '2024-03-16T10:00:00Z'
                  }
                ];
                return Promise.resolve({ data: mockClaims, error: null });
              },
              eq: function(field: string, value: any) {
                // For mock implementation, just return the same object
                return this;
              },
              single: function() { 
                // Return the first claim for single queries
                const mockClaims = [
                  {
                    id: 'cl-1',
                    order_id: 'ord-1',
                    created_by: 'usr-1',
                    retailer_id: 'ret-1',
                    status: 'submitted',
                    reason: 'Customer reported damaged packaging',
                    created_at: '2024-03-16T10:00:00Z',
                    updated_at: '2024-03-16T10:00:00Z'
                  }
                ];
                return Promise.resolve({ data: mockClaims[0], error: null });
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
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  } catch (error) {
    console.warn('Supabase authentication failed:', error);
    return { data: { user: null, session: null }, error: error instanceof Error ? error : new Error('Authentication failed') };
  }
};

export const signOutLegacy = async () => {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.warn('Supabase sign out failed:', error);
    return { error: error instanceof Error ? error : new Error('Sign out failed') };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }
    
    // Get user data directly from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, retailer_id, location_id')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.warn('Error fetching user data from Supabase:', userError);
      // Return basic user info from auth if users table doesn't exist yet
      return {
        id: user.id,
        email: user.email || '',
        role: 'owner',
        retailer_id: null,
        location_id: null,
        name: user.user_metadata?.name || user.email || '',
        avatar: user.user_metadata?.avatar_url
      };
    }
    
    return {
      id: userData.id,
      email: userData.email || '',
      role: userData.role || 'location_user',
      retailer_id: userData.retailer_id,
      location_id: userData.location_id,
      name: user.user_metadata?.name || user.email || '',
      avatar: user.user_metadata?.avatar_url
    };
  } catch (error) {
    console.warn('Supabase getCurrentUser failed:', error);
    return null;
  }
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

export const createRetailer = async (retailer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('retailers').insert(retailer).select().single();
};

export const updateRetailer = async (id: string, retailer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('retailers').update(retailer).eq('id', id).select().single();
};

export const deleteRetailer = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('retailers').delete().eq('id', id);
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

export const createLocation = async (location: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('locations').insert(location).select().single();
};

export const updateLocation = async (id: string, location: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('locations').update(location).eq('id', id).select().single();
};

export const deleteLocation = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('locations').delete().eq('id', id);
};

// Customer functions
export const getCustomers = async () => {
  try {
    console.log('getCustomers: Starting...');
    
    // Get current user ID for proper data scoping
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('getCustomers: Current user ID:', userId);
    
    const result = await supabase.from('customers').select('*');
    console.log('getCustomers: Supabase result:', result);
    
    // If the query succeeds but there's an error (like table doesn't exist), fall back to mock
    if (result.error) {
      console.warn('Supabase customers query failed, falling back to persistent storage:', result.error);
      const mockCustomers = await getMockCustomers(userId);
      const safeCustomers = Array.isArray(mockCustomers) ? mockCustomers : [];
      console.log('getCustomers: Returning mock customers due to error:', safeCustomers.length);
      return Promise.resolve({ data: safeCustomers, error: null });
    }
    
    // If we get empty results from Supabase but have mock data, merge them
    if (result.data && result.data.length === 0) {
      console.log('No customers in Supabase, getting mock data...');
      const mockCustomers = await getMockCustomers(userId);
      const safeCustomers = Array.isArray(mockCustomers) ? mockCustomers : [];
      console.log('getCustomers: Got mock customers:', safeCustomers.length);
      
      // Simplify sync - just return mock data for now to fix white page
      return Promise.resolve({ data: safeCustomers, error: null });
    }
    
    console.log('getCustomers: Returning Supabase data:', result.data?.length);
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to persistent storage:', error);
    // Try to get user ID even in error case
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const mockCustomers = await getMockCustomers(userId);
      const safeCustomers = Array.isArray(mockCustomers) ? mockCustomers : [];
      console.log('getCustomers: Exception fallback, returning mock customers:', safeCustomers.length);
      return Promise.resolve({ data: safeCustomers, error: null });
    } catch (authError) {
      console.warn('Could not get user ID, using fallback without user context:', authError);
      const mockCustomers = await getMockCustomers();
      const safeCustomers = Array.isArray(mockCustomers) ? mockCustomers : [];
      return Promise.resolve({ data: safeCustomers, error: null });
    }
  }
};

export const getCustomerById = (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    const customer = getMockCustomerById(id);
    return Promise.resolve({ data: customer, error: customer ? null : new Error('Customer not found') });
  }
  return supabase.from('customers').select('*').eq('id', id).single();
};

export const getCustomersByRetailer = async (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    const mockCustomers = await getMockCustomers();
    const customers = mockCustomers.filter(customer => customer.retailer_id === retailerId);
    return Promise.resolve({ data: customers, error: null });
  }
  return supabase.from('customers').select('*').eq('retailer_id', retailerId);
};

// Add new customer-related functions after the existing customer functions
export const createCustomer = async (customer: any) => {
  console.log('Creating customer with data:', customer);
  
  try {
    // Get current user ID for proper data scoping
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('createCustomer: Current user ID:', userId);
    
    // Try Supabase first
    const result = await supabase.from('customers').insert(customer).select().single();
    
    if (result.error) {
      console.warn('Supabase customer create failed, falling back to persistent storage:', result.error);
      const newCustomer = await createMockCustomer(customer, userId);
      return Promise.resolve({ data: newCustomer, error: null });
    }
    
    console.log('Customer successfully created in Supabase:', result.data);
    
    // Also add to persistent storage for offline access
    try {
      await createMockCustomer(customer, userId);
    } catch (mockError) {
      console.warn('Failed to backup customer to persistent storage:', mockError);
    }
    
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, using persistent storage only:', error);
    // Try to get user ID even in error case for consistency
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackUserId = user?.id || userId;
      const newCustomer = await createMockCustomer(customer, fallbackUserId);
      console.log('Customer created in persistent storage:', newCustomer);
      return Promise.resolve({ data: newCustomer, error: null });
    } catch (authError) {
      console.warn('Could not get user ID for fallback, using no user context:', authError);
      const newCustomer = await createMockCustomer(customer);
      return Promise.resolve({ data: newCustomer, error: null });
    }
  }
};

export const updateCustomer = async (id: string, customer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    const updatedCustomer = updateMockCustomer(id, customer);
    return Promise.resolve({ 
      data: updatedCustomer, 
      error: updatedCustomer ? null : new Error('Customer not found') 
    });
  }
  
  try {
    const result = await supabase.from('customers').update(customer).eq('id', id).select().single();
    if (result.error) {
      console.warn('Supabase update failed, falling back to mock storage:', result.error);
      const updatedCustomer = updateMockCustomer(id, customer);
      return Promise.resolve({ 
        data: updatedCustomer, 
        error: updatedCustomer ? null : new Error('Customer not found') 
      });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    const updatedCustomer = updateMockCustomer(id, customer);
    return Promise.resolve({ 
      data: updatedCustomer, 
      error: updatedCustomer ? null : new Error('Customer not found') 
    });
  }
};

export const deleteCustomer = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    const success = deleteMockCustomer(id);
    return Promise.resolve({ 
      data: null, 
      error: success ? null : new Error('Customer not found') 
    });
  }
  
  try {
    const result = await supabase.from('customers').delete().eq('id', id);
    if (result.error) {
      console.warn('Supabase delete failed, falling back to mock storage:', result.error);
      const success = deleteMockCustomer(id);
      return Promise.resolve({ 
        data: null, 
        error: success ? null : new Error('Customer not found') 
      });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    const success = deleteMockCustomer(id);
    return Promise.resolve({ 
      data: null, 
      error: success ? null : new Error('Customer not found') 
    });
  }
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

// Product functions - Global storage for mock products
let mockProductStorage: any[] = [...sampleProducts];

export const getProducts = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock product data.');
    return Promise.resolve({ data: mockProductStorage, error: null });
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
export const getOrders = async () => {
  console.log('🔥 getOrders called - using REAL Supabase');
  
  try {
    const result = await supabase.from('orders').select(`
      *,
      customers(name),
      order_items(*)
    `);
    console.log('📦 Supabase getOrders result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching orders from Supabase:', error);
    return Promise.resolve({ data: [], error });
  }
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

export const createOrder = async (orderData: Partial<Order>) => {
  console.log('🔥 createOrder called - USING DIRECT FUNCTION to bypass REST API enum issue:', orderData);

  try {
    // WORKAROUND: Use RPC function call to bypass REST API enum caching
    // This calls the create_order_direct PostgreSQL function directly
    const result = await supabase.rpc('create_order_direct', {
      p_retailer_id: orderData.retailer_id,
      p_customer_id: orderData.customer_id,
      p_created_by: orderData.created_by,
      p_total_amount: orderData.total_amount,
      p_notes: orderData.notes || null
    });

    console.log('📦 RPC createOrder result:', result);

    // Log detailed error information if there's an error
    if (result.error) {
      console.error('❌ DETAILED ORDER CREATION ERROR:');
      console.error('Error message:', result.error.message);
      console.error('Error details:', result.error.details);
      console.error('Error hint:', result.error.hint);
      console.error('Error code:', result.error.code);
      console.error('Full error object:', result.error);
    }

    // Transform RPC result to match expected format
    if (result.data && result.data.length > 0) {
      const orderInfo = result.data[0];
      return {
        data: {
          id: orderInfo.order_id,
          status: orderInfo.order_status,
          created_at: orderInfo.order_created_at,
          ...orderData
        },
        error: null
      };
    }

    return result;
  } catch (error) {
    console.error('❌ Exception creating order in Supabase:', error);
    return Promise.resolve({ data: null, error });
  }
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

export const getFulfillments = async () => {
  try {
    // Try Supabase first
    const result = await supabase.from('fulfillments').select('*');
    
    if (result.error) {
      console.warn('Supabase fulfillments query failed, falling back to persistent storage:', result.error);
      const fulfillments = await dataManager.getFulfillments();
      console.log('Fulfillments from persistent storage:', fulfillments.length);
      return Promise.resolve({ data: fulfillments, error: null });
    }
    
    // If we get empty results from Supabase but have local data, merge them
    if (result.data && result.data.length === 0) {
      console.log('No fulfillments in Supabase, checking persistent storage for existing data');
      const localFulfillments = await dataManager.getFulfillments();
      if (localFulfillments.length > 0) {
        console.log('Found fulfillments in persistent storage, syncing to Supabase');
        // Sync local fulfillments to Supabase
        for (const fulfillment of localFulfillments) {
          try {
            await supabase.from('fulfillments').insert(fulfillment);
          } catch (syncError) {
            console.warn('Failed to sync fulfillment to Supabase:', syncError);
          }
        }
      }
      return Promise.resolve({ data: localFulfillments, error: null });
    }
    
    console.log('Successfully retrieved fulfillments from Supabase:', result.data?.length);
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to persistent storage:', error);
    const fulfillments = await dataManager.getFulfillments();
    console.log('Fulfillments from persistent storage fallback:', fulfillments.length);
    return Promise.resolve({ data: fulfillments, error: null });
  }
};

export const createFulfillment = async (fulfillment: any) => {
  console.log('Creating fulfillment with data:', fulfillment);

  // Prepare fulfillment data - let database generate ID and timestamps
  const newFulfillment = {
    ...fulfillment
  };

  // Remove id, created_at, updated_at - let the database handle these
  delete newFulfillment.id;
  delete newFulfillment.created_at;
  delete newFulfillment.updated_at;

  console.log('Prepared fulfillment for insert:', newFulfillment);

  try {
    // Try Supabase first
    const result = await supabase.from('fulfillments').insert(newFulfillment).select().single();
    
    if (result.error) {
      console.error('Supabase fulfillment creation failed:', result.error);
      // Generate a temporary ID for local storage
      const fallbackFulfillment = {
        ...newFulfillment,
        id: `fulfillment-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await dataManager.addFulfillment(fallbackFulfillment);
      console.log('Fulfillment added to persistent storage:', fallbackFulfillment);
      return Promise.resolve({ data: fallbackFulfillment, error: null });
    }

    console.log('✅ Fulfillment successfully created in Supabase:', result.data);

    // Also add to persistent storage for offline access
    try {
      await dataManager.addFulfillment(result.data);
    } catch (mockError) {
      console.warn('Failed to backup fulfillment to persistent storage:', mockError);
    }

    return result;
  } catch (error) {
    console.warn('Supabase connection failed, using persistent storage only:', error);
    try {
      await dataManager.addFulfillment(newFulfillment);
      console.log('Fulfillment created in persistent storage:', newFulfillment);
      return Promise.resolve({ data: newFulfillment, error: null });
    } catch (storageError) {
      console.error('Failed to create fulfillment in persistent storage:', storageError);
      return Promise.resolve({ data: null, error: storageError });
    }
  }
};

export const updateFulfillment = async (id: string, fulfillment: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('fulfillments').update(fulfillment).eq('id', id).select().single();
};

// Claims functions
export const getClaims = async () => {
  console.log('🔍 getClaims() called');

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Return mock claims data
    const mockClaims = [
      {
        id: 'cl-1',
        order_id: 'ord-1',
        created_by: 'usr-1',
        retailer_id: 'ret-1',
        status: 'submitted',
        reason: 'Customer reported damaged packaging',
        created_at: '2024-03-16T10:00:00Z',
        updated_at: '2024-03-16T10:00:00Z'
      }
    ];
    console.log('✅ Returning mock claims:', mockClaims.length);
    return Promise.resolve({ data: mockClaims, error: null });
  }

  const result = await supabase.from('claims').select(`
    *,
    orders(id, status)
  `);

  if (result.error) {
    console.error('❌ getClaims() error:', result.error);
  } else {
    console.log('✅ getClaims() fetched:', result.data?.length || 0, 'claims');
  }

  return result;
};

export const getClaimById = async (id: string) => {
  console.log('🔍 getClaimById() called with id:', id);

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Return mock claim data
    const mockClaims = [
      {
        id: 'cl-1',
        order_id: 'ord-1',
        created_by: 'usr-1',
        retailer_id: 'ret-1',
        status: 'submitted',
        reason: 'Customer reported damaged packaging',
        created_at: '2024-03-16T10:00:00Z',
        updated_at: '2024-03-16T10:00:00Z'
      }
    ];

    const claim = mockClaims.find(c => c.id === id) || null;
    return Promise.resolve({ data: claim, error: null });
  }

  const result = await supabase.from('claims').select(`
    *,
    orders(id, status)
  `).eq('id', id).single();

  if (result.error) {
    console.error('❌ getClaimById() error:', result.error);
  } else {
    console.log('✅ getClaimById() fetched claim:', result.data);
  }

  return result;
};

export const getClaimsByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Return mock claims data filtered by retailer
    const mockClaims = [
      {
        id: 'cl-1',
        order_id: 'ord-1',
        created_by: 'usr-1',
        retailer_id: 'ret-1',
        status: 'submitted',
        reason: 'Customer reported damaged packaging',
        created_at: '2024-03-16T10:00:00Z',
        updated_at: '2024-03-16T10:00:00Z'
      }
    ];
    
    const filteredClaims = mockClaims.filter(c => c.retailer_id === retailerId);
    return Promise.resolve({ data: filteredClaims, error: null });
  }
  return supabase.from('claims').select(`
    *,
    orders(id, status),
    products(name, sku)
  `).eq('retailer_id', retailerId);
};

export const createClaim = async (claim: any) => {
  console.log('🔍 createClaim() called with:', claim);

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    // Return mock claim creation
    const newClaim = {
      id: 'cl-' + (Math.floor(Math.random() * 1000) + 2),
      ...claim,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('✅ Mock claim created:', newClaim);
    return Promise.resolve({ data: newClaim, error: null });
  }

  const result = await supabase.from('claims').insert(claim).select().single();

  if (result.error) {
    console.error('❌ createClaim() error:', result.error);
    console.error('❌ Error message:', result.error.message);
    console.error('❌ Error code:', result.error.code);
    console.error('❌ Error details:', result.error.details);
  } else {
    console.log('✅ Claim created successfully:', result.data);
  }

  return result;
};

export const updateClaim = async (id: string, claim: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    // Return mock claim update
    const updatedClaim = {
      id,
      ...claim,
      updated_at: new Date().toISOString()
    };
    return Promise.resolve({ data: updatedClaim, error: null });
  }
  return supabase.from('claims').update(claim).eq('id', id).select().single();
};

export const deleteClaim = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    // Return mock claim deletion
    return Promise.resolve({ error: null });
  }
  return supabase.from('claims').delete().eq('id', id);
};

// User functions
export const getUsers = async () => {
  console.log('🔍 getUsers() called');
  if (!hasValidCredentials) {
    console.warn('❌ Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }

  console.log('✅ Fetching users from Supabase...');
  const result = await supabase.from('users').select('*');
  console.log('🔍 getUsers() result:', result);
  console.log('🔍 getUsers() data count:', result.data?.length || 0);

  if (result.error) {
    console.error('❌ getUsers() error:', result.error);
    console.error('❌ Error message:', result.error.message);
    console.error('❌ Error code:', result.error.code);
    console.error('❌ Error hint:', result.error.hint);
    console.error('❌ Error details:', result.error.details);
  }

  return result;
};

export const getUsersByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('users').select('*').eq('retailer_id', retailerId);
};

export const createUser = async (user: any) => {
  console.log('🔍 createUser() called with:', user);

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }

  // Helper function to validate and clean UUID
  const cleanUuid = (value: any): string | null => {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    // Check if it's a valid UUID format (8-4-4-4-12 characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) return value;
    // If it's not a valid UUID, return null
    console.warn(`Invalid UUID format: "${value}", setting to null`);
    return null;
  };

  try {
    // For now, create user in database and send invite email
    // The auth user will be created when they accept the invite
    console.log('📝 Creating user record and sending invite...');

    // Generate a temporary ID for the user
    const tempUserId = crypto.randomUUID();

    const cleanUser = {
      id: tempUserId,
      email: user.email,
      name: user.name,
      role: user.role || 'location',
      status: 'active', // Use 'active' status - valid values are likely: active, inactive, suspended
      is_active: true, // Set as active so they can log in with the invite
      account_locked: false,
      login_attempts: 0,
      two_factor_enabled: false,
      phone: user.phone || null,
      department: user.department || null,
      retailer_id: cleanUuid(user.retailer_id),
      location_id: cleanUuid(user.location_id),
      avatar: null,
    };

    console.log('✅ Inserting user into database:', cleanUser);

    // Insert user into database
    const result = await supabase.from('users').insert(cleanUser).select().single();

    if (result.error) {
      console.error('❌ createUser() error:', result.error);
      return { data: null, error: result.error };
    }

    // If this is a retailer user, create a retailer profile
    if (user.role === 'retailer') {
      console.log('📋 Creating retailer profile for user:', tempUserId);
      const retailerData = {
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        address: null,
        status: 'active',
        settings: {},
      };

      const retailerResult = await supabase.from('retailers').insert(retailerData).select().single();

      if (retailerResult.error) {
        console.error('⚠️ Failed to create retailer profile:', retailerResult.error);
        // Don't fail the whole operation, user is still created
      } else {
        console.log('✅ Retailer profile created:', retailerResult.data);

        // Update the user's retailer_id to point to the newly created retailer
        const updateResult = await supabase
          .from('users')
          .update({ retailer_id: retailerResult.data.id })
          .eq('id', tempUserId);

        if (updateResult.error) {
          console.error('⚠️ Failed to link user to retailer:', updateResult.error);
        } else {
          console.log('✅ User linked to retailer:', retailerResult.data.id);
        }
      }
    }

    // Send invite email via Supabase Auth
    console.log('📧 Sending invite email to:', user.email);
    const { data: inviteData, error: inviteError } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        data: {
          name: user.name,
          role: user.role,
          user_id: tempUserId, // Pass the user ID so we can link it later
        }
      }
    });

    if (inviteError) {
      console.warn('⚠️ Failed to send invite email:', inviteError);
      // Don't fail the whole operation, user is still created
    } else {
      console.log('✅ Invite email sent successfully');
    }

    console.log('✅ User created successfully:', result.data);
    return result;
  } catch (error) {
    console.error('❌ Unexpected error creating user:', error);
    return { data: null, error };
  }
};

export const updateUser = async (id: string, user: any) => {
  console.log('🔍 updateUser() called with id:', id, 'user:', user);

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }

  // Helper function to validate and clean UUID
  const cleanUuid = (value: any): string | null => {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(value)) return value;
    console.warn(`Invalid UUID format: "${value}", setting to null`);
    return null;
  };

  // Clean the update data
  const cleanUpdate = {
    name: user.name,
    email: user.email,
    role: user.role,
    retailer_id: cleanUuid(user.retailer_id),
    location_id: cleanUuid(user.location_id),
    // Don't update these fields if not provided
    ...(user.phone !== undefined && { phone: user.phone }),
    ...(user.department !== undefined && { department: user.department }),
    ...(user.is_active !== undefined && { is_active: user.is_active }),
    ...(user.status !== undefined && { status: user.status }),
  };

  console.log('✅ Cleaned update data:', cleanUpdate);

  const result = await supabase.from('users').update(cleanUpdate).eq('id', id).select().single();

  if (result.error) {
    console.error('❌ updateUser() error:', result.error);
  } else {
    console.log('✅ User updated successfully:', result.data);
  }

  return result;
};

export const deleteUser = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ error: new Error('Supabase not configured') });
  }
  return supabase.from('users').delete().eq('id', id);
};

// User profile functions
export const getUserProfile = async (userId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('users').select('*').eq('id', userId).single();
};

export const updateUserProfile = async (userId: string, userData: Partial<User>) => {
  console.log('🔍 updateUserProfile() called with:', { userId, userData });

  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }

  const result = await supabase.from('users').update(userData).eq('id', userId).select().single();

  if (result.error) {
    console.error('❌ updateUserProfile() error:', result.error);
    console.error('❌ Error message:', result.error.message);
    console.error('❌ Error code:', result.error.code);
    console.error('❌ Error details:', result.error.details);
  } else {
    console.log('✅ User profile updated successfully:', result.data);
  }

  return result;
};

// User features functions
export const getUserFeatures = async (userId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('user_features').select('*').eq('user_id', userId);
};

export const updateUserFeature = async (featureId: string, enabled: boolean) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('user_features').update({ enabled }).eq('id', featureId).select().single();
};

export const createUserFeature = async (feature: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('user_features').insert(feature).select().single();
};

// User notifications functions
export const getUserNotifications = async (userId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('user_notifications').select('*').eq('user_id', userId);
};

export const updateUserNotification = async (notificationId: string, enabled: boolean) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('user_notifications').update({ enabled }).eq('id', notificationId).select().single();
};

export const createUserNotification = async (notification: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('user_notifications').insert(notification).select().single();
};

// System settings functions
export const getSystemSettings = async () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('system_settings').select('*');
};

export const getSystemSettingByKey = async (key: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: null, error: null });
  }
  return supabase.from('system_settings').select('*').eq('key', key).single();
};

export const updateSystemSetting = async (key: string, value: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('system_settings').update({ value }).eq('key', key).select().single();
};

export const createSystemSetting = async (setting: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('system_settings').insert(setting).select().single();
};

// Audit log functions
export const getAuditLogs = (entity?: string, entityId?: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    // Return mock audit logs for development
    const mockAuditLogs = [
      {
        id: 'audit-1',
        entity_type: 'user',
        entity_id: 'usr-1',
        action: 'created',
        actor_id: 'usr-1',
        details: { name: 'John Doe', email: 'john@example.com' },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'audit-2',
        entity_type: 'order',
        entity_id: 'ord-1',
        action: 'updated',
        actor_id: 'usr-1',
        details: { status: 'processing' },
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'audit-3',
        entity_type: 'system_settings',
        entity_id: 'setting-1',
        action: 'updated',
        actor_id: 'usr-1',
        details: { key: 'maintenance_mode', value: false },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ];
    return Promise.resolve({ data: mockAuditLogs, error: null });
  }
  
  let query = supabase.from('audit_logs')
    .select('*, users(email, role)')
    .order('created_at', { ascending: false });
    
  if (entity) {
    query = query.eq('entity_type', entity);
  }
  
  if (entityId) {
    query = query.eq('entity_id', entityId);
  }
  
  return query;
};

export const getAllAuditLogs = () => {
  return getAuditLogs();
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

// Contract functions
export const uploadContract = async (file: File, retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  
  // Mock implementation for contract upload
  console.log('Mock contract upload for retailer:', retailerId, 'file:', file.name);
  return Promise.resolve({ 
    data: { 
      path: `mock-path/${retailerId}/contracts/${file.name}`, 
      url: `https://mock-storage.com/contracts/${retailerId}/${file.name}` 
    }, 
    error: null 
  });
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

// Password update function
export const updatePassword = async (userId: string, newPasswordHash: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('users').update({ password_hash: newPasswordHash }).eq('id', userId).select().single();
};

// File metadata functions
export const getFileMetadata = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('files_metadata').select('*');
};

// Product Management Functions for Admin
export const createProduct = async (productData: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    const newProduct = {
      ...productData,
      id: `product-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockProductStorage.push(newProduct);
    return Promise.resolve({ data: newProduct, error: null });
  }
  
  try {
    const result = await supabase.from('products').insert(productData).select().single();
    if (result.error) {
      console.warn('Supabase create failed, falling back to mock storage:', result.error);
      const newProduct = {
        ...productData,
        id: `product-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      mockProductStorage.push(newProduct);
      return Promise.resolve({ data: newProduct, error: null });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    const newProduct = {
      ...productData,
      id: `product-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockProductStorage.push(newProduct);
    return Promise.resolve({ data: newProduct, error: null });
  }
};

export const updateProduct = async (id: string, productData: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    const index = mockProductStorage.findIndex(product => product.id === id);
    if (index !== -1) {
      mockProductStorage[index] = { ...mockProductStorage[index], ...productData };
      return Promise.resolve({ data: mockProductStorage[index], error: null });
    }
    return Promise.resolve({ data: null, error: new Error('Product not found') });
  }
  
  try {
    const result = await supabase.from('products').update(productData).eq('id', id).select().single();
    if (result.error) {
      console.warn('Supabase update failed, falling back to mock storage:', result.error);
      const index = mockProductStorage.findIndex(product => product.id === id);
      if (index !== -1) {
        mockProductStorage[index] = { ...mockProductStorage[index], ...productData };
        return Promise.resolve({ data: mockProductStorage[index], error: null });
      }
      return Promise.resolve({ data: null, error: new Error('Product not found') });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    const index = mockProductStorage.findIndex(product => product.id === id);
    if (index !== -1) {
      mockProductStorage[index] = { ...mockProductStorage[index], ...productData };
      return Promise.resolve({ data: mockProductStorage[index], error: null });
    }
    return Promise.resolve({ data: null, error: new Error('Product not found') });
  }
};

export const deleteProduct = async (id: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    const index = mockProductStorage.findIndex(product => product.id === id);
    if (index !== -1) {
      mockProductStorage.splice(index, 1);
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: new Error('Product not found') });
  }
  
  try {
    const result = await supabase.from('products').delete().eq('id', id);
    if (result.error) {
      console.warn('Supabase delete failed, falling back to mock storage:', result.error);
      const index = mockProductStorage.findIndex(product => product.id === id);
      if (index !== -1) {
        mockProductStorage.splice(index, 1);
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: new Error('Product not found') });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    const index = mockProductStorage.findIndex(product => product.id === id);
    if (index !== -1) {
      mockProductStorage.splice(index, 1);
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: new Error('Product not found') });
  }
};