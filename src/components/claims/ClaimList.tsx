import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Claim, ClaimStatus } from '@/types';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { format } from 'date-fns';

interface ClaimListProps {
  claims: Claim[];
  onNewClaim: () => void;
}

export function ClaimList({ claims, onNewClaim }: ClaimListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');

  // Ensure claims is always an array
  const claimsArray = Array.isArray(claims) ? claims : [];

  const filteredClaims = claimsArray.filter(claim => {
    const matchesSearch = 
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.order_id && claim.order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (claim.reason && claim.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Claims</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer claims and returns
          </p>
        </div>
        <Button onClick={onNewClaim}>
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(value: ClaimStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Claims Table */}
          {filteredClaims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.id.slice(0, 8)}</TableCell>
                    <TableCell>{claim.order_id ? claim.order_id.slice(0, 8) : 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{claim.reason}</TableCell>
                    <TableCell>
                      <ClaimStatusBadge status={claim.status} />
                    </TableCell>
                    <TableCell>
                      {claim.created_at ? format(new Date(claim.created_at), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/claims/${claim.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No claims match your search criteria.' 
                  : 'No claims found.'}
              </div>
              <Button onClick={onNewClaim}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Claim
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}