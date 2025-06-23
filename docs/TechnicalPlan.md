# SnapClone Technical Implementation Plan - MVP

## Core Principles
- **Simplest path to MVP** - This is a class project, not commercial
- **Requirements only** - No extra features beyond PRD
- **Basic security only** - HTTPS and Firebase auth is sufficient
- **Working > Perfect** - Focus on functionality over optimization

---

## Week 1: Foundation & Authentication

### Track: Project Setup
**Tasks:**
- `expo init` with TypeScript template
- Basic ESLint setup (no pre-commit hooks)
- Single Firebase project (no dev/staging/prod)
- Simple .env for Firebase config

**Exit Checklist:**
- [ ] Expo app runs on simulator
- [ ] TypeScript compiles without errors
- [ ] Firebase project created with basic config

### Track: Phone Authentication
**Tasks:**
- Firebase Phone Auth setup
- Basic SMS verification flow
- Simple user profile creation screen
- Username uniqueness check

**Exit Checklist:**
- [ ] User can sign in with phone number
- [ ] User profile saved to Firestore
- [ ] Basic navigation to main app after auth

---

## Week 2: Camera & Media Capture

### Track: Camera Implementation
**Tasks:**
- expo-camera basic setup
- Tap for photo, hold for video (10s max)
- Front/back camera toggle
- Flash on/off toggle

**Exit Checklist:**
- [ ] Camera opens when app launches
- [ ] Can capture photos
- [ ] Can record videos up to 10 seconds
- [ ] Camera controls work

### Track: Media Preview
**Tasks:**
- Show captured media fullscreen
- Retake button
- Caption text input
- Save to camera roll option

**Exit Checklist:**
- [ ] Preview shows after capture
- [ ] Can add caption text
- [ ] Can save to device gallery
- [ ] Can retake photo/video

---

## Week 3: Snap Storage & Viewing

### Track: Firebase Storage
**Tasks:**
- Upload photos/videos to Firebase Storage
- Create snap documents in Firestore
- Basic loading states during upload

**Exit Checklist:**
- [ ] Media uploads successfully
- [ ] Snap metadata saved to Firestore
- [ ] Upload progress shown to user

### Track: Snap Lifecycle
**Tasks:**
- Send snap to self for testing
- View snap with tap-and-hold
- Auto-delete after viewing
- 24-hour story expiration (Cloud Function)

**Exit Checklist:**
- [ ] Can send snap to self
- [ ] Snap disappears after viewing
- [ ] Stories expire after 24 hours
- [ ] View count increments

### 🎯 **MVP Milestone**: User can capture, send to self, and watch snap disappear

---

## Week 4: Social Features & Messaging

### Track: Friends System
**Tasks:**
- Add friend by username
- Accept/decline friend requests
- Basic friends list screen

**Exit Checklist:**
- [ ] Can search and add friends
- [ ] Friend requests work both ways
- [ ] Friends list displays correctly

### Track: Direct Messaging
**Tasks:**
- Create conversation when sending snap
- Text message input
- Typing indicators
- Read receipts

**Exit Checklist:**
- [ ] Can send text messages
- [ ] Messages appear in real-time
- [ ] Typing indicators work
- [ ] Read receipts update

### Track: Stories Feed
**Tasks:**
- Show friends' stories in list
- Story thumbnails
- Mark as viewed/unviewed
- Auto-advance through stories

**Exit Checklist:**
- [ ] Stories feed loads
- [ ] Can view friends' stories
- [ ] Stories marked as viewed
- [ ] Auto-advance works

---

## Week 5: Offline Support & Polish

### Track: Offline Handling
**Tasks:**
- Queue snaps when offline (AsyncStorage)
- Upload when connection returns
- Show offline state in UI
- Cache recent messages

**Exit Checklist:**
- [ ] Snaps queue when offline
- [ ] Auto-upload when online
- [ ] UI shows connection state
- [ ] Can read cached messages offline

### Track: Basic Polish
**Tasks:**
- Loading states for all async operations
- Error alerts for failures
- Pull-to-refresh on feeds
- Basic empty states

**Exit Checklist:**
- [ ] No crashes during normal use
- [ ] Errors show user-friendly messages
- [ ] Loading states prevent confusion
- [ ] Empty states guide user

---

## Week 6: Filters & Final MVP

### Track: Filter System
**Tasks:**
- Create filter plugin interface
- Implement B&W, Sepia, Vintage filters
- Basic brightness/contrast sliders
- Filters apply before sending

**Exit Checklist:**
- [ ] Three basic filters work
- [ ] Can adjust brightness/contrast
- [ ] Filters visible in preview
- [ ] Filtered snaps send correctly

### Track: Replicate AI Filter
**Tasks:**
- Create Cloud Function for Replicate API
- Add one AI filter (e.g., cartoon style)
- Show loading during AI processing
- Fallback if API fails

**Exit Checklist:**
- [ ] Replicate API integrated
- [ ] One AI filter works
- [ ] Loading state during processing
- [ ] Graceful failure handling

### Track: Final Testing
**Tasks:**
- Test all features end-to-end
- Fix critical bugs only
- Ensure PRD requirements met
- Prepare demo

**Exit Checklist:**
- [ ] All PRD features work
- [ ] No blocking bugs
- [ ] Ready for class presentation
- [ ] Demo flow prepared

---

## Technical Decisions (Simplified)

### Stack
```
Frontend:
- Expo SDK (latest stable)
- TypeScript (basic config)
- React Navigation 6
- Context API only

Backend:
- Firebase Auth (phone)
- Firestore (basic rules)
- Firebase Storage
- Cloud Functions (minimal)

External:
- Replicate API (one filter)
```

### Project Structure
```
src/
  screens/        # One file per screen
  components/     # Shared UI components
  services/       # firebase.ts, media.ts
  utils/          # helpers.ts
  types/          # index.ts
  App.tsx
  Navigation.tsx
```

### Data Models
- User: `uid, username, displayName, phoneNumber, friends[]`
- Snap: `snapId, creatorId, mediaUrl, recipients, expiresAt, viewedBy[]`
- Message: `messageId, senderId, content, sentAt, readAt`

---

## What We're NOT Building
- CI/CD pipelines
- Multiple environments
- E2E encryption
- Screenshot detection
- Analytics tracking
- Error monitoring (beyond console.log)
- Performance optimization
- Accessibility features
- COPPA/GDPR compliance
- 99.9% uptime requirements

---

## Definition of Done (Class Project Version)

✅ **Feature Complete**: All PRD requirements implemented  
✅ **No Crashes**: App doesn't crash during normal use  
✅ **Works on Simulator**: iOS and Android simulators both work  
✅ **Demo Ready**: Can demonstrate all features in class  

---

## Risk Mitigations (Simple)

| Risk | Mitigation |
|------|------------|
| Firebase quotas | Use sparingly during testing |
| Video too large | Limit to 10 seconds, compress |
| Replicate API fails | Show error, use basic filters |
| Time running out | Focus on core loop first |

---

## Notes

This is a simplified MVP for a class project. Security is basic (HTTPS + Firebase Auth), performance is not optimized, and we're only building exactly what's in the requirements document.