# 🚀 Quick Deployment Guide - MeatBirdz

Deploy your restaurant ordering website in 10 minutes!

---

## Prerequisites Checklist

- [ ] Code is pushed to GitHub
- [ ] GitHub account ready
- [ ] Email for Supabase and Vercel accounts

---

## Step 1: Push Code to GitHub (2 minutes)

### If you haven't pushed yet:

```bash
# Check if you have a remote
git remote -v

# If no remote, add it:
git remote add origin https://github.com/YOUR_USERNAME/birminghamWebProject.git

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Push
git push -u origin main
```

**Need GitHub token?** Go to: https://github.com/settings/tokens → Generate new token (classic) → Check `repo` → Copy token

---

## Step 2: Set Up Database - Supabase (3 minutes)

1. **Go to**: https://supabase.com
2. **Sign Up** (free account)
3. **Create New Project**:
   - Name: `birminghamWebProject`
   - Password: **SAVE THIS!** (you'll need it)
   - Region: Choose closest to you
   - Click "Create new project"
4. **Wait 2 minutes** for setup
5. **Get Connection String**:
   - Settings (⚙️) → Database
   - Scroll to "Connection string"
   - Click **URI** tab
   - Copy the string (looks like: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`)
   - **SAVE THIS** for Step 3!

---

## Step 3: Deploy to Vercel (5 minutes)

1. **Go to**: https://vercel.com
2. **Sign Up** with GitHub (easiest)
3. **Import Project**:
   - Click "Add New" → "Project"
   - Select your `birminghamWebProject` repository
   - Click "Import"

4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variables** (IMPORTANT!):
   
   Click "Environment Variables" and add these:

   ```
   DATABASE_URL=your_supabase_connection_string_from_step_2
   NEXTAUTH_SECRET=generate_random_string_here
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

   **How to get values:**
   - `DATABASE_URL`: From Step 2 (Supabase connection string)
   - `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` in terminal, or use: https://generate-secret.vercel.app/32
   - `NEXTAUTH_URL`: Will be `https://your-app-name.vercel.app` (Vercel will show this after first deploy)
   - Stripe keys: See Step 4 below

6. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live! 🎉

---

## Step 4: Set Up Stripe (3 minutes)

1. **Go to**: https://dashboard.stripe.com/register
2. **Sign Up** (free account)
3. **Get API Keys**:
   - Go to Developers → API keys
   - Copy **Publishable key** (starts with `pk_test_...`)
   - Copy **Secret key** (starts with `sk_test_...`)
4. **Set Up Webhook**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app-name.vercel.app/api/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy **Signing secret** (starts with `whsec_...`)
5. **Update Vercel Environment Variables**:
   - Go back to Vercel → Your Project → Settings → Environment Variables
   - Update the Stripe keys with your actual keys
   - Click "Redeploy" to apply changes

---

## Step 5: Initialize Database (2 minutes)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Copy your `DATABASE_URL`** (you'll need it)
3. **Run Database Migration** (choose one method):

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set DATABASE_URL locally
export DATABASE_URL="your_supabase_connection_string"

# Push schema
npx prisma db push

# Seed database
npx prisma db seed
```

### Option B: Using Supabase SQL Editor
1. Go to Supabase → SQL Editor
2. Copy contents from `prisma/schema.prisma`
3. Convert to SQL (or use Prisma Studio locally with DATABASE_URL)
4. Run the SQL in Supabase SQL Editor

### Option C: Using Local Terminal
```bash
# Set DATABASE_URL
export DATABASE_URL="your_supabase_connection_string"

# Push schema
npx prisma db push

# Seed database (creates menu items and test users)
npx prisma db seed
```

---

## Step 6: Update NEXTAUTH_URL (1 minute)

1. **Get your Vercel URL**: `https://your-app-name.vercel.app`
2. **Update Environment Variable**:
   - Vercel → Settings → Environment Variables
   - Update `NEXTAUTH_URL` to your actual Vercel URL
   - Click "Redeploy"

---

## Step 7: Test Your Live Site! 🎉

1. Visit: `https://your-app-name.vercel.app`
2. Test features:
   - [ ] Homepage loads
   - [ ] Can register/login
   - [ ] Can view menu
   - [ ] Can add items to cart
   - [ ] Can checkout
   - [ ] Payment works (test mode)
   - [ ] Admin dashboard works

---

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` is correct in Vercel
- Make sure Supabase project is active
- Check if password has special characters (may need URL encoding)

### Build Fails
- Check all environment variables are set
- Check build logs in Vercel dashboard
- Make sure `DATABASE_URL` is accessible

### Stripe Not Working
- Verify all Stripe keys are set in Vercel
- Check webhook URL is correct
- Make sure webhook secret is set

### Images Not Loading
- Check if logo.svg is in `/public` folder
- Verify file paths are correct

---

## What's Free?

✅ **Vercel**: Free hosting (unlimited for personal projects)
✅ **Supabase**: Free database (500MB, 2GB bandwidth)
✅ **Stripe**: Free to use (only pay transaction fees)

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

---

## Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Vercel → Settings → Domains
   - Add your custom domain

2. **Production Stripe Keys**:
   - Switch from test to live keys in Stripe
   - Update in Vercel environment variables

3. **Monitor**:
   - Check Vercel Analytics
   - Monitor Supabase usage
   - Check Stripe dashboard for payments

---

**🎉 Congratulations! Your restaurant ordering website is now live!**
