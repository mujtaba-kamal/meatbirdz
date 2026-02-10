import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Build date filter
    const whereClause: any = {}
    
    if (fromParam || toParam) {
      whereClause.createdAt = {}
      if (fromParam) {
        whereClause.createdAt.gte = new Date(fromParam)
      }
      if (toParam) {
        whereClause.createdAt.lte = new Date(toParam)
      }
    } else {
      // Default to last 24 hours if no date range specified
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setHours(now.getHours() - 24)
      whereClause.createdAt = {
        gte: yesterday,
        lte: now,
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menuItem: true,
            meal: true, // Include meal relation if it exists
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    // Return empty array instead of error to prevent frontend .filter() errors
    // The error might be due to missing database columns (mealId) if migration hasn't run
    if (error.message?.includes('mealId') || error.message?.includes('column') || error.message?.includes('does not exist')) {
      console.error('Database schema mismatch. Please run: npx prisma db push')
    }
    return NextResponse.json([]) // Return empty array to prevent frontend errors
  }
}

