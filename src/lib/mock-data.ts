// Mock data for IV RELIFE dashboard demonstration
import { 
  User, 
  AppRole, 
  UserRole, 
  Retailer, 
  Location, 
  Customer, 
  ProductCategory, 
  Product, 
  ProductVariant, 
  Order, 
  OrderItem, 
  OrderStatus, 
  ShippingProvider, 
  ShippingMethod, 
  ShippingQuote, 
  Fulfillment, 
  Claim, 
  Repair, 
  Task, 
  AuditLog, 
  OutboxEvent, 
  FileMetadata 
} from '@/types';
import { dataManager } from './data-manager';

export const mockUser: User = {
  id: 'usr-1',
  email: 'admin@ivrelife.com',
  role: 'owner',
  name: 'Sarah Chen',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
};

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    email: 'admin@ivrelife.com',
    role: 'owner',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'usr-2',
    email: 'manager@ivrelife.com',
    role: 'backoffice',
    name: 'Michael Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'usr-3',
    email: 'store1@retailer.com',
    role: 'retailer',
    name: 'Jennifer Wu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'usr-4',
    email: 'staff@location.com',
    role: 'location',
    name: 'David Thompson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'usr-5',
    email: 'operations@ivrelife.com',
    role: 'backoffice',
    name: 'Lisa Park',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  }
];

export const mockAppRoles: AppRole[] = [
  {
    role_name: 'owner',
    description: 'Full system access'
  },
  {
    role_name: 'backoffice',
    description: 'Backoffice users - cross-location but not owner-level configuration'
  },
  {
    role_name: 'retailer',
    description: 'Retailer admin - manage own locations'
  },
  {
    role_name: 'location',
    description: 'Location staff - operator-level'
  }
];

