import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminCreateUser, useAdminUpdateUser } from '@/hooks/useAdmin';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location']),
  retailer_id: z.string().optional(),
  location_id: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

export function UserFormDialog({ open, onOpenChange, user, mode }: UserFormDialogProps) {
  const { toast } = useToast();
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'retailer',
      retailer_id: user?.retailer_id || '',
      location_id: user?.location_id || '',
    },
  });

  const onSubmit = (data: UserFormValues) => {
    if (mode === 'create') {
      createUser.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'User created successfully',
            description: `User ${data.name} has been created.`,
          });
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: 'Error creating user',
            description: error.message || 'An error occurred while creating the user.',
            variant: 'destructive',
          });
        },
      });
    } else {
      updateUser.mutate({ 
        id: user!.id, 
        userData: data 
      }, {
        onSuccess: () => {
          toast({
            title: 'User updated successfully',
            description: `User ${data.name} has been updated.`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Error updating user',
            description: error.message || 'An error occurred while updating the user.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="backoffice">Back Office</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retailer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retailer ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter retailer ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUser.isPending || updateUser.isPending}
              >
                {createUser.isPending || updateUser.isPending
                  ? (mode === 'create' ? 'Creating...' : 'Updating...')
                  : (mode === 'create' ? 'Create User' : 'Update User')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}