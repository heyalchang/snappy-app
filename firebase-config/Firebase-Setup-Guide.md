# Firebase Setup Guide for Snappy App

## Prerequisites
- Google account (for Firebase)
- Credit card (Firebase requires it for phone auth, but has free tier)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "snappy-app" (or similar)
4. Disable Google Analytics (not needed for class project)
5. Click "Create project"

## Step 2: Enable Phone Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Phone" under Sign-in providers
4. Toggle "Enable" switch
5. Click "Save"

## Step 3: Get Your Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the "</>" (Web) icon
5. Register app with nickname "Snappy Web"
6. Copy the configuration object

## Step 4: Add Configuration to App

Replace the placeholder in `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Configure for Development

### For iOS Simulator Testing:
- Phone auth doesn't work in iOS Simulator
- Use test phone numbers (configured in Firebase Console)

### For Android Emulator:
- Should work with real phone numbers
- May need to configure SHA certificates

### For Physical Device:
- Works with real phone numbers
- Best testing experience

## Step 6: Add Test Phone Numbers (Optional)

1. In Firebase Console > Authentication > Sign-in method
2. Scroll down to "Authorized domains"
3. Add localhost if testing locally
4. Click "Phone numbers for testing" accordion
5. Add test numbers like:
   - Phone: +1 650-555-1234
   - Code: 123456

## Important Notes

### Free Tier Limits:
- 10K SMS verifications/month free
- After that: $0.01-$0.06 per SMS

### Security:
- For production, add SHA certificates (Android)
- Configure bundle IDs (iOS)
- Enable App Check for anti-abuse

### Testing Without Real SMS:
For now, you can continue using the mock auth implementation until you're ready to set up Firebase. The app will work fine with the mock flow.

## Decision Point

You have two options:

1. **Continue with mock auth** - App works but no real SMS
2. **Set up Firebase now** - Real SMS authentication

Both are valid for Phase 1 completion. Real Firebase can be added in Phase 2.