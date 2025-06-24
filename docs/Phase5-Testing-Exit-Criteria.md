# Phase 5: Testing & Exit Criteria

## Phase 5: Supabase Migration & Core Features
**Timeline**: Week 4 (December 25-31, 2024)
**Goal**: Migrate to Supabase and implement unified chat architecture

---

## Testing Plan

### Prerequisites
1. Expo development server running (`npm start`)
2. iOS Simulator or Android Emulator ready
3. Supabase project active (qjoszotrtdpneednzjor)
4. Test on one platform first (iOS recommended)

---

## Track 1: Supabase Setup & Auth Migration ✅ COMPLETED

### Test Cases

#### 1.1 New User Sign Up
**Steps:**
1. Launch app fresh (no existing auth)
2. Tap "Sign Up" on auth screen
3. Enter username: `testuser123`
4. Tap "SIGN UP" button
5. Should navigate to Username screen
6. Enter display name (optional): "Test User"
7. Tap "Complete Setup"

**Expected:**
- ✅ Loading state shows during signup
- ✅ No password field required
- ✅ Navigates to Username screen on success
- ✅ After profile setup, navigates to Home
- ✅ User created in Supabase Auth (testuser123@nulldomain.com)
- ✅ User profile created in users table

#### 1.2 Existing User Sign In
**Steps:**
1. Force close and relaunch app
2. Enter username: `testuser123`
3. Tap "LOG IN" button

**Expected:**
- ✅ User signs in successfully
- ✅ Navigates directly to Home (skips Username screen)
- ✅ Auth persists across app restarts

#### 1.3 Invalid Username Sign In
**Steps:**
1. Enter username: `nonexistentuser999`
2. Tap "LOG IN" button

**Expected:**
- ✅ Error alert: "Invalid login credentials"
- ✅ Stays on auth screen

#### 1.4 Duplicate Username Sign Up
**Steps:**
1. Tap "Sign Up"
2. Enter username: `testuser123` (already exists)
3. Tap "SIGN UP" button

**Expected:**
- ✅ Error alert: "Username already taken"
- ✅ Stays on auth screen

---

## Track 2: Unified Chat Implementation 🚧

### Test Cases

#### 2.1 Send Text Message
**Steps:**
1. Sign in as `testuser123`
2. Navigate to chat with another user
3. Type message: "Hello world"
4. Tap send

**Expected:**
- [ ] Message appears in chat instantly
- [ ] Message saved to Supabase messages table
- [ ] Message has correct room_id format: `dm_userid1_userid2`

#### 2.2 Send Photo Message
**Steps:**
1. From chat screen, tap camera button
2. Take photo
3. Add caption: "Check this out"
4. Tap send

**Expected:**
- [ ] Photo uploads to Supabase storage
- [ ] Message appears with photo + caption
- [ ] Message type = 'photo' in database

#### 2.3 Send Video Message
**Steps:**
1. From chat screen, tap camera button
2. Hold to record video (5 seconds)
3. Add caption: "Video test"
4. Tap send

**Expected:**
- [ ] Video uploads to Supabase storage
- [ ] Message appears with video + caption
- [ ] Message type = 'video' in database
- [ ] Video plays inline in chat

#### 2.4 Realtime Message Updates
**Steps:**
1. Open app on two devices/simulators
2. Sign in as different users
3. Send message from device 1
4. Check device 2

**Expected:**
- [ ] Message appears on device 2 in real-time
- [ ] No refresh required

---

## Track 3: Media Upload to Supabase Storage ✅ COMPLETED

### Test Cases

#### 3.1 Photo Upload
**Steps:**
1. Take photo from camera
2. Check Supabase Storage dashboard

**Expected:**
- ✅ Photo uploaded to 'media' bucket
- ✅ File path: `{userId}/{timestamp}_filename`
- ✅ Public URL accessible

#### 3.2 Video Upload
**Steps:**
1. Record 10-second video
2. Check upload progress
3. Check Supabase Storage

**Expected:**
- ✅ Upload progress shown (0-100%)
- ✅ Video uploaded successfully
- ✅ Video size reasonable (<50MB for 10s)

---

## Exit Criteria Checklist

### Technical Verification ✅
- [x] Supabase client configured and connected
- [x] Auth flow works with username@nulldomain.com pattern
- [x] Messages table has type and media_url columns
- [x] Media bucket created with proper policies
- [x] ChatService uses dm_${sorted_users} pattern
- [x] Database migrations applied successfully

### Functional Testing ✅
- [x] Can create account with username only
- [x] Can send photo to self (shows in inbox)
- [x] Can send video to self (shows in inbox)
- [x] Can view snaps with tap-and-hold
- [x] Snaps auto-delete after viewing
- [x] All data stored in Supabase (not Firebase)
- [ ] Chat messaging (moved to Week 6)

### User Acceptance
- [ ] User acceptance of exit criteria

---

## Known Issues & Workarounds

### Issue 1: Chat UI Not Implemented Yet
**Status**: Expected - Track 2 implementation pending
**Workaround**: Test via Supabase dashboard queries

### Issue 2: Navigation to Chat
**Status**: HomeScreen needs chat list implementation
**Workaround**: Will be addressed in Track 2

---

## Testing Commands

### Verify Supabase Connection
```bash
# Check if tables exist
npm run supabase:check
```

### Clean Test Data
```sql
-- Run in Supabase SQL Editor
DELETE FROM auth.users WHERE email LIKE '%@nulldomain.com';
DELETE FROM public.users WHERE username LIKE 'testuser%';
DELETE FROM public.messages WHERE room_id LIKE 'dm_test%';
```

### Monitor Realtime
```javascript
// In browser console (Supabase dashboard)
supabase
  .channel('test')
  .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
    console.log('Change:', payload)
  })
  .subscribe()
```

---

## Phase 5 Completion Status

### Completed ✅
1. Supabase client setup
2. Username-only auth implementation
3. Auth context with session management
4. Database migrations applied
5. Media storage bucket configured
6. Media upload service (photos/videos)
7. Snap inbox functionality
8. Snap viewer with auto-delete
9. Bottom tab navigation
10. Complete Firebase removal

### Moved to Week 6 📋
1. Story implementation (24-hour expiration)
2. Friends system
3. Chat messaging functionality
4. Realtime subscriptions
5. Typing indicators

---

## Sign-off

**Testing completed by**: Claude + User
**Date**: June 23, 2025
**Phase 5 Exit Criteria Met**: ☐ Yes ☐ No
**Notes**: Successfully migrated to Supabase with core snap functionality working. Chat messaging deferred to Week 6 to focus on completing the migration properly.