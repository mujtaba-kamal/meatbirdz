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
      // Create Meal table with new schema
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Meal" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL DEFAULT 'Meal Deal',
          "description" TEXT,
          "basePrice" DOUBLE PRECISION NOT NULL,
          "image" TEXT,
          "available" BOOLEAN NOT NULL DEFAULT true,
          "category1Name" TEXT NOT NULL DEFAULT 'Fries',
          "category2Name" TEXT NOT NULL DEFAULT 'Drink',
          "category3Name" TEXT NOT NULL DEFAULT 'Side',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
        );
      `)

      // Create MealOption table (replaces MealItem)
      console.log('Creating MealOption table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MealOption" (
          "id" TEXT NOT NULL,
          "mealId" TEXT NOT NULL,
          "menuItemId" TEXT NOT NULL,
          "category" INTEGER NOT NULL,
          "additionalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MealOption_pkey" PRIMARY KEY ("id")
        );
      `)

      // Add unique constraint to MealOption
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MealOption_mealId_menuItemId_category_key" 
        ON "MealOption"("mealId", "menuItemId", "category");
      `)

      // Add foreign key constraints for MealOption
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'MealOption_mealId_fkey'
          ) THEN
            ALTER TABLE "MealOption" 
            ADD CONSTRAINT "MealOption_mealId_fkey" 
            FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)

      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'MealOption_menuItemId_fkey'
          ) THEN
            ALTER TABLE "MealOption" 
            ADD CONSTRAINT "MealOption_menuItemId_fkey" 
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
      console.log('Meal table already exists. Checking for schema updates...')
      
      // Check what columns exist
      const checkPriceColumn = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Meal' 
          AND column_name = 'price'
        );
      `)
      const hasPrice = (checkPriceColumn as any[])[0]?.exists || false
      
      const checkBasePrice = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Meal' 
          AND column_name = 'basePrice'
        );
      `)
      const hasBasePrice = (checkBasePrice as any[])[0]?.exists || false
      
      // Migrate price to basePrice if needed
      if (hasPrice && !hasBasePrice) {
        console.log('Migrating from old schema: renaming price to basePrice...')
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" RENAME COLUMN "price" TO "basePrice";`)
      } else if (!hasBasePrice) {
        console.log('Adding basePrice column to Meal table...')
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" ADD COLUMN "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;`)
      }
      
      // Check for old label columns
      const checkMainLabel = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Meal' 
          AND column_name = 'mainLabel'
        );
      `)
      const hasMainLabel = (checkMainLabel as any[])[0]?.exists || false
      
      const checkCategory1Name = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Meal' 
          AND column_name = 'category1Name'
        );
      `)
      const hasCategory1Name = (checkCategory1Name as any[])[0]?.exists || false
      
      // Migrate old label columns to new category names if needed
      if (hasMainLabel && !hasCategory1Name) {
        console.log('Migrating from old schema: renaming label columns to category names...')
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" RENAME COLUMN "mainLabel" TO "category1Name";`)
        
        const checkSideLabel = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Meal' 
            AND column_name = 'sideLabel'
          );
        `)
        if ((checkSideLabel as any[])[0]?.exists) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" RENAME COLUMN "sideLabel" TO "category3Name";`)
        }
        
        const checkDrinkLabel = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Meal' 
            AND column_name = 'drinkLabel'
          );
        `)
        if ((checkDrinkLabel as any[])[0]?.exists) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" RENAME COLUMN "drinkLabel" TO "category2Name";`)
        }
      }
      
      // Add new category columns if they don't exist
      if (!hasCategory1Name) {
        console.log('Adding category name columns to Meal table...')
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "category1Name" TEXT NOT NULL DEFAULT 'Fries';`)
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "category2Name" TEXT NOT NULL DEFAULT 'Drink';`)
        await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "category3Name" TEXT NOT NULL DEFAULT 'Side';`)
      }
      
      // Check if MealOption table exists, if not create it
      const checkMealOptionTable = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'MealOption'
        );
      `)
      
      if (!(checkMealOptionTable as any[])[0]?.exists) {
        console.log('Creating MealOption table...')
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "MealOption" (
            "id" TEXT NOT NULL,
            "mealId" TEXT NOT NULL,
            "menuItemId" TEXT NOT NULL,
            "category" INTEGER NOT NULL,
            "additionalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "MealOption_pkey" PRIMARY KEY ("id")
          );
        `)
        
        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX "MealOption_mealId_menuItemId_category_key" 
          ON "MealOption"("mealId", "menuItemId", "category");
        `)
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "MealOption" 
          ADD CONSTRAINT "MealOption_mealId_fkey" 
          FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `)
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "MealOption" 
          ADD CONSTRAINT "MealOption_menuItemId_fkey" 
          FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `)
      }

      // Remove availableInMeal and mealCategory columns from MenuItem if they exist (no longer needed)
      console.log('Removing old columns from "MenuItem" table...')
      
      // Check and drop availableInMeal column
      const checkAvailableInMeal = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'MenuItem' 
          AND column_name = 'availableInMeal'
        );
      `)
      if ((checkAvailableInMeal as any[])[0]?.exists) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "MenuItem" DROP COLUMN "availableInMeal";`)
      }
      
      // Check and drop mealCategory column
      const checkMealCategory = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'MenuItem' 
          AND column_name = 'mealCategory'
        );
      `)
      if ((checkMealCategory as any[])[0]?.exists) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "MenuItem" DROP COLUMN "mealCategory";`)
      }
      
      console.log('✅ Old columns removed from "MenuItem" table (if existed).')

      // Remove quantity column from MealItem if it exists (no longer needed)
      const checkQuantity = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'MealItem' 
          AND column_name = 'quantity'
        );
      `)
      
      if ((checkQuantity as any[])[0]?.exists) {
        console.log('Removing quantity column from MealItem table...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "MealItem" 
          DROP COLUMN IF EXISTS "quantity";
        `)
      }

      return NextResponse.json({
        success: true,
        message: 'Database schema updated successfully',
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

