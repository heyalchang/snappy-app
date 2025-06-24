Product Requirements Document: SnapClone

  1. Product Overview

## This is for a class project.  Not a commercial product.  Within that constraint, we want it to be excellent.

  1.1 Purpose

  SnapClone is a mobile application that enables users to share ephemeral
  photo and video content through time-limited "snaps" that disappear after
   viewing. The app combines camera functionality, real-time messaging, and
   social storytelling.

  1.2 Target Users

  - Primary: Users aged 16-35 who want private, temporary photo/video
  sharing
  - Secondary: Groups and communities wanting ephemeral content sharing

  1.3 Key Value Propositions

  - Privacy through automatic content deletion
  - Authentic, unedited moment sharing
  - Real-time communication with visual content
  - Fun filters and AI-powered effects (future)

  2. Functional Requirements

  2.1 User Authentication

  - Phone Number Authentication
    - User enters phone number
    - Receives SMS verification code
    - Creates username (unique, 3-20 characters)
    - Optional display name and profile photo
  - Session Management
    - Persistent login with refresh tokens
    - Biometric unlock option (FaceID/TouchID)

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
    - Both individual and story simultaneously
  - Snap Properties
    - Auto-delete after first view (direct snaps)
    - 24-hour expiration (stories)
    - Screenshot detection and notification
    - View count tracking
  - Viewing Snaps
    - Tap to view, release to close
    - Timer showing remaining view time
    - Auto-advance in stories
    - Cannot replay once viewed

  2.4 Social Features

  - Friends System
    - Add friends by username or phone number
    - Friend requests with accept/decline
    - Block/unblock users
    - Privacy settings (who can contact/view stories)
  - Stories Feed
    - Chronological list of friends' stories
    - Unviewed stories highlighted
    - Story preview thumbnails
    - View count for own stories

  2.5 Messaging

  - Chat Features
    - Text messages alongside snaps
    - Typing indicators
    - Read receipts
    - Message deletion (both sides option)
  - Media in Chat
    - Send saved snaps from gallery
    - Camera roll access
    - Voice notes (future)

  2.6 Filters & Effects

  - Phase 1 (MVP)
    - Basic color filters (B&W, Sepia, Vintage)
    - Brightness/contrast adjustment
    - Plugin architecture for future filters
  - Phase 2 (Future)
    - AI-powered filters via Replicate API
    - Face filters and AR effects
    - Custom LLM-generated effects
    - Community filter marketplace

  3. Technical Requirements

  3.1 Platform Support

  - iOS 13.0+ (via Expo)
  - Android 6.0+ (API 23+)
  - Responsive design for various screen sizes

  3.2 Performance

  - Camera launch: < 2 seconds
  - Snap upload: < 5 seconds on 4G
  - Message delivery: < 1 second
  - App size: < 100MB initial download

  3.3 Security & Privacy

  - End-to-end encryption for direct snaps
  - Secure credential storage (Keychain/Keystore)
  - HTTPS for all API communications
  - No permanent storage of viewed snaps
  - GDPR compliance for user data

  3.4 Offline Capabilities

  - Queue snaps for sending when online
  - Cache recent conversations
  - View downloaded stories offline
  - Graceful degradation of features

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
    - Profile (top right corner)

  5.2 Key Interactions

  - Swipe Navigation: Between main screens
  - Tap & Hold: View snaps, record video
  - Pull to Refresh: Update feeds
  - Long Press: Additional options (delete, save, etc.)

  5.3 Design Principles

  - Minimal UI when capturing
  - Full-screen immersive viewing
  - High contrast for outdoor visibility
  - Gesture-based navigation
  - Accessibility compliant

  6. Analytics & Metrics

  6.1 Key Metrics

  - Daily Active Users (DAU)
  - Snaps sent per user per day
  - Story completion rate
  - Average session duration
  - Friend network growth

  6.2 Event Tracking

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

  7.2 Third-Party Services

  - Twilio: SMS verification backup
  - Replicate: AI filter processing (future)
  - Sentry: Error tracking
  - Mixpanel: Analytics (optional)

  8. Release Phases

  MVP (Phase 1)

  - Core camera functionality
  - Basic snap sending/viewing
  - Stories with 24h expiration
  - Friend system
  - Text chat

  Phase 2

  - Advanced filters
  - Group stories
  - Voice/video calls
  - Discover feed

  Phase 3

  - AI-powered effects
  - Snap Map
  - Memories/highlights
  - Monetization features

  9. Success Criteria

  - 10,000 downloads in first month
  - 50% DAU/MAU ratio
  - Average 10 snaps/day per active user
  - < 0.1% crash rate
  - 4.0+ app store rating

  10. Constraints & Assumptions

  - Budget for Firebase scaling
  - App store approval requirements
  - COPPA compliance for users under 18
  - Limited to mobile platforms initially
  - English language only for MVP