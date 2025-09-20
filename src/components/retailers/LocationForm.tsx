import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin,
  Phone
} from 'lucide-react';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  phone: z.string().optional()
});

type LocationForm = z.infer<typeof locationSchema>;

interface LocationFormProps {
  retailerId: string;
  onSubmit: (data: LocationForm) => void;
  onCancel: () => void;
  initialData?: LocationForm;
}

export default function LocationForm({ retailerId, onSubmit, onCancel, initialData }: LocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialData
  });

  const handleFormSubmit = async (data: LocationForm) => {
    setIsSubmitting(true);
    try {
      onSubmit(data);
    } catch (error) {
      console.error('Error submitting location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {initialData ? 'Edit Location' : 'Add New Location'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter location name"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter full address"
              rows={3}
              className="mt-1"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
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

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}