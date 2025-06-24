-- ───────────────────────────────
-- Migration: Insert Fake Profile Data
-- Date: 2024-12-24
-- Purpose: Insert initial fake profiles (20 for testing, expand to 200 later)
-- ───────────────────────────────

-- First batch of fake profiles
INSERT INTO public.fake_profiles (username, avatar_emoji, avatar_color, snap_score, has_story, story_caption) VALUES
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
('xxcoder_boyxx', '💻', '#D8BFD8', 1337, false, NULL),
('vibes_only23', '🌈', '#F5DEB3', 4200, true, 'Good vibes only ✌️'),
('no_cap_fr', '🧢', '#FFC0CB', 6969, false, NULL),
('aesthetic.girl', '🌙', '#E0FFFF', 8888, true, 'Midnight thoughts 💭'),
('gamer_dude420', '🎯', '#FAFAD2', 3141, false, NULL),
('plant_mom_life', '🌿', '#90EE90', 5555, true, 'New succulent! 🪴'),
('gym_bro_2024', '💪', '#FFE4B5', 7777, false, NULL),
('bookworm.beth', '📖', '#FFF0F5', 2468, true, 'Current read 📚'),
('skater.steve', '🛹', '#F0FFF0', 1357, false, NULL),
('artsy.annie', '🎨', '#FFF5EE', 9999, true, 'Gallery visit 🖼️')
ON CONFLICT (username) DO NOTHING;

-- Note: The full 02_fake_profiles.sql contains 200 profiles
-- This subset is sufficient for initial testing