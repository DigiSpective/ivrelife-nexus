import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard,
  Plus,
  Trash2,
  Shield,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Lock,
  Wallet,
  Building,
  Globe,
  RefreshCw,
  Edit,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'paypal';
  brand: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isExpired: boolean;
  holderName: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  metadata?: {
    addedDate: string;
    lastUsed?: string;
  };
}

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'credit_card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    isExpired: false,
    holderName: 'John Doe',
    billingAddress: {
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    metadata: {
      addedDate: '2024-01-15',
      lastUsed: '2024-03-01'
    }
  },
  {
    id: '2',
    type: 'credit_card',
    brand: 'Mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2024,
    isDefault: false,
    isExpired: true,
    holderName: 'John Doe',
    billingAddress: {
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    metadata: {
      addedDate: '2023-06-10',
      lastUsed: '2024-01-20'
    }
  }
];

const mockBillingAddresses: BillingAddress[] = [
  {
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    isDefault: true
  },
  {
    line1: '456 Business Ave',
    line2: 'Suite 200',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
    isDefault: false
  }
];

interface PaymentTabProps {
  user: any;
}

export function PaymentTab({ user }: PaymentTabProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>(mockBillingAddresses);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRecharge, setAutoRecharge] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [rechargeThreshold, setRechargeThreshold] = useState(25);
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const { toast } = useToast();

  const getCardIcon = (brand: string) => {
    // In a real app, you'd have specific icons for each brand
    return <CreditCard className="w-5 h-5" />;
  };

  const handleSetDefault = async (methodId: string) => {
    setIsLoading(true);
    try {
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));

      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update default payment method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    setIsLoading(true);
    try {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));

      toast({
        title: "Payment Method Removed",
        description: "Payment method has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: "Could not remove payment method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    try {
      // Simulate adding payment method
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: 'credit_card',
        brand: 'Visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: paymentMethods.length === 0,
        isExpired: false,
        holderName: 'John Doe',
        billingAddress: billingAddresses[0],
        metadata: {
          addedDate: new Date().toISOString().split('T')[0]
        }
      };

      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddCard(false);

      toast({
        title: "Payment Method Added",
        description: "New payment method has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Addition Failed",
        description: "Could not add payment method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Methods
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCardNumbers(!showCardNumbers)}
              >
                {showCardNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCard(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getCardIcon(method.brand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {method.brand} •••• {showCardNumbers ? method.last4 : '••••'}
                      </h4>
                      {method.isDefault && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {method.isExpired && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.holderName}
                    </p>
                    {method.expiryMonth && method.expiryYear && (
                      <p className="text-xs text-muted-foreground">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    )}
                    {method.metadata?.lastUsed && (
                      <p className="text-xs text-muted-foreground">
                        Last used: {new Date(method.metadata.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={isLoading}
                    >
                      Make Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    disabled={isLoading || method.isDefault}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {paymentMethods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment methods found.</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowAddCard(true)}
              >
                Add Your First Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Form */}
      {showAddCard && (
        <Card>
          <CardHeader>
            <CardTitle>Add Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="cardholder-name">Cardholder Name</Label>
                <Input
                  id="cardholder-name"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiry-month">Expiry Month</Label>
                <Input
                  id="expiry-month"
                  placeholder="MM"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="expiry-year">Expiry Year</Label>
                <Input
                  id="expiry-year"
                  placeholder="YYYY"
                  maxLength={4}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="set-default" />
              <Label htmlFor="set-default">Set as default payment method</Label>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddCard(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Payment Method"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Recharge Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Auto-Recharge Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Auto-Recharge</h4>
              <p className="text-sm text-muted-foreground">
                Automatically add credits when balance falls below threshold
              </p>
            </div>
            <Switch
              checked={autoRecharge}
              onCheckedChange={setAutoRecharge}
            />
          </div>

          {autoRecharge && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recharge-threshold">Recharge When Balance Falls Below</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="recharge-threshold"
                      type="number"
                      value={rechargeThreshold}
                      onChange={(e) => setRechargeThreshold(Number(e.target.value))}
                      className="pl-10"
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="recharge-amount">Recharge Amount</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="recharge-amount"
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(Number(e.target.value))}
                      className="pl-10"
                      min="10"
                      max="10000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Billing Addresses
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAddress(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingAddresses.map((address, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                    </h4>
                    {address.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={address.isDefault}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Payment Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Your payments are secure
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                All payment data is encrypted and processed securely through our PCI-compliant payment processor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">256-bit SSL</h4>
              <p className="text-sm text-muted-foreground">Bank-level encryption</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">PCI Compliant</h4>
              <p className="text-sm text-muted-foreground">Industry standards</p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-medium">Global Coverage</h4>
              <p className="text-sm text-muted-foreground">Worldwide payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}