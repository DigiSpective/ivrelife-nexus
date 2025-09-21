#!/usr/bin/env -S npx tsx

/**
 * Check and Create Retailer User Script
 * 
 * This script checks if the retailer user exists and creates them if not.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Checking and creating retailer user...\n');

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

async function checkAndCreateRetailer() {
  const retailerEmail = 'retailer@iv-relife.com';
  const retailerRole = 'retailer';
  
  try {
    console.log(`Checking if retailer user exists: ${retailerEmail}`);
    
    // Try to find the retailer user in auth
    const { data: authUsers, error: authError } = await supabase
      .rpc('list_users'); // This might not work, let's try a different approach
    
    if (authError) {
      console.log(`Direct auth query not available, trying alternative approach...`);
      
      // Let's try to create the user directly in public.users table
      // First, let's see if we can find any existing users
      const { data: existingUsers, error: existingError } = await supabase
        .from('users')
        .select('id, email');
      
      if (existingError) {
        console.error(`❌ Error querying existing users:`, existingError.message);
      } else {
        console.log(`Existing users in public.users:`);
        existingUsers?.forEach(user => {
          console.log(`  - ${user.email} (ID: ${user.id})`);
        });
      }
      
      // Let's try to manually create an auth user through the Supabase auth admin API
      console.log(`\nAttempting to create auth user via admin API...`);
      
      // Note: We can't directly create auth users via the client SDK
      // The user needs to be created through the application UI or Supabase dashboard
      console.log(`ℹ️  Please create the retailer user through the application UI:`);
      console.log(`   1. Go to the login page`);
      console.log(`   2. Click "Sign Up"`);
      console.log(`   3. Use email: ${retailerEmail}`);
      console.log(`   4. Use password: 123456789`);
      console.log(`   5. After signing up, run this script again to set the role`);
      
      return;
    }
    
    console.log(`Auth users found:`, authUsers);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function setRetailerRole() {
  const retailerEmail = 'retailer@iv-relife.com';
  const retailerRole = 'retailer';
  
  try {
    console.log(`\nSetting role for retailer user: ${retailerEmail}`);
    
    // Try to find the user in public.users and update their role
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', retailerEmail);
    
    if (publicError) {
      console.error(`❌ Error finding public user:`, publicError.message);
      return;
    }
    
    if (publicUsers && publicUsers.length > 0) {
      const userId = publicUsers[0].id;
      console.log(`Found public user: ${publicUsers[0].email} (ID: ${userId})`);
      console.log(`Current role: ${publicUsers[0].role}, Setting role: ${retailerRole}`);
      
      // Update the role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: retailerRole })
        .eq('id', userId);
        
      if (updateError) {
        console.error(`❌ Error updating role:`, updateError.message);
      } else {
        console.log(`✅ Role updated successfully`);
      }
    } else {
      console.log(`⚠️  Public user not found. Please sign up through the application first.`);
    }
  } catch (err) {
    console.error('❌ Unexpected error setting retailer role:', err);
  }
}

async function main() {
  console.log('🚀 Checking and creating retailer user...\n');
  
  await checkAndCreateRetailer();
  await setRetailerRole();
  
  console.log('\n📋 Check and create retailer user completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Sign up as retailer@iv-relife.com through the application UI');
  console.log('   2. Run this script again to set the correct role');
  console.log('   3. Run the verification script: npm run verify-supabase');
}

// Run the script
main().catch(console.error);