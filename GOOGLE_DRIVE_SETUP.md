# Google Drive API Setup Guide

This guide will help you set up Google Drive API integration for your Noman Enterprises invoice application.

## Prerequisites

- Google Account
- Access to Google Cloud Console
- Your application running on localhost:3001 (or your production domain)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Enter project name: `Noman Enterprises Invoice App`
4. Click "Create"

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API" and click "Enable"
4. Also enable "Google OAuth2 API" for user authentication

## Step 3: Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Configure the OAuth consent screen if prompted:
   - **User Type**: External
   - **App Information**:
     - App name: `Noman Enterprises Invoice Manager`
     - User support email: Your email
     - Developer contact: Your email
   - **Scopes**: Add the following scopes:
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/drive.metadata.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

5. **Configure OAuth Client**:
   - **Name**: `Noman Enterprises Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3001` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables with your actual credentials:

```bash
# Google Drive API Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# For production, update the redirect URI:
# NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your application: `http://localhost:3001`

3. Click on the "Cloud Storage" button in the top toolbar

4. Click "Connect Google Drive" 

5. You should be redirected to Google's OAuth consent screen

6. Grant the necessary permissions

7. You should be redirected back to your application with a successful connection

## Step 6: Test Backup Functionality

1. Create or edit some invoices in your application

2. Go to Cloud Storage management

3. Click "Backup Now" to test manual backup

4. Check your Google Drive - you should see a new folder called "Noman Enterprises Invoices" with your backup files

5. Test the restore functionality by clicking "Restore"

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Make sure your redirect URI in Google Cloud Console exactly matches the one in your environment variables
   - Check for trailing slashes and ensure the protocol (http/https) is correct

2. **"unauthorized_client" error**:
   - Verify that your OAuth consent screen is properly configured
   - Make sure your client ID and secret are correct

3. **"access_denied" error**:
   - The user denied permission or there's an issue with scopes
   - Make sure all required scopes are added to your OAuth consent screen

4. **Popup blocked**:
   - Make sure popups are allowed for your domain
   - Some browsers may block the authentication popup

### Testing Checklist:

- [ ] Google Drive API is enabled
- [ ] OAuth2 credentials are created
- [ ] Environment variables are set correctly
- [ ] Redirect URIs match exactly
- [ ] OAuth consent screen is configured
- [ ] Required scopes are added
- [ ] Application restarts after env changes
- [ ] Popups are allowed in browser

## Security Notes

- Never commit your `.env.local` file to version control
- Use different credentials for development and production
- Regularly review and audit API access
- Consider implementing additional security measures for production

## Production Deployment

When deploying to production:

1. Create new OAuth credentials with your production domain
2. Update environment variables in your hosting platform
3. Update redirect URIs to use HTTPS
4. Test the entire flow in production environment

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all credentials and URIs are correct
3. Test with a different Google account
4. Check Google Cloud Console for any API quotas or restrictions

---

Your Google Drive integration should now be working properly! Users can securely backup and restore their invoices to their personal Google Drive accounts.
