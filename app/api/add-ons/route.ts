import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch add-ons for a menu item
export async function GET(request: NextRequest) {
  try {
    // Auto-migrate: Ensure AddOn table exists
    try {
      const tableCheck = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AddOn'
        );
      `)
      
      if (!(tableCheck as any[])[0]?.exists) {
        console.log('🔧 Auto-migrating: Creating AddOn table...')
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "AddOn" (
            "id" TEXT NOT NULL,
            "menuItemId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "price" DOUBLE PRECISION NOT NULL,
            "available" BOOLEAN NOT NULL DEFAULT true,
            "order" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
          );
        `)
        
        // Add foreign key
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `)
        
        // Add index
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "AddOn_menuItemId_idx" ON "AddOn"("menuItemId");
        `)
        
        console.log('✅ Successfully created AddOn table')
      }
    } catch (migrationError: any) {
      console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
    }
    
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    if (menuItemId) {
      // Fetch add-ons for a specific menu item
      const addOns = await (prisma as any).addOn.findMany({
        where: { menuItemId },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json(addOns)
    }

    // Fetch all add-ons (for admin)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const addOns = await (prisma as any).addOn.findMany({
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { menuItem: { name: 'asc' } },
        { order: 'asc' },
      ],
    })

    return NextResponse.json(addOns)
  } catch (error: any) {
    console.error('Error fetching add-ons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch add-ons', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new add-on
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
    const { menuItemId, name, price, available, order } = body

    if (!menuItemId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'menuItemId, name, and price are required' },
        { status: 400 }
      )
    }

    // Verify menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    const addOn = await (prisma as any).addOn.create({
      data: {
        menuItemId,
        name,
        price: parseFloat(price),
        available: available !== undefined ? available : true,
        order: order !== undefined ? parseInt(order) : 0,
      },
    })

    return NextResponse.json(addOn)
  } catch (error: any) {
    console.error('Error creating add-on:', error)
    return NextResponse.json(
      { error: 'Failed to create add-on', details: error.message },
      { status: 500 }
    )
  }
}

