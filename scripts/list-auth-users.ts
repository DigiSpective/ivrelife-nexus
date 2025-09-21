#!/usr/bin/env -S npx tsx

/**
 * List Auth Users Script
 * 
 * This script lists all users in the auth system.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Listing auth users...\n');

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

async function listAuthUsers() {
  try {
    console.log('Listing auth users...\n');
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email, created_at');
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError.message);
      return;
    }
    
    console.log(`Found ${authUsers?.length || 0} auth users:`);
    
    if (authUsers && authUsers.length > 0) {
      for (const user of authUsers) {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      }
    } else {
      console.log('  No auth users found');
    }
    
    console.log('\n'); // Empty line for readability
    
    // Also list public users
    console.log('Listing public users...\n');
    
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, role, retailer_id, location_id');
    
    if (publicError) {
      console.error('❌ Error listing public users:', publicError.message);
      return;
    }
    
    console.log(`Found ${publicUsers?.length || 0} public users:`);
    
    if (publicUsers && publicUsers.length > 0) {
      for (const user of publicUsers) {
        console.log(`  - ${user.email} (ID: ${user.id}, Role: ${user.role})`);
        if (user.retailer_id) {
          console.log(`      Retailer ID: ${user.retailer_id}`);
        }
        if (user.location_id) {
          console.log(`      Location ID: ${user.location_id}`);
        }
      }
    } else {
      console.log('  No public users found');
    }
  } catch (err) {
    console.error('❌ Unexpected error listing users:', err);
  }
}

async function main() {
  console.log('🚀 Listing auth and public users...\n');
  
  await listAuthUsers();
  
  console.log('\n📋 User listing completed!');
}

// Run the script
main().catch(console.error);