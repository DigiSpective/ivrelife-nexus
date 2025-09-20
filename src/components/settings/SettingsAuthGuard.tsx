import React from 'react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

interface SettingsAuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'backoffice' | 'retailer' | 'location';
}

export function SettingsAuthGuard({ children, requiredRole }: SettingsAuthGuardProps) {
  const { data: currentUser, loading } = useCurrentUser();
  const navigate = useNavigate();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If no user, redirect to login
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  // Check role requirements
  if (requiredRole) {
    const hasAccess = hasRoleAccess(currentUser, requiredRole);
  
    if (!hasAccess) {
      // Redirect to dashboard or show unauthorized message
      navigate('/dashboard');
      return null;
    }
  }
  
  return <>{children}</>;
}

function hasRoleAccess(user: User, requiredRole: 'owner' | 'backoffice' | 'retailer' | 'location'): boolean {
  // Define role hierarchy
  const roleHierarchy: Record<string, string[]> = {
    'owner': ['owner', 'backoffice', 'retailer', 'location'],
    'backoffice': ['backoffice', 'retailer', 'location'],
    'retailer': ['retailer', 'location'],
    'location': ['location']
  };
  
  // Check if user's role is in the allowed roles for the required role
  return roleHierarchy[user.role]?.includes(requiredRole) || false;
}