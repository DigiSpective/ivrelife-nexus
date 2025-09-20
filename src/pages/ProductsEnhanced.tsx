import React, { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductModal } from '@/components/products/ProductModal';
import { Filters } from '@/components/products/Filters';
import { Sorting } from '@/components/products/Sorting';
import { CartPreview } from '@/components/products/CartPreview';
import { ProductWithVariants } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ProductsEnhanced() {
  const { toast } = useToast();
  const { addItem } = useCart();
  
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest' | 'popular'>('newest');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch products with filters
  const { products, loading, error, totalCount, hasNextPage, hasPreviousPage, refetch } = useProducts({
    searchQuery,
    categoryIds: selectedCategories,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy,
    page,
    limit: 12
  });
  
  // Log products data for debugging
  useEffect(() => {
    console.log('Products data:', products);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('Total count:', totalCount);
  }, [products, loading, error, totalCount]);
  
  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  // Handle price range change
  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
  };
  
  // Handle rating change
  const handleRatingChange = (rating: number) => {
    // In a real implementation, we would handle rating filtering
    console.log('Rating filter:', rating);
  };
  
  // Handle availability change
  const handleAvailabilityChange = (availability: 'all' | 'in-stock' | 'out-of-stock') => {
    // In a real implementation, we would handle availability filtering
    console.log('Availability filter:', availability);
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setPage(1);
  };
  
  // Handle quick view
  const handleQuickView = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  // Handle add to cart
  const handleAddToCart = (variantId: string, quantity: number) => {
    const product = products.find(p => 
      p.variants.some(v => v.id === variantId)
    );
    
    if (product) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        addItem(variant, quantity);
        toast({
          title: "Added to cart",
          description: `${product.name} added to your cart`,
        });
      }
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Set page title for SEO
  useEffect(() => {
    document.title = 'Products - IV RELIFE';
  }, []);
  
  // Simple test to see if the component is rendering
  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Products Page - Loading...</h1>
        <p>Please wait while we load the products.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error loading products</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Simple test header */}
      <div className="p-4 bg-blue-100">
        <h1 className="text-2xl font-bold">Products Page - Rendered Successfully</h1>
        <p>Products count: {products.length}</p>
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <p>Error: {error || 'null'}</p>
      </div>
      
      {/* Original content */}
      {/* Header with ARIA landmarks */}
      <header className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" id="products-heading">Products</h1>
          <p className="text-muted-foreground mt-1">
            Browse our complete product catalog
          </p>
        </div>
        <div className="flex gap-2">
          <CartPreview />
          <Button aria-label="Add new product">
            <Search className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </header>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar - Hidden on mobile by default */}
        <div className={`md:w-64 ${isFilterOpen ? 'block' : 'hidden md:block'}`} role="region" aria-label="Product filters">
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceRangeChange={handlePriceRangeChange}
            selectedRatings={[]} // In a real implementation, we would track selected ratings
            onRatingChange={handleRatingChange}
            availability="all"
            onAvailabilityChange={handleAvailabilityChange}
            onResetFilters={handleResetFilters}
          />
        </div>
        
        {/* Main Content */}
        <main className="flex-1" aria-labelledby="products-heading">
          {/* Search and Sorting Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <label htmlFor="product-search" className="sr-only">Search products</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
              <Input
                id="product-search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-describedby="search-description"
              />
              <div id="search-description" className="sr-only">
                Enter product name, description, or SKU to search
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="md:hidden"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
                aria-controls="filters-sidebar"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <Sorting 
                sortBy={sortBy} 
                onSortChange={setSortBy} 
              />
            </div>
          </div>
          
          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64" role="status">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="sr-only">Loading products...</span>
            </div>
          ) : (
            <>
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                role="list"
                aria-label="Product listings"
              >
                {products.map((product) => (
                  <div key={product.id} className="group" role="listitem">
                    <ProductCard
                      product={product}
                      onQuickView={handleQuickView}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                ))}
              </div>
              
              {/* Empty State */}
              {products.length === 0 && !loading && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button onClick={handleResetFilters}>Reset Filters</Button>
                </div>
              )}
              
              {/* Pagination */}
              {(hasNextPage || hasPreviousPage) && (
                <nav className="flex justify-between items-center mt-8" role="navigation" aria-label="Pagination">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPreviousPage || loading}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-muted-foreground">
                    Page {page} of {Math.ceil(totalCount / 12)}
                  </span>
                  
                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage || loading}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
      
      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}