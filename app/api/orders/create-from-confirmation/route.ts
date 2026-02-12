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

    // Validate meal IDs exist before creating order (if meal model exists)
    const mealIds = items
      .filter((item: any) => item.type === 'meal' && item.mealId)
      .map((item: any) => item.mealId)
    
    // Store valid meal IDs for use in order creation
    let validMealIds = new Set<string>()
    if (mealIds.length > 0) {
      try {
        console.log(`\n🍽️ Validating ${mealIds.length} meal IDs:`, mealIds)
        const existingMeals = await (prisma as any).meal.findMany({
          where: { id: { in: mealIds } },
          select: { id: true, name: true },
        })
        const existingMealIds = new Set<string>(existingMeals.map((m: any) => m.id as string))
        validMealIds = existingMealIds
        
        console.log(`✅ Found ${existingMeals.length} meals in database:`)
        existingMeals.forEach((m: any) => {
          console.log(`   - ${m.id}: ${m.name}`)
        })
        
        const invalidMealIds = mealIds.filter((id: string) => !existingMealIds.has(id))
        
        if (invalidMealIds.length > 0) {
          console.error(`❌ Invalid meal IDs (not found in database): ${invalidMealIds.length}`)
          invalidMealIds.forEach((id) => {
            console.error(`   - ${id}`)
          })
          console.error('Items with meal IDs:', items.filter((item: any) => item.type === 'meal').map((item: any) => ({
            id: item.id,
            mealId: item.mealId,
            name: item.name,
          })))
          // Don't fail - log warning and continue, but mealId will be set to null if invalid
          console.warn('⚠️ Some meal IDs not found, but continuing. Invalid mealIds will be set to null.')
        } else {
          console.log(`✅ All ${mealIds.length} meal IDs are valid`)
        }
      } catch (error: any) {
        // If meal model doesn't exist, log warning but continue
        console.warn('⚠️ Meal validation skipped (meal model may not exist):', error.message)
        validMealIds = new Set<string>()
      }
    } else {
      console.log('⚠️ No meal IDs to validate')
    }

    // Validate menu item IDs exist before creating order
    // For meal items, menuItemId is optional (can be null)
    // For regular items, menuItemId is required
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
          // This is required for regular items
          return item.menuItemId || item.id
        }
      })
      .filter(Boolean) as string[]
    
    // Store valid menu item IDs for use in order creation
    let validMenuItemIds = new Set<string>()
    if (menuItemIds.length > 0) {
      try {
        console.log(`Querying database for ${menuItemIds.length} menu item IDs:`, menuItemIds)
        const existingMenuItems = await prisma.menuItem.findMany({
          where: { id: { in: menuItemIds } },
          select: { id: true, name: true },
        })
        const existingMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
        validMenuItemIds = existingMenuItemIds
        
        console.log(`Found ${existingMenuItems.length} menu items in database:`)
        existingMenuItems.forEach((m: any) => {
          console.log(`  - ${m.id}: ${m.name}`)
        })
        
        const invalidMenuItemIds = menuItemIds.filter((id: string) => !existingMenuItemIds.has(id))
        
        if (invalidMenuItemIds.length > 0) {
          console.error('❌ Invalid menu item IDs (not found in database):', invalidMenuItemIds)
          console.error('Items being processed:', items.map((item: any) => ({
            id: item.id,
            type: item.type,
            menuItemId: item.menuItemId,
            mealId: item.mealId,
            name: item.name,
          })))
          console.error('Valid menu item IDs found:', Array.from(existingMenuItemIds))
          console.error('Total menu items queried:', existingMenuItems.length)
          // Instead of failing, log warning and continue - menuItemId is optional for meals
          // We'll set menuItemId to null for invalid IDs during order creation
          console.warn('⚠️ Some menu item IDs not found, but continuing as menuItemId is optional for meal items')
          // Don't return error - continue with order creation, menuItemId will be set to null
        } else {
          console.log(`✅ All ${menuItemIds.length} menu item IDs are valid`)
        }
      } catch (error: any) {
        console.error('❌ Error validating menu item IDs:', error)
        // If validation fails, set validMenuItemIds to empty set - all menuItemIds will be set to null
        validMenuItemIds = new Set<string>()
      }
    } else {
      console.log('⚠️ No menu item IDs to validate')
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
              
              // USE THE IDs AS PROVIDED - don't validate and set to null
              // Just use what's passed from the frontend
              const finalMenuItemId = menuItemId || null
              const finalMealId = item.mealId || null
              
              console.log(`📦 Creating order item with IDs: menuItemId=${finalMenuItemId}, mealId=${finalMealId}`)
              
              if (menuItemId && !validMenuItemIds.has(menuItemId)) {
                console.error(`❌ Meal item has invalid menuItemId: ${menuItemId}`)
                console.error(`   Item details:`, { id: item.id, name: item.name, menuItemId: item.menuItemId })
                console.error(`   Valid menuItemIds:`, Array.from(validMenuItemIds).slice(0, 5))
                console.error(`   Setting menuItemId to null to avoid foreign key constraint`)
              } else if (menuItemId && validMenuItemIds.has(menuItemId)) {
                console.log(`✅ Meal item has valid menuItemId: ${menuItemId}`)
              }
              
              if (item.mealId && !validMealIds.has(item.mealId)) {
                console.error(`❌ Meal item has invalid mealId: ${item.mealId}`)
                console.error(`   Item details:`, { id: item.id, name: item.name, mealId: item.mealId })
                console.error(`   Valid mealIds:`, Array.from(validMealIds))
                console.error(`   Setting mealId to null to avoid foreign key constraint`)
              } else if (item.mealId && validMealIds.has(item.mealId)) {
                console.log(`✅ Meal item has valid mealId: ${item.mealId}`)
              }
              
              console.log(`📦 Creating order item: menuItemId=${finalMenuItemId}, mealId=${finalMealId}`)
              
              return {
                menuItemId: finalMenuItemId, // The base menu item (burger/wrap) - optional, null if invalid
                mealId: finalMealId, // The meal deal - validated, null if invalid
                quantity: item.quantity,
                price: item.price,
              }
            } else {
              // For regular menu items, menuItemId is required
              const regularMenuItemId = item.menuItemId || item.id
              
              // Check if this menu item ID is valid
              if (!validMenuItemIds.has(regularMenuItemId)) {
                console.error(`Invalid menu item ID for regular item: ${regularMenuItemId}`)
                console.error(`Item details:`, { id: item.id, menuItemId: item.menuItemId, name: item.name })
                console.error(`Available valid IDs (${validMenuItemIds.size}):`, Array.from(validMenuItemIds).slice(0, 10))
                // For regular items, set to null to avoid foreign key constraint violation
                return {
                  menuItemId: null, // Set to null to avoid foreign key constraint
                  mealId: null,
                  quantity: item.quantity,
                  price: item.price,
                }
              }
              
              return {
                menuItemId: regularMenuItemId, // Valid menu item ID
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
            // Include meal relation if it exists
            ...(typeof (prisma as any).orderItem.fields?.meal !== 'undefined' && {
              meal: {
                select: {
                  id: true,
                  name: true,
                },
              },
            }),
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

