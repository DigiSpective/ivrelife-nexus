import { getSupabaseClient } from '@/lib/supabase-client';
import { User } from '@/types';
import { 
  mockUser,
  getMockCustomers, 
  getMockCustomerById, 
  createMockCustomer, 
  updateMockCustomer, 
  deleteMockCustomer 
} from '@/lib/mock-data';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-url.supabase.co' && supabaseAnonKey !== 'your-anon-key';

// Use shared Supabase client instead of creating a new one
export const supabase = hasValidCredentials 
  ? getSupabaseClient()
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
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Authentication will not work.');
    return { data: { user: null, session: null }, error: new Error('Supabase not configured') };
  }
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOutLegacy = async () => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Sign out will not work.');
    return { error: new Error('Supabase not configured') };
  }
  return await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock user.');
    // Return mock user when no valid credentials
    return mockUser;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get user data directly from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role, retailer_id, location_id')
    .eq('id', user.id)
    .single();
  
  if (userError) {
    console.error('Error fetching user data:', userError);
    return null;
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
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    console.log('Mock customers being returned:', getMockCustomers());
    return Promise.resolve({ data: getMockCustomers(), error: null });
  }
  
  try {
    const result = await supabase.from('customers').select('*');
    // If the query succeeds but there's an error (like table doesn't exist), fall back to mock
    if (result.error) {
      console.warn('Supabase query failed, falling back to mock data:', result.error);
      return Promise.resolve({ data: getMockCustomers(), error: null });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock data:', error);
    return Promise.resolve({ data: getMockCustomers(), error: null });
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

export const getCustomersByRetailer = (retailerId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    const customers = getMockCustomers().filter(customer => customer.retailer_id === retailerId);
    return Promise.resolve({ data: customers, error: null });
  }
  return supabase.from('customers').select('*').eq('retailer_id', retailerId);
};

// Add new customer-related functions after the existing customer functions
export const createCustomer = async (customer: any) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Using mock storage.');
    console.log('Creating customer with data:', customer);
    const newCustomer = createMockCustomer(customer);
    console.log('New customer created:', newCustomer);
    console.log('All customers after creation:', getMockCustomers());
    return Promise.resolve({ data: newCustomer, error: null });
  }
  
  try {
    const result = await supabase.from('customers').insert(customer).select().single();
    // If the query succeeds but there's an error (like table doesn't exist), fall back to mock
    if (result.error) {
      console.warn('Supabase create failed, falling back to mock storage:', result.error);
      console.log('Creating customer with data:', customer);
      const newCustomer = createMockCustomer(customer);
      console.log('New customer created:', newCustomer);
      return Promise.resolve({ data: newCustomer, error: null });
    }
    return result;
  } catch (error) {
    console.warn('Supabase connection failed, falling back to mock storage:', error);
    console.log('Creating customer with data:', customer);
    const newCustomer = createMockCustomer(customer);
    console.log('New customer created:', newCustomer);
    return Promise.resolve({ data: newCustomer, error: null });
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
export const getAuditLogs = (entity: string, entityId: string) => {
  if (!hasValidCredentials) {
    console.warn('Supabase credentials not configured. Returning mock data.');
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from('audit_logs')
    .select('*, users(email, role)')
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