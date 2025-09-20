import { User } from '@/types';

// Mock user - will be replaced with actual Supabase user
import { mockUser } from '@/lib/mock-data';

// Get current user (mock implementation)
export const getCurrentUser = (): User => {
  return mockUser;
};

// Check if user has required role
export const hasRole = (user: User, requiredRole: string): boolean => {
  // Owner has access to everything
  if (user.role === 'owner') return true;
  
  return user.role === requiredRole;
};

// Check if user has any of the allowed roles
export const hasAnyRole = (user: User, allowedRoles: string[]): boolean => {
  // Owner has access to everything
  if (user.role === 'owner') return true;
  
  return allowedRoles.includes(user.role);
};

// Check if user can access retailer data
export const canAccessRetailer = (user: User, retailerId: string): boolean => {
  // Owner has access to everything
  if (user.role === 'owner') return true;
  
  // Backoffice can access all retailers
  if (user.role === 'backoffice') return true;
  
  // Retailer can access their own data
  if (user.role === 'retailer' && user.retailer_id === retailerId) return true;
  
  return false;
};

// Check if user can access location data
export const canAccessLocation = (user: User, locationId: string): boolean => {
  // Owner has access to everything
  if (user.role === 'owner') return true;
  
  // Backoffice can access all locations
  if (user.role === 'backoffice') return true;
  
  // Retailer can access their own locations
  if (user.role === 'retailer' && user.retailer_id) return true;
  
  // Location user can access their own location
  if (user.role === 'location' && user.location_id === locationId) return true;
  
  return false;
};

// Role-based navigation permissions
export const navigationPermissions = {
  dashboard: ['owner', 'backoffice', 'retailer', 'location'],
  orders: ['owner', 'backoffice', 'retailer', 'location'],
  newOrder: ['retailer', 'location'],
  products: ['owner', 'backoffice', 'retailer'],
  customers: ['owner', 'backoffice', 'retailer', 'location'],
  shipping: ['owner', 'backoffice', 'retailer', 'location'],
  claims: ['owner', 'backoffice', 'retailer', 'location'],
  retailers: ['owner', 'backoffice'],
  settings: ['owner', 'backoffice', 'retailer']
};