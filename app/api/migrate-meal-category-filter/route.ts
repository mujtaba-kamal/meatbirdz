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

    // First, check if Meal table exists
    const checkMealTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal'
      );
    `)
    const mealTableExists = (checkMealTable as any[])[0]?.exists || false

    if (!mealTableExists) {
      console.log('Meal table does not exist. Creating Meal table first...')
      
      // Create Meal table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Meal" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL DEFAULT 'Meal Deal',
          "description" TEXT,
          "basePrice" DOUBLE PRECISION NOT NULL,
          "image" TEXT,
          "available" BOOLEAN NOT NULL DEFAULT true,
          "categoryFilter" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
        )
      `)
      
      // Create updatedAt trigger function
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `)
      
      // Drop trigger if exists
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS update_meal_updated_at ON "Meal"`)
      
      // Create trigger
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER update_meal_updated_at BEFORE UPDATE ON "Meal"
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `)
      
      console.log('✅ Created "Meal" table.')
    }

    // Check if 'categoryFilter' column already exists
    const checkCategoryFilterColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal' 
        AND column_name = 'categoryFilter'
      ) as exists;
    `)
    const categoryFilterColumnExists = (checkCategoryFilterColumn as any[])[0]?.exists || false

    console.log('Category filter column exists check:', categoryFilterColumnExists)

    if (!categoryFilterColumnExists) {
      // Add 'categoryFilter' column to Meal table
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Meal" 
          ADD COLUMN IF NOT EXISTS "categoryFilter" TEXT;
        `)
        console.log('✅ Added "categoryFilter" column to Meal table.')
      } catch (error: any) {
        // If column already exists (race condition), that's fine
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log('Column already exists (race condition), continuing...')
        } else {
          throw error
        }
      }
    } else {
      console.log('Meal "categoryFilter" column already exists. Skipping migration.')
    }

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

