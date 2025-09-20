import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditLog } from '@/types';

interface AuditLogListProps {
  logs: AuditLog[];
  className?: string;
}

export function AuditLogList({ logs, className = "" }: AuditLogListProps) {
  const getActionVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'default';
      case 'updated':
        return 'secondary';
      case 'deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionVariant(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="font-medium">{log.entity_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.payload ? JSON.stringify(log.payload) : 'No details'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Actor: {log.actor_id} ({log.actor_role})
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}