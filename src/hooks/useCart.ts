import { useState, useEffect } from 'react';
import { ProductVariant } from '@/types';

export interface CartItem {
  variant: ProductVariant;
  quantity: number;
}

export interface UseCartReturn {
  items: CartItem[];
  addItem: (variant: ProductVariant, quantity: number) => void;
  removeItem: (variantId: string) => void;
  updateItemQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

export const useCart = (): UseCartReturn => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (variant: ProductVariant, quantity: number) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.variant.id === variant.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { variant, quantity }];
      }
    });
  };

  const removeItem = (variantId: string) => {
    setItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
  };

  const updateItemQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    subtotal,
    itemCount
  };
};