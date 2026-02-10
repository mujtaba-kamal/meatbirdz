import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return NextResponse.json(
        { 
          error: 'Stripe is not configured. Please add valid Stripe API keys to your .env file. See STRIPE_SETUP.md for instructions.' 
        },
        { status: 500 }
      )
    }

    const { items, customerInfo, total } = await request.json()

    // Create Stripe Payment Intent without creating order yet
    // Order will be created on confirmation page
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        // Store order data in metadata for later use
        items: JSON.stringify(items),
        customerInfo: JSON.stringify(customerInfo),
        total: total.toString(),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    
    // Provide helpful error message for invalid API key
    let errorMessage = error.message || 'Failed to create payment intent'
    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('api_key')) {
      errorMessage = 'Stripe API key is invalid. Please check your .env file and ensure you have valid Stripe test keys. See STRIPE_SETUP.md for instructions.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

