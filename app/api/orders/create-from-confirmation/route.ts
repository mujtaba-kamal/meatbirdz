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
    // For meal items, menuItemId is optional (can be null)
    // For regular items, use menuItemId if provided, otherwise use id
    const menuItemIds = items
      .map((item: any) => {
        if (item.type === 'meal') {
          // For meal items, menuItemId is optional - only validate if provided
          // If menuItemId is not provided but id contains '-meal-', try to extract it
          if (!item.menuItemId && item.id && item.id.includes('-meal-')) {
            const parts = item.id.split('-meal-')
            if (parts.length > 0 && parts[0]) {
              return parts[0] // Extract menu item ID from composite ID
            }
          }
          return item.menuItemId || null
        } else {
          // For regular menu items, use menuItemId if provided, otherwise use id
          return item.menuItemId || item.id
        }
      })
      .filter(Boolean) as string[]
    
    // Store valid menu item IDs for use in order creation
    let validMenuItemIds = new Set<string>()
    if (menuItemIds.length > 0) {
      const existingMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true },
      })
      const existingMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
      validMenuItemIds = existingMenuItemIds
      const invalidMenuItemIds = menuItemIds.filter((id: string) => !existingMenuItemIds.has(id))
      
      if (invalidMenuItemIds.length > 0) {
        console.error('Invalid menu item IDs:', invalidMenuItemIds)
        console.error('Items being processed:', items.map((item: any) => ({
          id: item.id,
          type: item.type,
          menuItemId: item.menuItemId,
          mealId: item.mealId,
        })))
        console.error('Existing menu item IDs:', Array.from(existingMenuItemIds))
        // Instead of failing, log warning and continue - menuItemId is optional for meals
        // We'll set menuItemId to null for invalid IDs during order creation
        console.warn('Some menu item IDs not found, but continuing as menuItemId is optional for meal items')
        // Don't return error - continue with order creation, menuItemId will be set to null
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
              // Extract menuItemId - try explicit value first, then extract from composite ID
              let menuItemId = item.menuItemId
              if (!menuItemId && item.id && item.id.includes('-meal-')) {
                const parts = item.id.split('-meal-')
                if (parts.length > 0 && parts[0]) {
                  menuItemId = parts[0] // Extract menu item ID from composite ID
                }
              }
              
              // Only set menuItemId if it's valid (exists in database)
              const finalMenuItemId = menuItemId && validMenuItemIds.has(menuItemId) ? menuItemId : null
              
              return {
                menuItemId: finalMenuItemId, // The base menu item (burger/wrap) - optional
                mealId: item.mealId || null, // The meal deal - required
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

