import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const orderIds = searchParams.get('orderIds') // Comma-separated order IDs for guest orders
    const email = searchParams.get('email') // Email for guest orders

    // If user is logged in, fetch their orders
    if (session?.user?.id) {
      const orders = await prisma.order.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(orders)
    }

    // For guest orders, fetch by order IDs or email
    if (orderIds) {
      const ids = orderIds.split(',').filter(Boolean)
      const orders = await prisma.order.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(orders)
    }

    // Fetch by email for guest orders
    if (email) {
      const orders = await prisma.order.findMany({
        where: {
          customerEmail: email,
          userId: null, // Only guest orders
        },
        include: {
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json(orders)
    }

    // No session and no parameters, return empty array
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

