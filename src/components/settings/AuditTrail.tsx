import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@/types';
import { format } from 'date-fns';

interface AuditTrailProps {
  logs: AuditLog[];
}

export function AuditTrail({ logs }: AuditTrailProps) {
  // Format action for display
  const formatAction = (action: string) => {
    return action
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format entity for display
  const formatEntity = (entity: string) => {
    return entity
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>
          Recent changes and activities in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">No audit logs found.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{formatAction(log.action)}</h4>
                      <Badge variant="secondary">{formatEntity(log.entity)}</Badge>
                    </div>
                    {log.details && (
                      <pre className="mt-2 text-sm text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}