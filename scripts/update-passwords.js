#!/usr/bin/env node

/**
 * Script to update all user passwords to 'qwerty'
 * This uses the Supabase Admin API which requires service role key
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('You need to add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.error('Find it in your Supabase dashboard under Settings > API');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updatePasswords() {
  try {
    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    console.log(`Found ${users.users.length} users to update`);

    // Update each user's password
    for (const user of users.users) {
      console.log(`Updating password for ${user.email}...`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'qwerty' }
      );

      if (updateError) {
        console.error(`Failed to update ${user.email}:`, updateError);
      } else {
        console.log(`✓ Updated ${user.email}`);
      }
    }

    console.log('\nAll passwords updated to "qwerty"');
  } catch (error) {
    console.error('Script error:', error);
  }
}

updatePasswords();