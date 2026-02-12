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

    console.log('📋 Fetching orders with filter:', whereClause)
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
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
    
    console.log(`✅ Found ${orders.length} orders`)
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('❌ Error fetching orders:', error)
    const errorMessage = error.message || error.toString() || ''
    
    // Try to return empty array if it's a schema/relation error, otherwise return error
    if (
      errorMessage.includes('meal') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('does not exist')
    ) {
      console.warn('⚠️ Schema error detected, returning empty array')
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: errorMessage },
      { status: 500 }
    )
  }
}

