#!/usr/bin/env -S npx tsx

/**
 * Test Authentication Script
 * 
 * This script tests authentication with the created user accounts.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testing Supabase Authentication...\n');

// Check if credentials are provided
if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_ANON_KEY not found in environment variables');
  process.exit(1);
}

console.log(`✅ SUPABASE_URL: ${supabaseUrl}`);
console.log(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user accounts
const testUsers = [
  {
    email: 'admin@iv-relife.com',
    password: '123456789',
    name: 'Admin User'
  },
  {
    email: 'retailer@iv-relife.com',
    password: '123456789',
    name: 'Retailer User'
  }
];

async function testAuthentication() {
  console.log('\n🔍 Testing authentication with user accounts...\n');
  
  for (const user of testUsers) {
    try {
      console.log(`Testing ${user.name}: ${user.email}`);
      
      // Sign in with the user account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        console.error(`  ❌ Authentication failed for ${user.name}:`, error.message);
        
        // If it's because the user doesn't exist or wrong password, let's try to sign up first
        if (error.message.includes('Invalid login credentials')) {
          console.log(`  ℹ️  Trying to sign up ${user.name} first...`);
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password
          });
          
          if (signUpError) {
            console.error(`  ❌ Sign up failed for ${user.name}:`, signUpError.message);
          } else {
            console.log(`  ✅ Sign up successful for ${user.name}`);
            console.log(`     User ID: ${signUpData.user?.id}`);
            
            // Try signing in again
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: user.email,
              password: user.password
            });
            
            if (signInError) {
              console.error(`  ❌ Second authentication attempt failed for ${user.name}:`, signInError.message);
            } else {
              console.log(`  ✅ Authentication successful for ${user.name} on second attempt`);
              console.log(`     Session exists: ${!!signInData.session}`);
              console.log(`     User ID: ${signInData.user?.id}`);
              
              // Sign out for next test
              await supabase.auth.signOut();
            }
          }
        }
      } else {
        console.log(`  ✅ Authentication successful for ${user.name}`);
        console.log(`     Session exists: ${!!data.session}`);
        console.log(`     User ID: ${data.user?.id}`);
        
        // Get user details from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, retailer_id, location_id')
          .eq('id', data.user?.id)
          .single();
        
        if (userError) {
          console.error(`  ❌ Error fetching user details for ${user.name}:`, userError.message);
        } else {
          console.log(`     Role: ${userData.role}`);
          console.log(`     Retailer ID: ${userData.retailer_id || 'None'}`);
          console.log(`     Location ID: ${userData.location_id || 'None'}`);
        }
        
        // Sign out for next test
        await supabase.auth.signOut();
        console.log(`  ✅ Signed out ${user.name}`);
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error testing ${user.name}:`, err);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function testGetCurrentUser() {
  try {
    console.log('\n🔍 Testing getCurrentUser function...');
    
    // Try to get the current user (should be null if not logged in)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message !== 'Invalid authentication credentials') {
      console.error('❌ getCurrentUser error:', error.message);
      return false;
    }
    
    if (user) {
      console.log('✅ getCurrentUser working');
      console.log(`   Authenticated user: ${user.email}`);
    } else {
      console.log('✅ getCurrentUser working (no user currently signed in)');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected getCurrentUser error:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase authentication test...\n');
  
  await testAuthentication();
  await testGetCurrentUser();
  
  console.log('\n📋 Authentication Test Summary:');
  console.log('   Test user authentication: Complete');
  console.log('   getCurrentUser function: Complete');
  console.log('\n💡 Next steps:');
  console.log('   1. Try logging in through the application UI');
  console.log('   2. Verify that the user roles are correctly set in the public.users table');
  console.log('   3. Test accessing different parts of the application based on user roles');
}

// Run the test
main().catch(console.error);