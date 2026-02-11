import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST endpoint to add order column to MenuItem table
export async function POST(request: NextRequest) {
  try {
    // Check for authorization token
    const authHeader = request.headers.get('authorization')
    const setupToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${setupToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide Authorization: Bearer <SETUP_TOKEN>' },
        { status: 401 }
      )
    }

    console.log('Adding order column to MenuItem table...')

    // Check if order column exists
    const checkOrderColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'MenuItem' 
        AND column_name = 'order'
      );
    `)
    const hasOrderColumn = (checkOrderColumn as any[])[0]?.exists || false

    if (!hasOrderColumn) {
      // Add order column
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "MenuItem" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('✅ Added order column to MenuItem table.')

      // Set initial order values based on current order (by name within category)
      await prisma.$executeRawUnsafe(`
        WITH ordered_items AS (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY name) - 1 as new_order
          FROM "MenuItem"
        )
        UPDATE "MenuItem" m
        SET "order" = oi.new_order
        FROM ordered_items oi
        WHERE m.id = oi.id;
      `)
      console.log('✅ Set initial order values for existing menu items.')
    } else {
      console.log('✅ Order column already exists.')
    }

    return NextResponse.json({
      success: true,
      message: 'MenuItem order column migration completed successfully',
    })
  } catch (error: any) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

