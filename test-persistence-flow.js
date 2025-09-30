/**
 * Comprehensive Persistence Test - Run in Browser Console
 * Tests the complete data flow from creation to persistence to retrieval
 */

async function testCompletePersistenceFlow() {
  console.log('🔍 COMPREHENSIVE PERSISTENCE AUDIT');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Test Supabase Connection
    console.log('\n📡 1. TESTING SUPABASE CONNECTION:');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://qeiyxwuyhetnrnundpep.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaXl4d3V5aGV0bnJudW5kcGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDQyMTEsImV4cCI6MjA3NDIyMDIxMX0.fkmN8zQXVv3m7VBcpIj1KfkspSb4a6K93RZVT8qiKak'
    );
    
    // Test auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('   Auth Status:', user ? `✅ User: ${user.id}` : '❌ Not authenticated');
    console.log('   Auth Error:', authError || 'None');
    
    // Step 2: Test Table Access
    console.log('\n🗄️ 2. TESTING TABLE ACCESS:');
    
    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    console.log('   Customers table:', customersError ? `❌ ${customersError.message}` : `✅ ${customers?.length || 0} records`);
    
    // Test user_storage table
    if (user) {
      const { data: userStorage, error: userStorageError } = await supabase
        .from('user_storage')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);
      console.log('   user_storage table:', userStorageError ? `❌ ${userStorageError.message}` : `✅ ${userStorage?.length || 0} records`);
    }
    
    // Step 3: Test Smart Persistence System
    console.log('\n🧠 3. TESTING SMART PERSISTENCE:');
    try {
      const { smartPersistence } = await import('./src/lib/smart-persistence.js');
      
      const testData = {
        id: 'test-' + Date.now(),
        name: 'Test Customer',
        email: 'test@persistence.com',
        created: new Date().toISOString()
      };
      
      // Test save
      console.log('   Testing save...');
      const saveResult = await smartPersistence.set('test-customers', [testData], user?.id);
      console.log('   Save result:', saveResult ? '✅ Success' : '❌ Failed');
      
      // Test retrieve
      console.log('   Testing retrieve...');
      const retrievedData = await smartPersistence.get('test-customers', user?.id);
      console.log('   Retrieved data:', retrievedData ? `✅ ${JSON.stringify(retrievedData).substring(0, 100)}...` : '❌ No data');
      
      // Test data integrity
      const dataMatches = JSON.stringify(retrievedData) === JSON.stringify([testData]);
      console.log('   Data integrity:', dataMatches ? '✅ Perfect match' : '❌ Data corruption');
      
    } catch (smartPersistenceError) {
      console.log('   ❌ Smart Persistence Error:', smartPersistenceError.message);
    }
    
    // Step 4: Test Direct localStorage
    console.log('\n📁 4. TESTING LOCALSTORAGE:');
    try {
      const testKey = 'persistence-audit-test';
      const testValue = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      console.log('   localStorage test:', retrieved.test ? '✅ Working' : '❌ Failed');
    } catch (localStorageError) {
      console.log('   ❌ localStorage Error:', localStorageError.message);
    }
    
    // Step 5: Test Application Data Flow
    console.log('\n📊 5. TESTING APPLICATION DATA FLOW:');
    try {
      // Test if app hooks are working
      const { getMockCustomers } = await import('./src/lib/mock-data.js');
      
      console.log('   Testing getMockCustomers...');
      const customers = await getMockCustomers(user?.id);
      console.log('   App customers:', Array.isArray(customers) ? `✅ ${customers.length} customers` : '❌ Invalid data');
      
      // Check if data persists
      console.log('   Testing persistence in app data...');
      const customers2 = await getMockCustomers(user?.id);
      const sameData = JSON.stringify(customers) === JSON.stringify(customers2);
      console.log('   Data consistency:', sameData ? '✅ Consistent' : '❌ Inconsistent');
      
    } catch (appDataError) {
      console.log('   ❌ App Data Error:', appDataError.message);
    }
    
    // Step 6: Check Current localStorage State
    console.log('\n🔍 6. CURRENT LOCALSTORAGE STATE:');
    const relevantKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('iv-relife') || key.includes('customer') || key.includes('supabase'))) {
        relevantKeys.push(key);
      }
    }
    console.log('   Relevant keys found:', relevantKeys.length);
    relevantKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`   ${key}:`, value ? value.substring(0, 100) + '...' : 'empty');
    });
    
    // Step 7: Final Diagnosis
    console.log('\n🏥 7. PERSISTENCE DIAGNOSIS:');
    const diagnosis = {
      supabaseConnection: !authError,
      userAuthenticated: !!user,
      customersTableAccess: !customersError,
      userStorageTableAccess: user && !userStorageError,
      smartPersistenceWorking: false, // Will be updated above
      localStorageWorking: true,
      appDataFlow: false // Will be updated above
    };
    
    console.log('   Diagnosis:', diagnosis);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!user) {
      console.log('   🔑 User not authenticated - this is the primary issue');
      console.log('   📝 Action: Ensure user logs in before testing persistence');
    }
    if (customersError) {
      console.log('   🗄️ Customers table not accessible');
      console.log('   📝 Action: Run create-missing-tables.sql script');
    }
    if (user && userStorageError) {
      console.log('   💾 user_storage table not accessible');
      console.log('   📝 Action: Check RLS policies and table permissions');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 PERSISTENCE AUDIT COMPLETE');
    
    return diagnosis;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return { error: error.message };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testCompletePersistenceFlow = testCompletePersistenceFlow;
  console.log('🔧 Persistence audit loaded. Run testCompletePersistenceFlow() in console.');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCompletePersistenceFlow };
}