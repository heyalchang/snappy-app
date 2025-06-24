# Migration Discussion Summary - December 24, 2024

## CURRENT STATUS (UPDATE)
- Just completed creating all V1.2 documentation
- Ready to update Linear with new phase structure
- Old Linear issues (Week 4-6) have been archived as "Duplicate"
- Need to create new Linear issues for Phases 4-8
- Phase 4 is complete (this restructuring)
- Ready to start Phase 5 (Supabase implementation)

## LINEAR UPDATE PLAN
Create new issues for:
1. Phase 4: Architecture Restructure (DONE - mark complete)
2. Phase 5: Supabase Migration & Core Features
3. Phase 6: Friends System & Profiles  
4. Phase 7: Stories Feature
5. Phase 8: Polish & Demo Prep

Each issue needs:
- Clear exit criteria
- Technical verification checklist
- User acceptance checkbox

## Context
The project had become too complex for a class demonstration. We decided to simplify dramatically and migrate from Firebase to Supabase while keeping the app's look and feel.

## Key Decisions Made

### 1. Authentication Simplification
- **Problem**: Firebase Auth caused "Component auth has not been registered yet" errors due to React Native initialization timing
- **Solution**: Use Supabase Auth with username-only approach
- **Implementation**: Username → username@nulldomain.com behind the scenes
- **Benefits**: No email verification needed, simple demo-friendly auth

### 2. Database Migration
- **From**: Firebase (Auth + Firestore + Storage)
- **To**: Supabase (Auth + PostgreSQL + Storage)
- **Schema**: Already exists in `sql/00_init.sql`
- **Project**: "exoneshot" (ID: qjoszotrtdpneednzjor)

### 3. Unified Chat Architecture
- **Key Insight**: Snapchat doesn't have a separate "snap inbox" - everything goes to chat
- **Change**: Photos/videos are just messages with media, not separate entities
- **Implementation**: 
  - Messages table gets `type` (text/photo/video) and `media_url` columns
  - Posts table used ONLY for stories
  - Room IDs: `dm_${sorted_user_ids}` for DMs, `group_${id}` for future groups

### 4. Instant Friends System
- **Old**: Friend requests with pending/accepted states
- **New**: Add friend = instant friendship
- **Benefit**: Simpler demo flow, no accept/decline needed

### 5. Fake Friends Innovation
- **Problem**: Demo needs to feel alive with activity
- **Solution**: 200 pre-populated fake profiles
- **Implementation**:
  - When adding non-existent username, create from fake pool
  - Auto-generate Supabase auth (username@nulldomain.com, password: "qwerty")
  - Track next fake profile with counter
  - Some fake friends have pre-made stories
- **Benefits**: Rich demo experience, easy testing

### 6. Profile & Stats
- **Auto-generated avatars**: Pastel background + emoji
- **Snap Score**: Count of sent + received messages
- **Stats**: Friends count, stories posted, snaps sent
- **Look**: Snapchat-style profile screen

### 7. UI/UX Polish
- Keep yellow Snapchat theme
- Pull-to-refresh on lists
- Skeleton loading states
- Empty states with icons
- Everything should feel smooth

## Technical Approach

### Code Philosophy
- **Readability First**: Clear, simple code
- **Feature Flags**: Easy to toggle features for phased development
- **Maintainability**: Modular structure, clear separation of concerns

### Migration Scripts Created
1. **01_simplify_messages.sql**: Adds media support to messages table
2. **02_fake_profiles.sql**: Creates fake profile system with 200 profiles

### What We're NOT Building
- No encryption or security
- No push notifications
- No snap expiration
- No screenshot detection
- No complex error handling
- Just happy path for demo

## Current State
- Phase 1-3: Completed with Firebase (camera, auth, storage)
- Phase 4: This restructuring/migration planning
- Phase 5: Will be Supabase implementation

## Next Steps
1. ✅ Create Technical Plan V1.2 incorporating all these decisions (DONE)
2. ✅ Update Linear to reflect Phase 4 completion (READY TO DO)
3. Begin Phase 5 implementation with Supabase

## Key Files Created Today
1. **ProductRequirements-V1.2.md** - Simplified scope with unified chat
2. **Technical_Plan-V1.2.md** - Phases 4-8 with Supabase migration
3. **Migration-Discussion-Summary.md** - This file (context preservation)
4. **Schema-Evolution-V1.2.md** - Database changes explained
5. **sql/01_simplify_messages.sql** - Add media to messages
6. **sql/02_fake_profiles.sql** - 200 fake profiles for demo

## Important Notes
- This is a CLASS PROJECT - optimize for demo success
- Keep existing UI/UX (yellow theme, current navigation)
- Make it work, make it simple, make it look good
- Don't overthink - ship it!

## What We're Building (V1.2 Core Changes)
1. **Supabase instead of Firebase** - Better auth, easier for demo
2. **Unified Chat** - No separate snap inbox, everything in chat
3. **Instant Friends** - No accept/decline, just instant
4. **Fake Friends** - 200 pre-made profiles for rich demo
5. **Simple Auth** - Username only (username@nulldomain.com trick)
6. **Profile with Stats** - Snap score, friend count, stories
7. **Stories** - Keep this feature, essential for Snapchat feel