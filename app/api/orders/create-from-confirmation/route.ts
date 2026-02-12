import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { PaymentStatus, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let items: any[] = []
  try {
    const requestData = await request.json()
    items = requestData.items || []
    const { customerInfo, total, paymentIntentId, orderType } = requestData
    
    // CRITICAL: Log what we're receiving BEFORE any validation
    console.log('\n🔴 ===== RAW ITEMS RECEIVED =====')
    console.log(JSON.stringify(items, null, 2))
    console.log('================================\n')
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

    // Validate menu item IDs exist in database
    const allMenuItemIds = items
      .map((item: any) => item.menuItemId || item.id)
      .filter(Boolean) as string[]
    
    // Check which IDs exist in database
    const existingMenuItems = allMenuItemIds.length > 0 ? await prisma.menuItem.findMany({
      where: { id: { in: allMenuItemIds } },
      select: { id: true },
    }) : []
    
    const validMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
    
    console.log(`\n📋 Validation Results:`)
    console.log(`   Menu Items: ${validMenuItemIds.size}/${allMenuItemIds.length} valid`)
    
    // Log invalid IDs
    const invalidMenuItemIds = allMenuItemIds.filter(id => !validMenuItemIds.has(id))
    
    if (invalidMenuItemIds.length > 0) {
      console.error(`❌ Invalid menuItemIds:`, invalidMenuItemIds)
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
            // For menu items, use menuItemId or id
            const menuItemId = item.menuItemId || item.id
            
            // Validate menuItemId exists
            if (!validMenuItemIds.has(menuItemId)) {
              console.error(`❌ Invalid menuItemId: ${menuItemId}`)
              console.error(`   Item:`, { id: item.id, name: item.name, menuItemId: item.menuItemId })
              // Set to null to avoid foreign key error - but log the issue
              return {
                menuItemId: null,
                mealId: null,
                quantity: item.quantity,
                price: item.price,
              }
            }
            
            console.log(`📦 Creating menu item order: menuItemId=${menuItemId}`)
            
            return {
              menuItemId: menuItemId,
              mealId: null,
              quantity: item.quantity,
              price: item.price,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            meal: {
              select: {
                id: true,
                name: true,
              },
            },
          } as any, // Use 'as any' to bypass TypeScript if Prisma Client types aren't updated
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

