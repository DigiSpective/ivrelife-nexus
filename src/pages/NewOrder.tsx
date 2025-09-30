import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Package, 
  Truck, 
  FileText,
  Camera,
  PenTool
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sampleProducts } from '@/data/sampleProducts';
import { useAvailableProducts } from '@/hooks/useOrderProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/components/cart/CartManager';
import { useAuth } from '@/hooks/useAuth';

const customerSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  notes: z.string().optional()
});

const productSchema = z.object({
  items: z.array(z.object({
    product_variant_id: z.string(),
    qty: z.number().min(1)
  })).min(1, 'Please add at least one product')
});

type CustomerForm = z.infer<typeof customerSchema>;
type ProductForm = z.infer<typeof productSchema>;

const steps = [
  { id: 1, name: 'Customer', icon: User },
  { id: 2, name: 'Products', icon: Package },
  { id: 3, name: 'Shipping', icon: Truck },
  { id: 4, name: 'Review & Sign', icon: FileText }
];

export default function NewOrder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { user } = useAuth();
  
  // Get dynamic customers instead of static mock data
  const { data: customersData } = useCustomers();
  const customers = customersData?.data || [];
  const availableProducts = useAvailableProducts();
  
  // Order creation hook - using simple direct store
  const { mutate: createOrderMutation, isPending: isCreatingOrder } = useCreateOrder();

  // Initialize cart data if coming from cart checkout
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.fromCart && locationState?.cartItems) {
      console.log('Initializing order form with cart data:', locationState.cartItems);
      setSelectedItems(locationState.cartItems);
      
      // Show success message
      toast({
        title: 'Cart Items Loaded',
        description: `${locationState.cartItems.length} items loaded from your cart.`,
      });
      
      // If we have cart items, skip directly to step 2 (products already selected)
      // setCurrentStep(2);
    }
  }, [location.state, toast]);

  const customerForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema)
  });

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema)
  });

  const handleCustomerNext = (data: CustomerForm) => {
    console.log('handleCustomerNext called with data:', data);
    setOrderData(prev => ({ ...prev, ...data }));
    console.log('OrderData updated, moving to step 2');
    setCurrentStep(2);
  };

  const handleProductNext = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No products selected",
        description: "Please add at least one product to continue",
        variant: "destructive"
      });
      return;
    }
    setOrderData(prev => ({ ...prev, items: selectedItems }));
    setCurrentStep(3);
  };

  const addItem = (productId: string) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (product) {
      setSelectedItems(prev => [...prev, { product, qty: 1 }]);
    }
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) return;
    setSelectedItems(prev => 
      prev.map((item, i) => i === index ? { ...item, qty } : item)
    );
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      const price = item.product.sale_price_usd || item.product.price_usd;
      return total + (price * item.qty);
    }, 0);
  };

  const handleSubmit = () => {
    console.log('handleSubmit called');
    console.log('orderData:', orderData);
    console.log('selectedItems:', selectedItems);

    // Validate required data
    if (!orderData.customer_id) {
      console.warn('No customer_id found in orderData');
      toast({
        title: "Validation Error",
        description: "Please select a customer before creating the order.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Customer validation passed, customer_id:', orderData.customer_id);

    if (selectedItems.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one product to the order.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create orders.",
        variant: "destructive"
      });
      return;
    }

    // Calculate totals
    const subtotal = selectedItems.reduce((sum, item) => {
      const price = item.product.sale_price_usd || item.product.price_usd;
      return sum + (price * item.qty);
    }, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + tax;

    // Prepare order data - match actual database schema
    // IMPORTANT: Only send fields that are explicitly in the database schema
    // Do NOT send status field - let database default handle it to avoid enum errors
    const newOrderData = {
      retailer_id: '550e8400-e29b-41d4-a716-446655440000', // Use the UUID from the test data
      customer_id: orderData.customer_id,
      created_by: user?.id || '', // Current authenticated user
      total_amount: total, // Total amount including tax
      notes: orderData.notes || '',
      // Explicitly DO NOT include status field to avoid enum constraint errors
    };

    console.log('Prepared order data:', newOrderData);

    createOrderMutation(newOrderData, {
      onSuccess: (data) => {
        const orderNumber = `ORD-${String(Date.now()).slice(-4)}`;
        
        // Clear cart if this order came from cart checkout
        const locationState = location.state as any;
        if (locationState?.fromCart) {
          clearCart();
          console.log('Cart cleared after successful order creation');
        }
        
        toast({
          title: "Order created successfully!",
          description: `Order #${orderNumber} has been created and contract generated.`
        });
        navigate('/orders');
      },
      onError: (error) => {
        console.error('React Query mutation onError triggered');
        console.error('Error object:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        toast({
          title: "Error creating order",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Order</h1>
          <p className="text-muted-foreground mt-1">
            Create a new customer order
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step.id <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={customerForm.handleSubmit(handleCustomerNext)} className="space-y-6">
              <div>
                <Label>Select Customer</Label>
                <select 
                  {...customerForm.register('customer_id')}
                  className="w-full mt-1 p-2 border border-input rounded-md"
                >
                  <option value="">Choose a customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  {...customerForm.register('notes')}
                  placeholder="Special instructions or notes for this order..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                Continue to Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Select Products
              </CardTitle>
              {location.state?.fromCart && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  ✅ <strong>{selectedItems.length} items</strong> loaded from your cart
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">All Products</h3>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {availableProducts.map(product => {
                      const displayPrice = product.sale_price_usd || product.price_usd;
                      const isOnSale = product.sale_price_usd && product.msrp_usd && product.sale_price_usd < product.msrp_usd;
                      const isAvailable = product.available;
                      
                      return (
                        <div key={product.id} className={`border border-border rounded-lg p-4 ${!isAvailable ? 'opacity-60 bg-gray-50' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className={`font-medium ${!isAvailable ? 'text-gray-500' : ''}`}>{product.name}</h4>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex flex-col items-end">
                                <Badge variant="outline" className="mb-1">
                                  ${displayPrice.toLocaleString()}
                                </Badge>
                                {isOnSale && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    ${product.msrp_usd?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                            {!isAvailable && (
                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                            )}
                            {isAvailable && product.white_glove_available && (
                              <Badge variant="outline" className="text-xs">White Glove</Badge>
                            )}
                            {isAvailable && product.gift_eligible && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Gift Eligible</Badge>
                            )}
                          </div>
                          <Button 
                            onClick={() => addItem(product.id)} 
                            size="sm" 
                            variant="outline"
                            className="w-full"
                            disabled={!isAvailable}
                          >
                            {isAvailable ? 'Add to Order' : 'Out of Stock'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Selected Items ({selectedItems.length})</h3>
                  {selectedItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No items selected yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((item, index) => {
                        const price = item.product.sale_price_usd || item.product.price_usd;
                        const lineTotal = price * item.qty;
                        
                        return (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium">{item.product.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">{item.product.category}</Badge>
                                  {item.product.white_glove_available && (
                                    <Badge variant="outline" className="text-xs">White Glove Available</Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeItem(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Label>Qty:</Label>
                              <Input 
                                type="number" 
                                value={item.qty}
                                onChange={(e) => updateQty(index, parseInt(e.target.value))}
                                min="1"
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">
                                × ${price.toLocaleString()} = ${lineTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total:</span>
                          <span>${getTotalAmount().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleProductNext} className="flex-1">
                  Continue to Shipping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Standard Shipping</h4>
                    <p className="text-sm text-muted-foreground">5-7 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$15.99</p>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Express Shipping</h4>
                    <p className="text-sm text-muted-foreground">2-3 business days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$29.99</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)} className="flex-1">
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review & Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Order Summary</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {selectedItems.map((item, index) => {
                      const price = item.product.sale_price_usd || item.product.price_usd;
                      const lineTotal = price * item.qty;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.qty}× {item.product.name}</span>
                          <span>${lineTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 font-semibold">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>${getTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Required Documents</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Customer ID Photo</p>
                        <Button variant="outline" size="sm" className="mt-1">
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <PenTool className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Customer Signature</p>
                        <Button variant="outline" size="sm" className="mt-1">
                          Capture Signature
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isCreatingOrder} className="flex-1 shadow-elegant">
                {isCreatingOrder ? 'Creating Order...' : 'Create Order & Generate Contract'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}