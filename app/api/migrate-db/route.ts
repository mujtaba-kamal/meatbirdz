import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST endpoint to migrate database schema
// This adds the new Meal and MealItem tables and updates OrderItem
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

    console.log('Starting database migration...')

    // Check if Meal table exists
    const checkMealTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal'
      );
    `)
    
    const mealTableExists = (checkMealTable as any[])[0]?.exists || false

    if (!mealTableExists) {
      console.log('Creating Meal table...')
      // Create Meal table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Meal" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL,
          "image" TEXT,
          "available" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
        );
      `)

      // Create MealItem table
      console.log('Creating MealItem table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MealItem" (
          "id" TEXT NOT NULL,
          "mealId" TEXT NOT NULL,
          "menuItemId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
        );
      `)

      // Add unique constraint to MealItem
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MealItem_mealId_menuItemId_key" 
        ON "MealItem"("mealId", "menuItemId");
      `)

      // Add foreign key constraints
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'MealItem_mealId_fkey'
          ) THEN
            ALTER TABLE "MealItem" 
            ADD CONSTRAINT "MealItem_mealId_fkey" 
            FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)

      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'MealItem_menuItemId_fkey'
          ) THEN
            ALTER TABLE "MealItem" 
            ADD CONSTRAINT "MealItem_menuItemId_fkey" 
            FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)

      // Check if mealId column exists in OrderItem
      const checkMealIdColumn = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'OrderItem' 
          AND column_name = 'mealId'
        );
      `)
      
      const mealIdColumnExists = (checkMealIdColumn as any[])[0]?.exists || false

      if (!mealIdColumnExists) {
        console.log('Adding mealId column to OrderItem...')
        // Add mealId column to OrderItem (nullable)
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "OrderItem" 
          ADD COLUMN IF NOT EXISTS "mealId" TEXT;
        `)

        // Make menuItemId nullable (if not already)
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            ALTER TABLE "OrderItem" 
            ALTER COLUMN "menuItemId" DROP NOT NULL;
          EXCEPTION
            WHEN OTHERS THEN
              -- Column might already be nullable, ignore error
              NULL;
          END $$;
        `)

        // Add foreign key constraint for mealId
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'OrderItem_mealId_fkey'
            ) THEN
              ALTER TABLE "OrderItem" 
              ADD CONSTRAINT "OrderItem_mealId_fkey" 
              FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
          END $$;
        `)
      }

      // Update updatedAt trigger for Meal table
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)

      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS update_meal_updated_at ON "Meal";
        CREATE TRIGGER update_meal_updated_at 
        BEFORE UPDATE ON "Meal"
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
      `)

      console.log('Database migration completed successfully!')
      
      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully',
        changes: [
          'Created Meal table',
          'Created MealItem table',
          'Added mealId column to OrderItem',
          'Made menuItemId nullable in OrderItem',
          'Added foreign key constraints',
        ],
      })
    } else {
      console.log('Meal table already exists. Migration may have already been run.')
      return NextResponse.json({
        success: true,
        message: 'Database schema is up to date. Migration already completed.',
        alreadyMigrated: true,
      })
    }
  } catch (error: any) {
    console.error('Error during database migration:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate database',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

