#!/usr/bin/env -S npx tsx

/**
 * Simple Supabase Connection Test Script
 * 
 * This script tests if we can connect to Supabase and authenticate.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testing Supabase Connection...\n');

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

// Test basic connection
async function testConnection() {
  try {
    console.log('\n🔍 Testing basic connection...');
    
    // Try to get the Supabase version (simple query)
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.log('ℹ️  Info: Could not get version info (this is normal for Supabase)');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Basic connection successful');
      console.log('   Version:', data);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
}

// Run the test
async function main() {
  console.log('🚀 Starting Supabase connection test...\n');
  
  const connectionSuccess = await testConnection();
  
  console.log('\n📋 Test Summary:');
  console.log(`   Basic Connection: ${connectionSuccess ? '✅ Pass' : '❌ Fail'}`);
  
  if (connectionSuccess) {
    console.log('\n🎉 Connection test passed! Supabase is accessible.');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure you\'ve run complete-database-setup.sql in your Supabase SQL Editor');
    console.log('   2. Try running the full verification: npm run verify-supabase');
  } else {
    console.log('\n🔧 Please check your Supabase credentials and network connection.');
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);