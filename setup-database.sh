#!/bin/bash

# Database Setup Script for Supabase
# This script will create the database tables and seed initial data

echo "🚀 Setting up database..."

# Load DATABASE_URL from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    echo ""
    echo "Please set it in your .env file:"
    echo "  DATABASE_URL='your_supabase_connection_string'"
    exit 1
fi

echo "✅ DATABASE_URL is set (from .env file)"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Push schema to database
echo ""
echo "🗄️  Pushing database schema..."
npx prisma db push --skip-generate

# Step 3: Seed database
echo ""
echo "🌱 Seeding database with menu items..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can now:"
echo "  - View your database: npm run db:studio"
echo "  - Run the app: npm run dev"

