-- ───────────────────────────────
-- Migration: Fake Profiles System
-- Date: 2024-12-24
-- Purpose: Create fake profiles for demo/testing
-- ───────────────────────────────

-- 1. Create fake profiles pool table
CREATE TABLE IF NOT EXISTS public.fake_profiles (
  id serial PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_emoji text NOT NULL,
  avatar_color text NOT NULL,  -- Hex color for background
  snap_score integer DEFAULT floor(random() * 10000),
  has_story boolean DEFAULT false,
  story_caption text,
  used boolean DEFAULT false
);

-- Enable RLS with open policy
ALTER TABLE public.fake_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fake profiles - open" ON public.fake_profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Create system settings table for tracking
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS with open policy
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System settings - open" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. Insert initial counter
INSERT INTO public.system_settings (key, value) 
VALUES ('next_fake_profile_id', '1')
ON CONFLICT (key) DO NOTHING;

-- 4. Populate fake profiles with realistic usernames and fun avatars
INSERT INTO public.fake_profiles (username, avatar_emoji, avatar_color, snap_score, has_story, story_caption) VALUES
-- Popular names with emojis
('alex_wilson', '😎', '#FFB6C1', 4523, true, 'Beach day! 🏖️'),
('emma_jones', '🦄', '#E6E6FA', 8912, true, 'Coffee time ☕'),
('mike_chen', '🎮', '#98FB98', 2341, false, NULL),
('sarah_kim', '🌸', '#FFA07A', 6789, true, 'Study grind 📚'),
('james_taylor', '🏀', '#87CEEB', 1234, false, NULL),
('lily_nguyen', '🌺', '#DDA0DD', 9876, true, 'New recipe! 🍜'),
('ryan_garcia', '🛹', '#F0E68C', 3456, false, NULL),
('mia_patel', '✨', '#FFE4E1', 5678, true, 'Sunset vibes 🌅'),
('noah_brown', '🎵', '#B0E0E6', 7890, false, NULL),
('sophia_lee', '🦋', '#FFDAB9', 4321, true, 'Art project 🎨'),

-- Gen Z usernames
('xxcoder_boyxx', '💻', '#D8BFD8', 1337, false, NULL),
('vibes_only23', '🌈', '#F5DEB3', 4200, true, 'Good vibes only ✌️'),
('no_cap_fr', '🧢', '#FFC0CB', 6969, false, NULL),
('aesthetic.girl', '🌙', '#E0FFFF', 8888, true, 'Midnight thoughts 💭'),
('gamer_dude420', '🎯', '#FAFAD2', 3141, false, NULL),
('plant_mom_life', '🌿', '#90EE90', 5555, true, 'New succulent! 🪴'),
('gym_bro_2024', '💪', '#FFE4B5', 7777, false, NULL),
('bookworm.beth', '📖', '#FFF0F5', 2468, true, 'Current read 📚'),
('skater.steve', '🛹', '#F0FFF0', 1357, false, NULL),
('artsy.annie', '🎨', '#FFF5EE', 9999, true, 'Gallery visit 🖼️'),

-- Fun/quirky usernames
('pizza_lover99', '🍕', '#FFFACD', 3333, true, 'Pizza night! 🍕'),
('coffee_addict', '☕', '#FFEFD5', 6666, false, NULL),
('dog_parent', '🐕', '#FFE7BA', 4444, true, 'Puppy playtime 🐾'),
('cat_lady2024', '😺', '#FFDEAD', 7531, false, NULL),
('sushi_master', '🍣', '#FFF8DC', 2580, true, 'Omakase night 🍱'),
('taco_tuesday', '🌮', '#F5F5DC', 8520, false, NULL),
('bubble_tea_bae', '🧋', '#FFFAF0', 9630, true, 'Boba run! 🧋'),
('donut_destroyer', '🍩', '#FDF5E6', 7410, false, NULL),
('noodle_ninja', '🍜', '#FAF0E6', 3690, true, 'Ramen time 🍜'),
('cookie_monster24', '🍪', '#FAEBD7', 1470, false, NULL),

