# Firebase Auth Runtime Error Fix

## Date: June 23, 2025

## Error Description

```
ERROR [runtime not ready]: Error: Component auth has not been registered yet, js engine: hermes
```

This error occurs when Firebase Auth tries to initialize before React Native's runtime is fully ready.

## Root Cause

Firebase services were being initialized at the module level in `firebase.ts`:

```typescript
// OLD CODE - Causes runtime error
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

This runs immediately when the file is imported, before React Native is ready.

## Fix Applied

Changed to lazy initialization pattern - services are only initialized when first accessed:

```typescript
// NEW CODE - Lazy initialization
let auth: Auth | null = null;

export const getAuth = () => {
  if (!auth) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
  return auth;
};
```

## Files Modified

1. `/src/services/firebase.ts` - Changed exports to getter functions
2. `/src/services/auth.ts` - Updated to use `getAuth()` instead of `auth`

## How to Revert

### Option 1: Revert firebase.ts

Replace the current content with:

```typescript
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5YUv8EfzzwXXwZcMw8O-QhgSaddudLEc",
  authDomain: "snappy-app-ef183.firebaseapp.com",
  projectId: "snappy-app-ef183",
  storageBucket: "snappy-app-ef183.firebasestorage.app",
  messagingSenderId: "729888460044",
  appId: "1:729888460044:web:9797fb19bbab7288018d29",
  measurementId: "G-BY63W1ZP5E"
};

const app = initializeApp(firebaseConfig);

// Direct exports (original approach)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### Option 2: Git Revert

If you committed the changes:
```bash
git revert HEAD
```

## Why This Fix Works

1. **Deferred Initialization**: Services only initialize when the app actually needs them
2. **Runtime Ready**: By the time your code calls `getAuth()`, React Native is fully initialized
3. **Same API**: The getter functions return the same Firebase service instances

## Testing

After applying this fix:
1. Clear Metro cache: `npx expo start -c`
2. Restart the app
3. The runtime error should be gone
4. Firebase services work normally when accessed

## Alternative Solutions

If this fix doesn't work, other options include:
1. Using Firebase Web SDK instead of React Native specific features
2. Initializing Firebase in a React component with useEffect
3. Using a different authentication persistence method