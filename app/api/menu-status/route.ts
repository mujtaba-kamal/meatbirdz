import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get menu status (public endpoint)
export async function GET() {
  try {
    // Auto-migrate: Ensure Settings table exists
    try {
      const tableCheck = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'settings'
      `)
      
      if ((tableCheck as any[]).length === 0) {
        console.log('🔧 Auto-migrating: Creating Settings table...')
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "settings" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "menuEnabled" BOOLEAN NOT NULL DEFAULT true,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `)
        console.log('✅ Successfully created Settings table')
      }
    } catch (migrationError: any) {
      if (!migrationError.message?.includes('already exists')) {
        console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
      }
    }

    // Try to get settings from database
    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' }
    })

    // If settings don't exist, create with default (enabled)
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'settings',
          menuEnabled: true
        }
      })
    }

    return NextResponse.json({ enabled: settings.menuEnabled })
  } catch (error: any) {
    console.error('Error fetching menu status:', error)
    // If there's an error (e.g., table doesn't exist), default to enabled
    return NextResponse.json({ enabled: true })
  }
}

// POST - Update menu status (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { enabled } = await request.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. "enabled" must be a boolean.' },
        { status: 400 }
      )
    }

    // Auto-migrate: Ensure Settings table exists
    try {
      const tableCheck = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'settings'
      `)
      
      if ((tableCheck as any[]).length === 0) {
        console.log('🔧 Auto-migrating: Creating Settings table...')
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "settings" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "menuEnabled" BOOLEAN NOT NULL DEFAULT true,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `)
        console.log('✅ Successfully created Settings table')
      }
    } catch (migrationError: any) {
      if (!migrationError.message?.includes('already exists')) {
        console.warn('⚠️ Migration check failed (non-critical):', migrationError.message)
      }
    }

    // Update or create settings in database
    const settings = await prisma.settings.upsert({
      where: { id: 'settings' },
      update: { menuEnabled: enabled },
      create: {
        id: 'settings',
        menuEnabled: enabled
      }
    })

    return NextResponse.json({ 
      success: true, 
      enabled: settings.menuEnabled,
      message: enabled ? 'Menu is now enabled' : 'Menu is now disabled'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update menu status', details: error.message },
      { status: 500 }
    )
  }
}

