import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Truck, 
  Shield, 
  Package, 
  Gift, 
  Star,
  Ruler,
  Weight,
  Palette,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Product, ShippingProfile, GiftRule } from '@/types/products';
import { sampleProducts, shippingProfiles, giftRules } from '@/data/sampleProducts';
import { useCart } from '@/components/cart/CartManager';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [whiteGloveSelected, setWhiteGloveSelected] = useState(false);
  const [extendedWarrantySelected, setExtendedWarrantySelected] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundProduct = sampleProducts.find(p => p.id === id);
      setProduct(foundProduct || null);
      if (foundProduct?.colors?.[0]) {
        setSelectedColor(foundProduct.colors[0]);
      }
      setLoading(false);
    }
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getShippingProfile = (profileId: string): ShippingProfile | undefined => {
    return shippingProfiles.find(p => p.id === profileId);
  };

  const getGiftRule = (ruleId?: string): GiftRule | undefined => {
    return ruleId ? giftRules.find(r => r.id === ruleId) : undefined;
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let total = product.sale_price_usd || product.price_usd;
    
    if (whiteGloveSelected && product.white_glove_price_usd) {
      total += product.white_glove_price_usd;
    }
    
    if (extendedWarrantySelected && product.extended_warranty_price_usd) {
      total += product.extended_warranty_price_usd;
    }
    
    return total * quantity;
  };

  const getEstimatedShipping = () => {
    if (!product) return null;
    
    const profile = getShippingProfile(product.shipping_profile_id);
    if (!profile) return null;
    
    let cost = profile.base_price_usd;
    if (whiteGloveSelected && product.white_glove_price_usd) {
      cost = product.white_glove_price_usd;
    }
    
    return {
      cost,
      timeframe: `${profile.lead_time_days_min}-${profile.lead_time_days_max} days`,
      carrier: profile.carrier_options[0]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested product could not be found.</p>
        </div>
      </div>
    );
  }

  const shippingProfile = getShippingProfile(product.shipping_profile_id);
  const giftRule = getGiftRule(product.gift_rule_id);
  const estimatedShipping = getEstimatedShipping();
  const displayPrice = product.sale_price_usd || product.price_usd;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <Package className="w-24 h-24 text-muted-foreground" />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Purchase */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="flex items-center gap-2">
            {product.available ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <Badge className="bg-green-100 text-green-800">In Stock</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <Badge variant="destructive">Out of Stock</Badge>
              </>
            )}
          </div>

          {/* Category & Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{product.category}</Badge>
            {product.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag.replace('_', ' ')}
              </Badge>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">{formatPrice(displayPrice)}</span>
              {product.msrp_usd && product.msrp_usd > displayPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.msrp_usd)}
                </span>
              )}
            </div>
            {product.msrp_usd && product.msrp_usd > displayPrice && (
              <p className="text-sm text-green-600">
                Save {formatPrice(product.msrp_usd - displayPrice)}
              </p>
            )}
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {product.colors.map(color => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* White Glove Service */}
          {product.white_glove_available && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="white-glove"
                  checked={whiteGloveSelected}
                  onCheckedChange={setWhiteGloveSelected}
                />
                <label htmlFor="white-glove" className="text-sm font-medium flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  White Glove Delivery & Setup
                  {product.white_glove_price_usd && (
                    <span className="text-muted-foreground">
                      (+{formatPrice(product.white_glove_price_usd)})
                    </span>
                  )}
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Professional delivery, unpacking, and setup service
              </p>
            </div>
          )}

          {/* Extended Warranty */}
          {product.extended_warranty_years && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warranty"
                  checked={extendedWarrantySelected}
                  onCheckedChange={setExtendedWarrantySelected}
                />
                <label htmlFor="warranty" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {product.extended_warranty_years} Year Extended Warranty
                  {product.extended_warranty_price_usd && (
                    <span className="text-muted-foreground">
                      (+{formatPrice(product.extended_warranty_price_usd)})
                    </span>
                  )}
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Extended coverage beyond manufacturer warranty
              </p>
            </div>
          )}

          {/* Gift Eligibility */}
          {product.gift_eligible && giftRule && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Gift Included!</span>
              </div>
              <p className="text-sm text-purple-700">
                {giftRule.name} - Complimentary item included with purchase
              </p>
            </div>
          )}

          {/* Total Price Calculation */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Product Price:</span>
                <span>{formatPrice(displayPrice * quantity)}</span>
              </div>
              {whiteGloveSelected && product.white_glove_price_usd && (
                <div className="flex justify-between">
                  <span>White Glove Service:</span>
                  <span>{formatPrice(product.white_glove_price_usd)}</span>
                </div>
              )}
              {extendedWarrantySelected && product.extended_warranty_price_usd && (
                <div className="flex justify-between">
                  <span>Extended Warranty:</span>
                  <span>{formatPrice(product.extended_warranty_price_usd)}</span>
                </div>
              )}
              {estimatedShipping && (
                <div className="flex justify-between">
                  <span>Estimated Shipping:</span>
                  <span>{formatPrice(estimatedShipping.cost)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(calculateTotalPrice() + (estimatedShipping?.cost || 0))}</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            className="w-full" 
            size="lg" 
            disabled={!product.available}
            onClick={() => {
              if (product.available) {
                addToCart(product, {
                  quantity,
                  color: selectedColor,
                  whiteGloveSelected,
                  extendedWarrantySelected
                });
              }
            }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {product.available ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {product.dimensions_in && (
              <div>
                <span className="font-medium">Dimensions:</span>
                <p className="text-sm text-muted-foreground">
                  {product.dimensions_in.length}" L × {product.dimensions_in.width}" W × {product.dimensions_in.height}" H
                </p>
              </div>
            )}
            {product.weight_lbs && (
              <div>
                <span className="font-medium">Weight:</span>
                <p className="text-sm text-muted-foreground">{product.weight_lbs} lbs</p>
              </div>
            )}
            {product.package_boxes && (
              <div>
                <span className="font-medium">Shipping Boxes:</span>
                {product.package_boxes.map((box, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {box.label}: {box.length_in}" × {box.width_in}" × {box.height_in}" ({box.weight_lbs} lbs)
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping & Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shippingProfile && (
              <>
                <div>
                  <span className="font-medium">Delivery Method:</span>
                  <p className="text-sm text-muted-foreground">
                    {shippingProfile.name.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Estimated Delivery:</span>
                  <p className="text-sm text-muted-foreground">
                    {shippingProfile.lead_time_days_min}-{shippingProfile.lead_time_days_max} business days
                  </p>
                </div>
                <div>
                  <span className="font-medium">Carriers:</span>
                  <p className="text-sm text-muted-foreground">
                    {shippingProfile.carrier_options.join(', ')}
                  </p>
                </div>
                {shippingProfile.assembly_included && (
                  <div>
                    <CheckCircle className="w-4 h-4 text-green-600 inline mr-1" />
                    <span className="text-sm">Assembly included</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Warranty & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Warranty & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Manufacturer Warranty:</span>
              <p className="text-sm text-muted-foreground">Standard coverage included</p>
            </div>
            {product.extended_warranty_years && (
              <div>
                <span className="font-medium">Extended Warranty Available:</span>
                <p className="text-sm text-muted-foreground">
                  {product.extended_warranty_years} years additional coverage
                </p>
              </div>
            )}
            <div>
              <span className="font-medium">Support:</span>
              <p className="text-sm text-muted-foreground">
                24/7 customer service and technical support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}