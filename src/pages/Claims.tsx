import React, { useState, useEffect } from 'react';
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

export default function Claims() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: claims = [], isLoading, isError, error } = useClaims();
  const { data: currentUser, loading: userLoading, error: userError } = useCurrentUser();
  const { mutate: createAuditLog } = useCreateAuditLog();
  const { mutate: createOutboxEvent } = useCreateOutboxEvent();

  // Debug logging
  useEffect(() => {
    console.log('Claims component mounted');
    console.log('Claims data:', claims);
    console.log('Claims loading:', isLoading);
    console.log('Claims error:', isError, error);
    console.log('Current user:', currentUser);
    console.log('User loading:', userLoading);
    console.log('User error:', userError);
  }, [claims, isLoading, isError, error, currentUser, userLoading, userError]);

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

  // Show loading state
  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading claims...</div>
          <div className="text-sm text-muted-foreground mt-2">Please wait while we fetch your claims data</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError || userError) {
    console.error('Claims error:', error);
    console.error('User error:', userError);
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium text-destructive">Error loading claims</div>
          <div className="text-sm text-muted-foreground mt-2">
            {error?.message || userError?.message || 'An unexpected error occurred while loading claims data.'}
          </div>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium">Authentication Required</div>
          <div className="text-sm text-muted-foreground mt-2">
            You must be logged in to view claims. Please log in to continue.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
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