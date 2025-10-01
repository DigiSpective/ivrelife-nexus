import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsers, useAdminCreateUser, useAdminUpdateUser, useAdminDeleteUser } from '@/hooks/useAdmin';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Crown,
  Settings,
  Activity,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Key,
  Download,
  Upload,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'employee' | 'viewer' | 'customer';
  retailer_id?: string;
  location_id?: string;
  avatar?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
  two_factor_enabled: boolean;
  login_attempts: number;
  account_locked: boolean;
  department?: string;
  salary?: number;
  hire_date?: string;
  manager_id?: string;
}

// Mock extended user data
const mockExtendedUsers: ExtendedUser[] = [
  {
    id: 'usr-1',
    email: 'admin@ivrelife.com',
    name: 'Sarah Chen',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    phone: '+1-555-0101',
    address: {
      street: '123 Admin Way',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102'
    },
    is_active: true,
    last_login: '2024-03-20T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-03-20T10:30:00Z',
    permissions: ['all'],
    two_factor_enabled: true,
    login_attempts: 0,
    account_locked: false,
    department: 'Executive',
    salary: 150000,
    hire_date: '2024-01-01'
  },
  {
    id: 'usr-2',
    email: 'manager@ivrelife.com',
    name: 'Mike Rodriguez',
    role: 'manager',
    phone: '+1-555-0102',
    address: {
      street: '456 Manager St',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301'
    },
    is_active: true,
    last_login: '2024-03-19T16:45:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-03-19T16:45:00Z',
    permissions: ['orders.manage', 'customers.manage', 'products.view'],
    two_factor_enabled: false,
    login_attempts: 0,
    account_locked: false,
    department: 'Operations',
    salary: 80000,
    hire_date: '2024-01-15',
    manager_id: 'usr-1'
  },
  {
    id: 'usr-3',
    email: 'employee@ivrelife.com',
    name: 'Lisa Wang',
    role: 'employee',
    phone: '+1-555-0103',
    is_active: true,
    last_login: '2024-03-20T09:15:00Z',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-20T09:15:00Z',
    permissions: ['orders.view', 'customers.view'],
    two_factor_enabled: false,
    login_attempts: 2,
    account_locked: false,
    department: 'Sales',
    salary: 55000,
    hire_date: '2024-02-01',
    manager_id: 'usr-2'
  },
  {
    id: 'usr-4',
    email: 'locked@ivrelife.com',
    name: 'John Doe',
    role: 'employee',
    is_active: false,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
    permissions: ['orders.view'],
    two_factor_enabled: false,
    login_attempts: 5,
    account_locked: true,
    department: 'Customer Service'
  }
];

