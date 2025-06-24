# Surprises

## expo-camera API Change in SDK 53

### What I Expected
Using the standard expo-camera imports would work as documented in most tutorials:
```typescript
import { Camera, CameraType, FlashMode } from 'expo-camera';

// Using Camera component with enums
<Camera 
  type={CameraType.back} 
  flashMode={FlashMode.off}
/>
```

### What Actually Happened
Got runtime error: "Cannot read property 'back' of undefined" when trying to use `CameraType.back`. The error was misleading because it seemed like a navigation error at first.

### Root Cause
expo-camera 16.x (included with SDK 53) completely changed the API:
- The `Camera` component is deprecated
- `CameraType` and `FlashMode` enums no longer exist
- Must use new `CameraView` component with string values

### Solution
Use the new CameraView API:
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

// Using CameraView with string values
<CameraView 
  facing="back"  // instead of type={CameraType.back}
  flash="off"    // instead of flashMode={FlashMode.off}
/>
```

Also need to use `useCameraPermissions` hook for permission handling instead of the old `Camera.requestCameraPermissionsAsync()`.

### Lesson Learned
Always check the SDK-specific documentation when upgrading Expo. Major version changes can include breaking API changes that aren't immediately obvious from error messages.

## Video Recording API Confusion - recordAsync Implementation

### What I Expected
After fixing the CameraType import issue, I thought video recording would work with:
```typescript
const video = await cameraRef.current.recordAsync({
  maxDuration: 10
});
```

### What Actually Happened
The recording would start but never complete. The promise never resolved or rejected - it just hung forever. The recording indicator stayed on screen and the app became unresponsive.

### Initial Misdiagnosis
Based on incorrect information, I thought the new CameraView API had changed to use a callback-based `startRecording()` method. This led to attempting:
```typescript
// THIS DOESN'T EXIST!
cameraRef.current.startRecording({
  onRecordingFinished: (video) => { ... },
  onRecordingError: (error) => { ... }
});
```

### The Real Truth
After getting "startRecording is not a function" error and researching further:
1. **`recordAsync()` IS the correct method** for CameraView in expo-camera 16.x
2. **There is NO `startRecording()` method** - this was misinformation
3. The promise-based API is still used, just like the old Camera component

### The Actual Problem
The issue is that `recordAsync()` promises sometimes don't resolve properly. This is a **known bug** in expo-camera, particularly when:
- Using Expo Go (vs development builds)
- Specifying certain video quality settings
- Running in certain SDK versions

### Known Workarounds
1. **Remove quality settings**: Don't specify VideoQuality in options
2. **Use development builds**: More reliable than Expo Go
3. **Add timeout mechanism**: Force recovery from stuck recordings
4. **Ensure proper permissions**: Both camera AND microphone needed

### Lesson Learned
1. **Verify API documentation** before assuming methods have changed
2. **Known bugs can masquerade as API changes** - the hanging promise made it seem like the API was different
3. **Expo Go has limitations** that don't always throw clear errors
4. Always test with the actual API before concluding it doesn't work

This was a perfect storm of a real bug (promises not resolving) leading to an incorrect assumption about API changes!