# Quick Deploy Guide - Vercel (5 Minutes)

## Step-by-Step Instructions

### 1. Push Code to GitHub (2 minutes)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/meatbirdz.git
git branch -M main
git push -u origin main
```

### 2. Set Up Free Database - Supabase (2 minutes)

1. Go to https://supabase.com
2. Click "Start your project" → Sign up (free)
3. Create new project:
   - Name: `meatbirdz`
   - Database password: (save this!)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)
5. Go to **Settings** → **Database**
6. Scroll to "Connection string" → Select **URI** format
7. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)

### 3. Deploy to Vercel (1 minute)

1. Go to https://vercel.com
2. Click "Sign Up" → Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your `meatbirdz` repository
5. Vercel auto-detects Next.js - click "Deploy"
6. **Before deployment completes**, click "Environment Variables" and add:

```
DATABASE_URL = [paste your Supabase connection string]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY = sk_test_YOUR_SECRET_KEY_HERE
NEXTAUTH_SECRET = [generate: openssl rand -base64 32]
NEXTAUTH_URL = https://your-app-name.vercel.app
```

7. Click "Redeploy" after adding variables

### 4. Initialize Database (1 minute)

After deployment, you need to run database migrations:

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

**Option B: Using Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Run this to create tables (copy from `prisma/schema.prisma` structure)
3. Or use Supabase's Prisma integration

**Option C: Add Build Command** (Easiest)
Add to Vercel project settings → Build & Development Settings:
- Build Command: `prisma generate && prisma db push && npm run build`
- This will auto-setup database on each deploy

### 5. Your Site is Live! 🎉

Your site will be available at: `https://your-app-name.vercel.app`

---

## Free Domain Options

Even without buying a domain, you get:
- ✅ Vercel: `your-app.vercel.app` (free subdomain)
- ✅ Custom domain: You can add your own domain later if you want

---

## Troubleshooting

**Database connection issues:**
- Make sure you're using the connection pooling URL from Supabase (port 6543)
- Or use the direct connection string

**Build fails:**
- Check environment variables are set correctly
- Make sure `NEXTAUTH_URL` matches your Vercel URL
- Check build logs in Vercel dashboard

**Stripe not working:**
- Make sure you're using test keys
- Update webhook URL in Stripe dashboard to your Vercel URL

---

## Next Steps After Deployment

1. Test your site at the Vercel URL
2. Share the URL with others
3. (Optional) Add custom domain later if needed
