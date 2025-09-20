import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShippingProviders, useShippingMethods, useCreateShippingQuote } from '@/hooks/useShipping';
import { useToast } from '@/components/ui/use-toast';

interface QuoteRequestFormProps {
  orderId?: string;
  retailerId?: string;
  locationId?: string;
  onSuccess?: () => void;
}

export function QuoteRequestForm({ orderId, retailerId, locationId, onSuccess }: QuoteRequestFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    providerId: '',
    methodId: '',
    packageDetails: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    fromAddress: '',
    toAddress: '',
  });
  
  const { toast } = useToast();
  const { data: providers } = useShippingProviders();
  const { data: methods } = useShippingMethods();
  const { mutate: createQuote, isPending: isCreating } = useCreateShippingQuote();
  
  const filteredMethods = methods?.data?.filter(
    method => method.provider_id === formData.providerId
  ) || [];
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDimensionChange = (dimension: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value }
    }));
  };
  
  const handleSubmit = () => {
    // In a real implementation, this would call an edge function to get live quotes
    // For now, we'll create a mock quote
    const quoteData = {
      provider_id: formData.providerId,
      method_id: formData.methodId,
      order_id: orderId,
      retailer_id: retailerId,
      location_id: locationId,
      cost: Math.floor(Math.random() * 100) + 10, // Mock cost
      eta: new Date(Date.now() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(), // Mock ETA
      payload_json: {
        package_details: formData.packageDetails,
        weight: formData.weight,
        dimensions: formData.dimensions,
        from_address: formData.fromAddress,
        to_address: formData.toAddress
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Expires in 15 minutes
    };
    
    createQuote(quoteData, {
      onSuccess: () => {
        toast({
          title: 'Quote Requested',
          description: 'Shipping quote has been successfully requested.',
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: 'Failed to request shipping quote. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };
  
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Request Shipping Quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Package Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="packageDetails">Package Details</Label>
              <Textarea
                id="packageDetails"
                value={formData.packageDetails}
                onChange={(e) => handleChange('packageDetails', e.target.value)}
                placeholder="Describe the package contents..."
              />
            </div>
            
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="Enter package weight"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  placeholder="Length"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  placeholder="Width"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  placeholder="Height"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleNext}>Next</Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Addresses */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fromAddress">From Address</Label>
              <Textarea
                id="fromAddress"
                value={formData.fromAddress}
                onChange={(e) => handleChange('fromAddress', e.target.value)}
                placeholder="Enter sender address"
              />
            </div>
            
            <div>
              <Label htmlFor="toAddress">To Address</Label>
              <Textarea
                id="toAddress"
                value={formData.toAddress}
                onChange={(e) => handleChange('toAddress', e.target.value)}
                placeholder="Enter recipient address"
              />
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Provider & Method */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Shipping Provider</Label>
              <Select value={formData.providerId} onValueChange={(value) => handleChange('providerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.data?.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="method">Shipping Method</Label>
              <Select 
                value={formData.methodId} 
                onValueChange={(value) => handleChange('methodId', value)}
                disabled={!formData.providerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isCreating || !formData.providerId || !formData.methodId}
              >
                {isCreating ? 'Requesting...' : 'Request Quote'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}