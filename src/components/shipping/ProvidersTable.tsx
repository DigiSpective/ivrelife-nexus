import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  useShippingProviders, 
  useCreateShippingProvider, 
  useUpdateShippingProvider, 
  useDeleteShippingProvider 
} from '@/hooks/useShipping';
import { ShippingProvider } from '@/types';

export function ProvidersTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    apiIdentifier: '',
  });
  
  const { toast } = useToast();
  const { data: providers, isLoading } = useShippingProviders();
  const { mutate: createProvider, isPending: isCreating } = useCreateShippingProvider();
  const { mutate: updateProvider, isPending: isUpdating } = useUpdateShippingProvider();
  const { mutate: deleteProvider, isPending: isDeleting } = useDeleteShippingProvider();
  
  const handleOpenModal = (provider?: ShippingProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        apiIdentifier: provider.api_identifier || '',
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        apiIdentifier: '',
      });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    if (editingProvider) {
      // Update existing provider
      updateProvider(
        { 
          id: editingProvider.id, 
          provider: { 
            name: formData.name,
            api_identifier: formData.apiIdentifier,
          } 
        },
        {
          onSuccess: () => {
            toast({
              title: 'Provider Updated',
              description: 'Shipping provider has been successfully updated.',
            });
            handleCloseModal();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to update shipping provider. Please try again.',
              variant: 'destructive',
            });
          }
        }
      );
    } else {
      // Create new provider
      createProvider(
        {
          name: formData.name,
          api_identifier: formData.apiIdentifier,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Provider Created',
              description: 'Shipping provider has been successfully created.',
            });
            handleCloseModal();
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: 'Failed to create shipping provider. Please try again.',
              variant: 'destructive',
            });
          }
        }
      );
    }
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this shipping provider?')) {
      deleteProvider(id, {
        onSuccess: () => {
          toast({
            title: 'Provider Deleted',
            description: 'Shipping provider has been successfully deleted.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: 'Failed to delete shipping provider. Please try again.',
            variant: 'destructive',
          });
        }
      });
    }
  };
  
  if (isLoading) {
    return <div>Loading providers...</div>;
  }
  
  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shipping Providers</CardTitle>
            <Button onClick={() => handleOpenModal()}>Add Provider</Button>
          </div>
        </CardHeader>
        <CardContent>
          {providers?.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shipping providers configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Identifier</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers?.data?.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.api_identifier || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(provider.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenModal(provider)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(provider.id)}
                          disabled={isDeleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit Provider' : 'Add Provider'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter provider name"
              />
            </div>
            
            <div>
              <Label htmlFor="apiIdentifier">API Identifier</Label>
              <Input
                id="apiIdentifier"
                value={formData.apiIdentifier}
                onChange={(e) => handleChange('apiIdentifier', e.target.value)}
                placeholder="Enter API identifier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isCreating || isUpdating || !formData.name}
            >
              {editingProvider ? (isUpdating ? 'Updating...' : 'Update') : (isCreating ? 'Creating...' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}