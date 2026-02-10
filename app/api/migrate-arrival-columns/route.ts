import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Simple security check
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Use: Authorization: Bearer setup-token-12345' },
        { status: 401 }
      )
    }

    console.log('Starting migration: Adding arrival notification columns...')

    // Add arrivalNotification column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'arrivalNotification'
          ) THEN
            ALTER TABLE "Order" ADD COLUMN "arrivalNotification" TIMESTAMP(3);
            RAISE NOTICE 'Added arrivalNotification column';
          ELSE
            RAISE NOTICE 'arrivalNotification column already exists';
          END IF;
        END $$;
      `)
      console.log('✅ Added arrivalNotification column')
    } catch (error: any) {
      console.error('❌ Error adding arrivalNotification:', error.message)
      throw error
    }

    // Add arrivalAcknowledged column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'arrivalAcknowledged'
          ) THEN
            ALTER TABLE "Order" ADD COLUMN "arrivalAcknowledged" BOOLEAN NOT NULL DEFAULT false;
            RAISE NOTICE 'Added arrivalAcknowledged column';
          ELSE
            RAISE NOTICE 'arrivalAcknowledged column already exists';
          END IF;
        END $$;
      `)
      console.log('✅ Added arrivalAcknowledged column')
    } catch (error: any) {
      console.error('❌ Error adding arrivalAcknowledged:', error.message)
      throw error
    }

    // Verify columns exist
    const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name IN ('arrivalNotification', 'arrivalAcknowledged')
    `)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!',
      details: {
        columnsAdded: columns.length,
        columns: columns.map(c => c.column_name),
      },
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}

