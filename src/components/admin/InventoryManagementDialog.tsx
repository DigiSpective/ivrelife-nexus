import React, { useState } from 'react';
import { Plus, Minus, Package, AlertTriangle, TrendingUp, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProductInventory {
  id: string;
  name: string;
  sku?: string;
  stock_quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  supplier: string;
  cost_price: number;
  price_usd: number;
  sale_price_usd?: number;
  last_restocked: string;
  sales_velocity: number;
}

interface InventoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductInventory | null;
  onUpdateInventory: (productId: string, updates: Partial<ProductInventory>) => void;
  isLoading?: boolean;
}

export function InventoryManagementDialog({
  isOpen,
  onClose,
  product,
  onUpdateInventory,
  isLoading = false,
}: InventoryManagementDialogProps) {
  const [customQuantity, setCustomQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleQuickAdjustment = (adjustment: number) => {
    const newQuantity = Math.max(0, product.stock_quantity + adjustment);
    onUpdateInventory(product.id, {
      stock_quantity: newQuantity,
      last_restocked: adjustment > 0 ? new Date().toISOString() : product.last_restocked
    });
  };

  const handleSetQuantity = () => {
    const quantity = parseInt(customQuantity);
    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity (0 or greater)');
      return;
    }
    
    onUpdateInventory(product.id, {
      stock_quantity: quantity,
      last_restocked: quantity > product.stock_quantity ? new Date().toISOString() : product.last_restocked
    });
    setCustomQuantity('');
  };

  const handleUpdateField = (field: keyof ProductInventory, value: any) => {
    onUpdateInventory(product.id, { [field]: value });
  };

  const availableStock = product.stock_quantity - product.reserved_quantity;
  const inventoryValue = product.stock_quantity * product.cost_price;
  const retailValue = product.stock_quantity * (product.sale_price_usd || product.price_usd);
  const daysOfStock = product.sales_velocity > 0 ? Math.round(product.stock_quantity / product.sales_velocity) : 0;

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return { status: 'Out of Stock', variant: 'destructive', color: 'text-red-600' };
    if (product.stock_quantity <= product.reorder_point) return { status: 'Low Stock', variant: 'secondary', color: 'text-orange-600' };
    return { status: 'In Stock', variant: 'default', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            Inventory Management: {product.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Current Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{product.stock_quantity}</div>
                  <div className="text-sm text-muted-foreground">Total Stock</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{product.reserved_quantity}</div>
                  <div className="text-sm text-muted-foreground">Reserved</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{availableStock}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <Badge variant={stockStatus.variant as any} className="mb-2">
                    {stockStatus.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stock Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Button
                  variant="outline"
                  onClick={() => handleQuickAdjustment(1)}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  +1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickAdjustment(10)}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  +10
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickAdjustment(-1)}
                  disabled={isLoading || product.stock_quantity === 0}
                  className="flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  -1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickAdjustment(-10)}
                  disabled={isLoading || product.stock_quantity < 10}
                  className="flex items-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  -10
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Custom Quantity Set */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="custom-quantity">Set Exact Quantity</Label>
                  <Input
                    id="custom-quantity"
                    type="number"
                    min="0"
                    placeholder="Enter new stock quantity"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSetQuantity}
                    disabled={isLoading || !customQuantity}
                  >
                    Set Stock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reorder-point">Reorder Point</Label>
                  <Input
                    id="reorder-point"
                    type="number"
                    min="0"
                    value={product.reorder_point}
                    onChange={(e) => handleUpdateField('reorder_point', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when stock reaches this level
                  </p>
                </div>
                <div>
                  <Label htmlFor="reserved">Reserved Quantity</Label>
                  <Input
                    id="reserved"
                    type="number"
                    min="0"
                    max={product.stock_quantity}
                    value={product.reserved_quantity}
                    onChange={(e) => handleUpdateField('reserved_quantity', Math.min(parseInt(e.target.value) || 0, product.stock_quantity))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock reserved for pending orders
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost-price">Cost Price</Label>
                  <Input
                    id="cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.cost_price}
                    onChange={(e) => handleUpdateField('cost_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={product.supplier}
                    onChange={(e) => handleUpdateField('supplier', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Inventory Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Inventory Value</div>
                  <div className="text-lg font-semibold">{formatPrice(inventoryValue)}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Retail Value</div>
                  <div className="text-lg font-semibold">{formatPrice(retailValue)}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Sales Velocity</div>
                  <div className="text-lg font-semibold">{product.sales_velocity.toFixed(1)} units/day</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Days of Stock</div>
                  <div className="text-lg font-semibold">
                    {daysOfStock > 0 ? `${daysOfStock} days` : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <History className="w-4 h-4" />
                  <span className="text-muted-foreground">Last Restocked:</span>
                  <span className="font-medium">{formatDate(product.last_restocked)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          {product.stock_quantity <= product.reorder_point && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {product.stock_quantity === 0 ? 'Out of Stock Alert' : 'Low Stock Alert'}
                  </span>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  {product.stock_quantity === 0 
                    ? 'This product is completely out of stock and needs immediate restocking.'
                    : `Stock level (${product.stock_quantity}) is at or below the reorder point (${product.reorder_point}). Consider restocking soon.`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}