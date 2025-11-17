# Switch to Supabase Cloud Configuration

## Step 1: Update Environment Variables

Open `mrkt/.env.local` and replace the Supabase values with these:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kgnpbrdrqsqpcyvzbhjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbnBicmRycXNxcGN5dnpiaGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjU3MTYsImV4cCI6MjA3NzEwMTcxNn0.YRLZBrJDt18IfhEtWUgVK2YRjEqk2Bm9BJQXo2ilGp8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbnBicmRycXNxcGN5dnpiaGp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUyNTcxNiwiZXhwIjoyMDc3MTAxNzE2fQ.1vlvJKy-KPRf8P_ozFqU7pBLZQAeV2lcDn5GWVw_9yw
```

**Keep your existing Clerk keys unchanged!**

## Step 2: Enable Clerk in Supabase Cloud Dashboard

1. Go to: https://supabase.com/dashboard/project/kgnpbrdrqsqpcyvzbhjx/settings/auth

2. Scroll down to **"Third-party Auth Providers"** section

3. Find **"Clerk"** and toggle it ON

4. Enter your Clerk domain:
   ```
   golden-stingray-48.clerk.accounts.dev
   ```

5. Click **Save**

**Screenshot of what to look for:**
- Authentication → Providers → Third-party
- Enable "Clerk"
- Domain field: `golden-stingray-48.clerk.accounts.dev`

## Step 3: Restart Your Dev Server

```bash
cd mrkt

# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test Authentication

1. Go to: http://localhost:3000/test-clerk-jwt
2. Sign out and sign back in (to get fresh JWT)
3. You should now see:
   - ✅ Clerk Status: Signed In
   - ✅ Supabase Status: Ready
   - ✅ Authentication Successful!
   - ✅ Supabase User ID matches Clerk user ID
   - ✅ Events query works

## What Changed?

**Before (Local):**
- Using `http://127.0.0.1:54321` (local Supabase)
- Local GoTrue doesn't support Clerk RS256 JWTs
- Authentication failed with "Auth session missing"

**After (Cloud):**
- Using `https://kgnpbrdrqsqpcyvzbhjx.supabase.co` (Supabase Cloud)
- Cloud GoTrue fully supports Clerk third-party auth
- Automatically fetches Clerk's JWKS for RS256 verification
- Authentication works perfectly!

## Troubleshooting

### Issue: Still getting "Auth session missing"

**Check:**
1. Did you update all 3 environment variables in `.env.local`?
2. Did you enable Clerk in Supabase dashboard?
3. Did you restart the dev server?
4. Did you sign out and back in?

### Issue: "Invalid JWT issuer"

**Cause:** Clerk domain not configured in Supabase

**Solution:** 
- Go to Supabase dashboard → Authentication → Providers
- Enable Clerk
- Enter domain: `golden-stingray-48.clerk.accounts.dev`
- Save

### Issue: Database tables not found

**Cause:** Cloud database might not have migrations

**Solution:**
```bash
# Push your migrations to cloud
cd /Users/jamielinsdell/COMP1060/MRKT-project
supabase db push
```

## Summary

✅ Environment configured for Supabase Cloud
✅ Clerk JWT template has `aud` claim
✅ Ready to enable Clerk in Supabase dashboard
✅ Authentication will work once Clerk is enabled

**Next:** Follow Step 2 to enable Clerk in your Supabase Cloud dashboard!

