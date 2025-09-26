import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  User,
  Shield,
  Activity,
  Database,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/lib/supabase';
import { AuditLog } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AuditLogsAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  const { toast } = useToast();
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => getAuditLogs(),
  });

  const logs: AuditLog[] = logsData?.data || [];

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toString().toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const logDate = new Date(log.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
      case 'create':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'updated':
      case 'update':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'deleted':
      case 'delete':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'login':
      case 'logout':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'viewed':
      case 'accessed':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user':
      case 'users':
        return <User className="w-4 h-4" />;
      case 'order':
      case 'orders':
        return <FileText className="w-4 h-4" />;
      case 'system':
      case 'system_settings':
        return <Database className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Actor ID', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.actor_id || '',
        JSON.stringify(log.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Audit logs exported',
      description: 'The audit logs have been exported to a CSV file.',
    });
  };

  // Get unique values for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueEntities = [...new Set(logs.map(log => log.entity_type))];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-destructive">Error loading audit logs: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor system activities and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportLogs} disabled={filteredLogs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action} className="capitalize">
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity} className="capitalize">
                    {entity.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setEntityFilter('all');
                setDateFilter('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail
            {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Badge variant="outline">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground">
                {logs.length === 0 ? 'No logs have been created yet' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getActionIcon(log.action)}
                    {getEntityIcon(log.entity_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize text-xs">
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {log.entity_type.replace('_', ' ')}
                      </Badge>
                      {log.entity_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entity_id}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium mb-1">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entity_type.replace('_', ' ')}
                      {log.entity_id && ` (${log.entity_id.substring(0, 8)}...)`}
                    </p>
                    
                    {log.details && (
                      <p className="text-xs text-muted-foreground">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.actor_id && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.actor_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}