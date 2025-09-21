#!/usr/bin/env -S npx tsx

/**
 * Debug Auth User Script
 * 
 * This script debugs authentication issues by checking user status.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and keys from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Debugging auth user...\n');

// Check if credentials are provided
if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_ANON_KEY not found in environment variables');
  process.exit(1);
}

// Create Supabase clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function debugUser(email: string, password: string) {
  console.log(`Debugging user: ${email}\n`);
  
  try {
    // Check if user exists in auth system (using service client)
    if (serviceClient) {
      console.log('Checking if user exists in auth system...');
      
      // Try to get user by email using service client
      // Note: This is a workaround since we can't directly query auth.users
      console.log('Attempting to sign in to verify credentials...');
      
      const { data, error } = await anonClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.log(`❌ Sign in failed: ${error.message}`);
        
        // Check if it's because Supabase isn't configured properly
        if (error.message.includes('Supabase not configured')) {
          console.log(`   This indicates the application is using mock authentication`);
          console.log(`   Try using password 'admin123' for admin user in mock mode`);
        }
        
        // Let's try to list users if possible
        console.log('\nTrying to list auth users...');
        const { data: usersData, error: usersError } = await serviceClient
          .from('users')
          .select('id, email, created_at')
          .eq('email', email);
        
        if (usersError) {
          console.log(`❌ Error querying users: ${usersError.message}`);
        } else if (usersData && usersData.length > 0) {
          console.log(`✅ User found in auth system:`);
          console.log(`   Email: ${usersData[0].email}`);
          console.log(`   ID: ${usersData[0].id}`);
          console.log(`   Created: ${usersData[0].created_at}`);
        } else {
          console.log(`⚠️  User not found in auth system`);
        }
      } else {
        console.log(`✅ Sign in successful`);
        console.log(`   User ID: ${data.user?.id}`);
        console.log(`   Email: ${data.user?.email}`);
        
        // Sign out for next test
        await anonClient.auth.signOut();
      }
    }
    
    // Check public.users table
    console.log('\nChecking public.users table...');
    const { data: publicUsers, error: publicError } = await (serviceClient || anonClient)
      .from('users')
      .select('id, email, role')
      .eq('email', email);
    
    if (publicError) {
      console.log(`❌ Error querying public.users: ${publicError.message}`);
    } else if (publicUsers && publicUsers.length > 0) {
      console.log(`✅ User found in public.users:`);
      console.log(`   Email: ${publicUsers[0].email}`);
      console.log(`   ID: ${publicUsers[0].id}`);
      console.log(`   Role: ${publicUsers[0].role}`);
    } else {
      console.log(`⚠️  User not found in public.users`);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function main() {
  console.log('🚀 Debugging auth user...\n');
  
  // Test with admin user
  await debugUser('admin@iv-relife.com', '123456789');
  
  console.log('\n' + '='.repeat(50));
  
  // Test with retailer user
  await debugUser('retailer@iv-relife.com', '123456789');
  
  console.log('\n📋 Debugging completed!');
  console.log('\n💡 If users are not found in auth system:');
  console.log('   1. Sign up through the application UI');
  console.log('   2. Use the correct email and password');
  console.log('   3. Check that the Supabase project is not paused');
}

// Run the script
main().catch(console.error);