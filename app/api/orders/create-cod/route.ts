import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
    
    const { items, customerInfo, total, deliveryFee } = await request.json()
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
      } else {
        console.warn(`User ID ${session.user.id} from session does not exist in database, creating order without userId`)
      }
    }

    // Create order in database with COD payment status
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
        status: 'PENDING',
        paymentStatus: 'PENDING', // Will be marked as PAID when payment is received
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId || item.id,
            quantity: item.quantity,
            price: item.price,
            selectedAddOns: item.selectedAddOns || null,
          })),
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
    console.error('Error creating COD order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}

