#!/usr/bin/env -S npx tsx

/**
 * Ensure Public Users Script
 * 
 * This script ensures that auth users have corresponding records in the public.users table
 * with the correct roles.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Ensuring public users exist...\n');

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

// User accounts to ensure
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

async function ensurePublicUsers() {
  console.log('Ensuring public users exist...\n');
  
  for (const user of users) {
    try {
      console.log(`Ensuring user: ${user.email}`);
      
      // Get the user from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email);
      
      if (authError) {
        console.error(`  ❌ Error finding auth user ${user.email}:`, authError.message);
        continue;
      }
      
      if (!authUsers || authUsers.length === 0) {
        console.log(`  ⚠️  Auth user ${user.email} not found`);
        continue;
      }
      
      const authUserId = authUsers[0].id;
      console.log(`  Found auth user ID: ${authUserId}`);
      
      // Check if the user exists in public.users
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUserId);
      
      if (publicError) {
        console.error(`  ❌ Error checking public user ${user.email}:`, publicError.message);
        continue;
      }
      
      if (publicUsers && publicUsers.length > 0) {
        // User exists in public.users, update role if needed
        if (publicUsers[0].role !== user.role) {
          console.log(`  Updating role for ${user.email} from ${publicUsers[0].role} to ${user.role}`);
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: user.role })
            .eq('id', authUserId);
            
          if (updateError) {
            console.error(`  ❌ Error updating role for ${user.email}:`, updateError.message);
          } else {
            console.log(`  ✅ Role updated for ${user.email}`);
          }
        } else {
          console.log(`  ✅ User ${user.email} already exists in public.users with correct role: ${user.role}`);
        }
      } else {
        // User doesn't exist in public.users, create them
        console.log(`  Creating public user record for ${user.email} with role: ${user.role}`);
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            email: user.email,
            role: user.role
          });
          
        if (insertError) {
          console.error(`  ❌ Error creating public user for ${user.email}:`, insertError.message);
        } else {
          console.log(`  ✅ Public user created for ${user.email}`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error ensuring ${user.email}:`, err);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function main() {
  console.log('🚀 Ensuring public users exist...\n');
  
  await ensurePublicUsers();
  
  console.log('📋 Public users setup completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run the verification script again: npm run verify-supabase');
  console.log('   2. Test logging in through the application UI');
}

// Run the script
main().catch(console.error);