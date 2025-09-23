import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Product, AdminProductUpdate } from '@/types/products';
import { sampleProducts, shippingProfiles, giftRules } from '@/data/sampleProducts';

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;

    setProducts(prev => prev.map(p => 
      p.id === editingProduct.id ? editingProduct : p
    ));
    setIsEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const updateEditingProduct = (updates: Partial<Product>) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, ...updates });
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products Administration</h1>
          <p className="text-muted-foreground">
            Manage product catalog, pricing, and availability
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <Input
                id="search"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Gift Eligible</TableHead>
                <TableHead>White Glove</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatPrice(product.sale_price_usd || product.price_usd)}
                      </div>
                      {product.msrp_usd && (
                        <div className="text-sm text-muted-foreground">
                          MSRP: {formatPrice(product.msrp_usd)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={product.available ? "default" : "destructive"}
                      className={product.available ? "bg-green-100 text-green-800" : ""}
                    >
                      {product.available ? 'Available' : 'Out of Stock'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {product.gift_eligible ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {product.white_glove_available ? (
                      <div>
                        <Badge variant="outline">Available</Badge>
                        {product.white_glove_price_usd && (
                          <div className="text-xs text-muted-foreground">
                            {formatPrice(product.white_glove_price_usd)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not Available</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/products/${product.id}`} target="_blank">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product: {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={editingProduct.name}
                    onChange={(e) => updateEditingProduct({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={editingProduct.sku || ''}
                    onChange={(e) => updateEditingProduct({ sku: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) => updateEditingProduct({ description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingProduct.price_usd}
                    onChange={(e) => updateEditingProduct({ price_usd: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="msrp">MSRP (USD)</Label>
                  <Input
                    id="msrp"
                    type="number"
                    value={editingProduct.msrp_usd || ''}
                    onChange={(e) => updateEditingProduct({ 
                      msrp_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="sale-price">Sale Price (USD)</Label>
                  <Input
                    id="sale-price"
                    type="number"
                    value={editingProduct.sale_price_usd || ''}
                    onChange={(e) => updateEditingProduct({ 
                      sale_price_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>

              {/* Availability and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={editingProduct.category} 
                    onValueChange={(value) => updateEditingProduct({ 
                      category: value as Product['category'] 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Massage Chair">Massage Chair</SelectItem>
                      <SelectItem value="Spa">Spa</SelectItem>
                      <SelectItem value="Accessory">Accessory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="available"
                    checked={editingProduct.available}
                    onCheckedChange={(checked) => updateEditingProduct({ available: !!checked })}
                  />
                  <Label htmlFor="available">Product Available</Label>
                </div>
              </div>

              {/* Shipping Profile */}
              <div>
                <Label htmlFor="shipping-profile">Shipping Profile</Label>
                <Select 
                  value={editingProduct.shipping_profile_id} 
                  onValueChange={(value) => updateEditingProduct({ shipping_profile_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name.replace('_', ' ').toUpperCase()} - {formatPrice(profile.base_price_usd)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* White Glove Service */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="white-glove-available"
                    checked={editingProduct.white_glove_available}
                    onCheckedChange={(checked) => updateEditingProduct({ 
                      white_glove_available: !!checked 
                    })}
                  />
                  <Label htmlFor="white-glove-available">White Glove Available</Label>
                </div>
                {editingProduct.white_glove_available && (
                  <div>
                    <Label htmlFor="white-glove-price">White Glove Price (USD)</Label>
                    <Input
                      id="white-glove-price"
                      type="number"
                      value={editingProduct.white_glove_price_usd || ''}
                      onChange={(e) => updateEditingProduct({ 
                        white_glove_price_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                  </div>
                )}
              </div>

              {/* Gift Eligibility */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gift-eligible"
                    checked={editingProduct.gift_eligible}
                    onCheckedChange={(checked) => updateEditingProduct({ 
                      gift_eligible: !!checked 
                    })}
                  />
                  <Label htmlFor="gift-eligible">Gift Eligible</Label>
                </div>
                {editingProduct.gift_eligible && (
                  <div>
                    <Label htmlFor="gift-rule">Gift Rule</Label>
                    <Select 
                      value={editingProduct.gift_rule_id || ''} 
                      onValueChange={(value) => updateEditingProduct({ 
                        gift_rule_id: value || undefined 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gift rule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Gift Rule</SelectItem>
                        {giftRules.map(rule => (
                          <SelectItem key={rule.id} value={rule.id}>
                            {rule.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Extended Warranty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warranty-years">Extended Warranty (Years)</Label>
                  <Input
                    id="warranty-years"
                    type="number"
                    value={editingProduct.extended_warranty_years || ''}
                    onChange={(e) => updateEditingProduct({ 
                      extended_warranty_years: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
                {editingProduct.extended_warranty_years && (
                  <div>
                    <Label htmlFor="warranty-price">Warranty Price (USD)</Label>
                    <Input
                      id="warranty-price"
                      type="number"
                      value={editingProduct.extended_warranty_price_usd || ''}
                      onChange={(e) => updateEditingProduct({ 
                        extended_warranty_price_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}