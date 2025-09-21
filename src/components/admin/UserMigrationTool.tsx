import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database, UserPlus, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserMigration, EXISTING_USERS } from '@/lib/user-migration';
import { User } from '@/types';

const migrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['owner', 'backoffice', 'retailer', 'location_user']),
  retailerId: z.string().optional(),
  locationId: z.string().optional()
});

type MigrationFormData = z.infer<typeof migrationSchema>;

interface MigrationResult {
  email: string;
  success: boolean;
  error?: string;
  user?: User;
}

export const UserMigrationTool: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset 
  } = useForm<MigrationFormData>({
    resolver: zodResolver(migrationSchema)
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: MigrationFormData) => {
    setIsLoading(true);
    
    try {
      const result = await UserMigration.createUserManually(
        data.email,
        data.name,
        data.role,
        data.retailerId,
        data.locationId
      );

      const migrationResult: MigrationResult = {
        email: data.email,
        success: result.success,
        error: result.error,
        user: result.user
      };

      setResults(prev => [migrationResult, ...prev]);
      
      if (result.success) {
        reset();
      }
    } catch (err) {
      const migrationResult: MigrationResult = {
        email: data.email,
        success: false,
        error: 'An unexpected error occurred'
      };
      setResults(prev => [migrationResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateKnownUsers = async () => {
    setIsLoading(true);
    
    const knownUsers = Object.entries(EXISTING_USERS);
    const migrationResults: MigrationResult[] = [];

    for (const [email, userInfo] of knownUsers) {
      try {
        const result = await UserMigration.createUserManually(
          email,
          userInfo.name,
          userInfo.role
        );

        migrationResults.push({
          email,
          success: result.success,
          error: result.error,
          user: result.user
        });
      } catch (err) {
        migrationResults.push({
          email,
          success: false,
          error: 'Migration failed'
        });
      }
    }

    setResults(prev => [...migrationResults, ...prev]);
    setIsLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'backoffice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'retailer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'location_user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            User Migration Tool
          </CardTitle>
          <CardDescription>
            Migrate existing Supabase Auth users to the application's user management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This tool creates user records for existing Supabase Auth users. 
              It should only be used during initial setup or migration. Make sure you have the correct 
              email addresses that already exist in Supabase Authentication.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Migration Form */}
            <div>
              <h3 className="text-lg font-medium mb-4">Manual User Migration</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@iv-relife.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="System Administrator"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    onValueChange={(value) => setValue('role', value as any)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="backoffice">Back Office</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="location_user">Location User</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>

                {(watchedRole === 'retailer' || watchedRole === 'location_user') && (
                  <div className="space-y-4">
                    {watchedRole === 'retailer' && (
                      <div className="space-y-2">
                        <Label htmlFor="retailerId">Retailer ID (Optional)</Label>
                        <Input
                          id="retailerId"
                          placeholder="ret-123456"
                          {...register('retailerId')}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    
                    {watchedRole === 'location_user' && (
                      <div className="space-y-2">
                        <Label htmlFor="locationId">Location ID (Optional)</Label>
                        <Input
                          id="locationId"
                          placeholder="loc-123456"
                          {...register('locationId')}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Migrate User
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Known Users Migration */}
            <div>
              <h3 className="text-lg font-medium mb-4">Known Users Migration</h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Migrate all known users based on predefined configurations:
                </p>
                
                <div className="space-y-2">
                  {Object.entries(EXISTING_USERS).map(([email, userInfo]) => (
                    <div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium text-sm">{email}</p>
                        <p className="text-xs text-muted-foreground">{userInfo.name}</p>
                      </div>
                      <Badge className={getRoleBadgeColor(userInfo.role)}>
                        {userInfo.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={migrateKnownUsers} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrating Known Users...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Migrate All Known Users
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
            <CardDescription>
              Results of user migration operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.email}</p>
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                      {result.user && (
                        <p className="text-sm text-muted-foreground">
                          Created as {result.user.role}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};