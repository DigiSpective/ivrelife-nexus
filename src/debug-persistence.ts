/**
 * Comprehensive Persistence Debugging Script
 * Run this in browser console to debug persistence issues
 */

export async function debugPersistence() {
  console.log('🔍 DEBUGGING PERSISTENCE SYSTEM');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check localStorage
    console.log('📂 1. CHECKING LOCALSTORAGE:');
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('iv-relife')) {
        localStorageKeys.push(key);
        const value = localStorage.getItem(key);
        console.log(`   ${key}:`, JSON.parse(value || '{}'));
      }
    }
    if (localStorageKeys.length === 0) {
      console.log('   ❌ No iv-relife data found in localStorage');
    }
    
    // Test 2: Check Supabase auth
    console.log('\n🔐 2. CHECKING SUPABASE AUTH:');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://qeiyxwuyhetnrnundpep.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaXl4d3V5aGV0bnJudW5kcGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDQyMTEsImV4cCI6MjA3NDIyMDIxMX0.fkmN8zQXVv3m7VBcpIj1KfkspSb4a6K93RZVT8qiKak'
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('   ❌ Auth Error:', authError);
    } else {
      console.log('   ✅ User:', user?.id, user?.email);
    }
    
    // Test 3: Check user_storage table
    console.log('\n🗄️ 3. CHECKING USER_STORAGE TABLE:');
    if (user) {
      const { data, error } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.log('   ❌ user_storage Error:', error);
      } else {
        console.log('   ✅ user_storage Data:', data);
      }
    }
    
    // Test 4: Check customers table
    console.log('\n👥 4. CHECKING CUSTOMERS TABLE:');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.log('   ❌ customers Error:', customersError);
    } else {
      console.log('   ✅ customers Data:', customers);
    }
    
    // Test 5: Test data persistence flow
    console.log('\n🔄 5. TESTING PERSISTENCE FLOW:');
    const testData = {
      test: 'persistence-debug',
      timestamp: new Date().toISOString(),
      userId: user?.id
    };
    
    // Test localStorage persistence
    localStorage.setItem('iv-relife-debug-test', JSON.stringify(testData));
    const retrieved = localStorage.getItem('iv-relife-debug-test');
    console.log('   📁 localStorage test:', JSON.parse(retrieved || '{}'));
    
    // Test Supabase persistence (if user_storage exists)
    if (user) {
      try {
        const { error: insertError } = await supabase
          .from('user_storage')
          .upsert({
            user_id: user.id,
            storage_key: 'debug-test',
            data: JSON.stringify(testData)
          });
        
        if (insertError) {
          console.log('   ❌ Supabase insert error:', insertError);
        } else {
          console.log('   ✅ Supabase insert successful');
          
          // Try to retrieve it
          const { data: retrievedData, error: selectError } = await supabase
            .from('user_storage')
            .select('data')
            .eq('user_id', user.id)
            .eq('storage_key', 'debug-test')
            .single();
          
          if (selectError) {
            console.log('   ❌ Supabase select error:', selectError);
          } else {
            console.log('   ✅ Supabase retrieved:', JSON.parse(retrievedData.data));
          }
        }
      } catch (supabaseError) {
        console.log('   ❌ Supabase test failed:', supabaseError);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 DEBUGGING COMPLETE');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  (window as any).debugPersistence = debugPersistence;
  console.log('🔧 Persistence debugger loaded. Run debugPersistence() in console.');
}