export const mockUserRoles: UserRole[] = [
  {
    id: 'ur-1',
    user_id: 'usr-1',
    role: 'owner',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'ur-2',
    user_id: 'usr-2',
    role: 'retailer',
    retailer_id: 'ret-1',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockRetailers: Retailer[] = [
  {
    id: 'ret-1',
    name: 'TechHub Electronics',
    website: 'https://techhub.com',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'ret-2', 
    name: 'GadgetZone',
    website: 'https://gadgetzone.com',
    created_at: '2024-02-01T00:00:00Z'
  }
];

export const mockLocations: Location[] = [
  {
    id: 'loc-1',
    retailer_id: 'ret-1',
    name: 'TechHub Downtown',
    address: {
      street: '789 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102'
    },
    phone: '(555) 111-2222',
    timezone: 'America/Los_Angeles',
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 'loc-2',
    retailer_id: 'ret-1',
    name: 'TechHub Mall',
    address: {
      street: '555 Shopping Center',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301'
    },
    phone: '(555) 333-4444',
    timezone: 'America/Los_Angeles',
    created_at: '2024-01-25T00:00:00Z'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    retailer_id: 'ret-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 666-7777',
    default_address: {
      street: '123 Customer Lane',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103',
      country: 'USA'
    },
    notes: 'VIP customer with excellent payment history',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'cust-2',
    retailer_id: 'ret-1',
    name: 'Emily Johnson',
    email: 'emily.johnson@email.com',
    phone: '(555) 888-9999',
    default_address: {
      street: '456 Buyer Street',
      city: 'Oakland',
      state: 'CA',
      zip: '94607',
      country: 'USA'
    },
    notes: 'Regular customer, prefers email communication',
    created_at: '2024-03-05T00:00:00Z',
    updated_at: '2024-03-05T00:00:00Z'
  },
  {
    id: 'cust-3',
    retailer_id: 'ret-1',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '(555) 777-8888',
    default_address: {
      street: '789 Technology Blvd',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301',
      country: 'USA'
    },
    notes: 'Business customer, bulk orders',
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z'
  }
];

// Mock storage for dynamic customer data - using a more persistent approach
// Store in globalThis to survive HMR reloads during development
declare global {
  var __mockCustomerStorage: Customer[] | undefined;
}

// Helper functions for mock customer storage using smart persistence
export const getMockCustomers = async (userId?: string) => {
  try {
    console.log('📦 getMockCustomers called with userId:', userId);
    
    // Use Supabase persistence first, then smart persistence fallback
    const { supabasePersistence } = await import('./supabase-persistence');
    const { smartPersistence } = await import('./smart-persistence');
    const { STORAGE_KEYS } = await import('./persistent-storage');
    const { waitForAuth } = await import('./auth-context-guard');
    
    // Wait for auth to be ready and get current user if no userId provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      console.log('🕰️ Waiting for auth context...');
      const currentUser = await waitForAuth();
      effectiveUserId = currentUser?.id;
      console.log('🔐 Got userId from auth context:', effectiveUserId);
    }
    
    // If still no userId, return empty array to prevent data corruption
    if (!effectiveUserId) {
      console.log('⚠️ No authenticated user - returning empty array to prevent data corruption');
      return [];
    }
    
    // Strategy 1: Try to load from Supabase customers table first
    console.log('🗄️ Trying Supabase customers table...');
    let customers = await supabasePersistence.loadCustomers(effectiveUserId);
    
    if (customers && customers.length > 0) {
      console.log('✅ Found customers in Supabase customers table:', customers.length);
      return customers;
    }
    
    // Strategy 2: Try user_storage table
    console.log('💾 Trying Supabase user_storage table...');
    const storageCustomers = await supabasePersistence.loadFromUserStorage('customers', effectiveUserId);
    if (storageCustomers && Array.isArray(storageCustomers) && storageCustomers.length > 0) {
      console.log('✅ Found customers in user_storage table:', storageCustomers.length);
      
      // Migrate to customers table for better performance
      console.log('🔄 Migrating to customers table...');
      await supabasePersistence.saveCustomers(storageCustomers, effectiveUserId);
      
      return storageCustomers;
    }
    
    // Strategy 3: Fall back to smart persistence (localStorage)
    console.log('📁 Falling back to smart persistence (localStorage)...');
    const rawCustomers = await smartPersistence.get(STORAGE_KEYS.CUSTOMERS, effectiveUserId);
    customers = Array.isArray(rawCustomers) ? rawCustomers : [];
    
    if (customers.length > 0) {
      console.log('✅ Found customers in localStorage:', customers.length);
      
      // Try to migrate to Supabase
      console.log('⬆️ Attempting to migrate localStorage to Supabase...');
      const migrated = await supabasePersistence.saveCustomers(customers, effectiveUserId);
      if (migrated) {
        console.log('✅ Successfully migrated customers to Supabase');
      }
      
      return customers;
    }
    
    // Strategy 4: Check if this is a truly new user
    console.log('🔍 No customers found anywhere - checking if this is a first-time user');
    const hasExistingData = await checkUserHasExistingData(effectiveUserId);
    
    if (!hasExistingData) {
      console.log('🆕 First-time user setup - initializing with mock data');
      
      // Save to Supabase customers table first
      const savedToSupabase = await supabasePersistence.saveCustomers(mockCustomers, effectiveUserId);
      if (savedToSupabase) {
        console.log('✅ Initialized mock customers in Supabase customers table');
      } else {
        // Fall back to smart persistence
        await smartPersistence.set(STORAGE_KEYS.CUSTOMERS, mockCustomers, effectiveUserId);
        console.log('✅ Initialized mock customers in localStorage (fallback)');
      }
      
      return mockCustomers;
    } else {
      console.log('📁 Existing user with no customers - returning empty array (user may have deleted all)');
      return [];
    }
    
  } catch (error) {
    console.warn('❌ Error getting customers:', error);
    // For errors, return empty array instead of mock data to prevent corruption
    console.log('🚫 Returning empty array due to error (safer than mock data)');
    return [];
  }
};

// Helper function to check if user has any existing data
async function checkUserHasExistingData(userId: string): Promise<boolean> {
  try {
    // Check localStorage for any user-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(userId) || key.includes('iv-relife'))) {
        console.log('📁 Found existing data key:', key);
        return true;
      }
    }
    
    // Could also check Supabase user_storage table here
    console.log('🆕 No existing data found for user');
    return false;
  } catch (error) {
    console.warn('❌ Error checking existing data:', error);
    return true; // Err on side of caution - assume user has data
  }
}

