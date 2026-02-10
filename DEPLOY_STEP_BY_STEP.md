# 🚀 Deploy Your Website - Step by Step Guide

Follow these steps in order. Each step takes just a few minutes!

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Your code is ready
- ✅ GitHub account (free)
- ✅ Email address for accounts

---

## Step 1: Push Code to GitHub (5 minutes)

### 1.1 Check if you have a GitHub repository

```bash
cd /Users/mujtaba/birminghamWebProject
git remote -v
```

If you see a URL, skip to Step 1.3. If not, continue to Step 1.2.

### 1.2 Create GitHub Repository (if needed)

1. Go to: https://github.com/new
2. Repository name: `birminghamWebProject`
3. Make it **Public** (or Private - your choice)
4. **Don't** check "Initialize with README"
5. Click "Create repository"

### 1.3 Push Your Code

```bash
# Make sure you're in the project folder
cd /Users/mujtaba/birminghamWebProject

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# If you don't have a remote, add it:
git remote add origin https://github.com/YOUR_USERNAME/birminghamWebProject.git
# Replace YOUR_USERNAME with your GitHub username

# Push to GitHub
git push -u origin main
```

**If asked for password:**
- Use a **Personal Access Token** (not your GitHub password)
- Get token: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Check `repo` permission
- Copy the token and use it as password

✅ **Done!** Your code is now on GitHub.

---

## Step 2: Set Up Supabase Database (5 minutes)

### 2.1 Create Supabase Account

1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Verify your email if needed

### 2.2 Create New Project

1. Click "New Project"
2. Fill in:
   - **Organization:** Create new (or use existing)
   - **Name:** `birminghamWebProject`
   - **Database Password:** Create a strong password
     - **⚠️ SAVE THIS PASSWORD!** You'll need it!
     - Write it down somewhere safe
   - **Region:** Choose closest to you
     - Examples: `West US`, `Europe West`, `Southeast Asia`
3. Click "Create new project"
4. **Wait 2-3 minutes** for project to be created

### 2.3 Get Database Connection String

1. Once project is ready, go to **Settings** (⚙️ icon, bottom left)
2. Click **Database** (in left sidebar)
3. Scroll down to **Connection string**
4. Click the **URI** tab
5. You'll see something like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
6. **Copy this entire string**
7. **Replace `[YOUR-PASSWORD]`** with the password you created in Step 2.2
8. **Save this connection string** - you'll need it in Step 3!

✅ **Done!** Your database is ready.

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Create Vercel Account

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" (easiest)
4. Authorize Vercel to access your GitHub

### 3.2 Import Your Project

1. Click "Add New..." → "Project"
2. You'll see your GitHub repositories
3. Find `birminghamWebProject` and click **Import**
4. Click **Import** again on the next screen

### 3.3 Configure Project Settings

**Leave these as default:**
- Framework Preset: Next.js (auto-detected)
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

**Click "Environment Variables"** (important!)

### 3.4 Add Environment Variables

Click "Add" for each of these:

#### 1. DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** Paste the connection string from Step 2.3
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

#### 2. NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Generate a random string:
  - Go to: https://generate-secret.vercel.app/32
  - Or run in terminal: `openssl rand -base64 32`
  - Copy the generated string
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

#### 3. NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://meatbirdz.vercel.app` (or your project name)
  - ⚠️ We'll update this after first deploy with actual URL
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

#### 4. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Key:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value:** We'll get this in Step 4 (for now, use: `pk_test_placeholder`)
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

#### 5. STRIPE_SECRET_KEY
- **Key:** `STRIPE_SECRET_KEY`
- **Value:** We'll get this in Step 4 (for now, use: `sk_test_placeholder`)
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

#### 6. STRIPE_WEBHOOK_SECRET
- **Key:** `STRIPE_WEBHOOK_SECRET`
- **Value:** We'll get this in Step 4 (for now, use: `whsec_placeholder`)
- **Environment:** Production, Preview, Development (check all)
- Click "Save"

### 3.5 Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll see "Building..." then "Ready"
4. Click the link to see your live site! 🎉

**Your site URL will be:** `https://meatbirdz-xxxxx.vercel.app` (or similar)

