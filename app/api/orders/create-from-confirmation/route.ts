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

    // Validate IDs exist in database to prevent foreign key errors
    // But we'll still use them if provided - validation is just for error handling
    const allMenuItemIds = items
      .map((item: any) => {
        if (item.type === 'meal') {
          // For meals, extract menuItemId if not explicitly provided
          let menuItemId = item.menuItemId
          if (!menuItemId && item.id && item.id.includes('-meal-')) {
            const parts = item.id.split('-meal-')
            if (parts.length > 0 && parts[0]) {
              menuItemId = parts[0]
            }
          }
          return menuItemId
        } else {
          return item.menuItemId || item.id
        }
      })
      .filter(Boolean) as string[]
    
    const allMealIds = items
      .filter((item: any) => item.type === 'meal' && item.mealId)
      .map((item: any) => item.mealId) as string[]
    
    // Check which IDs exist in database
    const existingMenuItems = allMenuItemIds.length > 0 ? await prisma.menuItem.findMany({
      where: { id: { in: allMenuItemIds } },
      select: { id: true },
    }) : []
    
    const existingMeals = allMealIds.length > 0 ? await (prisma as any).meal.findMany({
      where: { id: { in: allMealIds } },
      select: { id: true },
    }).catch(() => []) : []
    
    const validMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
    const validMealIds = new Set(existingMeals.map((m: any) => m.id))
    
    console.log(`\n📋 Validation Results:`)
    console.log(`   Menu Items: ${validMenuItemIds.size}/${allMenuItemIds.length} valid`)
    console.log(`   Meals: ${validMealIds.size}/${allMealIds.length} valid`)
    
    // Log invalid IDs
    const invalidMenuItemIds = allMenuItemIds.filter(id => !validMenuItemIds.has(id))
    const invalidMealIds = allMealIds.filter(id => !validMealIds.has(id))
    
    if (invalidMenuItemIds.length > 0) {
      console.error(`❌ Invalid menuItemIds:`, invalidMenuItemIds)
    }
    if (invalidMealIds.length > 0) {
      console.error(`❌ Invalid mealIds:`, invalidMealIds)
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
              // Use menuItemId directly from item, or extract from composite ID if needed
              let menuItemId = item.menuItemId
              if (!menuItemId && item.id && item.id.includes('-meal-')) {
                const parts = item.id.split('-meal-')
                if (parts.length > 0 && parts[0]) {
                  menuItemId = parts[0]
                }
              }
              
              // Use validated IDs - only set if they exist in database
              // For meals, menuItemId is optional, mealId should be set if valid
              const finalMenuItemId = menuItemId && validMenuItemIds.has(menuItemId) ? menuItemId : null
              const finalMealId = item.mealId && validMealIds.has(item.mealId) ? item.mealId : null
              
              if (!finalMenuItemId && menuItemId) {
                console.warn(`⚠️ menuItemId ${menuItemId} not found, setting to null (optional for meals)`)
              }
              if (!finalMealId && item.mealId) {
                console.error(`❌ mealId ${item.mealId} not found - meal order will have no meal reference!`)
              }
              
              // Store selected meal options as JSON
              // Prisma JSON fields need Prisma.JsonNull for null, or the actual JSON value
              let selectedMealOptionsJson: Prisma.InputJsonValue | undefined = undefined
              if (item.selectedMealOptions && Array.isArray(item.selectedMealOptions) && item.selectedMealOptions.length > 0) {
                selectedMealOptionsJson = item.selectedMealOptions as Prisma.InputJsonValue
              }
              
              console.log(`📦 Creating meal order item:`)
              console.log(`   menuItemId: ${finalMenuItemId}`)
              console.log(`   mealId: ${finalMealId}`)
              console.log(`   selectedMealOptions: ${selectedMealOptionsJson ? `${item.selectedMealOptions.length} options` : 'none'}`)
              
              return {
                menuItemId: finalMenuItemId, // Only set if valid
                mealId: finalMealId, // Only set if valid
                ...(selectedMealOptionsJson !== undefined && { selectedMealOptions: selectedMealOptionsJson }),
                quantity: item.quantity,
                price: item.price,
              }
            } else {
              // For regular menu items, use menuItemId or id
              const menuItemId = item.menuItemId || item.id
              
              // Validate menuItemId exists - for regular items, it's required
              if (!validMenuItemIds.has(menuItemId)) {
                console.error(`❌ Regular item has invalid menuItemId: ${menuItemId}`)
                console.error(`   Item:`, { id: item.id, name: item.name, menuItemId: item.menuItemId })
                // Set to null to avoid foreign key error - but log the issue
                return {
                  menuItemId: null, // Set to null to avoid foreign key constraint
                  mealId: null,
                  quantity: item.quantity,
                  price: item.price,
                }
              }
              
              console.log(`📦 Creating regular menu item order: menuItemId=${menuItemId}`)
              
              return {
                menuItemId: menuItemId,
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

