/**
 * Navigation hook for role-based menu visibility
 * Based on PRD role permissions
 */

import { useRole } from './useAuth';
import { roleNavigationAccess } from '@/config/route-permissions';

export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  visible: boolean;
  badge?: string | number;
}

export function useNavigation() {
  const { user } = useRole();

  if (!user) {
    return {
      navigationItems: [],
      canAccessRoute: () => false
    };
  }

  const access = roleNavigationAccess[user.role];

  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      visible: true // All roles see dashboard
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: 'ShoppingCart',
      visible: access.canSeeOrders
    },
    {
      label: 'New Order',
      path: '/orders/new',
      icon: 'Plus',
      visible: access.canCreateOrders
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: 'Users',
      visible: access.canSeeCustomers
    },
    {
      label: 'Products',
      path: '/products',
      icon: 'Package',
      visible: access.canSeeProducts
    },
    {
      label: 'Claims',
      path: '/claims',
      icon: 'AlertCircle',
      visible: access.canSeeClaims
    },
    {
      label: 'Shipping',
      path: '/shipping',
      icon: 'Truck',
      visible: access.canSeeShipping
    },
    {
      label: 'Retailers',
      path: '/retailers',
      icon: 'Building2',
      visible: access.canSeeRetailers
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: 'Settings',
      visible: access.canSeeAdmin
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: 'BarChart3',
      visible: access.canSeeReports
    }
  ].filter(item => item.visible);

  const canAccessRoute = (path: string): boolean => {
    const item = navigationItems.find(nav => nav.path === path);
    return item?.visible ?? false;
  };

  return {
    navigationItems,
    canAccessRoute,
    userRole: user.role
  };
}

/**
 * Get role-specific dashboard summary
 */
export function useRoleDashboardConfig() {
  const { user } = useRole();

  if (!user) return null;

  const configs = {
    owner: {
      title: 'Owner Dashboard',
      subtitle: 'Global operations overview',
      primaryActions: ['View Reports', 'Manage Retailers', 'System Settings'],
      kpiCards: ['Total Revenue', 'Active Retailers', 'Total Orders', 'Claims/Repairs']
    },
    backoffice: {
      title: 'Backoffice Dashboard',
      subtitle: 'Operations management',
      primaryActions: ['Manage Shipments', 'Process Claims', 'Manage Orders'],
      kpiCards: ['Pending Orders', 'Active Shipments', 'Open Claims', 'Low Stock']
    },
    retailer: {
      title: 'Retailer Dashboard',
      subtitle: user.retailer_id ? 'Multi-location view' : 'Retailer operations',
      primaryActions: ['New Order', 'View Reports', 'Manage Staff'],
      kpiCards: ['Location Orders', 'Total Customers', 'Pending Claims', 'Monthly Revenue']
    },
    location_user: {
      title: 'Staff Dashboard',
      subtitle: user.location_id ? 'Location operations' : 'Retailer staff',
      primaryActions: ['New Order', 'View Orders', 'Submit Claim'],
      kpiCards: ['Today Orders', 'Active Customers', 'Pending Shipments', 'Open Claims']
    }
  };

  return configs[user.role];
}