export default function UsersAdmin() {
  // Fetch users from database
  const { data: usersData, isLoading, error } = useAdminUsers();
  const { mutate: createUserMutation } = useAdminCreateUser();
  const { mutate: updateUserMutation } = useAdminUpdateUser();
  const { mutate: deleteUserMutation } = useAdminDeleteUser();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 UsersAdmin - Raw usersData:', usersData);
    console.log('🔍 UsersAdmin - isLoading:', isLoading);
    console.log('🔍 UsersAdmin - error:', error);
    console.log('🔍 UsersAdmin - users count:', usersData?.data?.length || 0);
  }, [usersData, isLoading, error]);

  const users = usersData?.data || [];

  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const roles = ['owner', 'admin', 'manager', 'employee', 'viewer', 'customer'];
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active && !user.account_locked) ||
                         (statusFilter === 'inactive' && !user.is_active) ||
                         (statusFilter === 'locked' && user.account_locked);
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const getUserStatus = (user: ExtendedUser) => {
    if (user.account_locked) return { status: 'locked', color: 'destructive', text: 'Locked' };
    if (!user.is_active) return { status: 'inactive', color: 'secondary', text: 'Inactive' };
    return { status: 'active', color: 'default', text: 'Active' };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'manager':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleEditUser = (user: ExtendedUser) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    const newUser: ExtendedUser = {
      id: `usr-${Date.now()}`,
      email: '',
      name: '',
      role: 'employee',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      permissions: [],
      two_factor_enabled: false,
      login_attempts: 0,
      account_locked: false
    };
    setEditingUser(newUser);
    setIsCreateDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    if (isCreateDialogOpen) {
      createUserMutation(editingUser, {
        onSuccess: () => {
          toast({
            title: "User Created",
            description: `${editingUser.name} has been created successfully.`,
          });
          setIsCreateDialogOpen(false);
          setEditingUser(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to create user: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    } else {
      updateUserMutation({ id: editingUser.id, userData: editingUser }, {
        onSuccess: () => {
          toast({
            title: "User Updated",
            description: `${editingUser.name} has been updated successfully.`,
          });
          setIsEditDialogOpen(false);
          setEditingUser(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to update user: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation(userId, {
        onSuccess: () => {
          toast({
            title: "User Deleted",
            description: `${user.name} has been deleted.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to delete user: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.is_active;
    updateUserMutation(
      { id: userId, userData: { is_active: newStatus } },
      {
        onSuccess: () => {
          toast({
            title: newStatus ? "User Activated" : "User Deactivated",
            description: `${user.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to update user status: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleUnlockUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    updateUserMutation(
      { id: userId, userData: { account_locked: false, login_attempts: 0 } },
      {
        onSuccess: () => {
          toast({
            title: "User Unlocked",
            description: `${user.name}'s account has been unlocked.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to unlock user: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    // Perform bulk update for each selected user
    const userIds = Array.from(selectedUsers);
    let updateData: any = {};

    switch (action) {
      case 'activate':
        updateData = { is_active: true };
        break;
      case 'deactivate':
        updateData = { is_active: false };
        break;
      case 'unlock':
        updateData = { account_locked: false, login_attempts: 0 };
        break;
    }

    // Update each user
    Promise.all(
      userIds.map(userId =>
        new Promise((resolve, reject) => {
          updateUserMutation(
            { id: userId, userData: updateData },
            {
              onSuccess: () => resolve(true),
              onError: (error) => reject(error)
            }
          );
        })
      )
    )
      .then(() => {
        const actionText =
          action === 'activate'
            ? 'activated'
            : action === 'deactivate'
            ? 'deactivated'
            : 'unlocked';

        toast({
          title: `Users ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          description: `${selectedUsers.size} users have been ${actionText}.`,
        });
        setSelectedUsers(new Set());
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: `Failed to update some users: ${error.message}`,
          variant: "destructive",
        });
      });
  };

  const updateEditingUser = (updates: Partial<ExtendedUser>) => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, ...updates, updated_at: new Date().toISOString() });
  };

  const calculateStats = () => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active && !u.account_locked).length,
      lockedUsers: users.filter(u => u.account_locked).length,
      adminUsers: users.filter(u => ['owner', 'admin'].includes(u.role)).length,
      recentLogins: users.filter(u => u.last_login && 
        new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
    };
  };

  const stats = calculateStats();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-lg font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Users
          </Button>
          <Button onClick={handleCreateUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locked Accounts</p>
                <p className="text-2xl font-bold text-red-600">{stats.lockedUsers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">{stats.adminUsers}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Logins</p>
                <p className="text-2xl font-bold">{stats.recentLogins}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  <UserMinus className="w-4 h-4 mr-1" />
                  Deactivate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('unlock')}>
                  <Key className="w-4 h-4 mr-1" />
                  Unlock
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedUsers(new Set())}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const status = getUserStatus(user);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedUsers);
                          if (e.target.checked) {
                            newSelected.add(user.id);
                          } else {
                            newSelected.delete(user.id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">{user.department || 'Not assigned'}</span>
                      {user.salary && (
                        <div className="text-sm text-muted-foreground">
                          ${user.salary.toLocaleString()}/year
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={status.color as any}>
                        {status.text}
                      </Badge>
                      {user.login_attempts > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          {user.login_attempts} failed login{user.login_attempts !== 1 ? 's' : ''}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {user.last_login ? (
                        <div>
                          <div className="text-sm">
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.last_login).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={user.two_factor_enabled ? "default" : "outline"}>
                        {user.two_factor_enabled ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Enabled
                          </>
                        ) : (
                          'Disabled'
                        )}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {user.account_locked ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnlockUser(user.id)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id)}
                          >
                            {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                        
                        {user.role !== 'owner' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create User Dialog */}
      <Dialog open={isEditDialogOpen || isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setIsCreateDialogOpen(false);
          setEditingUser(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Create New User' : `Edit User: ${editingUser?.name}`}
            </DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editingUser.name}
                    onChange={(e) => updateEditingUser({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => updateEditingUser({ email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => updateEditingUser({ phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editingUser.department || ''}
                    onChange={(e) => updateEditingUser({ department: e.target.value })}
                  />
                </div>
              </div>

              {/* Role and Permissions */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Role & Permissions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={(value) => updateEditingUser({ 
                        role: value as ExtendedUser['role']
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingUser.is_active}
                          onCheckedChange={(checked) => updateEditingUser({ is_active: checked })}
                        />
                        <Label>Active Account</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingUser.two_factor_enabled}
                          onCheckedChange={(checked) => updateEditingUser({ two_factor_enabled: checked })}
                        />
                        <Label>Two-Factor Authentication</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              {editingUser.role !== 'customer' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Employment Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="salary">Annual Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={editingUser.salary || ''}
                          onChange={(e) => updateEditingUser({ 
                            salary: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hire-date">Hire Date</Label>
                        <Input
                          id="hire-date"
                          type="date"
                          value={editingUser.hire_date || ''}
                          onChange={(e) => updateEditingUser({ hire_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="manager">Manager</Label>
                        <Select 
                          value={editingUser.manager_id || ''} 
                          onValueChange={(value) => updateEditingUser({ 
                            manager_id: value || undefined 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Manager</SelectItem>
                            {users.filter(u => u.id !== editingUser.id && ['owner', 'admin', 'manager'].includes(u.role)).map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsCreateDialogOpen(false);
                  setEditingUser(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  {isCreateDialogOpen ? 'Create User' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}