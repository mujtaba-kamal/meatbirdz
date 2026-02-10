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
        options: {
          include: {
            menuItem: true,
          },
          orderBy: [
            { category: 'asc' },
            { additionalPrice: 'asc' },
          ],
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

    const { 
      name, 
      description, 
      basePrice, 
      image, 
      available, 
      category1Name, 
      category2Name, 
      category3Name,
      options // Array of { menuItemId, category (1-3), additionalPrice }
    } = await request.json()

    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Name and base price are required' },
        { status: 400 }
      )
    }

    // Check if meal already exists
    const existingMeal = await prisma.meal.findFirst()

    let meal
    if (existingMeal) {
      // Update existing meal
      // Delete existing meal options
      await prisma.mealOption.deleteMany({
        where: { mealId: existingMeal.id },
      })

      // Update meal and create new options
      const updateData: any = {
        name,
        description: description || null,
        basePrice: parseFloat(basePrice),
        image: image || null,
        available: available !== undefined ? available : true,
        category1Name: category1Name || 'Fries',
        category2Name: category2Name || 'Drink',
        category3Name: category3Name || 'Side',
        options: {
          create: (options || []).map((opt: { menuItemId: string; category: number; additionalPrice: number }) => ({
            menuItemId: opt.menuItemId,
            category: opt.category,
            additionalPrice: parseFloat(opt.additionalPrice?.toString() || '0'),
          })),
        },
      }

      meal = await prisma.meal.update({
        where: { id: existingMeal.id },
        data: updateData,
        include: {
          options: {
            include: {
              menuItem: true,
            },
            orderBy: [
              { category: 'asc' },
              { additionalPrice: 'asc' },
            ],
          },
        },
      })
    } else {
      // Create new meal
      const createData: any = {
        name,
        description: description || null,
        basePrice: parseFloat(basePrice),
        image: image || null,
        available: available !== undefined ? available : true,
        category1Name: category1Name || 'Fries',
        category2Name: category2Name || 'Drink',
        category3Name: category3Name || 'Side',
        options: {
          create: (options || []).map((opt: { menuItemId: string; category: number; additionalPrice: number }) => ({
            menuItemId: opt.menuItemId,
            category: opt.category,
            additionalPrice: parseFloat(opt.additionalPrice?.toString() || '0'),
          })),
        },
      }

      meal = await prisma.meal.create({
        data: createData,
        include: {
          options: {
            include: {
              menuItem: true,
            },
            orderBy: [
              { category: 'asc' },
              { additionalPrice: 'asc' },
            ],
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
