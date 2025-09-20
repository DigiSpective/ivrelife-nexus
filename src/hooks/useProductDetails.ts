import { useState, useEffect } from 'react';
import { getProductById, getProductVariantsByProduct } from '@/lib/supabase';
import { Product, ProductVariant } from '@/types';

export interface UseProductDetailsReturn {
  product: (Product & { variants: ProductVariant[] }) | null;
  loading: boolean;
  error: string | null;
  refetch: (id: string) => void;
}

export const useProductDetails = (productId: string | null): UseProductDetailsReturn => {
  const [product, setProduct] = useState<(Product & { variants: ProductVariant[] }) | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const productResult = await getProductById(id);
      const productData = productResult.data;
      
      if (!productData) {
        setError('Product not found');
        setLoading(false);
        return;
      }
      
      const variantsResult = await getProductVariantsByProduct(id);
      const variants = variantsResult.data || [];
      
      setProduct({
        ...productData,
        variants
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch product details');
      setLoading(false);
      console.error('Error fetching product details:', err);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId]);

  const refetch = (id: string) => {
    fetchProduct(id);
  };

  return {
    product,
    loading,
    error,
    refetch
  };
};