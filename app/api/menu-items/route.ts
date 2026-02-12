import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch all menu items
export async function GET() {
  try {
    console.log('📋 Admin: Fetching menu items...')
    
    // Check if MenuItem table exists
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'MenuItem'
      );
    `)
    
    const tableExists = (tableCheck as any[])[0]?.exists || false
    
    if (!tableExists) {
      console.error('❌ MenuItem table does not exist')
      return NextResponse.json(
        { error: 'MenuItem table does not exist. Please run database setup.', items: [] },
        { status: 500 }
      )
    }
    
    // Check menu item count
    const count = await prisma.menuItem.count()
    console.log(`📊 Found ${count} menu items in database`)
    
    if (count === 0) {
      console.warn('⚠️ No menu items found in database')
      return NextResponse.json([])
    }
    
    // First, fetch menu items without add-ons (safer approach)
    let menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { category: 'asc' },
        { order: 'asc' } as any,
        { name: 'asc' },
      ],
    })
    console.log(`✅ Fetched ${menuItems.length} menu items`)
    
    // Then try to fetch add-ons separately and attach them
    try {
      const addOnsData = await (prisma as any).$queryRawUnsafe(`
        SELECT "id", "menuItemId", "name", "price", "available", "order"
        FROM "AddOn"
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

    console.log(`✅ Admin: Returning ${menuItems.length} menu items`)
    return NextResponse.json(menuItems)
  } catch (error: any) {
    console.error('❌ Admin: Error fetching menu items:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu items',
        details: error.message,
        items: []
      },
      { status: 500 }
    )
  }
}

// POST - Create a new menu item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { name, description, price, category, image, available } = await request.json()

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        category,
        image: image || null,
        available: available !== undefined ? available : true,
      },
    })

    return NextResponse.json(menuItem)
  } catch (error: any) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item', details: error.message },
      { status: 500 }
    )
  }
}

