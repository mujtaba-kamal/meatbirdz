# 🚀 Deploy MeatBirdz - Step by Step Guide

Follow these steps to deploy your restaurant ordering website for FREE!

---

## Step 1: Push to GitHub (If Not Done Yet)

### Option A: Using Command Line

```bash
# Check if you have a remote
git remote -v

# If no remote, add it:
git remote add origin https://github.com/mujtaba-kamal/birminghamWebProject.git

# Push your code
git push -u origin main
```

**If asked for password:** Use your Personal Access Token (not GitHub password)
- Get token: https://github.com/settings/tokens
- Generate new token (classic) → Check `repo` → Copy token

### Option B: Using GitHub Desktop
1. Open GitHub Desktop
2. Click "Publish repository" or "Push origin"
3. Done!

---

## Step 2: Set Up Free Database (Supabase) - 3 minutes

1. **Go to Supabase**: https://supabase.com
2. **Sign Up** (free account)
3. **Create New Project**:
   - Project name: `birminghamWebProject`
   - Database password: **SAVE THIS PASSWORD!** (you'll need it)
   - Region: Choose closest to you (e.g., `West US` or `Europe West`)
   - Click "Create new project"
4. **Wait 2 minutes** for project to be created
5. **Get Connection String**:
   - Go to **Settings** (gear icon) → **Database**
   - Scroll down to "Connection string"
   - Select **URI** tab
   - Copy the connection string (looks like: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`)
   - **SAVE THIS** - you'll need it in Step 3!

---

## Step 3: Deploy to Vercel - 5 minutes

1. **Go to Vercel**: https://vercel.com
2. **Sign Up** → Click "Sign Up" → Choose "Continue with GitHub"
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Find your `birminghamWebProject` repository
   - Click "Import"
4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - **DON'T CLICK DEPLOY YET!**
5. **Add Environment Variables** (IMPORTANT!):
   - Click "Environment Variables" section
   - Add these one by one:

   ```
   Name: DATABASE_URL
   Value: [paste your Supabase connection string from Step 2]
   ```

   ```
   Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   Value: pk_test_YOUR_PUBLISHABLE_KEY_HERE
   ```

   ```
   Name: STRIPE_SECRET_KEY
   Value: sk_test_YOUR_SECRET_KEY_HERE
   ```

   ```
   Name: NEXTAUTH_SECRET
   Value: [generate one - see below]
   ```

   ```
   Name: NEXTAUTH_URL
   Value: https://meatbirdz.vercel.app
   ```
   (You'll update this after first deploy with your actual URL)

6. **Generate NEXTAUTH_SECRET**:
   - Open terminal and run:
   ```bash
   openssl rand -base64 32
   ```
   - Copy the output and paste as `NEXTAUTH_SECRET` value

7. **Click "Deploy"** 🚀
8. **Wait 2-3 minutes** for deployment to complete
9. **Copy your live URL** (e.g., `https://meatbirdz-xxxxx.vercel.app`)

---

## Step 4: Update NEXTAUTH_URL

After first deployment:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Update value to your actual Vercel URL (e.g., `https://meatbirdz-xxxxx.vercel.app`)
4. Click "Save"
5. Go to **Deployments** tab → Click "..." on latest deployment → **Redeploy**

---

## Step 5: Initialize Database - 2 minutes

You need to create the database tables. Choose one method:

### Method A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd /Users/mujtaba/birminghamWebProject
vercel link

# Pull environment variables
vercel env pull .env.local

# Push database schema
npx prisma db push

# Seed database (adds menu items and test users)
npx prisma db seed
```

### Method B: Using Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Click "New query"
3. Copy and paste the SQL from `prisma/schema.prisma` (convert Prisma schema to SQL)
4. Or use Prisma Studio:
   ```bash
   # Set DATABASE_URL in your local .env
   npx prisma db push
   npx prisma db seed
   ```

---

## Step 6: Set Up Stripe Webhook (Optional but Recommended)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-app-name.vercel.app/api/webhook`
   (Replace with your actual Vercel URL)
4. **Select events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_...`)
7. **Add to Vercel**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Click "Save"
   - Redeploy

---

## ✅ You're Live!

Your website is now live at: **https://your-app-name.vercel.app**

### Test Your Site:

1. **Visit your URL**
2. **Test Login**:
   - Admin: `admin@meatbirdz.com` / `admin123`
   - Customer: `customer@meatbirdz.com` / `customer123`
3. **Test Ordering**:
   - Click "Order Online"
   - Select collection or delivery
   - Add items to cart
   - Checkout
   - Use test card: `4242 4242 4242 4242` (any future date, any CVC)
4. **Test Admin Dashboard**:
   - Login as admin
   - View orders

---

## 🎉 What You Get for FREE:

- ✅ **Hosting**: Vercel (unlimited deployments, 100GB bandwidth/month)
- ✅ **Database**: Supabase (500MB, perfect for small projects)
- ✅ **Domain**: Free subdomain (`your-app.vercel.app`)
- ✅ **SSL Certificate**: Automatic HTTPS
- ✅ **CDN**: Fast global delivery

---

## 🔧 Troubleshooting

### Build Fails:
- Check environment variables are set correctly
- Make sure `DATABASE_URL` is correct
- Check build logs in Vercel dashboard

### Database Connection Error:
- Verify `DATABASE_URL` in Vercel matches Supabase connection string
- Make sure you're using the **pooling URL** (port 6543) or direct connection

### Can't Login:
- Make sure `NEXTAUTH_URL` matches your Vercel URL exactly
- Check `NEXTAUTH_SECRET` is set
- Redeploy after changing environment variables

### Stripe Not Working:
- Verify Stripe keys are correct
- Make sure you're using **test keys** (starts with `pk_test_` and `sk_test_`)
- Check browser console for errors

---

## 📝 Quick Reference

**Your URLs:**
- Live Site: `https://your-app-name.vercel.app`
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com/test

**Test Credentials:**
- Admin: `admin@meatbirdz.com` / `admin123`
- Customer: `customer@meatbirdz.com` / `customer123`

**Test Payment Card:**
- Card: `4242 4242 4242 4242`
- Date: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

---

## 🆘 Need Help?

- Check deployment logs in Vercel dashboard
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Check `DEPLOYMENT.md` for more details

