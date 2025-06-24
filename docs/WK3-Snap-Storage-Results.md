# Week 3: Snap Storage & Viewing - Results

## Completion Date: December 23, 2024

### Summary
Successfully implemented the complete snap lifecycle (capture → send → view → delete) with Firebase Storage integration. All core functionality is working as expected.

### Implemented Features

#### 1. Firebase Storage Integration
- Created `src/services/media.ts` with upload functionality
- Implemented `uploadMedia()` function with progress tracking
- Storage structure: `/snaps/{userId}_{timestamp}.{jpg|mp4}`
- Proper error handling and blob management

#### 2. Snap Document Structure
```typescript
{
  snapId: string;
  creatorId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  recipients: string[] | 'story';
  createdAt: Timestamp;
  expiresAt: Timestamp; // 7 days for direct, 24h for stories
  viewedBy: Array<{uid: string; timestamp: Timestamp}>;
}
```

#### 3. Send Snap Flow
- Updated MediaPreviewScreen with functional send button
- Real-time upload progress indicator (0-100%)
- Navigation to home screen after successful send
- Send to self functionality for testing

#### 4. Snap Inbox Screen
- Lists all unviewed snaps for current user
- Real-time Firestore listener for updates
- Pull-to-refresh functionality
- Filters out already viewed snaps
- Shows sender (Me for self-sent) and media type

#### 5. Snap Viewing Screen
- Tap-and-hold gesture to view snaps
- 10-second countdown timer
- Auto-delete after viewing (both Firestore and Storage)
- Marks snaps as viewed in viewedBy array
- Caption display support

#### 6. Navigation Structure
- Created HomeScreen as main hub
- Updated Navigation.tsx with all screens
- Complete user flow working seamlessly

### Technical Implementation Details

#### Key Files Created/Modified:
1. `src/services/media.ts` - Core media upload and snap creation
2. `src/screens/SnapInboxScreen.tsx` - Inbox with real-time updates
3. `src/screens/SnapViewScreen.tsx` - Viewing with auto-delete
4. `src/screens/HomeScreen.tsx` - Main navigation hub
5. `src/Navigation.tsx` - Updated with new screens

#### Firebase Structure:
- **Storage**: `/snaps/` folder for all media files
- **Firestore**: `snaps` collection with proper indexing
- **Security**: Basic rules (to be enhanced in production)

### Challenges & Solutions
None - implementation went smoothly! The modular approach from previous weeks made integration straightforward.

### Deferred Items
- **24-hour story expiration**: Requires Cloud Function setup. Can be added later without affecting current functionality.

### Exit Criteria Status
✅ Media uploads successfully  
✅ Snap metadata saved to Firestore  
✅ Upload progress shown to user  
✅ Can send snap to self  
✅ Snap disappears after viewing  
✅ View count increments (viewedBy array)  
⏸️ Stories expire after 24 hours (deferred)  

### MVP Milestone Achieved
✅ User can capture, send to self, and watch snap disappear

### Next Steps
Ready for Week 4: Friends & Friend Management
- Add friend system
- Send snaps to friends
- Friend list UI