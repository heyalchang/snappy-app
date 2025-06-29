# SnapClone User Flows Documentation

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Main Navigation](#main-navigation)
3. [Camera & Media Flow](#camera--media-flow)
4. [Chat & Messaging Flow](#chat--messaging-flow)
5. [Friends Management Flow](#friends-management-flow)
6. [Stories Flow](#stories-flow)
7. [Profile Flow](#profile-flow)

---

## Authentication Flow

### Sign Up Flow
1. **AuthScreen** → User enters username
2. System creates account with `username@nulldomain.com` and password "qwerty"
3. **UsernameScreen** → Confirms username and generates random avatar (emoji + pastel color)
4. User lands on **MainTabs** (Camera screen)

### Sign In Flow
1. **AuthScreen** → User enters existing username
2. System authenticates with stored credentials
3. User lands on **MainTabs** (Camera screen)

---

## Main Navigation

### Tab Navigation Structure
- **Camera** (Center/Home) - Default landing screen
- **Chat List** (Left tab)
- **Stories** (Right tab)
- **Profile** (Accessed from camera screen top-right)

### Navigation Rules
- Swipe gestures between main screens
- Tab bar always visible except in:
  - Media preview screens
  - Individual chat screens
  - Story viewer

---

## Camera & Media Flow

### Photo Capture Flow
1. **CameraScreen** → User taps capture button
2. Photo taken with selected filter applied (None, B&W, Sepia, Vintage, Face)
3. **MediaPreviewScreen** shows captured photo
   - Options: Retake, Save to Gallery, Add Caption
   - Send options: "My Story" or "Send" (to self)
   - If from chat context: Only shows "Send" to that friend

### Video Recording Flow (Currently Disabled)
- Long press capture button shows "Video recording not supported with filters"
- GL-React limitation prevents video recording with real-time filters

### Filter Selection
- Horizontal carousel below camera view
- Real-time preview of selected filter
- Face filter shows animated sunglasses overlay

### From Chat Context
1. **ChatScreen** → Tap camera button
2. **CameraScreen** opens with chat context
3. After capture → **MediaPreviewScreen**
4. Send → Returns to **ChatScreen** (pops 2 screens)

---

## Chat & Messaging Flow

### Chat List Flow
1. **ChatListScreen** shows all conversations
2. Pull-to-refresh updates list
3. Shows: Avatar, username, last message, timestamp, unread count
4. Tap conversation → **ChatScreen**

### Individual Chat Flow
1. **ChatScreen** displays message history
2. Message types: Text, Photo, Video
3. Send text: Type message → Send button
4. Send media: Camera button → Camera flow with chat context
5. Auto-scroll to bottom on new messages
6. Real-time updates via Supabase subscription

### Auto-Response System
- All friends send auto-response 1-3 seconds after receiving message
- Responses pulled from preset array (e.g., "Hey! 👋", "That's awesome!")
- Creates natural conversation flow for demo

---

## Friends Management Flow

### Add Friend Flow
1. **Profile/FriendsScreen** → "Add Friends" button
2. **AddFriendScreen** → Enter username
3. If user exists → Instant friendship created
4. If user doesn't exist:
   - System pulls next unused fake profile
   - Creates auth account with entered username
   - Uses fake profile's avatar and snap score
   - Creates instant friendship
   - Marks fake profile as used

### Friends List Flow
1. **FriendsListScreen** shows all friends
2. Displays: Avatar, username, display name
3. No unfriend option (simplified for MVP)
4. Tap friend → Opens chat with them

---

## Stories Flow

### Posting Story Flow
1. **CameraScreen** → Capture photo
2. **MediaPreviewScreen** → "My Story" button
3. Story posted with 24-hour expiration (not enforced in MVP)
4. User returned to main tabs

### Viewing Stories Flow
1. **StoriesScreen** shows grid of friends with active stories
2. Story indicators: Profile pic with ring
3. Tap story → **StoryViewerScreen**
4. Story viewer features:
   - Full-screen media display
   - Caption overlay
   - Tap to advance to next story
   - Auto-advance between users
   - Shows view count (not implemented)

### Fake Friends Stories
- Some fake profiles have pre-made stories
- Use placeholder images from picsum.photos
- Appear immediately in stories feed

---

## Profile Flow

### Profile Screen Access
1. From **CameraScreen** → Top-right profile button
2. Shows:
   - Large avatar (emoji + color)
   - Username and display name
   - Snap Score (sent + received messages)
   - Stats: Friends count, stories posted, snaps sent
   - "My Story" preview if active

### Profile Actions
- **Add Friends** → AddFriendScreen
- **My Friends** → FriendsListScreen  
- **Settings** → Logout only

### Snap Score Calculation
- Increments on sending messages
- Increments on receiving messages
- Stored in profiles table
- Updates in real-time

---

## Technical Notes

### Navigation Stack
- Uses React Navigation with nested navigators
- Main stack contains auth screens and tab navigator
- Tab navigator contains main screens
- Modal presentations for media preview and story viewer

### State Management
- AuthContext for user state
- Local component state for UI
- Supabase real-time for chat updates
- No global state management (Redux, etc.)

### Data Flow
- All data persisted in Supabase
- Real-time subscriptions for messages
- Optimistic updates for better UX
- Auto-responses handled server-side

---

## Edge Cases & Limitations

1. **No offline support** - Requires active internet
2. **No push notifications** - Must have app open
3. **No screenshot detection** - Privacy feature not implemented
4. **No message deletion** - Messages persist forever
5. **No typing indicators** - Simplified chat experience
6. **No read receipts** - Messages marked as read internally only
7. **Stories don't expire** - 24-hour limit not enforced
8. **Video recording disabled** - GL-React limitation

---

*Last Updated: December 2024*
*Version: 1.0 (MVP)*