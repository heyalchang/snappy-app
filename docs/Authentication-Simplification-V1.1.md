# Authentication Simplification - V1.1

## Date: December 24, 2024

## Problem
Firebase Auth SDK causes "Component auth has not been registered yet" runtime errors in React Native. This is due to initialization timing issues where Firebase tries to register services before React Native is ready.

## Decision
Remove Firebase Auth SDK completely and implement simple username/password authentication using Firestore.

## Implementation Plan

### 1. Remove Firebase Auth
- Delete all Firebase Auth imports
- Remove `getAuth()` and auth-related code from `firebase.ts`
- Delete phone verification screens (PhoneNumberScreen, VerifyCodeScreen)

### 2. Create Simple Auth System

#### Firestore Schema
```typescript
// users collection
{
  username: string,      // unique identifier
  password: string,      // plaintext for class project
  displayName?: string,
  profilePhotoUrl?: string,
  friends: string[],     // array of usernames
  createdAt: Timestamp
}
```

#### Auth Service Functions
```typescript
// src/services/simpleAuth.ts
async function signUp(username: string, password: string) {
  // Check if username exists
  // If yes, update password (forgot password flow)
  // If no, create new user
}

async function signIn(username: string, password: string) {
  // Query Firestore for username
  // Check password match
  // Return user data or error
}
```

### 3. Update Navigation
- Replace Firebase `onAuthStateChanged` with React Context
- Store current username in context
- Check context instead of Firebase user

### 4. Update All User References
- Change all `user.uid` to `username`
- Update snap/message creation to use username as sender
- Update friend system to use usernames

## Benefits
1. **No initialization errors** - No Firebase Auth SDK to cause timing issues
2. **Simpler architecture** - Direct Firestore queries
3. **Easier debugging** - Can see all data in Firestore console
4. **Meets requirements** - Still provides user identity for snaps/friends/stories

## Security Note
This is intentionally insecure for a class project MVP:
- Passwords stored in plaintext
- No email/phone verification
- No session tokens
- Anyone can read all data

This is acceptable for a class demo but would never be used in production.