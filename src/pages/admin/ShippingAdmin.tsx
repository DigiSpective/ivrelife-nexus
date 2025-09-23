import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Truck, 
  DollarSign, 
  Package, 
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ShippingSettings, 
  CarrierSettings, 
  ShippingZone,
  ShipmentGroup 
} from '@/types/shipping';
import { shippingEngine } from '@/lib/shipping-engine';
import { shipmentManager } from '@/lib/shipment-manager';

export default function ShippingAdmin() {
  const [settings, setSettings] = useState<ShippingSettings>({
    white_glove_flat_fee_usd: 700.00,
    parcel_handling_fee_percent: 0.0,
    oversized_freight_thresholds: {
      weight_lbs: 200,
      dimension_in: 70
    },
    international_white_glove_allowed: false,
    default_origin_address: {
      name: 'IV RELIFE Warehouse',
      company: 'IV RELIFE',
      street1: '123 Warehouse Drive',
      city: 'Dallas',
      state: 'TX',
      postal_code: '75201',
      country: 'US',
      phone: '555-123-4567'
    },
    supported_countries: ['US', 'CA', 'MX'],
    free_shipping_threshold_usd: 1000
  });

  const [carriers, setCarriers] = useState<CarrierSettings[]>([
    {
      carrier_name: 'UPS',
      enabled: true,
      api_credentials: {
        api_key: '',
        api_secret: '',
        account_number: ''
      },
      service_levels: [
        { service_code: 'ups_ground', service_name: 'UPS Ground', estimated_days_min: 1, estimated_days_max: 5, enabled: true, cost_multiplier: 1.0 },
        { service_code: 'ups_2day', service_name: 'UPS 2nd Day Air', estimated_days_min: 2, estimated_days_max: 2, enabled: true, cost_multiplier: 1.5 },
        { service_code: 'ups_express', service_name: 'UPS Next Day Air', estimated_days_min: 1, estimated_days_max: 1, enabled: true, cost_multiplier: 2.0 }
      ],
      restrictions: {
        max_weight_lbs: 150,
        max_dimension_in: 108,
        international_enabled: true
      }
    },
    {
      carrier_name: 'FedEx',
      enabled: true,
      api_credentials: {
        api_key: '',
        api_secret: '',
        account_number: ''
      },
      service_levels: [
        { service_code: 'fedex_ground', service_name: 'FedEx Ground', estimated_days_min: 1, estimated_days_max: 5, enabled: true, cost_multiplier: 1.0 },
        { service_code: 'fedex_2day', service_name: 'FedEx 2Day', estimated_days_min: 2, estimated_days_max: 2, enabled: true, cost_multiplier: 1.4 },
        { service_code: 'fedex_express', service_name: 'FedEx Express', estimated_days_min: 1, estimated_days_max: 1, enabled: true, cost_multiplier: 1.9 }
      ],
      restrictions: {
        max_weight_lbs: 150,
        max_dimension_in: 119,
        international_enabled: true
      }
    },
    {
      carrier_name: 'DHL',
      enabled: false,
      api_credentials: {
        api_key: '',
        api_secret: '',
        account_number: ''
      },
      service_levels: [
        { service_code: 'dhl_express', service_name: 'DHL Express', estimated_days_min: 1, estimated_days_max: 3, enabled: false, cost_multiplier: 2.2 }
      ],
      restrictions: {
        max_weight_lbs: 70,
        max_dimension_in: 120,
        international_enabled: true
      }
    }
  ]);

  const [zones, setZones] = useState<ShippingZone[]>([
    {
      id: 'zone_1',
      name: 'Zone 1 - Local',
      countries: ['US'],
      states: ['TX', 'OK', 'AR', 'LA'],
      multiplier: 1.0,
      base_cost_usd: 15.00
    },
    {
      id: 'zone_2',
      name: 'Zone 2 - Regional',
      countries: ['US'],
      states: ['CA', 'NV', 'AZ', 'NM', 'CO', 'KS', 'MO'],
      multiplier: 1.2,
      base_cost_usd: 18.00
    },
    {
      id: 'zone_3',
      name: 'Zone 3 - National',
      countries: ['US'],
      multiplier: 1.5,
      base_cost_usd: 25.00
    },
    {
      id: 'zone_4',
      name: 'Zone 4 - International',
      countries: ['CA', 'MX'],
      multiplier: 2.0,
      base_cost_usd: 45.00
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [testingRates, setTestingRates] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Update shipping engine settings
      shippingEngine.updateSettings(settings);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestRates = async () => {
    setTestingRates(true);
    try {
      // Test rate calculation with sample data
      const testItems = [
        {
          id: 'test_1',
          product_id: 'boss-plus',
          product: {
            id: 'boss-plus',
            name: 'Boss Plus Massage Chair',
            price_usd: 11990,
            weight_lbs: 192,
            dimensions_in: { length: 61, width: 30, height: 46 },
            category: 'Massage Chair'
          },
          quantity: 1,
          is_gift: false,
          shipping_profile_id: 'white_glove',
          white_glove_selected: true,
          extended_warranty_selected: false
        }
      ];

      const testDestination = {
        name: 'Test Customer',
        street1: '123 Test Street',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      const rates = await shippingEngine.calculateRates({
        items: testItems as any,
        destination_address: testDestination
      });

      console.log('Test rates calculated:', rates);
      alert('Rate calculation test completed successfully!');
    } catch (error) {
      console.error('Rate test failed:', error);
      alert('Rate calculation test failed. Check console for details.');
    } finally {
      setTestingRates(false);
    }
  };

  const updateCarrier = (carrierName: string, updates: Partial<CarrierSettings>) => {
    setCarriers(prev => prev.map(carrier => 
      carrier.carrier_name === carrierName ? { ...carrier, ...updates } : carrier
    ));
  };

  const updateServiceLevel = (carrierName: string, serviceCode: string, updates: any) => {
    setCarriers(prev => prev.map(carrier => {
      if (carrier.carrier_name === carrierName) {
        return {
          ...carrier,
          service_levels: carrier.service_levels.map(service =>
            service.service_code === serviceCode ? { ...service, ...updates } : service
          )
        };
      }
      return carrier;
    }));
  };

  const shipmentStats = shipmentManager.getShipmentStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Administration</h1>
          <p className="text-muted-foreground">
            Manage shipping methods, carriers, and business rules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestRates}
            disabled={testingRates}
          >
            {testingRates ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Package className="w-4 h-4 mr-2" />
            )}
            Test Rates
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {lastSaved && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Settings saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Carriers</p>
                <p className="text-2xl font-bold">{carriers.filter(c => c.enabled).length}</p>
              </div>
              <Truck className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shipping Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                <p className="text-2xl font-bold">{shipmentStats.by_status?.SHIPPED || 0}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">White Glove Fee</p>
                <p className="text-2xl font-bold">{formatPrice(settings.white_glove_flat_fee_usd)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="rules">Business Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Shipping Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing & Fees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="white-glove-fee">White Glove Flat Fee (USD)</Label>
                    <Input
                      id="white-glove-fee"
                      type="number"
                      step="0.01"
                      value={settings.white_glove_flat_fee_usd}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        white_glove_flat_fee_usd: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="handling-fee">Parcel Handling Fee (%)</Label>
                    <Input
                      id="handling-fee"
                      type="number"
                      step="0.01"
                      value={settings.parcel_handling_fee_percent * 100}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        parcel_handling_fee_percent: parseFloat(e.target.value) / 100
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="free-shipping">Free Shipping Threshold (USD)</Label>
                    <Input
                      id="free-shipping"
                      type="number"
                      value={settings.free_shipping_threshold_usd || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        free_shipping_threshold_usd: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Oversized Item Thresholds */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Oversized Freight Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight-threshold">Weight Threshold (lbs)</Label>
                    <Input
                      id="weight-threshold"
                      type="number"
                      value={settings.oversized_freight_thresholds.weight_lbs}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        oversized_freight_thresholds: {
                          ...prev.oversized_freight_thresholds,
                          weight_lbs: parseInt(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimension-threshold">Max Dimension Threshold (inches)</Label>
                    <Input
                      id="dimension-threshold"
                      type="number"
                      value={settings.oversized_freight_thresholds.dimension_in}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        oversized_freight_thresholds: {
                          ...prev.oversized_freight_thresholds,
                          dimension_in: parseInt(e.target.value)
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* International Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">International Shipping</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="international-white-glove"
                      checked={settings.international_white_glove_allowed}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        international_white_glove_allowed: !!checked
                      }))}
                    />
                    <Label htmlFor="international-white-glove">
                      Allow white glove delivery for international orders
                    </Label>
                  </div>
                  
                  <div>
                    <Label>Supported Countries</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {settings.supported_countries.map(country => (
                        <Badge key={country} variant="outline">{country}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Origin Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Origin Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin-name">Name</Label>
                    <Input
                      id="origin-name"
                      value={settings.default_origin_address.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          name: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origin-company">Company</Label>
                    <Input
                      id="origin-company"
                      value={settings.default_origin_address.company || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          company: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origin-street">Street Address</Label>
                    <Input
                      id="origin-street"
                      value={settings.default_origin_address.street1}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          street1: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origin-city">City</Label>
                    <Input
                      id="origin-city"
                      value={settings.default_origin_address.city}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          city: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origin-state">State</Label>
                    <Input
                      id="origin-state"
                      value={settings.default_origin_address.state}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          state: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="origin-zip">ZIP Code</Label>
                    <Input
                      id="origin-zip"
                      value={settings.default_origin_address.postal_code}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_origin_address: {
                          ...prev.default_origin_address,
                          postal_code: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          {carriers.map((carrier) => (
            <Card key={carrier.carrier_name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    {carrier.carrier_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={carrier.enabled}
                      onCheckedChange={(checked) => updateCarrier(carrier.carrier_name, { enabled: !!checked })}
                    />
                    <Label>Enabled</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={carrier.api_credentials.api_key || ''}
                      onChange={(e) => updateCarrier(carrier.carrier_name, {
                        api_credentials: {
                          ...carrier.api_credentials,
                          api_key: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={carrier.api_credentials.api_secret || ''}
                      onChange={(e) => updateCarrier(carrier.carrier_name, {
                        api_credentials: {
                          ...carrier.api_credentials,
                          api_secret: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={carrier.api_credentials.account_number || ''}
                      onChange={(e) => updateCarrier(carrier.carrier_name, {
                        api_credentials: {
                          ...carrier.api_credentials,
                          account_number: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Service Levels</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Cost Multiplier</TableHead>
                        <TableHead>Enabled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carrier.service_levels.map((service) => (
                        <TableRow key={service.service_code}>
                          <TableCell>{service.service_name}</TableCell>
                          <TableCell>
                            {service.estimated_days_min}-{service.estimated_days_max}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={service.cost_multiplier}
                              onChange={(e) => updateServiceLevel(
                                carrier.carrier_name,
                                service.service_code,
                                { cost_multiplier: parseFloat(e.target.value) }
                              )}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={service.enabled}
                              onCheckedChange={(checked) => updateServiceLevel(
                                carrier.carrier_name,
                                service.service_code,
                                { enabled: !!checked }
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label>Max Weight (lbs)</Label>
                    <div>{carrier.restrictions.max_weight_lbs}</div>
                  </div>
                  <div>
                    <Label>Max Dimension (in)</Label>
                    <div>{carrier.restrictions.max_dimension_in}</div>
                  </div>
                  <div>
                    <Label>International</Label>
                    <Badge variant={carrier.restrictions.international_enabled ? "default" : "secondary"}>
                      {carrier.restrictions.international_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Zones</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure shipping zones and their base costs
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Base Cost</TableHead>
                    <TableHead>Multiplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {zone.countries.map(country => (
                              <Badge key={country} variant="outline" className="text-xs">
                                {country}
                              </Badge>
                            ))}
                          </div>
                          {zone.states && (
                            <div className="text-xs text-muted-foreground">
                              {zone.states.length} states
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(zone.base_cost_usd)}</TableCell>
                      <TableCell>{zone.multiplier}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Rules</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure shipping business logic and restrictions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="rule-br1" defaultChecked />
                  <Label htmlFor="rule-br1">
                    <strong>BR1:</strong> Oversized items automatically assigned to LTL freight
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="rule-br2" defaultChecked />
                  <Label htmlFor="rule-br2">
                    <strong>BR2:</strong> Gift items always ship separately via standard parcel
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="rule-br3" defaultChecked />
                  <Label htmlFor="rule-br3">
                    <strong>BR3:</strong> White-glove only offered for assembly-required items in USA/Canada
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="rule-br4" defaultChecked />
                  <Label htmlFor="rule-br4">
                    <strong>BR4:</strong> International shipments hide white-glove if not allowed
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="rule-br5" defaultChecked />
                  <Label htmlFor="rule-br5">
                    <strong>BR5:</strong> Use fallback rates if ShipStation API fails
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">API Configuration Required</span>
                </div>
                <p className="text-sm text-amber-700">
                  To enable real-time shipping rates, configure your ShipStation API credentials in the environment variables:
                </p>
                <ul className="text-sm text-amber-700 mt-2 ml-4 list-disc">
                  <li>SHIPSTATION_API_KEY</li>
                  <li>SHIPSTATION_API_SECRET</li>
                  <li>SHIPSTATION_WAREHOUSE_ID</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}