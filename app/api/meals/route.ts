import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch the single meal (there should only be one)
export async function GET() {
  try {
    // Get the first (and only) meal, or return null if none exists
    const meal = await prisma.meal.findFirst({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    // If no meal exists, return null (frontend will handle creating it)
    return NextResponse.json(meal)
  } catch (error) {
    console.error('Error fetching meal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal' },
      { status: 500 }
    )
  }
}

// POST - Create or update the single meal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { name, description, price, image, available, mainLabel, sideLabel, drinkLabel, itemIds } = await request.json()

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Check if meal already exists
    const existingMeal = await prisma.meal.findFirst()

    let meal
    if (existingMeal) {
      // Update existing meal
      // Delete existing meal items
      await prisma.mealItem.deleteMany({
        where: { mealId: existingMeal.id },
      })

      // Update meal and create new items
      const updateData: any = {
        name,
        description: description || null,
        price: parseFloat(price),
        image: image || null,
        available: available !== undefined ? available : true,
        items: {
          create: (itemIds || []).map((menuItemId: string) => ({
            menuItemId,
          })),
        },
      }

      // Only include label fields if they are provided
      if (mainLabel !== undefined) updateData.mainLabel = mainLabel || 'Main'
      if (sideLabel !== undefined) updateData.sideLabel = sideLabel || 'Side'
      if (drinkLabel !== undefined) updateData.drinkLabel = drinkLabel || 'Drink'

      meal = await prisma.meal.update({
        where: { id: existingMeal.id },
        data: updateData,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      })
    } else {
      // Create new meal
      meal = await prisma.meal.create({
        data: {
          name,
          description: description || null,
          price: parseFloat(price),
          image: image || null,
          available: available !== undefined ? available : true,
          mainLabel: mainLabel || 'Main',
          sideLabel: sideLabel || 'Side',
          drinkLabel: drinkLabel || 'Drink',
          items: {
            create: (itemIds || []).map((menuItemId: string) => ({
              menuItemId,
            })),
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      })
    }

    return NextResponse.json(meal)
  } catch (error: any) {
    console.error('Error creating/updating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create/update meal', details: error.message },
      { status: 500 }
    )
  }
}

