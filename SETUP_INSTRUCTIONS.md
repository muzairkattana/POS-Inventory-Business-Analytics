# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project: `biocurehealthcare`
4. Wait for project to be ready

## 2. Get Your Credentials
Go to Project Settings → API and copy:
- **Project URL**: `https://[YOUR-PROJECT-ID].supabase.co`
- **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 3. Set Up Database
1. Go to SQL Editor in Supabase
2. Paste the contents of `database/supabase_full.sql`
3. Click "Run" to create tables

## 4. Configure Environment
Create `.env.local` file in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Test Integration
```bash
npm run dev
```

Your invoices will now be saved to:
- ✅ localStorage (local backup)
- ✅ IndexedDB (offline storage)
- ✅ Supabase (cloud database)

## Features Enabled
- Auto-save to cloud (5 seconds after changes)
- Manual save to cloud (Update button)
- Delete from cloud (Delete button)
- Offline support (syncs when online)
- Multi-device sync

## Troubleshooting
- Check browser console for "Supabase not configured" messages
- Verify `.env.local` exists with correct values
- Ensure SQL schema was executed successfully
- Check Supabase dashboard for data
