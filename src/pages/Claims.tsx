import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useClaims, useCreateAuditLog, useCreateOutboxEvent } from '@/hooks/useClaims';
import { useCurrentUser } from '@/hooks/useAuth';
import { ClaimList } from '@/components/claims/ClaimList';
import { ClaimForm } from '@/components/claims/ClaimForm';
import { ClaimDetail } from '@/components/claims/ClaimDetail';
import { useParams } from 'react-router-dom';

export default function Claims() {
  const { id } = useParams<{ id: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: claims = [], isLoading, isError } = useClaims();
  const { data: currentUser } = useCurrentUser();
  const { mutate: createAuditLog } = useCreateAuditLog();
  const { mutate: createOutboxEvent } = useCreateOutboxEvent();

  const handleNewClaim = () => {
    setIsDialogOpen(true);
  };

  const handleClaimCreated = () => {
    setIsDialogOpen(false);
    
    // Create audit log
    createAuditLog({
      action: 'claim_created',
      entity: 'claim',
      entity_id: 'temp-id', // This would be replaced with actual ID in a real implementation
      details: { message: 'New claim created' },
    });
    
    // Create outbox event for notifications
    createOutboxEvent({
      event_type: 'claim_created',
      entity: 'claim',
      entity_id: 'temp-id', // This would be replaced with actual ID in a real implementation
      payload: { message: 'New claim created' },
    });
  };

  if (isLoading) {
    return <div>Loading claims...</div>;
  }

  if (isError) {
    return <div>Error loading claims</div>;
  }

  // If we have an ID in the URL, show the claim detail view
  if (id) {
    const claim = claims.find(c => c.id === id);
    if (!claim) {
      return <div>Claim not found</div>;
    }
    
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Back to Claims
        </Button>
        <ClaimDetail claim={claim} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClaimList claims={claims} onNewClaim={handleNewClaim} />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Claim</DialogTitle>
          </DialogHeader>
          {currentUser && (
            <ClaimForm
              retailer_id={currentUser.retailer_id || ''}
              location_id={currentUser.location_id}
              created_by={currentUser.id}
              onSuccess={handleClaimCreated}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}