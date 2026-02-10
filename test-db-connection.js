// Test database connection with detailed error information
const { PrismaClient } = require('@prisma/client');

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
console.log('');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Database query successful');
    console.log('PostgreSQL version:', result[0]?.version);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('\n📊 Existing tables:', tables.map(t => t.table_name).join(', ') || 'None');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check if your Supabase project is ACTIVE (not paused)');
      console.log('   - Go to https://supabase.com/dashboard');
      console.log('   - If paused, click "Restore" and wait 2-3 minutes');
      console.log('2. Verify your connection string format');
      console.log('3. Try using Connection Pooling URL (port 6543) instead');
      console.log('   - In Supabase: Settings → Database → Connection string');
      console.log('   - Use the "URI" tab with port 6543');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Password might be incorrect or need URL encoding');
      console.log('   Special characters like @ should be %40');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

