# Google Drive Integration - Your Credentials

## ✅ Configuration Complete!

Your Google OAuth credentials have been configured in `.env.local`

---

## 📋 Your Google Credentials

### OAuth 2.0 Client Credentials:

```
Client ID: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
Client Secret: YOUR_GOOGLE_CLIENT_SECRET
```

---

## 🔧 Next Steps Required

### 1. Configure Redirect URIs in Google Cloud Console

You MUST add these redirect URIs in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:

**For Local Development:**
```
http://localhost:3000/api/auth/callback/google
```

**For Production (Vercel) - Add after deployment:**
```
https://your-app.vercel.app/api/auth/callback/google
```

4. Click **"Save"**

---

### 2. Enable Required APIs

Make sure these are enabled in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/library
2. Search and enable:
   - ✅ **Google Drive API**
   - ✅ **Google People API**

---

### 3. Configure OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Configure:
   - **App name**: Biocure Health Care Invoice System
   - **User support email**: Your email
   - **Developer contact**: Your email
3. Add Scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
4. Save

---

## 📝 Environment Variables

### Local (.env.local) - Already Configured ✅

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

### Vercel Production - Add These Variables:

Go to Vercel Dashboard → Settings → Environment Variables:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `YOUR_GOOGLE_CLIENT_SECRET` |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback/google` |

⚠️ Replace `your-app.vercel.app` with your actual Vercel URL

---

## 🧪 Testing

### Local Testing:

1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000
3. Click "Cloud Storage" button
4. Click "Connect Google Drive"
5. Sign in with Google
6. Grant permissions
7. Should redirect back and show "Connected"

### What You'll See:

✅ Google login popup/redirect  
✅ Permission request screen  
✅ Redirect back to your app  
✅ "Connected to Google Drive" status  
✅ Backup buttons become active  

---

## ⚠️ Important Security Notes

1. **Client Secret is Sensitive**
   - Never share publicly
   - Already in `.gitignore` (won't be committed)
   - Only store in environment variables

2. **Redirect URIs Must Match Exactly**
   - No trailing slashes
   - Correct protocol (http/https)
   - Must match what's in Google Console

3. **OAuth Scopes**
   - `drive.file` = Only files created by your app
   - No access to user's other Drive files
   - Secure and limited access

---

## 🚀 How It Works

### User Flow:

1. User clicks "Connect Google Drive"
2. Redirected to Google login
3. User grants permissions
4. Redirected back to your app
5. Access token stored securely
6. Invoices auto-backup to their Drive

### Features:

✅ Automatic backup to Google Drive  
✅ Secure OAuth 2.0 authentication  
✅ Access from any device  
✅ Share invoices via Drive links  
✅ Never lose data  
✅ Works alongside local storage  

---

## 📊 Summary Checklist

Before using Google Drive integration:

- [ ] Redirect URIs added in Google Console (local + production)
- [ ] Google Drive API enabled
- [ ] Google People API enabled
- [ ] OAuth consent screen configured
- [ ] Environment variables set locally (already done ✅)
- [ ] Test connection locally
- [ ] Add Vercel env vars after deployment
- [ ] Update production redirect URI in Google Console

---

## 🆘 Troubleshooting

### Error: "Redirect URI mismatch"
**Fix:** Make sure redirect URI in Google Console matches exactly:
- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-actual-vercel-url.vercel.app/api/auth/callback/google`

### Error: "Access blocked"
**Fix:** 
1. Configure OAuth consent screen
2. Add your email as test user
3. Enable Google Drive API

### Connection Not Working
**Fix:**
1. Verify all 3 env variables are set
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Clear browser cache/cookies

---

## 📞 Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Credentials Page**: https://console.cloud.google.com/apis/credentials
- **API Library**: https://console.cloud.google.com/apis/library
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent

---

## 🎉 Ready to Use!

Once you complete the steps above (adding redirect URIs and enabling APIs), your Google Drive backup will be fully functional!

Users can:
- Connect their Google Drive
- Auto-backup invoices
- Access from any device
- Share via Drive links

---

© 2025 Biocure Health Care - Secure Cloud Backup
