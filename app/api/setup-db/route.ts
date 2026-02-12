import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Test connection first
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Create tables if they don't exist using raw SQL
    console.log('📋 Creating database tables...')
    
    // Create enum types (ignore if they exist)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Created OrderStatus enum')
    } catch (error: any) {
      console.log('⚠️ OrderStatus enum:', error.message)
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Created PaymentStatus enum')
    } catch (error: any) {
      console.log('⚠️ PaymentStatus enum:', error.message)
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Created UserRole enum')
    } catch (error: any) {
      console.log('⚠️ UserRole enum:', error.message)
    }

    // Create tables (ignore if they exist)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MenuItem" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL,
          "category" TEXT NOT NULL,
          "image" TEXT,
          "available" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('✅ Created MenuItem table')
    } catch (error: any) {
      console.error('❌ Error creating MenuItem table:', error.message)
      throw error
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "name" TEXT,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
          "phone" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('✅ Created User table')
    } catch (error: any) {
      console.error('❌ Error creating User table:', error.message)
      throw error
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      `)
      console.log('✅ Created User email index')
    } catch (error: any) {
      console.log('⚠️ User email index:', error.message)
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Order" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "customerName" TEXT NOT NULL,
          "customerEmail" TEXT NOT NULL,
          "customerPhone" TEXT NOT NULL,
          "deliveryAddress" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "postalCode" TEXT,
          "totalAmount" DOUBLE PRECISION NOT NULL,
          "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
          "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
          "stripePaymentId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('✅ Created Order table')
    } catch (error: any) {
      console.error('❌ Error creating Order table:', error.message)
      throw error
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OrderItem" (
          "id" TEXT NOT NULL,
          "orderId" TEXT NOT NULL,
          "menuItemId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" DOUBLE PRECISION NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('✅ Created OrderItem table')
    } catch (error: any) {
      console.error('❌ Error creating OrderItem table:', error.message)
      throw error
    }

    // Add foreign keys (ignore if they exist)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Added Order foreign keys')
    } catch (error: any) {
      console.log('⚠️ Order foreign keys:', error.message)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Added OrderItem orderId foreign key')
    } catch (error: any) {
      console.log('⚠️ OrderItem orderId foreign key:', error.message)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('✅ Added OrderItem menuItemId foreign key')
    } catch (error: any) {
      console.log('⚠️ OrderItem menuItemId foreign key:', error.message)
    }

    console.log('✅ Tables created')

    // Add new columns to Order table if they don't exist
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'arrivalNotification'
          ) THEN
            ALTER TABLE "Order" ADD COLUMN "arrivalNotification" TIMESTAMP(3);
          END IF;
        END $$;
      `)
      console.log('✅ Added arrivalNotification column')
    } catch (error: any) {
      console.log('⚠️ arrivalNotification column:', error.message)
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'arrivalAcknowledged'
          ) THEN
            ALTER TABLE "Order" ADD COLUMN "arrivalAcknowledged" BOOLEAN NOT NULL DEFAULT false;
          END IF;
        END $$;
      `)
      console.log('✅ Added arrivalAcknowledged column')
    } catch (error: any) {
      console.log('⚠️ arrivalAcknowledged column:', error.message)
    }

    // Add selectedMealOptions column to OrderItem table
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderItem' AND column_name = 'selectedMealOptions'
          ) THEN
            ALTER TABLE "OrderItem" ADD COLUMN "selectedMealOptions" JSONB;
          END IF;
        END $$;
      `)
      console.log('✅ Added selectedMealOptions column to OrderItem')
    } catch (error: any) {
      console.log('⚠️ selectedMealOptions column:', error.message)
    }

    // Clear existing data
    await prisma.orderItem.deleteMany().catch(() => {})
    await prisma.order.deleteMany().catch(() => {})
    await prisma.menuItem.deleteMany().catch(() => {})
    await prisma.user.deleteMany().catch(() => {})
    console.log('✅ Cleared existing data')

    // Create test users
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const customerPassword = await bcrypt.hash('customer123', 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@meatbirdz.com',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+1 (555) 000-0001',
      },
    })

    const customer = await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: 'customer@meatbirdz.com',
        password: customerPassword,
        role: 'CUSTOMER',
        phone: '+1 (555) 000-0002',
      },
    })
    console.log('✅ Created test users')

    // Create menu items with images (from seed.ts)
    const menuItems = [
      // BURGERS
      { name: 'Angus Classic', description: '4oz (2 patties). Fresh Premium Angus, double cheese, lettuce, caramelised onions, gherkins, house sauce', price: 7.99, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', available: true },
      { name: 'The Angus Three', description: '6oz (3 patties). Fresh Premium Angus, triple cheese, lettuce, caramelised onions, gherkins, house sauce', price: 8.99, category: 'burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop', available: true },
      { name: 'The Holy Angus', description: '8oz (4 patties). Fresh Premium Angus, quadruple cheese, lettuce, caramelised onions, gherkins, house sauce', price: 9.99, category: 'burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop', available: true },
      { name: 'The Crispy Bird', description: 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, cheese', price: 6.99, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', available: true },
      { name: 'The Big Bird', description: 'Freshly prepared in-house marination. Double crispy chicken fillet, double cheese, lettuce, house sauce', price: 7.99, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', available: true },
      { name: 'Traditional Cheese ¼ Pounder', description: 'Lettuce, single cheese, mayonnaise, house sauce', price: 5.50, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', available: true },
      { name: 'Traditional Cheese ½ Pounder', description: 'Lettuce, double cheese, mayonnaise, house sauce', price: 6.00, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', available: true },
      { name: 'The Grilled Bird', description: 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, house sauce', price: 7.50, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', available: true },
      { name: 'The Double Grilled Bird', description: 'Freshly prepared in-house marination. Chargrilled chicken, double cheese, lettuce, house sauce', price: 8.50, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', available: true },
      // WRAPS
      { name: 'The Meat Hex', description: 'Fresh angus, caramelised onions, lettuce, house sauce, 100% mozzarella cheese', price: 8.49, category: 'wrap', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop', available: true },
      { name: 'The Crispy Bird Hex', description: 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, 100% mozzarella cheese', price: 7.49, category: 'wrap', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop', available: true },
      { name: 'The Grilled Bird Hex', description: 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, 100% mozzarella cheese, house sauce', price: 8.29, category: 'wrap', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop', available: true },
      // FRIES
      { name: 'Skin Fries - Regular', description: 'Crispy skin-on fries', price: 2.50, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Skin Fries - Large', description: 'Large portion of crispy skin-on fries', price: 3.00, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Piri Fries - Regular', description: 'Spicy peri-peri seasoned fries', price: 2.75, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Piri Fries - Large', description: 'Large portion of spicy peri-peri seasoned fries', price: 3.50, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Crispy Chicken Tenders - 3pc', description: '3 pieces of crispy chicken tenders', price: 4.99, category: 'fries', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', available: true },
      { name: 'Crispy Chicken Tenders - 6pc', description: '6 pieces of crispy chicken tenders', price: 6.99, category: 'fries', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', available: true },
      { name: 'Crispy Chicken Tenders - 9pc', description: '9 pieces of crispy chicken tenders', price: 8.99, category: 'fries', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', available: true },
      { name: 'Crispy Chicken Tenders - 12pc', description: '12 pieces of crispy chicken tenders', price: 11.99, category: 'fries', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', available: true },
      { name: 'Chargrilled Tenders - 3pc', description: '3 pieces of chargrilled chicken tenders', price: 5.99, category: 'fries', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop', available: true },
      { name: 'Chargrilled Tenders - 6pc', description: '6 pieces of chargrilled chicken tenders', price: 7.99, category: 'fries', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop', available: true },
      { name: 'Chargrilled Tenders - 9pc', description: '9 pieces of chargrilled chicken tenders', price: 9.99, category: 'fries', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop', available: true },
      { name: 'Chargrilled Tenders - 12pc', description: '12 pieces of chargrilled chicken tenders', price: 12.99, category: 'fries', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop', available: true },
      // LOADED FRIES
      { name: 'The Big Smash Up', description: 'Skin on fries, Fresh Angus, melted cheese, house sauce', price: 8.49, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'The Dirty Bird', description: 'Skin on fries, crispy chicken, melted cheese, house sauce', price: 7.00, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Chargrill Chicken Loaded Fries', description: 'Skin on fries, in-house marinated chargrilled chicken, melted cheese, house & peri sauce', price: 8.49, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      { name: 'Spicy Cheese Loaded Fries', description: 'Skin on fries, melted cheese, cheese sauce, house sauce, jalapeños', price: 5.00, category: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', available: true },
      // BOXES
      { name: 'The Classic Box', description: 'Choice burger (Angus Classic or The Crispy Bird), loaded fries topped with crispy chicken (add on £2.00 for Angus), 3 crispy chicken strips, can drink of choice, 2 dips', price: 12.99, category: 'burger', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', available: true },
      { name: 'The Buddy Box', description: 'Choice of 2 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 6 crispy chicken strips, can drink of choice, 2 dips', price: 17.99, category: 'burger', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', available: true },
      { name: 'The House Box', description: 'Choice of 4 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 12 crispy chicken strips, 4 cans, 8 dips', price: 35.00, category: 'burger', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', available: true },
      { name: 'The Char-Flame Box', description: 'Chargrilled Burger (make it a double £1.50), loaded chargrill fries, 3 chargrilled strips, can of choice, 2 dips', price: 13.99, category: 'burger', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', available: true },
      { name: 'The HexWrap Box', description: 'Choice of Hex Wrap, loaded fries with crispy chicken (add on Angus beef £2.00), 3 crispy chicken strips, can of choice, 2 dips', price: 13.99, category: 'wrap', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', available: true },
      // DRINKS
      { name: 'Ice Cola (330ml)', description: 'Refreshing ice cola', price: 1.50, category: 'drink', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', available: true },
      { name: 'Ice Pro Max Diet (330ml)', description: 'Diet cola drink', price: 1.50, category: 'drink', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', available: true },
      { name: 'Water (250ml/500ml)', description: 'Bottled water', price: 1.00, category: 'drink', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop', available: true },
      { name: 'Rubicon Mango', description: 'Mango flavored drink', price: 1.50, category: 'drink', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', available: true },
      { name: 'Rubicon Passion', description: 'Passion fruit flavored drink', price: 1.50, category: 'drink', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', available: true },
      { name: 'Ice Mojito', description: 'Mint mojito flavored drink', price: 1.50, category: 'drink', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', available: true },
      // DIPS
      { name: 'Signature Sauce', description: 'Our signature house sauce', price: 1.00, category: 'drink', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', available: true },
      { name: 'Garlic Mayo', description: 'Creamy garlic mayonnaise', price: 1.00, category: 'drink', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', available: true },
      { name: 'Chilli Sauce', description: 'Spicy chilli sauce', price: 1.00, category: 'drink', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', available: true },
      { name: 'Cheese Sauce', description: 'Creamy cheese sauce', price: 1.00, category: 'drink', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop', available: true },
    ]

    for (const item of menuItems) {
      await prisma.menuItem.create({ data: item })
    }
    console.log(`✅ Created ${menuItems.length} menu items`)

    // Verify data was created
    const verifyMenuItems = await prisma.menuItem.count()
    const verifyUsers = await prisma.user.count()
    
    console.log(`✅ Verification: ${verifyMenuItems} menu items, ${verifyUsers} users in database`)

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      details: {
        usersCreated: 2,
        menuItemsCreated: menuItems.length,
        verified: {
          menuItemsInDb: verifyMenuItems,
          usersInDb: verifyUsers,
        },
        testUsers: {
          admin: 'admin@meatbirdz.com / admin123',
          customer: 'customer@meatbirdz.com / customer123',
        },
      },
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: error.message },
      { status: 500 }
    )
  }
}

