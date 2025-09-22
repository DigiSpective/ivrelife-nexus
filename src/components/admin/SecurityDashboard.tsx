/**
 * Security Monitoring Dashboard
 * 
 * Real-time security monitoring interface displaying:
 * - Live security alerts and incident status
 * - Authentication metrics and performance graphs
 * - System health indicators and uptime status
 * - Compliance status and audit summaries
 * - Risk assessment trends and threat intelligence
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Wifi,
  Eye,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';
import { globalMonitoring, type SecurityAlert, type HealthCheck } from '@/lib/monitoring';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardMetrics {
  authentication: {
    successful_logins: number;
    failed_logins: number;
    avg_response_time: number;
    mfa_challenges: number;
  };
  security: {
    active_alerts: number;
    blocked_ips: number;
    suspicious_activities: number;
    risk_score_avg: number;
  };
  performance: {
    avg_api_response_time: number;
    error_rate: number;
    concurrent_users: number;
    uptime_percentage: number;
  };
}

export const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('hour');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Setup auto-refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadDashboardData();
      }
    }, 30000); // Refresh every 30 seconds

    // Subscribe to real-time alerts
    const unsubscribe = globalMonitoring.onSecurityAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [timeRange, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [metricsData, healthData] = await Promise.all([
        globalMonitoring.getSystemMetrics(timeRange),
        globalMonitoring.performHealthCheck()
      ]);

      setMetrics(metricsData);
      setHealthChecks(healthData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const generateMockChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toISOString().substr(11, 5),
        logins: Math.floor(Math.random() * 50) + 10,
        failures: Math.floor(Math.random() * 5),
        response_time: Math.floor(Math.random() * 100) + 150
      });
    }
    return data;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and security analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="hour">Last Hour</option>
              <option value="day">Last Day</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.security.active_alerts || 0}</div>
            <p className="text-xs text-gray-600">Security incidents requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.authentication.successful_logins || 0}</div>
            <p className="text-xs text-gray-600">Successful logins in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.performance.uptime_percentage || 0}%</div>
            <p className="text-xs text-gray-600">System availability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.performance.concurrent_users || 0}</div>
            <p className="text-xs text-gray-600">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Activity</CardTitle>
                <CardDescription>Login attempts and success rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={generateMockChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="logins" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="failures" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>API response times and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={generateMockChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="response_time" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Current Risk Assessment</CardTitle>
              <CardDescription>Overall security posture and risk indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Authentication Risk</span>
                    <span className="text-sm text-green-600">Low</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  <p className="text-xs text-gray-600">Based on failed login attempts and anomalous patterns</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Access Risk</span>
                    <span className="text-sm text-yellow-600">Medium</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-gray-600">Elevated due to increased data export activities</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Security</span>
                    <span className="text-sm text-green-600">Low</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  <p className="text-xs text-gray-600">All security measures operating normally</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Security Alerts</h3>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="space-y-3">
            {alerts.length > 0 ? alerts.map((alert) => (
              <Alert key={alert.alert_id} className="border-l-4 border-l-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{alert.description}</span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                      <AlertDescription className="mt-1">
                        Type: {alert.alert_type} • IP: {alert.ip_address} • 
                        Time: {alert.created_at.toLocaleString()}
                      </AlertDescription>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Investigate
                  </Button>
                </div>
              </Alert>
            )) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h4>
                  <p className="text-gray-500">All systems are operating normally with no security incidents detected.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <h3 className="text-lg font-semibold">System Health Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthChecks.map((check) => (
              <Card key={check.service}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">{check.service}</CardTitle>
                    <div className={`flex items-center space-x-1 ${getStatusColor(check.status)}`}>
                      {getStatusIcon(check.status)}
                      <span className="text-sm font-medium capitalize">{check.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time:</span>
                      <span>{check.response_time}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Check:</span>
                      <span>{check.timestamp.toLocaleTimeString()}</span>
                    </div>
                    {check.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {check.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {healthChecks.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Health Data Available</h4>
                <p className="text-gray-500">Health checks are being initialized. Please check back in a moment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Successful Logins</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics?.authentication.successful_logins || 0}</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failed Attempts</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics?.authentication.failed_logins || 0}</span>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>MFA Challenges</span>
                    <span className="font-medium">{metrics?.authentication.mfa_challenges || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-medium">{metrics?.authentication.avg_response_time || 0}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Security Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Alerts</span>
                    <span className="font-medium">{metrics?.security.active_alerts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Blocked IPs</span>
                    <span className="font-medium">{metrics?.security.blocked_ips || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suspicious Activities</span>
                    <span className="font-medium">{metrics?.security.suspicious_activities || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Risk Score</span>
                    <span className="font-medium">{metrics?.security.risk_score_avg || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics?.performance.avg_api_response_time || 0}ms</div>
                  <p className="text-sm text-gray-600">API Response Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics?.performance.error_rate || 0}%</div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics?.performance.concurrent_users || 0}</div>
                  <p className="text-sm text-gray-600">Concurrent Users</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics?.performance.uptime_percentage || 0}%</div>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;