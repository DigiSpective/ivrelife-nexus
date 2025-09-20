import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getProducts, getProductVariants } from '@/lib/supabase';
import { Product, ProductVariant } from '@/types';

interface ProductSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductSelect({ 
  value, 
  onValueChange, 
  placeholder = "Select a product...", 
  disabled = false 
}: ProductSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsResult = await getProducts();
        const productsData = productsResult.data || [];
        setProducts(productsData);
        
        // Fetch all variants
        const variantsResult = await getProductVariants();
        const variantsData = variantsResult.data || [];
        setVariants(variantsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading products..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {variants.map((variant) => {
          const product = products.find(p => p.id === variant.product_id);
          return (
            <SelectItem key={variant.id} value={variant.id}>
              {product?.name} - {variant.sku} (${variant.price.toFixed(2)})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}