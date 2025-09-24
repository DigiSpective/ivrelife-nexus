import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Shield,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  PackagePlus,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockUsers, mockOrders, mockCustomers } from '@/lib/mock-data';
import { sampleProducts } from '@/data/sampleProducts';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'order' | 'product' | 'system';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function AdminDashboard() {
  // Calculate admin statistics
  const stats: AdminStats = {
    totalUsers: mockUsers.length,
    totalProducts: sampleProducts.length,
    totalOrders: mockOrders.length,
    totalCustomers: mockCustomers.length,
    totalRevenue: mockOrders.reduce((sum, order) => sum + order.total_amount, 0),
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    lowStockProducts: sampleProducts.filter(p => !p.available).length,
    activeUsers: mockUsers.filter(u => ['owner', 'backoffice'].includes(u.role)).length
  };

  // Mock recent activities
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'user',
      description: 'New user registered: john.doe@example.com',
      timestamp: '2024-03-20T10:30:00Z',
      severity: 'success'
    },
    {
      id: '2',
      type: 'order',
      description: 'Order #ord-1 status changed to processing',
      timestamp: '2024-03-20T10:15:00Z',
      severity: 'info'
    },
    {
      id: '3',
      type: 'product',
      description: 'Product Boss Plus marked as out of stock',
      timestamp: '2024-03-20T09:45:00Z',
      severity: 'warning'
    },
    {
      id: '4',
      type: 'system',
      description: 'Database backup completed successfully',
      timestamp: '2024-03-20T06:00:00Z',
      severity: 'success'
    },
    {
      id: '5',
      type: 'order',
      description: 'Failed payment attempt for order #ord-3',
      timestamp: '2024-03-19T22:30:00Z',
      severity: 'error'
    }
  ];

  const getActivityIcon = (type: string, severity: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Complete system administration and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/audit-logs">
              <FileText className="w-4 h-4 mr-2" />
              View Audit Logs
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/system-settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} active today
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-3xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.lowStockProducts} out of stock
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} pending
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="justify-start h-auto p-4" variant="outline" asChild>
              <Link to="/admin/users">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium">Manage Users</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Add, edit, and manage user accounts</span>
                </div>
              </Link>
            </Button>

            <Button className="justify-start h-auto p-4" variant="outline" asChild>
              <Link to="/admin/products">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="w-4 h-4" />
                    <span className="font-medium">Manage Products</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Update inventory and product details</span>
                </div>
              </Link>
            </Button>

            <Button className="justify-start h-auto p-4" variant="outline" asChild>
              <Link to="/admin/orders">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-medium">Manage Orders</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Process and track all orders</span>
                </div>
              </Link>
            </Button>

            <Button className="justify-start h-auto p-4" variant="outline" asChild>
              <Link to="/admin/security">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Security Center</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Monitor system security and access</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Database</p>
                  <p className="text-sm text-green-600 dark:text-green-500">All systems operational</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">API Services</p>
                  <p className="text-sm text-green-600 dark:text-green-500">Response time: 120ms</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200">
                Online
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">Storage</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">78% of quota used</p>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                Warning
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Security</p>
                  <p className="text-sm text-green-600 dark:text-green-500">No threats detected</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200">
                Secure
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/audit-logs">
                  <Eye className="w-4 h-4 mr-1" />
                  View All
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-1 rounded ${getSeverityColor(activity.severity)}`}>
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      {stats.lowStockProducts} products out of stock
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      Immediate attention required
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/admin/products?filter=out-of-stock">
                    View Products
                  </Link>
                </Button>
              </div>
            )}

            {stats.pendingOrders > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                      {stats.pendingOrders} orders pending processing
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      Customer satisfaction at risk
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/admin/orders?status=pending">
                    Process Orders
                  </Link>
                </Button>
              </div>
            )}

            {stats.lowStockProducts === 0 && stats.pendingOrders === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No critical alerts at this time</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}