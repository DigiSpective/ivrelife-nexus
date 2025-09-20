import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin,
  Edit,
  Trash2
} from 'lucide-react';
import { Location } from '@/types';

interface LocationListProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}

export default function LocationList({ locations, onEdit, onDelete }: LocationListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location) => (
        <Card key={location.id} className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {location.name}
                </h3>
                {location.address && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {typeof location.address === 'string' 
                      ? location.address 
                      : `${location.address?.street}, ${location.address?.city}`}
                  </p>
                )}
                {location.phone && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {location.phone}
                  </p>
                )}
                <div className="mt-3">
                  <Badge variant="outline">
                    Added {new Date(location.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(location)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(location.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {locations.length === 0 && (
        <Card className="shadow-card col-span-full">
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No locations found</h3>
            <p className="text-muted-foreground mb-4">
              This retailer doesn't have any locations yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}