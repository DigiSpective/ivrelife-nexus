import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Eye, Edit, Package, Truck, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Product, ProductFilters } from '@/types/products';
import { sampleProducts, shippingProfiles, giftRules } from '@/data/sampleProducts';
import { useToast } from '@/hooks/use-toast';
import { ProductEditDialog } from '@/components/products/ProductEditDialog';
import { useCart } from '@/components/cart/CartManager';

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filters, setFilters] = useState<ProductFilters>({
    price_range: { min: 0, max: 30000 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Use the cart manager instead of local state
  const { cart, addToCart } = useCart();


  // Get unique categories and tags for filter options
  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category))), [products]
  );
  
  const allTags = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.tags || []))), [products]
  );

  // Product action handlers
  const handleAddToCart = (product: Product) => {
    // Use the CartManager's addToCart function
    addToCart(product, { quantity: 1 });
    
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    // This function is handled by the CartSidebar directly
    // We don't need it here since we're using the CartManager
    console.log('Remove from cart called with itemId:', itemId);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    
    toast({
      title: 'Product Updated',
      description: `${updatedProduct.name} has been updated successfully.`,
    });
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleViewProduct = (productId: string) => {
    // This is handled by the Link component, but we can add analytics
    console.log(`Viewing product: ${productId}`);
  };

  // Filter products based on current filters and search
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter (from searchTerm state)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(search);
        const matchesDescription = product.description?.toLowerCase().includes(search);
        const matchesTags = product.tags?.some(tag => tag.toLowerCase().includes(search));
        const matchesCategory = product.category.toLowerCase().includes(search);
        
        if (!matchesName && !matchesDescription && !matchesTags && !matchesCategory) {
          return false;
        }
      }

      // Category filter
      if (filters.category?.length && !filters.category.includes(product.category)) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length && !filters.tags.some(tag => product.tags?.includes(tag))) {
        return false;
      }

      // Price range filter
      if (filters.price_range) {
        const price = product.sale_price_usd || product.price_usd;
        if (price < filters.price_range.min || price > filters.price_range.max) {
          return false;
        }
      }

      // Availability filter
      if (filters.availability) {
        if (filters.availability === 'in_stock' && !product.available) return false;
        if (filters.availability === 'out_of_stock' && product.available) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting logic
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.sale_price_usd || a.price_usd;
          bValue = b.sale_price_usd || b.price_usd;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [products, filters, searchTerm, sortBy, sortOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getShippingProfile = (profileId: string) => {
    return shippingProfiles.find(p => p.id === profileId);
  };

  const getGiftRule = (ruleId?: string) => {
    return ruleId ? giftRules.find(r => r.id === ruleId) : null;
  };

  // Cart utilities
  const getTotalCartItems = () => {
    return cart?.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const hasCartItems = (cart?.line_items?.length || 0) > 0;

  const getTotalCartValue = () => {
    return cart?.total || 0;
  };

  const clearCart = () => {
    // This function is handled by the CartManager
    console.log('Clear cart called');
  };

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Products Catalog</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const shippingProfile = getShippingProfile(product.shipping_profile_id);
              const giftRule = getGiftRule(product.gift_rule_id);
              const displayPrice = product.sale_price_usd || product.price_usd;

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                      {product.tags && (
                        <div className="flex gap-1 mt-1">
                          {product.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                          {product.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatPrice(displayPrice)}</div>
                      {product.msrp_usd && product.msrp_usd > displayPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.msrp_usd)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={product.available ? "default" : "destructive"}
                      className={product.available ? "bg-green-100 text-green-800" : ""}
                    >
                      {product.available ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <div className="text-sm">
                        <div>{shippingProfile?.name.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-muted-foreground">
                          {shippingProfile?.lead_time_days_min}-{shippingProfile?.lead_time_days_max} days
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-1">
                      {product.white_glove_available && (
                        <Badge variant="outline" className="text-xs">
                          White Glove
                        </Badge>
                      )}
                      {product.gift_eligible && giftRule && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          <Gift className="w-3 h-3 mr-1" />
                          Gift
                        </Badge>
                      )}
                      {product.extended_warranty_years && (
                        <Badge variant="outline" className="text-xs">
                          {product.extended_warranty_years}yr Warranty
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/products/${product.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {(() => {
                          const cartItem = cart?.line_items?.find(item => item.product_id === product.id);
                          const quantity = cartItem?.quantity || 0;
                          return quantity > 0 ? <span className="ml-1 text-xs">({quantity})</span> : null;
                        })()}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map((product) => {
        const giftRule = getGiftRule(product.gift_rule_id);
        const displayPrice = product.sale_price_usd || product.price_usd;

        return (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{product.name}</h3>
                <Badge 
                  variant={product.available ? "default" : "destructive"}
                  className={product.available ? "bg-green-100 text-green-800" : ""}
                >
                  {product.available ? 'Available' : 'Out of Stock'}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-bold text-lg">{formatPrice(displayPrice)}</div>
                  {product.msrp_usd && product.msrp_usd > displayPrice && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.msrp_usd)}
                    </div>
                  )}
                </div>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {product.white_glove_available && (
                  <Badge variant="outline" className="text-xs">White Glove</Badge>
                )}
                {product.gift_eligible && giftRule && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    <Gift className="w-3 h-3 mr-1" />
                    Gift Eligible
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/products/${product.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                  {(() => {
                    const cartItem = cart?.line_items?.find(item => item.product_id === product.id);
                    const quantity = cartItem?.quantity || 0;
                    return quantity > 0 ? <span className="ml-1 text-xs">({quantity})</span> : null;
                  })()}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Browse and manage your product catalog
          </p>
        </div>
        
        {/* Cart Summary */}
        {hasCartItems && (
          <Card className="min-w-[250px] max-w-[350px]">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Shopping Cart</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-xs p-1 h-6"
                >
                  Clear
                </Button>
              </div>
              
              {/* Cart Items */}
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {(cart?.line_items || []).map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  
                  const price = item.price_override !== undefined ? item.price_override : (product.sale_price_usd || product.price_usd);
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        <div className="text-muted-foreground">
                          {formatPrice(price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        >
                          −
                        </Button>
                        <span className="min-w-[1rem] text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>{getTotalCartItems()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span>{formatPrice(getTotalCartValue())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select 
                value={filters.category?.[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  category: value === 'all' ? undefined : [value] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Availability</label>
              <Select 
                value={filters.availability || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  availability: value === 'all' ? undefined : value as any
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
              </div>
            </div>

            {/* Sort Controls */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'category') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Price Range: {formatPrice(filters.price_range?.min || 0)} - {formatPrice(filters.price_range?.max || 30000)}
            </label>
            <Slider
              value={[filters.price_range?.min || 0, filters.price_range?.max || 30000]}
              onValueChange={([min, max]) => setFilters(prev => ({ 
                ...prev, 
                price_range: { min, max } 
              }))}
              max={30000}
              min={0}
              step={100}
              className="w-full"
            />
          </div>

          {/* Tags Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Features</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={filters.tags?.includes(tag) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), tag]
                        }));
                      } else {
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags?.filter(t => t !== tag)
                        }));
                      }
                    }}
                  />
                  <label 
                    htmlFor={tag} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <Button asChild>
          <Link to="/admin/products">Manage Products</Link>
        </Button>
      </div>

      {/* Products List */}
      {viewMode === 'table' ? renderTableView() : renderGridView()}
      
      {/* Product Edit Dialog */}
      <ProductEditDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}