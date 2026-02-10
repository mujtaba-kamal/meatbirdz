# ✅ How to Check if Vercel is Connected to Supabase

Step-by-step guide to verify your Vercel deployment is properly connected to Supabase.

---

## Method 1: Check Vercel Environment Variables (Quick Check)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Sign in to your account
3. Click on your project (e.g., `meatbirdz`)

### Step 2: Check Environment Variables
1. Click **Settings** tab (top navigation)
2. Click **Environment Variables** (left sidebar)
3. Look for `DATABASE_URL`

**What to check:**
- ✅ `DATABASE_URL` exists
- ✅ Value is not empty
- ✅ Password is replaced (not `[YOUR-PASSWORD]`)
- ✅ Uses correct format: `postgresql://postgres...`

**To view the value:**
- Click the **eye icon** 👁️ next to `DATABASE_URL`
- Verify it's your Supabase connection string

---

## Method 2: Check Vercel Function Logs (Check Runtime Connection)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Sign in → Select your project

### Step 2: Check Function Logs
1. Click **Functions** tab (or **Logs**)
2. Look for recent API calls to `/api/menu` or `/api/test-db`
3. Check for errors:
   - ❌ `Can't reach database server` = Connection failed
   - ❌ `authentication failed` = Wrong password
   - ✅ No errors = Connection working

---

## Method 3: Use the Test API Endpoint (Recommended)

After deploying, call this endpoint to test the connection:

### Step 1: Deploy Your Code
Make sure your latest code (with `/api/test-db` route) is deployed to Vercel.

### Step 2: Call the Test Endpoint

**Using Browser:**
Visit: `https://meatbirdz.vercel.app/api/test-db`

**Using curl:**
```bash
curl https://meatbirdz.vercel.app/api/test-db
```

**Using JavaScript:**
```javascript
fetch('https://meatbirdz.vercel.app/api/test-db')
  .then(r => r.json())
  .then(console.log)
```

### Step 3: Check the Response

**✅ If Connected Successfully:**
```json
{
  "connected": true,
  "database": {
    "version": "PostgreSQL 15.x...",
    "tables": ["MenuItem", "User", "Order", "OrderItem"],
    "menuItemCount": 50,
    "status": "Tables exist"
  },
  "message": "✅ Successfully connected to Supabase database!"
}
```

**❌ If Connection Failed:**
```json
{
  "connected": false,
  "error": "Can't reach database server...",
  "message": "❌ Failed to connect to database",
  "troubleshooting": {
    "checkVercelEnv": "Go to Vercel → Settings → Environment Variables → Check DATABASE_URL is set",
    "checkSupabase": "Go to Supabase Dashboard → Check if project is Active (not Paused)",
    "checkConnectionString": "Verify DATABASE_URL has correct password (URL encoded if needed)"
  }
}
```

---

## Method 4: Check Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Sign in → Select your project

### Step 2: Check Project Status
- ✅ **Active** = Project is running (good!)
- ⏸️ **Paused** = Project is paused (needs to be restored)

### Step 3: Check Table Editor
1. Click **Table Editor** (left sidebar)
2. Check if tables exist:
   - ✅ `MenuItem` table exists
   - ✅ `User` table exists
   - ✅ `Order` table exists
   - ✅ `OrderItem` table exists

**If tables don't exist:**
- Database hasn't been set up yet
- Need to run `prisma db push` or call `/api/setup-db`

---

## Method 5: Check Vercel Build Logs

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Sign in → Select your project

### Step 2: Check Latest Deployment
1. Click **Deployments** tab
2. Click on the **latest deployment**
3. Check **Build Logs**

**Look for:**
- ✅ `prisma db push` succeeded = Database setup worked
- ❌ `Can't reach database server` = Connection issue
- ❌ `P1001` error = Database connection failed

---

## Common Issues & Solutions

### Issue 1: DATABASE_URL Not Set in Vercel

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add `DATABASE_URL` with your Supabase connection string
3. Make sure to check: Production, Preview, Development
4. Redeploy your project

### Issue 2: Supabase Project is Paused

**Solution:**
1. Go to Supabase Dashboard
2. If project shows "Paused", click "Restore"
3. Wait 2-3 minutes for it to activate
4. Test connection again

### Issue 3: Wrong Password in Connection String

**Solution:**
1. Get connection string from Supabase → Settings → Database
2. Replace `[YOUR-PASSWORD]` with actual password
3. If password has special characters (like `@`), URL encode them:
   - `@` becomes `%40`
   - Example: `Birmingham@1990UK` becomes `Birmingham%401990UK`
4. Update `DATABASE_URL` in Vercel
5. Redeploy

### Issue 4: Connection String Format Wrong

**Check:**
- ✅ Starts with `postgresql://`
- ✅ Has password (not `[YOUR-PASSWORD]`)
- ✅ Uses correct port (5432 for direct, 6543 for pooling)
- ✅ Has correct project ID

**Recommended:** Use connection pooling URL (port 6543) for Vercel:
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres
```

---

## Quick Checklist

- [ ] `DATABASE_URL` is set in Vercel environment variables
- [ ] Password is replaced (not `[YOUR-PASSWORD]`)
- [ ] Supabase project is Active (not Paused)
- [ ] Connection string format is correct
- [ ] Test endpoint `/api/test-db` returns success
- [ ] Tables exist in Supabase Table Editor

---

## Next Steps

Once connection is verified:
1. If tables don't exist → Call `/api/setup-db` to create them
2. If tables exist but empty → Run `npm run db:seed` or call seed script
3. If everything works → Your app should be fully functional!

