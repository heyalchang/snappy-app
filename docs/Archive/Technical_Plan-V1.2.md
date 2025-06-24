# SnapClone Technical Implementation Plan - MVP (V1.2)

## Version History
- **V1.0** - Original plan with Firebase Phone Auth
- **V1.1** - Simplified to username/password auth (no Firebase Auth SDK)
- **V1.2** - Migration to Supabase, unified chat architecture, fake friends system

## Core Principles
- **Readability First** - Clear, simple code that's easy to understand
- **Feature Flags** - Toggle features for phased development and testing
- **Maintainability** - Modular structure, clear separation of concerns
- **Happy Path Only** - This is a class demo, not production
- **Simplest Implementation** - Always choose the simplest approach that works

## Tech Stack
- **Expo SDK**: 53.0.12
- **React Native**: 0.79.4
- **TypeScript**: 5.8.3
- **expo-camera**: 16.x (uses new CameraView API)
- **Supabase**: Auth, Database, Storage, Realtime
- **UI State**: React Context (no Redux)
- **Navigation**: React Navigation 6

## Architecture Overview

### Frontend Structure
```
src/
  screens/          # One file per screen
  components/       # Reusable UI components
  services/         # Supabase client and API calls
  contexts/         # Auth and app state
  utils/            # Helper functions
  types/            # TypeScript interfaces
  constants/        # Feature flags and config
```

### Feature Flags (constants/features.ts)
```typescript
export const FEATURES = {
  STORIES_ENABLED: true,
  FAKE_FRIENDS_ENABLED: true,
  AUTO_DELETE_SNAPS: false,  // For demo, keep snaps
  FILTERS_ENABLED: false,    // Phase 6+
  GROUP_CHAT_ENABLED: false, // Future
};
```

---

## Phase 1: Foundation & Authentication ✅
**Status**: Completed with Firebase
**Completion Date**: December 23, 2024

---

## Phase 2: Camera & Media Capture ✅
**Status**: Completed with Firebase
**Completion Date**: December 23, 2024

---

## Phase 3: Snap Storage & Viewing ✅
**Status**: Completed with Firebase (needs migration)
**Completion Date**: December 24, 2024

---

## Phase 4: Architecture Restructure & Migration Planning ✅
**Timeline**: December 24, 2024
**Status**: Completed (this document)

### Tasks Completed:
- [x] Decided to migrate from Firebase to Supabase
- [x] Designed unified chat architecture (no separate snap inbox)
- [x] Created fake friends system design
- [x] Updated Product Requirements to V1.2
- [x] Created migration SQL scripts
- [x] Documented all decisions

### Key Decisions:
1. **Supabase over Firebase** - Simpler auth, better for demo
2. **Unified Chat** - Photos/videos are just messages
3. **Instant Friends** - No accept/decline flow
4. **Fake Friends** - 200 pre-populated profiles
5. **Username Auth** - username@nulldomain.com trick

---

## Phase 5: Supabase Migration & Core Features
**Timeline**: Week 4 (December 25-31, 2024)
**Goal**: Migrate to Supabase and implement unified chat architecture

### Track 1: Supabase Setup & Auth Migration
**Tasks:**
- [ ] Install Supabase client library
- [ ] Configure Supabase connection
- [ ] Implement username-only auth (username@nulldomain.com)
- [ ] Create AuthContext with Supabase
- [ ] Update all auth flows

**Implementation Notes:**
```typescript
// services/supabase.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Username auth trick
const email = `${username}@nulldomain.com`;
const { data, error } = await supabase.auth.signUp({
  email,
  password: 'default123', // Same for all users
});
```

### Track 2: Unified Chat Implementation
**Tasks:**
- [ ] Update messages table (add type, media_url)
- [ ] Create ChatService with deterministic room IDs
- [ ] Implement text messaging
- [ ] Implement photo/video messages
- [ ] Setup realtime subscriptions

**Room ID Strategy:**
```typescript
const getRoomId = (user1: string, user2: string) => {
  return `dm_${[user1, user2].sort().join('_')}`;
};
```

### Track 3: Media Upload to Supabase Storage
**Tasks:**
- [ ] Create "media" bucket in Supabase
- [ ] Implement photo upload
- [ ] Implement video upload
- [ ] Update MediaPreviewScreen to use Supabase
- [ ] Add loading states

### Exit Criteria:
- [ ] Can create account with username
- [ ] Can send text message
- [ ] Can send photo/video (shows in chat)
- [ ] Messages update in real-time
- [ ] All data in Supabase

---

## Phase 6: Friends System & Profiles
**Timeline**: Week 5 (January 1-7, 2025)
**Goal**: Implement friends, profiles, and fake friends system

