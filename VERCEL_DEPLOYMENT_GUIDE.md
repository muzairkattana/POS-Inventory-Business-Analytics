# Vercel Deployment Guide - Biocure Health Care Invoice System

## Overview
This guide will help you deploy the Biocure Health Care Invoice Management System to Vercel with Supabase database integration.

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Account**: Your code should be in a GitHub repository

---

## Step 1: Setup Supabase Database

### 1.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Enter project details:
   - **Name**: Biocure Invoice System
   - **Database Password**: (Create a strong password and save it)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait for setup to complete

### 1.2 Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql` from your project
4. Paste into the SQL editor
5. Click **"Run"** to execute the schema
6. Verify tables are created: Go to **Table Editor** and check for:
   - `companies`
   - `users`
   - `invoices`

### 1.3 Get API Credentials

1. In Supabase Dashboard, go to **Project Settings** → **API**
2. Copy and save these values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) ⚠️ Keep this secret!

---

## Step 2: Deploy to Vercel

### 2.1 Import Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository containing this project

### 2.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 2.3 Add Environment Variables

Click **"Environment Variables"** and add the following:

#### Required Supabase Variables

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

#### Required Application Variables

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random 32+ character string | Generate using: `openssl rand -base64 32` |

#### Optional Google OAuth Variables (for Google Drive integration)

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Optional - for Google Drive backup |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Optional - for Google Drive backup |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | OAuth redirect URI | `https://your-app.vercel.app/api/auth/callback/google` |

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, you'll get a URL like: `https://your-app.vercel.app`

---

## Step 3: Post-Deployment Configuration

### 3.1 Update Environment Variables

After first deployment, update these variables with your actual Vercel URL:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update:
   - `NEXT_PUBLIC_APP_URL` → Your actual Vercel URL
   - `NEXTAUTH_URL` → Your actual Vercel URL

### 3.2 Configure Supabase Auth

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/login`
   - `https://your-app.vercel.app/`

### 3.3 Test the Deployment

1. Visit your Vercel URL
2. You should see the login page with the Biocure Health Care logo
3. Test authentication:
   - **For Supabase Auth**: Create a new account via sign-up
   - **For Offline Mode**: Use credentials:
     - Email: `Mushtaqkatana55@gmail.com`
     - Password: `Mushtaq1979`

---

## Step 4: Create Admin User (Optional)

If you want to create an admin user directly in Supabase:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add User"**
3. Create user with email: `Mushtaqkatana55@gmail.com`
4. Go to **SQL Editor** and run:

```sql
-- Update user role to admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'Mushtaqkatana55@gmail.com';
```

---

## Environment Variables Summary

### ✅ REQUIRED for Vercel Deployment

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-here
```

### ⚠️ How to Get Each Value:

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Supabase Dashboard → Project Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
   - Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY**: 
   - Supabase Dashboard → Project Settings → API → Project API keys → `service_role`
   - ⚠️ **NEVER expose this key publicly!**

4. **NEXT_PUBLIC_APP_URL** & **NEXTAUTH_URL**: 
   - After first deployment: Your Vercel project URL
   - During first deployment: Use `http://localhost:3000` temporarily

5. **NEXTAUTH_SECRET**: 
   - Generate with: `openssl rand -base64 32`
   - Or use any random 32+ character string

---

## Troubleshooting

### Database Connection Issues

**Problem**: "Supabase not configured" message

**Solution**:
1. Verify all Supabase environment variables are set in Vercel
2. Check that variable names are EXACTLY as shown (case-sensitive)
3. Redeploy after adding variables

### Authentication Issues

**Problem**: Can't sign in after deployment

**Solution**:
1. Check Supabase Auth URL configuration matches Vercel URL
2. Verify `NEXTAUTH_SECRET` is set
3. Clear browser cache and cookies
4. Try creating a new account

### Build Failures

**Problem**: Build fails on Vercel

**Solution**:
1. Check build logs for specific errors
2. Ensure all dependencies in `package.json` are correct
3. Try local build: `npm run build`
4. Check Node.js version compatibility

---

## Default Credentials

### Offline Mode (No Database)
- Email: `Mushtaqkatana55@gmail.com`
- Password: `Mushtaq1979`

### Online Mode (With Supabase)
- Create new accounts via the sign-up form
- Email verification required

---

## Features After Deployment

✅ **Working Features:**
- User authentication (Supabase Auth)
- Invoice creation and management
- Real-time database sync
- Offline mode with localStorage fallback
- PDF/Word export
- PWA installation
- Mobile responsive design

✅ **Company Information:**
- Name: Biocure Health Care
- NTN: 6309621-3
- Address: Sheikh Maltoon
- Phone: 0345-5167742
- Email: biocurehealthcare1979@gmail.com

---

## Security Best Practices

1. ✅ **Never commit `.env.local` to Git**
2. ✅ **Keep `SUPABASE_SERVICE_ROLE_KEY` secret**
3. ✅ **Use strong passwords for Supabase database**
4. ✅ **Enable 2FA on Vercel and Supabase accounts**
5. ✅ **Regularly rotate API keys**
6. ✅ **Monitor Supabase logs for suspicious activity**

---

## Support & Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Vercel will automatically rebuild and deploy
3. No need to re-enter environment variables

### Database Backups

Supabase provides automatic backups:
- Daily backups for Pro plans
- Manual backups available in Dashboard → Database → Backups

### Monitoring

- **Vercel**: Dashboard → Your Project → Analytics
- **Supabase**: Dashboard → Reports

---

## Quick Reference: Complete Environment Variables

Copy this template and fill in your actual values:

```env
# ============================================
# REQUIRED - Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ============================================
# REQUIRED - Application Configuration
# ============================================
NEXT_PUBLIC_APP_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# ============================================
# OPTIONAL - Google OAuth (for Drive backup)
# ============================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=
```

---

## Success Checklist

Before going live, verify:

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] All required environment variables added to Vercel
- [ ] Application deployed successfully
- [ ] Login page shows Biocure Health Care logo
- [ ] Can create new user account
- [ ] Can create and save invoices
- [ ] Invoices sync to Supabase database
- [ ] PDF export works
- [ ] Mobile PWA install works

---

**🎉 Congratulations!** Your Biocure Health Care Invoice System is now live!

For issues or questions, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
