/**
 * Simple, direct order store for immediate UI updates
 * Bypasses complex persistence layers for reliable order display
 */

export interface SimpleOrder {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  items: any[];
  created_at: string;
  updated_at: string;
  created_by: string;
  retailer_id?: string;
  location_id?: string;
}

// Global in-memory store for immediate access
class SimpleOrderStore {
  private orders: SimpleOrder[] = [];
  private listeners: Array<() => void> = [];

  // Initialize with some default orders
  constructor() {
    this.orders = [
      {
        id: 'ord-1',
        customer_id: 'cust-1',
        status: 'processing',
        total_amount: 3499.98,
        items: [
          { product: 'iPhone 15 Pro', qty: 1, price: 999.99 },
          { product: 'MacBook Pro 16"', qty: 1, price: 2499.99 }
        ],
        created_at: '2024-03-15T10:30:00Z',
        updated_at: '2024-03-15T11:00:00Z',
        created_by: 'usr-1',
        retailer_id: 'ret-1',
        location_id: 'loc-1'
      },
      {
        id: 'ord-2',
        customer_id: 'cust-2',
        status: 'shipped',
        total_amount: 999.99,
        items: [
          { product: 'iPhone 15', qty: 1, price: 999.99 }
        ],
        created_at: '2024-03-14T14:20:00Z',
        updated_at: '2024-03-14T15:00:00Z',
        created_by: 'usr-1',
        retailer_id: 'ret-1',
        location_id: 'loc-2'
      }
    ];
  }

  // Add order and notify listeners
  addOrder(order: Partial<SimpleOrder>): SimpleOrder {
    const newOrder: SimpleOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      customer_id: order.customer_id || `cust-${Date.now()}`,
      status: order.status || 'pending',
      total_amount: order.total_amount || 0,
      items: order.items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: order.created_by || 'usr-1',
      retailer_id: order.retailer_id || 'ret-1',
      location_id: order.location_id || 'loc-1',
      ...order
    };

    this.orders.unshift(newOrder); // Add to beginning for newest first
    console.log('✅ Order added to simple store:', newOrder.id);
    this.notifyListeners();
    return newOrder;
  }

  // Get all orders
  getOrders(): SimpleOrder[] {
    return [...this.orders]; // Return copy to prevent mutations
  }

  // Get order by ID
  getOrderById(id: string): SimpleOrder | null {
    return this.orders.find(order => order.id === id) || null;
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in order store listener:', error);
      }
    });
  }

  // Clear all orders (for testing)
  clear() {
    this.orders = [];
    this.notifyListeners();
  }

  // Get count
  getCount(): number {
    return this.orders.length;
  }
}

// Export singleton instance
export const simpleOrderStore = new SimpleOrderStore();

// React hook for using the store
export function useSimpleOrderStore() {
  const [orders, setOrders] = React.useState<SimpleOrder[]>(simpleOrderStore.getOrders());

  React.useEffect(() => {
    const unsubscribe = simpleOrderStore.subscribe(() => {
      setOrders(simpleOrderStore.getOrders());
    });
    return unsubscribe;
  }, []);

  return {
    orders,
    addOrder: simpleOrderStore.addOrder.bind(simpleOrderStore),
    getOrderById: simpleOrderStore.getOrderById.bind(simpleOrderStore),
    getCount: simpleOrderStore.getCount.bind(simpleOrderStore)
  };
}

// Add React import for the hook
import React from 'react';