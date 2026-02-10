# 🚨 Fix Vercel Production Errors - Quick Guide

Your website is deployed but showing errors. Here's how to fix them:

---

## 🔍 Step 1: Check What's Wrong

### A. Check Vercel Build Logs

1. Go to: https://vercel.com
2. Sign in → Select your `birminghamWebProject` project
3. Click **"Deployments"** tab
4. Click on the **latest deployment**
5. Check **"Build Logs"** for errors

**Look for:**
- ❌ Build failed?
- ❌ Missing environment variables?
- ❌ Database connection errors?

### B. Check Function Logs

1. In Vercel Dashboard → Your Project
2. Click **"Logs"** or **"Functions"** tab
3. Look for errors from `/api/menu`

---

## 🔧 Step 2: Most Common Issues & Fixes

### Issue 1: `500 Internal Server Error` on `/api/menu`

**Cause:** Database not connected or not set up

**Fix:**

1. **Check Environment Variables:**
   - Vercel → Settings → Environment Variables
   - Make sure `DATABASE_URL` is set
   - Value should be your Supabase connection string (with password replaced)

2. **Verify Database is Set Up:**
   - Go to Supabase → Your Project → Table Editor
   - Check if `MenuItem` table exists and has data
   - If empty, you need to run database setup (see below)

3. **Test Database Connection:**
   ```bash
   # Locally, test your connection string
   export DATABASE_URL="your_supabase_connection_string"
   npx prisma db push
   ```

### Issue 2: `404 Not Found` for Static Files

**Cause:** Build cache issue or deployment problem

**Fix:**

1. **Redeploy:**
   - Vercel → Deployments
   - Click three dots (⋯) on latest deployment
   - Click **"Redeploy"**
   - Wait for build to complete

2. **Clear Build Cache:**
   - Vercel → Settings → General
   - Scroll to "Build & Development Settings"
   - Try changing build command temporarily, then change back

### Issue 3: `N.map is not a function`

**Cause:** API returning error instead of array

**Fix:**
- Already fixed in latest code
- Need to deploy the fix (see Step 3)

---

## 🚀 Step 3: Deploy the Fixes

The code fixes are ready. You need to deploy them:

### Option A: Push to GitHub (Auto-Deploy)

```bash
# Make sure you're in the project folder
cd /Users/mujtaba/birminghamWebProject

# Add all changes
git add .

# Commit
git commit -m "Fix API errors and improve error handling"

# Push to GitHub
git push origin main
```

Vercel will automatically deploy when you push to GitHub!

### Option B: Manual Redeploy

1. **In Vercel Dashboard:**
   - Go to Deployments
   - Click three dots (⋯) on latest deployment
   - Click **"Redeploy"**

---

## ✅ Step 4: Verify Environment Variables

**Critical:** Make sure these are set in Vercel:

1. **Go to:** Vercel → Your Project → Settings → Environment Variables

2. **Check these exist:**
   - ✅ `DATABASE_URL` - Your Supabase connection string
   - ✅ `NEXTAUTH_SECRET` - Random string (generate if missing)
   - ✅ `NEXTAUTH_URL` - Your Vercel URL
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe key
   - ✅ `STRIPE_SECRET_KEY` - Stripe key
   - ✅ `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

3. **For each variable:**
   - Check all environments: Production, Preview, Development
   - Make sure values are correct (no placeholders)

4. **After updating:**
   - Go to Deployments
   - Click "Redeploy"

---

## 🗄️ Step 5: Set Up Database (If Not Done)

If your database is empty, you need to initialize it:

### Quick Setup:

```bash
# 1. Get your DATABASE_URL from Vercel
# Go to Vercel → Settings → Environment Variables → Copy DATABASE_URL

# 2. Set it locally
export DATABASE_URL="your_supabase_connection_string_from_vercel"

# 3. Create tables
npx prisma db push

# 4. Add menu items and test users
npx prisma db seed
```

**Verify:**
- Go to Supabase → Table Editor
- Should see `MenuItem` table with 50+ items
- Should see `User` table with 2 test users

---

## 🧪 Step 6: Test Your Live Site

### Test API Endpoint:

1. Visit: `https://your-app.vercel.app/api/menu`
2. Should return JSON array (not error)
3. If error, check Vercel logs

### Test Website:

1. Visit: `https://your-app.vercel.app`
2. Try to:
   - View menu
   - Add items to cart
   - Checkout

---

## 📋 Quick Checklist

- [ ] Code fixes pushed to GitHub (or redeployed)
- [ ] All environment variables set in Vercel
- [ ] `DATABASE_URL` is correct (password replaced)
- [ ] Database tables created (`prisma db push` run)
- [ ] Database seeded (`prisma db seed` run)
- [ ] Latest deployment successful (check build logs)
- [ ] Redeployed after adding/updating environment variables

---

## 🆘 Still Not Working?

### Get More Info:

1. **Check Vercel Logs:**
   - Vercel → Your Project → Logs
   - Filter by "Error"
   - Copy error messages

2. **Test API Directly:**
   - Visit: `https://your-app.vercel.app/api/menu`
   - What do you see? (JSON array or error?)

3. **Check Database:**
   - Supabase → Table Editor
   - Are tables there? Do they have data?

4. **Share with me:**
   - Error messages from browser console
   - Vercel build logs (any errors?)
   - Vercel function logs (API errors?)
   - What you see when visiting `/api/menu`

---

## 🎯 Most Likely Fix

**90% of the time, it's one of these:**

1. **Missing `DATABASE_URL`** in Vercel environment variables
2. **Database not set up** (tables don't exist or are empty)
3. **Need to redeploy** after adding environment variables

**Try this first:**
1. Check environment variables are set
2. Set up database (`prisma db push` and `prisma db seed`)
3. Redeploy in Vercel

---

**Let me know what you find in the Vercel logs and I'll help you fix the specific issue!**

