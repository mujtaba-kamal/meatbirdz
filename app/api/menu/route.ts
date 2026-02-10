import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if Prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json([])
    }

    const menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Ensure we always return an array
    if (!Array.isArray(menuItems)) {
      console.error('Menu items is not an array:', menuItems)
      return NextResponse.json([])
    }

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Error fetching menu:', error)
    // Return empty array instead of error object to prevent .map() errors
    return NextResponse.json([])
  }
}

