import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if Prisma is initialized
    if (!prisma) {
      console.error('❌ Prisma client is not initialized')
      return NextResponse.json(
        { error: 'Database not initialized', items: [] },
        { status: 500 }
      )
    }

    console.log('📋 Fetching menu items...')

    // First, fetch menu items without add-ons (safer approach)
    let menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })
    console.log(`✅ Fetched ${menuItems.length} menu items`)
    
    // Then try to fetch add-ons separately and attach them
    try {
      const addOnsData = await (prisma as any).$queryRawUnsafe(`
        SELECT "id", "menuItemId", "name", "price", "available", "order"
        FROM "AddOn"
        WHERE "available" = true
        ORDER BY "menuItemId", "order" ASC
      `)
      
      // Group add-ons by menuItemId
      const addOnsByMenuItem = (addOnsData as any[]).reduce((acc: any, addOn: any) => {
        if (!acc[addOn.menuItemId]) {
          acc[addOn.menuItemId] = []
        }
        acc[addOn.menuItemId].push(addOn)
        return acc
      }, {})
      
      // Attach add-ons to menu items
      menuItems = menuItems.map((item: any) => ({
        ...item,
        addOns: addOnsByMenuItem[item.id] || [],
      }))
      console.log(`✅ Attached add-ons to menu items`)
    } catch (addOnError: any) {
      // If AddOn table doesn't exist, just return menu items without add-ons
      console.warn('⚠️ AddOn table not available (this is OK):', addOnError.message)
      menuItems = menuItems.map((item: any) => ({
        ...item,
        addOns: [],
      }))
    }

    // Ensure we always return an array
    if (!Array.isArray(menuItems)) {
      console.error('❌ Menu items is not an array:', menuItems)
      return NextResponse.json(
        { error: 'Invalid data format', items: [] },
        { status: 500 }
      )
    }

    console.log(`✅ Returning ${menuItems.length} menu items`)
    return NextResponse.json(menuItems)
  } catch (error: any) {
    console.error('❌ Error fetching menu:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    // Return error details for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu', 
        details: error.message,
        items: [] 
      },
      { status: 500 }
    )
  }
}

