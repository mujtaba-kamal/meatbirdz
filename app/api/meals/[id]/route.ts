import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUT - Update a meal
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

    const mealId = params.id
    const { name, description, price, image, available, mainLabel, sideLabel, drinkLabel, itemIds } = await request.json()

    // If itemIds are provided, update them
    if (itemIds && Array.isArray(itemIds)) {
      // Delete existing meal items
      await prisma.mealItem.deleteMany({
        where: { mealId },
      })

      // Create new meal items
      await prisma.mealItem.createMany({
        data: itemIds.map((menuItemId: string) => ({
          mealId,
          menuItemId,
        })),
      })
    }

    // Update meal details
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (price !== undefined) updateData.price = parseFloat(price)
    if (image !== undefined) updateData.image = image || null
    if (available !== undefined) updateData.available = available
    if (mainLabel !== undefined) updateData.mainLabel = mainLabel
    if (sideLabel !== undefined) updateData.sideLabel = sideLabel
    if (drinkLabel !== undefined) updateData.drinkLabel = drinkLabel

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json(meal)
  } catch (error: any) {
    console.error('Error updating meal:', error)
    return NextResponse.json(
      { error: 'Failed to update meal', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a meal
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

    const mealId = params.id

    // Check if meal is used in any orders
    const orderItems = await prisma.orderItem.findMany({
      where: { mealId },
      take: 1,
    })

    if (orderItems.length > 0) {
      // Instead of deleting, mark as unavailable
      const meal = await prisma.meal.update({
        where: { id: mealId },
        data: { available: false },
      })
      return NextResponse.json({
        message: 'Meal marked as unavailable (used in orders)',
        meal,
      })
    }

    await prisma.meal.delete({
      where: { id: mealId },
    })

    return NextResponse.json({ message: 'Meal deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting meal:', error)
    return NextResponse.json(
      { error: 'Failed to delete meal', details: error.message },
      { status: 500 }
    )
  }
}

