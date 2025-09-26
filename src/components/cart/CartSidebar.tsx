import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Gift, 
  Truck, 
  Package 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useCart } from './CartManager';

interface CartSidebarProps {
  trigger?: React.ReactNode;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ trigger }) => {
  const navigate = useNavigate();
  const { 
    cart, 
    removeFromCart, 
    updateCartItem, 
    clearCart,
    getCartTotal,
    getGiftSavings 
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItem(itemId, { quantity: newQuantity });
    }
  };

  const handleProceedToCheckout = () => {
    if (!cart?.line_items?.length) {
      return; // Don't proceed if cart is empty
    }

    // Convert cart items to the format expected by NewOrder form
    const orderItems = cart.line_items.map((item) => ({
      product: item.product,
      qty: item.quantity,
      color: item.color,
      white_glove_selected: item.white_glove_selected,
      extended_warranty_selected: item.extended_warranty_selected,
      price_override: item.price_override
    }));

    console.log('Proceeding to checkout with items:', orderItems);

    // Navigate to the new order form with the cart data
    navigate('/orders/new', {
      state: {
        fromCart: true,
        cartItems: orderItems,
        cartTotal: cart.total || 0,
        cartId: cart.id
      }
    });
  };

  const getItemPrice = (item: any) => {
    const basePrice = item.price_override !== undefined ? item.price_override : 
                     (item.product.sale_price_usd || item.product.price_usd);
    let totalPrice = basePrice * item.quantity;

    if (item.white_glove_selected && item.product.white_glove_price_usd) {
      totalPrice += item.product.white_glove_price_usd;
    }

    if (item.extended_warranty_selected && item.product.extended_warranty_price_usd) {
      totalPrice += item.product.extended_warranty_price_usd;
    }

    return totalPrice;
  };

  const cartItemsCount = cart?.line_items.reduce((total, item) => total + item.quantity, 0) || 0;

  const defaultTrigger = (
    <Button variant="outline" className="relative">
      <ShoppingCart className="w-4 h-4 mr-2" />
      Cart
      {cartItemsCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {cartItemsCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({cartItemsCount} items)
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {!cart || cart.line_items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">Add some products to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.line_items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                        {item.color && (
                          <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.is_gift && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            <Gift className="w-3 h-3 mr-1" />
                            Gift
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Additional Services */}
                    {(item.white_glove_selected || item.extended_warranty_selected) && (
                      <div className="mb-2 space-y-1">
                        {item.white_glove_selected && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Truck className="w-3 h-3" />
                            White Glove Service (+{formatPrice(item.product.white_glove_price_usd || 0)})
                          </div>
                        )}
                        {item.extended_warranty_selected && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Package className="w-3 h-3" />
                            Extended Warranty (+{formatPrice(item.product.extended_warranty_price_usd || 0)})
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.is_gift}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.is_gift}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice(getItemPrice(item))}
                        </div>
                        {item.is_gift && item.price_override === 0 && (
                          <div className="text-xs text-green-600">
                            Free ({formatPrice(item.product.price_usd)} value)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Gift Suggestions */}
                {cart.gift_suggestions && cart.gift_suggestions.length > 0 && (
                  <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Available Gifts
                    </h4>
                    {cart.gift_suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-purple-700">
                        {suggestion.gift_rule.name} - Free {suggestion.gift_product.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipments Summary */}
                {cart.shipments && cart.shipments.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping Summary
                    </h4>
                    {cart.shipments.map((shipment, index) => (
                      <div key={shipment.id} className="text-sm text-muted-foreground mb-1">
                        Shipment {index + 1}: {shipment.line_items.length} items - {formatPrice(shipment.estimated_cost)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart && cart.line_items.length > 0 && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                
                {cart.shipping_total > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatPrice(cart.shipping_total)}</span>
                  </div>
                )}
                
                {cart.tax_total > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatPrice(cart.tax_total)}</span>
                  </div>
                )}

                {getGiftSavings() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Gift Savings:</span>
                    <span>-{formatPrice(getGiftSavings())}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleProceedToCheckout}>
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;