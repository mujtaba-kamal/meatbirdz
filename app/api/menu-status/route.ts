import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const MENU_STATUS_FILE = join(process.cwd(), '.menu-status.json')

// Get menu status from file or default to true
function getMenuStatus(): boolean {
  try {
    if (existsSync(MENU_STATUS_FILE)) {
      const content = readFileSync(MENU_STATUS_FILE, 'utf-8')
      const data = JSON.parse(content)
      return data.enabled !== false // Default to true if not set
    }
  } catch (error) {
    console.warn('Error reading menu status file:', error)
  }
  return true // Default to enabled
}

// Save menu status to file
function saveMenuStatus(enabled: boolean): void {
  try {
    writeFileSync(MENU_STATUS_FILE, JSON.stringify({ enabled, updatedAt: new Date().toISOString() }), 'utf-8')
  } catch (error) {
    console.error('Error saving menu status file:', error)
  }
}

// GET - Get menu status (public endpoint)
export async function GET() {
  try {
    const status = getMenuStatus()
    return NextResponse.json({ enabled: status })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch menu status', details: error.message },
      { status: 500 }
    )
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

    // Save to file for persistence
    saveMenuStatus(enabled)

    return NextResponse.json({ 
      success: true, 
      enabled: enabled,
      message: enabled ? 'Menu is now enabled' : 'Menu is now disabled'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update menu status', details: error.message },
      { status: 500 }
    )
  }
}

