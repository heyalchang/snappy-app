# About SnapClone

## Project Overview

SnapClone is a Snapchat-inspired mobile application built as a class project using React Native Expo. The app implements core social media features including ephemeral photo/video sharing, messaging, and 24-hour stories.

**Tech Stack:**
- Frontend: React Native with Expo SDK 53
- Backend: Supabase (Auth, Database, Storage, Realtime)
- Language: TypeScript
- State Management: React Context API
- Navigation: React Navigation 6

## Directory Structure

```
expodev/
├── src/                    # Application source code
│   ├── screens/           # Screen components (one per screen)
│   ├── components/        # Reusable UI components
│   ├── services/          # Backend services (Supabase, media, chat)
│   ├── contexts/          # React contexts (Auth)
│   ├── utils/             # Utility functions (filters, helpers)
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── Navigation.tsx    # Navigation configuration
├── docs/                  # Project documentation
│   ├── ProductRequirements-V1.2.md    # Full PRD
│   ├── Technical_Plan-V1.3.md         # Implementation roadmap
│   └── Phase testing/tracking files
├── supabase/             # Database migrations
├── scripts/              # Utility scripts
└── Active_Working.md     # Current sprint tasks

## Documentation

### Key Documents

1. **CLAUDE.md** - AI assistant guidance file containing:
   - Project overview and constraints
   - Development commands
   - Implementation guidelines
   - Critical rules (don't go Leroy Jenkins!)

2. **ProductRequirements-V1.2.md** - Complete product requirements:
   - User stories and features
   - Data models
   - UI/UX specifications
   - Acceptance criteria

3. **Technical_Plan-V1.3.md** - 6-week implementation plan:
   - Phase breakdown with weekly tracks
   - Exit criteria for each phase
   - Technical approach

4. **SURPRISES.md** - Technical learnings and gotchas
5. **DOCUMENTATION.md** - Human-readable technical notes
6. **DEBUG-JOURNEY.md** - Extended debugging sessions

### Development Process

We follow a phased approach with weekly tracks:
- Each phase has specific goals and exit criteria
- User acceptance required before proceeding to next phase
- Weekly documentation of results (WK[X]-Description-Results.md)
- Phase testing plans with exit criteria

## Current Implementation Status

### ✅ Completed Features

**Phase 1: Foundation & Auth**
- Project setup with Expo SDK 53
- Supabase integration
- Phone authentication flow
- User profiles with avatars

**Phase 2: Camera & Media**
- Camera screen with photo/video capture
- Media preview and upload
- Real-time camera filters (B&W, Sepia, Vintage, AR sunglasses)
- Save to gallery functionality

**Phase 3: Stories**
- Story creation and posting
- 24-hour expiration
- Story viewer with progress bars
- Story list screen

**Phase 4: Friends System**
- Add friends by username
- Friends list management
- Friend profiles
- Fake friend generation for testing

**Phase 5: Chat (In Progress)**
- Chat list screen
- Individual chat conversations
- Text messaging with auto-responses
- Photo sharing in chat
- Real-time message updates
- Read receipts

### 🚧 In Progress

**Phase 5: Chat Messaging (Current Week)**
- ✅ Basic chat functionality
- ⏳ Typing indicators
- ⏳ Message deletion/expiration

### 📋 Upcoming Features

**Phase 6: Polish & Snaps**
- Direct snap sending
- Snap viewing with auto-delete
- Notification system
- UI/UX refinements
- Performance optimization

## Database Schema

Key tables:
- `profiles` - User profiles and settings
- `friendships` - Friend relationships
- `messages` - Chat messages
- `posts` - Story posts
- `fake_profiles` - Test data for development

## Development Commands

```bash
# Install dependencies
npm install

# Start development
npm start

# Run on platforms
npm run ios
npm run android
npm run web

# After native changes
npx expo prebuild
```

## Key Implementation Decisions

1. **Simplicity First** - MVP features only, no over-engineering
2. **No E2E Encryption** - Basic security for class project
3. **Fake Data** - Pre-populated friends for testing
4. **Deterministic Chat IDs** - `dm_userId1_userId2` pattern
5. **Auto-responses** - Simulate real conversations

## Testing Approach

- Manual testing for happy paths
- No edge case validation (class project scope)
- Focus on core user journeys
- Exit criteria for each phase

## Known Limitations

- No screenshot detection
- Basic error handling
- No push notifications
- Limited to 10-second videos
- Filters applied on preview only (not real-time on camera)

## Next Steps

1. Complete typing indicators for chat
2. Implement snap sending and viewing
3. Add message expiration
4. Final UI polish
5. Performance optimization

This is a learning project focused on implementing core social media features with modern React Native and cloud services.