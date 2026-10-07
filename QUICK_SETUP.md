# Quick Supabase Setup

## Step 1: Add to Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add both variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

## Step 2: Add Locally
1. Copy template: `cp env.local.template .env.local`
2. Edit `.env.local` with same credentials
3. Restart: `npm run dev`

## Result:
- ✅ Production: Uses Vercel variables
- ✅ Development: Uses .env.local
- ✅ Login works with email/password
- ✅ Invoices save to cloud

## Note:
.env.local is ignored by Git, so it won't affect your deployed app.
