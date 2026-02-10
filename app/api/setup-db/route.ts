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

    // Create menu items (from seed.ts)
    const menuItems = [
      // BURGERS
      { name: 'Angus Classic', description: '4oz (2 patties). Fresh Premium Angus, double cheese, lettuce, caramelised onions, gherkins, house sauce', price: 7.99, category: 'burger', available: true },
      { name: 'The Angus Three', description: '6oz (3 patties). Fresh Premium Angus, triple cheese, lettuce, caramelised onions, gherkins, house sauce', price: 8.99, category: 'burger', available: true },
      { name: 'The Holy Angus', description: '8oz (4 patties). Fresh Premium Angus, quadruple cheese, lettuce, caramelised onions, gherkins, house sauce', price: 9.99, category: 'burger', available: true },
      { name: 'The Crispy Bird', description: 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, cheese', price: 6.99, category: 'burger', available: true },
      { name: 'The Big Bird', description: 'Freshly prepared in-house marination. Double crispy chicken fillet, double cheese, lettuce, house sauce', price: 7.99, category: 'burger', available: true },
      { name: 'Traditional Cheese ¼ Pounder', description: 'Lettuce, single cheese, mayonnaise, house sauce', price: 5.50, category: 'burger', available: true },
      { name: 'Traditional Cheese ½ Pounder', description: 'Lettuce, double cheese, mayonnaise, house sauce', price: 6.00, category: 'burger', available: true },
      { name: 'The Grilled Bird', description: 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, house sauce', price: 7.50, category: 'burger', available: true },
      { name: 'The Double Grilled Bird', description: 'Freshly prepared in-house marination. Chargrilled chicken, double cheese, lettuce, house sauce', price: 8.50, category: 'burger', available: true },
      // WRAPS
      { name: 'The Meat Hex', description: 'Fresh angus, caramelised onions, lettuce, house sauce, 100% mozzarella cheese', price: 8.49, category: 'wrap', available: true },
      { name: 'The Crispy Bird Hex', description: 'Freshly prepared in-house marination. Crispy fried chicken, lettuce, house sauce, 100% mozzarella cheese', price: 7.49, category: 'wrap', available: true },
      { name: 'The Grilled Bird Hex', description: 'Freshly prepared in-house marination. Chargrilled chicken, cheese, lettuce, 100% mozzarella cheese, house sauce', price: 8.29, category: 'wrap', available: true },
      // FRIES
      { name: 'Skin Fries - Regular', description: 'Crispy skin-on fries', price: 2.50, category: 'fries', available: true },
      { name: 'Skin Fries - Large', description: 'Large portion of crispy skin-on fries', price: 3.00, category: 'fries', available: true },
      { name: 'Piri Fries - Regular', description: 'Spicy peri-peri seasoned fries', price: 2.75, category: 'fries', available: true },
      { name: 'Piri Fries - Large', description: 'Large portion of spicy peri-peri seasoned fries', price: 3.50, category: 'fries', available: true },
      { name: 'Crispy Chicken Tenders - 3pc', description: '3 pieces of crispy chicken tenders', price: 4.99, category: 'fries', available: true },
      { name: 'Crispy Chicken Tenders - 6pc', description: '6 pieces of crispy chicken tenders', price: 6.99, category: 'fries', available: true },
      { name: 'Crispy Chicken Tenders - 9pc', description: '9 pieces of crispy chicken tenders', price: 8.99, category: 'fries', available: true },
      { name: 'Crispy Chicken Tenders - 12pc', description: '12 pieces of crispy chicken tenders', price: 11.99, category: 'fries', available: true },
      { name: 'Chargrilled Tenders - 3pc', description: '3 pieces of chargrilled chicken tenders', price: 5.99, category: 'fries', available: true },
      { name: 'Chargrilled Tenders - 6pc', description: '6 pieces of chargrilled chicken tenders', price: 7.99, category: 'fries', available: true },
      { name: 'Chargrilled Tenders - 9pc', description: '9 pieces of chargrilled chicken tenders', price: 9.99, category: 'fries', available: true },
      { name: 'Chargrilled Tenders - 12pc', description: '12 pieces of chargrilled chicken tenders', price: 12.99, category: 'fries', available: true },
      // LOADED FRIES
      { name: 'The Big Smash Up', description: 'Skin on fries, Fresh Angus, melted cheese, house sauce', price: 8.49, category: 'fries', available: true },
      { name: 'The Dirty Bird', description: 'Skin on fries, crispy chicken, melted cheese, house sauce', price: 7.00, category: 'fries', available: true },
      { name: 'Chargrill Chicken Loaded Fries', description: 'Skin on fries, in-house marinated chargrilled chicken, melted cheese, house & peri sauce', price: 8.49, category: 'fries', available: true },
      { name: 'Spicy Cheese Loaded Fries', description: 'Skin on fries, melted cheese, cheese sauce, house sauce, jalapeños', price: 5.00, category: 'fries', available: true },
      // BOXES
      { name: 'The Classic Box', description: 'Choice burger (Angus Classic or The Crispy Bird), loaded fries topped with crispy chicken (add on £2.00 for Angus), 3 crispy chicken strips, can drink of choice, 2 dips', price: 12.99, category: 'burger', available: true },
      { name: 'The Buddy Box', description: 'Choice of 2 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 6 crispy chicken strips, can drink of choice, 2 dips', price: 17.99, category: 'burger', available: true },
      { name: 'The House Box', description: 'Choice of 4 burgers (Angus Classic or The Crispy Bird), loaded fries with crispy chicken (add on £2.00 for Angus), 12 crispy chicken strips, 4 cans, 8 dips', price: 35.00, category: 'burger', available: true },
      { name: 'The Char-Flame Box', description: 'Chargrilled Burger (make it a double £1.50), loaded chargrill fries, 3 chargrilled strips, can of choice, 2 dips', price: 13.99, category: 'burger', available: true },
      { name: 'The HexWrap Box', description: 'Choice of Hex Wrap, loaded fries with crispy chicken (add on Angus beef £2.00), 3 crispy chicken strips, can of choice, 2 dips', price: 13.99, category: 'wrap', available: true },
      // DRINKS
      { name: 'Ice Cola (330ml)', description: 'Refreshing ice cola', price: 1.50, category: 'drink', available: true },
      { name: 'Ice Pro Max Diet (330ml)', description: 'Diet cola drink', price: 1.50, category: 'drink', available: true },
      { name: 'Water (250ml/500ml)', description: 'Bottled water', price: 1.00, category: 'drink', available: true },
      { name: 'Rubicon Mango', description: 'Mango flavored drink', price: 1.50, category: 'drink', available: true },
      { name: 'Rubicon Passion', description: 'Passion fruit flavored drink', price: 1.50, category: 'drink', available: true },
      { name: 'Ice Mojito', description: 'Mint mojito flavored drink', price: 1.50, category: 'drink', available: true },
      // DIPS
      { name: 'Signature Sauce', description: 'Our signature house sauce', price: 1.00, category: 'drink', available: true },
      { name: 'Garlic Mayo', description: 'Creamy garlic mayonnaise', price: 1.00, category: 'drink', available: true },
      { name: 'Chilli Sauce', description: 'Spicy chilli sauce', price: 1.00, category: 'drink', available: true },
      { name: 'Cheese Sauce', description: 'Creamy cheese sauce', price: 1.00, category: 'drink', available: true },
    ]

    for (const item of menuItems) {
      await prisma.menuItem.create({ data: item })
    }
    console.log(`✅ Created ${menuItems.length} menu items`)

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      details: {
        usersCreated: 2,
        menuItemsCreated: menuItems.length,
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

