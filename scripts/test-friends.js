const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestFriends(username) {
  console.log(`Creating test friends for user: ${username}`);
  
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

    // Get some fake profiles that aren't used yet
    const { data: fakeProfiles, error: fetchError } = await supabase
      .from('fake_profiles')
      .select('*')
      .eq('used', false)
      .limit(5);

    if (fetchError) throw fetchError;
    
    for (const fakeProfile of fakeProfiles || []) {
      // Create fake user account
      const email = `${fakeProfile.username}@nulldomain.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'qwerty',
      });

      if (authError) {
        console.log(`Skipping ${fakeProfile.username} - might already exist`);
        continue;
      }

      if (authData.user) {
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: fakeProfile.username,
            display_name: fakeProfile.username,
            avatar_emoji: fakeProfile.avatar_emoji,
            avatar_color: fakeProfile.avatar_color,
            snap_score: fakeProfile.snap_score || 0,
          });

        // Create friendship
        await supabase
          .from('friendships')
          .insert([
            {
              user_id: userId,
              friend_id: authData.user.id,
              status: 'accepted',
            },
            {
              user_id: authData.user.id,
              friend_id: userId,
              status: 'accepted',
            },
          ]);

        // Mark as used
        await supabase
          .from('fake_profiles')
          .update({ used: true })
          .eq('id', fakeProfile.id);

        console.log(`✓ Added friend: ${fakeProfile.username}`);

        // If they have a story, create it
        if (fakeProfile.has_story && fakeProfile.story_caption) {
          const { data: story } = await supabase
            .from('posts')
            .insert({
              author_id: authData.user.id,
              media_url: `https://picsum.photos/seed/${fakeProfile.username}/400/600`,
              media_type: 'photo',
              caption: fakeProfile.story_caption,
            })
            .select()
            .single();

          if (story) {
            console.log(`  → Added story: "${fakeProfile.story_caption}"`);
          }
        }
      }
    }

    console.log('\nTest friends created successfully!');
  } catch (error) {
    console.error('Error creating test friends:', error);
  }
}

// Usage: Pass username as argument
const username = process.argv[2];
if (!username) {
  console.log('Usage: node scripts/test-friends.js <username>');
  console.log('Example: node scripts/test-friends.js testuser');
} else {
  createTestFriends(username);
}