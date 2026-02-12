import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST endpoint to create AddOn table and add selectedAddOns column
export async function POST(request: NextRequest) {
  try {
    // Check for admin session OR setup token
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const isAdmin = session?.user?.role === 'ADMIN'
    const hasValidToken = token === process.env.SETUP_TOKEN

    if (!isAdmin && !hasValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access or setup token required.' },
        { status: 401 }
      )
    }

    console.log('Starting AddOn migration...')

    // Check if AddOn table exists
    const checkTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AddOn'
      );
    `)
    
    const tableExists = (checkTable as any[])[0]?.exists || false

    if (!tableExists) {
      console.log('Creating AddOn table...')
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
      console.log('✅ Created AddOn table')
    } else {
      console.log('AddOn table already exists')
    }

    // Add foreign key for AddOn.menuItemId
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Added AddOn foreign key')
    } catch (error: any) {
      console.log('⚠️ AddOn foreign key:', error.message)
    }

    // Add index for AddOn.menuItemId
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AddOn_menuItemId_idx" ON "AddOn"("menuItemId");
      `)
      console.log('✅ Added AddOn index')
    } catch (error: any) {
      console.log('⚠️ AddOn index:', error.message)
    }

    // Add selectedAddOns column to OrderItem table
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderItem' AND column_name = 'selectedAddOns'
          ) THEN
            ALTER TABLE "OrderItem" ADD COLUMN "selectedAddOns" JSONB;
            RAISE NOTICE 'Added selectedAddOns column';
          ELSE
            RAISE NOTICE 'selectedAddOns column already exists';
          END IF;
        END $$;
      `)
      console.log('✅ Added selectedAddOns column to OrderItem')
    } catch (error: any) {
      console.log('⚠️ selectedAddOns column:', error.message)
    }

    return NextResponse.json({
      success: true,
      message: 'AddOn migration completed successfully',
    })
  } catch (error: any) {
    console.error('Error migrating AddOn:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate AddOn',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

