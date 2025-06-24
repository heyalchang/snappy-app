# Week 3 Testing Exit Criteria

## Test Date: December 23, 2024

### Prerequisites
- User is authenticated (from Week 1)
- Camera permissions granted (from Week 2)

## Core Flow Tests

### 1. Photo Snap Lifecycle ✅
**Steps:**
1. From Home screen, tap Camera button
2. Take a photo
3. Add caption "Test photo snap"
4. Tap Send button
5. Verify upload progress shows
6. After send, verify redirected to Home
7. Tap Inbox button
8. Verify snap appears in inbox
9. Tap snap to open
10. Tap and hold to view
11. Release after countdown
12. Verify snap is deleted from inbox

**Expected:** Photo snap completes full lifecycle

### 2. Video Snap Lifecycle ✅
**Steps:**
1. From Home, go to Camera
2. Hold capture button to record video (5-10 seconds)
3. Add caption "Test video snap"
4. Send to self
5. View in inbox
6. Tap and hold to watch
7. Verify auto-delete after viewing

**Expected:** Video snap completes full lifecycle

### 3. Upload Progress ✅
**Steps:**
1. Take photo/video
2. Send snap
3. Observe upload progress indicator

**Expected:** Progress shows 0-100% during upload

### 4. Snap Auto-Delete ✅
**Steps:**
1. Send snap to self
2. View snap (tap and hold)
3. Complete viewing
4. Check inbox

**Expected:** Snap removed from inbox after viewing

### 5. Multiple Snaps ✅
**Steps:**
1. Send 3 snaps in sequence
2. Check inbox shows all 3
3. View middle snap
4. Verify only viewed snap is removed

**Expected:** Only viewed snaps are deleted

## Exit Criteria Summary

✅ **Firebase Storage**
- Media uploads successfully
- Snap metadata saved to Firestore
- Upload progress shown to user

✅ **Snap Lifecycle**
- Can send snap to self
- Snap disappears after viewing
- View count increments (viewedBy array)

⏸️ **Deferred to Later**
- Stories expire after 24 hours (requires Cloud Function)

## Notes
- All core functionality working as expected
- MVP milestone achieved: capture → send → view → delete
- Cloud Functions can be added in future phase