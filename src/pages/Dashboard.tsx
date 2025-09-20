import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { mockOrders, mockCustomers } from '@/lib/mock-data';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Orders',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      title: 'Revenue',
      value: '$68,429',
      change: '+8.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Customers',
      value: '1,249',
      change: '+4.1%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Products',
      value: '847',
      change: '+2.3%',
      trend: 'up',
      icon: Package,
      color: 'text-orange-600'
    }
  ];

  const recentOrders = mockOrders.slice(0, 5);
  
  // Function to get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    return customer ? `${customer.name}` : 'Unknown Customer';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your IV RELIFE operations
          </p>
        </div>
        <Link to="/orders/new">
          <Button className="shadow-elegant">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-elegant transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {getCustomerName(order.customer_id)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Order #{order.id} • ${order.total_amount.toLocaleString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'shipped' ? 'secondary' :
                    order.status === 'processing' ? 'outline' : 'destructive'
                  }
                  className="capitalize"
                >
                  {order.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/orders/new">
              <Button variant="outline" className="w-full justify-start h-12">
                <Plus className="w-4 h-4 mr-3" />
                Create New Order
              </Button>
            </Link>
            <Link to="/customers">
              <Button variant="outline" className="w-full justify-start h-12">
                <Users className="w-4 h-4 mr-3" />
                Manage Customers
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full justify-start h-12">
                <Package className="w-4 h-4 mr-3" />
                View Products
              </Button>
            </Link>
            <Link to="/shipping">
              <Button variant="outline" className="w-full justify-start h-12">
                <TrendingUp className="w-4 h-4 mr-3" />
                Track Shipments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}