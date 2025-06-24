import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestFriends(userId: string) {
  console.log('Creating test friendships...');
  
  try {
    // Get some fake profiles
    const { data: fakeProfiles, error: fetchError } = await supabase
      .from('fake_profiles')
      .select('*')
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

// Usage: Pass your user ID as argument
const userId = process.argv[2];
if (!userId) {
  console.log('Usage: npx ts-node scripts/test-friends.ts <userId>');
  console.log('Get your userId from the Supabase Auth dashboard');
} else {
  createTestFriends(userId);
}