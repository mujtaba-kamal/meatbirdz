import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST endpoint to add selectedMealOptions column to OrderItem table
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Simple token check
    if (token !== process.env.SETUP_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized. Setup token required.' },
        { status: 401 }
      )
    }

    console.log('Adding selectedMealOptions column to OrderItem table...')

    // Check if column already exists
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'OrderItem' 
      AND column_name = 'selectedMealOptions'
    `)

    if ((checkColumn as any[]).length > 0) {
      console.log('Column selectedMealOptions already exists')
      return NextResponse.json({
        success: true,
        message: 'Column selectedMealOptions already exists',
      })
    }

    // Add the column (using JSONB for PostgreSQL)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "OrderItem" 
        ADD COLUMN IF NOT EXISTS "selectedMealOptions" JSONB
      `)
      console.log('Successfully added selectedMealOptions column')
    } catch (error: any) {
      // If column already exists, that's fine
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('Column selectedMealOptions already exists (this is OK)')
      } else {
        throw error
      }
    }

    console.log('Successfully added selectedMealOptions column')

    return NextResponse.json({
      success: true,
      message: 'Successfully added selectedMealOptions column to OrderItem table',
    })
  } catch (error: any) {
    console.error('Error migrating database:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate database',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

