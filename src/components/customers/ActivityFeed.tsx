import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  User, 
  FileText, 
  Upload, 
  Edit,
  Users,
  Plus
} from 'lucide-react';
import { useCustomerActivity } from '@/hooks/useCustomers';
import { CustomerActivity } from '@/types';

interface ActivityFeedProps {
  customerId: string;
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <User className="w-4 h-4" />;
    case 'updated':
      return <Edit className="w-4 h-4" />;
    case 'id_uploaded':
    case 'signature_uploaded':
      return <Upload className="w-4 h-4" />;
    case 'merged':
      return <Users className="w-4 h-4" />;
    case 'imported':
      return <Plus className="w-4 h-4" />;
    case 'contract_generated':
      return <FileText className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getActivityLabel = (action: string) => {
  switch (action) {
    case 'created':
      return 'Customer created';
    case 'updated':
      return 'Customer updated';
    case 'id_uploaded':
      return 'ID photo uploaded';
    case 'signature_uploaded':
      return 'Signature uploaded';
    case 'merged':
      return 'Customer merged';
    case 'imported':
      return 'Customer imported';
    case 'contract_generated':
      return 'Contract generated';
    default:
      return action;
  }
};

const getActivityBadgeVariant = (action: string) => {
  switch (action) {
    case 'created':
      return 'default';
    case 'updated':
      return 'secondary';
    case 'id_uploaded':
    case 'signature_uploaded':
      return 'default';
    case 'merged':
      return 'default';
    case 'imported':
      return 'default';
    case 'contract_generated':
      return 'default';
    default:
      return 'secondary';
  }
};

export function ActivityFeed({ customerId }: ActivityFeedProps) {
  const { data: activityData, isLoading, error } = useCustomerActivity(customerId);
  const activities = activityData?.data || [];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">Error loading activity: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: CustomerActivity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{getActivityLabel(activity.action)}</span>
                    <Badge variant={getActivityBadgeVariant(activity.action)}>
                      {activity.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.actor_role ? `${activity.actor_role}: ` : ''}
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                  {activity.payload && (
                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(activity.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              Customer activity will appear here when actions are performed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}