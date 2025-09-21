import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in .env.local
const supabaseUrl = 'https://nzbexzrveeyxuonooyeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing authentication with provided credentials...');
  
  // Test signing in with admin user
  const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'admin@iv-relife.com',
    password: '123456789'
  });
  
  if (adminError) {
    console.log('Admin login failed:', adminError.message);
  } else {
    console.log('Admin login successful:', adminData);
  }
  
  // Test signing in with retailer user
  const { data: retailerData, error: retailerError } = await supabase.auth.signInWithPassword({
    email: 'retailer@iv-relife.com',
    password: '123456789'
  });
  
  if (retailerError) {
    console.log('Retailer login failed:', retailerError.message);
  } else {
    console.log('Retailer login successful:', retailerData);
  }
  
  // List all users in auth table
  console.log('\nChecking auth users...');
  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
  if (authUsersError) {
    console.log('Error fetching auth users:', authUsersError.message);
  } else {
    console.log('Auth users found:', authUsers.users.length);
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });
  }
  
  // List all users in users table
  console.log('\nChecking users table...');
  const { data: appUsers, error: appUsersError } = await supabase.from('users').select('*');
  if (appUsersError) {
    console.log('Error fetching app users:', appUsersError.message);
  } else {
    console.log('App users found:', appUsers.length);
    appUsers.forEach(user => {
      console.log(`- ${user.email} (${user.id}) - Role: ${user.role}`);
    });
  }
}

testAuth();