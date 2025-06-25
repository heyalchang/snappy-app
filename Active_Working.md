# Active Working - Week 6 - Stories Track
**Phase 6: Friends, Stories & Chat**  
**Current Focus**: Track 3 - Stories Implementation  
**Start Date**: June 25, 2025  
**File ID**: AW-W6-Stories-625

## Week 6 Goals - Track 3
1. Update camera flow for story option
2. Create story in posts table (24-hour expiration)
3. Create StoriesScreen (grid of friends with stories)
4. Create StoryViewerScreen with tap to advance
5. Track story views and show view count

## Core Principles
- **Stories are temporary** - 24-hour expiration (though we'll keep them for demo)
- **Stories are public to friends** - All friends can see your story
- **Tap to advance** - Standard story viewing UX
- **View tracking** - Show who viewed your story

## Track 3: Stories Implementation
- [x] Update camera flow for story option (MediaPreviewScreen has "My Story" button)
- [x] Create story in posts table (24-hour expiration) (using posts table)
- [x] Create StoriesScreen (grid of friends with stories)
- [x] Create StoryViewerScreen with tap to advance
- [ ] Track story views and show view count (needs post_viewers table)

## Implementation Plan

### 1. Camera Flow Update
- Camera screen should have option to "Send to Story" vs "Send to Friend"
- MediaPreviewScreen already has "My Story" button ✓

### 2. Story Data Model
```typescript
// posts table (already exists)
{
  id: string;
  author_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption?: string;
  created_at: string;
  // Need to add: expires_at for 24-hour expiration
}

// Need: post_viewers table for tracking views
{
  id: string;
  post_id: string;
  viewer_id: string;
  viewed_at: string;
}
```

### 3. Story Viewer UX
- Tap to advance to next story
- Hold to pause
- Swipe down to exit
- Progress bar at top
- Show username and time ago
- Show view count for own stories

## Current Status
- MediaPreviewScreen has "My Story" button ✓
- StoriesScreen shows grid of friends with stories ✓
- StoryViewerScreen implemented with:
  - Progress bars for multiple stories ✓
  - Tap to advance/go back ✓
  - Swipe down to exit ✓
  - Time ago display ✓
  - Caption display ✓
- Navigation from StoriesScreen to StoryViewerScreen ✓
- View tracking commented out (needs post_viewers table)

## Remaining Tasks
1. Create post_viewers table in database
2. Enable view tracking functionality
3. Test full story flow end-to-end
4. Add 24-hour expiration logic (currently stories persist)

---
File ID: AW-W6-Stories-625