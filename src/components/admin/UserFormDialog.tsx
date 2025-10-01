import React, { useState, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminCreateUser, useAdminUpdateUser } from '@/hooks/useAdmin';
import { useRetailers } from '@/hooks/useRetailers';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location']),
  retailer_id: z.string().optional(), // Only for location users
});

const editUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location']),
  retailer_id: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;
type UserFormValues = CreateUserFormValues | EditUserFormValues;

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

  // Get retailers for dropdown
  const { data: retailersData } = useRetailers();
  const retailers = retailersData?.data || [];

  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'location');

  const form = useForm<any>({
    resolver: zodResolver(mode === 'create' ? createUserSchema : editUserSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'location',
      retailer_id: user?.retailer_id || '',
    },
  });

  // Reset form when user changes (for edit mode)
  useEffect(() => {
    if (user && mode === 'edit') {
      console.log('📝 Resetting form with user data:', user);
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        retailer_id: user.retailer_id || '',
      });
      setSelectedRole(user.role);
    } else if (mode === 'create') {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'location',
        retailer_id: '',
      });
      setSelectedRole('location');
    }
  }, [user, mode, form]);

  // Watch role changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.role) {
        setSelectedRole(value.role);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: any) => {
    console.log('📋 Form submitted with data:', data);
    console.log('📋 Mode:', mode);

    // Auto-generate retailer_id and location_id based on role
    const userData: any = {
      ...data,
      retailer_id: null,
      location_id: null,
    };

    if (data.role === 'retailer') {
      // For retailer role, auto-generate a retailer_id (will be set by database trigger)
      userData.retailer_id = null; // Will be auto-generated
    } else if (data.role === 'location') {
      // For location role, use selected retailer_id and auto-generate location_id
      userData.retailer_id = data.retailer_id || null;
      userData.location_id = null; // Will be auto-generated
    }

    console.log('✅ Prepared userData:', userData);

    if (mode === 'create') {
      createUser.mutate(userData, {
        onSuccess: () => {
          toast({
            title: 'User created successfully',
            description: `User ${data.name} has been created and an invitation email has been sent to ${data.email}.`,
          });
          onOpenChange(false);
          form.reset();
        },
        onError: (error: any) => {
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
        userData
      }, {
        onSuccess: () => {
          toast({
            title: 'User updated successfully',
            description: `User ${data.name} has been updated.`,
          });
          onOpenChange(false);
        },
        onError: (error: any) => {
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
                  <FormDescription>
                    {field.value === 'retailer' && 'Retailer ID will be auto-generated'}
                    {field.value === 'location' && 'Location ID will be auto-generated'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password (min 8 characters)" {...field} />
                    </FormControl>
                    <FormDescription>
                      User will use this password to log in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedRole === 'location' && (
              <FormField
                control={form.control}
                name="retailer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Retailer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            retailers.length === 0
                              ? "No retailers available"
                              : "Select a retailer"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {retailers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No retailers found. Please create a retailer user first.
                          </div>
                        ) : (
                          retailers.map((retailer) => (
                            <SelectItem key={retailer.id} value={retailer.id}>
                              {retailer.name} ({retailer.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which retailer this location user belongs to
                      {retailers.length > 0 && ` (${retailers.length} available)`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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