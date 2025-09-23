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

export default function Products() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filters, setFilters] = useState<ProductFilters>({
    price_range: { min: 0, max: 30000 }
  });

  // Get unique categories and tags for filter options
  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category))), [products]
  );
  
  const allTags = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.tags || []))), [products]
  );

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
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

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      return true;
    });
  }, [products, filters]);

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
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="default" size="sm">
                        <ShoppingCart className="w-4 h-4" />
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
                <Button size="sm" className="flex-1">
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
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
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog, shipping profiles, and gift rules
        </p>
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
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
          <Link to="/admin/products/new">Add New Product</Link>
        </Button>
      </div>

      {/* Products List */}
      {viewMode === 'table' ? renderTableView() : renderGridView()}
    </div>
  );
}