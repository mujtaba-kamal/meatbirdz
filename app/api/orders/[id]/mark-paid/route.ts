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

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const orderId = params.id

    // Update order payment status to PAID
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentStatus: 'PAID',
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
      order: order,
    })
  } catch (error) {
    console.error('Error marking order as paid:', error)
    return NextResponse.json(
      { error: 'Failed to mark order as paid' },
      { status: 500 }
    )
  }
}

