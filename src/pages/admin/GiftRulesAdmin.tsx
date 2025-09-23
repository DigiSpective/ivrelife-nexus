import React, { useState } from 'react';
import { Plus, Edit, Trash2, Gift, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { GiftRule, AdminGiftRuleCreate } from '@/types/products';
import { giftRules as initialGiftRules, sampleProducts } from '@/data/sampleProducts';
import { defaultGiftEngine } from '@/lib/gift-rules';

export default function GiftRulesAdmin() {
  const [giftRules, setGiftRules] = useState<GiftRule[]>(initialGiftRules);
  const [editingRule, setEditingRule] = useState<GiftRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewRuleDialogOpen, setIsNewRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AdminGiftRuleCreate>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getProductName = (productId: string): string => {
    const product = sampleProducts.find(p => p.id === productId);
    return product?.name || productId;
  };

  const handleEditRule = (rule: GiftRule) => {
    setEditingRule({ ...rule });
    setIsEditDialogOpen(true);
    setValidationErrors([]);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    const validation = defaultGiftEngine.validateGiftRule(editingRule);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setGiftRules(prev => prev.map(r => 
      r.id === editingRule.id ? editingRule : r
    ));
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setValidationErrors([]);
  };

  const handleCreateRule = () => {
    const ruleToCreate = {
      id: `gr_custom_${Date.now()}`,
      ...newRule
    } as GiftRule;

    const validation = defaultGiftEngine.validateGiftRule(ruleToCreate);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setGiftRules(prev => [...prev, ruleToCreate]);
    setIsNewRuleDialogOpen(false);
    setNewRule({});
    setValidationErrors([]);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this gift rule?')) {
      setGiftRules(prev => prev.filter(r => r.id !== ruleId));
    }
  };

  const updateEditingRule = (updates: Partial<GiftRule>) => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, ...updates });
    setValidationErrors([]);
  };

  const updateNewRule = (updates: Partial<AdminGiftRuleCreate>) => {
    setNewRule({ ...newRule, ...updates });
    setValidationErrors([]);
  };

  const eligibleProducts = sampleProducts.filter(p => p.gift_eligible);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gift Rules Administration</h1>
          <p className="text-muted-foreground">
            Manage automatic gift addition rules and bonus item triggers
          </p>
        </div>
        <Button onClick={() => setIsNewRuleDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Gift Rule
        </Button>
      </div>

      {/* Gift Rules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{giftRules.length}</p>
              </div>
              <Gift className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto-Add Rules</p>
                <p className="text-2xl font-bold">
                  {giftRules.filter(r => r.auto_add_gift).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eligible Products</p>
                <p className="text-2xl font-bold">{eligibleProducts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Trigger Products</TableHead>
                <TableHead>Gift Product</TableHead>
                <TableHead>Min Price</TableHead>
                <TableHead>Auto Add</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giftRules.map((rule) => {
                const giftProduct = sampleProducts.find(p => p.id === rule.gift_product_id);
                
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.notes && (
                          <div className="text-sm text-muted-foreground">{rule.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {rule.trigger_product_ids.slice(0, 2).map(productId => (
                          <Badge key={productId} variant="outline" className="text-xs">
                            {getProductName(productId)}
                          </Badge>
                        ))}
                        {rule.trigger_product_ids.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{rule.trigger_product_ids.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{giftProduct?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {rule.gift_quantity}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {rule.min_product_price_usd ? (
                        <span>{formatPrice(rule.min_product_price_usd)}</span>
                      ) : (
                        <span className="text-muted-foreground">No minimum</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={rule.auto_add_gift ? "default" : "secondary"}
                        className={rule.auto_add_gift ? "bg-green-100 text-green-800" : ""}
                      >
                        {rule.auto_add_gift ? 'Auto' : 'Manual'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="default"
                        className="bg-blue-100 text-blue-800"
                      >
                        Active
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
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

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gift Rule: {editingRule?.name}</DialogTitle>
          </DialogHeader>
          
          {editingRule && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Validation Errors</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(e) => updateEditingRule({ name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="gift-product">Gift Product</Label>
                <Select 
                  value={editingRule.gift_product_id} 
                  onValueChange={(value) => updateEditingRule({ gift_product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gift-quantity">Gift Quantity</Label>
                  <Input
                    id="gift-quantity"
                    type="number"
                    value={editingRule.gift_quantity}
                    onChange={(e) => updateEditingRule({ gift_quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="min-price">Minimum Product Price</Label>
                  <Input
                    id="min-price"
                    type="number"
                    value={editingRule.min_product_price_usd || ''}
                    onChange={(e) => updateEditingRule({ 
                      min_product_price_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shipping-option">Gift Shipping Option</Label>
                <Select 
                  value={editingRule.gift_shipping_option} 
                  onValueChange={(value) => updateEditingRule({ 
                    gift_shipping_option: value as GiftRule['gift_shipping_option'] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small_parcel">Small Parcel</SelectItem>
                    <SelectItem value="included_with_main">Included with Main</SelectItem>
                    <SelectItem value="white_glove">White Glove</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-add"
                    checked={editingRule.auto_add_gift}
                    onCheckedChange={(checked) => updateEditingRule({ auto_add_gift: !!checked })}
                  />
                  <Label htmlFor="auto-add">Auto Add Gift</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="price-zeroed"
                    checked={editingRule.gift_price_zeroed}
                    onCheckedChange={(checked) => updateEditingRule({ gift_price_zeroed: !!checked })}
                  />
                  <Label htmlFor="price-zeroed">Gift Price Zeroed</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin-approval"
                    checked={editingRule.admin_approval_required}
                    onCheckedChange={(checked) => updateEditingRule({ admin_approval_required: !!checked })}
                  />
                  <Label htmlFor="admin-approval">Admin Approval Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="one-gift"
                    checked={editingRule.one_gift_per_order}
                    onCheckedChange={(checked) => updateEditingRule({ one_gift_per_order: !!checked })}
                  />
                  <Label htmlFor="one-gift">One Gift Per Order</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingRule.notes || ''}
                  onChange={(e) => updateEditingRule({ notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Rule Dialog */}
      <Dialog open={isNewRuleDialogOpen} onOpenChange={setIsNewRuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Gift Rule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Validation Errors</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Label htmlFor="new-rule-name">Rule Name</Label>
              <Input
                id="new-rule-name"
                value={newRule.name || ''}
                onChange={(e) => updateNewRule({ name: e.target.value })}
                placeholder="Enter rule name..."
              />
            </div>

            <div>
              <Label htmlFor="new-gift-product">Gift Product</Label>
              <Select 
                value={newRule.gift_product_id || ''} 
                onValueChange={(value) => updateNewRule({ gift_product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gift product" />
                </SelectTrigger>
                <SelectContent>
                  {sampleProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-gift-quantity">Gift Quantity</Label>
                <Input
                  id="new-gift-quantity"
                  type="number"
                  value={newRule.gift_quantity || 1}
                  onChange={(e) => updateNewRule({ gift_quantity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="new-min-price">Minimum Product Price</Label>
                <Input
                  id="new-min-price"
                  type="number"
                  value={newRule.min_product_price_usd || ''}
                  onChange={(e) => updateNewRule({ 
                    min_product_price_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="Optional minimum price"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-shipping-option">Gift Shipping Option</Label>
              <Select 
                value={newRule.gift_shipping_option || ''} 
                onValueChange={(value) => updateNewRule({ 
                  gift_shipping_option: value as GiftRule['gift_shipping_option'] 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small_parcel">Small Parcel</SelectItem>
                  <SelectItem value="included_with_main">Included with Main</SelectItem>
                  <SelectItem value="white_glove">White Glove</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-auto-add"
                  checked={newRule.auto_add_gift || false}
                  onCheckedChange={(checked) => updateNewRule({ auto_add_gift: !!checked })}
                />
                <Label htmlFor="new-auto-add">Auto Add Gift</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-price-zeroed"
                  checked={newRule.gift_price_zeroed || false}
                  onCheckedChange={(checked) => updateNewRule({ gift_price_zeroed: !!checked })}
                />
                <Label htmlFor="new-price-zeroed">Gift Price Zeroed</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-admin-approval"
                  checked={newRule.admin_approval_required || false}
                  onCheckedChange={(checked) => updateNewRule({ admin_approval_required: !!checked })}
                />
                <Label htmlFor="new-admin-approval">Admin Approval Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-one-gift"
                  checked={newRule.one_gift_per_order || false}
                  onCheckedChange={(checked) => updateNewRule({ one_gift_per_order: !!checked })}
                />
                <Label htmlFor="new-one-gift">One Gift Per Order</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="new-notes">Notes</Label>
              <Textarea
                id="new-notes"
                value={newRule.notes || ''}
                onChange={(e) => updateNewRule({ notes: e.target.value })}
                rows={3}
                placeholder="Optional notes about this rule..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsNewRuleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>
                Create Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}