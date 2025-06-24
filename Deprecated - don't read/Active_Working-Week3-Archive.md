# Active Working Document

## Week 3 Goal: Auth Refactor + Snap Storage & Viewing
First refactor auth to fix Firebase issues, then continue with snap storage implementation.

### Core Principles
- **Simplicity First**: Class project, use defaults, basic error handling
- **Requirements Only**: Build ONLY what's in the PRD
- **MVP Focus**: Working > Perfect
- **Minimal Dependencies**: Only add packages when necessary
- **Linear Check**: Previous week must have user acceptance sign-off ✅

## Progress Tracker

### Track 0: Auth Refactor (Priority Fix)
- [x] Remove Firebase Auth SDK completely
- [x] Delete phone verification screens
- [x] Update AuthScreen with username/password
- [x] Create simpleAuth.ts service
- [x] Create AuthContext for state management
- [x] Update Navigation to use context
- [x] Update all user.uid references to username

### Track 1: Firebase Storage
- [x] Add send button to MediaPreviewScreen
- [x] Upload photos/videos to Firebase Storage
- [x] Create snap documents in Firestore
- [x] Show loading state during upload
- [x] Navigate to home after successful send

### Track 2: Snap Lifecycle
- [x] Create snap inbox screen (view sent snaps)
- [x] Send snap to self for testing
- [x] View snap with tap-and-hold gesture
- [x] Auto-delete snap after viewing
- [ ] Implement 24-hour story expiration (Cloud Function)

### 📝 Notes
- Week 2 signed off on December 23, 2024
- Video recording bug resolved with workaround
- Firebase Storage integration complete
- Snap lifecycle working: capture → send → view → delete
- Created HomeScreen as main navigation hub
- All screens connected in Navigation.tsx

### 🐛 Issues Encountered
- Firebase Auth runtime error "Component auth has not been registered yet"
  - Root cause: Firebase Auth SDK initialization timing issues with React Native
  - Solution: Removed Firebase Auth completely, implemented simple username/password auth
  - Documented in Linear issue POT-18

### 🎯 Exit Criteria (from Technical Plan)
**Firebase Storage:**
- [x] Media uploads successfully
- [x] Snap metadata saved to Firestore
- [x] Upload progress shown to user

**Snap Lifecycle:**
- [x] Can send snap to self
- [x] Snap disappears after viewing
- [ ] Stories expire after 24 hours (Cloud Function needed)
- [x] View count increments (viewedBy array)

### 🏁 MVP Milestone
User can capture, send to self, and watch snap disappear