export const getMockCustomerById = async (id: string, userId?: string) => {
  try {
    const customers = await getMockCustomers(userId);
    return customers.find(customer => customer.id === id) || null;
  } catch (error) {
    console.warn('Error getting customer by ID, falling back to static mock data:', error);
    return mockCustomers.find(customer => customer.id === id) || null;
  }
};

export const createMockCustomer = async (customerData: Partial<Customer>, userId?: string): Promise<Customer> => {
  try {
    console.log('💾 Creating customer with userId:', userId);
    
    // Use Supabase persistence first, then smart persistence fallback
    const { supabasePersistence } = await import('./supabase-persistence');
    const { smartPersistence } = await import('./smart-persistence');
    const { STORAGE_KEYS } = await import('./persistent-storage');
    const { waitForAuth } = await import('./auth-context-guard');
    
    // Ensure we have authenticated user context
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const currentUser = await waitForAuth();
      effectiveUserId = currentUser?.id;
    }
    
    if (!effectiveUserId) {
      throw new Error('Cannot create customer: No authenticated user');
    }
    
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      retailer_id: customerData.retailer_id || '550e8400-e29b-41d4-a716-446655440000',
      primary_location_id: customerData.primary_location_id,
      name: customerData.name || '',
      email: customerData.email,
      phone: customerData.phone,
      default_address: customerData.default_address,
      notes: customerData.notes,
      external_ids: customerData.external_ids,
      created_by: effectiveUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Get existing customers
    const existingCustomers = await getMockCustomers(effectiveUserId) || [];
    const updatedCustomers = [...existingCustomers, newCustomer];
    
    // Strategy 1: Save to Supabase customers table
    console.log('🗄️ Saving customers to Supabase customers table...');
    const supabaseSuccess = await supabasePersistence.saveCustomers(updatedCustomers, effectiveUserId);
    
    if (supabaseSuccess) {
      console.log('✅ Customer created and saved to Supabase customers table');
      return newCustomer;
    }
    
    // Strategy 2: Fall back to smart persistence
    console.log('📁 Falling back to smart persistence...');
    const smartSuccess = await smartPersistence.set(STORAGE_KEYS.CUSTOMERS, updatedCustomers, effectiveUserId);
    
    if (smartSuccess) {
      console.log('✅ Customer created and saved to localStorage (fallback)');
      return newCustomer;
    }
    
    throw new Error('Failed to save customer to any storage method');
    
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
};

export const updateMockCustomer = (id: string, customerData: Partial<Customer>): Customer | null => {
  const storage = initializeMockCustomers();
  const index = storage.findIndex(customer => customer.id === id);
  if (index === -1) return null;
  
  const updatedCustomer = {
    ...storage[index],
    ...customerData,
    updated_at: new Date().toISOString()
  };
  
  storage[index] = updatedCustomer;
  console.log('Customer updated in storage:', updatedCustomer);
  return updatedCustomer;
};

export const deleteMockCustomer = (id: string): boolean => {
  const storage = initializeMockCustomers();
  const index = storage.findIndex(customer => customer.id === id);
  if (index === -1) return false;
  
  storage.splice(index, 1);
  console.log('Customer deleted from storage. Total customers:', storage.length);
  return true;
};

// Order functions with global storage for HMR persistence
declare global {
  var __mockOrderStorage: Order[] | undefined;
}

