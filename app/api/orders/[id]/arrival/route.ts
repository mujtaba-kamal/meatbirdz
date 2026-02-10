import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Verify the order belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order belongs to user (or allow if userId is null for guest orders)
    if (order.userId && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - This order does not belong to you' },
        { status: 403 }
      )
    }

    // Allow arrival notification for orders that are CONFIRMED, PREPARING, or READY
    if (order.status !== 'CONFIRMED' && order.status !== 'PREPARING' && order.status !== 'READY') {
      return NextResponse.json(
        { error: 'You can only mark arrival for orders that are CONFIRMED, PREPARING, or READY' },
        { status: 400 }
      )
    }

    // Update order with arrival notification
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        arrivalNotification: new Date(),
        arrivalAcknowledged: false, // Reset acknowledgment when new arrival is set
      },
      select: {
        id: true,
        customerName: true,
        arrivalNotification: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Arrival notification sent to admin',
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('Error marking arrival:', error)
    return NextResponse.json(
      { error: 'Failed to mark arrival', details: error.message },
      { status: 500 }
    )
  }
}

