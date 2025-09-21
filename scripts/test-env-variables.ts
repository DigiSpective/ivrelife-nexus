// Test script to check if environment variables are loaded correctly
console.log('Testing environment variables...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('SUPABASE_URL:', import.meta.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.SUPABASE_ANON_KEY);

// Check if variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Has valid credentials:', !!(supabaseUrl && supabaseAnonKey && supabaseUrl.length > 10 && supabaseAnonKey.length > 50));