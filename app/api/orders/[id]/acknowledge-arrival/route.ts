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

    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Update order to acknowledge arrival
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        arrivalAcknowledged: true,
      },
      select: {
        id: true,
        customerName: true,
        arrivalAcknowledged: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Arrival acknowledged',
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('Error acknowledging arrival:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge arrival', details: error.message },
      { status: 500 }
    )
  }
}

