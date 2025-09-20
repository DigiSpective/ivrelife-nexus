import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History
} from 'lucide-react';
import { getAuditLogs } from '@/lib/supabase';

interface AuditLogProps {
  entityId: string;
  entityType: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  user?: {
    email: string;
    role: string;
  };
  details?: any;
  created_at: string;
}

export default function AuditLog({ entityId, entityType }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [entityId, entityType]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAuditLogs(entityType, entityId);
      if (error) {
        console.error('Error fetching audit logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading audit logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                    </p>
                    {log.user && (
                      <p className="text-sm text-muted-foreground">
                        by {log.user.email} ({log.user.role})
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {new Date(log.created_at).toLocaleString()}
                  </Badge>
                </div>
                {log.details && (
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs found</h3>
            <p className="text-muted-foreground">
              No actions have been recorded for this entity yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}