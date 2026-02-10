import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch all meals
export async function GET() {
  try {
    const meals = await prisma.meal.findMany({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
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

    const { name, description, price, image, available, items } = await request.json()

    if (!name || !price || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Name, price, and at least one item are required' },
        { status: 400 }
      )
    }

    // Create meal with items
    const meal = await prisma.meal.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        image: image || null,
        available: available !== undefined ? available : true,
        items: {
          create: items.map((item: { menuItemId: string; quantity: number }) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
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

    return NextResponse.json(meal)
  } catch (error: any) {
    console.error('Error creating meal:', error)
    return NextResponse.json(
      { error: 'Failed to create meal', details: error.message },
      { status: 500 }
    )
  }
}

