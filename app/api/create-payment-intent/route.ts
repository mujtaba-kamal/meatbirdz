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
    const session = await getServerSession(authOptions)

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: session?.user?.id || null,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        deliveryAddress: customerInfo.deliveryAddress,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode || null,
        totalAmount: total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    })

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
      },
    })

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: paymentIntent.id },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
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

