#!/usr/bin/env -S npx tsx

/**
 * Create Retailer User Script
 * 
 * This script creates the retailer user in both auth and public tables.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Creating retailer user...\n');

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

async function createRetailerUser() {
  const retailerEmail = 'retailer@iv-relife.com';
  const retailerPassword = '123456789';
  const retailerRole = 'retailer';
  
  try {
    console.log(`Creating retailer user: ${retailerEmail}`);
    
    // Sign up the retailer user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: retailerEmail,
      password: retailerPassword
    });
    
    if (signUpError) {
      console.error(`❌ Error signing up retailer user:`, signUpError.message);
      return;
    }
    
    console.log(`✅ Retailer user signed up successfully`);
    console.log(`   User ID: ${signUpData.user?.id}`);
    
    // Create the public user record
    if (signUpData.user?.id) {
      console.log(`Creating public user record for retailer...`);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          email: retailerEmail,
          role: retailerRole
        });
        
      if (insertError) {
        console.error(`❌ Error creating public user record:`, insertError.message);
      } else {
        console.log(`✅ Public user record created successfully`);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error creating retailer user:', err);
  }
}

async function main() {
  console.log('🚀 Creating retailer user...\n');
  
  await createRetailerUser();
  
  console.log('\n📋 Retailer user creation completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run the verification script: npm run verify-supabase');
  console.log('   2. Test logging in with retailer@iv-relife.com');
}

// Run the script
main().catch(console.error);