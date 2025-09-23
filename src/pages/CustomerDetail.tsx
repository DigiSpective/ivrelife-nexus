import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Upload, 
  FileText, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  User,
  ShoppingCart,
  File,
  Activity,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { useCustomer, useCustomerContacts, useCustomerAddresses, useCustomerDocuments, useCustomerActivity } from '@/hooks/useCustomers';
import { Customer, CustomerContact, CustomerAddress, CustomerDocument, CustomerActivity as CustomerActivityType } from '@/types';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog';
import { ContactDialog } from '@/components/customers/ContactDialog';
import { AddressDialog } from '@/components/customers/AddressDialog';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customerData, isLoading: isCustomerLoading } = useCustomer(id!);
  const { data: contactsData, isLoading: isContactsLoading } = useCustomerContacts(id!);
  const { data: addressesData, isLoading: isAddressesLoading } = useCustomerAddresses(id!);
  const { data: documentsData, isLoading: isDocumentsLoading } = useCustomerDocuments(id!);
  const { data: activityData, isLoading: isActivityLoading } = useCustomerActivity(id!);
  
  const customer = customerData?.data;
  const contacts = contactsData?.data || [];
  const addresses = addressesData?.data || [];
  const documents = documentsData?.data || [];
  const activities = activityData?.data || [];

  const [activeTab, setActiveTab] = useState('overview');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [contactDialog, setContactDialog] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    contact: null as CustomerContact | null
  });
  const [addressDialog, setAddressDialog] = useState({
    open: false,
    mode: 'create' as 'create' | 'edit',
    address: null as CustomerAddress | null
  });

  const handleEditCustomer = () => {
    setEditDialog(true);
  };

  const handleDeleteCustomer = () => {
    setDeleteDialog(true);
  };

  const handleDeleteSuccess = () => {
    navigate('/customers');
  };

  const handleUploadID = () => {
    // TODO: Implement ID upload functionality
    console.log('Upload ID functionality to be implemented');
  };

  const handleGenerateContract = () => {
    // TODO: Implement contract generation functionality
    console.log('Generate contract functionality to be implemented');
  };

  const handleAddContact = () => {
    setContactDialog({
      open: true,
      mode: 'create',
      contact: null
    });
  };

  const handleEditContact = (contact: CustomerContact) => {
    setContactDialog({
      open: true,
      mode: 'edit',
      contact
    });
  };

  const handleAddAddress = () => {
    setAddressDialog({
      open: true,
      mode: 'create',
      address: null
    });
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setAddressDialog({
      open: true,
      mode: 'edit',
      address
    });
  };

  if (isCustomerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/customers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Customer Details</h1>
        </div>
        <div className="text-center py-12">
          <p>Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/customers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Customer Not Found</h1>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Customer not found</h3>
            <p className="text-muted-foreground mb-4">
              The customer you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link to="/customers">Back to Customers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/customers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground">Customer ID: {customer.id.substring(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUploadID}>
            <Upload className="w-4 h-4 mr-2" />
            Upload ID
          </Button>
          <Button variant="outline" onClick={handleGenerateContract}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Contract
          </Button>
          <Button onClick={handleEditCustomer}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Customer
          </Button>
          <Button variant="destructive" onClick={handleDeleteCustomer}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Created: {new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Primary Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.default_address ? (
              <div className="space-y-1">
                <p>{customer.default_address.street}</p>
                <p>{customer.default_address.city}, {customer.default_address.state} {customer.default_address.zip}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No address provided</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>{documents.length} documents</span>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-6">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </div>
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            <div className="flex items-center gap-2">
              <File className="w-4 h-4" />
              Documents
            </div>
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contacts */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contacts
                  </span>
                  <Button variant="outline" size="sm" onClick={handleAddContact}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.value}</p>
                          <p className="text-sm text-muted-foreground">
                            {contact.type} {contact.label && `(${contact.label})`}
                          </p>
                        </div>
                        <Badge variant={contact.verified ? 'default' : 'secondary'}>
                          {contact.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No contacts added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Addresses
                  </span>
                  <Button variant="outline" size="sm" onClick={handleAddAddress}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{address.label || 'Address'}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.address.street}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.address.city}, {address.address.state} {address.address.zip}
                          </p>
                        </div>
                        {address.primary && (
                          <Badge>Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No addresses added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes
                  </span>
                  <Button variant="outline" size="sm" onClick={handleEditCustomer}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.notes ? (
                  <p>{customer.notes}</p>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No notes added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No orders found for this customer
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <Card key={doc.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <File className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.purpose}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-card md:col-span-2 lg:col-span-3">
                <CardContent className="p-12 text-center">
                  <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No documents</h3>
                  <p className="text-muted-foreground mb-4">
                    No documents have been uploaded for this customer
                  </p>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                        {activity.payload && (
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(activity.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded for this customer
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Customer Dialog */}
      <CustomerDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        customer={customer}
        mode="edit"
      />

      {/* Delete Customer Dialog */}
      <CustomerDeleteDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        customer={customer}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {/* Contact Dialog */}
      <ContactDialog
        open={contactDialog.open}
        onOpenChange={(open) => setContactDialog(prev => ({ ...prev, open }))}
        customerId={id!}
        contact={contactDialog.contact}
        mode={contactDialog.mode}
      />

      {/* Address Dialog */}
      <AddressDialog
        open={addressDialog.open}
        onOpenChange={(open) => setAddressDialog(prev => ({ ...prev, open }))}
        customerId={id!}
        address={addressDialog.address}
        mode={addressDialog.mode}
      />
    </div>
  );
}