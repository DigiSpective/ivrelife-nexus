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
import { useAdminCreateProduct, useAdminUpdateProduct, useAdminDeleteProduct } from '@/hooks/useAdmin';
import { ProductFormDialogSimple } from '@/components/admin/ProductFormDialogSimple';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { InventoryManagementDialog } from '@/components/admin/InventoryManagementDialog';
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
  const createProductMutation = useAdminCreateProduct();
  const updateProductMutation = useAdminUpdateProduct();
  const deleteProductMutation = useAdminDeleteProduct();

  // Use the same product data source as /products route with state management
  const [products, setProducts] = useState<ProductInventory[]>(() => 
    sampleProducts.map(product => ({
      ...product,
      stock_quantity: Math.floor(Math.random() * 100) + 10,
      reserved_quantity: Math.floor(Math.random() * 5),
      reorder_point: 10,
      supplier: product.category === 'Massage Chair' ? 'Premium Wellness Co.' : 
                product.category === 'Spa' ? 'Spa Equipment Ltd.' : 'Accessory Supply Inc.',
      cost_price: (product.sale_price_usd || product.price_usd) * 0.6,
      last_restocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      sales_velocity: Math.random() * 2 + 0.1
    }))
  );

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<ProductInventory | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && product.category !== categoryFilter) {
      return false;
    }
    if (stockFilter === 'in_stock' && product.stock_quantity === 0) {
      return false;
    }
    if (stockFilter === 'out_of_stock' && product.stock_quantity > 0) {
      return false;
    }
    if (stockFilter === 'low_stock' && product.stock_quantity > product.reorder_point) {
      return false;
    }
    return true;
  });

  const handleInventoryUpdate = (productId: string, updates: Partial<ProductInventory>) => {
    // Update local state immediately
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, ...updates }
        : product
    ));

    // Update the inventory product if it's currently being viewed
    if (inventoryProduct && inventoryProduct.id === productId) {
      setInventoryProduct(prev => prev ? { ...prev, ...updates } : null);
    }

    // Here you could also make an API call to persist the changes
    console.log(`Updating inventory for ${productId}:`, updates);
    
    toast({
      title: 'Success',
      description: 'Inventory updated successfully!',
    });
  };

  const handleOpenInventoryDialog = (product: ProductInventory) => {
    setInventoryProduct(product);
    setIsInventoryDialogOpen(true);
  };

  const handleCloseInventoryDialog = () => {
    setInventoryProduct(null);
    setIsInventoryDialogOpen(false);
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
      const result = await createProductMutation.mutateAsync(productData);
      
      // Add to local state for immediate UI update
      const newProduct: ProductInventory = {
        ...productData,
        id: result?.data?.id || `product-${Date.now()}`,
        stock_quantity: 0,
        reserved_quantity: 0,
        reorder_point: 10,
        supplier: productData.category === 'Massage Chair' ? 'Premium Wellness Co.' : 
                  productData.category === 'Spa' ? 'Spa Equipment Ltd.' : 'Accessory Supply Inc.',
        cost_price: (productData.sale_price_usd || productData.price_usd) * 0.6,
        last_restocked: new Date().toISOString(),
        sales_velocity: 0.1
      };
      
      setProducts(prev => [...prev, newProduct]);
      
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
      
      // Update local state for immediate UI update
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? { ...product, ...productData }
          : product
      ));
      
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
      
      // Remove from local state for immediate UI update
      setProducts(prev => prev.filter(product => product.id !== deleteProductId));
      
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
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{metrics.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stock">Stock Status</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
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
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatPrice(product.price_usd)}</p>
                      {product.sale_price_usd && (
                        <p className="text-sm text-green-600">Sale: {formatPrice(product.sale_price_usd)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.stock_quantity} units</p>
                      <p className="text-xs text-muted-foreground">{product.reserved_quantity} reserved</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.stock_quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock_quantity <= product.reorder_point ? (
                      <Badge variant="secondary">Low Stock</Badge>
                    ) : (
                      <Badge variant="default">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleOpenInventoryDialog(product)}
                        title="Manage Inventory"
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
              ))}
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

      {/* Inventory Management Dialog */}
      <InventoryManagementDialog
        isOpen={isInventoryDialogOpen}
        onClose={handleCloseInventoryDialog}
        product={inventoryProduct}
        onUpdateInventory={handleInventoryUpdate}
        isLoading={false}
      />
    </div>
  );
}