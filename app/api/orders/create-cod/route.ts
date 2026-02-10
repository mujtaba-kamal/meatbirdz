import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { items, customerInfo, total } = await request.json()
    const session = await getServerSession(authOptions)

    console.log('COD Order Creation - Session:', session?.user?.id ? 'User logged in' : 'Guest order')
    console.log('COD Order Creation - Customer Email:', customerInfo.customerEmail)

    // Validate userId exists if provided
    let validUserId: string | null = null
    if (session?.user?.id) {
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })
      if (userExists) {
        validUserId = session.user.id
        console.log('COD Order Creation - Linking to userId:', validUserId)
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
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
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

