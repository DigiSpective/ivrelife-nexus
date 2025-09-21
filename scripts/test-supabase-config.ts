#!/usr/bin/env -S npx tsx

/**
 * Test Supabase Configuration Script
 * 
 * This script tests if Supabase credentials are properly detected.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testing Supabase configuration...\n');

console.log(`SUPABASE_URL: ${supabaseUrl}`);
console.log(`SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://nzbexzrveeyxuonooyeh.supabase.co' && 
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4';

console.log(`\nHas valid credentials: ${hasValidCredentials}`);

if (!hasValidCredentials) {
  console.log('\n❌ Supabase credentials are not properly configured');
  console.log('   The application will use mock authentication');
  console.log('   For mock authentication, use these credentials:');
  console.log('   - Email: admin@ivrelife.com');
  console.log('   - Password: admin123');
  console.log('   - Role: owner');
} else {
  console.log('\n✅ Supabase credentials are properly configured');
  console.log('   The application will use real Supabase authentication');
  console.log('   Use the passwords you set when creating the users');
}

console.log('\n💡 To fix authentication issues:');
if (!hasValidCredentials) {
  console.log('   1. Check that your .env.local file has the correct credentials');
  console.log('   2. Or use the mock credentials mentioned above');
} else {
  console.log('   1. Verify that the user exists in your Supabase auth system');
  console.log('   2. Check that the password is correct');
}