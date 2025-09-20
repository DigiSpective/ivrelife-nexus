import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, MapPin } from 'lucide-react';
import { Fulfillment, ShippingProvider, ShippingMethod } from '@/types';
import { FulfillmentStatusBadge } from './FulfillmentStatusBadge';

interface ShippingInfoProps {
  fulfillment: Fulfillment;
  provider?: ShippingProvider;
  method?: ShippingMethod;
  className?: string;
}

export function ShippingInfo({ 
  fulfillment, 
  provider, 
  method, 
  className = "" 
}: ShippingInfoProps) {
  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Tracking Number
            </div>
            <div className="font-medium">
              {fulfillment.tracking_number || 'Not available'}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Status
            </div>
            <FulfillmentStatusBadge status={fulfillment.status} />
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Provider
            </div>
            <div>
              {provider?.name || 'Not specified'}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Method
            </div>
            <div>
              {method?.name || 'Not specified'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Created: {new Date(fulfillment.created_at).toLocaleDateString()}
          </div>
          {fulfillment.last_check && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Last Update: {new Date(fulfillment.last_check).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}