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
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Wrap hooks in try-catch to handle potential errors
  let claims = [];
  let isLoading = true;
  let isError = false;
  let error = null;
  let currentUser = null;
  let userLoading = true;
  let userError = null;
  let createAuditLog = () => {};
  let createOutboxEvent = () => {};
  
  try {
    const claimsResult = useClaims();
    claims = claimsResult.data || [];
    isLoading = claimsResult.isLoading;
    isError = claimsResult.isError;
    error = claimsResult.error;
  } catch (err) {
    console.error('Error in useClaims hook:', err);
    isError = true;
    error = err;
    isLoading = false;
  }

  try {
    const userResult = useCurrentUser();
    currentUser = userResult.data;
    userLoading = userResult.loading;
    userError = userResult.error;
  } catch (err) {
    console.error('Error in useCurrentUser hook:', err);
    userError = err;
    userLoading = false;
  }

  try {
    const auditResult = useCreateAuditLog();
    createAuditLog = auditResult.mutate;
  } catch (err) {
    console.error('Error in useCreateAuditLog hook:', err);
  }

  try {
    const outboxResult = useCreateOutboxEvent();
    createOutboxEvent = outboxResult.mutate;
  } catch (err) {
    console.error('Error in useCreateOutboxEvent hook:', err);
  }

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
      {/* Fallback UI when components fail to load */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Claims Management</h1>
          <p className="text-muted-foreground">Manage warranty and service claims</p>
        </div>
        <Button onClick={handleNewClaim}>
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Try to render ClaimList, fallback to basic table if it fails */}
      {(() => {
        try {
          return <ClaimList claims={claims} onNewClaim={handleNewClaim} />;
        } catch (err) {
          console.error('Error rendering ClaimList:', err);
          return (
            <Card>
              <CardHeader>
                <CardTitle>Claims</CardTitle>
              </CardHeader>
              <CardContent>
                {claims.length > 0 ? (
                  <div className="space-y-2">
                    {claims.map((claim) => (
                      <div key={claim.id} className="border p-3 rounded">
                        <div className="flex justify-between">
                          <span>Claim #{claim.id}</span>
                          <span className="text-sm text-muted-foreground">
                            {claim.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No claims found. Create your first claim to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        }
      })()}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Claim</DialogTitle>
          </DialogHeader>
          {currentUser ? (
            (() => {
              try {
                return (
                  <ClaimForm
                    retailer_id={currentUser.retailer_id || ''}
                    location_id={currentUser.location_id}
                    created_by={currentUser.id}
                    onSuccess={handleClaimCreated}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                );
              } catch (err) {
                console.error('Error rendering ClaimForm:', err);
                return (
                  <div className="p-4 text-center">
                    <p>Unable to load claim form. Please try refreshing the page.</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                      Refresh Page
                    </Button>
                  </div>
                );
              }
            })()
          ) : (
            <div className="p-4 text-center">
              <p>Please log in to create a claim.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}