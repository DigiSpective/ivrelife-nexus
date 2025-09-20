import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ShoppingCart, X } from 'lucide-react';
import { ProductWithVariants } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';

interface ProductModalProps {
  product: ProductWithVariants | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  if (!product) return null;
  
  // Set default variant if none selected
  const defaultVariant = product.variants[0];
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || defaultVariant;
  
  // Calculate average rating (in a real app, this would come from reviews)
  const averageRating = 4.5;
  const reviewCount = 12;
  
  const handleAddToCart = () => {
    if (selectedVariant) {
      addItem(selectedVariant, quantity);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-300"
        aria-labelledby="product-modal-title"
        aria-describedby="product-modal-description"
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle 
            id="product-modal-title"
            className="text-2xl"
          >
            {product.name}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            aria-label="Close product details"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div 
          id="product-modal-description"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Product Images Carousel */}
          <div className="space-y-4">
            <div 
              className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 flex items-center justify-center"
              role="img"
              aria-label={`Main image of ${product.name}`}
            >
              <span className="text-gray-500">Product Image</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto" role="region" aria-label="Product images">
              {[1, 2, 3, 4].map((img) => (
                <div 
                  key={img} 
                  className="bg-gray-200 border-2 border-dashed rounded-lg w-16 h-16 flex-shrink-0 flex items-center justify-center"
                  role="img"
                  aria-label={`Product image ${img}`}
                >
                  <span className="text-xs text-gray-500">{img}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2" aria-label={`Average rating: ${averageRating} out of 5 stars`}>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {averageRating} ({reviewCount} reviews)
              </span>
            </div>
            
            {/* Price */}
            <div className="text-3xl font-bold">
              ${selectedVariant.price.toFixed(2)}
              {selectedVariant.price !== defaultVariant.price && (
                <span className="text-lg text-muted-foreground line-through ml-2">
                  ${defaultVariant.price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Variants Selector */}
            {product.variants.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="variant-selector">Variant</Label>
                <Select 
                  value={selectedVariantId || defaultVariant.id} 
                  onValueChange={setSelectedVariantId}
                >
                  <SelectTrigger id="variant-selector">
                    <SelectValue placeholder="Select a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.sku} - ${variant.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Inventory Status */}
            <div className="flex items-center gap-2">
              {selectedVariant.inventory_qty > 0 ? (
                <>
                  <Badge variant="default" aria-label="In stock">In Stock</Badge>
                  <span className="text-muted-foreground">
                    {selectedVariant.inventory_qty} available
                  </span>
                </>
              ) : (
                <Badge variant="destructive" aria-label="Out of stock">Out of Stock</Badge>
              )}
            </div>
            
            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label htmlFor="quantity-selector">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <span 
                  id="quantity-display"
                  className="w-12 text-center"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={selectedVariant.inventory_qty <= quantity}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <Button 
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={selectedVariant.inventory_qty <= 0}
              aria-label={`Add ${quantity} ${product.name} to cart`}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart - ${(selectedVariant.price * quantity).toFixed(2)}
            </Button>
            
            {/* Product Specifications */}
            <div className="space-y-2">
              <h4 className="font-semibold">Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Weight</div>
                <div>{selectedVariant.weight_kg ? `${selectedVariant.weight_kg} kg` : 'N/A'}</div>
                
                <div className="text-muted-foreground">Dimensions</div>
                <div>
                  {selectedVariant.height_cm && selectedVariant.width_cm && selectedVariant.depth_cm
                    ? `${selectedVariant.height_cm} × ${selectedVariant.width_cm} × ${selectedVariant.depth_cm} cm`
                    : 'N/A'}
                </div>
                
                <div className="text-muted-foreground">Color</div>
                <div>{selectedVariant.color || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="pt-6 border-t">
          <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((review) => (
              <div key={review} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-medium">Customer {review}</div>
                  <div className="flex" aria-label={`Rating: 4 out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};