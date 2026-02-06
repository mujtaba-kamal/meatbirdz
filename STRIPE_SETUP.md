# Stripe Payment Setup Guide

## Quick Setup Steps

### 1. Create a Stripe Account
1. Go to https://stripe.com
2. Click "Sign up" and create a free account
3. Verify your email address

### 2. Get Your Test API Keys
1. After logging in, you'll be in the Stripe Dashboard
2. Click on **"Developers"** in the left sidebar
3. Click on **"API keys"**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - This is safe to expose in frontend
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

### 3. Update Your .env File
Open your `.env` file and replace the placeholder values:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Important:** 
- Copy the keys exactly as shown (including `pk_test_` and `sk_test_` prefixes)
- Don't share these keys publicly
- These are TEST keys - they won't charge real money

### 4. Set Up Webhook (Optional for Testing)
For local development, you can skip webhook setup initially. The payment will still work, but order status updates won't be automatic.

To set up webhooks:
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/webhook`
3. Copy the webhook signing secret it provides
4. Add it to your `.env` file

### 5. Restart Your Server
After updating `.env`, restart your development server:
```bash
npm run dev
```

## Testing Payments

Use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires 3D Secure:** `4000 0027 6000 3184`

Use any:
- Future expiry date (e.g., 12/25)
- Any 3-digit CVC
- Any postal code

## Troubleshooting

**Error: "Invalid API Key"**
- Make sure you copied the full key including the prefix (`pk_test_` or `sk_test_`)
- Check for extra spaces or line breaks
- Restart your server after updating `.env`

**Error: "No such payment_intent"**
- This is normal if you're testing without webhooks
- The order will still be created in the database

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

