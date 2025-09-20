import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useAuth';
import { ClaimForm } from '@/components/claims/ClaimForm';

export default function NewClaim() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  const handleSuccess = () => {
    navigate('/claims');
  };

  const handleCancel = () => {
    navigate('/claims');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/claims')}>
          ← Back to Claims
        </Button>
        <h1 className="text-3xl font-bold">New Claim</h1>
      </div>
      
      {currentUser && (
        <ClaimForm
          retailer_id={currentUser.retailer_id || ''}
          location_id={currentUser.location_id}
          created_by={currentUser.id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}