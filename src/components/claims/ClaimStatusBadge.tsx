import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ClaimStatus } from '@/types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
}

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'submitted':
        return 'secondary';
      case 'in_review':
        return 'default';
      case 'approved':
        return 'default'; // Using default for approved
      case 'rejected':
        return 'destructive';
      case 'resolved':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: ClaimStatus) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in_review':
        return 'In Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusText(status)}
    </Badge>
  );
}