// Helper functions for mock order storage using persistent dataManager
export const getMockOrders = async (userId?: string): Promise<Order[]> => {
  try {
    const effectiveUserId = userId || 'usr-1';
    console.log('📦 getMockOrders called with userId:', effectiveUserId);
    
    // Strategy 1: Try Supabase orders table first
    const { supabasePersistence } = await import('./supabase-persistence');
    const supabaseOrders = await supabasePersistence.loadOrders(effectiveUserId);
    
    if (supabaseOrders && supabaseOrders.length > 0) {
      console.log('✅ Loaded orders from Supabase orders table:', supabaseOrders.length);
      return supabaseOrders.map(order => ({
        ...order,
        orderItems: order.items || [],
        customer: mockCustomers.find(c => c.id === order.customer_id) || mockCustomers[0],
        retailer: mockRetailers.find(r => r.id === order.retailer_id) || mockRetailers[0],
        location: mockLocations.find(l => l.id === order.location_id) || mockLocations[0],
        status: order.status || 'pending',
        totalAmount: order.total_amount || order.totalAmount || 0,
        id: order.id,
        orderDate: order.created_at || order.orderDate,
        createdAt: order.created_at || order.createdAt || new Date().toISOString(),
        updatedAt: order.updated_at || order.updatedAt || new Date().toISOString(),
        title: order.title || `Order ${order.id}`,
        description: order.description || order.items?.map((item: any) => `${item.product} x${item.qty}`).join(', ') || 'No items'
      }));
    }
    
    // Strategy 2: Try persistent storage
    const { persistentStorage, STORAGE_KEYS } = await import('./persistent-storage');
    const orders = await persistentStorage.get(STORAGE_KEYS.ORDERS, userId) || [];
    console.log('getMockOrders called, returning:', orders.length, 'orders from storage');
    
    // If no orders in persistent storage, return static mock data immediately
    if (orders.length === 0) {
      console.log('No orders in storage, returning static mock orders directly:', mockOrders.length, 'orders');
      
      // Try to save them to storage in the background, but don't wait for it
      try {
        for (const order of mockOrders) {
          await dataManager.addOrder(order, userId);
        }
        console.log('✅ Mock orders saved to storage for future use');
      } catch (saveError) {
        console.warn('⚠️ Failed to save mock orders to storage, but continuing with static data:', saveError);
      }
      
      return mockOrders;
    }
    
    return orders;
  } catch (error) {
    console.warn('Error getting orders from persistent storage, falling back to static mock data:', error);
    console.log('Returning static mock orders:', mockOrders.length, 'orders');
    return mockOrders;
  }
};

export const getMockOrderById = (id: string): Order | null => {
  const storage = initializeMockOrders();
  return storage.find(order => order.id === id) || null;
};

export const createMockOrder = async (orderData: Partial<Order>, userId?: string): Promise<Order> => {
  console.log('createMockOrder function called with:', orderData);
  
  try {
    const effectiveUserId = userId || 'usr-1';
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      retailer_id: orderData.retailer_id || 'ret-1',
      location_id: orderData.location_id || 'loc-1',
      customer_id: orderData.customer_id || 'cust-1',
      created_by: effectiveUserId,
      status: orderData.status || 'pending',
      subtotal_amount: orderData.subtotal_amount || 0,
      tax_amount: orderData.tax_amount || 0,
      total_amount: orderData.total_amount || 0,
      notes: orderData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...orderData
    };
    
    // Strategy 1: Save to Supabase orders table first
    const { supabasePersistence } = await import('./supabase-persistence');
    const supabaseSuccess = await supabasePersistence.saveOrders([newOrder], effectiveUserId);
    
    if (supabaseSuccess) {
      console.log('✅ SUCCESS: Order created and saved to Supabase orders table');
      return newOrder;
    }
    
    // Strategy 2: Fall back to data manager
    console.log('⚠️ Supabase save failed, falling back to data manager...');
    await dataManager.addOrder(newOrder, userId);
    console.log('Order added to persistent storage:', newOrder);
    return newOrder;
  } catch (error) {
    console.error('Error in createMockOrder:', error);
    throw error;
  }
};

export const updateMockOrder = (id: string, orderData: Partial<Order>): Order | null => {
  const storage = initializeMockOrders();
  const index = storage.findIndex(order => order.id === id);
  if (index === -1) return null;
  
  const updatedOrder = {
    ...storage[index],
    ...orderData,
    updated_at: new Date().toISOString()
  };
  
  storage[index] = updatedOrder;
  console.log('Order updated in storage:', updatedOrder);
  return updatedOrder;
};

export const deleteMockOrder = (id: string): boolean => {
  const storage = initializeMockOrders();
  const index = storage.findIndex(order => order.id === id);
  if (index === -1) return false;
  
  storage.splice(index, 1);
  console.log('Order deleted from storage. Total orders:', storage.length);
  return true;
};

