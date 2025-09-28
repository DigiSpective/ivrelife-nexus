import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  User,
  Upload,
  Download,
  Users,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomers } from '@/hooks/useCustomers';
import { Customer } from '@/types';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const [customerDialog, setCustomerDialog] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    customer: null as Customer | null
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customer: null as Customer | null
  });
  
  const { data: customersData, isLoading, error, dataUpdatedAt } = useCustomers();
  const customers = customersData?.data || [];
  
  // Debug logging to trace component re-renders with proper null checks
  console.log(`[${new Date().toISOString()}] Customers component render:`, {
    customersCount: Array.isArray(customers) ? customers.length : 0,
    isLoading,
    error: error?.message,
    dataUpdatedAt: new Date(dataUpdatedAt),
    customers: Array.isArray(customers) ? customers.map(c => ({ id: c.id, name: c.name, created_at: c.created_at })) : 'not an array'
  });

  const handleAddCustomer = () => {
    setCustomerDialog({
      open: true,
      mode: 'create',
      customer: null
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerDialog({
      open: true,
      mode: 'edit',
      customer
    });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteDialog({
      open: true,
      customer
    });
  };

  const handleExportCustomers = () => {
    try {
      if (customers.length === 0) {
        alert('No customers to export');
        return;
      }

      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'Created Date', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...customers.map(customer => [
          `"${customer.name}"`,
          `"${customer.email || ''}"`,
          `"${customer.phone || ''}"`,
          `"${new Date(customer.created_at).toLocaleDateString()}"`,
          `"${customer.notes || ''}"`,
        ].join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImportCustomers = () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Simple CSV import (placeholder implementation)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          
          // Skip header row and process each line
          const customerCount = lines.length - 1;
          
          alert(`Import functionality is a placeholder. Would import ${customerCount} customers from the CSV file.`);
          console.log('CSV content:', text);
          
          // TODO: Implement actual CSV parsing and customer creation
          // This would involve:
          // 1. Parse CSV properly
          // 2. Validate data
          // 3. Create customers using the API
          // 4. Handle errors and duplicates
          // 5. Show progress and results
          
        } catch (error) {
          console.error('Import error:', error);
          alert('Import failed. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleMergeDuplicates = () => {
    // Simple duplicate detection based on email and name similarity
    const potentialDuplicates = [];
    
    for (let i = 0; i < customers.length; i++) {
      for (let j = i + 1; j < customers.length; j++) {
        const customer1 = customers[i];
        const customer2 = customers[j];
        
        // Check for exact email match or similar names
        const emailMatch = customer1.email && customer2.email && 
                          customer1.email.toLowerCase() === customer2.email.toLowerCase();
        
        const nameMatch = customer1.name.toLowerCase() === customer2.name.toLowerCase();
        
        if (emailMatch || nameMatch) {
          potentialDuplicates.push([customer1, customer2]);
        }
      }
    }
    
    if (potentialDuplicates.length === 0) {
      alert('No potential duplicates found.');
    } else {
      alert(`Found ${potentialDuplicates.length} potential duplicate pairs. 
      
Full merge functionality would allow you to:
- Review each duplicate pair
- Choose which customer to keep as primary
- Merge contact information and history
- Delete or archive the duplicate

This is a placeholder implementation.`);
      console.log('Potential duplicates:', potentialDuplicates);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and accounts
            </p>
          </div>
          <Button className="shadow-elegant" onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
        <div className="text-center py-12">
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and accounts
            </p>
          </div>
          <Button className="shadow-elegant" onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <div className="text-red-500">Error loading customers: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer information and accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportCustomers}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="shadow-elegant" onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleMergeDuplicates}>
              <Users className="w-4 h-4 mr-2" />
              Merge Duplicates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="shadow-card hover:shadow-elegant transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium">Phone:</span> {customer.phone || 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Created:</span> {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Retailer:</span> {customer.retailer_id ? `Retailer ${customer.retailer_id.substring(0, 8)}` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/customers/${customer.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Customer
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Add your first customer to get started'
              }
            </p>
            <Button onClick={handleAddCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialog.open}
        onOpenChange={(open) => setCustomerDialog(prev => ({ ...prev, open }))}
        customer={customerDialog.customer}
        mode={customerDialog.mode}
      />

      {/* Delete Dialog */}
      <CustomerDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        customer={deleteDialog.customer}
      />
    </div>
  );
}