-- More realistic names
('david_martinez', '⚽', '#FFE4C4', 5432, false, NULL),
('jessica_wang', '🌟', '#FFDAB9', 8765, true, 'Concert tonight! 🎤'),
('kevin_park', '🏃', '#FFE5B4', 2109, false, NULL),
('amanda_silva', '💃', '#FFEBCD', 6543, true, 'Dance practice 💃'),
('tyler_johnson', '🏈', '#FFF0DB', 3210, false, NULL),
('rachel_cohen', '📷', '#FFF5DC', 7654, true, 'Photo walk 📸'),
('brandon_lewis', '🎸', '#FFFAED', 4567, false, NULL),
('nicole_chang', '🧘‍♀️', '#FFFFF0', 8901, true, 'Yoga flow 🧘‍♀️'),
('justin_moore', '🏄', '#FFFFFA', 1098, false, NULL),
('ashley_davis', '🌻', '#F0FFFF', 5432, true, 'Farmers market 🌻'),

-- Tech/gaming themed
('code_wizard', '🧙‍♂️', '#E6E6FA', 9001, false, NULL),
('pixel_princess', '👾', '#DDA0DD', 8008, true, 'New high score! 🎮'),
('debug_master', '🐛', '#D8BFD8', 1010, false, NULL),
('crypto_kid', '🚀', '#E0E0FF', 4040, true, 'To the moon! 🌙'),
('app_developer', '📱', '#F0F0FF', 5050, false, NULL),
('web_designer', '🎨', '#F5F5FF', 6060, true, 'New portfolio piece ✨'),
('data_scientist', '📊', '#FAFAFA', 7070, false, NULL),
('ai_enthusiast', '🤖', '#F8F8FF', 8080, true, 'AI art experiment 🎨'),
('cloud_engineer', '☁️', '#F0F8FF', 9090, false, NULL),
('ux_unicorn', '🦄', '#E8F4FF', 1111, true, 'User testing day 📝'),

-- Sports/fitness
('yoga_girl', '🧘‍♀️', '#FFE4E1', 2222, true, 'Morning flow 🌅'),
('crossfit_chris', '🏋️', '#FFE0E0', 3333, false, NULL),
('runner_rachel', '🏃‍♀️', '#FFDEDE', 4444, true, '5K complete! 🏃‍♀️'),
('swimmer_sam', '🏊', '#FFDBDB', 5555, false, NULL),
('cyclist_casey', '🚴', '#FFD8D8', 6666, true, 'Mountain trail 🚵'),
('hiker_hannah', '🥾', '#FFD5D5', 7777, false, NULL),
('climber_cole', '🧗', '#FFD2D2', 8888, true, 'Summit reached! ⛰️'),
('surfer_sophie', '🏄‍♀️', '#FFCFCF', 9999, false, NULL),
('dancer_diana', '💃', '#FFCCCC', 1212, true, 'Rehearsal time 🩰'),
('boxer_ben', '🥊', '#FFC9C9', 2323, false, NULL),

-- Creative types
('music_maker', '🎹', '#E0FFFF', 3434, true, 'New beat drop 🎵'),
('photo_fanatic', '📸', '#E6FFFF', 4545, false, NULL),
('film_buff', '🎬', '#ECFFFF', 5656, true, 'Movie marathon 🍿'),
('writer_wendy', '✍️', '#F2FFFF', 6767, false, NULL),
('painter_paul', '🖌️', '#F8FFFF', 7878, true, 'Canvas complete 🎨'),
('sculptor_sarah', '🗿', '#FEFFFF', 8989, false, NULL),
('poet_peter', '📝', '#F0FFF0', 9090, true, 'Open mic night 🎤'),
('actor_adam', '🎭', '#F5FFF5', 1313, false, NULL),
('singer_stella', '🎤', '#FAFFFA', 2424, true, 'Recording session 🎵'),
('dj_derek', '🎧', '#FFFFF5', 3535, false, NULL),

