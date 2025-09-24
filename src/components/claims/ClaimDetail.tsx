import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Claim, ClaimStatus } from '@/types';
import { useUpdateClaim, useAuditLogs } from '@/hooks/useClaims';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { OrderCustomerLink } from '../shared/OrderCustomerLink';
import { format } from 'date-fns';

interface ClaimDetailProps {
  claim: Claim;
}

export function ClaimDetail({ claim }: ClaimDetailProps) {
  const [status, setStatus] = useState<ClaimStatus>(claim.status);
  const [resolutionNotes, setResolutionNotes] = useState(claim.resolution_notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateClaim } = useUpdateClaim();
  const { data: auditLogs = [] } = useAuditLogs('claim', claim.id);

  const handleStatusChange = () => {
    updateClaim({
      id: claim.id,
      claim: {
        status,
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString(),
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
      },
      onError: (error) => {
        console.error('Error updating claim:', error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Claim Details</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {claim.id}</p>
            </div>
            <ClaimStatusBadge status={claim.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order and Customer Context */}
          {claim.order_id && (
            <div>
              <Label className="text-base font-semibold">Related Order & Customer</Label>
              <div className="mt-2">
                <OrderCustomerLink orderId={claim.order_id} variant="compact" />
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <p className="text-sm">{claim.product_id || 'N/A'}</p>
              </div>
              
              <div>
                <Label>Submitted By</Label>
                <p className="text-sm">{claim.created_by}</p>
              </div>
              
              <div>
                <Label>Submitted Date</Label>
                <p className="text-sm">
                  {claim.created_at ? format(new Date(claim.created_at), 'PPP') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <p className="text-sm capitalize">{claim.status}</p>
              </div>
              
              <div>
                <Label>Reason</Label>
                <p className="text-sm">{claim.reason}</p>
              </div>
              
              <div>
                <Label>Resolution Notes</Label>
                <p className="text-sm">{claim.resolution_notes || 'No resolution notes'}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-end">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline">Update Status</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Claim Status</DialogTitle>
                  <DialogDescription>
                    Update the status and resolution notes for this claim.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value: ClaimStatus) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="resolution-notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution-notes"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStatusChange}>Update Status</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Audit Log Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.created_at ? format(new Date(log.created_at), 'PPP p') : 'N/A'}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.user_id || 'System'}</TableCell>
                    <TableCell>
                      {log.details ? JSON.stringify(log.details) : 'No details'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No audit logs found for this claim.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}