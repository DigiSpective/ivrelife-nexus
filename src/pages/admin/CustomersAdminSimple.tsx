import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Plus, Edit, Mail, Phone, Trash2, Loader2 } from 'lucide-react';
import { useAdminCustomers, useAdminDeleteCustomer } from '@/hooks/useAdmin';
import { CustomerFormDialog } from '@/components/admin/CustomerFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function CustomersAdminSimple() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { toast } = useToast();
  const { data: customersData, isLoading, error } = useAdminCustomers();
  const deleteCustomer = useAdminDeleteCustomer();

  const customers = customersData?.data || [];

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setCustomerFormMode('create');
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerFormMode('edit');
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer.mutate(customerToDelete.id, {
        onSuccess: () => {
          toast({
            title: 'Customer deleted successfully',
            description: `Customer ${customerToDelete.name} has been deleted.`,
          });
          setShowDeleteDialog(false);
          setCustomerToDelete(null);
        },
        onError: (error) => {
          toast({
            title: 'Error deleting customer',
            description: error.message || 'An error occurred while deleting the customer.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <p className="text-destructive">Error loading customers: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and data
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin inline" />
            ) : (
              `(${filteredCustomers.length})`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(customer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteCustomer(customer)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerFormDialog
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        customer={selectedCustomer}
        mode={customerFormMode}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Customer"
        description={`Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}