-- Food lovers
('foodie_frank', '🍔', '#FFF5F0', 4646, true, 'Food truck find! 🚚'),
('baker_betty', '🥐', '#FFF0F0', 5757, false, NULL),
('chef_charlie', '👨‍🍳', '#FFEBEB', 6868, true, 'Plating perfection 🍽️'),
('wine_wendy', '🍷', '#FFE6E6', 7979, false, NULL),
('beer_brian', '🍺', '#FFE1E1', 8080, true, 'Brewery tour 🍻'),
('dessert_dana', '🍰', '#FFDCDC', 9191, false, NULL),
('snack_attack', '🍿', '#FFD7D7', 1414, true, 'Movie snacks 🎬'),
('smoothie_sue', '🥤', '#FFD2D2', 2525, false, NULL),
('grill_master', '🔥', '#FFCDCD', 3636, true, 'BBQ time! 🍖'),
('veggie_victor', '🥗', '#FFC8C8', 4747, false, NULL),

-- Travel themed
('world_wanderer', '🌍', '#F0E68C', 5858, true, 'Airport vibes ✈️'),
('beach_bum', '🏖️', '#F5E6A3', 6969, false, NULL),
('mountain_man', '⛰️', '#FAE1B4', 7070, true, 'Peak views 🏔️'),
('city_explorer', '🏙️', '#FFDCC5', 8181, false, NULL),
('road_tripper', '🚗', '#FFD7D6', 9292, true, 'Route 66! 🛣️'),
('island_hopper', '🏝️', '#FFD2E7', 1515, false, NULL),
('adventure_amy', '🗺️', '#FFCDF8', 2626, true, 'New destination 📍'),
('nomad_nick', '🎒', '#FFC8FF', 3737, false, NULL),
('tourist_tina', '📷', '#FFC3FF', 4848, true, 'Landmark selfie 🤳'),
('pilot_pete', '✈️', '#FFBEFF', 5959, false, NULL),

-- Animal lovers
('dog_walker', '🐕‍🦺', '#FFB9FF', 6060, true, 'Park day! 🌳'),
('cat_cafe_fan', '☕😺', '#FFB4FF', 7171, false, NULL),
('bird_watcher', '🦜', '#FFAFFF', 8282, true, 'Rare sighting! 🦅'),
('horse_girl', '🐴', '#FFAAFF', 9393, false, NULL),
('bunny_lover', '🐰', '#FFA5FF', 1616, true, 'Bunny cuddles 🐇'),
('fish_keeper', '🐠', '#FFA0FF', 2727, false, NULL),
('reptile_rex', '🦎', '#FF9BFF', 3838, true, 'New gecko! 🦎'),
('hamster_haver', '🐹', '#FF96FF', 4949, false, NULL),
('zoo_enthusiast', '🦁', '#FF91FF', 5050, true, 'Zoo trip! 🦒'),
('marine_lover', '🐋', '#FF8CFF', 6161, false, NULL),

-- Nature enthusiasts
('plant_parent', '🪴', '#98FB98', 7272, true, 'Repotting day 🌱'),
('flower_child', '🌼', '#90EE90', 8383, false, NULL),
('tree_hugger', '🌳', '#88DD88', 9494, true, 'Forest walk 🌲'),
('garden_guru', '🌻', '#80CC80', 1717, false, NULL),
('nature_nut', '🍃', '#78BB78', 2828, true, 'Sunrise hike 🌄'),
('eco_warrior', '♻️', '#70AA70', 3939, false, NULL),
('green_thumb', '🌿', '#689968', 4040, true, 'Harvest time 🥕'),
('outdoor_ollie', '⛺', '#608860', 5151, false, NULL),
('camping_carl', '🏕️', '#587758', 6262, true, 'Campfire stories 🔥'),
('stargazer_sam', '🌟', '#506650', 7373, false, NULL),

