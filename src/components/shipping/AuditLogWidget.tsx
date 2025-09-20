import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface AuditLogWidgetProps {
  entityId: string;
  entries: AuditLogEntry[];
}

export function AuditLogWidget({ entityId, entries }: AuditLogWidgetProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <div className="text-sm text-muted-foreground">
          Entity: {entityId}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4 pr-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit log entries
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="space-y-1 border-l-2 border-primary pl-4 py-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{entry.user}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{entry.action}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}