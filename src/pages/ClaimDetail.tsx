import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClaim } from '@/hooks/useClaims';
import { ClaimDetail as ClaimDetailComponent } from '@/components/claims/ClaimDetail';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: claim, isLoading, isError } = useClaim(id || '');

  if (isLoading) {
    return <div>Loading claim details...</div>;
  }

  if (isError || !claim) {
    return <div>Error loading claim details</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => window.history.back()}>
        ← Back to Claims
      </Button>
      <ClaimDetailComponent claim={claim} />
    </div>
  );
}