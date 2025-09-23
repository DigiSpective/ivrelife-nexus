import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Gift,
  Settings,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ShipmentGroup, 
  ShippingRateOption, 
  Address,
  CartLineItem 
} from '@/types/shipping';
import { shippingEngine } from '@/lib/shipping-engine';

interface ShippingOptionsDisplayProps {
  items: CartLineItem[];
  destination: Address;
  onSelectionChange: (selections: { [groupId: string]: string }) => void;
  className?: string;
}

export const ShippingOptionsDisplay: React.FC<ShippingOptionsDisplayProps> = ({
  items,
  destination,
  onSelectionChange,
  className = ''
}) => {
  const [shipmentGroups, setShipmentGroups] = useState<ShipmentGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateShippingRates();
  }, [items, destination]);

  useEffect(() => {
    onSelectionChange(selectedOptions);
  }, [selectedOptions, onSelectionChange]);

  const calculateShippingRates = async () => {
    setLoading(true);
    setError(null);

    try {
      const rateResponse = await shippingEngine.calculateRates({
        items,
        destination_address: destination
      });

      setShipmentGroups(rateResponse.shipment_groups);

      // Auto-select the first (cheapest) option for each group
      const autoSelections: { [groupId: string]: string } = {};
      rateResponse.shipment_groups.forEach(group => {
        if (group.rate_options.length > 0) {
          autoSelections[group.id] = group.rate_options[0].shipping_profile_id;
        }
      });
      setSelectedOptions(autoSelections);

    } catch (err) {
      setError('Failed to calculate shipping rates. Please try again.');
      console.error('Shipping calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'gift':
        return <Gift className="w-5 h-5 text-purple-600" />;
      case 'ltl':
        return <Truck className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-blue-600" />;
    }
  };

  const getGroupTitle = (groupType: string) => {
    switch (groupType) {
      case 'gift':
        return 'Gift Shipment';
      case 'ltl':
        return 'Freight Shipment';
      default:
        return 'Standard Shipment';
    }
  };

  const getTotalCost = () => {
    return shipmentGroups.reduce((total, group) => {
      const selectedOption = group.rate_options.find(
        option => option.shipping_profile_id === selectedOptions[group.id]
      );
      return total + (selectedOption?.cost_usd || 0);
    }, 0);
  };

  const getEarliestDelivery = () => {
    const selectedRates = shipmentGroups.map(group => 
      group.rate_options.find(option => option.shipping_profile_id === selectedOptions[group.id])
    ).filter(Boolean);

    if (selectedRates.length === 0) return null;

    const maxDays = Math.max(...selectedRates.map(rate => rate!.estimated_days));
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + maxDays);
    
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Calculating Shipping Options...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Shipping Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={calculateShippingRates} variant="outline">
            Retry Calculation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Options
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select shipping method for each shipment group
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {shipmentGroups.map((group) => (
              <div key={group.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  {getGroupIcon(group.group_type)}
                  <div>
                    <h3 className="font-semibold">{getGroupTitle(group.group_type)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                      {group.group_type === 'gift' && (
                        <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                          Free
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Items in this shipment */}
                <div className="ml-8 space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span>{item.product.name}</span>
                      <span className="text-muted-foreground">× {item.quantity}</span>
                      {item.is_gift && (
                        <Badge variant="outline" className="text-xs">Gift</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shipping options */}
                <div className="ml-8">
                  <RadioGroup
                    value={selectedOptions[group.id] || ''}
                    onValueChange={(value) => handleOptionSelect(group.id, value)}
                  >
                    {group.rate_options.map((option) => (
                      <div key={option.shipping_profile_id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={option.shipping_profile_id} 
                            id={option.shipping_profile_id}
                          />
                          <Label 
                            htmlFor={option.shipping_profile_id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {option.carrier_name} {option.service_level}
                                  </span>
                                  {option.service_level.includes('Express') && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      Fast
                                    </Badge>
                                  )}
                                  {option.assembly_included && (
                                    <Badge variant="outline" className="text-xs">
                                      <Settings className="w-3 h-3 mr-1" />
                                      Assembly
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {option.estimated_days} business day{option.estimated_days !== 1 ? 's' : ''}
                                  </div>
                                  {option.requires_signature && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Signature required
                                    </div>
                                  )}
                                </div>
                                {option.restrictions && option.restrictions.length > 0 && (
                                  <div className="text-xs text-amber-600">
                                    {option.restrictions.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {option.cost_usd === 0 ? 'Free' : formatPrice(option.cost_usd)}
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {group.requires_freight_quote && (
                  <div className="ml-8 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Freight Quote Required</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Large items require freight shipping. Final rates will be confirmed after order placement.
                    </p>
                  </div>
                )}

                <Separator />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Shipping Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shipmentGroups.map((group) => {
              const selectedOption = group.rate_options.find(
                option => option.shipping_profile_id === selectedOptions[group.id]
              );
              
              if (!selectedOption) return null;

              return (
                <div key={group.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getGroupIcon(group.group_type)}
                    <span className="text-sm">
                      {getGroupTitle(group.group_type)} - {selectedOption.carrier_name} {selectedOption.service_level}
                    </span>
                  </div>
                  <span className="font-medium">
                    {selectedOption.cost_usd === 0 ? 'Free' : formatPrice(selectedOption.cost_usd)}
                  </span>
                </div>
              );
            })}

            <Separator />

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Shipping:</span>
              <span>{formatPrice(getTotalCost())}</span>
            </div>

            {getEarliestDelivery() && (
              <div className="text-sm text-muted-foreground text-center mt-3">
                Estimated delivery by {getEarliestDelivery()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gift Shipping Info */}
      {shipmentGroups.some(group => group.group_type === 'gift') && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Gift Shipment Information</h3>
            </div>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• Gift items ship separately at no additional cost</p>
              <p>• Includes gift receipt and special packaging</p>
              <p>• Tracking information provided separately</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShippingOptionsDisplay;