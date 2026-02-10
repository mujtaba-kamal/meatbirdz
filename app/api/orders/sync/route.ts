import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find guest orders with this email that don't have a userId
    const guestOrders = await prisma.order.findMany({
      where: {
        customerEmail: email,
        userId: null,
      },
    })

    // Update these orders to link them to the logged-in user
    const updatedOrders = await Promise.all(
      guestOrders.map((order) =>
        prisma.order.update({
          where: { id: order.id },
          data: { userId: session.user.id },
        })
      )
    )

    return NextResponse.json({
      success: true,
      syncedCount: updatedOrders.length,
      message: `Synced ${updatedOrders.length} guest order(s) to your account`,
    })
  } catch (error) {
    console.error('Error syncing orders:', error)
    return NextResponse.json(
      { error: 'Failed to sync orders' },
      { status: 500 }
    )
  }
}

