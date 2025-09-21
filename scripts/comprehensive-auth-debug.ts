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

async function comprehensiveAuthDebug() {
  console.log('=== Comprehensive Authentication Debug ===');
  
  // Check initial state
  console.log('\n1. Checking initial auth state...');
  const { data: initialSession, error: initialSessionError } = await supabase.auth.getSession();
  console.log('Initial session:', initialSession.session ? 'Exists' : 'None');
  if (initialSessionError) console.log('Initial session error:', initialSessionError.message);
  
  const { data: initialUser, error: initialUserError } = await supabase.auth.getUser();
  console.log('Initial user:', initialUser.user ? 'Exists' : 'None');
  if (initialUserError) console.log('Initial user error:', initialUserError.message);
  
  // Test signing in with admin user
  console.log('\n2. Attempting to sign in as admin...');
  const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'admin@iv-relife.com',
    password: '123456789'
  });
  
  if (adminError) {
    console.log('Admin login failed:', adminError.message);
    return;
  }
  
  console.log('Admin login successful');
  console.log('Admin session expires at:', adminData.session.expires_at ? new Date(adminData.session.expires_at * 1000).toISOString() : 'N/A');
  
  // Check auth state immediately after login
  console.log('\n3. Checking auth state immediately after admin login...');
  const { data: sessionAfterLogin, error: sessionAfterLoginError } = await supabase.auth.getSession();
  console.log('Session after login:', sessionAfterLogin.session ? 'Exists' : 'None');
  if (sessionAfterLoginError) console.log('Session after login error:', sessionAfterLoginError.message);
  
  const { data: userAfterLogin, error: userAfterLoginError } = await supabase.auth.getUser();
  console.log('User after login:', userAfterLogin.user ? 'Exists' : 'None');
  if (userAfterLoginError) console.log('User after login error:', userAfterLoginError.message);
  
  if (userAfterLogin.user) {
    console.log('User email:', userAfterLogin.user.email);
    console.log('User ID:', userAfterLogin.user.id);
  }
  
  // Check users table
  console.log('\n4. Checking users table for admin...');
  if (userAfterLogin.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userAfterLogin.user.id)
      .single();
    
    if (userError) {
      console.log('User not found in users table:', userError.message);
    } else {
      console.log('User found in users table:');
      console.log('  ID:', userData.id);
      console.log('  Email:', userData.email);
      console.log('  Role:', userData.role);
    }
  }
  
  // Wait and check again
  console.log('\n5. Waiting 3 seconds and checking again...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { data: sessionAfterWait, error: sessionAfterWaitError } = await supabase.auth.getSession();
  console.log('Session after wait:', sessionAfterWait.session ? 'Exists' : 'None');
  if (sessionAfterWaitError) console.log('Session after wait error:', sessionAfterWaitError.message);
  
  const { data: userAfterWait, error: userAfterWaitError } = await supabase.auth.getUser();
  console.log('User after wait:', userAfterWait.user ? 'Exists' : 'None');
  if (userAfterWaitError) console.log('User after wait error:', userAfterWaitError.message);
  
  if (userAfterWait.user) {
    console.log('User email after wait:', userAfterWait.user.email);
  }
  
  // Test sign out
  console.log('\n6. Testing sign out...');
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.log('Sign out error:', signOutError.message);
  } else {
    console.log('Sign out successful');
  }
  
  // Check state after sign out
  console.log('\n7. Checking state after sign out...');
  const { data: sessionAfterSignOut, error: sessionAfterSignOutError } = await supabase.auth.getSession();
  console.log('Session after sign out:', sessionAfterSignOut.session ? 'Exists' : 'None');
  if (sessionAfterSignOutError) console.log('Session after sign out error:', sessionAfterSignOutError.message);
  
  const { data: userAfterSignOut, error: userAfterSignOutError } = await supabase.auth.getUser();
  console.log('User after sign out:', userAfterSignOut.user ? 'Exists' : 'None');
  if (userAfterSignOutError) console.log('User after sign out error:', userAfterSignOutError.message);
  
  console.log('\n=== Debug Complete ===');
}

comprehensiveAuthDebug();