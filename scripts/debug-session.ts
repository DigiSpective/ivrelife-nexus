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

async function debugSession() {
  console.log('Debugging session persistence...');
  
  // Test signing in with admin user
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
  
  // Wait a moment and then check if session persists
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check current session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session after delay:', sessionData.session);
  if (sessionError) {
    console.log('Session error:', sessionError.message);
  }
  
  // Check current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('Current user after delay:', userData.user);
  if (userError) {
    console.log('User error:', userError.message);
  }
}

debugSession();