✅ **Done!** Your website is live (but database isn't set up yet).

---

## Step 4: Set Up Stripe (5 minutes)

### 4.1 Create Stripe Account

1. Go to: https://dashboard.stripe.com/register
2. Sign up (free account)
3. Verify your email

### 4.2 Get API Keys

1. In Stripe dashboard, go to **Developers** → **API keys**
2. Make sure you're in **Test mode** (toggle in top right)
3. Copy **Publishable key** (starts with `pk_test_...`)
4. Click "Reveal test key" and copy **Secret key** (starts with `sk_test_...`)

### 4.3 Set Up Webhook

1. In Stripe, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** 
   - Go to Vercel dashboard
   - Get your site URL (e.g., `https://meatbirdz-xxxxx.vercel.app`)
   - Add: `/api/webhook`
   - Full URL: `https://meatbirdz-xxxxx.vercel.app/api/webhook`
4. **Description:** `MeatBirdz Webhook`
5. **Events to send:** Click "Select events"
   - Check: `payment_intent.succeeded`
   - Check: `payment_intent.payment_failed`
6. Click "Add endpoint"
7. Click on the new webhook
8. Copy **Signing secret** (starts with `whsec_...`)

### 4.4 Update Vercel Environment Variables

1. Go back to Vercel dashboard
2. Your Project → **Settings** → **Environment Variables**
3. Update these three:

   **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:**
   - Click "Edit"
   - Replace with your `pk_test_...` key
   - Save

   **STRIPE_SECRET_KEY:**
   - Click "Edit"
   - Replace with your `sk_test_...` key
   - Save

   **STRIPE_WEBHOOK_SECRET:**
   - Click "Edit"
   - Replace with your `whsec_...` secret
   - Save

4. Go to **Deployments** tab
5. Click the three dots (⋯) on latest deployment
6. Click **"Redeploy"**
7. Wait for redeploy to complete

✅ **Done!** Stripe is now connected.

---

## Step 5: Initialize Database (5 minutes)

### 5.1 Get Your Database URL

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Copy your `DATABASE_URL` value

### 5.2 Run Database Migration

**Option A: Using Terminal (Recommended)**

```bash
# Make sure you're in your project folder
cd /Users/mujtaba/birminghamWebProject

# Set the database URL (replace with your actual URL)
export DATABASE_URL="your_supabase_connection_string_here"

# Push the database schema
npx prisma db push

# Seed the database (creates menu items and test users)
npx prisma db seed
```

**Option B: Using Supabase SQL Editor**

1. Go to Supabase → Your Project → **SQL Editor**
2. Click "New query"
3. You'll need to manually create tables (complex - not recommended)

**Option C: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set environment variable locally
export DATABASE_URL="your_supabase_connection_string_here"

# Push schema
npx prisma db push

# Seed database
npx prisma db seed
```

### 5.3 Verify Database

1. Go to Supabase → **Table Editor**
2. You should see:
   - `MenuItem` table (with your menu items)
   - `User` table (with test users)
   - `Order` table (empty, ready for orders)
   - `OrderItem` table (empty)

✅ **Done!** Database is set up with menu items.

---

## Step 6: Update NEXTAUTH_URL (2 minutes)

### 6.1 Get Your Actual Vercel URL

1. Go to Vercel dashboard
2. Your Project → **Settings** → **Domains**
3. Copy your production URL (e.g., `https://meatbirdz-xxxxx.vercel.app`)

### 6.2 Update Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Click "Edit"
4. Replace with your actual Vercel URL
5. Click "Save"

### 6.3 Redeploy

1. Go to **Deployments** tab
2. Click three dots (⋯) on latest deployment
3. Click **"Redeploy"**
4. Wait for completion

✅ **Done!** Authentication will now work properly.

---

## Step 7: Test Your Live Website! 🎉

### 7.1 Visit Your Site

Go to: `https://your-app-name.vercel.app`

### 7.2 Test These Features

- [ ] **Homepage loads** - Should see your logo and menu
- [ ] **Register** - Create a new account
- [ ] **Login** - Use test credentials:
  - Admin: `admin@meatbirdz.com` / `admin123`
  - Customer: `customer@meatbirdz.com` / `customer123`
- [ ] **View Menu** - Should see all menu items
- [ ] **Add to Cart** - Add items to cart
- [ ] **Checkout** - Go through checkout process
- [ ] **Payment** - Test payment (use Stripe test card: `4242 4242 4242 4242`)
- [ ] **Admin Dashboard** - Login as admin, view orders

### 7.3 Test Cards (Stripe Test Mode)

Use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Any future date** for expiry
- **Any 3 digits** for CVC
- **Any ZIP code**

✅ **Done!** Your website is fully functional!

---

## 🎉 Congratulations!

Your restaurant ordering website is now **LIVE** and ready for customers!

### Your Live URLs:
- **Website:** `https://your-app-name.vercel.app`
- **Admin Dashboard:** `https://your-app-name.vercel.app/admin`

### Test Credentials:
- **Admin:** `admin@meatbirdz.com` / `admin123`
- **Customer:** `customer@meatbirdz.com` / `customer123`

---

## 🔧 Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` is correct in Vercel
- Make sure password doesn't have special characters (or URL encode them)
- Verify Supabase project is active

### Build Fails
- Check all environment variables are set
- Check build logs in Vercel dashboard
- Make sure `DATABASE_URL` is accessible

### Stripe Not Working
- Verify all Stripe keys are set in Vercel
- Check webhook URL is correct
- Make sure webhook secret is set
- Redeploy after adding Stripe keys

### Can't Login
- Check `NEXTAUTH_URL` matches your Vercel URL
- Verify `NEXTAUTH_SECRET` is set
- Redeploy after updating `NEXTAUTH_URL`

---

## 📝 Next Steps

1. **Custom Domain** (Optional):
   - Vercel → Settings → Domains
   - Add your domain (e.g., `meatbirdz.com`)
   - Follow DNS instructions

2. **Production Stripe Keys**:
   - When ready, switch from test to live keys
   - Update in Vercel environment variables

3. **Monitor**:
   - Check Vercel Analytics
   - Monitor Supabase usage
   - Check Stripe dashboard for payments

---

## 💰 Cost Summary

- **Vercel:** FREE (100GB bandwidth/month)
- **Supabase:** FREE (500MB database)
- **Stripe:** FREE (only pay transaction fees ~2.9% + $0.30 per transaction)

**Total Monthly Cost: $0** (until you scale up!)

---

**Need help?** Check the build logs in Vercel dashboard for specific errors.

