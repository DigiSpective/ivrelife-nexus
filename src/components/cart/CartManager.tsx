import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Cart, 
  CartLineItem, 
  CartShipment, 
  Product, 
  GiftSuggestion 
} from '@/types/products';
import { 
  defaultGiftEngine, 
  autoAddGiftItems, 
  getGiftSuggestions, 
  calculateGiftSavings 
} from '@/lib/gift-rules';
// Removed shipping engine dependency to avoid module loading issues
// Shipping integration will be handled at checkout

interface CartContextType {
  cart: Cart | null;
  addToCart: (product: Product, options?: CartItemOptions) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartLineItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getGiftSavings: () => number;
  refreshCart: () => void;
}

interface CartItemOptions {
  quantity?: number;
  color?: string;
  whiteGloveSelected?: boolean;
  extendedWarrantySelected?: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

// Consistent export pattern for Fast Refresh
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const initialCart: Cart = {
    id: `cart-${Date.now()}`,
    line_items: [],
    shipments: [],
    subtotal: 0,
    shipping_total: 0,
    tax_total: 0,
    total: 0,
    gift_suggestions: []
  };

  // Use React state for cart
  const [cart, setCart] = useState<Cart>(initialCart);

  const initializeCart = () => {
    const newCart: Cart = {
      id: `cart-${Date.now()}`,
      line_items: [],
      shipments: [],
      subtotal: 0,
      shipping_total: 0,
      tax_total: 0,
      total: 0,
      gift_suggestions: []
    };
    setCart(newCart);
  };

  const calculateCartTotals = (lineItems: CartLineItem[], shipments: CartShipment[]) => {
    const subtotal = lineItems.reduce((total, item) => {
      const itemPrice = item.price_override !== undefined ? item.price_override : 
                      (item.product.sale_price_usd || item.product.price_usd);
      let price = itemPrice * item.quantity;
      
      // Add white glove service cost
      if (item.white_glove_selected && item.product.white_glove_price_usd) {
        price += item.product.white_glove_price_usd;
      }
      
      // Add extended warranty cost
      if (item.extended_warranty_selected && item.product.extended_warranty_price_usd) {
        price += item.product.extended_warranty_price_usd;
      }
      
      return total + price;
    }, 0);

    const shipping_total = shipments.reduce((total, shipment) => 
      total + shipment.estimated_cost, 0
    );

    // Simple tax calculation (8.25% for demo)
    const tax_total = subtotal * 0.0825;
    
    const total = subtotal + shipping_total + tax_total;

    return { subtotal, shipping_total, tax_total, total };
  };

  const refreshCart = () => {
    if (!cart) return;

    // Auto-add gifts based on current cart items
    const autoGifts = autoAddGiftItems(cart.line_items);
    const allItems = [...cart.line_items, ...autoGifts];

    // Remove duplicates
    const uniqueItems = allItems.reduce((acc, item) => {
      const existing = acc.find(existing => 
        existing.product_id === item.product_id && 
        existing.is_gift === item.is_gift &&
        existing.color === item.color
      );
      
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push(item);
      }
      
      return acc;
    }, [] as CartLineItem[]);

    // Generate simple shipments for cart display
    const shipments = [
      {
        id: 'main_shipment',
        shipment_type: 'main' as const,
        shipping_profile_id: 'standard',
        line_items: uniqueItems.filter(item => !item.is_gift),
        estimated_cost: 15.99,
        estimated_delivery_days: 5,
        carrier_name: 'Standard Shipping'
      },
      ...(uniqueItems.some(item => item.is_gift) ? [{
        id: 'gift_shipment',
        shipment_type: 'gift' as const,
        shipping_profile_id: 'gift',
        line_items: uniqueItems.filter(item => item.is_gift),
        estimated_cost: 0,
        estimated_delivery_days: 5,
        carrier_name: 'Gift Shipping'
      }] : [])
    ];
    
    // Calculate totals
    const totals = calculateCartTotals(uniqueItems, shipments);
    
    // Get gift suggestions
    const giftSuggestions = getGiftSuggestions(uniqueItems.filter(item => !item.is_gift));

