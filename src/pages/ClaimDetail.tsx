import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClaim } from '@/hooks/useClaims';
import { ClaimDetail as ClaimDetailComponent } from '@/components/claims/ClaimDetail';

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: claim, isLoading, isError, error } = useClaim(id || '');

  console.log('🔍 ClaimDetailPage - id:', id);
  console.log('🔍 ClaimDetailPage - claim:', claim);
  console.log('🔍 ClaimDetailPage - isLoading:', isLoading);
  console.log('🔍 ClaimDetailPage - isError:', isError);
  console.log('🔍 ClaimDetailPage - error:', error);

  if (isLoading) {
    return <div className="p-6">Loading claim details...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Error loading claim details: {error?.message || 'Unknown error'}</div>;
  }

  if (!claim) {
    return <div className="p-6">Claim not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => window.history.back()}>
        ← Back to Claims
      </Button>
      <ClaimDetailComponent claim={claim} />
    </div>
  );
}