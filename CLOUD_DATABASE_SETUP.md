# Cloud Database Setup Guide

## 🔍 Issue Analysis

Your app is **NOT syncing to cloud** because:

1. **Supabase requires authentication** - Users must be logged in
2. **No login page exists** - App runs in offline mode by default
3. **Database tables need Row Level Security (RLS)** configured

---

## ✅ Quick Fix Options

### Option 1: Add Simple Login System (Recommended)

Create a login page at `/login`:

```tsx
// app/login/page.tsx
"use client"
import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await signIn(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### Option 2: Configure Supabase Database

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor
3. **Run this SQL**:

```sql
-- Disable RLS temporarily for testing (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_kv DISABLE ROW LEVEL SECURITY;

-- OR enable RLS with proper policies:

-- Allow authenticated users to access their own invoices
CREATE POLICY "Users can view their own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON invoices FOR DELETE
USING (auth.uid() = user_id);
```

### Option 3: Create Test User

In Supabase Dashboard:
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Email: `test@biocure.com`
4. Password: `Test123456!`
5. Click **Create user**

Then use these credentials in your app's login page.

---

## 🔧 Current Status

Your `.env.local` has:
- ✅ Supabase URL configured
- ✅ Anon key configured
- ❌ Service role key placeholder (not critical)

---

## 📋 Steps to Enable Cloud Sync

1. **Create login page** (Option 1 above)
2. **Configure database RLS** (Option 2 above)
3. **Create test user** (Option 3 above)
4. **Test the flow**:
   - Go to `/login`
   - Login with test credentials
   - Create/edit invoices
   - Check Supabase dashboard to see synced data

---

## 🚀 Automatic Sync

Once authenticated, the app will automatically:
- ✅ Sync local invoices to cloud on login
- ✅ Pull cloud invoices to local storage
- ✅ Auto-save changes to cloud
- ✅ Work offline and sync when online

---

## ⚠️ Important Notes

1. **Without login, app runs offline-only** - this is intentional
2. **Cloud sync requires authentication** - for data security
3. **RLS protects your data** - users can only access their own invoices
4. **Local storage always works** - cloud is optional backup

---

## 💡 Alternative: Anonymous Mode

If you want cloud sync WITHOUT login:

```typescript
// Modify lib/supabase-service.ts

async getCurrentUser() {
  // Skip auth check - use anonymous mode
  return { id: 'anonymous-user' }
}
```

⚠️ **Warning**: This allows anyone to access all data - NOT SECURE!

---

## Need Help?

1. Check browser console for errors
2. Check Supabase dashboard logs
3. Verify database tables exist
4. Test with `localStorage.getItem('saved-invoices')`

