# Schema Evolution V1.2

## Overview
This document explains the database schema changes made for V1.2 of the SnapClone project. The main goal was to simplify the architecture to match how Snapchat actually works.

## Key Insight
In Snapchat, there's no separate "snap inbox" - all photos, videos, and text messages appear in the same chat conversation. This simplification makes the app more intuitive and easier to implement.

## Changes Made

### 1. Messages Table Enhancement (01_simplify_messages.sql)

**Before**: Messages could only contain text
**After**: Messages can be text, photos, or videos

```sql
ALTER TABLE public.messages 
ADD COLUMN type text DEFAULT 'text' CHECK (type IN ('text', 'photo', 'video')),
ADD COLUMN media_url text;
```

This means:
- `type='text'`: Regular text message, `content` has the message
- `type='photo'`: Photo message, `media_url` points to image, `content` is optional caption
- `type='video'`: Video message, `media_url` points to video, `content` is optional caption

### 2. Room ID Strategy

Instead of a separate conversations table, we use deterministic room IDs:
- **Direct Messages**: `dm_${[userId1, userId2].sort().join('_')}`
  - Example: `dm_user123_user456`
  - Always generates the same ID regardless of who initiates
- **Future Groups**: `group_${groupId}`
  - Example: `group_550e8400-e29b-41d4-a716-446655440000`

### 3. Clarified Table Purposes

- **messages**: All direct communication (text + media)
- **posts**: Stories ONLY (not direct snaps)
- **post_recipients**: Controls who can see stories
- **friendships**: Now instant (no pending state)

### 4. Fake Profiles System (02_fake_profiles.sql)

Created two new tables:

**fake_profiles**: Pool of 200 pre-made profiles
- Realistic usernames
- Random pastel avatar colors
- Emoji avatars
- Varied snap scores
- Some with pre-made stories

**system_settings**: Tracks which fake profile to use next
- Key: `next_fake_profile_id`
- Increments as fake friends are created

## Benefits

1. **Simpler Mental Model**: Everything is just messages in a chat
2. **Easier Implementation**: No need for separate snap viewing logic
3. **More Authentic**: Matches real Snapchat behavior
4. **Better Demo**: Fake friends make the app feel alive

## Migration Steps

1. Run `01_simplify_messages.sql` to add media support to messages
2. Run `02_fake_profiles.sql` to create fake profile system
3. Update app code to:
   - Send photos/videos as messages
   - Use deterministic room IDs
   - Auto-create fake friends when needed

## Future Considerations

- When adding groups, just use `group_` prefix for room IDs
- Could add message reactions by adding a reactions table
- Could add disappearing messages by adding an `expires_at` column