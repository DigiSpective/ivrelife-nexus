import React, { useState, useEffect } from 'react';
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
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getRetailerById } from '@/lib/supabase';
import { Retailer } from '@/types';

const retailerSchema = z.object({
  name: z.string().min(1, 'Retailer name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  contract: z.instanceof(File).optional()
});

type RetailerForm = z.infer<typeof retailerSchema>;

export default function EditRetailer() {
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contractFile, setContractFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<RetailerForm>({
    resolver: zodResolver(retailerSchema)
  });

  useEffect(() => {
    if (id) {
      fetchRetailer();
    }
  }, [id]);

  const fetchRetailer = async () => {
    setLoading(true);
    try {
      const { data, error } = await getRetailerById(id!);
      if (error) {
        console.error('Error fetching retailer:', error);
        toast({
          title: "Error",
          description: "Failed to load retailer details",
          variant: "destructive"
        });
      } else if (data) {
        setRetailer(data);
        // Populate form with retailer data
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          status: data.status || 'active'
        });
      }
    } catch (err) {
      console.error('Error fetching retailer:', err);
      toast({
        title: "Error",
        description: "Failed to load retailer details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContractFile(file);
      setValue('contract', file);
    }
  };

  const onSubmit = async (data: RetailerForm) => {
    setIsSubmitting(true);
    try {
      // Mock retailer update - replace with actual API call to Supabase
      console.log('Updating retailer:', data);
      
      // If we have a contract file, upload it
      if (contractFile) {
        console.log('Uploading contract:', contractFile.name);
        // TODO: Implement contract upload to Supabase Storage
      }
      
      toast({
        title: "Retailer updated successfully!",
        description: `Retailer ${data.name} has been updated.`
      });
      
      // Redirect to retailer detail page
      navigate(`/retailers/${id}`);
    } catch (error) {
      toast({
        title: "Error updating retailer",
        description: "There was a problem updating the retailer. Please try again.",
        variant: "destructive"
      });
      console.error('Error updating retailer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/retailers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Retailers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Retailer</h1>
            <p className="text-muted-foreground mt-1">
              Loading retailer information...
            </p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p>Loading retailer details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/retailers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Retailers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Retailer Not Found</h1>
            <p className="text-muted-foreground mt-1">
              The requested retailer could not be found.
            </p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Retailer not found</h3>
            <p className="text-muted-foreground mb-4">
              The retailer you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/retailers')}>
              Back to Retailers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/retailers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Retailer
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Retailer</h1>
          <p className="text-muted-foreground mt-1">
            Update retailer information
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
                  value={retailer.status || 'active'} 
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
                {errors.contract && (
                  <p className="text-sm text-red-500 mt-1">{errors.contract.message}</p>
                )}
                {retailer.contract_url && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current contract: <Button variant="link" className="p-0 h-auto" onClick={() => window.open(retailer.contract_url!, '_blank')}>
                      View Contract
                    </Button>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={() => navigate(`/retailers/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Retailer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}