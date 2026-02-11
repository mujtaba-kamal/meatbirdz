import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST - Update menu item order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { itemOrders } = await request.json() // Array of { id: string, order: number }

    if (!Array.isArray(itemOrders)) {
      return NextResponse.json(
        { error: 'itemOrders must be an array' },
        { status: 400 }
      )
    }

    // Update each menu item's order
    await Promise.all(
      itemOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.menuItem.update({
          where: { id },
          data: { order },
        })
      )
    )

    return NextResponse.json({ success: true, message: 'Menu items reordered successfully' })
  } catch (error: any) {
    console.error('Error reordering menu items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder menu items', details: error.message },
      { status: 500 }
    )
  }
}

