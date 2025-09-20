import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useShippingQuotes } from '@/hooks/useShipping';
import { format } from 'date-fns';

interface QuotesListProps {
  orderId?: string;
  retailerId?: string;
  locationId?: string;
  onQuoteSelect?: (quoteId: string) => void;
}

export function QuotesList({ orderId, retailerId, locationId, onQuoteSelect }: QuotesListProps) {
  const { data: quotes, isLoading } = useShippingQuotes({ order_id: orderId, retailer_id: retailerId, location_id: locationId });
  
  if (isLoading) {
    return <div>Loading quotes...</div>;
  }
  
  const filteredQuotes = quotes?.data || [];
  
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Shipping Quotes</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shipping quotes available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.provider_id || 'N/A'}</TableCell>
                  <TableCell>{quote.method_id || 'N/A'}</TableCell>
                  <TableCell>${quote.cost?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell>
                    {quote.eta ? format(new Date(quote.eta), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {quote.expires_at ? format(new Date(quote.expires_at), 'MMM d, yyyy HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={new Date(quote.expires_at || '') > new Date() ? 'default' : 'destructive'}>
                      {new Date(quote.expires_at || '') > new Date() ? 'Valid' : 'Expired'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      onClick={() => onQuoteSelect?.(quote.id)}
                      disabled={new Date(quote.expires_at || '') < new Date()}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}