export const mockProductCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    name: 'Smartphones',
    requires_ltl: false,
    created_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'Laptops',
    requires_ltl: false,
    created_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Televisions',
    requires_ltl: true,
    created_at: '2024-01-10T00:00:00Z'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro',
    description: 'Latest Apple smartphone with A17 Pro chip',
    category_id: 'cat-1',
    created_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'MacBook Pro 16"',
    description: 'Powerful laptop for professionals',
    category_id: 'cat-2',
    created_at: '2024-01-12T00:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Samsung 65" QLED TV',
    description: 'High-quality 4K television',
    category_id: 'cat-3',
    created_at: '2024-01-15T00:00:00Z'
  }
];

export const mockProductVariants: ProductVariant[] = [
  {
    id: 'var-1',
    product_id: 'boss-plus',
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
    product_id: 'arya',
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

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    retailer_id: 'ret-1',
    location_id: 'loc-1',
    customer_id: 'cust-1',
    created_by: 'usr-1',
    status: 'processing',
    total_amount: 3499.98,
    requires_ltl: false,
    created_at: '2024-03-15T10:30:00Z',
    updated_at: '2024-03-15T11:00:00Z'
  },
  {
    id: 'ord-2',
    retailer_id: 'ret-1',
    location_id: 'loc-2',
    customer_id: 'cust-2',
    created_by: 'usr-1',
    status: 'shipped',
    total_amount: 999.99,
    requires_ltl: false,
    created_at: '2024-03-10T14:15:00Z',
    updated_at: '2024-03-11T09:00:00Z'
  }
];

export const mockOrderItems: OrderItem[] = [
  {
    id: 'oi-1',
    order_id: 'ord-1',
    product_variant_id: 'var-2',
    qty: 1,
    unit_price: 2499.99,
    created_at: '2024-03-15T10:30:00Z'
  },
  {
    id: 'oi-2',
    order_id: 'ord-1',
    product_variant_id: 'var-1',
    qty: 1,
    unit_price: 999.99,
    created_at: '2024-03-15T10:30:00Z'
  },
  {
    id: 'oi-3',
    order_id: 'ord-2',
    product_variant_id: 'var-1',
    qty: 1,
    unit_price: 999.99,
    created_at: '2024-03-10T14:15:00Z'
  }
];

