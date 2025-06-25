const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearFriends(username) {
  console.log(`Clearing friends for user: ${username}`);
  
  try {
    // First get the user ID
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !user) {
      console.error('User not found:', username);
      return;
    }

    const userId = user.id;
    console.log(`Found user ID: ${userId}`);

    // Delete all friendships for this user
    const { data: deletedFriendships, error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .select();

    if (deleteError) {
      console.error('Error deleting friendships:', deleteError);
      return;
    }

    console.log(`✓ Deleted ${deletedFriendships?.length || 0} friendship records`);
    
    // Optionally, delete the fake user profiles too
    if (process.argv[3] === '--delete-fake-users') {
      console.log('\nDeleting fake user profiles...');
      
      // Get all fake friends
      const { data: friends } = await supabase
        .from('profiles')
        .select('id, username')
        .like('username', '%@nulldomain.com');
      
      for (const friend of friends || []) {
        // Skip if it's the current user
        if (friend.id === userId) continue;
        
        // Delete from auth
        const { error: authError } = await supabase.auth.admin.deleteUser(friend.id);
        if (!authError) {
          console.log(`  ✓ Deleted user: ${friend.username}`);
        }
      }
    }

    console.log('\nFriends cleared successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
const username = process.argv[2];
if (!username) {
  console.log('Usage: node scripts/clear-friends.js <username> [--delete-fake-users]');
  console.log('Example: node scripts/clear-friends.js pirate');
  console.log('         node scripts/clear-friends.js pirate --delete-fake-users');
} else {
  clearFriends(username);
}