import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  Truck, 
  Settings, 
  BarChart3,
  Building2,
  User,
  ClipboardList,
  Shield,
  UserCog,
  PackagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockUser } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const user = mockUser;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      roles: ['owner', 'backoffice', 'retailer', 'location']
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      roles: ['owner', 'backoffice', 'retailer', 'location']
    },
    {
      name: 'New Order',
      href: '/orders/new',
      icon: FileText,
      roles: ['retailer', 'location']
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      roles: ['owner', 'backoffice', 'retailer']
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['owner', 'backoffice', 'retailer', 'location']
    },
    {
      name: 'Shipping',
      href: '/shipping',
      icon: Truck,
      roles: ['owner', 'backoffice', 'retailer', 'location']
    },
    {
      name: 'Claims & Repairs',
      href: '/claims',
      icon: ClipboardList,
      roles: ['owner', 'backoffice', 'retailer', 'location']
    },
    {
      name: 'Retailers',
      href: '/retailers',
      icon: Building2,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['owner', 'backoffice', 'retailer']
    }
  ];

  const adminNavigation = [
    {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: Shield,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserCog,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'Order Admin',
      href: '/admin/orders',
      icon: ShoppingCart,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'Customer Admin',
      href: '/admin/customers',
      icon: Users,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'Product Admin',
      href: '/admin/products',
      icon: PackagePlus,
      roles: ['owner', 'backoffice']
    },
    {
      name: 'Shipping Admin',
      href: '/admin/shipping',
      icon: Truck,
      roles: ['owner', 'backoffice']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  const filteredAdminNavigation = adminNavigation.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className={cn(
      "flex h-full w-72 flex-col bg-card border-r border-border shadow-navbar",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">IV RELIFE</h1>
          <p className="text-sm text-muted-foreground">Internal System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && !location.pathname.startsWith('/admin'));
            
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 h-11 transition-smooth",
                    isActive && "shadow-elegant"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Admin Navigation */}
        {filteredAdminNavigation.length > 0 && (
          <div className="space-y-2">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </h3>
            </div>
            {filteredAdminNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 h-11 transition-smooth",
                      isActive && "shadow-elegant bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="gradient-primary text-white font-semibold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}