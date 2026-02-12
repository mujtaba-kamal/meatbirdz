import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET endpoint to check if column exists
export async function GET(request: NextRequest) {
  try {
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'OrderItem' 
      AND column_name = 'selectedMealOptions'
    `)

    const exists = (checkColumn as any[]).length > 0

    return NextResponse.json({
      exists,
      message: exists 
        ? 'Column selectedMealOptions exists' 
        : 'Column selectedMealOptions does not exist',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check column', details: error.message },
      { status: 500 }
    )
  }
}

// POST endpoint to add selectedMealOptions column to OrderItem table
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

