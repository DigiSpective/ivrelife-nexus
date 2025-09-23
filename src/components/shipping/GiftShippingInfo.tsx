import React from 'react';
import { Gift, Truck, Package, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shipment, 
  CartLineItem 
} from '@/types/shipping';

interface GiftShippingInfoProps {
  giftItems: CartLineItem[];
  giftShipment?: Shipment;
  className?: string;
}

export const GiftShippingInfo: React.FC<GiftShippingInfoProps> = ({
  giftItems,
  giftShipment,
  className = ''
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const calculateGiftValue = () => {
    return giftItems.reduce((total, item) => {
      const itemPrice = item.product.sale_price_usd || item.product.price_usd;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'SHIPPED':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (giftItems.length === 0) {
    return null;
  }

  return (
    <Card className={`border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Gift className="w-6 h-6" />
          Gift Shipment Details
        </CardTitle>
        <p className="text-sm text-purple-600">
          Your complimentary gift items will be shipped separately
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Gift Items List */}
        <div>
          <h4 className="font-medium text-purple-800 mb-2">Gift Items Included:</h4>
          <div className="space-y-2">
            {giftItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    FREE
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Value: {formatPrice(item.product.sale_price_usd || item.product.price_usd)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Shipping Information */}
        <div>
          <h4 className="font-medium text-purple-800 mb-2">Shipping Information:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Carrier:</span>
                <span>{giftShipment?.carrier || 'Standard Parcel Service'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Service:</span>
                <span>{giftShipment?.service_level || 'Ground Shipping'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Delivery:</span>
                <span>3-7 business days</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {giftShipment?.tracking_number && (
                <div className="text-sm">
                  <span className="font-medium">Tracking:</span>
                  <div className="font-mono text-blue-600 break-all">
                    {giftShipment.tracking_number}
                  </div>
                </div>
              )}
              
              {giftShipment?.status && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(giftShipment.status)}
                  <Badge className={getStatusColor(giftShipment.status)}>
                    {giftShipment.status.replace('_', ' ')}
                  </Badge>
                </div>
              )}
              
              {giftShipment?.estimated_delivery_date && (
                <div className="text-sm">
                  <span className="font-medium">Est. Delivery:</span>
                  <div>
                    {new Date(giftShipment.estimated_delivery_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Gift Features */}
        <div>
          <h4 className="font-medium text-purple-800 mb-2">Special Gift Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Free shipping included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Gift receipt included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Special gift packaging</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Separate delivery tracking</span>
            </div>
          </div>
        </div>

        {/* Gift Value Summary */}
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-purple-800">Total Gift Value:</h4>
              <p className="text-sm text-purple-600">
                Complimentary with your purchase
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-800">
                {formatPrice(calculateGiftValue())}
              </div>
              <div className="text-sm text-green-600 font-medium">
                YOU SAVE 100%
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-purple-100 p-3 rounded-lg">
          <h5 className="font-medium text-purple-800 mb-1">Important Notes:</h5>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Gift items will ship separately from your main order</li>
            <li>• No pricing information will be included in the package</li>
            <li>• Gift items cannot be returned for cash value</li>
            <li>• Delivery address will match your main order unless specified</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftShippingInfo;