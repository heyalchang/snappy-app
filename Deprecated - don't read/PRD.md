# Product Requirements Document: SnapClone
## A Snapchat-Inspired Ephemeral Media Sharing Platform

## Executive Summary

SnapClone is a mobile application that replicates core Snapchat mechanics for ephemeral photo and video sharing. Users can capture moments and share them as "snaps" that disappear after viewing (direct messages) or after 24 hours (stories). The app will feature real-time messaging, phone authentication, creative filters with AI integration stubs, and a full social experience built on Firebase infrastructure.

## Product Vision

We're building a Snapchat clone that captures the essence of ephemeral sharing while providing a foundation for advanced AI-powered features. The app emphasizes privacy through disappearing content, authentic moment sharing, and fun visual communication between friends.

## Core Snapchat Mechanics We're Implementing

### 1. Disappearing Content
- **Direct Snaps**: One-time view, then permanently deleted
- **Stories**: 24-hour lifespan, viewable multiple times by friends
- **Chat Messages**: Optional disappearing text messages
- **Screenshot Detection**: Notify sender when content is captured

### 2. Camera-First Interface
- App opens directly to camera
- Quick capture: tap for photo, hold for video (10-second max)
- Minimal UI during capture
- Seamless transition from capture to send

### 3. Social Network
- Friend-based connections (no public following)
- Private sharing model
- Mutual friend requirements
- No public metrics (likes, follower counts)

## Detailed Feature Requirements

### Phase 1: MVP Features (Everything We're Building Now)

#### User Authentication & Onboarding
- **Phone Number Authentication**
  - Firebase Phone Auth integration
  - SMS verification code
  - Automatic region detection
  - Fallback to manual country selection
- **Profile Creation**
  - Unique username (3-20 chars, alphanumeric + underscore)
  - Display name (changeable)
  - Profile photo (optional)
  - Phone contact sync for friend suggestions

#### Camera Module
- **Capture Capabilities**
  - Photo mode: single tap
  - Video mode: hold to record (3-10 seconds)
  - Front/rear camera toggle
  - Flash modes: auto, on, off
  - Grid overlay option
  - Volume button capture
- **Post-Capture**
  - Preview screen with retake option
  - Add caption (280 character limit)
  - Draw/doodle on snap
  - Save to camera roll option

#### Snap Distribution System
- **Sending Options**
  - Select multiple friends
  - Add to My Story
  - Both simultaneously
  - Send to groups (future)
- **Delivery Features**
  - Upload progress indicator
  - Delivery confirmation
  - Failed send retry
  - Queue for offline sending

#### Stories System
- **Story Creation**
  - Unlimited snaps per day
  - 24-hour automatic expiration
  - Delete individual snaps from story
  - Story privacy settings
- **Story Viewing**
  - Friends' stories in chronological order
  - Unviewed indicator
  - Tap to advance, swipe to skip
  - View count for your stories
  - See who viewed (for your stories only)

#### Direct Messaging
- **Snap Messages**
  - One-time view for photos
  - Replay once within 24 hours (premium feature later)
  - Video plays once
  - Notification when opened
- **Text Chat**
  - Real-time messaging
  - Typing indicators
  - Read receipts
  - Delete messages (your side or both sides)
  - Emoji reactions to messages
- **Media Library in Chat**
  - Send from camera roll
  - Recently captured snaps
  - Saved snaps section

#### Friends & Privacy
- **Friend Management**
  - Add by username search
  - Add by phone number
  - Add from contacts
  - QR code (Snapcode equivalent)
  - Friend requests with accept/decline
  - Remove friends
  - Block/unblock users
- **Privacy Controls**
  - Who can contact me: Everyone/Friends
  - Who can view my story: Everyone/Friends/Custom
  - Who can see my location: (future feature)
  - Hide story from specific friends

#### Filters & Effects System
- **Basic Filters (MVP)**
  - Black & White
  - Sepia
  - Vintage
  - High Contrast
  - Temperature adjustment
- **Filter Architecture**
  - Plugin system for adding new filters
  - Filter preview carousel
  - Apply multiple filters
- **AI Integration Preparation**
  - Replicate API integration stub
  - LLM server connection stub
  - One working demo: AI style transfer filter
  - Error handling for API failures
  - Fallback to basic filters

#### Notifications
- **Push Notifications**
  - New snap received
  - Friend request
  - Story about to expire
  - Screenshot taken
  - Typing indicator (optional)
