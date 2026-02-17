# Quick Fix: Add Password Login

## In Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** in left sidebar
4. Click **Providers** tab
5. Find **Email** provider
6. Change these settings:
   - **Enable Signup**: ✅ ON
   - **Confirm email**: ❌ OFF (uncheck this)
   - **Enable magic links**: ❌ OFF (uncheck this)
7. Click **Save**

## Then in your app, try signing up with email + password instead of magic link.

## Alternative: Add a simple password form to your login page

If magic links keep failing, I can modify the LoginPage to use email/password instead.

**Which do you prefer?**
A) Disable magic links, enable password signup in Supabase
B) I modify the login page to use email/password
C) Try a different approach