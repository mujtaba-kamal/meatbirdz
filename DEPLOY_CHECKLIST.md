# Deployment Checklist

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All environment variables are ready
- [ ] Database is set up (Supabase/Neon/Railway)
- [ ] Stripe keys are ready

## Deployment Steps

### 1. Vercel Setup
- [ ] Sign up at vercel.com
- [ ] Import GitHub repository
- [ ] Add environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
  - [ ] `NEXTAUTH_URL` (will be auto-filled after first deploy)
  - [ ] `STRIPE_WEBHOOK_SECRET` (optional)

### 2. Database Setup
- [ ] Create Supabase/Neon account
- [ ] Create new database project
- [ ] Copy connection string
- [ ] Add to Vercel environment variables
- [ ] Run migrations (see below)

### 3. After First Deploy
- [ ] Update `NEXTAUTH_URL` to your Vercel URL
- [ ] Run database migrations:
  ```bash
  # Option 1: Using Vercel CLI
  vercel env pull .env.local
  npx prisma db push
  npx prisma db seed
  
  # Option 2: Using Supabase SQL Editor (manual)
  # Copy SQL from prisma/schema.prisma
  ```

### 4. Stripe Webhook Setup
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Add endpoint: `https://your-app.vercel.app/api/webhook`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy webhook secret
- [ ] Add to Vercel environment variables
- [ ] Redeploy

### 5. Testing
- [ ] Visit your site: `https://your-app.vercel.app`
- [ ] Test login (admin@meatbirdz.com / admin123)
- [ ] Test ordering flow
- [ ] Test payment (use test card: 4242 4242 4242 4242)
- [ ] Test admin dashboard

## Your Live URL

After deployment, your site will be at:
**https://your-app-name.vercel.app**

You can share this URL with anyone - no domain purchase needed!

## Free Tier Limits

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Free subdomain

### Supabase Free Tier:
- ✅ 500MB database
- ✅ 2GB bandwidth/month
- ✅ Perfect for small projects

## Need Help?

- Vercel Support: https://vercel.com/support
- Supabase Docs: https://supabase.com/docs
- Check deployment logs in Vercel dashboard if issues occur