    setCart({
      ...cart,
      line_items: uniqueItems,
      shipments,
      gift_suggestions: giftSuggestions,
      ...totals
    });
  };

  const addToCart = (product: Product, options: CartItemOptions = {}) => {
    if (!cart) return;

    const {
      quantity = 1,
      color,
      whiteGloveSelected = false,
      extendedWarrantySelected = false
    } = options;

    // Check if item already exists in cart
    const existingItemIndex = cart.line_items.findIndex(item => 
      item.product_id === product.id && 
      item.color === color &&
      !item.is_gift &&
      item.white_glove_selected === whiteGloveSelected &&
      item.extended_warranty_selected === extendedWarrantySelected
    );

    let updatedItems: CartLineItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...cart.line_items];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem: CartLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: product.id,
        product,
        quantity,
        color,
        is_gift: false,
        shipping_profile_id: product.shipping_profile_id,
        white_glove_selected: whiteGloveSelected,
        extended_warranty_selected: extendedWarrantySelected
      };

      updatedItems = [...cart.line_items, newItem];
    }

    // Auto-add gifts
    const autoGifts = autoAddGiftItems(updatedItems);
    const allItems = [...updatedItems, ...autoGifts];

    // Generate simple shipments for cart display
    const shipments = [
      {
        id: 'main_shipment',
        shipment_type: 'main' as const,
        shipping_profile_id: 'standard',
        line_items: allItems.filter(item => !item.is_gift),
        estimated_cost: 15.99,
        estimated_delivery_days: 5,
        carrier_name: 'Standard Shipping'
      },
      ...(allItems.some(item => item.is_gift) ? [{
        id: 'gift_shipment',
        shipment_type: 'gift' as const,
        shipping_profile_id: 'gift',
        line_items: allItems.filter(item => item.is_gift),
        estimated_cost: 0,
        estimated_delivery_days: 5,
        carrier_name: 'Gift Shipping'
      }] : [])
    ];
    
    // Calculate totals
    const totals = calculateCartTotals(allItems, shipments);
    
    // Get gift suggestions
    const giftSuggestions = getGiftSuggestions(allItems.filter(item => !item.is_gift));

    setCart({
      ...cart,
      line_items: allItems,
      shipments,
      gift_suggestions: giftSuggestions,
      ...totals
    });
  };

  const removeFromCart = (itemId: string) => {
    if (!cart) return;

    const updatedItems = cart.line_items.filter(item => item.id !== itemId);
    
    // Remove any auto-added gifts that might no longer be applicable
    const nonGiftItems = updatedItems.filter(item => !item.is_gift);
    const autoGifts = autoAddGiftItems(nonGiftItems);
    
    // Keep only gifts that are still applicable
    const validGifts = updatedItems.filter(item => 
      item.is_gift && autoGifts.some(gift => 
        gift.product_id === item.product_id && gift.gift_rule_id === item.gift_rule_id
      )
    );

    const finalItems = [...nonGiftItems, ...validGifts];

    // Generate simple shipments for cart display
    const shipments = [
      {
        id: 'main_shipment',
        shipment_type: 'main' as const,
        shipping_profile_id: 'standard',
        line_items: finalItems.filter(item => !item.is_gift),
        estimated_cost: 15.99,
        estimated_delivery_days: 5,
        carrier_name: 'Standard Shipping'
      },
      ...(finalItems.some(item => item.is_gift) ? [{
        id: 'gift_shipment',
        shipment_type: 'gift' as const,
        shipping_profile_id: 'gift',
        line_items: finalItems.filter(item => item.is_gift),
        estimated_cost: 0,
        estimated_delivery_days: 5,
        carrier_name: 'Gift Shipping'
      }] : [])
    ];
    
    // Calculate totals
    const totals = calculateCartTotals(finalItems, shipments);
    
    // Get gift suggestions
    const giftSuggestions = getGiftSuggestions(finalItems.filter(item => !item.is_gift));

    setCart({
      ...cart,
      line_items: finalItems,
      shipments,
      gift_suggestions: giftSuggestions,
      ...totals
    });
  };

  const updateCartItem = (itemId: string, updates: Partial<CartLineItem>) => {
    if (!cart) return;

    const updatedItems = cart.line_items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );

    // Refresh auto-gifts if non-gift items changed
    if (!cart.line_items.find(item => item.id === itemId)?.is_gift) {
      const nonGiftItems = updatedItems.filter(item => !item.is_gift);
      const autoGifts = autoAddGiftItems(nonGiftItems);
      const validGifts = updatedItems.filter(item => 
        item.is_gift && autoGifts.some(gift => 
          gift.product_id === item.product_id && gift.gift_rule_id === item.gift_rule_id
        )
      );
      updatedItems.splice(0, updatedItems.length, ...nonGiftItems, ...validGifts);
    }

    // Generate simple shipments for cart display
    const shipments = [
      {
        id: 'main_shipment',
        shipment_type: 'main' as const,
        shipping_profile_id: 'standard',
        line_items: updatedItems.filter(item => !item.is_gift),
        estimated_cost: 15.99,
        estimated_delivery_days: 5,
        carrier_name: 'Standard Shipping'
      },
      ...(updatedItems.some(item => item.is_gift) ? [{
        id: 'gift_shipment',
        shipment_type: 'gift' as const,
        shipping_profile_id: 'gift',
        line_items: updatedItems.filter(item => item.is_gift),
        estimated_cost: 0,
        estimated_delivery_days: 5,
        carrier_name: 'Gift Shipping'
      }] : [])
    ];
    
    // Calculate totals
    const totals = calculateCartTotals(updatedItems, shipments);
    
    // Get gift suggestions
    const giftSuggestions = getGiftSuggestions(updatedItems.filter(item => !item.is_gift));

    setCart({
      ...cart,
      line_items: updatedItems,
      shipments,
      gift_suggestions: giftSuggestions,
      ...totals
    });
  };

  const clearCart = () => {
    initializeCart();
  };

  const getCartTotal = () => {
    return cart?.total || 0;
  };

  const getGiftSavings = () => {
    if (!cart) return 0;
    return calculateGiftSavings(cart.line_items);
  };

  const contextValue: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    getGiftSavings,
    refreshCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Export as default to maintain compatibility
export { CartProvider as default };