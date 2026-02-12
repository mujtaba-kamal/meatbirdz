import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch add-ons for a menu item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    if (menuItemId) {
      // Fetch add-ons for a specific menu item
      const addOns = await prisma.addOn.findMany({
        where: { menuItemId },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json(addOns)
    }

    // Fetch all add-ons (for admin)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const addOns = await prisma.addOn.findMany({
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { menuItem: { name: 'asc' } },
        { order: 'asc' },
      ],
    })

    return NextResponse.json(addOns)
  } catch (error: any) {
    console.error('Error fetching add-ons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch add-ons', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new add-on
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { menuItemId, name, price, available, order } = body

    if (!menuItemId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'menuItemId, name, and price are required' },
        { status: 400 }
      )
    }

    // Verify menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    const addOn = await prisma.addOn.create({
      data: {
        menuItemId,
        name,
        price: parseFloat(price),
        available: available !== undefined ? available : true,
        order: order !== undefined ? parseInt(order) : 0,
      },
    })

    return NextResponse.json(addOn)
  } catch (error: any) {
    console.error('Error creating add-on:', error)
    return NextResponse.json(
      { error: 'Failed to create add-on', details: error.message },
      { status: 500 }
    )
  }
}

