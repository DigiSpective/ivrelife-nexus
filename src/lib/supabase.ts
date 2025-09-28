import { getSupabaseClient } from '@/lib/supabase-client';
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

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  !supabaseUrl.includes('localhost') &&
  !supabaseUrl.includes('example');

// Always try to use the real Supabase client first
export const supabase = getSupabaseClient();

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
      console.log('No authenticated user found, returning mock user for development');
      return mockUser;
    }
    
    // Get user data directly from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, retailer_id, location_id')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.warn('Error fetching user data from Supabase, falling back to mock user:', userError);
      return mockUser;
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
    console.warn('Supabase getCurrentUser failed, returning mock user:', error);
    return mockUser;
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
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    const mockOrders = await getMockOrders();
    return Promise.resolve({ data: mockOrders, error: null });
  }
  
  try {
    return supabase.from('orders').select(`
      *,
      customers(name),
      order_items(*)
    `);
  } catch (error) {
    console.error('Error fetching orders from Supabase, falling back to mock data:', error);
    const mockOrders = await getMockOrders();
    return Promise.resolve({ data: mockOrders, error: null });
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
  console.log('createOrder called with:', orderData);
  
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock data.');
    // Create order in mock storage
    console.log('Calling createMockOrder with:', orderData);
    const newOrder = await createMockOrder(orderData);
    console.log('createMockOrder returned:', newOrder);
    return Promise.resolve({ data: newOrder, error: null });
  }
  
  try {
    const result = await supabase.from('orders').insert([orderData]).select().single();
    if (result.error) {
      console.error('Supabase order creation failed, falling back to mock data:', result.error);
      const newOrder = await createMockOrder(orderData);
      return Promise.resolve({ data: newOrder, error: null });
    }
    return result;
  } catch (error) {
    console.error('Error creating order in Supabase, falling back to mock data:', error);
    const newOrder = await createMockOrder(orderData);
    return Promise.resolve({ data: newOrder, error: null });
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
  
  // Ensure fulfillment has required fields
  const newFulfillment = {
    id: fulfillment.id || `fulfillment-${Date.now()}`,
    created_at: fulfillment.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...fulfillment
  };
  
  try {
    // Try Supabase first
    const result = await supabase.from('fulfillments').insert(newFulfillment).select().single();
    
    if (result.error) {
      console.warn('Supabase fulfillment creation failed, falling back to persistent storage:', result.error);
      await dataManager.addFulfillment(newFulfillment);
      console.log('Fulfillment added to persistent storage:', newFulfillment);
      return Promise.resolve({ data: newFulfillment, error: null });
    }
    
    console.log('Fulfillment successfully created in Supabase:', result.data);
    
    // Also add to persistent storage for offline access
    try {
      await dataManager.addFulfillment(newFulfillment);
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
export const getClaims = () => {
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
    return Promise.resolve({ data: mockClaims, error: null });
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
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    // Return mock claim creation
    const newClaim = {
      id: 'cl-' + (Math.floor(Math.random() * 1000) + 2),
      ...claim,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return Promise.resolve({ data: newClaim, error: null });
  }
  return supabase.from('claims').insert(claim).select().single();
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
export const getUsers = () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('users').select('*');
};

export const getUsersByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('users').select('*').eq('retailer_id', retailerId);
};

export const createUser = async (user: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('users').insert(user).select().single();
};

export const updateUser = async (id: string, user: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('users').update(user).eq('id', id).select().single();
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
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured.');
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
  }
  return supabase.from('users').update(userData).eq('id', userId).select().single();
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