### Track 1: Profile System
**Tasks:**
- [ ] Create ProfileScreen with stats
- [ ] Generate avatar (pastel bg + emoji)
- [ ] Calculate snap score
- [ ] Display friend count
- [ ] Add settings/logout

**Avatar Generation:**
```typescript
const generateAvatar = (username: string) => {
  const colors = ['#FFB6C1', '#E6E6FA', '#98FB98', ...];
  const emojis = ['😎', '🦄', '🎮', '🌸', ...];
  return {
    color: colors[hash(username) % colors.length],
    emoji: emojis[hash(username) % emojis.length]
  };
};
```

### Track 2: Friends Management
**Tasks:**
- [ ] Implement instant friendship (no requests)
- [ ] Create AddFriendScreen
- [ ] Create FriendsListScreen
- [ ] Update friendships table queries

### Track 3: Fake Friends System
**Tasks:**
- [ ] Run 02_fake_profiles.sql migration
- [ ] Implement fake friend creation
- [ ] Add counter tracking
- [ ] Create some fake stories
- [ ] Test with 10-20 fake friends

**Fake Friend Flow:**
```typescript
const addFriend = async (username: string) => {
  const exists = await checkUserExists(username);
  if (!exists) {
    await createFakeUser(username);
  }
  await createFriendship(currentUser, username);
};
```

### Exit Criteria:
- [ ] Can view profile with stats
- [ ] Can add existing friend
- [ ] Can add non-existent friend (creates fake)
- [ ] Friends list shows all friends
- [ ] Some friends have stories

---

## Phase 7: Stories Feature
**Timeline**: Week 6 (January 8-14, 2025)
**Goal**: Implement stories (posts visible to all friends)

### Track 1: Story Creation
**Tasks:**
- [ ] Update camera flow for story option
- [ ] Create story in posts table
- [ ] Upload story media
- [ ] Add to "My Story"

### Track 2: Story Viewing
**Tasks:**
- [ ] Create StoriesScreen (grid of friends)
- [ ] Create StoryViewerScreen
- [ ] Implement tap to advance
- [ ] Track story views
- [ ] Show view count

### Track 3: Story Management
**Tasks:**
- [ ] Query friends' active stories
- [ ] Show story preview on profile
- [ ] Add story indicators
- [ ] No expiration for demo

### Exit Criteria:
- [ ] Can post to story from camera
- [ ] Can see friends with stories
- [ ] Can view stories sequentially
- [ ] Can see who viewed my story
- [ ] Stories persist (no 24h deletion)

---

## Phase 8: Polish & Demo Prep
**Timeline**: Week 7 (January 15-21, 2025)
**Goal**: Polish UI/UX and prepare for demo

### Track 1: UI Polish
**Tasks:**
- [ ] Add pull-to-refresh everywhere
- [ ] Implement skeleton loading states
- [ ] Create empty state graphics
- [ ] Smooth all transitions
- [ ] Fix any UI glitches

### Track 2: Demo Data
**Tasks:**
- [ ] Create 20+ fake friends with stories
- [ ] Add sample conversations
- [ ] Populate some snap scores
- [ ] Test full user journey

### Track 3: Performance & Testing
**Tasks:**
- [ ] Test on real device
- [ ] Fix any crashes
- [ ] Optimize image/video upload
- [ ] Ensure realtime works smoothly
- [ ] Practice demo flow

### Exit Criteria:
- [ ] App feels polished and smooth
- [ ] Demo account has rich content
- [ ] No crashes during typical use
- [ ] Can demo all features in 5 minutes
- [ ] README with setup instructions

---

## Development Guidelines

### Code Style
- Use functional components with hooks
- Async/await over promises
- Clear variable names (no abbreviations)
- Comment complex logic
- Extract magic numbers to constants

### Error Handling
```typescript
try {
  const result = await someOperation();
  // Happy path
} catch (error) {
  console.error('Operation failed:', error);
  Alert.alert('Oops!', 'Something went wrong. Please try again.');
}
```

### State Management
- Auth state in AuthContext
- Local UI state with useState
- Server state with react-query or SWR (if needed)
- No global state management library

### Testing Approach
- Manual testing for MVP
- Focus on happy path
- Test on iOS simulator primarily
- Document any device-specific issues

---

## Success Metrics

1. **Demo Success**: Can complete full user journey without crashes
2. **Feature Complete**: All V1.2 features implemented
3. **Visual Polish**: Looks and feels like Snapchat
4. **Performance**: Messages load instantly, uploads complete quickly
5. **Code Quality**: Clean, readable, maintainable

---

## Risk Mitigation

1. **Supabase Limits**: Monitor free tier usage
2. **Complexity Creep**: Stick to V1.2 scope
3. **Time Constraints**: Prioritize core features
4. **Demo Failures**: Have backup video/screenshots

---

**Remember**: This is a class project. Make it work, make it simple, make it look good. Ship it!