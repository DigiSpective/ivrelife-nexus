import React, { useState, useMemo } from 'react';
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
import { useOrderProducts } from '@/hooks/useOrderProducts';
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

  // Get order items with product details using the same hook as OrderDetail page
  const { orderItems: allOrderItems } = useOrderProducts(claim.order_id || '');

  // Filter order items to show only the product(s) related to this specific claim
  const claimOrderItems = useMemo(() => {
    // Try to extract product SKU from resolution notes
    let productSku: string | null = null;

    if (claim.resolution_notes) {
      const match = claim.resolution_notes.match(/\[PRODUCT_SKU:([^\]]+)\]/);
      if (match) {
        productSku = match[1];
      }
    }

    // Use product_id if available, otherwise use extracted SKU
    const productIdentifier = claim.product_id || productSku;

    if (!productIdentifier) {
      // If no product identifier, show all order items (fallback for old claims)
      console.log('⚠️ ClaimDetail - No product identifier found, showing all items');
      return allOrderItems;
    }

    // Filter to show only items matching this claim's product
    // The identifier could be a variant ID, product ID, or SKU
    const filtered = allOrderItems.filter(item => {
      return (
        item.id === productIdentifier ||
        item.product_variant_id === productIdentifier ||
        item.product?.id === productIdentifier ||
        item.product?.sku === productIdentifier
      );
    });

    console.log('🔍 ClaimDetail - productIdentifier:', productIdentifier);
    console.log('🔍 ClaimDetail - allOrderItems:', allOrderItems.length);
    console.log('🔍 ClaimDetail - filtered items:', filtered.length);

    return filtered.length > 0 ? filtered : allOrderItems;
  }, [claim.product_id, claim.resolution_notes, allOrderItems]);

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
          
          <div className="space-y-4">
            <div>
              <Label>Claimed Product{claimOrderItems.length > 1 ? 's' : ''}</Label>
              {claimOrderItems.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {claimOrderItems.map((item, index) => (
                    <div key={index} className="p-3 border rounded-md bg-blue-50 border-blue-200">
                      <p className="text-sm font-medium">{item.product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.product?.sku || 'N/A'} • Qty: {item.qty} • ${item.unit_price.toLocaleString()} each
                      </p>
                      <p className="text-xs font-semibold text-right mt-1">
                        Line Total: ${item.line_total.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No products found for this claim</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                <p className="text-sm">
                  {claim.resolution_notes
                    ? claim.resolution_notes.replace(/\[PRODUCT_SKU:[^\]]+\]\n?/, '')
                    : 'No resolution notes'}
                </p>
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