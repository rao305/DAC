# Firebase Storage Setup Guide

## Issue
You're seeing CORS errors when uploading images:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy
```

This happens because Firebase Storage needs to be properly configured.

## Solution

### Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dacai-fcdc8**
3. Click **Build** → **Storage** in the left sidebar
4. Click **Get Started**
5. Choose **Start in production mode** (we'll set custom rules next)
6. Click **Next**
7. Select your preferred Cloud Storage location (e.g., `us-central`)
8. Click **Done**

### Step 2: Update Storage Rules

1. In the Firebase Console → Storage → **Rules** tab
2. Replace the existing rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read images (for sharing chat images)
    match /chat-images/{userId}/{allPaths=**} {
      allow read: if true;
      // Only allow authenticated users to upload their own images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

### Step 3: Configure CORS (Optional - Usually Not Needed)

Firebase Storage should automatically handle CORS for web apps. If you still see CORS errors after enabling Storage:

1. Install Google Cloud SDK:
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Create a `cors.json` file:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

3. Apply CORS configuration:
   ```bash
   gcloud auth login
   gsutil cors set cors.json gs://dacai-fcdc8.firebasestorage.app
   ```

### Step 4: Test

1. Refresh your browser
2. Paste an image (Ctrl+V / Cmd+V)
3. Check console - should see:
   ```
   [Storage] Upload complete, getting download URL
   [Storage] Download URL obtained: https://...
   ```
4. Click send - should work!

## Quick Test Without Firebase Storage

If you want to test the image paste feature without setting up Firebase Storage:

1. The app will now allow sending even if uploads fail
2. You'll see a warning: "Some uploads failed - images will be sent as local previews only"
3. Images will be sent as blob URLs (temporary, won't work for backend analysis)

**For full functionality (AI analyzing images), you MUST set up Firebase Storage.**

## Verify Setup

After completing the steps:
1. Go to Firebase Console → Storage
2. You should see a folder structure like:
   ```
   chat-images/
     └── {user-id}/
         └── {timestamp}-{filename}
   ```

## Troubleshooting

### Still seeing CORS errors?
- Make sure Storage is fully enabled (not just initialized)
- Wait 1-2 minutes for changes to propagate
- Clear browser cache and reload

### Upload says "Firebase Storage not initialized"?
- Check that `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set in `.env.local`
- It should be: `dacai-fcdc8.firebasestorage.app`
- Restart the dev server after changing .env

### Images not showing in Firebase Console?
- Check that you're logged in (click the user icon in chat)
- Anonymous users can't upload (auth required)
