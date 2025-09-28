/**
 * Persistence Status Checker
 * Determines which persistence methods are available and working
 */

import { supabase } from './supabase';

export interface PersistenceStatus {
  localStorage: boolean;
  supabaseAuth: boolean;
  supabaseUserStorage: boolean;
  supabaseCustomers: boolean;
  currentUserId?: string;
  errors: string[];
  recommendations: string[];
}

let cachedStatus: PersistenceStatus | null = null;
let lastCheck = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function checkPersistenceStatus(force = false): Promise<PersistenceStatus> {
  const now = Date.now();
  
  // Return cached status if recent and not forced
  if (!force && cachedStatus && (now - lastCheck) < CACHE_DURATION) {
    return cachedStatus;
  }
  
  const status: PersistenceStatus = {
    localStorage: false,
    supabaseAuth: false,
    supabaseUserStorage: false,
    supabaseCustomers: false,
    errors: [],
    recommendations: []
  };
  
  console.log('🔍 Checking persistence status...');
  
  // Test 1: localStorage
  try {
    const testKey = '__persistence_test__';
    const testValue = { test: true, timestamp: now };
    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    localStorage.removeItem(testKey);
    
    if (retrieved.test === true) {
      status.localStorage = true;
      console.log('✅ localStorage: Working');
    } else {
      status.errors.push('localStorage: Retrieved data doesn\'t match');
    }
  } catch (error) {
    status.errors.push(`localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('❌ localStorage: Failed');
  }
  
  // Test 2: Supabase Authentication
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      status.errors.push(`Supabase Auth: ${error.message}`);
      console.log('❌ Supabase Auth: Failed -', error.message);
    } else if (user) {
      status.supabaseAuth = true;
      status.currentUserId = user.id;
      console.log('✅ Supabase Auth: Working - User ID:', user.id);
    } else {
      status.errors.push('Supabase Auth: No user logged in');
      console.log('⚠️ Supabase Auth: No user logged in');
    }
  } catch (error) {
    status.errors.push(`Supabase Auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('❌ Supabase Auth: Exception -', error);
  }
  
  // Test 3: user_storage table (only if authenticated)
  if (status.supabaseAuth && status.currentUserId) {
    try {
      // Try to query user_storage table
      const { data, error } = await supabase
        .from('user_storage')
        .select('id')
        .eq('user_id', status.currentUserId)
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation "public.user_storage" does not exist')) {
          status.errors.push('user_storage table does not exist - run SQL setup script');
          status.recommendations.push('Execute create-missing-tables.sql in Supabase SQL Editor');
          console.log('❌ user_storage table: Does not exist');
        } else {
          status.errors.push(`user_storage: ${error.message}`);
          console.log('❌ user_storage table: Error -', error.message);
        }
      } else {
        status.supabaseUserStorage = true;
        console.log('✅ user_storage table: Working');
      }
    } catch (error) {
      status.errors.push(`user_storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('❌ user_storage table: Exception -', error);
    }
  }
  
  // Test 4: customers table
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation "public.customers" does not exist')) {
        status.errors.push('customers table does not exist - run SQL setup script');
        console.log('❌ customers table: Does not exist');
      } else {
        status.errors.push(`customers: ${error.message}`);
        console.log('❌ customers table: Error -', error.message);
      }
    } else {
      status.supabaseCustomers = true;
      console.log('✅ customers table: Working');
    }
  } catch (error) {
    status.errors.push(`customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('❌ customers table: Exception -', error);
  }
  
  // Generate recommendations
  if (!status.localStorage) {
    status.recommendations.push('localStorage is not working - check browser settings');
  }
  
  if (!status.supabaseAuth) {
    status.recommendations.push('Supabase authentication not working - check credentials');
  }
  
  if (status.supabaseAuth && !status.supabaseUserStorage) {
    status.recommendations.push('Run the create-missing-tables.sql script to enable Supabase persistence');
  }
  
  if (!status.supabaseCustomers) {
    status.recommendations.push('customers table missing - data will only persist locally');
  }
  
  // Cache the result
  cachedStatus = status;
  lastCheck = now;
  
  console.log('🏁 Persistence status check complete:', status);
  return status;
}

export function clearPersistenceStatusCache() {
  cachedStatus = null;
  lastCheck = 0;
}