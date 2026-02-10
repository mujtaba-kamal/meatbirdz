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
    const { 
      name, 
      description, 
      basePrice, 
      image, 
      available,
      categories, // Array of { id?, name, order } - if id exists, update; if not, create
      options, // Array of { menuItemId, categoryId, additionalPrice }
      menuItemIds, // Array of menu item IDs to link this meal to
    } = await request.json()

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      // Delete existing categories (cascade will delete options)
      await prisma.mealCategory.deleteMany({
        where: { mealId },
      })

      // Create new categories
      await prisma.mealCategory.createMany({
        data: categories.map((cat: { name: string; order: number }) => ({
          mealId,
          name: cat.name,
          order: cat.order,
        })),
      })
    }

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing meal options
      await prisma.mealOption.deleteMany({
        where: { mealId },
      })

      // Create new meal options
      await prisma.mealOption.createMany({
        data: options.map((opt: { menuItemId: string; categoryId: string; additionalPrice: number }) => ({
          mealId,
          menuItemId: opt.menuItemId,
          categoryId: opt.categoryId,
          additionalPrice: parseFloat(opt.additionalPrice?.toString() || '0'),
        })),
      })
    }

    // Update menu item links if provided
    if (menuItemIds && Array.isArray(menuItemIds)) {
      // Delete existing links
      await prisma.menuItemMeal.deleteMany({
        where: { mealId },
      })

      // Create new links
      await prisma.menuItemMeal.createMany({
        data: menuItemIds.map((menuItemId: string) => ({
          mealId,
          menuItemId,
        })),
      })
    }

    // Update meal details
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
    if (image !== undefined) updateData.image = image || null
    if (available !== undefined) updateData.available = available

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: updateData,
      include: {
        categories: {
          orderBy: { order: 'asc' },
        },
        options: {
          include: {
            menuItem: true,
            category: true,
          },
          orderBy: [
            { category: { order: 'asc' } },
            { additionalPrice: 'asc' },
          ],
        },
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
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
