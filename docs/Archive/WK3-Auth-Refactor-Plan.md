# Week 3: Auth Refactor Plan

## Overview
Before continuing with snap features, we need to fix the Firebase Auth runtime error by removing Firebase Auth SDK completely and implementing a simple username/password system.

## Implementation Steps

### 1. Remove Firebase Auth
- Delete auth imports from firebase.ts
- Remove getAuth() function
- Keep only Firestore and Storage

### 2. Delete Phone Auth Screens
- Remove PhoneNumberScreen.tsx
- Remove VerifyCodeScreen.tsx
- Remove references from Navigation.tsx

### 3. Update AuthScreen
- Add username and password TextInput fields
- Add "Sign In" and "Sign Up" buttons
- Navigate directly to UsernameScreen for new users
- Navigate to Home for existing users

### 4. Create Simple Auth Service
```typescript
// src/services/simpleAuth.ts
- signUp(username, password): Create/update user doc
- signIn(username, password): Verify credentials
- signOut(): Clear context
- checkUsernameExists(username): For validation
```

### 5. Create Auth Context
```typescript
// src/contexts/AuthContext.tsx
- Store current username
- Provide auth state to app
- Handle login/logout
```

### 6. Update Navigation
- Use AuthContext instead of Firebase onAuthStateChanged
- Simplify flow: Auth → Username (if new) → Home

### 7. Update Existing Features
- Change user.uid to username in:
  - MediaPreviewScreen (snap creation)
  - SnapInboxScreen (query snaps)
  - Any other user references

## Testing
- Sign up with new username
- Sign in with existing username
- Forgot password (sign up again with same username)
- Navigate through app with username context