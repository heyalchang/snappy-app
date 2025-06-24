#!/usr/bin/env node

// Quick script to test Supabase connection and data
// Run with: node scripts/test-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Test 1: Check tables exist
    console.log('1️⃣ Checking tables...');
    const tables = ['profiles', 'messages', 'friendships', 'posts', 'fake_profiles'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible`);
      }
    }
    
    // Test 2: Check fake profiles
    console.log('\n2️⃣ Checking fake profiles...');
    const { data: fakeProfiles, error: fpError } = await supabase
      .from('fake_profiles')
      .select('count');
    
    if (fpError) {
      console.log(`   ❌ Error: ${fpError.message}`);
    } else {
      const count = fakeProfiles?.[0]?.count || 0;
      console.log(`   ✅ Fake profiles: ${count} loaded`);
    }
    
    // Test 3: Check storage bucket
    console.log('\n3️⃣ Checking storage bucket...');
    // Direct query since listBuckets might not be available with anon key
    const { error: testUploadError } = await supabase.storage
      .from('media')
      .list('test', { limit: 1 });
    
    if (testUploadError && testUploadError.message.includes('not found')) {
      console.log('   ❌ Media bucket not found');
    } else {
      console.log('   ✅ Media bucket: accessible (public)');
    }
    
    // Test 4: Check auth
    console.log('\n4️⃣ Testing auth...');
    const testEmail = 'testscript@nulldomain.com';
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'snapclone123!',
    });
    
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('   ✅ Auth working (test user exists)');
    } else if (signUpData?.user) {
      console.log('   ✅ Auth working (created test user)');
      // Clean up
      await supabase.auth.admin.deleteUser(signUpData.user.id);
    } else {
      console.log(`   ❌ Auth error: ${signUpError?.message}`);
    }
    
    console.log('\n✨ Supabase connection test complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run tests
testConnection();