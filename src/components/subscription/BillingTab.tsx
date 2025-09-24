import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Eye, 
  FileText, 
  Calendar, 
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Mail,
  Printer,
  ExternalLink,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  description: string;
  paymentMethod?: string;
  downloadUrl?: string;
}

interface BillingInfo {
  nextBillingDate: string;
  billingCycle: 'monthly' | 'yearly';
  currentPlan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  billingEmail: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    date: '2024-01-01',
    dueDate: '2024-01-15',
    amount: 79.00,
    tax: 7.90,
    total: 86.90,
    status: 'paid',
    description: 'Professional Plan - January 2024',
    paymentMethod: 'Visa ending in 4242'
  },
  {
    id: '2',
    number: 'INV-2024-002',
    date: '2024-02-01',
    dueDate: '2024-02-15',
    amount: 79.00,
    tax: 7.90,
    total: 86.90,
    status: 'paid',
    description: 'Professional Plan - February 2024',
    paymentMethod: 'Visa ending in 4242'
  },
  {
    id: '3',
    number: 'INV-2024-003',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    amount: 79.00,
    tax: 7.90,
    total: 86.90,
    status: 'pending',
    description: 'Professional Plan - March 2024'
  }
];

const mockBillingInfo: BillingInfo = {
  nextBillingDate: '2024-04-01',
  billingCycle: 'monthly',
  currentPlan: 'Professional',
  amount: 79.00,
  currency: 'USD',
  paymentMethod: 'Visa ending in 4242',
  billingEmail: 'billing@company.com'
};

interface BillingTabProps {
  user: any;
}

export function BillingTab({ user }: BillingTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(mockBillingInfo);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.number} is being downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      // Simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'paid' as const } : inv
      ));
      
      toast({
        title: "Payment Successful",
        description: `Invoice ${invoice.number} has been paid.`,
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Could not process the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Refreshed",
        description: "Billing information has been updated.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Billing Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Next charge date</p>
              <p className="text-lg font-semibold">
                {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">
                ${billingInfo.amount.toFixed(2)} {billingInfo.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{billingInfo.currentPlan} - {billingInfo.billingCycle}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Primary payment method</p>
              <p className="font-medium">{billingInfo.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing email</p>
              <p className="font-medium">{billingInfo.billingEmail}</p>
            </div>
            <Button variant="outline" size="sm">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice History
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search invoices</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by invoice number or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <Separator />

          {/* Invoice List */}
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(invoice.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{invoice.number}</h4>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        {invoice.paymentMethod && (
                          <span>Paid via: {invoice.paymentMethod}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">${invoice.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${invoice.amount.toFixed(2)} + ${invoice.tax.toFixed(2)} tax
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={isLoading}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {invoice.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handlePayInvoice(invoice)}
                          disabled={isLoading}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Mail className="w-4 h-4 mr-2" />
              Update Billing Email
            </Button>
            <Button variant="outline" className="justify-start">
              <Printer className="w-4 h-4 mr-2" />
              Download All Invoices
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="w-4 h-4 mr-2" />
              Billing Portal
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Tax Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}