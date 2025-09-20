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

export const mockUser: User = {
  id: 'usr-1',
  email: 'admin@ivrelife.com',
  role: 'owner',
  name: 'Sarah Chen',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
};

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
    address: {
      street: '123 Customer Lane',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103'
    },
    external_id: 'EXT001',
    created_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'cust-2',
    retailer_id: 'ret-1',
    name: 'Emily Johnson',
    email: 'emily.johnson@email.com',
    phone: '(555) 888-9999',
    address: {
      street: '456 Buyer Street',
      city: 'Oakland',
      state: 'CA',
      zip: '94607'
    },
    external_id: 'EXT002',
    created_at: '2024-03-05T00:00:00Z'
  }
];

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

export const mockClaims: Claim[] = [
  {
    id: 'cl-1',
    order_id: 'ord-1',
    submitted_by: 'usr-1',
    retailer_id: 'ret-1',
    status: 'open',
    description: 'Customer reported damaged packaging',
    metadata: {},
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