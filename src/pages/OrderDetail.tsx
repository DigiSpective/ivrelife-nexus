import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Truck,
  Receipt,
  Edit,
  Printer,
  Download,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { mockOrders, mockCustomers } from '@/lib/mock-data';
import { useOrderProducts } from '@/hooks/useOrderProducts';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  
  // Find the order
  const order = mockOrders.find(o => o.id === id);
  const customer = order ? mockCustomers.find(c => c.id === order.customer_id) : null;
  const { orderItems, orderTotal } = useOrderProducts(id || '');

  if (!order || !customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Not Found</h1>
            <p className="text-muted-foreground mt-1">
              The requested order could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'shipped': return 'secondary';
      case 'processing': return 'outline';
      case 'pending': return 'destructive';
      default: return 'outline';
    }
  };

  const tabs = [
    { id: 'details', name: 'Order Details', icon: Package },
    { id: 'customer', name: 'Customer Info', icon: User },
    { id: 'shipping', name: 'Shipping', icon: Truck },
    { id: 'documents', name: 'Documents', icon: Receipt }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
            <p className="text-muted-foreground mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getStatusColor(order.status)} className="capitalize mt-1">
                  {order.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold">${order.total_amount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="font-semibold">{orderItems.length} products</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-semibold">{new Date(order.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.product?.name || 'Unknown Product'}</h4>
                            <p className="text-sm text-muted-foreground">{item.product?.sku}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.product?.category && (
                                <Badge variant="secondary" className="text-xs">{item.product.category}</Badge>
                              )}
                              {item.product?.white_glove_available && (
                                <Badge variant="outline" className="text-xs">White Glove Available</Badge>
                              )}
                              {item.product?.gift_eligible && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Gift Eligible</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold">${item.line_total.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.qty} × ${item.unit_price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {item.product?.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-semibold">Order Total</span>
                  <span className="text-2xl font-bold">${order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'customer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-semibold">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-semibold">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="font-semibold">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                  <p className="font-semibold">{customer.external_id || customer.id}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Billing Address</label>
                  <div className="mt-1">
                    <p>{customer.address.street}</p>
                    <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Since</label>
                  <p className="font-semibold">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'shipping' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Address</label>
                  <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p>{customer.address.street}</p>
                        <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shipping Method</label>
                  <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                    <p className="font-medium">Standard Shipping</p>
                    <p className="text-sm text-muted-foreground">5-7 business days</p>
                    <p className="text-sm font-medium mt-1">$15.99</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tracking Information</label>
                <div className="mt-2 p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Tracking information will be available once the order ships</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Order Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Order Invoice</h4>
                      <p className="text-sm text-muted-foreground">Generated automatically</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Additional documents will appear here as they are generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}