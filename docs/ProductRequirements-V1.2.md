# Product Requirements Document: SnapClone (V1.2)

## 1. Product Overview

### Important
This is for a **class project demonstration**, not a commercial product. We are building the simplest possible working implementation - happy path only.

**Core Principle**: SIMPLICITY ABOVE ALL
- No encryption or security features
- No complex error handling
- No offline support
- No performance optimization
- Polish where it counts (UI/UX)

### 1.1 Purpose
SnapClone is a simplified Snapchat-like mobile app for sharing photos, videos, and messages with friends. Built with React Native Expo and Supabase.

### 1.2 Simplified Scope
A working demo that shows:
- Take a photo/video
- Send it to friends in chat
- Stories that friends can view
- Real-time messaging
- Friend system with fake friends
- Profile with stats

## 2. Technical Stack

### 2.1 Frontend
- **React Native Expo** (SDK 53)
- **TypeScript**
- **Supabase Client** for auth and realtime

### 2.2 Backend (Supabase)
- **Authentication**: Username-based (username@nulldomain.com behind the scenes)
- **Database**: PostgreSQL with open permissions
- **Storage**: Supabase Storage bucket named "media"
- **Realtime**: For chat messages

## 3. Core Features (MVP)

### 3.1 Authentication
- **Username-only signup/login**
  - User picks a username (3-20 characters)
  - Behind the scenes: Create Supabase auth with `username@nulldomain.com`
  - No email verification
  - No password recovery (just sign up again with same username)

### 3.2 Profile Screen (Snapchat-style)
- **Auto-generated avatar**: Pastel background + random emoji/icon
- **Username**: Displayed prominently
- **Snap Score**: Count of sent + received messages
- **Stats**:
  - Friends count
  - Stories posted
  - Snaps sent
- **My Story**: Preview thumbnail if active
- **Quick Actions**: Settings (logout), Add Friends

### 3.3 Camera
- **Photo**: Tap to capture
- **Video**: Hold to record (10 seconds max)
- **Basic controls**:
  - Switch front/back camera
  - Flash on/off
  - Retake option
- **After capture**: 
  - Add caption
  - Choose: Send to friend(s) OR Post to story

### 3.4 Chat (Unified Interface)
- **All content in one place**: Text, photos, and videos in same conversation
- **Message types**:
  - Text messages
  - Photo messages (with optional caption)
  - Video messages (with optional caption)
- **Room IDs**: `dm_${[userId1, userId2].sort().join('_')}`
- **Live updates**: Via Supabase realtime
- **UI Details**:
  - Mine/theirs message alignment
  - Media messages show inline with tap to view full screen
  - Pull-to-refresh
  - Loading states (skeleton screens)

### 3.5 Stories
- **Post to "My Story"**: From camera, choose story instead of friend
- **Stories Feed**: See all friends' stories
- **Story Viewer**: Tap to view, auto-advance between stories
- **No expiration** for demo (would be 24h in production)
- **View count**: Show who viewed your story

### 3.6 Friends
- **Instant friends**: No accept/decline flow
- **Add by username**:
  - If exists → Instant friends
  - If not exists → Create fake friend (see 3.7)
- **Friends list**: Shows all friends with their avatars
- **No blocking or unfriending** (keep it simple)

### 3.7 Fake Friends System
- **10 pre-populated fake profiles** with:
  - Realistic usernames
  - Random avatars
  - Varied snap scores
  - Some with active stories
- **Auto-creation**: When adding non-existent username:
  1. Pull next fake profile from pool
  2. Create Supabase auth (username@nulldomain.com, password: "qwerty")
  3. Instant friendship
  4. Increment counter
- **Demo enhancement**: Some fake friends have pre-made stories

## 4. What We're NOT Building
- ❌ Push notifications
- ❌ Snap expiration/deletion
- ❌ Screenshot detection
- ❌ End-to-end encryption
- ❌ Advanced filters or AR
- ❌ Group chats (tables exist for future)
- ❌ Voice/video calls
- ❌ Discover or public content
- ❌ Memories/saved snaps
- ❌ Location features
- ❌ Read receipts
- ❌ Typing indicators

## 5. Database Schema Updates

### 5.1 Existing Tables (from 00_init.sql)
1. **profiles** - User profiles linked to auth.users
2. **friendships** - Now instant (no pending state needed)
3. **posts** - Used ONLY for stories
4. **post_recipients** - For story visibility
5. **messages** - All direct communication (needs update)
6. **groups** & **group_members** - Future use

### 5.2 Schema Changes (01_simplify_messages.sql)
```sql
-- Add to messages table:
ALTER TABLE public.messages 
ADD COLUMN type text DEFAULT 'text' CHECK (type IN ('text', 'photo', 'video')),
ADD COLUMN media_url text;
```

### 5.3 New Tables (02_fake_profiles.sql)
```sql
-- Fake profiles pool
CREATE TABLE public.fake_profiles (
  id serial PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_emoji text NOT NULL,
  avatar_color text NOT NULL,
  snap_score integer DEFAULT 0,
  has_story boolean DEFAULT false,
  used boolean DEFAULT false
);

-- System settings
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
-- Insert: ('next_fake_profile_id', '1')
```

## 6. UI/UX

### 6.1 Screens
1. **Auth Screen** - Username input, yellow Snapchat-like design
2. **Camera Screen** - Full screen camera view (main screen)
3. **Preview Screen** - After capture: add caption, choose recipients or story
4. **Chat List** - All conversations
5. **Chat Screen** - Individual conversation with mixed content
6. **Stories Screen** - Grid of friends with stories
7. **Story Viewer** - Full screen story playback
8. **Friends Screen** - Friends list and add friend
9. **Profile Screen** - Stats, settings, my story

### 6.2 Navigation
- **Tab Bar**: Camera (center), Chat (left), Stories (right), Profile (top-right)
- **Swipe gestures**: Between main screens
- **Yellow/Ghost theme**: Keep the Snapchat aesthetic

### 6.3 Polish Features
- Pull-to-refresh on lists
- Skeleton loading states
- Empty states with icons
- Smooth transitions
- Auto-generated colorful avatars

## 7. Success Criteria

This is successful if we can demo:
1. ✅ Create account with username
2. ✅ Take photo and send to friend (shows in chat)
3. ✅ Send text message in same chat
4. ✅ Post a story
5. ✅ View friend's story
6. ✅ Add a friend (real or fake)
7. ✅ See profile with snap score
8. ✅ Real-time message updates

## 8. Implementation Notes

- **Project**: Supabase project "exoneshot" (ID: qjoszotrtdpneednzjor)
- **Region**: us-west-1
- **Storage Bucket**: Create "media" bucket with public access
- **Environment**: Development only
- **Demo Data**: Pre-populate fake friends with stories

---

**Remember**: This is a class project. Make it work, make it simple, make it look good. Ship it.