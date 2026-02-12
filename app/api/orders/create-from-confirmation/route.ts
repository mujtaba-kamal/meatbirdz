import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { PaymentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let items: any[] = []
  try {
    const requestData = await request.json()
    items = requestData.items || []
    const { customerInfo, total, paymentIntentId, orderType } = requestData
    const session = await getServerSession(authOptions)

    // Validate userId exists if provided
    let validUserId: string | null = null
    if (session?.user?.id) {
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })
      if (userExists) {
        validUserId = session.user.id
      }
    }

    // For Stripe payments, verify payment was successful
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING
    let stripePaymentId: string | null = null

    if (paymentIntentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        if (paymentIntent.status === 'succeeded') {
          paymentStatus = PaymentStatus.PAID
          stripePaymentId = paymentIntent.id
        }
      } catch (error) {
        console.error('Error verifying payment intent:', error)
        // Continue with PENDING status if verification fails
      }
    }

    // Validate meal IDs exist before creating order (if meal model exists)
    const mealIds = items
      .filter((item: any) => item.type === 'meal' && item.mealId)
      .map((item: any) => item.mealId)
    
    if (mealIds.length > 0) {
      try {
        const existingMeals = await (prisma as any).meal.findMany({
          where: { id: { in: mealIds } },
          select: { id: true },
        })
        const existingMealIds = new Set(existingMeals.map((m: any) => m.id))
        const invalidMealIds = mealIds.filter((id: string) => !existingMealIds.has(id))
        
        if (invalidMealIds.length > 0) {
          console.error('Invalid meal IDs:', invalidMealIds)
          return NextResponse.json(
            { error: 'Invalid meal IDs provided', details: `Meal IDs not found: ${invalidMealIds.join(', ')}` },
            { status: 400 }
          )
        }
      } catch (error: any) {
        // If meal model doesn't exist, log warning but continue
        console.warn('Meal validation skipped (meal model may not exist):', error.message)
      }
    }

    // Validate menu item IDs exist before creating order
    const menuItemIds = items
      .map((item: any) => item.menuItemId || (item.type !== 'meal' ? item.id : null))
      .filter(Boolean) as string[]
    
    if (menuItemIds.length > 0) {
      const existingMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true },
      })
      const existingMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
      const invalidMenuItemIds = menuItemIds.filter((id: string) => !existingMenuItemIds.has(id))
      
      if (invalidMenuItemIds.length > 0) {
        console.error('Invalid menu item IDs:', invalidMenuItemIds)
        return NextResponse.json(
          { error: 'Invalid menu item IDs provided', details: `Menu item IDs not found: ${invalidMenuItemIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: validUserId,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        deliveryAddress: customerInfo.deliveryAddress,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode || null,
        totalAmount: total,
        status: paymentStatus === PaymentStatus.PAID ? 'CONFIRMED' : 'PENDING',
        paymentStatus: paymentStatus,
        stripePaymentId: stripePaymentId,
        items: {
          create: items.map((item: any) => {
            // For meal items, we need both menuItemId (the burger/wrap) and mealId (the meal deal)
            if (item.type === 'meal') {
              return {
                menuItemId: item.menuItemId || null, // The base menu item (burger/wrap)
                mealId: item.mealId || null, // The meal deal
                quantity: item.quantity,
                price: item.price,
              }
            } else {
              // For regular menu items
              return {
                menuItemId: item.menuItemId || item.id,
                mealId: null,
                quantity: item.quantity,
                price: item.price,
              }
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: order,
    })
  } catch (error: any) {
    console.error('Error creating order from confirmation:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      items: items?.map((item: any) => ({
        id: item.id,
        type: item.type,
        menuItemId: item.menuItemId,
        mealId: item.mealId,
        quantity: item.quantity,
      })),
    })
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}

