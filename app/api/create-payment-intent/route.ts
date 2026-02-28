import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { rateLimiters } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiters.strict(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

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

    const { items, customerInfo, total, orderType } = await request.json()

    // Create Stripe Payment Intent without creating order yet
    // Order will be created on confirmation page from sessionStorage
    // Store only minimal data in metadata (Stripe has 500 char limit per metadata value)
    const itemCount = items.length
    const itemSummary = items.slice(0, 3).map((item: any) => item.name).join(', ')
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to pence (GBP smallest unit)
      currency: 'gbp',
      metadata: {
        // Store only essential summary data (within 500 char limit)
        itemCount: itemCount.toString(),
        itemSummary: itemSummary.substring(0, 200), // Truncate if needed
        total: total.toString(),
        orderType: orderType || 'delivery',
        // Store customer email for reference (if available)
        customerEmail: customerInfo?.customerEmail?.substring(0, 100) || '',
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

