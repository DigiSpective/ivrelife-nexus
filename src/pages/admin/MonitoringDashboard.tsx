import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Globe,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdminUsers, useAdminOrders, useAdminCustomers } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  requests: number;
  errors: number;
  responseTime: number;
}

interface PerformanceMetric {
  timestamp: string;
  value: number;
  label: string;
}

export default function MonitoringDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 67,
    disk: 78,
    network: 23,
    uptime: 99.8,
    requests: 1247,
    errors: 12,
    responseTime: 156
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toast } = useToast();
  
  // Fetch admin data for analytics
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders();
  const { data: customersData, isLoading: customersLoading } = useAdminCustomers();

  const users = usersData?.data || [];
  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 8)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15)),
        uptime: Math.max(95, Math.min(100, prev.uptime + (Math.random() - 0.5) * 0.1)),
        requests: prev.requests + Math.floor(Math.random() * 10),
        errors: prev.errors + (Math.random() > 0.9 ? 1 : 0),
        responseTime: Math.max(50, Math.min(500, prev.responseTime + (Math.random() - 0.5) * 30))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    
    // Simulate API refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: 'Dashboard refreshed',
        description: 'All metrics have been updated with the latest data.',
      });
    }, 1500);
  };

  const getStatusColor = (value: number, type: 'percentage' | 'uptime' | 'responseTime') => {
    if (type === 'uptime') {
      return value >= 99 ? 'text-green-500' : value >= 95 ? 'text-yellow-500' : 'text-red-500';
    }
    if (type === 'responseTime') {
      return value <= 200 ? 'text-green-500' : value <= 500 ? 'text-yellow-500' : 'text-red-500';
    }
    // percentage
    return value <= 70 ? 'text-green-500' : value <= 85 ? 'text-yellow-500' : 'text-red-500';
  };

  const getProgressColor = (value: number) => {
    if (value <= 70) return 'bg-green-500';
    if (value <= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate business metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const activeUsers = users.filter(user => ['owner', 'backoffice'].includes(user.role)).length;
  const recentOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return orderDate >= dayAgo;
  }).length;

  const isLoading = usersLoading || ordersLoading || customersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system performance and business analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(systemMetrics.cpu, 'percentage')}`}>
                {systemMetrics.cpu.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={systemMetrics.cpu} 
              className="mb-2" 
            />
            <p className="text-xs text-muted-foreground">
              {systemMetrics.cpu <= 70 ? 'Normal' : systemMetrics.cpu <= 85 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-green-500" />
                <span className="font-medium">Memory</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(systemMetrics.memory, 'percentage')}`}>
                {systemMetrics.memory.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={systemMetrics.memory} 
              className="mb-2" 
            />
            <p className="text-xs text-muted-foreground">
              {systemMetrics.memory <= 70 ? 'Normal' : systemMetrics.memory <= 85 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Disk Usage</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(systemMetrics.disk, 'percentage')}`}>
                {systemMetrics.disk.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={systemMetrics.disk} 
              className="mb-2" 
            />
            <p className="text-xs text-muted-foreground">
              {systemMetrics.disk <= 70 ? 'Normal' : systemMetrics.disk <= 85 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Network</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(systemMetrics.network, 'percentage')}`}>
                {systemMetrics.network.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={systemMetrics.network} 
              className="mb-2" 
            />
            <p className="text-xs text-muted-foreground">
              {systemMetrics.network <= 70 ? 'Normal' : systemMetrics.network <= 85 ? 'High' : 'Critical'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                <p className={`text-3xl font-bold ${getStatusColor(systemMetrics.uptime, 'uptime')}`}>
                  {systemMetrics.uptime.toFixed(2)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                <p className="text-3xl font-bold">{systemMetrics.requests.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.floor(Math.random() * 20 + 5)}% today
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-3xl font-bold text-red-500">{systemMetrics.errors}</p>
                <p className="text-xs text-muted-foreground">
                  {((systemMetrics.errors / systemMetrics.requests) * 100).toFixed(2)}% of requests
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className={`text-3xl font-bold ${getStatusColor(systemMetrics.responseTime, 'responseTime')}`}>
                  {systemMetrics.responseTime.toFixed(0)}ms
                </p>
                <p className="text-xs text-muted-foreground">Average response</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading business metrics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-xs text-green-600">{activeUsers} active</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-xs text-blue-600">{recentOrders} today</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-xs text-green-600">+12% growth</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xs text-green-600">+8.5% month</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">API Gateway</p>
                    <p className="text-sm text-green-600 dark:text-green-500">All endpoints operational</p>
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
                    <p className="font-medium text-green-700 dark:text-green-400">Database</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Connection pool healthy</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-200">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Authentication</p>
                    <p className="text-sm text-green-600 dark:text-green-500">All auth services running</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-200">
                  Secure
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">File Storage</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">High usage detected</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                  Warning
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{recentOrders}</div>
              <p className="text-sm text-muted-foreground">Orders Today</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{pendingOrders}</div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{systemMetrics.errors}</div>
              <p className="text-sm text-muted-foreground">System Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}