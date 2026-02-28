# 🚀 Production Readiness Checklist

This document outlines all critical items to verify before launching your website to production.

## ✅ Critical Pre-Launch Items

### 1. Environment Variables (MUST BE SET IN VERCEL)

**Required Variables:**
- [ ] `DATABASE_URL` - PostgreSQL connection string (Supabase/Neon)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://yourdomain.com`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - **LIVE** Stripe publishable key (starts with `pk_live_`)
- [ ] `STRIPE_SECRET_KEY` - **LIVE** Stripe secret key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - **LIVE** webhook secret (starts with `whsec_`)

**⚠️ IMPORTANT:** 
- You currently have LIVE Stripe keys configured (based on conversation history)
- Make sure these are set in Vercel → Settings → Environment Variables
- Ensure they're set for **Production** environment
- **DO NOT** use test keys (`pk_test_`, `sk_test_`) in production

### 2. Database Setup

- [ ] Database is created and accessible (Supabase/Neon/PostgreSQL)
- [ ] `DATABASE_URL` is correctly set in Vercel
- [ ] All Prisma migrations have been run
- [ ] Database tables exist: `MenuItem`, `Order`, `OrderItem`, `User`, `AddOn`
- [ ] Menu items are populated in the database
- [ ] Test database connection: Visit `/api/test-db` (if endpoint exists)

### 3. Stripe Configuration

- [ ] **Switch to LIVE mode** in Stripe Dashboard
- [ ] **LIVE** publishable key is set (`pk_live_...`)
- [ ] **LIVE** secret key is set (`sk_live_...`)
- [ ] Webhook endpoint is configured:
  - URL: `https://yourdomain.com/api/webhook`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - **LIVE** webhook secret is set in environment variables
- [ ] Test payment flow with a real card (small amount) to verify

### 4. Security Checklist

**Authentication & Authorization:**
- [ ] Admin routes are protected (middleware.ts is working)
- [ ] User passwords are hashed (bcrypt - already implemented ✅)
- [ ] Session management is secure (NextAuth - already implemented ✅)
- [ ] Admin credentials are changed from defaults

**API Security:**
- [ ] Stripe webhook signature verification is enabled (✅ implemented)
- [ ] Input validation on all API routes (✅ basic validation exists)
- [ ] Error messages don't expose sensitive information in production
- [ ] SQL injection protection (Prisma ORM - ✅ already protected)

**Data Protection:**
- [ ] Sensitive data (passwords, API keys) are not exposed in client-side code
- [ ] Environment variables are not committed to Git
- [ ] `.env` file is in `.gitignore`

**⚠️ Security Concerns to Address:**
- [ ] **Rate Limiting**: No rate limiting implemented on API routes (consider adding)
- [ ] **CORS**: No explicit CORS configuration (Next.js handles this, but verify)
- [ ] **Input Sanitization**: Basic validation exists, but consider adding more robust sanitization
- [ ] **Setup Endpoints**: `/api/setup-db` has basic auth check, but consider stronger protection

### 5. Error Handling & Logging

**Current Status:**
- ✅ Try-catch blocks in most API routes
- ✅ Console logging for errors
- ⚠️ No centralized error logging service (Sentry, LogRocket, etc.)

**Recommendations:**
- [ ] Consider adding error monitoring (Sentry, LogRocket, or Vercel Analytics)
- [ ] Set up error alerts for critical failures
- [ ] Review error messages to ensure they're user-friendly

### 6. Performance Optimization

**Current Status:**
- ✅ Next.js 14 with App Router
- ✅ Image optimization configured (Cloudinary)
- ✅ React Strict Mode enabled

**To Verify:**
- [ ] Run `npm run build` locally - check for build errors
- [ ] Test page load times (should be < 3 seconds)
- [ ] Verify images are optimized and loading correctly
- [ ] Check mobile performance (Lighthouse score)

### 7. Testing Checklist

**Functional Testing:**
- [ ] User can browse menu
- [ ] User can add items to cart
- [ ] User can customize items (meals, heat levels, quantities, boxes)
- [ ] User can proceed to checkout
- [ ] User can complete payment (test with real card - small amount)
- [ ] Order appears in admin panel
- [ ] Admin can view order details
- [ ] Admin can update order status
- [ ] User receives order confirmation
- [ ] Delivery fee calculation works correctly
- [ ] Collection point selection works

**Payment Testing:**
- [ ] Test successful payment
- [ ] Test failed payment handling
- [ ] Test Cash on Delivery option
- [ ] Verify payment amounts are correct (GBP)
- [ ] Verify Stripe webhook receives events

**Edge Cases:**
- [ ] Empty cart handling
- [ ] Invalid postcode handling
- [ ] Network error handling
- [ ] Session timeout handling

