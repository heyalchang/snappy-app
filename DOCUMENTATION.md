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

### Firebase Configuration
- Using Firebase Web SDK (not react-native-firebase)
- Lazy initialization pattern to avoid runtime errors
- AsyncStorage for auth persistence

### Navigation Setup
- React Navigation 6 with native stack navigator
- Type-safe navigation using TypeScript
- Navigation hooks preferred over props