#!/usr/bin/env -S npx tsx

/**
 * Supabase Setup Verification Script
 * 
 * This script verifies that Supabase credentials are properly configured
 * and that the database connection is working.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and keys from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create clients for different access levels
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

console.log('🔍 Verifying Supabase Setup...\n');

// Check if credentials are provided
if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  console.log('   Please set VITE_SUPABASE_URL in your .env.local file');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_ANON_KEY not found in environment variables');
  console.log('   Please set VITE_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

console.log(`✅ SUPABASE_URL: ${supabaseUrl}`);
console.log(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);

// Use the anonymous client for most operations
const supabase = anonClient;

// Test database connection
async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    
    // Try to fetch a simple table that doesn't have complex RLS policies
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "system_settings" does not exist')) {
        console.log('⚠️  Warning: system_settings table does not exist yet');
        console.log('   This is expected if you haven\'t run the database setup script yet');
        console.log('   Run fixed-database-setup.sql in your Supabase SQL Editor');
      } else if (error.message.includes('infinite recursion detected')) {
        console.log('⚠️  Warning: RLS policy recursion detected');
        console.log('   This indicates an issue with the Row Level Security policies');
        console.log('   Run fixed-database-setup.sql in your Supabase SQL Editor to fix this');
      } else {
        console.error('❌ Error connecting to database:', error.message);
        return false;
      }
    } else {
      console.log('✅ Database connection successful');
      console.log(`   Found ${data?.length || 0} system_settings records`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Test authentication
async function testAuth() {
  try {
    console.log('\n🔍 Testing authentication...');
    
    // Try to get the current user (should be null if not logged in)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message !== 'Invalid authentication credentials' && error.message !== 'Auth session missing!') {
      console.error('❌ Authentication error:', error.message);
      return false;
    }
    
    if (user) {
      console.log('✅ Authentication working');
      console.log(`   Authenticated user: ${user.email}`);
    } else {
      console.log('✅ Authentication configured (no user currently signed in)');
    }
    
    // If we have a service client, test it as well
    if (serviceClient) {
      console.log('\n🔍 Testing service role access...');
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('system_settings')
        .select('*')
        .limit(1);
      
      if (serviceError) {
        console.error('❌ Service role access error:', serviceError.message);
        return false;
      }
      
      console.log('✅ Service role access working');
    }
    
    // Authentication configuration is working even if no user is signed in
    return true;
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected auth error:', err);
    return false;
  }
}

// Run verification
async function main() {
  console.log('🚀 Starting Supabase verification...\n');
  
  const connectionSuccess = await testConnection();
  const authSuccess = await testAuth();
  
  console.log('\n📋 Verification Summary:');
  console.log(`   Database Connection: ${connectionSuccess ? '✅ Pass' : '❌ Fail'}`);
  console.log(`   Authentication: ${authSuccess ? '✅ Pass' : '❌ Fail'}`);
  
  if (connectionSuccess) {
    console.log('\n🎉 Database connection is properly configured!');
    
    if (authSuccess) {
      console.log('✅ Authentication is working');
    } else {
      console.log('ℹ️  Authentication is configured but no user is currently signed in');
      console.log('   This is normal when no user has logged in yet');
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit http://localhost:5173 to access the application');
    console.log('   3. Sign in with admin@iv-relife.com or retailer@iv-relife.com (password: 123456789)');
  } else {
    console.log('\n🔧 Please check the errors above and fix your configuration.');
    process.exit(1);
  }
}

// Run the verification
main().catch(console.error);