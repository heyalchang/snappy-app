# Active Working - Week 6
**Phase 6: Friends, Stories & Chat**  
**Current Focus**: Track 1 & 2 - Friends System and Fake Friends  
**Start Date**: June 24, 2025

## Week 6 Goals
1. Implement Friends System with instant friendship
2. Create Fake Friends system for non-existent users
3. Build profile screens with avatars and stats
4. (Later) Stories and Chat implementation

## Core Principles
- **Simplicity First** - This is a class project, keep it simple
- **Logical Dependencies** - Friends must exist before chat
- **Working > Perfect** - Get features functional before polishing
- **Check Schema First** - Always verify database structure before coding

## Track 1: Friends System
- [x] Create ProfileScreen with stats display
- [x] Generate avatar (pastel bg + emoji) on signup (already done in Week 5)
- [x] Implement instant friendship (no requests)
- [x] Create AddFriendScreen
- [x] Create FriendsListScreen
- [x] Update friendships table queries

## Track 2: Fake Friends System
- [x] Run 02_fake_profiles.sql migration (already exists)
- [x] Implement fake friend creation
- [x] Add counter tracking in system_settings
- [x] Create some fake stories
- [x] Test with 10-20 fake friends (added 5 friends with stories)

## Implementation Notes

### Avatar Generation Strategy
```typescript
const generateAvatar = (username: string) => {
  const colors = ['#FFB6C1', '#E6E6FA', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFE4E1', '#B0E0E6'];
  const emojis = ['😎', '🦄', '🎮', '🌸', '🏀', '🌺', '🛹', '✨', '🎵', '🦋'];
  // Hash username for consistent selection
  return {
    color: colors[hash(username) % colors.length],
    emoji: emojis[hash(username) % emojis.length]
  };
};
```

### Fake Friend Flow
1. User tries to add friend by username
2. Check if user exists in profiles table
3. If not, create fake user from fake_profiles pool
4. Create instant friendship (no pending state)
5. Increment counter in system_settings

## Current Status
- Starting fresh on Week 6
- Supabase migration complete (Week 5)
- Ready to implement social features