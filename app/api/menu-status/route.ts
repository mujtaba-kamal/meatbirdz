import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Simple in-memory store for menu status (default: enabled)
// In production, you might want to store this in database
let menuEnabled = true

// GET - Get menu status (public endpoint)
export async function GET() {
  try {
    return NextResponse.json({ enabled: menuEnabled })
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

    menuEnabled = enabled

    return NextResponse.json({ 
      success: true, 
      enabled: menuEnabled,
      message: enabled ? 'Menu is now enabled' : 'Menu is now disabled'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update menu status', details: error.message },
      { status: 500 }
    )
  }
}

