import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2,
  MapPin,
  Users,
  FileText,
  History,
  Edit,
  Plus,
  Phone,
  Mail
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getRetailerById, getLocationsByRetailer } from '@/lib/supabase';
import { Retailer, Location } from '@/types';

export default function RetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRetailerData();
    }
  }, [id]);

  const fetchRetailerData = async () => {
    setLoading(true);
    try {
      // Fetch retailer details
      const { data: retailerData, error: retailerError } = await getRetailerById(id!);
      if (retailerError) {
        console.error('Error fetching retailer:', retailerError);
      } else {
        setRetailer(retailerData);
      }

      // Fetch locations for this retailer
      const { data: locationsData, error: locationsError } = await getLocationsByRetailer(id!);
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      } else {
        setLocations(locationsData || []);
      }
    } catch (err) {
      console.error('Error fetching retailer data:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-foreground">Retailer Details</h1>
            <p className="text-muted-foreground mt-1">
              Loading retailer information...
            </p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p>Loading...</p>
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/retailers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              {retailer.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                {retailer.email}
              </div>
              {retailer.phone && (
                <div className="flex items-center text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  {retailer.phone}
                </div>
              )}
              <div className="flex items-center">
                <Badge variant={retailer.status === 'active' ? 'default' : retailer.status === 'inactive' ? 'secondary' : 'destructive'}>
                  {retailer.status || 'active'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/retailers/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Retailer
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Retailer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{retailer.email}</p>
                  </div>
                  {retailer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{retailer.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={retailer.status === 'active' ? 'default' : retailer.status === 'inactive' ? 'secondary' : 'destructive'}>
                      {retailer.status || 'active'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(retailer.created_at).toLocaleDateString()}</p>
                  </div>
                  {retailer.contract_url && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contract</p>
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.open(retailer.contract_url!, '_blank')}>
                        View Contract
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Locations</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
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
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
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
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Assigned Users</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">User management coming soon</h3>
                <p className="text-muted-foreground">
                  Assign users to this retailer and manage their roles and permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Contracts</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Contract
            </Button>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Contract management coming soon</h3>
                <p className="text-muted-foreground">
                  View and manage contracts associated with this retailer.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Audit trail coming soon</h3>
                <p className="text-muted-foreground">
                  View all actions and changes related to this retailer.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}