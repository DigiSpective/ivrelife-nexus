import { useState, useEffect, useCallback } from 'react';
import { getProducts, getProductVariantsByProduct } from '@/lib/supabase';
import { Product, ProductVariant } from '@/types';

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface UseProductsOptions {
  searchQuery?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface UseProductsReturn {
  products: ProductWithVariants[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  refetch: () => void;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const {
    searchQuery = '',
    categoryIds = [],
    minPrice,
    maxPrice,
    sortBy = 'newest',
    page = 1,
    limit = 12
  } = options;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products...');
      // Fetch all products (in a real app, this would be paginated)
      const productsResult = await getProducts();
      const allProducts = productsResult.data || [];
      console.log('All products:', allProducts);
      
      // Handle case where no products are returned
      if (!allProducts || allProducts.length === 0) {
        setProducts([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      
      // Filter products based on search query and categories
      let filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchQuery || 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = categoryIds.length === 0 || 
          (product.category_id && categoryIds.includes(product.category_id));
        
        return matchesSearch && matchesCategory;
      });
      
      console.log('Filtered products:', filteredProducts);
      
      // For each product, fetch its variants
      const productsWithVariants: ProductWithVariants[] = [];
      
      for (const product of filteredProducts) {
        try {
          const variantsResult = await getProductVariantsByProduct(product.id);
          const variants = variantsResult.data || [];
          console.log(`Variants for product ${product.id}:`, variants);
          
          // Filter variants by price range
          const filteredVariants = variants.filter(variant => {
            const matchesMinPrice = minPrice === undefined || variant.price >= minPrice;
            const matchesMaxPrice = maxPrice === undefined || variant.price <= maxPrice;
            return matchesMinPrice && matchesMaxPrice;
          });
          
          // Only include products that have variants matching the price filter
          if (filteredVariants.length > 0) {
            productsWithVariants.push({
              ...product,
              variants: filteredVariants
            });
          }
        } catch (variantError) {
          console.error(`Error fetching variants for product ${product.id}:`, variantError);
          // Continue with other products even if one fails
        }
      }
      
      console.log('Products with variants:', productsWithVariants);
      
      // Sort products
      productsWithVariants.sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0);
          case 'price-desc':
            return (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0);
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'popular':
            // In a real app, this would be based on sales data
            return 0;
          default:
            return 0;
        }
      });
      
      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = productsWithVariants.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
      setTotalCount(productsWithVariants.length);
      setLoading(false);
      console.log('Final products:', paginatedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again later.');
      setLoading(false);
    }
  }, [searchQuery, categoryIds, minPrice, maxPrice, sortBy, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    totalCount,
    hasNextPage: page * limit < totalCount,
    hasPreviousPage: page > 1,
    refetch
  };
};