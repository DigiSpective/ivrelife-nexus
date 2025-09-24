import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  UserCheck,
  UserX,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { mockCustomers } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface CustomerExtended {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'suspended' | 'vip';
  customer_type: 'individual' | 'business' | 'wholesale';
  registration_date: string;
  last_login?: string;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  loyalty_points: number;
  preferred_payment: string;
  communication_preferences: string[];
  tags: string[];
  notes: string;
  credit_limit?: number;
  payment_terms?: number;
  assigned_rep?: string;
  company_name?: string;
  tax_id?: string;
  discount_tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  marketing_consent: boolean;
  sms_consent: boolean;
  created_by: string;
  last_updated: string;
}

const extendedCustomers: CustomerExtended[] = mockCustomers.map(customer => ({
  ...customer,
  email: customer.email || 'no-email@example.com',
  phone: customer.phone || '(555) 000-0000',
  address: typeof customer.default_address === 'object' && customer.default_address ? 
    `${customer.default_address.street}, ${customer.default_address.city}, ${customer.default_address.state} ${customer.default_address.zip}` :
    '123 Main St, City, State 12345',
  status: ['active', 'inactive', 'suspended', 'vip'][Math.floor(Math.random() * 4)] as any,
  customer_type: ['individual', 'business', 'wholesale'][Math.floor(Math.random() * 3)] as any,
  registration_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  last_login: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
  last_order_date: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString() : undefined,
  total_orders: Math.floor(Math.random() * 50) + 1,
  total_spent: Math.floor(Math.random() * 10000) + 100,
  average_order_value: Math.floor(Math.random() * 500) + 50,
  loyalty_points: Math.floor(Math.random() * 5000),
  preferred_payment: ['credit_card', 'paypal', 'bank_transfer', 'cash'][Math.floor(Math.random() * 4)],
  communication_preferences: ['email', 'sms', 'phone'].filter(() => Math.random() > 0.5),
  tags: ['premium', 'bulk_buyer', 'frequent', 'seasonal'].filter(() => Math.random() > 0.7),
  notes: Math.random() > 0.6 ? 'Important customer - handle with care' : '',
  credit_limit: Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : undefined,
  payment_terms: Math.random() > 0.8 ? [15, 30, 60][Math.floor(Math.random() * 3)] : undefined,
  assigned_rep: Math.random() > 0.6 ? ['John Smith', 'Sarah Johnson', 'Mike Wilson'][Math.floor(Math.random() * 3)] : undefined,
  company_name: Math.random() > 0.7 ? `${customer.name.split(' ')[0]} Industries` : undefined,
  tax_id: Math.random() > 0.8 ? `TAX${Math.random().toString().substr(2, 9)}` : undefined,
  discount_tier: ['none', 'bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 5)] as any,
  marketing_consent: Math.random() > 0.3,
  sms_consent: Math.random() > 0.5,
  created_by: 'System',
  last_updated: new Date().toISOString()
}));

export default function CustomersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<CustomerExtended | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const { toast } = useToast();

  const filteredCustomers = extendedCustomers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesType = typeFilter === 'all' || customer.customer_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleBulkAction = (action: string) => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No customers selected",
        description: "Please select customers to perform this action",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Action completed",
      description: `${action} applied to ${selectedCustomers.length} customers`,
    });
    setSelectedCustomers([]);
  };

  const handleCustomerUpdate = (customerId: string, updates: Partial<CustomerExtended>) => {
    toast({
      title: "Customer updated",
      description: `Customer ${customerId} has been updated successfully`,
    });
    setEditingCustomer(null);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      vip: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDiscountTierBadge = (tier: string) => {
    if (tier === 'none') return null;
    
    const tierColors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge variant="outline" className={tierColors[tier as keyof typeof tierColors]}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const customerStats = {
    totalCustomers: extendedCustomers.length,
    activeCustomers: extendedCustomers.filter(c => c.status === 'active').length,
    vipCustomers: extendedCustomers.filter(c => c.status === 'vip').length,
    businessCustomers: extendedCustomers.filter(c => c.customer_type === 'business').length,
    totalSpent: extendedCustomers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: Math.floor(extendedCustomers.reduce((sum, customer) => sum + customer.average_order_value, 0) / extendedCustomers.length)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer relationships and data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Customers
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Customers
          </Button>
          <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input placeholder="Full name" />
                  </div>
                  <div>
                    <Label>Customer Type</Label>
                    <Select defaultValue="individual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email Address *</Label>
                    <Input type="email" placeholder="customer@example.com" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input placeholder="Company name (for business customers)" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea placeholder="Full address" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Tier</Label>
                    <Select defaultValue="none">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="bronze">Bronze (5%)</SelectItem>
                        <SelectItem value="silver">Silver (10%)</SelectItem>
                        <SelectItem value="gold">Gold (15%)</SelectItem>
                        <SelectItem value="platinum">Platinum (20%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assigned Rep</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john">John Smith</SelectItem>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="mike">Mike Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea placeholder="Internal notes about this customer..." rows={3} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewCustomer(false)}>Cancel</Button>
                <Button onClick={() => {
                  toast({
                    title: "Customer created",
                    description: "New customer has been added successfully",
                  });
                  setShowNewCustomer(false);
                }}>Create Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{customerStats.activeCustomers}</p>
              </div>
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP</p>
                <p className="text-2xl font-bold text-purple-600">{customerStats.vipCustomers}</p>
              </div>
              <Star className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business</p>
                <p className="text-2xl font-bold text-indigo-600">{customerStats.businessCustomers}</p>
              </div>
              <ShoppingBag className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-lg font-bold text-green-600">${customerStats.totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order</p>
                <p className="text-lg font-bold text-blue-600">${customerStats.averageOrderValue}</p>
              </div>
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCustomers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedCustomers.length} customers selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  Deactivate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('email_campaign')}>
                  Email Campaign
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('suspend')}>
                  Suspend
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers(filteredCustomers.map(c => c.id));
                        } else {
                          setSelectedCustomers([]);
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.company_name && (
                          <p className="text-xs text-muted-foreground">{customer.company_name}</p>
                        )}
                        {customer.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {customer.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-32">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.total_orders}</p>
                        <p className="text-xs text-muted-foreground">
                          ${customer.average_order_value} avg
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-green-600">${customer.total_spent.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      {getDiscountTierBadge(customer.discount_tier)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(customer)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Edit Customer - {customer.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Customer Name</Label>
                                  <Input defaultValue={customer.name} />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select defaultValue={customer.status}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="vip">VIP</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Email</Label>
                                  <Input defaultValue={customer.email} />
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <Input defaultValue={customer.phone} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Discount Tier</Label>
                                  <Select defaultValue={customer.discount_tier}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Discount</SelectItem>
                                      <SelectItem value="bronze">Bronze (5%)</SelectItem>
                                      <SelectItem value="silver">Silver (10%)</SelectItem>
                                      <SelectItem value="gold">Gold (15%)</SelectItem>
                                      <SelectItem value="platinum">Platinum (20%)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Loyalty Points</Label>
                                  <Input type="number" defaultValue={customer.loyalty_points} />
                                </div>
                              </div>
                              <div>
                                <Label>Address</Label>
                                <Textarea defaultValue={customer.address} rows={2} />
                              </div>
                              <div>
                                <Label>Customer Notes</Label>
                                <Textarea defaultValue={customer.notes} placeholder="Internal notes..." rows={3} />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setEditingCustomer(null)}>Cancel</Button>
                              <Button onClick={() => handleCustomerUpdate(customer.id, {})}>Save Changes</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}