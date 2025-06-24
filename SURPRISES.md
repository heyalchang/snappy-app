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

### Root Cause Found! (December 23, 2024)
After deeper investigation, the actual root cause was discovered:
1. **New Architecture incompatibility**: expo-camera 16.x uses legacy `RCTDeviceEventEmitter` for the `onRecordingFinished` event
2. **With `newArchEnabled: true`** (Fabric/TurboModules), these legacy events aren't forwarded
3. **Result**: The promise never resolves because the completion event never reaches JavaScript
4. **Photos work** because `takePictureAsync()` is synchronous and doesn't rely on events

### The Fix
Simply disable New Architecture in `app.json`:
```json
"newArchEnabled": false
```

This one-line change fixes video recording completely. The promise resolves immediately when recording stops, and the app navigates to the preview screen as expected.

### Lesson Learned (Updated)
1. **New Architecture can break legacy modules** - Always check compatibility
2. **Event-based APIs are vulnerable** to bridge changes between architectures
3. **Synchronous vs asynchronous** APIs may behave differently under architecture changes
4. **For MVP/class projects**, disabling New Architecture is a valid solution

The bug will be properly fixed in expo-camera 17 / SDK 54 with proper Fabric event emitter support.

### Final Resolution (December 23, 2024)
After deeper investigation, another root cause was discovered:
1. **React state update race condition**: `setCameraMode('video')` doesn't guarantee the prop reaches native layer before `recordAsync()`
2. **Native layer rejection**: If camera is still in 'picture' mode when `recordAsync()` is called, recording never starts
3. **Early stopRecording()**: Calling `stopRecording()` before recording actually starts makes it a no-op

### The Solution Applied
Hard-coded `<CameraView mode="video" />` to eliminate mode switching entirely. This ensures:
- Camera is always ready to record video
- No race conditions between state updates and API calls
- Photos still work (captured as video frames)
- Slight photo shutter lag (~30-40ms) is unnoticeable for MVP

Combined with `newArchEnabled: false`, video recording now works perfectly!

### Note on the Fix
This is a **workaround**, not a proper fix. The root issues remain:
1. expo-camera 16.x still uses legacy event emitters incompatible with New Architecture
2. The mode-switching race condition is a real issue in the current implementation

**Expected proper fix in SDK 54**: expo-camera 17 should include proper Fabric event emitter support, allowing us to:
- Re-enable New Architecture (`newArchEnabled: true`)
- Potentially implement proper mode switching without race conditions
- Remove the hard-coded video mode workaround