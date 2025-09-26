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
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/products';
import { useToast } from '@/hooks/use-toast';

interface ProductEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (updatedProduct: Product) => void;
  isLoading?: boolean;
}

export function ProductEditDialog({
  isOpen,
  onClose,
  product,
  onSave,
  isLoading = false,
}: ProductEditDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Product>>({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price_usd: product.price_usd,
        sale_price_usd: product.sale_price_usd,
        msrp_usd: product.msrp_usd,
        sku: product.sku,
        available: product.available,
        weight_lbs: product.weight_lbs,
        tags: product.tags || [],
        colors: product.colors || [],
        white_glove_available: product.white_glove_available,
        white_glove_price_usd: product.white_glove_price_usd,
        gift_eligible: product.gift_eligible,
        extended_warranty_years: product.extended_warranty_years,
        extended_warranty_price_usd: product.extended_warranty_price_usd,
      });
    } else {
      setFormData({});
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price_usd) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Category, Price).',
        variant: 'destructive',
      });
      return;
    }

    onSave(formData as Product);
    onClose();
  };

  const handleFieldChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    handleFieldChange('tags', tags);
  };

  const handleColorsChange = (colorsString: string) => {
    const colors = colorsString.split(',').map(color => color.trim()).filter(color => color);
    handleFieldChange('colors', colors);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product: {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => handleFieldChange('sku', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Category and Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category || ''} 
                onValueChange={(value) => handleFieldChange('category', value)}
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
                checked={formData.available || false}
                onCheckedChange={(checked) => handleFieldChange('available', !!checked)}
              />
              <Label htmlFor="available">Product Available</Label>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price_usd || ''}
                onChange={(e) => handleFieldChange('price_usd', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sale_price">Sale Price (USD)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={formData.sale_price_usd || ''}
                onChange={(e) => handleFieldChange('sale_price_usd', parseFloat(e.target.value) || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="msrp">MSRP (USD)</Label>
              <Input
                id="msrp"
                type="number"
                step="0.01"
                value={formData.msrp_usd || ''}
                onChange={(e) => handleFieldChange('msrp_usd', parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight_lbs || ''}
                onChange={(e) => handleFieldChange('weight_lbs', parseFloat(e.target.value) || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="premium, 4d, massage, zero_gravity"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="colors">Available Colors (comma-separated)</Label>
            <Input
              id="colors"
              value={formData.colors?.join(', ') || ''}
              onChange={(e) => handleColorsChange(e.target.value)}
              placeholder="Black, White, Brown, Gray"
            />
          </div>

          {/* White Glove Service */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="white-glove"
                checked={formData.white_glove_available || false}
                onCheckedChange={(checked) => handleFieldChange('white_glove_available', !!checked)}
              />
              <Label htmlFor="white-glove">White Glove Service Available</Label>
            </div>

            {formData.white_glove_available && (
              <div className="ml-6">
                <Label htmlFor="white-glove-price">White Glove Price (USD)</Label>
                <Input
                  id="white-glove-price"
                  type="number"
                  step="0.01"
                  value={formData.white_glove_price_usd || ''}
                  onChange={(e) => handleFieldChange('white_glove_price_usd', parseFloat(e.target.value) || undefined)}
                  className="w-48"
                />
              </div>
            )}
          </div>

          {/* Gift Eligibility */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="gift-eligible"
              checked={formData.gift_eligible || false}
              onCheckedChange={(checked) => handleFieldChange('gift_eligible', !!checked)}
            />
            <Label htmlFor="gift-eligible">Gift Eligible</Label>
          </div>

          {/* Extended Warranty */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="warranty-years">Extended Warranty (Years)</Label>
              <Input
                id="warranty-years"
                type="number"
                min="0"
                max="10"
                value={formData.extended_warranty_years || ''}
                onChange={(e) => handleFieldChange('extended_warranty_years', parseInt(e.target.value) || undefined)}
                className="w-32"
              />
            </div>

            {formData.extended_warranty_years && formData.extended_warranty_years > 0 && (
              <div>
                <Label htmlFor="warranty-price">Extended Warranty Price (USD)</Label>
                <Input
                  id="warranty-price"
                  type="number"
                  step="0.01"
                  value={formData.extended_warranty_price_usd || ''}
                  onChange={(e) => handleFieldChange('extended_warranty_price_usd', parseFloat(e.target.value) || undefined)}
                  className="w-48"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}