export const mockShippingProviders: ShippingProvider[] = [
  {
    id: 'sp-1',
    name: 'UPS',
    api_identifier: 'ups',
    config: {},
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sp-2',
    name: 'FedEx',
    api_identifier: 'fedex',
    config: {},
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sp-3',
    name: 'GenericLTL',
    api_identifier: 'ltl_provider',
    config: {},
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockShippingMethods: ShippingMethod[] = [
  {
    id: 'sm-1',
    provider_id: 'sp-1',
    name: 'UPS Ground',
    speed_estimate: '1-5 business days',
    supports_ltl: false,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sm-2',
    provider_id: 'sp-1',
    name: 'UPS Next Day Air',
    speed_estimate: 'Next business day',
    supports_ltl: false,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sm-3',
    provider_id: 'sp-3',
    name: 'LTL Standard',
    speed_estimate: '5-10 business days',
    supports_ltl: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockShippingQuotes: ShippingQuote[] = [
  {
    id: 'sq-1',
    order_id: 'ord-1',
    provider_id: 'sp-1',
    method_id: 'sm-1',
    total_price: 25.99,
    raw_quote: {},
    generated_at: '2024-03-15T11:00:00Z'
  }
];

export const mockFulfillments: Fulfillment[] = [
  {
    id: 'ful-1',
    order_id: 'ord-2',
    provider_id: 'sp-1',
    method_id: 'sm-1',
    tracking_number: '1Z999AA1234567890',
    status: 'in_transit',
    last_status_raw: {},
    last_check: '2024-03-12T10:00:00Z',
    created_at: '2024-03-11T09:00:00Z',
    updated_at: '2024-03-12T10:00:00Z'
  }
];

export const mockClaims: any[] = [
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

export const mockRepairs: Repair[] = [
  {
    id: 'rep-1',
    order_id: 'ord-1',
    submitted_by: 'usr-1',
    assigned_to: 'tech-1',
    status: 'in_progress',
    photos: [],
    notes: 'Screen replacement needed',
    created_at: '2024-03-16T11:00:00Z',
    updated_at: '2024-03-16T11:30:00Z'
  }
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Process new order',
    description: 'Order #ord-1 needs to be processed',
    related_entity_type: 'order',
    related_entity_id: 'ord-1',
    created_by: 'usr-1',
    status: 'open',
    due_date: '2024-03-17T10:00:00Z',
    created_at: '2024-03-15T11:00:00Z',
    updated_at: '2024-03-15T11:00:00Z'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'al-1',
    entity_type: 'order',
    entity_id: 'ord-1',
    action: 'created',
    actor_id: 'usr-1',
    actor_role: 'owner',
    payload: {},
    created_at: '2024-03-15T10:30:00Z'
  }
];

export const mockOutboxEvents: OutboxEvent[] = [
  {
    id: 'oe-1',
    event_type: 'order_created',
    payload: {},
    targeted_retailer: 'ret-1',
    processed: false,
    created_at: '2024-03-15T10:30:00Z'
  }
];

export const mockFilesMetadata: FileMetadata[] = [
  {
    id: 'fm-1',
    supabase_storage_path: 'contracts/contract-ord-1.pdf',
    bucket: 'files',
    uploaded_by: 'usr-1',
    retailer_id: 'ret-1',
    purpose: 'contract',
    content_type: 'application/pdf',
    size_bytes: 102400,
    created_at: '2024-03-15T10:45:00Z'
  }
];

// ============================================================================
// COMPREHENSIVE SUPABASE PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Get mock claims with comprehensive Supabase persistence
 */
export const getMockClaims = async (userId?: string): Promise<any[]> => {
  try {
    console.log('📦 getMockClaims called with userId:', userId);
    
    // Get effective user ID
    const { getCurrentUserId } = await import('./auth-context-guard');
    const effectiveUserId = userId || getCurrentUserId();
    
    if (!effectiveUserId) {
      console.log('No authenticated user, returning static mock data');
      return mockClaims;
    }
    
    // Use Supabase persistence first
    const { supabasePersistence } = await import('./supabase-persistence');
    console.log('🗄️ Loading claims from Supabase claims table...');
    
    const claims = await supabasePersistence.loadClaims(effectiveUserId);
    
    if (claims && claims.length > 0) {
      console.log('✅ Claims loaded from Supabase claims table:', claims.length);
      return claims;
    }
    
    // Strategy 2: Try user_storage table fallback
    console.log('📁 Trying user_storage fallback...');
    const fallbackClaims = await supabasePersistence.loadFromUserStorage('claims', effectiveUserId);
    
    if (fallbackClaims && fallbackClaims.length > 0) {
      console.log('✅ Claims loaded from user_storage fallback:', fallbackClaims.length);
      // Migrate to Supabase claims table
      await supabasePersistence.saveClaims(fallbackClaims, effectiveUserId);
      return fallbackClaims;
    }
    
    // Strategy 3: Check localStorage
    console.log('💾 Checking localStorage...');
    const { smartPersistence, STORAGE_KEYS } = await import('./smart-persistence');
    const localClaims = await smartPersistence.get('claims', effectiveUserId);
    
    if (localClaims && localClaims.length > 0) {
      console.log('✅ Claims loaded from localStorage:', localClaims.length);
      // Migrate to Supabase
      await supabasePersistence.saveClaims(localClaims, effectiveUserId);
      return localClaims;
    }
    
    // Strategy 4: Check if this is a truly new user (no data anywhere)
    console.log('📋 No existing claims found, checking if new user...');
    return [];
    
  } catch (error) {
    console.warn('Error loading claims, falling back to static mock data:', error);
    return mockClaims;
  }
};

/**
 * Create mock claim with comprehensive Supabase persistence
 */
export const createMockClaim = async (claimData: any, userId?: string): Promise<any> => {
  try {
    console.log('💾 Creating claim with userId:', userId);
    
    // Get effective user ID
    const { getCurrentUserId } = await import('./auth-context-guard');
    const effectiveUserId = userId || getCurrentUserId();
    
    if (!effectiveUserId) {
      throw new Error('No authenticated user for creating claims');
    }
    
    // Create new claim with defaults
    const newClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retailer_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: effectiveUserId,
      ...claimData
    };
    
    // Get existing claims and add the new one
    const existingClaims = await getMockClaims(effectiveUserId) || [];
    const updatedClaims = [...existingClaims, newClaim];
    
    // Strategy 1: Save to Supabase claims table
    console.log('🗄️ Saving claims to Supabase claims table...');
    const { supabasePersistence } = await import('./supabase-persistence');
    const supabaseSuccess = await supabasePersistence.saveClaims(updatedClaims, effectiveUserId);
    
    if (supabaseSuccess) {
      console.log('✅ Claim created and saved to Supabase claims table');
      return newClaim;
    }
    
    // Strategy 2: Fall back to user_storage
    console.log('📁 Falling back to user_storage...');
    const userStorageSuccess = await supabasePersistence.saveToUserStorage('claims', updatedClaims, effectiveUserId);
    
    if (userStorageSuccess) {
      console.log('✅ Claim created and saved to user_storage (fallback)');
      return newClaim;
    }
    
    // Strategy 3: Fall back to smart persistence
    console.log('💾 Falling back to smart persistence...');
    const { smartPersistence } = await import('./smart-persistence');
    const smartSuccess = await smartPersistence.set('claims', updatedClaims, effectiveUserId);
    
    if (smartSuccess) {
      console.log('✅ Claim created and saved to localStorage (fallback)');
      return newClaim;
    }
    
    throw new Error('Failed to save claim to any storage method');
    
  } catch (error) {
    console.error('❌ Error creating claim:', error);
    throw error;
  }
};

/**
 * Get mock shipments with comprehensive Supabase persistence
 */
export const getMockShipments = async (userId?: string): Promise<any[]> => {
  try {
    console.log('📦 getMockShipments called with userId:', userId);
    
    // Get effective user ID
    const { getCurrentUserId } = await import('./auth-context-guard');
    const effectiveUserId = userId || getCurrentUserId();
    
    if (!effectiveUserId) {
      console.log('No authenticated user, returning empty array');
      return [];
    }
    
    // Use Supabase persistence first
    const { supabasePersistence } = await import('./supabase-persistence');
    console.log('🗄️ Loading shipments from Supabase shipments table...');
    
    const shipments = await supabasePersistence.loadShipments(effectiveUserId);
    
    if (shipments && shipments.length > 0) {
      console.log('✅ Shipments loaded from Supabase shipments table:', shipments.length);
      return shipments;
    }
    
    // Strategy 2: Try user_storage table fallback
    console.log('📁 Trying user_storage fallback...');
    const fallbackShipments = await supabasePersistence.loadFromUserStorage('shipments', effectiveUserId);
    
    if (fallbackShipments && fallbackShipments.length > 0) {
      console.log('✅ Shipments loaded from user_storage fallback:', fallbackShipments.length);
      // Migrate to Supabase shipments table
      await supabasePersistence.saveShipments(fallbackShipments, effectiveUserId);
      return fallbackShipments;
    }
    
    // Strategy 3: Check localStorage
    console.log('💾 Checking localStorage...');
    const { smartPersistence } = await import('./smart-persistence');
    const localShipments = await smartPersistence.get('shipments', effectiveUserId);
    
    if (localShipments && localShipments.length > 0) {
      console.log('✅ Shipments loaded from localStorage:', localShipments.length);
      // Migrate to Supabase
      await supabasePersistence.saveShipments(localShipments, effectiveUserId);
      return localShipments;
    }
    
    // Strategy 4: Return empty array for new users
    console.log('📋 No existing shipments found, returning empty array');
    return [];
    
  } catch (error) {
    console.warn('Error loading shipments, falling back to empty array:', error);
    return [];
  }
};

/**
 * Create mock shipment with comprehensive Supabase persistence
 */
export const createMockShipment = async (shipmentData: any, userId?: string): Promise<any> => {
  try {
    console.log('💾 Creating shipment with userId:', userId);
    
    // Get effective user ID
    const { getCurrentUserId } = await import('./auth-context-guard');
    const effectiveUserId = userId || getCurrentUserId();
    
    if (!effectiveUserId) {
      throw new Error('No authenticated user for creating shipments');
    }
    
    // Create new shipment with defaults
    const newShipment = {
      id: `shipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retailer_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: effectiveUserId,
      ...shipmentData
    };
    
    // Get existing shipments and add the new one
    const existingShipments = await getMockShipments(effectiveUserId) || [];
    const updatedShipments = [...existingShipments, newShipment];
    
    // Strategy 1: Save to Supabase shipments table
    console.log('🗄️ Saving shipments to Supabase shipments table...');
    const { supabasePersistence } = await import('./supabase-persistence');
    const supabaseSuccess = await supabasePersistence.saveShipments(updatedShipments, effectiveUserId);
    
    if (supabaseSuccess) {
      console.log('✅ Shipment created and saved to Supabase shipments table');
      return newShipment;
    }
    
    // Strategy 2: Fall back to user_storage
    console.log('📁 Falling back to user_storage...');
    const userStorageSuccess = await supabasePersistence.saveToUserStorage('shipments', updatedShipments, effectiveUserId);
    
    if (userStorageSuccess) {
      console.log('✅ Shipment created and saved to user_storage (fallback)');
      return newShipment;
    }
    
    // Strategy 3: Fall back to smart persistence
    console.log('💾 Falling back to smart persistence...');
    const { smartPersistence } = await import('./smart-persistence');
    const smartSuccess = await smartPersistence.set('shipments', updatedShipments, effectiveUserId);
    
    if (smartSuccess) {
      console.log('✅ Shipment created and saved to localStorage (fallback)');
      return newShipment;
    }
    
    throw new Error('Failed to save shipment to any storage method');
    
  } catch (error) {
    console.error('❌ Error creating shipment:', error);
    throw error;
  }
};

/**
 * Enhanced order creation with comprehensive Supabase persistence
 */
export const createMockOrderEnhanced = async (orderData: any, userId?: string): Promise<any> => {
  try {
    console.log('🚀 createMockOrderEnhanced called!');
    console.log('💾 Creating order with enhanced persistence, userId:', userId);
    console.log('📦 Order data:', orderData);
    
    // Get effective user ID
    const { getCurrentUserId } = await import('./auth-context-guard');
    const effectiveUserId = userId || getCurrentUserId();
    
    console.log('👤 Effective user ID:', effectiveUserId);
    
    if (!effectiveUserId) {
      console.error('❌ No authenticated user for creating orders');
      throw new Error('No authenticated user for creating orders');
    }
    
    // Create new order with standardized defaults and validation
    const { createOrderWithDefaults, validateOrderData } = await import('./data-transforms');
    const newOrder = createOrderWithDefaults(orderData, effectiveUserId);
    
    // Validate the order before saving
    const validation = validateOrderData(newOrder);
    if (!validation.isValid) {
      console.error('❌ Order validation failed:', validation.errors);
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }
    
    console.log('✅ Order validated successfully');
    
    // Get existing orders and add the new one
    const existingOrders = await getMockOrders(effectiveUserId) || [];
    const updatedOrders = [...existingOrders, newOrder];
    
    // Strategy 1: Save to Supabase orders table
    console.log('🗄️ Attempting to save orders to Supabase orders table...');
    console.log('📊 Updated orders array:', updatedOrders.length, 'orders');
    const { supabasePersistence } = await import('./supabase-persistence');
    const supabaseSuccess = await supabasePersistence.saveOrders(updatedOrders, effectiveUserId);
    
    console.log('💾 Supabase save result:', supabaseSuccess);
    
    if (supabaseSuccess) {
      console.log('✅ SUCCESS: Order created and saved to Supabase orders table');
      return newOrder;
    } else {
      console.warn('⚠️ Supabase orders table save failed, trying fallback...');
    }
    
    // Strategy 2: Fall back to user_storage
    console.log('📁 Falling back to user_storage...');
    const userStorageSuccess = await supabasePersistence.saveToUserStorage('orders', updatedOrders, effectiveUserId);
    
    if (userStorageSuccess) {
      console.log('✅ Order created and saved to user_storage (fallback)');
      return newOrder;
    }
    
    // Strategy 3: Fall back to existing createMockOrder function
    console.log('🔄 Falling back to existing createMockOrder function...');
    return await createMockOrder(orderData, userId);
    
  } catch (error) {
    console.error('❌ Error creating order with enhanced persistence:', error);
    // Fall back to existing createMockOrder function
    return await createMockOrder(orderData, userId);
  }
};