- **In-App Notifications**
  - Red dot indicators
  - Number badges
  - Sound/vibration settings

#### Technical Infrastructure
- **Firebase Services**
  - Authentication (Phone)
  - Firestore (user data, metadata)
  - Storage (media files)
  - Cloud Functions (cleanup, notifications)
  - Cloud Messaging (push notifications)
- **Media Handling**
  - Compression before upload
  - Progressive download for viewing
  - Caching strategy
  - Bandwidth optimization

### Phase 2: Future Features (Clearly Defined for Later)

#### Advanced Camera
- AR Lenses (face filters)
- Voice filters for videos
- Music/sound integration
- Slow-mo and fast-forward
- Multi-snap recording

#### Enhanced Social
- Group chats
- Public profiles for creators
- Discover feed
- Snap Map (location sharing)
- Memories (saved snaps gallery)

#### Advanced AI Features
- Full Replicate integration
  - Style transfer
  - Background replacement
  - Object recognition filters
- LLM Integration
  - Auto-captions
  - Suggested replies
  - Content moderation
- Custom filter creation

#### Monetization
- Premium subscriptions
- Paid filters/lenses
- Sponsored filters
- In-app purchases

## User Experience Flow

### First Launch
1. Splash screen with app logo
2. Phone number input with country code
3. SMS verification (6-digit code)
4. Username creation
5. Optional: profile photo, display name
6. Permission requests (camera, contacts, notifications)
7. Tutorial overlay on camera screen

### Daily Usage Flow
1. Open to camera (last used front/back)
2. Capture snap
3. Edit with filters/text/drawing
4. Choose recipients and/or story
5. Send confirmation
6. Return to camera

### Story Consumption
1. Swipe right from camera
2. See friends' story previews
3. Tap to start viewing
4. Auto-advance through snaps
5. Swipe down to exit

## Technical Specifications Overview

### Platforms
- iOS (React Native Expo)
- Android (React Native Expo)
- Minimum OS: iOS 13, Android 6.0

### Performance Requirements
- Camera ready: <2 seconds
- Snap send: <5 seconds
- Story load: <1 second
- Chat delivery: <500ms

### Security & Privacy
- Phone numbers hashed
- Media URLs expire after viewing
- Firestore security rules
- No permanent storage after deletion
- GDPR compliance ready

### Analytics Events
- Snap sent/received/viewed
- Story posted/viewed
- Filter used
- Friend added
- Session duration
- Feature adoption rates

## Success Metrics

### Launch Goals (Month 1)
- 10,000 downloads
- 5,000 registered users
- 50% D1 retention
- 20,000 snaps sent daily

### Growth Goals (Month 3)
- 50,000 active users
- 10 snaps/day per active user
- 60% daily active rate
- 4.5+ app store rating

### Engagement Targets
- 8+ sessions per day
- 15+ minutes daily usage
- 80% story completion rate
- 5+ friends per user average

## Development Priorities

### Must Have (MVP)
1. Complete camera functionality
2. Snap sending and viewing
3. Stories with expiration
4. Phone authentication
5. Real-time chat
6. Basic filters
7. Friend system
8. Push notifications
9. One AI filter demo

### Should Have (Post-MVP)
1. Advanced filters
2. Group messaging
3. Memories
4. Web admin panel
5. Analytics dashboard

### Nice to Have (Future)
1. AR lenses
2. Voice/video calls
3. Snap Map
4. Public profiles
5. Monetization

## Risk Mitigation

### Technical Risks
- **Firebase Scaling**: Monitor usage, implement caching
- **Media Storage Costs**: Compress aggressively, clean up promptly
- **API Rate Limits**: Queue and retry logic for AI services

### User Risks
- **Inappropriate Content**: Report system, AI moderation (future)
- **Bullying**: Block/report features, safety team (future)
- **Privacy Concerns**: Clear data policies, user controls

## Conclusion

SnapClone aims to recreate the core Snapchat experience while building a foundation for innovative AI-powered features. By focusing on ephemeral sharing, real-time communication, and creative expression, we'll create an engaging platform that respects user privacy and encourages authentic connections.

The phased approach allows us to launch with a solid MVP while maintaining a clear roadmap for advanced features. With Firebase as our backend and a plugin architecture for filters, we're positioned to iterate quickly based on user feedback and emerging technologies.