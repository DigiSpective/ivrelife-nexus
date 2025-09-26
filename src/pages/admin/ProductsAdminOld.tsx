import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Settings, Eye, AlertTriangle, TrendingUp, TrendingDown, BarChart3, History, Download } from 'lucide-react';
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
import { useAdminProducts, useAdminCreateProduct, useAdminUpdateProduct, useAdminDeleteProduct } from '@/hooks/useAdmin';
import { ProductFormDialogSimple } from '@/components/admin/ProductFormDialogSimple';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { useToast } from '@/hooks/use-toast';

// Add inventory interface
interface ProductInventory extends Product {
  stock_quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  supplier: string;
  cost_price: number;
  last_restocked: string;
  sales_velocity: number; // items per day
}

export default function ProductsAdmin() {
  const { toast } = useToast();
  const { data: productsData, isLoading: isLoadingProducts } = useAdminProducts();
  const createProductMutation = useAdminCreateProduct();
  const updateProductMutation = useAdminUpdateProduct();
  const deleteProductMutation = useAdminDeleteProduct();

  const products: ProductInventory[] = (productsData?.data || sampleProducts).map(product => ({
    ...product,
    stock_quantity: Math.floor(Math.random() * 100) + 10,
    reserved_quantity: Math.floor(Math.random() * 5),
    reorder_point: 10,
    supplier: product.category === 'Massage Chair' ? 'Premium Wellness Co.' : 
              product.category === 'Spa' ? 'Spa Equipment Ltd.' : 'Accessory Supply Inc.',
    cost_price: (product.sale_price_usd || product.price_usd) * 0.6,
    last_restocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    sales_velocity: Math.random() * 2 + 0.1
  }));

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

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
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock_quantity <= product.reorder_point;
    } else if (stockFilter === 'out') {
      matchesStock = product.stock_quantity === 0;
    } else if (stockFilter === 'available') {
      matchesStock = product.stock_quantity > 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (product: ProductInventory) => {
    const availableStock = product.stock_quantity - product.reserved_quantity;
    if (availableStock <= 0) return { status: 'out', color: 'destructive', text: 'Out of Stock' };
    if (availableStock <= product.reorder_point) return { status: 'low', color: 'secondary', text: 'Low Stock' };
    return { status: 'good', color: 'default', text: 'In Stock' };
  };

  const handleInventoryUpdate = (productId: string, newQuantity: number, type: 'add' | 'set') => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updatedQuantity = type === 'add' 
          ? product.stock_quantity + newQuantity 
          : newQuantity;
        return {
          ...product,
          stock_quantity: Math.max(0, updatedQuantity),
          available: updatedQuantity > 0,
          last_restocked: type === 'add' && newQuantity > 0 ? new Date().toISOString() : product.last_restocked
        };
      }
      return product;
    }));
  };

  const calculateInventoryMetrics = () => {
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const lowStock = products.filter(p => p.stock_quantity <= p.reorder_point && p.stock_quantity > 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.sale_price_usd || p.price_usd)), 0);
    
    return {
      totalProducts,
      outOfStock,
      lowStock,
      inStock: totalProducts - outOfStock - lowStock,
      totalValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalValue
    };
  };

  const metrics = calculateInventoryMetrics();

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProductMutation.mutateAsync(productData);
      toast({
        title: 'Success',
        description: 'Product created successfully!',
      });
      setIsProductDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!editingProduct) return;
    
    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        productData,
      });
      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProductId(productId);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    
    try {
      await deleteProductMutation.mutateAsync(deleteProductId);
      toast({
        title: 'Success',
        description: 'Product deleted successfully!',
      });
      setDeleteProductId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleExportInventory = () => {
    const csvData = products.map(product => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      Price: product.price_usd,
      'Sale Price': product.sale_price_usd || '',
      'Stock Qty': product.stock_quantity,
      'Reserved': product.reserved_quantity,
      Supplier: product.supplier,
      Available: product.available ? 'Yes' : 'No',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Success',
      description: 'Inventory exported successfully!',
    });
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
          <h1 className="text-3xl font-bold">Products & Inventory Administration</h1>
          <p className="text-muted-foreground">
            Manage product catalog, inventory levels, pricing, and availability
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportInventory}>
            <Download className="w-4 h-4 mr-2" />
            Export Inventory
          </Button>
          <Button onClick={handleAddNewProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Inventory Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{metrics.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">{formatPrice(metrics.totalValue)}</p>
                <p className="text-xs text-muted-foreground">
                  Retail: {formatPrice(metrics.totalRetailValue)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.lowStock}</p>
                <p className="text-xs text-muted-foreground">
                  Need reordering
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{metrics.outOfStock}</p>
                <p className="text-xs text-muted-foreground">
                  Immediate attention
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="stock-filter">Stock Status</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="available">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
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
                <TableHead>Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const availableStock = product.stock_quantity - product.reserved_quantity;
                
                return (
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
                        <div className="text-xs text-muted-foreground">
                          Cost: {formatPrice(product.cost_price)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold text-lg">{product.stock_quantity}</div>
                        <div className="text-xs text-muted-foreground">
                          Available: {availableStock}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reorder at: {product.reorder_point}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{product.reserved_quantity}</div>
                        <div className="text-xs text-muted-foreground">reserved</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.text}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{product.supplier}</div>
                        <div className="text-xs text-muted-foreground">
                          Restocked: {new Date(product.last_restocked).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                  
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
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
                          onClick={() => {
                            setEditingProduct(product);
                            setIsInventoryDialogOpen(true);
                          }}
                        >
                          <Package className="w-4 h-4" />
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <ProductFormDialogSimple
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        product={editingProduct}
        isLoading={editingProduct ? updateProductMutation.isPending : createProductMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
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

      {/* Inventory Management Dialog */}
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Inventory: {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-6">
              {/* Current Inventory Status */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">{editingProduct.stock_quantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold text-orange-600">{editingProduct.reserved_quantity}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {editingProduct.stock_quantity - editingProduct.reserved_quantity}
                  </p>
                </div>
              </div>

              {/* Inventory Actions */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleInventoryUpdate(editingProduct.id, 10, 'add')}
                      className="flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add 10 Units
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleInventoryUpdate(editingProduct.id, 50, 'add')}
                      className="flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add 50 Units
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleInventoryUpdate(editingProduct.id, -5, 'add')}
                      className="flex items-center justify-center gap-2"
                      disabled={editingProduct.stock_quantity < 5}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove 5 Units
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleInventoryUpdate(editingProduct.id, 0, 'set')}
                      className="flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Mark as Sold Out
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Custom Adjustment</h3>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      className="flex-1"
                      id="custom-quantity"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById('custom-quantity') as HTMLInputElement;
                        if (input?.value) {
                          handleInventoryUpdate(editingProduct.id, parseInt(input.value), 'set');
                          input.value = '';
                        }
                      }}
                    >
                      Set Stock
                    </Button>
                  </div>
                </div>
              </div>

              {/* Inventory Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reorder-point">Reorder Point</Label>
                  <Input
                    id="reorder-point"
                    type="number"
                    value={editingProduct.reorder_point}
                    onChange={(e) => updateEditingProduct({ 
                      reorder_point: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost-price">Cost Price</Label>
                  <Input
                    id="cost-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.cost_price}
                    onChange={(e) => updateEditingProduct({ 
                      cost_price: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={editingProduct.supplier}
                  onChange={(e) => updateEditingProduct({ 
                    supplier: e.target.value 
                  })}
                />
              </div>

              {/* Inventory Metrics */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-medium mb-2">Inventory Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sales Velocity:</span>
                    <span className="ml-2 font-medium">
                      {editingProduct.sales_velocity.toFixed(1)} units/day
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days of Stock:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(editingProduct.stock_quantity / editingProduct.sales_velocity)} days
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Restocked:</span>
                    <span className="ml-2 font-medium">
                      {new Date(editingProduct.last_restocked).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inventory Value:</span>
                    <span className="ml-2 font-medium">
                      {formatPrice(editingProduct.stock_quantity * editingProduct.cost_price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  handleSaveProduct();
                  setIsInventoryDialogOpen(false);
                }}>
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