import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { Claim, Repair } from '@/types';
import { FileText, Wrench } from 'lucide-react';

interface ClaimRepairListProps {
  claims: Claim[];
  repairs: Repair[];
  className?: string;
  onClaimClick?: (claim: Claim) => void;
  onRepairClick?: (repair: Repair) => void;
}

export function ClaimRepairList({ 
  claims, 
  repairs, 
  className = "",
  onClaimClick,
  onRepairClick
}: ClaimRepairListProps) {
  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle>Claims & Repairs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Claims Section */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Claims ({claims.length})
            </h3>
            {claims.length > 0 ? (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div 
                    key={claim.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => onClaimClick?.(claim)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">Claim #{claim.id.slice(0, 8)}</h4>
                        {claim.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {claim.description.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Order: {claim.order_id?.slice(0, 8) || 'N/A'}</span>
                      <span>Submitted: {new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No claims found</p>
            )}
          </div>
          
          {/* Repairs Section */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Repairs ({repairs.length})
            </h3>
            {repairs.length > 0 ? (
              <div className="space-y-3">
                {repairs.map((repair) => (
                  <div 
                    key={repair.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => onRepairClick?.(repair)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">Repair #{repair.id.slice(0, 8)}</h4>
                        {repair.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {repair.notes.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      <ClaimStatusBadge status={repair.status as any} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Order: {repair.order_id?.slice(0, 8) || 'N/A'}</span>
                      <span>Assigned: {repair.assigned_to || 'Unassigned'}</span>
                      <span>Created: {new Date(repair.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No repairs found</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}