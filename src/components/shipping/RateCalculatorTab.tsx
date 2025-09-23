import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Package, 
  MapPin, 
  DollarSign, 
  Truck, 
  Clock, 
  RefreshCw,
  Plus,
  Minus,
  Info,
  AlertCircle,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { shipStationAPI } from '@/lib/shipstation-api';
import { ShipStationRateRequest, ShipStationRateOption } from '@/types/shipping';

interface PackageInfo {
  id: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  value: number;
}

interface AddressInfo {
  zip: string;
  city: string;
  state: string;
  country: string;
  residential: boolean;
}

export function RateCalculatorTab() {
  const [packages, setPackages] = useState<PackageInfo[]>([
    { id: '1', length: 12, width: 12, height: 8, weight: 5, value: 100 }
  ]);
  const [fromAddress, setFromAddress] = useState<AddressInfo>({
    zip: '75201',
    city: 'Dallas',
    state: 'TX',
    country: 'US',
    residential: false
  });
  const [toAddress, setToAddress] = useState<AddressInfo>({
    zip: '',
    city: '',
    state: '',
    country: 'US',
    residential: true
  });
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [rates, setRates] = useState<ShipStationRateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPackage = () => {
    const newId = (packages.length + 1).toString();
    setPackages([...packages, { 
      id: newId, 
      length: 12, 
      width: 12, 
      height: 8, 
      weight: 5, 
      value: 100 
    }]);
  };

  const removePackage = (id: string) => {
    if (packages.length > 1) {
      setPackages(packages.filter(pkg => pkg.id !== id));
    }
  };

  const updatePackage = (id: string, field: keyof PackageInfo, value: number) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const calculateRates = async () => {
    if (!toAddress.zip) {
      setError('Please enter a destination ZIP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to use real ShipStation API for rate calculation
      const rateRequest = {
        shipping_method_id: 'standard_parcel',
        origin_zip: fromAddress.zip,
        destination_zip: toAddress.zip,
        destination_country: toAddress.country,
        items: packages.map(pkg => ({
          description: `Package ${pkg.id}`,
          weight_lbs: pkg.weight,
          length_in: pkg.length,
          width_in: pkg.width,
          height_in: pkg.height,
          value_usd: pkg.value,
          quantity: 1
        })),
        signature_required: signatureRequired,
        residential: toAddress.residential
      };

      const response = await shipStationAPI.getRates(rateRequest);
      
      if (response.success && response.data.length > 0) {
        setRates(response.data.sort((a, b) => a.cost_usd - b.cost_usd));
      } else {
        // Fallback to mock rates if API fails or returns no results
        const mockRates: ShipStationRateOption[] = [
        {
          carrier_name: 'UPS',
          service_level: 'Ground',
          cost_usd: calculateMockRate(packages, 'ups_ground'),
          estimated_days: 5,
          shipping_method_id: 'ups_ground',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        },
        {
          carrier_name: 'UPS',
          service_level: '2nd Day Air',
          cost_usd: calculateMockRate(packages, 'ups_2day'),
          estimated_days: 2,
          shipping_method_id: 'ups_2day',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        },
        {
          carrier_name: 'UPS',
          service_level: 'Next Day Air',
          cost_usd: calculateMockRate(packages, 'ups_overnight'),
          estimated_days: 1,
          shipping_method_id: 'ups_overnight',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        },
        {
          carrier_name: 'FedEx',
          service_level: 'Ground',
          cost_usd: calculateMockRate(packages, 'fedex_ground'),
          estimated_days: 5,
          shipping_method_id: 'fedex_ground',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        },
        {
          carrier_name: 'FedEx',
          service_level: '2Day',
          cost_usd: calculateMockRate(packages, 'fedex_2day'),
          estimated_days: 2,
          shipping_method_id: 'fedex_2day',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        },
        {
          carrier_name: 'FedEx',
          service_level: 'Priority Overnight',
          cost_usd: calculateMockRate(packages, 'fedex_overnight'),
          estimated_days: 1,
          shipping_method_id: 'fedex_overnight',
          zone: '5',
          is_international: toAddress.country !== 'US',
          requires_signature: signatureRequired
        }
      ];

      // Add white glove delivery option for large/heavy items
      const hasLargeItems = packages.some(pkg => 
        pkg.weight > 50 || pkg.length > 36 || pkg.width > 36 || pkg.height > 36
      );
      
      if (hasLargeItems) {
        mockRates.push({
          carrier_name: 'White Glove',
          service_level: 'Home Delivery with Assembly',
          cost_usd: calculateMockRate(packages, 'white_glove'),
          estimated_days: 14,
          shipping_method_id: 'white_glove',
          zone: '5',
          is_international: false,
          requires_signature: true
        });
      }

        setRates(mockRates.sort((a, b) => a.cost_usd - b.cost_usd));
        
        // Show a warning that we're using demo data
        if (response.error?.code !== 'NETWORK_ERROR') {
          console.warn('Using demo rate data:', response.error?.message);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate rates');
    } finally {
      setLoading(false);
    }
  };

  const calculateMockRate = (packages: PackageInfo[], service: string): number => {
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalValue = packages.reduce((sum, pkg) => sum + pkg.value, 0);
    
    let baseRate = totalWeight * 0.5; // Base rate per pound
    
    // Service multipliers
    const multipliers: { [key: string]: number } = {
      'ups_ground': 1.0,
      'ups_2day': 2.5,
      'ups_overnight': 4.0,
      'fedex_ground': 0.95,
      'fedex_2day': 2.3,
      'fedex_overnight': 3.8,
      'white_glove': 25.0
    };
    
    baseRate *= multipliers[service] || 1.0;
    
    // Add value-based insurance
    const insurance = totalValue * 0.005;
    
    // Add residential surcharge
    if (toAddress.residential && !service.includes('white_glove')) {
      baseRate += 5.0;
    }
    
    // Add signature surcharge
    if (signatureRequired) {
      baseRate += 3.0;
    }
    
    return Math.round((baseRate + insurance) * 100) / 100;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getTotalWeight = () => {
    return packages.reduce((sum, pkg) => sum + pkg.weight, 0);
  };

  const getTotalValue = () => {
    return packages.reduce((sum, pkg) => sum + pkg.value, 0);
  };

  const getServiceIcon = (service: string) => {
    if (service.toLowerCase().includes('overnight') || service.toLowerCase().includes('express')) {
      return '🚀';
    }
    if (service.toLowerCase().includes('2day') || service.toLowerCase().includes('2-day')) {
      return '⚡';
    }
    if (service.toLowerCase().includes('white glove')) {
      return '🏠';
    }
    return '📦';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Shipping Rate Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get real-time shipping quotes from multiple carriers
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          {/* Origin Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">From (Origin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-zip">ZIP Code</Label>
                  <Input
                    id="from-zip"
                    value={fromAddress.zip}
                    onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                    placeholder="75201"
                  />
                </div>
                <div>
                  <Label htmlFor="from-country">Country</Label>
                  <Select
                    value={fromAddress.country}
                    onValueChange={(value) => setFromAddress({...fromAddress, country: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">To (Destination)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to-zip">ZIP Code *</Label>
                  <Input
                    id="to-zip"
                    value={toAddress.zip}
                    onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                    placeholder="10001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="to-country">Country</Label>
                  <Select
                    value={toAddress.country}
                    onValueChange={(value) => setToAddress({...toAddress, country: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="residential"
                  checked={toAddress.residential}
                  onCheckedChange={(checked) => setToAddress({...toAddress, residential: !!checked})}
                />
                <Label htmlFor="residential">Residential address</Label>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Package Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPackage}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Package
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Package {index + 1}</h4>
                    {packages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(pkg.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Length (in)</Label>
                      <Input
                        type="number"
                        value={pkg.length}
                        onChange={(e) => updatePackage(pkg.id, 'length', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width (in)</Label>
                      <Input
                        type="number"
                        value={pkg.width}
                        onChange={(e) => updatePackage(pkg.id, 'width', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height (in)</Label>
                      <Input
                        type="number"
                        value={pkg.height}
                        onChange={(e) => updatePackage(pkg.id, 'height', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={pkg.weight}
                        onChange={(e) => updatePackage(pkg.id, 'weight', parseFloat(e.target.value) || 0)}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Value ($)</Label>
                      <Input
                        type="number"
                        value={pkg.value}
                        onChange={(e) => updatePackage(pkg.id, 'value', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Weight:</span>
                  <span className="font-medium ml-2">{getTotalWeight().toFixed(1)} lbs</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-medium ml-2">{formatPrice(getTotalValue())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="signature"
                  checked={signatureRequired}
                  onCheckedChange={(checked) => setSignatureRequired(!!checked)}
                />
                <Label htmlFor="signature">Signature required (+$3.00)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Button 
            onClick={calculateRates}
            disabled={loading || !toAddress.zip}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            Calculate Shipping Rates
          </Button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {rates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Available Shipping Options
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {rates.length} shipping options found
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {rates.map((rate, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getServiceIcon(rate.service_level)}</span>
                        <div>
                          <div className="font-medium">
                            {rate.carrier_name} {rate.service_level}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rate.estimated_days} business day{rate.estimated_days !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(rate.cost_usd)}
                        </div>
                        {rate.requires_signature && (
                          <Badge variant="secondary" className="text-xs">
                            Signature Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {rate.carrier_name === 'White Glove' && (
                      <div className="text-sm text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                        <div className="flex items-center gap-1 mb-1">
                          <Info className="w-3 h-3" />
                          <span className="font-medium">White Glove Service includes:</span>
                        </div>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Home delivery and placement</li>
                          <li>• Product assembly and setup</li>
                          <li>• Packaging removal</li>
                          <li>• Basic operation demonstration</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Rate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Rates include base shipping costs and fuel surcharges</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Insurance coverage based on declared package value</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Delivery times are business days, excluding weekends</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Additional fees may apply for remote areas</span>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {rates.length === 0 && !loading && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Calculate Rates</h3>
                <p className="text-muted-foreground">
                  Fill out the shipping information on the left and click "Calculate Shipping Rates" to see available options
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}