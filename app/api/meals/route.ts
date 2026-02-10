import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch all meals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId') // Optional: filter meals linked to a menu item

    if (menuItemId) {
      // Fetch meals linked to a specific menu item
      const menuItemMeals = await prisma.menuItemMeal.findMany({
        where: { menuItemId },
        include: {
          meal: {
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
            },
          },
        },
      })

      return NextResponse.json(menuItemMeals.map((mim) => mim.meal))
    }

    // Fetch all meals
    const meals = await prisma.meal.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(meals)
  } catch (error) {
    console.error('Error fetching meals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    )
  }
}

// POST - Create a new meal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { 
      name, 
      description, 
      basePrice, 
      image, 
      available,
      categories, // Array of { name, order }
      options, // Array of { menuItemId, categoryId, additionalPrice }
      menuItemIds, // Array of menu item IDs to link this meal to
    } = await request.json()

    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      )
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one category is required' },
        { status: 400 }
      )
    }

    // Create meal with categories and options
    const meal = await prisma.meal.create({
      data: {
        name,
        description: description || null,
        basePrice: parseFloat(basePrice),
        image: image || null,
        available: available !== undefined ? available : true,
        categories: {
          create: categories.map((cat: { name: string; order: number }) => ({
            name: cat.name,
            order: cat.order,
          })),
        },
        options: {
          create: (options || []).map((opt: { menuItemId: string; categoryId: string; additionalPrice: number }) => ({
            menuItemId: opt.menuItemId,
            categoryId: opt.categoryId,
            additionalPrice: parseFloat(opt.additionalPrice?.toString() || '0'),
          })),
        },
        menuItems: menuItemIds && menuItemIds.length > 0 ? {
          create: menuItemIds.map((menuItemId: string) => ({
            menuItemId,
          })),
        } : undefined,
      },
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
    console.error('Error creating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create meal', details: error.message },
      { status: 500 }
    )
  }
}