### 8. Content & Configuration

**Menu Items:**
- [ ] All menu items have correct prices
- [ ] All menu items have images
- [ ] Meal options are correctly configured
- [ ] Box customizations are working correctly

**Business Information:**
- [ ] Collection point address is correct: "198 heybarnes road B10 9JF"
- [ ] Delivery postcodes and fees are correct
- [ ] Contact information is accurate
- [ ] Homepage carousel images are correct

**Currency:**
- [ ] All prices display in GBP (£)
- [ ] Stripe is configured for GBP
- [ ] No USD ($) symbols remain

### 9. Domain & SSL

- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active (Vercel provides this automatically ✅)
- [ ] HTTPS is enforced
- [ ] Domain DNS is properly configured

### 10. Backup & Recovery

**Database:**
- [ ] Database backup strategy is in place (Supabase/Neon may provide automatic backups)
- [ ] Know how to restore from backup if needed

**Code:**
- [ ] Code is in version control (GitHub/GitLab)
- [ ] Important branches are protected

### 11. Monitoring & Analytics

**Current Status:**
- ⚠️ No analytics or monitoring service configured

**Recommendations:**
- [ ] Set up Google Analytics or similar
- [ ] Set up Vercel Analytics (if available on your plan)
- [ ] Monitor error rates
- [ ] Track conversion rates (orders placed)

### 12. Legal & Compliance

- [ ] Privacy Policy page exists (if required)
- [ ] Terms of Service page exists (if required)
- [ ] Cookie consent (if required by GDPR)
- [ ] Data protection compliance (GDPR if serving EU customers)

### 13. Documentation

- [ ] Admin credentials are documented securely
- [ ] Deployment process is documented
- [ ] Environment variables are documented
- [ ] Support contact information is available

## 🚨 Critical Issues to Fix Before Launch

### High Priority:
1. **Switch Stripe to LIVE mode** - Currently using live keys, ensure webhook is configured for live mode
2. **Change default admin credentials** - If still using test credentials
3. **Test complete order flow** - End-to-end test with real payment (small amount)
4. **Verify all environment variables** - Double-check all are set correctly in Vercel

### Medium Priority:
1. **Add error monitoring** - Consider Sentry or similar
2. ~~**Add rate limiting** - Protect API routes from abuse~~ ✅ **COMPLETED**
3. **Improve input validation** - Add more robust sanitization
4. **Add analytics** - Track user behavior and conversions
5. **Upgrade rate limiting** - Consider Redis-based solution for high traffic (see RATE_LIMITING.md)

### Low Priority:
1. **Performance optimization** - Further optimize images and code
2. **SEO improvements** - Meta tags, structured data
3. **Accessibility** - WCAG compliance

## 📋 Pre-Launch Testing Script

Run through this complete flow before going live:

1. **Homepage**
   - [ ] Loads correctly
   - [ ] Carousel images display
   - [ ] Navigation works
   - [ ] Mobile responsive

2. **Menu Page**
   - [ ] All items display
   - [ ] Images load
   - [ ] Can add items to cart
   - [ ] Customization options work (meals, heat levels, quantities, boxes)

3. **Cart**
   - [ ] Items appear correctly
   - [ ] Quantities can be updated
   - [ ] Total is correct
   - [ ] Can proceed to checkout

4. **Checkout**
   - [ ] Form validation works
   - [ ] Delivery fee is calculated correctly
   - [ ] Can select delivery or collection
   - [ ] Payment options work

5. **Payment**
   - [ ] Stripe payment form loads
   - [ ] Can complete payment (test with real card - small amount)
   - [ ] Order confirmation appears
   - [ ] Order appears in admin panel

6. **Admin Panel**
   - [ ] Can log in
   - [ ] Can view orders
   - [ ] Can see order details
   - [ ] Can update order status

## ✅ Final Sign-Off

Before launching:
- [ ] All critical items above are checked
- [ ] At least one complete end-to-end test passed
- [ ] Payment processing works with real card (small test amount)
- [ ] Admin panel is accessible and functional
- [ ] All environment variables are set correctly
- [ ] Database is populated with menu items
- [ ] Team is ready to monitor and respond to issues

## 🎯 Post-Launch Monitoring

After launch, monitor:
- [ ] Error rates (check Vercel logs)
- [ ] Payment success rates
- [ ] Order volume
- [ ] User feedback
- [ ] Performance metrics

## 📞 Support Resources

- **Vercel Support**: https://vercel.com/support
- **Stripe Support**: https://support.stripe.com
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Last Updated**: Based on current codebase review
**Status**: Ready for review - Address critical items before launch

