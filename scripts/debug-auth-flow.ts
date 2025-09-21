import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in .env.local
const supabaseUrl = 'https://nzbexzrveeyxuonooyeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function debugAuthFlow() {
  console.log('Debugging authentication flow...');
  
  // Test signing in with admin user
  console.log('Attempting to sign in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@iv-relife.com',
    password: '123456789'
  });
  
  if (error) {
    console.log('Login failed:', error.message);
    return;
  }
  
  console.log('Login successful');
  console.log('Session data:', data.session);
  console.log('User data:', data.user);
  
  // Check if user exists in users table
  console.log('Checking if user exists in users table...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (userError) {
    console.log('User not found in users table:', userError.message);
    
    // Just log that we would create a user record
    console.log('Would create user record...');
  } else {
    console.log('User found in users table:', userData);
  }
  
  // Wait a moment and then check session again
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check current session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session after delay:', sessionData.session);
  if (sessionError) {
    console.log('Session error:', sessionError.message);
  }
  
  // Check current user
  const { data: currentAuthUser, error: authUserError } = await supabase.auth.getUser();
  console.log('Current auth user after delay:', currentAuthUser.user);
  if (authUserError) {
    console.log('Auth user error:', authUserError.message);
  }
}

debugAuthFlow();