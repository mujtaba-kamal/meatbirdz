# 🔧 Troubleshooting Vercel Deployment Errors

If you're seeing errors on your live Vercel website, follow these steps:

---

## Step 1: Check Vercel Build Logs

1. **Go to Vercel Dashboard**
   - https://vercel.com
   - Sign in

2. **Select Your Project**
   - Click on `birminghamWebProject`

3. **Check Deployments**
   - Click **"Deployments"** tab
   - Click on the latest deployment
   - Check the **"Build Logs"** section

**Look for:**
- ❌ Build errors
- ❌ Missing environment variables
- ❌ Database connection errors
- ❌ TypeScript/compilation errors

---

## Step 2: Check Function Logs (For API Errors)

1. **In Vercel Dashboard**
   - Go to your project
   - Click **"Functions"** tab (or "Logs")
   - Look for recent errors

**Common API errors:**
- `500 Internal Server Error` on `/api/menu`
- Database connection failures
- Missing environment variables

---

## Step 3: Verify Environment Variables

The most common issue is missing or incorrect environment variables.

### Check in Vercel:

1. **Go to:** Your Project → **Settings** → **Environment Variables**

2. **Verify these are set:**
   - ✅ `DATABASE_URL` - Your Supabase connection string
   - ✅ `NEXTAUTH_SECRET` - Random secret string
   - ✅ `NEXTAUTH_URL` - Your Vercel URL (e.g., `https://meatbirdz-xxxxx.vercel.app`)
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
   - ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key
   - ✅ `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

3. **Check Environment Scope:**
   - Make sure each variable is checked for:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

4. **After adding/updating variables:**
   - Go to **Deployments** tab
   - Click three dots (⋯) on latest deployment
   - Click **"Redeploy"**

---

## Step 4: Common Errors and Fixes

### Error: `500 Internal Server Error` on `/api/menu`

**Cause:** Database connection issue

**Fix:**
1. Check `DATABASE_URL` is set correctly in Vercel
2. Verify Supabase project is active (not paused)
3. Make sure password in connection string is correct
4. Try connection pooling URL (port 6543) instead of direct (port 5432)

**Test:**
```bash
# Test your connection string locally
export DATABASE_URL="your_connection_string"
npx prisma db push
```

### Error: `N.map is not a function`

**Cause:** API returning error object instead of array

**Fix:**
- Already fixed in the code (returns empty array on error)
- Make sure latest code is deployed
- Redeploy if needed

### Error: `Failed to load resource: 404`

**Cause:** Build cache or static files issue

**Fix:**
1. Go to Vercel → Deployments
2. Click three dots (⋯) on latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### Error: `Database connection failed`

**Cause:** Supabase connection string incorrect or database paused

**Fix:**
1. Go to Supabase → Your Project
2. Check if project is active (not paused)
3. Verify connection string in Vercel matches Supabase
4. Make sure password is correct (no special characters that need encoding)

---

## Step 5: Check Database is Set Up

### Verify in Supabase:

1. **Go to Supabase Dashboard**
   - Your Project → **Table Editor**

2. **Check if tables exist:**
   - ✅ `MenuItem` table (should have menu items)
   - ✅ `User` table
   - ✅ `Order` table
   - ✅ `OrderItem` table

3. **If tables are empty:**
   - You need to run database setup (see Step 6)

---

## Step 6: Set Up Database on Vercel

If your database is empty, you need to initialize it:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Set DATABASE_URL (or use the one from .env.local)
export DATABASE_URL="your_supabase_connection_string"

# Push database schema
npx prisma db push

# Seed database
npx prisma db seed
```

### Option B: Using Local Terminal

```bash
# Set DATABASE_URL
export DATABASE_URL="your_supabase_connection_string"

# Push schema
npx prisma db push

# Seed database
npx prisma db seed
```

---

## Step 7: Check Build Configuration

### Verify `package.json` scripts:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Important:** Make sure `prisma generate` runs before build!

---

## Step 8: View Real-Time Logs

1. **In Vercel Dashboard**
   - Go to your project
   - Click **"Logs"** or **"Functions"** tab
   - You'll see real-time logs from your API routes

2. **Check for specific errors:**
   - Database connection errors
   - Missing environment variables
   - API route errors

---

## Step 9: Test Your API Endpoints

### Test from Browser:

1. Visit: `https://your-app.vercel.app/api/menu`
2. Should return JSON array of menu items
3. If you see error, check Vercel logs

### Test from Terminal:

```bash
curl https://your-app.vercel.app/api/menu
```

Should return JSON array, not an error.

---

## Step 10: Common Fixes Checklist

- [ ] All environment variables are set in Vercel
- [ ] `DATABASE_URL` is correct (password replaced)
- [ ] Supabase project is active (not paused)
- [ ] Database tables are created (`prisma db push` run)
- [ ] Database is seeded (`prisma db seed` run)
- [ ] Latest code is deployed
- [ ] Build succeeded (check build logs)
- [ ] Redeployed after adding environment variables

---

## Quick Fix: Redeploy Everything

If nothing works, try a fresh deploy:

1. **Update code** (if needed)
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix deployment issues"
   git push origin main
   ```

3. **In Vercel:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment
   - Or push to GitHub will auto-deploy

4. **Wait for build to complete**
5. **Test your site**

---

## Get Help from Vercel Logs

1. **Go to:** Vercel Dashboard → Your Project → **Logs**
2. **Filter by:**
   - Error level
   - Function name (e.g., `/api/menu`)
   - Time range

3. **Copy error messages** and check:
   - Database connection issues
   - Missing environment variables
   - Build errors

---

## Still Having Issues?

Share these details:
1. **Error message** from browser console
2. **Vercel build logs** (any errors?)
3. **Function logs** (API errors?)
4. **Environment variables** (are they all set?)
5. **Database status** (is Supabase project active?)

Then I can help you fix the specific issue!

