import Stripe from 'stripe'

let stripe: Stripe | null = null

try {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_secret_key')) {
    console.warn(
      '⚠️ STRIPE_SECRET_KEY is not set or is using placeholder value. ' +
      'Please get your Stripe API keys from https://dashboard.stripe.com/test/apikeys and add them to your .env file.'
    )
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error)
}

export { stripe }

