import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in .env.local
const supabaseUrl = 'https://nzbexzrveeyxuonooyeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM4Nzc0NSwiZXhwIjoyMDcwOTYzNzQ1fQ.sezV17K_vGjmarDOF0dLDtrh9PJHwkZtN-S368dgAno';

// Create clients - one with anon key for auth operations, one with service role for admin operations
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRetailerUser() {
  console.log('Checking retailer user record...');
  
  // First, let's get the retailer user's ID by signing in
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email: 'retailer@iv-relife.com',
    password: '123456789'
  });
  
  if (signInError) {
    console.error('Failed to sign in as retailer:', signInError.message);
    return;
  }
  
  const retailerUserId = signInData.user?.id;
  console.log('Retailer user ID:', retailerUserId);
  
  // Check if the retailer user exists in the users table
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', retailerUserId)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user:', fetchError.message);
    return;
  }
  
  if (existingUser) {
    console.log('Retailer user already exists in users table:', existingUser);
    return;
  }
  
  console.log('Creating retailer user record...');
  
  // Create the retailer user record
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: retailerUserId,
      email: 'retailer@iv-relife.com',
      name: 'Retailer User',
      role: 'retailer'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Error creating retailer user record:', insertError.message);
    return;
  }
  
  console.log('Successfully created retailer user record:', insertData);
}

fixRetailerUser();