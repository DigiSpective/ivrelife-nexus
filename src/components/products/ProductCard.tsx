import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, ShoppingCart } from 'lucide-react';
import { ProductWithVariants } from '@/hooks/useProducts';

interface ProductCardProps {
  product: ProductWithVariants;
  onQuickView: (product: ProductWithVariants) => void;
  onAddToCart: (variantId: string, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onQuickView, 
  onAddToCart 
}) => {
  // Get the first variant as the default
  const defaultVariant = product.variants[0];
  
  // Calculate average rating (in a real app, this would come from reviews)
  const averageRating = 4.5;
  const reviewCount = 12;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      role="article"
      aria-labelledby={`product-name-${product.id}`}
    >
      <div className="relative group">
        {/* Product image placeholder */}
        <div 
          className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center transition-colors duration-300 group-hover:bg-gray-300"
          role="img"
          aria-label={`${product.name} product image`}
        >
          <span className="text-gray-500">Product Image</span>
        </div>
        
        {/* Quick view button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view ${product.name}`}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 
              id={`product-name-${product.id}`}
              className="font-semibold text-lg truncate"
            >
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">{defaultVariant.sku}</p>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1" aria-label={`Average rating: ${averageRating} out of 5 stars`}>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating} ({reviewCount})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">
              ${defaultVariant.price.toFixed(2)}
            </span>
            {defaultVariant.inventory_qty > 0 ? (
              <Badge variant="default" aria-label="In stock">In Stock</Badge>
            ) : (
              <Badge variant="destructive" aria-label="Out of stock">Out of Stock</Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onQuickView(product)}
              aria-label={`View details for ${product.name}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAddToCart(defaultVariant.id, 1)}
              disabled={defaultVariant.inventory_qty <= 0}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};