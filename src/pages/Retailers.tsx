import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Building2,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Retailers() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with real data from Supabase
  const retailers = [
    {
      id: 'ret-1',
      name: 'TechHub Electronics',
      contact_email: 'contact@techhub.com',
      phone: '(555) 123-4567',
      address: '123 Tech Street, Silicon Valley, CA 94105',
      locations: 2,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'ret-2',
      name: 'GadgetZone',
      contact_email: 'info@gadgetzone.com',
      phone: '(555) 987-6543',
      address: '456 Innovation Ave, Austin, TX 78701',
      locations: 1,
      created_at: '2024-02-01T14:15:00Z'
    }
  ];

  const filteredRetailers = retailers.filter(retailer => 
    retailer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Retailers</h1>
          <p className="text-muted-foreground mt-1">
            Manage retailer accounts and locations
          </p>
        </div>
        <Button className="shadow-elegant">
          <Plus className="w-4 h-4 mr-2" />
          Add Retailer
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search retailers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Retailers List */}
      <div className="space-y-4">
        {filteredRetailers.map((retailer) => (
          <Card key={retailer.id} className="shadow-card hover:shadow-elegant transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {retailer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {retailer.contact_email} • {retailer.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-medium">Address:</span> {retailer.address}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Locations:</span> 
                      <Badge variant="outline" className="ml-2">
                        {retailer.locations} {retailer.locations === 1 ? 'Location' : 'Locations'}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Created:</span> {new Date(retailer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRetailers.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No retailers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Add your first retailer to get started'
              }
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Retailer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}