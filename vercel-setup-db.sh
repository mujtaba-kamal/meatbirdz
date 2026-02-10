#!/bin/bash
# Script to set up database using Vercel environment variables

echo "🚀 Setting up database via Vercel..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Pull environment variables from Vercel
echo "📥 Pulling environment variables from Vercel..."
vercel env pull .env.production --environment=production --yes

if [ ! -f .env.production ]; then
    echo "❌ Failed to pull environment variables"
    echo "Make sure you're logged in: vercel login"
    exit 1
fi

# Load the DATABASE_URL from .env.production
export $(grep DATABASE_URL .env.production | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in Vercel environment variables"
    exit 1
fi

echo "✅ DATABASE_URL loaded from Vercel"
echo ""

# Run the setup
echo "📦 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo ""
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"

