import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUT - Update a menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const menuItemId = params.id
    const { name, description, price, category, image, available } = await request.json()

    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(image !== undefined && { image: image || null }),
        ...(available !== undefined && { available }),
      },
    })

    return NextResponse.json(menuItem)
  } catch (error: any) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const menuItemId = params.id

    // Check if menu item is used in any orders
    const orderItems = await prisma.orderItem.findMany({
      where: { menuItemId },
      take: 1,
    })

    if (orderItems.length > 0) {
      // Instead of deleting, mark as unavailable
      const menuItem = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: { available: false },
      })
      return NextResponse.json({
        message: 'Menu item marked as unavailable (used in orders)',
        menuItem,
      })
    }

    // Check if menu item is used in any meals
    const mealItems = await prisma.mealItem.findMany({
      where: { menuItemId },
      take: 1,
    })

    if (mealItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete menu item that is part of a meal. Remove it from meals first.' },
        { status: 400 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    })

    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item', details: error.message },
      { status: 500 }
    )
  }
}

