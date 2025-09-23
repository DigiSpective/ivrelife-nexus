import { createSupabaseClient } from './supabase-client';
import { User } from '@/types';

// Migration utility to sync existing Supabase Auth users with the users table
export class UserMigration {
  
  /**
   * Creates a user record in the users table for an existing Supabase Auth user
   */
  static async createUserRecord(
    authUser: any, 
    role: User['role'] = 'owner',
    retailerId?: string,
    locationId?: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role,
        retailer_id: retailerId,
        location_id: locationId,
        created_at: new Date().toISOString()
      };

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create user record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, user: data };
    } catch (err) {
      console.error('User migration error:', err);
      return { success: false, error: 'Failed to create user record' };
    }
  }

  /**
   * Checks if a user record exists in the users table
   */
  static async checkUserExists(userId: string): Promise<{ exists: boolean; user?: User }> {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking user existence:', error);
        return { exists: false };
      }

      return { exists: !!data, user: data || undefined };
    } catch (err) {
      console.error('User check error:', err);
      return { exists: false };
    }
  }

  /**
   * Migrates an existing Supabase Auth user to the users table
   */
  static async migrateAuthUser(
    authUser: any,
    defaultRole: User['role'] = 'owner'
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // First check if user already exists
      const { exists, user } = await this.checkUserExists(authUser.id);
      
      if (exists && user) {
        return { success: true, user };
      }

      // Create new user record
      const result = await this.createUserRecord(authUser, defaultRole);
      
      if (result.success) {
        console.log('Successfully migrated user:', authUser.email);
      }

      return result;
    } catch (err) {
      console.error('Migration error:', err);
      return { success: false, error: 'Migration failed' };
    }
  }

  /**
   * Bulk migration for multiple existing users
   */
  static async migrateAllAuthUsers(): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
  }> {
    try {
      // Get all Supabase Auth users (this would require admin access)
      // For now, we'll return a placeholder since this requires server-side admin SDK
      console.log('Bulk migration requires server-side implementation with admin SDK');
      
      return {
        success: false,
        migrated: 0,
        errors: ['Bulk migration requires server-side admin SDK implementation']
      };
    } catch (err) {
      return {
        success: false,
        migrated: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error']
      };
    }
  }

  /**
   * Manual user creation for existing users
   */
  static async createUserManually(
    email: string,
    name: string,
    role: User['role'],
    retailerId?: string,
    locationId?: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // First, try to get the auth user by email (requires RPC or admin access)
      // For now, we'll create a user record with a generated ID
      const userData = {
        // Note: In production, you'd want to get the actual auth user ID
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        role,
        retailer_id: retailerId,
        location_id: locationId,
        created_at: new Date().toISOString()
      };

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create user manually:', error);
        return { success: false, error: error.message };
      }

      return { success: true, user: data };
    } catch (err) {
      console.error('Manual user creation error:', err);
      return { success: false, error: 'Failed to create user' };
    }
  }
}

// Predefined user roles for existing known users
export const EXISTING_USERS: Record<string, { role: User['role']; name: string }> = {
  'admin@iv-relife.com': {
    role: 'owner',
    name: 'System Administrator'
  },
  'admin@ivrelife.com': {
    role: 'owner', 
    name: 'System Administrator'
  },
  // Add more existing users here as needed
};