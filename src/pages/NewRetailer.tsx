import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Building2,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRetailers } from '@/hooks/useRetailers';
import { useOutbox } from '@/hooks/useOutbox';
import { useAuditLogger } from '@/hooks/useAuditLogger';

const retailerSchema = z.object({
  name: z.string().min(1, 'Retailer name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

type RetailerForm = z.infer<typeof retailerSchema>;

export default function NewRetailer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createRetailer } = useRetailers();
  const { createOutboxEvent } = useOutbox();
  const { logAction } = useAuditLogger();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<RetailerForm>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      status: 'active'
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContractFile(file);
    }
  };

  const onSubmit = async (data: RetailerForm) => {
    setIsSubmitting(true);
    try {
      // Create retailer
      const newRetailer = await createRetailer({
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status
      });

      if (newRetailer) {
        // Log audit action
        await logAction('retailer_created', 'retailer', newRetailer.id, {
          name: data.name,
          email: data.email
        });

        // Create outbox event for invitation
        await createOutboxEvent('retailer_invitation', 'retailer', newRetailer.id, {
          retailer: {
            id: newRetailer.id,
            name: data.name,
            email: data.email
          }
        });

        toast({
          title: "Retailer created successfully!",
          description: `Retailer ${data.name} has been created and invitation sent.`
        });

        // Redirect to retailers list
        navigate('/retailers');
      }
    } catch (error) {
      toast({
        title: "Error creating retailer",
        description: "There was a problem creating the retailer. Please try again.",
        variant: "destructive"
      });
      console.error('Error creating retailer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/retailers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Retailers
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Retailer</h1>
          <p className="text-muted-foreground mt-1">
            Add a new retailer to the system
          </p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Retailer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Retailer Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter retailer name"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  defaultValue="active" 
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="contract">Contract (Optional)</Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="contract"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={() => navigate('/retailers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Retailer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}