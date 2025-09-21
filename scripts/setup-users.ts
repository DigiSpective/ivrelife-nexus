#!/usr/bin/env -S npx tsx

/**
 * User Setup Script
 * 
 * This script creates the required users in Supabase.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Setting up required users...\n');

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

// User accounts to create
const users = [
  {
    email: 'admin@iv-relife.com',
    password: 'AdminPass123!',
    role: 'owner'
  },
  {
    email: 'retailer@iv-relife.com',
    password: 'RetailerPass123!',
    role: 'retailer'
  }
];

async function createUsers() {
  console.log('Creating users...\n');
  
  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User ${user.email} already exists`);
        } else {
          console.error(`  ❌ Error creating ${user.email}:`, error.message);
          continue;
        }
      } else {
        console.log(`  ✅ User ${user.email} created successfully`);
      }
      
      // If the user was created or already exists, update their role
      if (data?.user?.id) {
        console.log(`  Updating role for ${user.email} to ${user.role}`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: user.role })
          .eq('id', data.user.id);
          
        if (updateError) {
          console.error(`  ❌ Error updating role for ${user.email}:`, updateError.message);
        } else {
          console.log(`  ✅ Role updated for ${user.email}`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error creating ${user.email}:`, err);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function main() {
  console.log('🚀 Starting user setup...\n');
  
  await createUsers();
  
  console.log('📋 User setup completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure you\'ve run complete-database-setup.sql in your Supabase SQL Editor');
  console.log('   2. Test logging in with the new users');
}

// Run the setup
main().catch(console.error);