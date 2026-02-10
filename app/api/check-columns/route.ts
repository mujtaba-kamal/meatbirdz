import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name IN ('arrivalNotification', 'arrivalAcknowledged')
      ORDER BY column_name
    `)

    return NextResponse.json({
      columnsFound: columns.length,
      columns: columns,
      needsMigration: columns.length < 2,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check columns', details: error.message },
      { status: 500 }
    )
  }
}

