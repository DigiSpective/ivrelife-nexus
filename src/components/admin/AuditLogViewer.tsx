/**
 * Audit Log Viewer Component
 * 
 * Comprehensive audit log interface for compliance and security investigation including:
 * - Advanced filtering and search capabilities
 * - Real-time log streaming and monitoring
 * - Export functionality for compliance reporting
 * - Risk analysis and pattern detection
 * - Event correlation and timeline reconstruction
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Shield, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  Smartphone,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase-client';

interface AuditLogEntry {
  log_id: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  action: string;
  status: 'success' | 'failure' | 'error';
  risk_score?: number;
  anomaly_flags?: string[];
  event_data?: Record<string, any>;
  error_details?: Record<string, any>;
  created_at: string;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  userId?: string;
  status?: string;
  riskScore?: { min: number; max: number };
  ipAddress?: string;
  searchTerm?: string;
}

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'risk_score' | 'event_type'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const client = createSupabaseClient();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters, sortField, sortDirection]);

  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(loadAuditLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Apply filters
    if (filters.eventType) {
      filtered = filtered.filter(log => log.event_type.includes(filters.eventType!));
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.user_id === filters.userId);
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.riskScore) {
      filtered = filtered.filter(log => {
        const score = log.risk_score || 0;
        return score >= filters.riskScore!.min && score <= filters.riskScore!.max;
      });
    }

    if (filters.ipAddress) {
      filtered = filtered.filter(log => log.ip_address?.includes(filters.ipAddress!));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.event_type.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.user_id?.toLowerCase().includes(term) ||
        log.ip_address?.toLowerCase().includes(term) ||
        JSON.stringify(log.event_data).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'risk_score':
          aValue = a.risk_score || 0;
          bValue = b.risk_score || 0;
          break;
        case 'event_type':
          aValue = a.event_type;
          bValue = b.event_type;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      const dataToExport = filteredLogs.map(log => ({
        timestamp: log.created_at,
        event_type: log.event_type,
        user_id: log.user_id || 'N/A',
        action: log.action,
        status: log.status,
        ip_address: log.ip_address || 'N/A',
        risk_score: log.risk_score || 0,
        anomaly_flags: log.anomaly_flags?.join(', ') || 'None',
        details: JSON.stringify(log.event_data || {})
      }));

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        const headers = Object.keys(dataToExport[0] || {});
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => 
              JSON.stringify(row[header as keyof typeof row] || '')
            ).join(',')
          )
        ].join('\n');
        
        content = csvContent;
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(dataToExport, null, 2);
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score < 25) return 'bg-green-100 text-green-800';
    if (score < 50) return 'bg-yellow-100 text-yellow-800';
    if (score < 75) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' > ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log Viewer</h1>
          <p className="text-gray-600">Security events and system activity monitoring</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Activity className={`h-4 w-4 mr-2 ${realTimeEnabled ? 'animate-pulse' : ''}`} />
            Real-time
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Audit Logs</DialogTitle>
                <DialogDescription>
                  Export filtered audit logs for compliance or analysis purposes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Exporting {filteredLogs.length} log entries
                </p>
                <div className="flex space-x-2">
                  <Button onClick={() => exportLogs('csv')} className="flex-1">
                    Export as CSV
                  </Button>
                  <Button onClick={() => exportLogs('json')} variant="outline" className="flex-1">
                    Export as JSON
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Event Type</label>
              <Select 
                value={filters.eventType || ''} 
                onValueChange={(value) => handleFilterChange('eventType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="mfa">Multi-Factor Auth</SelectItem>
                  <SelectItem value="data">Data Access</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select 
                value={filters.status || ''} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {logs.length} entries
              </span>
              {Object.keys(filters).some(key => filters[key as keyof AuditFilters]) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select 
                value={sortField} 
                onValueChange={(value) => setSortField(value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="risk_score">Risk Score</SelectItem>
                  <SelectItem value="event_type">Event Type</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
          <CardDescription>
            Comprehensive security and system event log with risk analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.log_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{formatEventType(log.event_type)}</span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        {log.risk_score && (
                          <Badge className={getRiskColor(log.risk_score)}>
                            Risk: {log.risk_score}
                          </Badge>
                        )}
                        {log.anomaly_flags && log.anomaly_flags.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Anomaly
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          {log.user_id && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{log.user_id}</span>
                            </div>
                          )}
                          {log.ip_address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{log.ip_address}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Action:</span> {log.action}
                        </div>
                        
                        {log.user_agent && (
                          <div className="flex items-center space-x-1">
                            <Smartphone className="h-3 w-3" />
                            <span className="truncate">{log.user_agent}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this security event
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Event Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {formatEventType(selectedLog.event_type)}</div>
                    <div><strong>Action:</strong> {selectedLog.action}</div>
                    <div><strong>Status:</strong> <Badge className={getStatusColor(selectedLog.status)}>{selectedLog.status}</Badge></div>
                    <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
                    <div><strong>Log ID:</strong> {selectedLog.log_id}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Context Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>User ID:</strong> {selectedLog.user_id || 'N/A'}</div>
                    <div><strong>Session ID:</strong> {selectedLog.session_id || 'N/A'}</div>
                    <div><strong>IP Address:</strong> {selectedLog.ip_address || 'N/A'}</div>
                    <div><strong>User Agent:</strong> {selectedLog.user_agent || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {selectedLog.risk_score && (
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm"><strong>Risk Score:</strong></span>
                      <Badge className={getRiskColor(selectedLog.risk_score)}>
                        {selectedLog.risk_score}/100
                      </Badge>
                    </div>
                    {selectedLog.anomaly_flags && selectedLog.anomaly_flags.length > 0 && (
                      <div>
                        <span className="text-sm"><strong>Anomaly Flags:</strong></span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLog.anomaly_flags.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Event Data */}
              {selectedLog.event_data && (
                <div>
                  <h4 className="font-medium mb-2">Event Data</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.event_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Details */}
              {selectedLog.error_details && (
                <div>
                  <h4 className="font-medium mb-2">Error Details</h4>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <pre className="text-xs mt-2">
                        {JSON.stringify(selectedLog.error_details, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogViewer;