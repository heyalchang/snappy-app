Product Requirements Document: SnapClone

  1. Product Overview

<important>
This is for a class project.  Not a commercial product. We are looking for the happy path. 
Implementation plan emphasizing SIMPLICITY. No E2E encryption, no biometrics, no screenshot detection, minimal security, no analytics. Just the MVP requirements.  
</important>

  1.1 Purpose

  SnapClone is a mobile application that enables users to share ephemeral
  photo and video content through time-limited "snaps" . The app combines camera functionality, real-time messaging, and
   social storytelling.

  1.2 Target Users

  - Primary: Users aged 16-35 who want private, temporary photo/video
  sharing
  - Secondary: Groups and communities wanting ephemeral content sharing

  1.3 Key Value Propositions
  - Authentic, unedited moment sharing
  - Real-time communication with visual content
  - Fun filters and AI-powered effects

1.4 
	•	No push notifications
	•	No image editing tools beyond basic filter
	•	No encryption or secure messaging
	•	No offline support or data caching
	•	No advanced group chat or threading

  2. Functional Requirements

  2.1 User Authentication

-User authentication
    - Creates username (unique, 3-20 characters)
    - Optional display name and profile photo
    - for supabase authentication, we use [username]@nulldomain.com behind the scenes and no email confirmation

  - Session Management
    - Persistent login with refresh tokens

  2.2 Camera Features

  - Capture Modes
    - Photo: Single tap capture
    - Video: Hold to record (max 10 seconds)
    - Switch between front/rear camera
    - Flash control (auto/on/off)
  - Media Processing
    - Preview captured media before sending
    - Ability to retake
    - Save to camera roll option
    - Add caption overlay

  2.3 Snap Management

  - Sending Snaps
    - Select recipients from contacts
    - Set to "My Story" (visible to all friends)


  - Viewing Snaps
    - Tap to view, release to close
    - Auto-advance in stories

  2.4 Social Features

  - Friends System
    - Add friends by username
    - Friend requests with accept/decline
	•	View list of friends
  - Stories Feed
    - Chronological list of friends' stories (everyone's stories visible initially for testing)
    - Unviewed stories highlighted
    - Story preview thumbnails
    - View count for own stories

  2.5 Messaging

  - Chat Features 
     Basic chat between people
    live updates with supabase
Messages displayed with “mine/theirs” alignment

  - Media in Chat
    - Send saved snaps from gallery
    - Camera roll access



  2.6 Filters & Effects

  - Phase 1 (MVP)
    - Basic color filters (B&W, Sepia, Vintage)
    - Plugin architecture for future filters
  - Phase 2 (Future)
    - AI-powered filters via Replicate API
    - Face filters and AR effects
    - Custom LLM-generated effects
    - Community filter marketplace
 
 2.7 Groups (Feature-flagged)
	•	UI stub present
	•	Group creation and member management table structure exists
	•	Not implemented in UI for MVP

2.8 Settings
	•	Logout option

  3. Technical Requirements

  3.1 Platform Support

  - iOS 16.0+ (via Expo)
  - Responsive design for various screen sizes




✅

  4. Data Schema

  4.1 User Profile

  - uid: string (Firebase UID)
  - username: string (unique)
  - displayName: string
  - phoneNumber: string (hashed)
  - profilePhotoUrl: string
  - createdAt: timestamp
  - friends: array<uid>
  - blockedUsers: array<uid>
  - privacySettings: object

  4.2 Snap Object

  - snapId: string
  - creatorId: string
  - mediaUrl: string (Firebase Storage)
  - mediaType: 'photo' | 'video'
  - caption: string
  - recipients: array<uid> | 'story'
  - createdAt: timestamp
  - expiresAt: timestamp
  - viewedBy: array<{uid, timestamp}>
  - isScreenshotted: boolean

  4.3 Message Object

  - messageId: string
  - conversationId: string
  - senderId: string
  - type: 'text' | 'snap' | 'media'
  - content: string | snapId
  - sentAt: timestamp
  - readAt: timestamp
  - deletedAt: timestamp (soft delete)

  5. User Interface

  5.1 Screen Hierarchy

  1. Launch Screen → Auth check
  2. Auth Flow (if needed)
    - Phone input → Verification → Profile setup
  3. Main Tab Navigation
    - Camera (center, default)
    - Chat (left)
    - Stories (right)
    - Friends
    - Profile (top right corner)

  5.2 Key Interactions

  - Swipe Navigation: Between main screens
  - Tap & Hold: View snaps, record video
  - Pull to Refresh: Update feeds
  - Long Press: Additional options (delete, save, etc.)

  5.3 Design Principles

  - Minimal UI when capturing
  - Full-screen immersive viewing

  6. Analytics & Metrics

  6.2 Event Tracking (future)

  - Snap captured/sent/viewed
  - Story posted/viewed
  - Message sent/read
  - Filter used
  - Screenshot taken

  7. Infrastructure

  7.1 Firebase Services

  - Authentication: Phone number auth
  - Firestore: User data, messages, snap metadata
  - Storage: Media files with CDN
  - Cloud Functions: Scheduled deletion, notifications
  - Cloud Messaging: Push notifications

  8. Release Phases

  MVP (Phase 1)

  - Core camera functionality
  - Basic snap sending/viewing
- Stories
  - Friend system
  - Text chat
  - Overlay filters


