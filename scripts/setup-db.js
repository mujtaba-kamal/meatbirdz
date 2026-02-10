#!/usr/bin/env node
/**
 * Database Setup Script
 * Run this script to set up your database tables and seed initial data
 * 
 * Usage:
 *   node scripts/setup-db.js
 *   Or: npm run setup-db (if added to package.json)
 */

const { execSync } = require('child_process')

console.log('🚀 Starting database setup...\n')

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.log('\nPlease set it:')
  console.log('  export DATABASE_URL="your_connection_string"')
  process.exit(1)
}

console.log('✅ DATABASE_URL is set\n')

try {
  // Step 1: Generate Prisma Client
  console.log('📦 Step 1: Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated\n')

  // Step 2: Push schema to create tables
  console.log('🗄️  Step 2: Pushing database schema (creating tables)...')
  execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' })
  console.log('✅ Database schema pushed successfully\n')

  // Step 3: Seed database
  console.log('🌱 Step 3: Seeding database with menu items...')
  execSync('npm run db:seed', { stdio: 'inherit' })
  console.log('✅ Database seeded successfully\n')

  console.log('🎉 Database setup completed successfully!')
  console.log('\nYou can now:')
  console.log('  - View your database: npm run db:studio')
  console.log('  - Run the app: npm run dev')
} catch (error) {
  console.error('\n❌ Error during setup:', error.message)
  process.exit(1)
}

