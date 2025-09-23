import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeleteCustomer } from '@/hooks/useCustomers';
import { Customer } from '@/types';
import { Loader2, Trash2 } from 'lucide-react';

interface CustomerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onDeleteSuccess?: () => void;
}

export function CustomerDeleteDialog({ open, onOpenChange, customer, onDeleteSuccess }: CustomerDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const deleteCustomerMutation = useDeleteCustomer();

  const handleDelete = async () => {
    if (!customer) return;

    setIsDeleting(true);

    try {
      await deleteCustomerMutation.mutateAsync(customer.id);
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
      onOpenChange(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete Customer
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{customer?.name}</strong>?
            <br /><br />
            This action cannot be undone. This will permanently delete the customer
            and all associated data including contacts, addresses, documents, and activity history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Customer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}