-- Fashion/beauty
('style_queen', '👗', '#FFB6C1', 8484, true, 'OOTD 💅'),
('makeup_maven', '💄', '#FFA0B4', 9595, false, NULL),
('fashion_forward', '👠', '#FF8AA7', 1818, true, 'Shopping haul 🛍️'),
('trendy_tara', '✨', '#FF749A', 2929, false, NULL),
('glam_girl', '💅', '#FF5E8D', 3030, true, 'Spa day 💆‍♀️'),
('shoe_addict', '👟', '#FF4880', 4141, false, NULL),
('accessory_ace', '👜', '#FF3273', 5252, true, 'New bag alert 👛'),
('denim_diva', '👖', '#FF1C66', 6363, false, NULL),
('vintage_vibe', '🕰️', '#FF0659', 7474, true, 'Thrift finds 🛍️'),
('boho_babe', '🌻', '#FF004C', 8585, false, NULL),

-- Miscellaneous fun
('night_owl', '🦉', '#4B0082', 9696, true, 'Late night vibes 🌙'),
('early_bird', '🐦', '#8B008B', 1919, false, NULL),
('party_animal', '🎉', '#9400D3', 2020, true, 'Friday night! 🎊'),
('bookworm_bob', '📚', '#9932CC', 3131, false, NULL),
('movie_buff', '🎥', '#BA55D3', 4242, true, 'Cinema time 🍿'),
('tv_junkie', '📺', '#DA70D6', 5353, false, NULL),
('podcast_pat', '🎙️', '#EE82EE', 6464, true, 'New episode! 🎧'),
('news_nerd', '📰', '#FF00FF', 7575, false, NULL),
('trivia_tim', '🧠', '#FF1493', 8686, true, 'Quiz night! 🤓'),
('puzzle_pro', '🧩', '#FF69B4', 9797, false, NULL),

-- Final batch to reach 200
('sleepy_steve', '😴', '#FFB6DB', 1234, false, NULL),
('energetic_emma', '⚡', '#FFA6CB', 2345, true, 'Feeling pumped! 💪'),
('chill_charlie', '😌', '#FF96BB', 3456, false, NULL),
('busy_bee', '🐝', '#FF86AB', 4567, true, 'Productive day 📝'),
('lazy_larry', '🦥', '#FF769B', 5678, false, NULL),
('happy_hannah', '😊', '#FF668B', 6789, true, 'Good vibes ✨'),
('grumpy_gus', '😤', '#FF567B', 7890, false, NULL),
('silly_sarah', '🤪', '#FF466B', 8901, true, 'Being goofy 🤡'),
('serious_sam', '🧐', '#FF365B', 9012, false, NULL),
('funny_fred', '😂', '#FF264B', 1357, true, 'Comedy show! 🎭'),
('quiet_quinn', '🤫', '#FF163B', 2468, false, NULL),
('loud_lisa', '📢', '#FF062B', 3579, true, 'Karaoke night! 🎤'),
('shy_shane', '😳', '#FF001B', 4680, false, NULL),
('bold_brenda', '💪', '#FF000B', 5791, true, 'Taking risks! 🎲'),
('creative_craig', '🎨', '#EF0000', 6802, false, NULL),
('logical_laura', '🤔', '#DF0000', 7913, true, 'Problem solved! 💡'),
('random_randy', '🎲', '#CF0000', 8024, false, NULL),
('organized_olivia', '📋', '#BF0000', 9135, true, 'Planner ready 📅'),
('messy_mike', '🌪️', '#AF0000', 1246, false, NULL),
('final_user', '🏁', '#9F0000', 9999, true, 'Made it to 200! 🎉');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;