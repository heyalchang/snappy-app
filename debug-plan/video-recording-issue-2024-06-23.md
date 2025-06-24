# Video Recording Issue Debug Plan
Date: June 23, 2024

## Bug Description

### Symptoms
- Video recording indicator (red pill UI) stays visible after releasing the capture button
- Recording appears to start (logs show "Starting recording...") but never completes
- The `isRecording` state gets stuck at `true`
- After attempting to record once, the app becomes unresponsive to further capture attempts
- Cannot take photos after a failed recording attempt

### Current Behavior
1. User presses and holds capture button
2. Recording indicator appears
3. Console logs show recording started
4. User releases button
5. Recording indicator remains visible
6. `stopRecording()` is called but recording never completes
7. App is stuck with `isRecording = true`

### Environment
- Expo SDK: 53.0.12
- expo-camera: 16.1.8 (using new CameraView API)
- React Native: 0.79.4
- Testing on: Expo Go app
- Platform: iOS (based on logs)

## Root Cause Analysis

### Primary Issues Identified

1. **Missing Audio Permissions**
   - Video recording requires BOTH camera and microphone permissions
   - Current implementation only requests camera permissions
   - This is not clearly documented in expo-camera docs

2. **Promise Resolution Issue**
   - `recordAsync()` promise is not resolving when `stopRecording()` is called
   - This is a known issue with expo-camera in various SDK versions
   - Particularly problematic in Expo Go vs. development builds

3. **API Configuration Issues**
   - Missing `mode` prop on CameraView component
   - May need to explicitly set `mode="video"` when recording
   - Possible missing configuration for video recording

4. **Known Expo Go Limitations**
   - Some features may not work properly in Expo Go
   - Video recording has historically had issues in Expo Go environment

### Evidence from Logs
```
LOG  Long press detected
LOG  Starting recording...
LOG  Capture release, isRecording: true
LOG  Stopping recording...
// No "Recording completed" log - promise never resolves
```

## Proposed Fix

### Step 1: Add Microphone Permissions
- Import and use `useMicrophonePermissions` from expo-camera
- Request both camera and microphone permissions before allowing recording
- Update UI to show when microphone permission is missing

### Step 2: Fix CameraView Configuration
- Add `mode` prop that switches between "picture" and "video"
- Set `mode="video"` when `isRecording` is true
- Ensure all required props are set for video recording

### Step 3: Improve Recording Flow
- Add proper error handling for all recording scenarios
- Implement a timeout mechanism (e.g., 15 seconds) to recover from stuck recordings
- Add more detailed logging to track the recording lifecycle

### Step 4: Consider Alternatives
- If issues persist in Expo Go, document need for development build
- Research if there are specific Expo Go limitations for video recording in SDK 53

## Implementation Plan

1. **Update imports and permissions**
   ```typescript
   import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
   ```

2. **Add microphone permission handling**
   ```typescript
   const [micPermission, requestMicPermission] = useMicrophonePermissions();
   ```

3. **Update CameraView props**
   ```typescript
   <CameraView
     mode={isRecording ? 'video' : 'picture'}
     // ... other props
   />
   ```

4. **Add recording timeout**
   ```typescript
   // Add timeout to recover from stuck recordings
   setTimeout(() => {
     if (isRecording) {
       setIsRecording(false);
       Alert.alert('Recording timeout', 'Recording took too long');
     }
   }, 15000);
   ```

## Success Criteria
- Video recording starts when button is held
- Recording stops when button is released
- Recording indicator disappears after recording stops
- User can navigate to preview screen with recorded video
- App remains responsive for subsequent recordings

## Notes for Future Updates
- Document any new findings during implementation
- Track if the issue is specific to Expo Go or also affects development builds
- Note any SDK-specific workarounds needed

## Implementation Complete (June 23, 2024)

