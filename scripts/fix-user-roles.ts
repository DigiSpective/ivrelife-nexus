#!/usr/bin/env -S npx tsx

/**
 * Fix User Roles Script
 * 
 * This script fixes user roles in the database to ensure proper RLS policies.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Fixing user roles...\n');

// Check if credentials are provided
if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User accounts to fix
const users = [
  {
    email: 'admin@iv-relife.com',
    role: 'owner'
  },
  {
    email: 'retailer@iv-relife.com',
    role: 'retailer'
  }
];

async function fixUserRoles() {
  console.log('Fixing user roles...\n');
  
  for (const user of users) {
    try {
      console.log(`Fixing role for user: ${user.email}`);
      
      // Get the user ID from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (authError) {
        console.error(`  ❌ Error finding auth user ${user.email}:`, authError.message);
        continue;
      }
      
      if (!authUsers) {
        console.log(`  ⚠️  User ${user.email} not found in auth.users`);
        continue;
      }
      
      // Update the user's role in the public.users table
      console.log(`  Updating role for ${user.email} to ${user.role}`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: user.role })
        .eq('id', authUsers.id);
        
      if (updateError) {
        console.error(`  ❌ Error updating role for ${user.email}:`, updateError.message);
      } else {
        console.log(`  ✅ Role updated for ${user.email}`);
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error fixing ${user.email}:`, err);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function main() {
  console.log('🚀 Starting user role fix...\n');
  
  await fixUserRoles();
  
  console.log('📋 User role fix completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run the fixed-database-setup.sql script in your Supabase SQL Editor');
  console.log('   2. Test the connection again with: npm run verify-supabase');
}

// Run the fix
main().catch(console.error);