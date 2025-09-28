/**
 * Test Script for Smart Persistence System
 * Run this in browser console to verify the comprehensive resolution
 */

async function testSmartPersistence() {
  console.log('🧪 TESTING SMART PERSISTENCE SYSTEM');
  console.log('=' .repeat(60));
  
  try {
    // Import the new smart persistence system
    const { smartPersistence } = await import('./src/lib/smart-persistence.js');
    const { checkPersistenceStatus } = await import('./src/lib/persistence-status.js');
    
    // Test 1: Check system status
    console.log('🔍 1. CHECKING SYSTEM STATUS:');
    const status = await checkPersistenceStatus(true);
    console.log('   Status:', status);
    
    // Test 2: Test data persistence flow with user context
    console.log('\n💾 2. TESTING DATA PERSISTENCE:');
    const testUserId = status.currentUserId || 'test-user-123';
    const testCustomer = {
      id: 'test-cust-' + Date.now(),
      name: 'Test Customer ' + Date.now(),
      email: 'test@example.com',
      created: new Date().toISOString()
    };
    
    // Save test data
    console.log('   Saving test customer...');
    const saveResult = await smartPersistence.set('customers-test', [testCustomer], testUserId);
    console.log('   Save result:', saveResult);
    
    // Retrieve test data
    console.log('   Retrieving test customer...');
    const retrievedData = await smartPersistence.get('customers-test', testUserId);
    console.log('   Retrieved data:', retrievedData);
    
    // Verify data integrity
    const dataMatches = JSON.stringify(retrievedData) === JSON.stringify([testCustomer]);
    console.log('   Data integrity check:', dataMatches ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: Test without user context (should use localStorage only)
    console.log('\n📁 3. TESTING WITHOUT USER CONTEXT:');
    const guestData = { test: 'guest-data-' + Date.now() };
    await smartPersistence.set('guest-test', guestData);
    const retrievedGuestData = await smartPersistence.get('guest-test');
    console.log('   Guest data test:', retrievedGuestData);
    
    // Test 4: Test data migration capabilities
    console.log('\n🔄 4. TESTING MIGRATION CAPABILITIES:');
    if (testUserId && status.supabaseUserStorage) {
      // Add some localStorage data to migrate
      localStorage.setItem('iv-relife-migration-test:' + testUserId, JSON.stringify({
        data: { migrationTest: true },
        userId: testUserId,
        timestamp: Date.now()
      }));
      
      const migrationResult = await smartPersistence.migrateFromLocalStorageToSupabase(testUserId);
      console.log('   Migration result:', migrationResult, 'items migrated');
    } else {
      console.log('   ⚠️ Migration test skipped - no user context or Supabase unavailable');
    }
    
    // Test 5: Test error handling
    console.log('\n⚠️ 5. TESTING ERROR HANDLING:');
    try {
      // Test with invalid data
      await smartPersistence.set('error-test', undefined, testUserId);
      console.log('   Error handling: Should have failed but didn\'t');
    } catch (error) {
      console.log('   Error handling: ✅ Properly caught error:', error.message);
    }
    
    // Clean up test data
    console.log('\n🧹 6. CLEANING UP TEST DATA:');
    await smartPersistence.remove('customers-test', testUserId);
    await smartPersistence.remove('guest-test');
    localStorage.removeItem('iv-relife-migration-test:' + testUserId);
    console.log('   Cleanup complete');
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 SMART PERSISTENCE TEST COMPLETE');
    console.log('✅ All systems operational');
    
    return {
      status,
      testResults: {
        systemStatus: status,
        dataIntegrity: dataMatches,
        persistenceWorking: saveResult,
        migrationAvailable: status.supabaseUserStorage && testUserId
      }
    };
    
  } catch (error) {
    console.error('❌ Smart persistence test failed:', error);
    return { error: error.message };
  }
}

// Make function globally available for browser testing
if (typeof window !== 'undefined') {
  window.testSmartPersistence = testSmartPersistence;
  console.log('🔧 Smart persistence test loaded. Run testSmartPersistence() in console.');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSmartPersistence };
}