# 🔄 Try Connection Pooling URL

The direct connection (port 5432) might not work reliably with Vercel. Try using the **Connection Pooling URL** instead.

## How to Get Connection Pooling URL

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Go to Settings → Database**
   - Scroll to "Connection string" section
   - Look for tabs: "URI", "Transaction mode", "Session mode"
   - Click on **"Transaction mode"** or **"Session mode"** tab
   - You should see a connection pooling URL

3. **The pooling URL format:**
   ```
   postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres
   ```
   - Uses port **6543** (not 5432)
   - Has `pooler.supabase.com` in the domain
   - More reliable for serverless/Vercel

4. **Update DATABASE_URL in Vercel:**
   - Copy the pooling URL
   - Replace `[PASSWORD]` with `Birmingham%401990UK` (URL-encoded)
   - Update `DATABASE_URL` in Vercel
   - **Redeploy**

## Alternative: Check Supabase Connection Settings

In Supabase → Settings → Database:
- Look for "Connection Pooling" section
- Make sure it's enabled
- Copy the pooling connection string from there

## Why Connection Pooling?

- ✅ Better for serverless environments (Vercel)
- ✅ Handles many concurrent connections
- ✅ More reliable than direct connections
- ✅ Recommended by Supabase for production

Try the pooling URL and redeploy - this should fix the connection issue!