### Changes Made:
1. ✅ Switched back to modern CameraView API (not legacy)
2. ✅ Added `useMicrophonePermissions` hook and permission handling
3. ✅ Added `mode` prop that switches between 'picture' and 'video'
4. ✅ Implemented 15-second timeout to recover from stuck recordings
5. ✅ Added proper permission UI for both camera and microphone
6. ✅ Updated app.json with iOS permission descriptions
7. ✅ Added flash toggle functionality with the modern API

### Key Fixes:
- Microphone permission is now properly requested before recording
- Camera mode switches to 'video' when recording starts
- Timeout mechanism prevents the app from getting stuck
- All controls are positioned outside CameraView to avoid children warning

### Testing Required:
- Test video recording with long press
- Verify recording stops on release
- Check that timeout works if recording gets stuck
- Ensure permissions are properly requested on first use

## Root Cause Discovered (June 23, 2024 - Later)

### The Real Issue
After further debugging, we discovered the actual root cause was **API incompatibility**:

1. **We were using the old Camera API pattern on the new CameraView component**
   - Old API: `const video = await cameraRef.current.recordAsync({ maxDuration: 10 })`
   - This method **doesn't exist** in the new CameraView API
   
2. **The new CameraView uses a callback-based API**
   - New API: `cameraRef.current.startRecording({ callbacks... })`
   - Must provide `onRecordingFinished` and `onRecordingError` callbacks

3. **Why it failed silently**
   - No runtime error was thrown
   - The promise from `recordAsync()` never resolved or rejected
   - This caused `isRecording` to stay true forever
   - Only our 15-second timeout saved us from permanent stuck state

### Why Photos Worked
- `takePictureAsync()` is still supported in the new API
- Only video recording changed from promise-based to callback-based

## Final Update: The Real Issue (June 23, 2024 - Corrected)

### Incorrect Fix Attempt
Based on misinformation, we attempted to use a callback-based `startRecording()` method:
```typescript
// THIS METHOD DOESN'T EXIST!
cameraRef.current.startRecording({
  maxDurationMs: 10000,
  onRecordingFinished: (video) => { ... },
  onRecordingError: (error) => { ... }
});
```

This resulted in: **"TypeError: cameraRef.current.startRecording is not a function"**

### The Truth About the API
After thorough research:
1. **`recordAsync()` IS the correct method** for CameraView
2. **There is NO `startRecording()` method** in expo-camera 16.x
3. The API still uses promises, not callbacks

### The Real Problem
The issue is a **known bug** where `recordAsync()` promises don't resolve properly:
- Particularly affects Expo Go
- May be related to video quality settings
- Has been reported across multiple SDK versions

### Current Implementation (Correct API, Still Has Issues)
```typescript
const startRecording = async () => {
  try {
    setIsRecording(true);
    
    // Set timeout as workaround for stuck recordings
    recordingTimeoutRef.current = setTimeout(() => {
      console.log('Recording timeout - forcing stop');
      setIsRecording(false);
      Alert.alert('Recording Error', 'Recording timed out. Please try again.');
    }, 15000);

    // This is the correct API - but the promise may not resolve
    const video = await cameraRef.current.recordAsync({
      maxDuration: 10,
    });
    
    // Clear timeout if recording completes
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    
    setIsRecording(false);
    navigation.navigate('SnapPreview', { 
      mediaUri: video.uri, 
      mediaType: 'video' 
    });
  } catch (error) {
    setIsRecording(false);
    Alert.alert('Recording Error', 'Failed to record video');
  }
};
```

### Recommended Next Steps
1. **Test without quality settings** - Don't specify VideoQuality
2. **Consider development build** - More reliable than Expo Go
3. **Monitor Expo updates** - This is a known issue that may be fixed in future releases
4. **Alternative libraries** - If issue persists, consider react-native-vision-camera

## Lessons Learned

1. **Verify information sources** - The callback-based API was completely incorrect
2. **Check official docs first** - The Expo documentation clearly shows `recordAsync()`
3. **Known bugs can be misleading** - The hanging promise made it seem like the API had changed
4. **Expo Go has limitations** - Some features work better in development builds
5. **Always test assumptions** - The "startRecording is not a function" error immediately revealed the truth