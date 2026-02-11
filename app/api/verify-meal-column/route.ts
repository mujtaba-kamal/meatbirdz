import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if Meal table exists
    const checkMealTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal'
      ) as exists;
    `)
    const mealTableExists = (checkMealTable as any[])[0]?.exists || false

    if (!mealTableExists) {
      return NextResponse.json({
        mealTableExists: false,
        categoryFilterColumnExists: false,
        message: 'Meal table does not exist',
      })
    }

    // Check if categoryFilter column exists
    const checkCategoryFilterColumn = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Meal' 
        AND column_name = 'categoryFilter'
      ) as exists;
    `)
    const categoryFilterColumnExists = (checkCategoryFilterColumn as any[])[0]?.exists || false

    // Get all columns in Meal table
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Meal'
      ORDER BY ordinal_position;
    `)

    return NextResponse.json({
      mealTableExists: true,
      categoryFilterColumnExists,
      columns: columns as any[],
      message: categoryFilterColumnExists 
        ? 'categoryFilter column exists' 
        : 'categoryFilter column does NOT exist - run migration',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to verify column',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

