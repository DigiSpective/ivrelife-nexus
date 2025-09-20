import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FulfillmentStatus } from '@/types';

interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatus;
}

export function FulfillmentStatusBadge({ status }: FulfillmentStatusBadgeProps) {
  const getStatusVariant = (status: FulfillmentStatus) => {
    switch (status) {
      case 'label_created':
        return 'outline';
      case 'in_transit':
        return 'secondary';
      case 'out_for_delivery':
        return 'default';
      case 'delivered':
        return 'default';
      case 'exception':
        return 'destructive';
      case 'returned':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: FulfillmentStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusText(status)}
    </Badge>
  );
}