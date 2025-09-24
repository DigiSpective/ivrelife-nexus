import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Database,
  Activity,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Filter,
  ExternalLink,
  Info,
  Zap,
  Globe,
  Server,
  HardDrive,
  Cpu,
  Network
} from 'lucide-react';

interface UsageMetric {
  name: string;
  current: number;
  limit: number | 'unlimited';
  unit: string;
  icon: React.ComponentType<any>;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
    period: string;
  };
  color: string;
}

interface ApiUsage {
  endpoint: string;
  calls: number;
  successRate: number;
  avgResponseTime: number;
  errors: number;
}

interface UsageHistory {
  date: string;
  users: number;
  apiCalls: number;
  storage: number;
  bandwidth: number;
}

const mockUsageMetrics: UsageMetric[] = [
  {
    name: 'Active Users',
    current: 18,
    limit: 25,
    unit: 'users',
    icon: Users,
    trend: { direction: 'up', percentage: 12, period: 'this month' },
    color: 'blue'
  },
  {
    name: 'API Calls',
    current: 78500,
    limit: 100000,
    unit: 'calls',
    icon: Activity,
    trend: { direction: 'up', percentage: 8, period: 'this month' },
    color: 'green'
  },
  {
    name: 'Storage Used',
    current: 65,
    limit: 100,
    unit: 'GB',
    icon: Database,
    trend: { direction: 'up', percentage: 15, period: 'this month' },
    color: 'yellow'
  },
  {
    name: 'Bandwidth',
    current: 2.3,
    limit: 10,
    unit: 'TB',
    icon: Network,
    trend: { direction: 'down', percentage: 5, period: 'this month' },
    color: 'purple'
  }
];

const mockApiUsage: ApiUsage[] = [
  {
    endpoint: '/api/orders',
    calls: 25000,
    successRate: 99.2,
    avgResponseTime: 120,
    errors: 200
  },
  {
    endpoint: '/api/customers',
    calls: 18000,
    successRate: 98.8,
    avgResponseTime: 95,
    errors: 216
  },
  {
    endpoint: '/api/products',
    calls: 15000,
    successRate: 99.5,
    avgResponseTime: 85,
    errors: 75
  },
  {
    endpoint: '/api/inventory',
    calls: 12000,
    successRate: 97.9,
    avgResponseTime: 150,
    errors: 252
  },
  {
    endpoint: '/api/reports',
    calls: 8500,
    successRate: 99.8,
    avgResponseTime: 300,
    errors: 17
  }
];

const mockUsageHistory: UsageHistory[] = [
  { date: '2024-03-01', users: 15, apiCalls: 65000, storage: 58, bandwidth: 1.8 },
  { date: '2024-03-02', users: 16, apiCalls: 68000, storage: 59, bandwidth: 2.1 },
  { date: '2024-03-03', users: 17, apiCalls: 72000, storage: 61, bandwidth: 2.3 },
  { date: '2024-03-04', users: 18, apiCalls: 75000, storage: 63, bandwidth: 2.2 },
  { date: '2024-03-05', users: 18, apiCalls: 78500, storage: 65, bandwidth: 2.3 }
];

interface UsageTabProps {
  user: any;
}

export function UsageTab({ user }: UsageTabProps) {
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>(mockUsageMetrics);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>(mockApiUsage);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[]>(mockUsageHistory);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { icon: AlertTriangle, color: 'text-red-500', text: 'Critical' };
    if (percentage >= 75) return { icon: Clock, color: 'text-yellow-500', text: 'Warning' };
    return { icon: CheckCircle, color: 'text-green-500', text: 'Good' };
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Usage Data Refreshed",
        description: "Your usage metrics have been updated.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export Started",
        description: "Your usage data export will be ready shortly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Usage Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageMetrics.map((metric, index) => {
              const percentage = getUsagePercentage(metric.current, metric.limit);
              const status = getUsageStatus(percentage);
              const StatusIcon = status.icon;
              const MetricIcon = metric.icon;

              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MetricIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">
                        {metric.current.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {metric.limit === 'unlimited' ? 'unlimited' : `/ ${metric.limit.toLocaleString()}`} {metric.unit}
                      </span>
                    </div>

                    {metric.limit !== 'unlimited' && (
                      <div className="space-y-1">
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}% used</span>
                          <span className={status.color}>{status.text}</span>
                        </div>
                      </div>
                    )}

                    {metric.trend && (
                      <div className="flex items-center gap-1 text-xs">
                        {metric.trend.direction === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={metric.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                          {metric.trend.percentage}%
                        </span>
                        <span className="text-muted-foreground">{metric.trend.period}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            API Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiUsage.map((api, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{api.endpoint}</h4>
                    <p className="text-sm text-muted-foreground">
                      {api.calls.toLocaleString()} calls this month
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={api.successRate >= 99 ? 'default' : api.successRate >= 95 ? 'secondary' : 'destructive'}
                    >
                      {api.successRate}% success
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Avg Response Time</p>
                    <p className="font-semibold">{api.avgResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Errors</p>
                    <p className="font-semibold text-red-500">{api.errors}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">{api.successRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Usage Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Usage chart would be rendered here</p>
              <p className="text-sm text-muted-foreground mt-1">
                Integration with charting library (Chart.js, Recharts, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Usage Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">
                  Storage Usage Warning
                </h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                  You're using 65GB of your 100GB storage limit (65%). Consider upgrading your plan or cleaning up old data.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="outline">
                    Upgrade Plan
                  </Button>
                  <Button size="sm" variant="ghost">
                    Manage Storage
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-400">
                  API Usage Healthy
                </h4>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Your API usage is well within limits with excellent performance metrics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">Uptime</h4>
              <p className="text-2xl font-bold text-green-500">99.9%</p>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </div>
            <div className="text-center">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">Avg Response</h4>
              <p className="text-2xl font-bold">120ms</p>
              <p className="text-sm text-muted-foreground">API calls</p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">Availability</h4>
              <p className="text-2xl font-bold text-green-500">100%</p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={handleExportData}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Usage Data
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Analytics
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Reports
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              API Documentation
            </Button>
          </div>

          <Separator />

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Usage Calculation</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Usage metrics are updated every hour. API calls are counted per successful request. 
                  Storage includes all files, databases, and backups. Bandwidth includes both inbound and outbound traffic.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}