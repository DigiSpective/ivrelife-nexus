#!/usr/bin/env -S npx tsx

/**
 * Create Retailer User Script (Fixed)
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

console.log('🔍 Creating retailer user (fixed)...\n');

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
    
    // Wait a moment for the auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the user exists in auth.users
    console.log(`Verifying user exists in auth system...`);
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', signUpData.user?.id);
    
    if (authError) {
      console.error(`❌ Error verifying auth user:`, authError.message);
      return;
    }
    
    if (!authUsers || authUsers.length === 0) {
      console.error(`❌ Auth user not found after signup`);
      return;
    }
    
    console.log(`✅ Auth user verified: ${authUsers[0].email}`);
    
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
        // Try updating if it already exists
        console.log(`Trying to update existing record...`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: retailerRole })
          .eq('id', signUpData.user.id);
          
        if (updateError) {
          console.error(`❌ Error updating public user record:`, updateError.message);
        } else {
          console.log(`✅ Public user record updated successfully`);
        }
      } else {
        console.log(`✅ Public user record created successfully`);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error creating retailer user:', err);
  }
}

async function main() {
  console.log('🚀 Creating retailer user (fixed)...\n');
  
  await createRetailerUser();
  
  console.log('\n📋 Retailer user creation completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run the verification script: npm run verify-supabase');
  console.log('   2. Test logging in with retailer@iv-relife.com');
}

// Run the script
main().catch(console.error);