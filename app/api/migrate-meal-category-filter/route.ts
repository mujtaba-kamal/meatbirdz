import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const setupToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${setupToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide Authorization: Bearer <SETUP_TOKEN>' },
        { status: 401 }
      )
    }

    console.log('Starting Meal categoryFilter column migration...')

    // Check if 'categoryFilter' column already exists
    const checkCategoryFilterColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal' 
        AND column_name = 'categoryFilter'
      );
    `)
    const categoryFilterColumnExists = (checkCategoryFilterColumn as any[])[0]?.exists || false

    if (categoryFilterColumnExists) {
      console.log('Meal "categoryFilter" column already exists. Skipping migration.')
      return NextResponse.json({
        success: true,
        message: 'Meal categoryFilter column migration completed successfully',
        alreadyMigrated: true,
      })
    }

    // Add 'categoryFilter' column to Meal table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Meal" 
      ADD COLUMN "categoryFilter" TEXT;
    `)
    console.log('✅ Added "categoryFilter" column to Meal table.')

    console.log('Meal categoryFilter column migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Meal categoryFilter column migration completed successfully',
    })
  } catch (error: any) {
    console.error('Error during Meal categoryFilter column migration:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate Meal categoryFilter column',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

