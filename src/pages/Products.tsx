import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Package,
  ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with real data from Supabase
  const products = [
    {
      id: 'prod-1',
      name: 'iPhone 15 Pro',
      category: 'Smartphones',
      sku: 'IPH15P-128-TIT',
      price: 999.99,
      inventory: 25,
      requires_ltl: false,
      created_at: '2024-01-10T10:30:00Z'
    },
    {
      id: 'prod-2',
      name: 'MacBook Pro 16"',
      category: 'Laptops',
      sku: 'MBP16-512-SG',
      price: 2499.99,
      inventory: 10,
      requires_ltl: false,
      created_at: '2024-01-12T14:15:00Z'
    },
    {
      id: 'prod-3',
      name: 'Samsung 65" QLED TV',
      category: 'Televisions',
      sku: 'SAM65QLED',
      price: 1299.99,
      inventory: 5,
      requires_ltl: true,
      created_at: '2024-01-15T09:45:00Z'
    }
  ];

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage product catalog and inventory
          </p>
        </div>
        <Button className="shadow-elegant">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="shadow-card hover:shadow-elegant transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium">Category:</span> {product.category}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Price:</span> ${product.price.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Inventory:</span> 
                      <Badge 
                        variant={product.inventory > 10 ? "default" : product.inventory > 0 ? "secondary" : "destructive"} 
                        className="ml-2"
                      >
                        {product.inventory} in stock
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">LTL:</span> 
                      {product.requires_ltl ? (
                        <Badge variant="outline" className="ml-2">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">
                          Not Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Add your first product to get started'
              }
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}