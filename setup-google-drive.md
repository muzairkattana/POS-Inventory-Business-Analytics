# Quick Google Drive Setup

## 🚀 Follow these steps to fix the "Google OAuth configuration missing" error:

### Step 1: Go to Google Cloud Console
**[Click here to open Google Cloud Console](https://console.cloud.google.com/)**

### Step 2: Create/Select Project
1. If you don't have a project, click "Create Project"
2. Name it: **"Noman Enterprises Invoice"**
3. Click "Create"

### Step 3: Enable Google Drive API
1. Go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Drive API"**
3. Click it and click **"ENABLE"**

### Step 4: Create OAuth Credentials
1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**

3. **First, configure consent screen:**
   - Click "Configure Consent Screen"
   - Choose **"External"**
   - App name: **"Noman Enterprises Invoice"**
   - User support email: **your email**
   - Developer contact: **your email**
   - Click "Save and Continue"
   - Click "Save and Continue" (skip scopes for now)
   - Click "Save and Continue" (skip test users for now)

4. **Now create OAuth client ID:**
   - Application type: **"Web application"**
   - Name: **"Invoice App"**
   - Authorized JavaScript origins: **`http://localhost:3000`**
   - Authorized redirect URIs: **`http://localhost:3000/api/auth/google/callback`**
   - Click **"Create"**

5. **Copy your credentials:**
   - You'll see a popup with Client ID and Client Secret
   - **Copy both values!**

### Step 5: Update Your Environment File
1. Open the file `.env.local` in your project folder
2. Replace these lines with your actual values:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

### Step 6: Restart Your App
```bash
npm run dev
```

## ✅ Test It
1. Go to your invoice app: http://localhost:3000
2. Click on "Cloud Storage" or the settings menu
3. Click "Connect Google Drive"
4. You should see Google's login screen

## ❌ Still Having Issues?

### Common Problems:
1. **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console is exactly: `http://localhost:3000/api/auth/google/callback`
2. **"This app isn't verified"**: Click "Advanced" > "Go to Invoice App (unsafe)" - this is normal for development
3. **Environment variables not loading**: Make sure `.env.local` is in your project root and restart the dev server

### Quick Debug Checklist:
- [ ] Google Drive API is enabled
- [ ] OAuth consent screen is configured
- [ ] Client ID and Secret are copied correctly (no extra spaces)
- [ ] Redirect URI matches exactly
- [ ] Development server is restarted
- [ ] Using the correct port (3000 vs 3001)

## 🔒 Security Note
- Never share your Client Secret
- The `.env.local` file should never be committed to git
- For production, create separate credentials with your production domain

---

**Need help?** Check the browser console for error messages or review the detailed guide in `GOOGLE_DRIVE_SETUP.md`
