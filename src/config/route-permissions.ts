/**
 * Route Permissions Configuration
 * Based on PRD - Wholesale Distribution System roles and access control
 */

import { User } from '@/types';

export type UserRole = User['role'];

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  description: string;
}

/**
 * Route permissions mapping based on PRD requirements
 *
 * Role hierarchy:
 * - owner: Full system access (Distributor Owner)
 * - backoffice: Operations access (Distributor Backoffice)
 * - retailer: Retailer Manager - access to all locations under retailer
 * - location_user: Retailer Staff - restricted to assigned locations only
 */
export const routePermissions: RoutePermission[] = [
  // =================== UNIVERSAL ACCESS ===================
  {
    path: '/dashboard',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'Unified dashboard - all roles (data filtered by RLS)'
  },
  {
    path: '/settings',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'User settings - all roles can manage their profile'
  },

  // =================== ORDERS ===================
  {
    path: '/orders',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View orders (filtered by role and location)'
  },
  {
    path: '/orders/new',
    allowedRoles: ['retailer', 'location_user'],
    description: 'Create new customer orders - retailer staff only'
  },
  {
    path: '/orders/:id',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View order details (access controlled by RLS)'
  },

  // =================== CUSTOMERS ===================
  {
    path: '/customers',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View customers (filtered by retailer/location)'
  },
  {
    path: '/customers/:id',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View customer details (access controlled by RLS)'
  },

  // =================== PRODUCTS ===================
  {
    path: '/products',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View product catalog - all roles can browse'
  },
  {
    path: '/products/:id',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View product details - all roles'
  },

  // =================== CLAIMS & REPAIRS ===================
  {
    path: '/claims',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View claims (filtered by role and location)'
  },
  {
    path: '/claims/new',
    allowedRoles: ['retailer', 'location_user'],
    description: 'Submit new claim - retailer staff'
  },
  {
    path: '/claims/:id',
    allowedRoles: ['owner', 'backoffice', 'retailer', 'location_user'],
    description: 'View claim details (access controlled by RLS)'
  },

  // =================== SHIPPING & FULFILLMENT ===================
  {
    path: '/shipping',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Warehouse fulfillment dashboard - backoffice and warehouse staff'
  },

  // =================== RETAILERS (Distributor Only) ===================
  {
    path: '/retailers',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Manage retailers - distributor only'
  },
  {
    path: '/retailers/new',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Add new retailer - distributor only'
  },
  {
    path: '/retailers/:id',
    allowedRoles: ['owner', 'backoffice'],
    description: 'View/edit retailer details - distributor only'
  },
  {
    path: '/retailers/:id/edit',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Edit retailer - distributor only'
  },

  // =================== ADMIN (Owner & Backoffice) ===================
  {
    path: '/admin',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Admin dashboard - distributor only'
  },
  {
    path: '/admin/dashboard',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Admin dashboard - distributor only'
  },
  {
    path: '/admin/users',
    allowedRoles: ['owner', 'backoffice'],
    description: 'User management - distributor only'
  },
  {
    path: '/admin/orders',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Global order management - distributor only'
  },
  {
    path: '/admin/customers',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Global customer management - distributor only'
  },
  {
    path: '/admin/products',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Product catalog management - distributor only'
  },
  {
    path: '/admin/shipping',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Shipping provider management - distributor only'
  },
  {
    path: '/admin/gift-rules',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Gift rules management - distributor only'
  },
  {
    path: '/admin/test',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Admin testing tools - distributor only'
  }
];

/**
 * Check if a user role has access to a specific route
 */
export function hasRouteAccess(path: string, userRole: UserRole): boolean {
  // Owner has access to everything
  if (userRole === 'owner') return true;

  // Find exact match or pattern match
  const permission = routePermissions.find(p => {
    // Exact match
    if (p.path === path) return true;

    // Pattern match (e.g., /orders/:id matches /orders/123)
    const pattern = p.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  // If no permission found, default to authenticated access
  if (!permission) return true;

  return permission.allowedRoles.includes(userRole);
}

/**
 * Get allowed roles for a specific route
 */
export function getAllowedRoles(path: string): UserRole[] {
  const permission = routePermissions.find(p => {
    if (p.path === path) return true;
    const pattern = p.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  return permission?.allowedRoles || ['owner', 'backoffice', 'retailer', 'location_user'];
}

/**
 * Role-based route visibility for navigation menus
 * Defines what menu items each role should see
 */
export const roleNavigationAccess = {
  owner: {
    canSeeOrders: true,
    canCreateOrders: false, // Owners don't create orders
    canSeeCustomers: true,
    canSeeProducts: true,
    canSeeClaims: true,
    canSeeShipping: true,
    canSeeRetailers: true,
    canSeeAdmin: true,
    canSeeReports: true
  },
  backoffice: {
    canSeeOrders: true,
    canCreateOrders: false, // Backoffice manages, doesn't create
    canSeeCustomers: true,
    canSeeProducts: true,
    canSeeClaims: true,
    canSeeShipping: true,
    canSeeRetailers: true,
    canSeeAdmin: true,
    canSeeReports: true
  },
  retailer: {
    canSeeOrders: true,
    canCreateOrders: true, // Retailer managers can create orders
    canSeeCustomers: true,
    canSeeProducts: true,
    canSeeClaims: true,
    canSeeShipping: false, // Retailers don't manage shipping
    canSeeRetailers: false,
    canSeeAdmin: false,
    canSeeReports: true // Retailer-scoped reports
  },
  location_user: {
    canSeeOrders: true,
    canCreateOrders: true, // Staff create orders
    canSeeCustomers: true,
    canSeeProducts: true,
    canSeeClaims: true,
    canSeeShipping: false,
    canSeeRetailers: false,
    canSeeAdmin: false,
    canSeeReports: false // Limited to location view
  }
};
