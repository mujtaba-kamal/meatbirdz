import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`
    const version = result[0]?.version || 'Unknown'
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    const tableNames = tables.map(t => t.table_name)
    
    // Check if MenuItem table exists and has data
    let menuItemCount = 0
    if (tableNames.includes('MenuItem')) {
      menuItemCount = await prisma.menuItem.count()
    }
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      connected: true,
      database: {
        version: version.toString().substring(0, 50),
        tables: tableNames,
        menuItemCount,
        status: tableNames.length > 0 ? 'Tables exist' : 'No tables found',
      },
      message: '✅ Successfully connected to Supabase database!',
    })
  } catch (error: any) {
    console.error('Database connection test failed:', error)
    
    return NextResponse.json({
      connected: false,
      error: error.message,
      message: '❌ Failed to connect to database',
      troubleshooting: {
        checkVercelEnv: 'Go to Vercel → Settings → Environment Variables → Check DATABASE_URL is set',
        checkSupabase: 'Go to Supabase Dashboard → Check if project is Active (not Paused)',
        checkConnectionString: 'Verify DATABASE_URL has correct password (URL encoded if needed)',
      },
    }, { status: 500 })
  }
}

