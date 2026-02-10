# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

1. Create a PostgreSQL database (you can use a local PostgreSQL instance or a service like Supabase, Railway, or Neon)

2. Update the `.env` file with your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/birminghamWebProject?schema=public"
```

3. Push the Prisma schema to your database:
```bash
npm run db:push
```

4. Seed the database with sample menu items:
```bash
npm run db:seed
```

## Step 3: Set Up Stripe

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard (use test keys for development)
3. Add them to your `.env` file:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. Set up a webhook endpoint:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `http://localhost:3000/api/webhook` (for local testing)
   - Select events: `payment_intent.succeeded` and `payment_intent.payment_failed`
   - Copy the webhook signing secret to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Application

1. **Browse Menu**: Go to `/menu` to see all available items
2. **Add to Cart**: Click "Add to Cart" on any item
3. **View Cart**: Click the cart icon in the navbar
4. **Checkout**: Click "Proceed to Checkout" and fill in delivery information
5. **Payment**: Use Stripe test card: `4242 4242 4242 4242` with any future expiry date and any CVC
6. **Admin Dashboard**: Go to `/admin` to view and manage orders

## Stripe Test Cards

For testing payments, use these test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0027 6000 3184`

Use any future expiry date, any CVC, and any postal code.

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Verify your DATABASE_URL is correct
- Check that the database exists

### Stripe Payment Issues
- Verify your Stripe keys are correct
- Make sure you're using test keys (pk_test_... and sk_test_...)
- Check the Stripe Dashboard for error logs

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

