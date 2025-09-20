import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TrackingEvent {
  id: string;
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingTimelineProps {
  trackingNumber: string;
  events: TrackingEvent[];
}

export function TrackingTimeline({ trackingNumber, events }: TrackingTimelineProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Tracking Timeline</CardTitle>
        <div className="text-sm text-muted-foreground">
          Tracking #: {trackingNumber}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tracking events available
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative pl-8">
                  {/* Timeline line */}
                  {index !== events.length - 1 && (
                    <div className="absolute left-4 top-6 h-full w-0.5 bg-border"></div>
                  )}
                  
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full bg-primary"></div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{event.status}</Badge>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-medium">{event.location}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}