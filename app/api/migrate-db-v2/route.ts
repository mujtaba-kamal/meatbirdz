import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST endpoint to migrate database schema to v2 (dynamic meals and categories)
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

    console.log('Starting database migration to v2 (dynamic meals)...')

    // Check if MealCategory table exists
    const checkMealCategoryTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'MealCategory'
      );
    `)
    
    const mealCategoryTableExists = (checkMealCategoryTable as any[])[0]?.exists || false

    if (mealCategoryTableExists) {
      console.log('MealCategory table already exists. Migration may have already been run.')
      return NextResponse.json({
        success: true,
        message: 'Database schema v2 is already up-to-date',
        alreadyMigrated: true,
      })
    }

    // Create MealCategory table
    console.log('Creating MealCategory table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MealCategory" (
        "id" TEXT NOT NULL,
        "mealId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MealCategory_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create MenuItemMeal junction table
    console.log('Creating MenuItemMeal table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MenuItemMeal" (
        "id" TEXT NOT NULL,
        "menuItemId" TEXT NOT NULL,
        "mealId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MenuItemMeal_pkey" PRIMARY KEY ("id")
      );
    `)

    // Add indexes and constraints for MealCategory
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "MealCategory_mealId_order_key" 
      ON "MealCategory"("mealId", "order");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MealCategory_mealId_idx" 
      ON "MealCategory"("mealId");
    `)

    // Add foreign key for MealCategory
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'MealCategory_mealId_fkey'
        ) THEN
          ALTER TABLE "MealCategory" 
          ADD CONSTRAINT "MealCategory_mealId_fkey" 
          FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    // Add indexes and constraints for MenuItemMeal
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "MenuItemMeal_menuItemId_mealId_key" 
      ON "MenuItemMeal"("menuItemId", "mealId");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MenuItemMeal_menuItemId_idx" 
      ON "MenuItemMeal"("menuItemId");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MenuItemMeal_mealId_idx" 
      ON "MenuItemMeal"("mealId");
    `)

    // Add foreign keys for MenuItemMeal
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'MenuItemMeal_menuItemId_fkey'
        ) THEN
          ALTER TABLE "MenuItemMeal" 
          ADD CONSTRAINT "MenuItemMeal_menuItemId_fkey" 
          FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'MenuItemMeal_mealId_fkey'
        ) THEN
          ALTER TABLE "MenuItemMeal" 
          ADD CONSTRAINT "MenuItemMeal_mealId_fkey" 
          FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    // Check if MealOption has categoryId column
    const checkCategoryIdColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'MealOption' 
        AND column_name = 'categoryId'
      );
    `)
    const hasCategoryIdColumn = (checkCategoryIdColumn as any[])[0]?.exists || false

    if (!hasCategoryIdColumn) {
      console.log('Migrating MealOption to use categoryId...')
      
      // Add categoryId column to MealOption
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "MealOption" 
        ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
      `)

      // Migrate existing data: Create categories from old structure and update MealOption
      const meals = await prisma.$queryRawUnsafe(`
        SELECT id, "category1Name", "category2Name", "category3Name"
        FROM "Meal";
      `) as any[]

      for (const meal of meals) {
        // Create categories for this meal
        const category1Id = `cat_${meal.id}_1`
        const category2Id = `cat_${meal.id}_2`
        const category3Id = `cat_${meal.id}_3`

        await prisma.$executeRawUnsafe(`
          INSERT INTO "MealCategory" (id, "mealId", name, "order", "createdAt")
          VALUES 
            ($1, $2, $3, 1, CURRENT_TIMESTAMP),
            ($4, $2, $5, 2, CURRENT_TIMESTAMP),
            ($6, $2, $7, 3, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING;
        `, category1Id, meal.id, meal.category1Name || 'Fries', category2Id, meal.category2Name || 'Drink', category3Id, meal.category3Name || 'Side')

        // Update MealOption to use categoryId
        await prisma.$executeRawUnsafe(`
          UPDATE "MealOption"
          SET "categoryId" = CASE 
            WHEN category = 1 THEN $1
            WHEN category = 2 THEN $2
            WHEN category = 3 THEN $3
          END
          WHERE "mealId" = $4;
        `, category1Id, category2Id, category3Id, meal.id)
      }

      // Make categoryId NOT NULL after migration
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "MealOption" 
        ALTER COLUMN "categoryId" SET NOT NULL;
      `)

      // Add foreign key for categoryId
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'MealOption_categoryId_fkey'
          ) THEN
            ALTER TABLE "MealOption" 
            ADD CONSTRAINT "MealOption_categoryId_fkey" 
            FOREIGN KEY ("categoryId") REFERENCES "MealCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `)

      // Update unique constraint
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "MealOption_mealId_menuItemId_category_key";
      `)
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MealOption_mealId_categoryId_menuItemId_key" 
        ON "MealOption"("mealId", "categoryId", "menuItemId");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MealOption_mealId_categoryId_idx" 
        ON "MealOption"("mealId", "categoryId");
      `)

      // Optionally drop old category column (keep it for now for safety)
      // await prisma.$executeRawUnsafe(`ALTER TABLE "MealOption" DROP COLUMN IF EXISTS category;`)
    }

    // Remove old category name columns from Meal (optional, keep for now)
    // await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" DROP COLUMN IF EXISTS "category1Name";`)
    // await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" DROP COLUMN IF EXISTS "category2Name";`)
    // await prisma.$executeRawUnsafe(`ALTER TABLE "Meal" DROP COLUMN IF EXISTS "category3Name";`)

    console.log('Database migration v2 completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Database migration v2 completed successfully',
    })
  } catch (error: any) {
    console.error('Error during database migration v2:', error)
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

