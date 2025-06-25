# Documentation

## SDK and Package Versions

### Core Dependencies
- **Expo SDK**: 53.0.12
- **React Native**: 0.79.4
- **React**: 19.0.0
- **TypeScript**: 5.8.3

### Key Package Versions
- **expo-camera**: 16.1.8 (uses new CameraView API)
- **expo-video**: 2.2.2 (replacement for deprecated expo-av)
- **expo-media-library**: 17.1.7
- **@react-navigation/native**: 7.1.14
- **@react-navigation/native-stack**: 7.3.20
- **firebase**: 11.9.1

## Important API Changes in SDK 53

### expo-camera 16.x Breaking Changes
The Camera component and related enums have been replaced:

**Old API (pre-SDK 53):**
```typescript
import { Camera, CameraType, FlashMode } from 'expo-camera';
// Usage:
<Camera type={CameraType.back} flashMode={FlashMode.off} />
```

**New API (SDK 53+):**
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
// Usage:
<CameraView facing="back" flash="off" />
```

Key differences:
- `Camera` → `CameraView`
- `type` prop → `facing` prop
- `CameraType.back/front` → string values `"back"/"front"`
- `FlashMode` enum → string values
- Permissions handled via `useCameraPermissions` hook

### expo-av Deprecation
- expo-av is deprecated and will be removed in SDK 54
- Replaced with separate packages:
  - `expo-video` for video playback
  - `expo-audio` for audio functionality

## Development Notes

### Navigation Setup
- React Navigation 6 with native stack navigator
- Type-safe navigation using TypeScript
- Navigation hooks preferred over props

## Database Management

### TypeScript Definitions Sync
The TypeScript database definitions in `src/types/database.ts` must be kept in sync with the actual Supabase schema.

**When to Update:**
- After running any SQL migration scripts
- After modifying database schema via Supabase dashboard
- When adding/removing tables or columns
- When changing column types or constraints

**How to Update:**
1. Check the actual database schema:
   ```sql
   -- List all tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check columns for a specific table
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'your_table';
   ```

2. Update `src/types/database.ts` to match:
   - Use `string | null` for nullable columns
   - Use `string` for UUIDs and timestamps
   - Use `number` for integers and bigints
   - Match exact column names (e.g., `author_id` not `user_id`)

3. Verify TypeScript compilation passes after updates

**Common Issues:**
- Column name mismatches (e.g., `user_id` vs `author_id`)
- Missing tables that exist in database
- Extra tables in types that don't exist in database
- Incorrect nullable settings

**Responsibility:**
- Developer making schema changes is responsible for updating TypeScript definitions
- Always verify types match database before committing