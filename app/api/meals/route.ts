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

    const body = await request.json()
    const { 
      name, 
      description, 
      basePrice, 
      image, 
      available,
      categories, // Array of { name, order }
      options, // Array of { menuItemId, categoryId, additionalPrice }
      menuItemIds, // Array of menu item IDs to link this meal to
    } = body

    console.log('Received meal data:', JSON.stringify({ name, basePrice, categoriesCount: categories?.length, optionsCount: options?.length }, null, 2))

    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      )
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.error('Categories validation failed:', { categories, isArray: Array.isArray(categories), length: categories?.length })
      return NextResponse.json(
        { error: 'At least one category is required', received: { categories, body } },
        { status: 400 }
      )
    }

    // Create meal with categories first, then options (since options need category IDs)
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
        menuItems: menuItemIds && menuItemIds.length > 0 ? {
          create: menuItemIds.map((menuItemId: string) => ({
            menuItemId,
          })),
        } : undefined,
      },
      include: {
        categories: true,
      },
    })

    // Now create options with the actual category IDs
    // Match options to categories by order if categoryId is not provided
    // Use raw SQL to avoid Prisma trying to use the old 'category' column
    if (options && options.length > 0) {
      const categoryMap = new Map(meal.categories.map((cat: any) => [cat.order, cat.id]))
      
      for (const opt of options) {
        // Use categoryId if provided, otherwise match by order
        const categoryId = opt.categoryId || (opt.categoryOrder ? categoryMap.get(opt.categoryOrder) : null)
        if (!categoryId) {
          throw new Error(`Could not find category for option: ${JSON.stringify(opt)}`)
        }
        
        // Use raw SQL to insert, explicitly specifying only the columns we want
        await prisma.$executeRawUnsafe(`
          INSERT INTO "MealOption" (id, "mealId", "menuItemId", "categoryId", "additionalPrice", "createdAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT ("mealId", "categoryId", "menuItemId") DO NOTHING;
        `, meal.id, opt.menuItemId, categoryId, parseFloat(opt.additionalPrice?.toString() || '0'))
      }
    }

    // Fetch the complete meal with all relations
    const completeMeal = await prisma.meal.findUnique({
      where: { id: meal.id },
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

    return NextResponse.json(completeMeal)
  } catch (error: any) {
    console.error('Error creating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create meal', details: error.message },
      { status: 500 }
    )
  }
}
