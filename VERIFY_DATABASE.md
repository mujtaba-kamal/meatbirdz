# ✅ Verify Database Connection - Step by Step

Since `DATABASE_URL` is set, let's verify everything else is correct.

---

## Step 1: Verify Connection String Format

Your `DATABASE_URL` in Vercel should look like this:

```
postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Check:**
- ✅ Starts with `postgresql://`
- ✅ Has `postgres.` followed by your project ID
- ✅ Has your actual password (not `[YOUR-PASSWORD]`)
- ✅ Uses port `6543` (connection pooling - recommended for Vercel)
- ✅ OR port `5432` (direct connection)

**Common mistakes:**
- ❌ Still has `[YOUR-PASSWORD]` placeholder
- ❌ Missing password entirely
- ❌ Password has special characters that need URL encoding

---

## Step 2: Test Connection String Locally

Test if your connection string works:

```bash
# 1. Copy your DATABASE_URL from Vercel
# Go to Vercel → Settings → Environment Variables → Copy DATABASE_URL value

# 2. Set it locally
export DATABASE_URL="paste_your_connection_string_here"

# 3. Test connection
npx prisma db push --skip-generate
```

**If it works:**
- ✅ Connection string is correct
- ✅ Database is accessible

**If it fails:**
- ❌ Connection string might be wrong
- ❌ Database might be paused
- ❌ Password might be incorrect

---

## Step 3: Check Database is Set Up

### Check in Supabase:

1. **Go to Supabase Dashboard**
   - https://supabase.com
   - Your Project → **Table Editor**

2. **Verify tables exist:**
   - ✅ `MenuItem` table
   - ✅ `User` table
   - ✅ `Order` table
   - ✅ `OrderItem` table

3. **Check if `MenuItem` has data:**
   - Click on `MenuItem` table
   - Should see 50+ menu items
   - If empty, you need to seed the database

---

## Step 4: Set Up Database (If Empty)

If tables are empty or don't exist:

```bash
# 1. Get your DATABASE_URL from Vercel
# Copy it from: Vercel → Settings → Environment Variables

# 2. Set it locally
export DATABASE_URL="your_connection_string_from_vercel"

# 3. Create tables
npx prisma db push

# 4. Add menu items and test users
npx prisma db seed
```

**After running:**
- Go back to Supabase → Table Editor
- Should see menu items and users

---

## Step 5: Check Other Environment Variables

Even if `DATABASE_URL` is set, check these too:

### In Vercel → Settings → Environment Variables:

1. **NEXTAUTH_SECRET**
   - Should be a random string
   - Generate if missing: https://generate-secret.vercel.app/32

2. **NEXTAUTH_URL**
   - Should be your Vercel URL
   - Example: `https://meatbirdz-xxxxx.vercel.app`
   - Get it from Vercel → Your Project → Settings → Domains

3. **Stripe Keys** (if using payments)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## Step 6: Check Vercel Logs

### Check Build Logs:

1. **Vercel Dashboard** → Your Project → **Deployments**
2. Click on **latest deployment**
3. Check **"Build Logs"**
4. Look for:
   - ✅ "Build successful" or
   - ❌ Any errors?

### Check Function Logs:

1. **Vercel Dashboard** → Your Project → **Logs** or **Functions**
2. Look for errors from `/api/menu`
3. Common errors:
   - `Can't reach database server`
   - `Environment variable not found`
   - `Prisma Client not generated`

---

## Step 7: Test API Endpoint

### Test from Browser:

1. Visit: `https://your-app.vercel.app/api/menu`
2. **What you should see:**
   - JSON array of menu items (if working)
   - Error message (if not working)

### Test from Terminal:

```bash
curl https://your-app.vercel.app/api/menu
```

**Expected:** JSON array starting with `[{`
**If error:** Check Vercel logs for details

---

## Step 8: Common Issues & Fixes

### Issue: "Can't reach database server"

**Possible causes:**
1. Supabase project is paused
2. Connection string is wrong
3. Using wrong port (try 6543 instead of 5432)

**Fix:**
- Check Supabase project is active
- Verify connection string format
- Try connection pooling URL (port 6543)

### Issue: "Table does not exist"

**Cause:** Database not set up

**Fix:**
```bash
export DATABASE_URL="your_connection_string"
npx prisma db push
npx prisma db seed
```

### Issue: "Prisma Client not generated"

**Cause:** Build didn't run `prisma generate`

**Fix:**
- Check `package.json` has `"postinstall": "prisma generate"`
- Redeploy in Vercel

---

## Step 9: Redeploy After Fixes

After making any changes:

1. **If you updated environment variables:**
   - Vercel → Deployments
   - Click "Redeploy" on latest deployment

2. **If you set up database:**
   - No redeploy needed (database is separate)
   - But test the API endpoint

3. **If you pushed code changes:**
   - Vercel auto-deploys from GitHub
   - Or manually redeploy

---

## Quick Diagnostic Checklist

Run through these:

- [ ] `DATABASE_URL` is set in Vercel ✅ (you confirmed this)
- [ ] Connection string format is correct (no placeholders)
- [ ] Supabase project is active (not paused)
- [ ] Database tables exist (check Supabase Table Editor)
- [ ] `MenuItem` table has data (50+ items)
- [ ] `NEXTAUTH_SECRET` is set
- [ ] `NEXTAUTH_URL` is set to your Vercel URL
- [ ] Latest Vercel build succeeded
- [ ] Tested `/api/menu` endpoint (returns JSON array)

---

## What to Check Next

Since `DATABASE_URL` is set, check:

1. **Database Setup:**
   - Go to Supabase → Table Editor
   - Do you see the `MenuItem` table?
   - Does it have menu items in it?

2. **Vercel Logs:**
   - What error do you see in Vercel logs?
   - Is it a database connection error?
   - Or something else?

3. **Test API:**
   - Visit: `https://your-app.vercel.app/api/menu`
   - What do you see? (JSON or error?)

**Share what you find and I'll help you fix the specific issue!**

