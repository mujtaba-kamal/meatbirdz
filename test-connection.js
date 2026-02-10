// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your Supabase project is paused');
      console.log('   - Go to https://supabase.com/dashboard');
      console.log('   - If paused, click "Restore" to activate it');
      console.log('2. Verify your connection string is correct');
      console.log('3. Check if your password needs URL encoding');
      console.log('   - Special characters like @ should be %40');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

