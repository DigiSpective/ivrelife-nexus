import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/products';

interface ProductFormDialogSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  product?: Product | null;
  isLoading?: boolean;
}

export function ProductFormDialogSimple({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false,
}: ProductFormDialogSimpleProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price_usd: 0,
    sale_price_usd: 0,
    msrp_usd: 0,
    sku: '',
    available: true,
    weight_lbs: 0,
    tags: [] as string[],
    colors: [] as string[],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price_usd: product.price_usd || 0,
        sale_price_usd: product.sale_price_usd || 0,
        msrp_usd: product.msrp_usd || 0,
        sku: product.sku || '',
        available: product.available ?? true,
        weight_lbs: product.weight_lbs || 0,
        tags: product.tags || [],
        colors: product.colors || [],
      });
    } else {
      // Reset for new product
      setFormData({
        name: '',
        description: '',
        category: '',
        price_usd: 0,
        sale_price_usd: 0,
        msrp_usd: 0,
        sku: '',
        available: true,
        weight_lbs: 0,
        tags: [],
        colors: [],
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.description || !formData.category || !formData.sku) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Massage Chair">Massage Chair</SelectItem>
                  <SelectItem value="Spa">Spa Equipment</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Wellness">Wellness Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => updateField('available', !!checked)}
              />
              <Label htmlFor="available">Available for Sale</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_usd}
                onChange={(e) => updateField('price_usd', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sale_price">Sale Price (USD)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={formData.sale_price_usd}
                onChange={(e) => updateField('sale_price_usd', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="msrp">MSRP (USD)</Label>
              <Input
                id="msrp"
                type="number"
                step="0.01"
                value={formData.msrp_usd}
                onChange={(e) => updateField('msrp_usd', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight_lbs}
              onChange={(e) => updateField('weight_lbs', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}