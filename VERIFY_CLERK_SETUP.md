# Verify Clerk JWT Template Setup

## Quick Check

The error "Failed to execute 'atob'" typically means the Clerk JWT template named "supabase" is missing or misconfigured.

## Step 1: Check if JWT Template Exists

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to: **Configure → JWT Templates**
4. Look for a template named exactly: **`supabase`**

### If Template EXISTS:
- Check that it's **Active** (not disabled)
- Verify the algorithm is **RS256**
- Confirm it has custom claims configured
- Click into it and verify the configuration (see Step 2)

### If Template DOES NOT EXIST:
Proceed to Step 2 to create it.

## Step 2: Create/Update JWT Template

### Via Clerk Dashboard (Recommended)

1. In Clerk Dashboard → **Configure → JWT Templates**
2. Click **"New template"** (or edit existing "supabase" template)
3. Configure:

**Name:** (must be exactly this)
```
supabase
```

**Lifetime:** 
```
3600
```
(1 hour, in seconds)

**Algorithm:**
```
RS256
```

**Custom Claims:** (JSON format)
```json
{
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "phone": "{{user.primary_phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "full_name": "{{user.full_name}}",
    "avatar_url": "{{user.profile_image_url}}"
  }
}
```

4. Click **Save**
5. Verify the template appears in the list as **Active**

### Standard Claims (Automatic)

These are automatically included by Clerk:
- `sub` - User's Clerk ID (becomes `auth.uid()` in Supabase)
- `aud` - Audience (authenticated)
- `iss` - Issuer (your Clerk domain)
- `exp` - Expiration timestamp
- `iat` - Issued at timestamp
- `nbf` - Not before timestamp

## Step 3: Test the Template

1. Go back to your app: http://localhost:3000/test-clerk-jwt
2. Refresh the page
3. Check the console for logs:
   - Look for: `[Test] Token received: yes`
   - Look for: `[Test] JWT decoded successfully`

## Step 4: Verify JWT Contents

If the test page now works, you should see:

**Decoded JWT should contain:**
```json
{
  "sub": "user_2abc123...",  // Your Clerk user ID
  "role": "authenticated",
  "email": "your@email.com",
  "aud": "authenticated",
  "iss": "https://golden-stingray-48.clerk.accounts.dev",
  "exp": 1234567890,
  "iat": 1234567890,
  // ... other fields
}
```

**Key field for RLS:**
- `sub` → This becomes `auth.uid()` in Supabase RLS policies

## Troubleshooting

### Issue: Still getting "Failed to execute 'atob'" error

**Possible causes:**
1. JWT template name is wrong (must be exactly "supabase")
2. Template is disabled/inactive
3. Browser cache - try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. You're not signed in to Clerk

**Solution:**
- Double-check template name spelling
- Ensure template is Active
- Sign out and sign back in
- Clear browser cache

### Issue: "No JWT token received from Clerk"

**Causes:**
1. Not signed in
2. Template doesn't exist
3. Network error

**Solution:**
- Ensure you're signed in at /sign-in
- Check Clerk dashboard for template
- Check browser console for errors

### Issue: JWT decodes but authentication still fails

**Causes:**
1. Supabase config issue
2. RLS policy mismatch
3. User ID mismatch

**Solution:**
- Check `supabase/config.toml` has Clerk enabled
- Verify RLS policies use `auth.uid()`
- Compare `sub` claim with expected user ID

## Via Clerk API (Alternative Method)

If you prefer to create the template via API:

```bash
curl -X POST https://api.clerk.com/v1/jwt_templates \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supabase",
    "lifetime": 3600,
    "allowed_clock_skew": 5,
    "custom_signing_key": false,
    "signing_algorithm": "RS256",
    "claims": {
      "role": "authenticated",
      "email": "{{user.primary_email_address}}",
      "app_metadata": {
        "provider": "clerk"
      }
    }
  }'
```

Replace `YOUR_CLERK_SECRET_KEY` with your Clerk Secret Key from the dashboard.

## Expected Result

After completing these steps:

✅ Template named "supabase" exists and is Active
✅ Algorithm is RS256
✅ Custom claims are configured
✅ Test page shows JWT token and decoded payload
✅ Authentication works with Supabase

## Need Help?

If you're still having issues:

1. Check the browser console logs (F12 → Console tab)
2. Look for any red error messages
3. Copy the error message
4. Check if the error is from Clerk or Supabase

**Common errors:**
- `No JWT token` → Template doesn't exist or wrong name
- `Failed to decode` → Template exists but returns invalid JWT
- `Invalid signature` → Supabase can't verify RS256 signature (separate issue)

---

*For more information:*
- [Clerk JWT Templates Docs](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase + Clerk Integration](https://supabase.com/docs/guides/auth/social-login/auth-clerk)

