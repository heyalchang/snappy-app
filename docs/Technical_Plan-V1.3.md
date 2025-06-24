# SnapClone Technical Implementation Plan - MVP (V1.3)

## Version History
- **V1.0** - Original plan with Firebase Phone Auth
- **V1.1** - Simplified to username/password auth (no Firebase Auth SDK)
- **V1.2** - Migration to Supabase, unified chat architecture, fake friends system
- **V1.3** - Reordered phases: Friends before Chat (logical dependency fix), removed dates

## Time Philosophy
**"Week numbers, merely labels they are. Abstract groupings for organization, not deadlines."**

Weeks are used as organizational units, not rigid timelines. Completion timestamps are added only when phases are done. Focus on logical progression, not calendar dates.

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

## Phase 5: Supabase Migration & Media Upload ✅
**Week**: 5
**Goal**: Migrate to Supabase and implement core media functionality
**Status**: COMPLETED

### Track 1: Supabase Setup & Auth Migration ✅
**Tasks:**
- [x] Install Supabase client library
- [x] Configure Supabase connection
- [x] Implement username-only auth (username@nulldomain.com)
- [x] Create AuthContext with Supabase
- [x] Update all auth flows
- [x] Remove all Firebase dependencies

**Implementation Notes:**
```typescript
// services/supabase.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Username auth with default password
const email = `${username}@nulldomain.com`;
const { data, error } = await supabase.auth.signUp({
  email,
  password: 'qwerty', // Default for all users
});
```

### Track 2: Media Upload to Supabase Storage ✅
**Tasks:**
- [x] Create "media" bucket in Supabase
- [x] Implement photo upload with base64 encoding
- [x] Implement video upload with progress tracking
- [x] Update MediaPreviewScreen to use Supabase
- [x] Add loading states and progress indicators

### Track 3: Basic Snap Functionality ✅
**Tasks:**
- [x] Update SnapInboxScreen to use Supabase
- [x] Update SnapViewScreen with tap-and-hold viewing
- [x] Implement auto-delete after viewing
- [x] Add bottom tab navigation
- [x] Fix all navigation flows

### Track 4: Database Schema Updates ✅
**Tasks:**
- [x] Applied all SQL migration scripts
- [x] Fixed schema inconsistencies
- [x] Updated TypeScript definitions to match database
- [x] Added missing profile fields
- [x] Consolidated duplicate scripts

### Exit Criteria:
- [x] Can create account with username only
- [x] Can send photo/video to self
- [x] Snaps appear in inbox
- [x] Can view snaps with tap-and-hold
- [x] Snaps auto-delete after viewing
- [x] All data stored in Supabase (not Firebase)

---

## Phase 6: Friends, Stories & Chat
**Week**: 6
**Goal**: Implement friends system, stories, and chat messaging

### Track 1: Friends System
**Tasks:**
- [ ] Create ProfileScreen with stats display
- [ ] Generate avatar (pastel bg + emoji) on signup
- [ ] Implement instant friendship (no requests)
- [ ] Create AddFriendScreen
- [ ] Create FriendsListScreen
- [ ] Update friendships table queries

### Track 2: Fake Friends System
**Tasks:**
- [ ] Run 02_fake_profiles.sql migration
- [ ] Implement fake friend creation
- [ ] Add counter tracking in system_settings
- [ ] Create some fake stories
- [ ] Test with 10-20 fake friends

### Track 3: Stories Implementation
**Tasks:**
- [ ] Update camera flow for story option
- [ ] Create story in posts table (24-hour expiration)
- [ ] Create StoriesScreen (grid of friends with stories)
- [ ] Create StoryViewerScreen with tap to advance
- [ ] Track story views and show view count

### Track 4: Chat Messaging
**Tasks:**
- [ ] Create ChatService with deterministic room IDs
- [ ] Create ChatListScreen (list of conversations)
- [ ] Create ChatScreen (individual conversation)
- [ ] Implement text messaging
- [ ] Setup realtime subscriptions
- [ ] Add typing indicators

**Room ID Strategy:**
```typescript
const getRoomId = (user1: string, user2: string) => {
  return `dm_${[user1, user2].sort().join('_')}`;
};
```

### Exit Criteria:
- [ ] Can add friends (real or fake)
- [ ] Can post and view stories
- [ ] Can send text messages to friends
- [ ] Messages update in real-time
- [ ] All core features working together

---

## Phase 7: Filters & Polish
**Week**: 7
**Goal**: Implement filters and polish the app

### Track 1: Basic Filters
**Tasks:**
- [ ] Implement Black & White filter
- [ ] Implement Sepia filter  
- [ ] Implement Vintage filter
- [ ] Add filter selection UI in camera
- [ ] Apply filters to photos before upload

### Track 2: Replicate AI Filter
**Tasks:**
- [ ] Set up Replicate API integration
- [ ] Implement one AI-powered filter
- [ ] Add loading state for AI processing
- [ ] Handle API errors gracefully
- [ ] Cache processed images

### Track 3: UI/UX Polish
**Tasks:**
- [ ] Add pull-to-refresh everywhere needed
- [ ] Implement skeleton loading states
- [ ] Create empty state graphics
- [ ] Smooth all transitions
- [ ] Fix any UI glitches
- [ ] Add haptic feedback

### Exit Criteria:
- [ ] All three basic filters working
- [ ] Replicate AI filter functional
- [ ] App feels polished and smooth
- [ ] No jarring transitions
- [ ] Consistent loading states

---

## Phase 8: Final Testing & Demo Prep
**Week**: 8
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