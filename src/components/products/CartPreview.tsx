import React, { useState } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CartPreview: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, subtotal, itemCount } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          aria-label={`Shopping cart with ${itemCount} items`}
        >
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
              aria-label={`${itemCount} items in cart`}
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="w-full sm:max-w-lg animate-in slide-in-from-right duration-300"
        aria-label="Shopping cart"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart</span>
            <span className="text-sm font-normal">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button className="mt-4" onClick={() => setIsOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex gap-4">
                    <div 
                      className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex-shrink-0"
                      role="img"
                      aria-label={`Product image for ${item.variant.sku}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.variant.sku}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.variant.id)}
                          aria-label={`Remove ${item.variant.sku} from cart`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-medium">
                        ${(item.variant.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  aria-label="Continue shopping"
                >
                  Continue Shopping
                </Button>
                <a href="/checkout" className="flex-1">
                  <Button 
                    className="w-full"
                    aria-label="Proceed to checkout"
                  >
                    Checkout
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};