# Free Hosting Guide - Deploy MeatBirdz

This guide covers deploying your Next.js application to free hosting platforms without purchasing a domain.

## Option 1: Vercel (Recommended - Best for Next.js)

Vercel is made by the creators of Next.js and offers the best integration.

### Steps:

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub, GitLab, or email

2. **Prepare Your Code**
   ```bash
   # Make sure your code is in a Git repository
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Push to GitHub**
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/meatbirdz.git
   git push -u origin main
   ```

4. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables:
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
     - `STRIPE_SECRET_KEY` - Your Stripe secret key
     - `NEXTAUTH_URL` - Will be auto-filled (e.g., `https://your-app.vercel.app`)
     - `NEXTAUTH_SECRET` - Generate one: `openssl rand -base64 32`
     - `STRIPE_WEBHOOK_SECRET` - Optional for now

5. **Deploy**
   - Click "Deploy"
   - Your site will be live at `https://your-app-name.vercel.app`

### Free Database Options for Vercel:

**Option A: Supabase (Recommended)**
- Go to https://supabase.com
- Create free account
- Create new project
- Go to Settings → Database
- Copy connection string (use connection pooling URL)
- Add to Vercel environment variables

**Option B: Neon**
- Go to https://neon.tech
- Create free account
- Create project
- Copy connection string
- Add to Vercel environment variables

**Option C: Railway**
- Go to https://railway.app
- Create free account
- Add PostgreSQL service
- Copy connection string
- Add to Vercel environment variables

### After Deployment:

1. **Update Stripe Webhook** (if using):
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhook`
   - Copy webhook secret to Vercel environment variables

2. **Run Database Migrations**:
   ```bash
   # In Vercel dashboard, go to your project → Settings → Environment Variables
   # Or use Vercel CLI:
   vercel env pull .env.local
   npx prisma db push
   npx prisma db seed
   ```

---

## Option 2: Netlify

### Steps:

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Deploy**
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables in Site settings

3. **Note**: Netlify works but Vercel is better optimized for Next.js

---

## Option 3: Railway

Railway can host both your app and database.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy App**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Add environment variables

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will auto-create connection string
   - Copy to your app's environment variables

---

## Option 4: Render

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Connect GitHub repository
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add environment variables

3. **Add PostgreSQL Database**
   - Create new PostgreSQL database
   - Copy connection string
   - Add to environment variables

---

## Quick Comparison

| Platform | Free Tier | Database | Best For |
|----------|-----------|----------|----------|
| **Vercel** | ✅ Excellent | External (Supabase/Neon) | Next.js apps |
| **Netlify** | ✅ Good | External | Static/SSG sites |
| **Railway** | ✅ Limited | ✅ Included | Full-stack apps |
| **Render** | ✅ Limited | ✅ Included | Full-stack apps |

---

## Recommended Setup (Easiest)

1. **Hosting**: Vercel (free, perfect for Next.js)
2. **Database**: Supabase (free tier, easy setup)
3. **Domain**: Use Vercel's free subdomain (`your-app.vercel.app`)

### Complete Setup Steps:

1. Push code to GitHub
2. Deploy to Vercel (connects to GitHub)
3. Create Supabase project
4. Copy Supabase connection string
5. Add all environment variables to Vercel
6. Deploy!

Your site will be live at: `https://your-app-name.vercel.app`

---

## Environment Variables Checklist

Make sure to add these in your hosting platform:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
STRIPE_WEBHOOK_SECRET=whsec_... (optional)
```

---

## Post-Deployment Steps

1. **Initialize Database**:
   ```bash
   # Using Vercel CLI or SSH into your deployment
   npx prisma db push
   npx prisma db seed
   ```

2. **Update Stripe Webhook**:
   - Add production webhook URL in Stripe dashboard
   - Update `STRIPE_WEBHOOK_SECRET` in environment variables

3. **Test Your Site**:
   - Visit your deployed URL
   - Test login, ordering, and payment flow

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

