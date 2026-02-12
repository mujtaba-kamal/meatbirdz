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

    let menuItems
    try {
      // Try to include add-ons if the relation exists
      menuItems = await prisma.menuItem.findMany({
        include: {
          addOns: {
            where: { available: true },
            orderBy: { order: 'asc' },
          },
        } as any,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      })
    } catch (error: any) {
      // If addOns relation doesn't exist, fetch without it
      if (error.message?.includes('addOns') || error.message?.includes('relation')) {
        console.warn('⚠️ AddOns relation not available, fetching menu items without add-ons')
        menuItems = await prisma.menuItem.findMany({
          orderBy: [
            { category: 'asc' },
            { name: 'asc' },
          ],
        })
        // Fetch add-ons separately and attach them
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
        } catch (addOnError) {
          // If AddOn table doesn't exist, just return menu items without add-ons
          console.warn('⚠️ AddOn table not available')
        }
      } else {
        throw error
      }
    }

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

