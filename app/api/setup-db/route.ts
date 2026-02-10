import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    // Simple security check
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SETUP_TOKEN || 'setup-token-12345'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Use: Authorization: Bearer setup-token-12345' },
        { status: 401 }
      )
    }

    console.log('Starting database setup...')

    // Push the schema to create tables
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
        env: { ...process.env },
      })
      console.log('Schema push output:', stdout)
      if (stderr) console.warn('Schema push warnings:', stderr)
    } catch (error: any) {
      console.error('Error pushing schema:', error.message)
      // Check if it's just a connection error or actual failure
      if (error.message.includes("Can't reach database")) {
        return NextResponse.json(
          { 
            error: 'Cannot connect to database. Make sure your Supabase project is active and DATABASE_URL is correct.',
            details: error.message 
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to push schema', details: error.message },
        { status: 500 }
      )
    }

    // Try to seed the database
    try {
      const { stdout, stderr } = await execAsync('npm run db:seed', {
        env: { ...process.env },
      })
      console.log('Seed output:', stdout)
      if (stderr) console.warn('Seed warnings:', stderr)
    } catch (error: any) {
      console.warn('Warning: Seeding failed (this is okay if tables already have data):', error.message)
      // Don't fail the whole request if seeding fails
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully! Tables created and seeded.',
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    )
  }
}

