import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { PaymentStatus, Prisma } from '@prisma/client'
import { rateLimiters } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiters.strict(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  let items: any[] = []
  try {
    // Auto-migrate: Ensure selectedMealOptions column exists
    try {
      const columnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'OrderItem' 
        AND column_name = 'selectedMealOptions'
      `)
      
      if ((columnCheck as any[]).length === 0) {
        console.log('🔧 Auto-migrating: Adding selectedMealOptions column...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "OrderItem" 
          ADD COLUMN IF NOT EXISTS "selectedMealOptions" JSONB
        `)
        console.log('✅ Successfully added selectedMealOptions column')
      }
    } catch (migrationError: any) {
      // If column already exists or migration fails, log but continue
      if (!migrationError.message?.includes('already exists')) {
        console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
      }
    }
    
    // Auto-migrate: Ensure selectedAddOns column exists
    try {
      const columnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'OrderItem' 
        AND column_name = 'selectedAddOns'
      `)
      
      if ((columnCheck as any[]).length === 0) {
        console.log('🔧 Auto-migrating: Adding selectedAddOns column...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "OrderItem" 
          ADD COLUMN IF NOT EXISTS "selectedAddOns" JSONB
        `)
        console.log('✅ Successfully added selectedAddOns column')
      }
    } catch (migrationError: any) {
      // If column already exists or migration fails, log but continue
      if (!migrationError.message?.includes('already exists')) {
        console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
      }
    }
    
    // Auto-migrate: Ensure carDetails column exists
    try {
      const columnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Order' 
        AND column_name = 'carDetails'
      `)
      
      if ((columnCheck as any[]).length === 0) {
        console.log('🔧 Auto-migrating: Adding carDetails column...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Order" 
          ADD COLUMN IF NOT EXISTS "carDetails" TEXT
        `)
        console.log('✅ Successfully added carDetails column')
      }
    } catch (migrationError: any) {
      // If column already exists or migration fails, log but continue
      if (!migrationError.message?.includes('already exists')) {
        console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
      }
    }
    
    const requestData = await request.json()
    items = requestData.items || []
    const { customerInfo, total, deliveryFee, paymentIntentId, orderType } = requestData
    
    // Validate required fields
    if (!items || items.length === 0) {
      console.error('❌ No items provided in request')
      return NextResponse.json(
        { error: 'No items provided', details: 'Items array is empty' },
        { status: 400 }
      )
    }
    
    if (!customerInfo || !customerInfo.customerName || !customerInfo.customerEmail) {
      console.error('❌ Missing customer info')
      return NextResponse.json(
        { error: 'Missing customer information', details: 'customerName and customerEmail are required' },
        { status: 400 }
      )
    }
    
    // CRITICAL: Log what we're receiving BEFORE any validation
    console.log('\n🔴 ===== RAW ITEMS RECEIVED =====')
    console.log(`Items count: ${items.length}`)
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
      .map((item: any) => {
        const id = item.menuItemId || item.id
        console.log(`   Item: id=${item.id}, name=${item.name}, menuItemId=${item.menuItemId}, using=${id}`)
        return id
      })
      .filter(Boolean) as string[]
    
    if (allMenuItemIds.length === 0) {
      console.error('❌ No valid menu item IDs found in items')
      return NextResponse.json(
        { error: 'Invalid items', details: 'No valid menu item IDs found in cart items' },
        { status: 400 }
      )
    }
    
    // Check total menu items in database (for debugging)
    const totalMenuItemsInDb = await prisma.menuItem.count()
    console.log(`📊 Total menu items in database: ${totalMenuItemsInDb}`)
    
    // Check which IDs exist in database
    let existingMenuItems
    try {
      existingMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: allMenuItemIds } },
        select: { id: true, name: true },
      })
    } catch (dbError: any) {
      console.error('❌ Database error fetching menu items:', dbError)
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: `Failed to validate menu items: ${dbError.message}`,
          code: dbError.code,
        },
        { status: 500 }
      )
    }
    
    const validMenuItemIds = new Set(existingMenuItems.map((m: any) => m.id))
    
    console.log(`\n📋 Validation Results:`)
    console.log(`   Total items in cart: ${items.length}`)
    console.log(`   Unique menu item IDs requested: ${allMenuItemIds.length}`)
    console.log(`   Valid menu items found: ${validMenuItemIds.size}/${allMenuItemIds.length}`)
    console.log(`   Valid IDs:`, Array.from(validMenuItemIds))
    
    // Log invalid IDs
    const invalidMenuItemIds = allMenuItemIds.filter(id => !validMenuItemIds.has(id))
    
    if (invalidMenuItemIds.length > 0) {
      console.error(`❌ Invalid menuItemIds (not found in database):`, invalidMenuItemIds)
      console.error(`   These IDs were requested but don't exist in the MenuItem table`)
      // Don't fail completely - just log and continue with null menuItemId
    }
    
    if (validMenuItemIds.size === 0) {
      console.error('❌ No valid menu items found in database')
      return NextResponse.json(
        { 
          error: 'Invalid items', 
          details: `None of the provided menu item IDs exist in the database. Requested IDs: ${invalidMenuItemIds.join(', ')}. Total menu items in database: ${totalMenuItemsInDb}`,
        },
        { status: 400 }
      )
    }

    // Prepare order items with validation
    const orderItems = items.map((item: any) => {
      // For menu items, use menuItemId (required). Do NOT fall back to item.id as that's the unique cart item ID
      const menuItemId = item.menuItemId
      
      // Validate required fields
      const quantity = parseInt(item.quantity) || 1
      const price = parseFloat(item.price) || 0
      
      if (!quantity || quantity <= 0) {
        console.error(`❌ Invalid quantity for item:`, item)
        throw new Error(`Invalid quantity for item ${item.name || item.id}`)
      }
      
      if (!price || price <= 0) {
        console.error(`❌ Invalid price for item:`, item)
        throw new Error(`Invalid price for item ${item.name || item.id}`)
      }
      
      // Get selected add-ons if present
      const selectedAddOns = item.selectedAddOns || null
      
      // Validate menuItemId exists and is provided
      if (!menuItemId) {
        console.error(`❌ Missing menuItemId for item:`, { id: item.id, name: item.name, menuItemId: item.menuItemId })
        throw new Error(`Missing menuItemId for item ${item.name || item.id}. This is a required field.`)
      }
      
      if (!validMenuItemIds.has(menuItemId)) {
        console.error(`❌ Invalid menuItemId: ${menuItemId} (not found in database)`)
        console.error(`   Item:`, { id: item.id, name: item.name, menuItemId: item.menuItemId })
        console.error(`   Available menu item IDs:`, Array.from(validMenuItemIds).slice(0, 5))
        // Set to null to avoid foreign key error - but log the issue
        return {
          menuItemId: null,
          quantity: quantity,
          price: price,
          selectedAddOns: selectedAddOns,
        }
      }
      
      console.log(`📦 Creating menu item order: menuItemId=${menuItemId}, quantity=${quantity}, price=${price}, addOns=${selectedAddOns ? selectedAddOns.length : 0}`)
      
      return {
        menuItemId: menuItemId,
        quantity: quantity,
        price: price,
        selectedAddOns: selectedAddOns,
      }
    })
    
    // Ensure at least one item has a valid menuItemId
    const validItemsCount = orderItems.filter(item => item.menuItemId !== null).length
    if (validItemsCount === 0) {
      console.error('❌ No valid menu items found in order')
      return NextResponse.json(
        { error: 'Invalid items', details: 'None of the provided menu item IDs exist in the database' },
        { status: 400 }
      )
    }
    
    console.log(`✅ Creating order with ${orderItems.length} items (${validItemsCount} valid)`)
    console.log('📝 Order data:', {
      customerName: customerInfo.customerName,
      customerEmail: customerInfo.customerEmail,
      totalAmount: total,
      itemsCount: orderItems.length,
      paymentStatus,
    })

    // Create order in database
    let order
    try {
      order = await prisma.order.create({
      data: {
        userId: validUserId,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        deliveryAddress: customerInfo.deliveryAddress,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode || null,
        carDetails: customerInfo.carDetails || null,
        totalAmount: total,
        status: paymentStatus === PaymentStatus.PAID ? 'CONFIRMED' : 'PENDING',
        paymentStatus: paymentStatus,
        stripePaymentId: stripePaymentId,
        items: {
          create: orderItems,
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
          },
        },
      },
    })
    } catch (prismaError: any) {
      console.error('❌ Prisma error creating order:', prismaError)
      console.error('Prisma error details:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message,
        clientVersion: prismaError.clientVersion,
      })
      throw prismaError
    }

    console.log(`✅ Order created successfully: ${order.id}`)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: order,
    })
  } catch (error: any) {
    console.error('❌ Error creating order from confirmation:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      itemsCount: items?.length || 0,
      items: items?.slice(0, 3).map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
    })
    
    // Return more detailed error for debugging
    const errorResponse = {
      error: 'Failed to create order',
      details: error.message || 'Unknown error occurred',
      code: error.code,
      meta: error.meta,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
    
    console.error('❌ Returning error response:', errorResponse)
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

